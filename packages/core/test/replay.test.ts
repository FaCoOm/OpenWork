import { describe, it, expect } from 'vitest';
import { ReplayEvaluator } from '../src/replay-evaluator.js';
import { StrategyEngine } from '../src/strategy-engine.js';
import { DEMO_MANDATE, REPLAY_CORPUS } from '../src/demo-data.js';

describe('Replay Evaluator & Holdout Benchmark', () => {
  it('correctly separates replay corpus into training and holdout sets', () => {
    const { training, holdout } = ReplayEvaluator.splitCorpus(REPLAY_CORPUS);

    expect(training.length).toBeGreaterThanOrEqual(8);
    expect(holdout.length).toBeGreaterThanOrEqual(4);
    expect(training.every((c) => !c.holdout)).toBe(true);
    expect(holdout.every((c) => c.holdout)).toBe(true);
    expect(training.length + holdout.length).toBe(REPLAY_CORPUS.length);
  });

  it('computes StrategyFitness metrics with MAE, resolution success, and budget efficiency', () => {
    const engine = new StrategyEngine();
    const evaluator = new ReplayEvaluator(engine);
    const champion = engine.getChampion();

    const fitness = evaluator.evaluateStrategy(champion, REPLAY_CORPUS, DEMO_MANDATE);

    expect(fitness.agentId).toBe(champion.id);
    expect(fitness.meanAbsoluteError).toBeGreaterThanOrEqual(0);
    expect(fitness.meanAbsoluteError).toBeLessThan(1.0);
    expect(fitness.resolutionSuccessRate).toBeGreaterThan(0.5);
    expect(fitness.budgetEfficiency).toBeGreaterThan(0.5);
    expect(fitness.penaltyScore).toBeGreaterThanOrEqual(0);
    expect(fitness.overallFitness).toBeGreaterThan(0.4);
    expect(fitness.overallFitness).toBeLessThanOrEqual(1.0);
  });

  it('penalizes aggressive overconfidence on failed or abandoned tasks', () => {
    const engine = new StrategyEngine();
    const evaluator = new ReplayEvaluator(engine);

    // Create an reckless agent that heavily overvalues everything
    const recklessAgent = {
      id: 'agent-reckless',
      name: 'Reckless Spender',
      version: 'v0.0.1',
      generation: 1,
      isChampion: false,
      weights: {
        urgency: 0.20,
        breadthOfEffect: 0.20,
        publicBenefit: 0.20,
        feasibility: 0.20,
        evidenceConfidence: 0.20,
        proposedAmountRatio: 1.0, // Maximum spending
      },
    };

    // Conservative cautious agent
    const cautiousAgent = {
      id: 'agent-cautious',
      name: 'Cautious Triage',
      version: 'v0.0.1',
      generation: 1,
      isChampion: false,
      weights: {
        urgency: 0.15,
        breadthOfEffect: 0.15,
        publicBenefit: 0.15,
        feasibility: 0.25,
        evidenceConfidence: 0.30,
        proposedAmountRatio: 0.40,
      },
    };

    // Filter to only failed/abandoned cases
    const failedCases = REPLAY_CORPUS.filter((c) => c.resolutionOutcome !== 'ACCEPTED');
    expect(failedCases.length).toBeGreaterThan(0);

    const recklessFitness = evaluator.evaluateStrategy(recklessAgent, failedCases, DEMO_MANDATE);
    const cautiousFitness = evaluator.evaluateStrategy(cautiousAgent, failedCases, DEMO_MANDATE);

    // Reckless agent must incur a higher penalty score
    expect(recklessFitness.penaltyScore).toBeGreaterThan(cautiousFitness.penaltyScore);
  });

  it('runs honest benchmark reporting training vs holdout performance and generalization gaps', () => {
    const engine = new StrategyEngine();
    const evaluator = new ReplayEvaluator(engine);
    const population = engine.getPopulation();

    const report = evaluator.runHonestBenchmark(population, REPLAY_CORPUS, DEMO_MANDATE);

    expect(report.trainingFitness.size).toBe(population.length);
    expect(report.holdoutFitness.size).toBe(population.length);
    expect(report.bestTrainingAgentId).toBeDefined();
    expect(report.bestHoldoutAgentId).toBeDefined();
    expect(report.generalizationGaps.size).toBe(population.length);

    for (const [id, gap] of report.generalizationGaps.entries()) {
      const train = report.trainingFitness.get(id)?.overallFitness!;
      const hold = report.holdoutFitness.get(id)?.overallFitness!;
      expect(Number((hold - train).toFixed(4))).toBe(gap);
    }
  });
});
