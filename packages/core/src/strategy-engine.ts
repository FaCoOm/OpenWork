/**
 * OpenWorks Evolutionary Strategy Engine
 *
 * Implements bounded, transparent multi-agent strategy population,
 * ticket scoring with explainable rationales, mutation operators,
 * and champion selection.
 */

import {
  AgentStrategy,
  StrategyWeights,
  Ticket,
  TicketEvaluation,
  TicketFeatures,
  Mandate,
  LineageRecord,
} from './types.js';

export class StrategyEngine {
  private population: AgentStrategy[];
  private currentGeneration: number;
  private lineageHistory: LineageRecord[] = [];

  constructor(initialPopulation?: AgentStrategy[]) {
    this.currentGeneration = 1;
    this.population = initialPopulation ? [...initialPopulation] : StrategyEngine.createDefaultPopulation();
  }

  /**
   * Generates standard initial population (1 Champion + 5 Shadow agents)
   * with distinct, transparent triage philosophies.
   */
  public static createDefaultPopulation(): AgentStrategy[] {
    const defaultAgents: Array<Omit<AgentStrategy, 'id'> & { id: string }> = [
      {
        id: 'agent-consensus-guardian',
        name: 'Consensus Guardian (Champion)',
        version: 'v1.0.0',
        generation: 1,
        isChampion: true,
        weights: {
          urgency: 0.35,
          breadthOfEffect: 0.20,
          publicBenefit: 0.15,
          feasibility: 0.15,
          evidenceConfidence: 0.15,
          proposedAmountRatio: 0.90,
        },
        mutationHistory: ['Initial genesis champion - prioritizes critical consensus bugs & evidence'],
      },
      {
        id: 'agent-public-goods-maximizer',
        name: 'Public Good Maximizer',
        version: 'v1.0.0',
        generation: 1,
        isChampion: false,
        weights: {
          urgency: 0.15,
          breadthOfEffect: 0.35,
          publicBenefit: 0.30,
          feasibility: 0.10,
          evidenceConfidence: 0.10,
          proposedAmountRatio: 0.85,
        },
        mutationHistory: ['Genesis shadow agent - prioritizes broad societal impact and reach'],
      },
      {
        id: 'agent-pragmatic-hunter',
        name: 'Pragmatic Hunter',
        version: 'v1.0.0',
        generation: 1,
        isChampion: false,
        weights: {
          urgency: 0.20,
          breadthOfEffect: 0.15,
          publicBenefit: 0.15,
          feasibility: 0.30,
          evidenceConfidence: 0.20,
          proposedAmountRatio: 0.70,
        },
        mutationHistory: ['Genesis shadow agent - prioritizes high feasibility and clean reproduction'],
      },
      {
        id: 'agent-deep-impact',
        name: 'Deep Impact',
        version: 'v1.0.0',
        generation: 1,
        isChampion: false,
        weights: {
          urgency: 0.30,
          breadthOfEffect: 0.30,
          publicBenefit: 0.20,
          feasibility: 0.10,
          evidenceConfidence: 0.10,
          proposedAmountRatio: 0.95,
        },
        mutationHistory: ['Genesis shadow agent - prioritizes wide blast-radius vulnerabilities'],
      },
      {
        id: 'agent-balanced-triage',
        name: 'Balanced Triage',
        version: 'v1.0.0',
        generation: 1,
        isChampion: false,
        weights: {
          urgency: 0.20,
          breadthOfEffect: 0.20,
          publicBenefit: 0.20,
          feasibility: 0.20,
          evidenceConfidence: 0.20,
          proposedAmountRatio: 0.75,
        },
        mutationHistory: ['Genesis shadow agent - equal weighting across all triage dimensions'],
      },
      {
        id: 'agent-rapid-turnaround',
        name: 'Rapid Turnaround',
        version: 'v1.0.0',
        generation: 1,
        isChampion: false,
        weights: {
          urgency: 0.25,
          breadthOfEffect: 0.10,
          publicBenefit: 0.15,
          feasibility: 0.35,
          evidenceConfidence: 0.15,
          proposedAmountRatio: 0.50,
        },
        mutationHistory: ['Genesis shadow agent - low bounty ratio, rapid completion bias'],
      },
    ];

    return defaultAgents.map((agent) => ({
      ...agent,
      weights: StrategyEngine.normalizeWeights(agent.weights),
    }));
  }

