/**
 * Replay Evaluator & Holdout Benchmark
 *
 * Evaluates strategy populations against historical replay cases,
 * separating training vs holdout sets. Penalizes overconfident predictions
 * on failed tasks while rewarding alignment with ground truth and budget efficiency.
 */

import {
  AgentStrategy,
  Mandate,
  ReplayCase,
  StrategyFitness,
} from './types.js';
import { StrategyEngine } from './strategy-engine.js';

export interface BenchmarkReport {
  trainingFitness: Map<string, StrategyFitness>;
  holdoutFitness: Map<string, StrategyFitness>;
  bestTrainingAgentId: string;
  bestHoldoutAgentId: string;
  generalizationGaps: Map<string, number>; // holdoutFitness - trainingFitness
}

export class ReplayEvaluator {
  private engine: StrategyEngine;

  constructor(engine?: StrategyEngine) {
    this.engine = engine ?? new StrategyEngine();
  }

  /**
   * Splits a replay corpus into Training and Holdout validation sets.
   */
  public static splitCorpus(corpus: ReplayCase[]): {
    training: ReplayCase[];
    holdout: ReplayCase[];
  } {
    const training = corpus.filter((c) => !c.holdout);
    const holdout = corpus.filter((c) => c.holdout);
    return { training, holdout };
  }

  /**
   * Evaluates a single agent strategy against a set of replay cases.
   */
  public evaluateStrategy(
    agent: AgentStrategy,
    cases: ReplayCase[],
    mandate: Mandate
  ): StrategyFitness {
    if (cases.length === 0) {
      return {
        agentId: agent.id,
        meanAbsoluteError: 0,
        resolutionSuccessRate: 1,
        budgetEfficiency: 1,
        penaltyScore: 0,
        overallFitness: 1,
      };
    }

    let absoluteErrorSum = 0;
    let correctDecisions = 0;
    let successfulSpend = 0;
    let totalProposedSpend = 0;
    let totalPenalty = 0;

    for (const testCase of cases) {
      const evaluation = this.engine.evaluateTicket(agent, testCase.ticket, mandate);
      const predictedScore = evaluation.scores.totalScore;
      const proposedBounty = evaluation.proposedBounty;

      // Ground truth composite: weighted 50% urgency + 50% impact
      const groundTruthComposite = Number(
        (0.5 * testCase.groundTruthUrgency + 0.5 * testCase.groundTruthImpact).toFixed(4)
      );

      // 1. Mean Absolute Error
      const error = Math.abs(predictedScore - groundTruthComposite);
      absoluteErrorSum += error;

      totalProposedSpend += proposedBounty;

      // 2. Resolution Success & Outcome Alignment
      if (testCase.resolutionOutcome === 'ACCEPTED') {
        successfulSpend += proposedBounty;
        // Reward high scores on accepted work
        if (predictedScore >= 0.45) {
          correctDecisions += 1;
        }
      } else {
        // Outcome is FAILED or ABANDONED
        // Reward low scores on tasks that failed or were abandoned
        if (predictedScore < 0.40) {
          correctDecisions += 1;
        }
        // Overconfidence penalty: heavily penalize proposing bounties and assigning high scores
        // to tasks that ended in failure or abandonment
        if (proposedBounty > 0) {
          const penalty = (proposedBounty / mandate.maxBountyPerTicket) * Math.max(0.2, predictedScore) * 0.8;
          totalPenalty += penalty;
        }
      }
    }

    const n = cases.length;
    const meanAbsoluteError = Number((absoluteErrorSum / n).toFixed(4));
    const resolutionSuccessRate = Number((correctDecisions / n).toFixed(4));
    const budgetEfficiency = Number(
      (totalProposedSpend > 0 ? successfulSpend / totalProposedSpend : 0.5).toFixed(4)
    );
    const penaltyScore = Number((totalPenalty / n).toFixed(4));

    // Overall fitness formula:
    // 40% accuracy (1 - MAE) + 30% resolution success + 30% budget efficiency - penalty
    const rawFitness =
      (1 - Math.min(1.0, meanAbsoluteError)) * 0.40 +
      resolutionSuccessRate * 0.30 +
      budgetEfficiency * 0.30 -
      penaltyScore;

    const overallFitness = Number(Math.max(0.01, Math.min(1.0, rawFitness)).toFixed(4));

    return {
      agentId: agent.id,
      meanAbsoluteError,
      resolutionSuccessRate,
      budgetEfficiency,
      penaltyScore,
      overallFitness,
    };
  }

  /**
   * Evaluates an entire population across replay cases.
   */
  public evaluatePopulation(
    population: AgentStrategy[],
    cases: ReplayCase[],
    mandate: Mandate
  ): Map<string, StrategyFitness> {
    const fitnessMap = new Map<string, StrategyFitness>();
    for (const agent of population) {
      fitnessMap.set(agent.id, this.evaluateStrategy(agent, cases, mandate));
    }
    return fitnessMap;
  }

  /**
   * Runs an honest benchmark separating Training vs Holdout sets.
   * Prevents overfitting and demonstrates transparent generalization gaps.
   */
  public runHonestBenchmark(
    population: AgentStrategy[],
    corpus: ReplayCase[],
    mandate: Mandate
  ): BenchmarkReport {
    const { training, holdout } = ReplayEvaluator.splitCorpus(corpus);

    const trainingFitness = this.evaluatePopulation(population, training, mandate);
    const holdoutFitness = this.evaluatePopulation(population, holdout, mandate);

    let bestTrainingAgentId = population[0].id;
    let maxTrainingScore = -Infinity;
    for (const [id, fit] of trainingFitness.entries()) {
      if (fit.overallFitness > maxTrainingScore) {
        maxTrainingScore = fit.overallFitness;
        bestTrainingAgentId = id;
      }
    }

    let bestHoldoutAgentId = population[0].id;
    let maxHoldoutScore = -Infinity;
    for (const [id, fit] of holdoutFitness.entries()) {
      if (fit.overallFitness > maxHoldoutScore) {
        maxHoldoutScore = fit.overallFitness;
        bestHoldoutAgentId = id;
      }
    }

    const generalizationGaps = new Map<string, number>();
    for (const agent of population) {
      const train = trainingFitness.get(agent.id)?.overallFitness ?? 0;
      const hold = holdoutFitness.get(agent.id)?.overallFitness ?? 0;
      generalizationGaps.set(agent.id, Number((hold - train).toFixed(4)));
    }

    return {
      trainingFitness,
      holdoutFitness,
      bestTrainingAgentId,
      bestHoldoutAgentId,
      generalizationGaps,
    };
  }
}
