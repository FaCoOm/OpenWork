import { describe, it, expect } from 'vitest';
import { StrategyEngine } from '../src/strategy-engine.js';
import { DEMO_MANDATE, DEMO_TICKETS } from '../src/demo-data.js';

describe('OpenWorks Evolutionary Strategy Engine', () => {
  it('initializes default population with 1 Champion and multiple Shadow agents', () => {
    const engine = new StrategyEngine();
    const population = engine.getPopulation();

    expect(population.length).toBeGreaterThanOrEqual(5);

    const champions = population.filter((a) => a.isChampion);
    expect(champions.length).toBe(1);
    expect(champions[0].name).toContain('Champion');
    expect(engine.getChampion().id).toBe(champions[0].id);
  });

  it('normalizes strategy weights so the 5 core triage dimensions sum to 1.0', () => {
    const rawWeights = {
      urgency: 40,
      breadthOfEffect: 20,
      publicBenefit: 20,
      feasibility: 10,
      evidenceConfidence: 10,
      proposedAmountRatio: 0.85,
    };

    const normalized = StrategyEngine.normalizeWeights(rawWeights);
    const sum =
      normalized.urgency +
      normalized.breadthOfEffect +
      normalized.publicBenefit +
      normalized.feasibility +
      normalized.evidenceConfidence;

    expect(Math.abs(sum - 1.0)).toBeLessThan(0.005);
    expect(normalized.proposedAmountRatio).toBe(0.85);
  });

  it('correctly scores tickets and produces transparent, inspectable rationales', () => {
    const engine = new StrategyEngine();
    const champion = engine.getChampion();
    const urgentTicket = DEMO_TICKETS[0]; // Consensus race condition

    const evalResult = engine.evaluateTicket(champion, urgentTicket, DEMO_MANDATE);

    expect(evalResult.ticketId).toBe(urgentTicket.id);
    expect(evalResult.agentId).toBe(champion.id);
    expect(evalResult.scores.totalScore).toBeGreaterThan(0.5);
    expect(evalResult.proposedBounty).toBeGreaterThan(0);
    expect(evalResult.proposedBounty).toBeLessThanOrEqual(DEMO_MANDATE.maxBountyPerTicket);

    // Rationales should contain explanations for each dimension
    expect(evalResult.rationales.length).toBeGreaterThanOrEqual(5);
    expect(evalResult.rationales.some((r) => r.includes('Urgency'))).toBe(true);
    expect(evalResult.rationales.some((r) => r.includes('Breadth'))).toBe(true);
    expect(evalResult.rationales.some((r) => r.includes('Public Benefit'))).toBe(true);
    expect(evalResult.rationales.some((r) => r.includes('Feasibility'))).toBe(true);
    expect(evalResult.rationales.some((r) => r.includes('Evidence Confidence'))).toBe(true);
  });

  it('ranks urgent consensus ticket above routine documentation cleanup ticket', () => {
    const engine = new StrategyEngine();
    const champion = engine.getChampion();

    const ranked = engine.rankTickets(champion.id, DEMO_TICKETS, DEMO_MANDATE);

    expect(ranked.length).toBe(DEMO_TICKETS.length);
    // Ticket 1 (Consensus race condition) must be ranked #1
    expect(ranked[0].ticketId).toBe('ticket-consensus-race-001');
    // Ticket 2 (Docs typo) has low urgency/impact and should have significantly lower score
    const docsEval = ranked.find((e) => e.ticketId === 'ticket-docs-cleanup-002');
    expect(docsEval?.scores.totalScore).toBeLessThan(ranked[0].scores.totalScore);
  });

  it('mutation operator alters 1-2 weights by bounded delta and maintains valid normalization', () => {
    const engine = new StrategyEngine();
    const agent = engine.getPopulation()[1]; // A shadow agent

    const mutated = StrategyEngine.mutateStrategy(agent, 2);

    expect(mutated.generation).toBe(2);
    expect(mutated.parentId).toBe(agent.id);
    expect(mutated.isChampion).toBe(false);
    expect(mutated.mutationHistory?.length).toBeGreaterThan(0);

    const sum =
      mutated.weights.urgency +
      mutated.weights.breadthOfEffect +
      mutated.weights.publicBenefit +
      mutated.weights.feasibility +
      mutated.weights.evidenceConfidence;

    expect(Math.abs(sum - 1.0)).toBeLessThan(0.005);
    expect(mutated.weights.proposedAmountRatio).toBeGreaterThanOrEqual(0.1);
    expect(mutated.weights.proposedAmountRatio).toBeLessThanOrEqual(1.0);
  });

  it('promotes the highest-fitness agent to Champion in the next generation', () => {
    const engine = new StrategyEngine();
    const population = engine.getPopulation();

    // Fabricate fitness scores favoring a specific shadow agent
    const favoredShadowAgent = population.find((a) => !a.isChampion)!;
    const fitnessScores = new Map<string, number>();

    for (const a of population) {
      fitnessScores.set(a.id, 0.50);
    }
    fitnessScores.set(favoredShadowAgent.id, 0.95); // Outstanding score

    const { newChampion, generation, lineageRecord } = engine.advanceGeneration(fitnessScores);

    expect(generation).toBe(2);
    expect(newChampion.isChampion).toBe(true);
    expect(newChampion.name).toContain('Champion');
    expect(lineageRecord.overallFitness).toBe(0.95);
    expect(lineageRecord.generation).toBe(2);

    // Verify current population champion matches
    const currentChampion = engine.getChampion();
    expect(currentChampion.isChampion).toBe(true);
    expect(engine.getLineage().length).toBe(1);
  });
});