  /**
   * Normalizes the 5 core dimension weights to sum to exactly 1.0,
   * while constraining proposedAmountRatio to [0.1, 1.0].
   */
  public static normalizeWeights(weights: StrategyWeights): StrategyWeights {
    const rawSum =
      weights.urgency +
      weights.breadthOfEffect +
      weights.publicBenefit +
      weights.feasibility +
      weights.evidenceConfidence;

    const safeSum = rawSum > 0 ? rawSum : 1.0;

    return {
      urgency: Number((weights.urgency / safeSum).toFixed(4)),
      breadthOfEffect: Number((weights.breadthOfEffect / safeSum).toFixed(4)),
      publicBenefit: Number((weights.publicBenefit / safeSum).toFixed(4)),
      feasibility: Number((weights.feasibility / safeSum).toFixed(4)),
      evidenceConfidence: Number((weights.evidenceConfidence / safeSum).toFixed(4)),
      proposedAmountRatio: Math.min(1.0, Math.max(0.1, Number(weights.proposedAmountRatio.toFixed(3)))),
    };
  }

  /**
   * Extracts feature vector from a ticket, defaulting unsupplied dimensions to heuristic values.
   */
  public static extractFeatures(ticket: Ticket): TicketFeatures {
    if (ticket.features) {
      return {
        urgency: Math.min(1.0, Math.max(0.0, ticket.features.urgency)),
        breadthOfEffect: Math.min(1.0, Math.max(0.0, ticket.features.breadthOfEffect)),
        publicBenefit: Math.min(1.0, Math.max(0.0, ticket.features.publicBenefit)),
        feasibility: Math.min(1.0, Math.max(0.0, ticket.features.feasibility)),
        evidenceConfidence: Math.min(1.0, Math.max(0.0, ticket.features.evidenceConfidence)),
      };
    }

    // Heuristics if features not pre-computed:
    const hasEvidence = ticket.publicEvidence.length > 0;
    const hasConditions = ticket.acceptanceConditions.length > 0;

    return {
      urgency: 0.5,
      breadthOfEffect: 0.4,
      publicBenefit: 0.5,
      feasibility: hasConditions ? 0.7 : 0.3,
      evidenceConfidence: hasEvidence ? 0.75 : 0.25,
    };
  }

  /**
   * Scores a single ticket according to an agent's strategy weights and generates
   * transparent, inspectable rationales.
   */
  public static evaluateTicket(agent: AgentStrategy, ticket: Ticket, mandate: Mandate): TicketEvaluation {
    const features = StrategyEngine.extractFeatures(ticket);
    const w = agent.weights;

    const urgencyScore = w.urgency * features.urgency;
    const breadthScore = w.breadthOfEffect * features.breadthOfEffect;
    const publicBenefitScore = w.publicBenefit * features.publicBenefit;
    const feasibilityScore = w.feasibility * features.feasibility;
    const evidenceScore = w.evidenceConfidence * features.evidenceConfidence;

    const totalScore = Number(
      (urgencyScore + breadthScore + publicBenefitScore + feasibilityScore + evidenceScore).toFixed(4)
    );

    // Calculate proposed bounty based on total score and proposed amount ratio
    // Minimum proposed bounty is 5% of max bounty if score > 0, capped at maxBountyPerTicket
    let rawProposed = Math.round(mandate.maxBountyPerTicket * w.proposedAmountRatio * totalScore);
    if (totalScore > 0.1 && rawProposed < mandate.maxBountyPerTicket * 0.1) {
      rawProposed = Math.round(mandate.maxBountyPerTicket * 0.1);
    }
    const proposedBounty = Math.min(mandate.maxBountyPerTicket, Math.max(0, rawProposed));

    // Transparent, explainable rationales
    const rationales: string[] = [
      `Urgency [${features.urgency.toFixed(2)}] x Weight (${w.urgency.toFixed(2)}) = ${urgencyScore.toFixed(3)}: ${
        features.urgency >= 0.8
          ? 'Critical failure affecting network operations'
          : features.urgency >= 0.5
          ? 'Standard bug affecting active users'
          : 'Low-priority enhancement or maintenance'
      }`,
      `Breadth [${features.breadthOfEffect.toFixed(2)}] x Weight (${w.breadthOfEffect.toFixed(2)}) = ${breadthScore.toFixed(3)}: ${
        features.breadthOfEffect >= 0.7
          ? 'Cross-subsystem scope across entire protocol layer'
          : features.breadthOfEffect >= 0.4
          ? 'Confined to specific component module'
          : 'Isolated minor utility scope'
      }`,
      `Public Benefit [${features.publicBenefit.toFixed(2)}] x Weight (${w.publicBenefit.toFixed(2)}) = ${publicBenefitScore.toFixed(3)}: ${
        features.publicBenefit >= 0.7
          ? 'Substantial public goods value for ecosystem security'
          : 'Moderate benefit to repository maintainers and developers'
      }`,
      `Feasibility [${features.feasibility.toFixed(2)}] x Weight (${w.feasibility.toFixed(2)}) = ${feasibilityScore.toFixed(3)}: ${
        features.feasibility >= 0.7
          ? 'Well-scoped task with verifiable acceptance conditions'
          : 'Complex or ambiguous implementation path'
      }`,
      `Evidence Confidence [${features.evidenceConfidence.toFixed(2)}] x Weight (${w.evidenceConfidence.toFixed(2)}) = ${evidenceScore.toFixed(3)}: ${
        features.evidenceConfidence >= 0.7
          ? 'Robust reproduction steps, telemetry, or logs attached'
          : features.evidenceConfidence >= 0.4
          ? 'Sufficient evidence provided; human check recommended'
          : 'Incomplete evidence or unverified assertions'
      }`,
      `Composite score ${totalScore.toFixed(3)} -> Proposed bounty of ${proposedBounty} tokens (${(
        (proposedBounty / mandate.maxBountyPerTicket) *
        100
      ).toFixed(1)}% of ${mandate.maxBountyPerTicket} cap, factor ${w.proposedAmountRatio.toFixed(2)}).`,
    ];

    return {
      ticketId: ticket.id,
      agentId: agent.id,
      scores: {
        urgency: Number(urgencyScore.toFixed(4)),
        breadthOfEffect: Number(breadthScore.toFixed(4)),
        publicBenefit: Number(publicBenefitScore.toFixed(4)),
        feasibility: Number(feasibilityScore.toFixed(4)),
        evidenceConfidence: Number(evidenceScore.toFixed(4)),
        totalScore,
      },
      proposedBounty,
      rationales,
    };
  }

