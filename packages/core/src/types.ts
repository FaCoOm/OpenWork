/**
 * OpenWorks Core Domain Types
 * Based on OpenWorks Project Brief & Architecture Specifications
 */

/**
 * Mandate defines the steward's bounded funding parameters.
 * Mandate parameters do NOT evolve with the agents.
 */
export interface Mandate {
  cause: string;
  approvedRepos: string[];
  maxBountyPerTicket: number;
  maxSpendPerRound: number;
  minUncommittedReserve: number;
  expiry: number; // Unix timestamp in seconds or milliseconds
  isPaused: boolean;
  stewardAddress: string;
}

/**
 * Ticket represents an intake issue from an approved open-source repository.
 */
export interface Ticket {
  id: string;
  repo: string;
  title: string;
  sourceUrl: string;
  affectedComponent: string;
  observedFailure: string;
  acceptanceConditions: string[];
  publicEvidence: string[];
  reportedAt: number; // Unix timestamp
  isEligible: boolean;
  maintainerApproved: boolean;
  /**
   * Optional normalized feature vector (0.0 - 1.0) derived from intake analysis.
   * If not explicitly supplied, defaults are derived by the parser or evaluator.
   */
  features?: TicketFeatures;
}

/**
 * Normalized feature vector representing intrinsic properties of a ticket.
 */
export interface TicketFeatures {
  urgency: number; // 0.0 - 1.0: severity of defect / time criticality
  breadthOfEffect: number; // 0.0 - 1.0: subsystem reach / affected user base
  publicBenefit: number; // 0.0 - 1.0: public good value if resolved
  feasibility: number; // 0.0 - 1.0: tractability of implementation & verification
  evidenceConfidence: number; // 0.0 - 1.0: completeness and reproducibility of reported proof
}

/**
 * Agent Strategy weights representing an evolutionary agent's triage philosophy.
 */
export interface StrategyWeights {
  urgency: number;
  breadthOfEffect: number;
  publicBenefit: number;
  feasibility: number;
  evidenceConfidence: number;
  proposedAmountRatio: number; // Multiplier of max bounty to propose for highest scoring ticket
}

/**
 * AgentStrategy defines a candidate funding agent in the OpenWorks population.
 */
export interface AgentStrategy {
  id: string;
  name: string;
  version: string;
  generation: number;
  weights: StrategyWeights;
  isChampion: boolean;
  parentId?: string;
  mutationHistory?: string[];
}

/**
 * TicketEvaluation captures an agent's scored assessment of a ticket with explainable rationales.
 */
export interface TicketEvaluation {
  ticketId: string;
  agentId: string;
  scores: {
    urgency: number;
    breadthOfEffect: number;
    publicBenefit: number;
    feasibility: number;
    evidenceConfidence: number;
    totalScore: number;
  };
  proposedBounty: number;
  rationales: string[];
}

/**
 * RuleCheckResult records the deterministic outcome of a single policy rule.
 */
export interface RuleCheckResult {
  rule: string;
  passed: boolean;
  message: string;
}

/**
 * Status verdict emitted by the Policy Engine.
 */
export type PolicyVerdictStatus = 'ELIGIBLE' | 'REVIEW_REQUIRED' | 'BLOCKED';

/**
 * Complete verdict and audit trail for a ticket and bounty proposal.
 */
export interface PolicyVerdict {
  status: PolicyVerdictStatus;
  reasons: string[];
  ruleCheckResults: RuleCheckResult[];
  recommendedAction: string;
}

/**
 * Snapshot of treasury balances and commitments used for policy verification.
 */
export interface TreasuryState {
  balance: number;
  committed: number;
  roundSpend: number;
  fundedTicketIds: string[];
}

/**
 * Labelled historical case used for replay benchmarking and holdout validation.
 */
export interface ReplayCase {
  ticket: Ticket;
  groundTruthUrgency: number;
  groundTruthImpact: number;
  resolutionOutcome: 'ACCEPTED' | 'FAILED' | 'ABANDONED';
  holdout: boolean;
}

/**
 * Fitness metrics for an agent strategy evaluated against replay corpus.
 */
export interface StrategyFitness {
  agentId: string;
  meanAbsoluteError: number;
  resolutionSuccessRate: number;
  budgetEfficiency: number;
  penaltyScore: number;
  overallFitness: number;
}

/**
 * Historical lineage entry tracking evolutionary progress.
 */
export interface LineageRecord {
  generation: number;
  agentId: string;
  agentName: string;
  version: string;
  isChampion: boolean;
  overallFitness: number;
  weights: StrategyWeights;
  parentAgentId?: string;
  mutationsApplied?: string[];
  evaluatedAt: number;
}