  public evaluateTicket(agent: AgentStrategy, ticket: Ticket, mandate: Mandate): TicketEvaluation {
    return StrategyEngine.evaluateTicket(agent, ticket, mandate);
  }

  /**
   * Ranks an array of tickets for a specific agent, descending by totalScore.
   */
  public rankTickets(agentId: string, tickets: Ticket[], mandate: Mandate): TicketEvaluation[] {
    const agent = this.population.find((a) => a.id === agentId);
    if (!agent) {
      throw new Error(`Agent with ID '${agentId}' not found in current population.`);
    }

    const evaluations = tickets.map((t) => this.evaluateTicket(agent, t, mandate));
    return evaluations.sort((a, b) => b.scores.totalScore - a.scores.totalScore);
  }

  /**
   * Evaluates all agents in the population against an array of tickets.
   */
  public evaluateAllAgents(tickets: Ticket[], mandate: Mandate): Map<string, TicketEvaluation[]> {
    const results = new Map<string, TicketEvaluation[]>();
    for (const agent of this.population) {
      results.set(agent.id, this.rankTickets(agent.id, tickets, mandate));
    }
    return results;
  }

  /**
   * Mutates 1 or 2 strategy weights of an agent by a bounded delta (+/- 0.05 to 0.15).
   * Normalizes weights to keep them valid and sum to 1.0.
   */
  public static mutateStrategy(agent: AgentStrategy, nextGeneration: number = (agent.generation || 1) + 1): AgentStrategy {
    const dimensionKeys: Array<keyof Omit<StrategyWeights, 'proposedAmountRatio'>> = [
      'urgency',
      'breadthOfEffect',
      'publicBenefit',
      'feasibility',
      'evidenceConfidence',
    ];

    const mutatedWeights: StrategyWeights = { ...agent.weights };
    const numMutations = Math.random() < 0.5 ? 1 : 2;
    const historyEntries: string[] = [];

    // Unbiased Fisher-Yates (Knuth) shuffle to pick keys to mutate
    const shuffled = [...dimensionKeys];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = shuffled[i];
      shuffled[i] = shuffled[j];
      shuffled[j] = temp;
    }
    const selectedKeys = shuffled.slice(0, numMutations);

    for (const key of selectedKeys) {
      // Delta between 0.05 and 0.15, randomly positive or negative
      const magnitude = 0.05 + Math.random() * 0.10;
      const direction = Math.random() < 0.5 ? -1 : 1;
      const delta = direction * magnitude;
      const oldValue = mutatedWeights[key];
      mutatedWeights[key] = Math.max(0.05, oldValue + delta);
      historyEntries.push(`Mutated ${key} from ${oldValue.toFixed(3)} by ${delta > 0 ? '+' : ''}${delta.toFixed(3)}`);
    }

    // Occasionally mutate proposedAmountRatio (30% chance)
    if (Math.random() < 0.3) {
      const ratioDelta = (Math.random() * 0.16) - 0.08;
      const oldRatio = mutatedWeights.proposedAmountRatio;
      mutatedWeights.proposedAmountRatio = Math.min(1.0, Math.max(0.2, oldRatio + ratioDelta));
      historyEntries.push(`Mutated proposedAmountRatio by ${ratioDelta > 0 ? '+' : ''}${ratioDelta.toFixed(3)}`);
    }

    const normalized = StrategyEngine.normalizeWeights(mutatedWeights);
    const newVersion = `v${nextGeneration}.${Math.floor(Math.random() * 10)}`;

    return {
      id: `${agent.id}-gen${nextGeneration}`,
      name: agent.name.replace(/\(Champion\)/g, '').trim(),
      version: newVersion,
      generation: nextGeneration,
      weights: normalized,
      isChampion: false,
      parentId: agent.id,
      mutationHistory: [
        ...(agent.mutationHistory ?? []),
        `[Gen ${nextGeneration}] ${historyEntries.join('; ')}`,
      ],
    };
  }

  /**
   * Promotes the agent with highest fitness to Champion, mutates shadow agents,
   * bumps generation, and updates evolutionary lineage.
   */
  public advanceGeneration(fitnessScores: Map<string, number>): {
    newChampion: AgentStrategy;
    generation: number;
    lineageRecord: LineageRecord;
  } {
    this.currentGeneration += 1;
    const nextGen = this.currentGeneration;

    // Identify candidate with highest fitness
    let bestAgent = this.population[0];
    let highestFitness = -Infinity;

    for (const agent of this.population) {
      const score = fitnessScores.get(agent.id) ?? -1;
      if (score > highestFitness) {
        highestFitness = score;
        bestAgent = agent;
      }
    }

    // New Champion inherits best traits
    const champion: AgentStrategy = {
      ...bestAgent,
      id: bestAgent.id.startsWith('agent-') ? bestAgent.id : `agent-${bestAgent.id}`,
      name: `${bestAgent.name.replace(/\(Champion\)/g, '').trim()} (Champion)`,
      isChampion: true,
      generation: nextGen,
      version: `v${nextGen}.0`,
    };

    // New shadow population: champion + mutated variations of top performers
    const sortedPopulation = [...this.population].sort((a, b) => {
      const scoreA = fitnessScores.get(a.id) ?? 0;
      const scoreB = fitnessScores.get(b.id) ?? 0;
      return scoreB - scoreA;
    });

    const newPopulation: AgentStrategy[] = [champion];

    // Mutate the top performers to create the new shadow generation
    for (let i = 0; i < this.population.length - 1; i++) {
      const parent = sortedPopulation[i % sortedPopulation.length];
      const mutated = StrategyEngine.mutateStrategy(parent, nextGen);
      newPopulation.push(mutated);
    }

    this.population = newPopulation;

    const lineageRecord: LineageRecord = {
      generation: nextGen,
      agentId: champion.id,
      agentName: champion.name,
      version: champion.version,
      isChampion: true,
      overallFitness: Number(highestFitness.toFixed(4)),
      weights: { ...champion.weights },
      parentAgentId: bestAgent.parentId ?? bestAgent.id,
      mutationsApplied: champion.mutationHistory,
      evaluatedAt: Date.now(),
    };

    this.lineageHistory.push(lineageRecord);

    return {
      newChampion: champion,
      generation: nextGen,
      lineageRecord,
    };
  }

  public getPopulation(): AgentStrategy[] {
    return [...this.population];
  }

  public getChampion(): AgentStrategy {
    const champ = this.population.find((a) => a.isChampion);
    return champ ?? this.population[0];
  }

  public getCurrentGeneration(): number {
    return this.currentGeneration;
  }

  public getLineage(): LineageRecord[] {
    return [...this.lineageHistory];
  }
}
