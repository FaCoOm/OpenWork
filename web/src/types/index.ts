export type VerdictStatus = 'ELIGIBLE' | 'REVIEW_REQUIRED' | 'BLOCKED';

export interface RuleCheckResult {
  rule: string;
  passed: boolean;
  message: string;
}

export interface PolicyVerdict {
  status: VerdictStatus;
  reasons: string[];
  ruleCheckResults: RuleCheckResult[];
  recommendedAction: string;
}

export interface Mandate {
  cause: string;
  approvedRepos: string[];
  maxBountyPerTicket: number;
  maxSpendPerRound: number;
  minUncommittedReserve: number;
  expiryTimestamp: number;
  isPaused: boolean;
  stewardAddress: string;
}

export interface Ticket {
  id: string;
  repo: string;
  title: string;
  sourceUrl: string;
  affectedComponent: string;
  observedFailure: string;
  acceptanceConditions: string[];
  publicEvidence: string[];
  reportedAt: string;
  isEligible: boolean;
  maintainerApproved: boolean;
  status: 'OPEN' | 'RESERVED' | 'PR_SUBMITTED' | 'ACCEPTED' | 'PAID' | 'REJECTED' | 'EXPIRED';
  prUrl?: string;
  payeeAddress?: string;
  reservedBounty?: number;
  txHash?: string;
  verdict?: PolicyVerdict;
}

export interface AgentStrategy {
  id: string;
  name: string;
  version: string;
  generation: number;
  weights: {
    urgency: number;
    breadthOfEffect: number;
    publicBenefit: number;
    feasibility: number;
    evidenceConfidence: number;
    proposedAmountRatio: number;
  };
  isChampion: boolean;
  fitnessScore?: number;
}

export interface TicketEvaluation {
  ticketId: string;
  agentId: string;
  agentName: string;
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

export interface ReplayCase {
  id: string;
  title: string;
  repo: string;
  groundTruthUrgency: number;
  groundTruthImpact: number;
  resolutionOutcome: 'ACCEPTED' | 'FAILED' | 'ABANDONED';
  holdout: boolean;
  notes: string;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  stage: 'INTAKE' | 'RANKING' | 'VERDICT' | 'RESERVATION' | 'SUBMISSION' | 'MAINTAINER_ACCEPTANCE' | 'SETTLEMENT' | 'REJECTION';
  ticketId: string;
  title: string;
  actor: string;
  details: string;
  evidenceRef?: string;
  txHash?: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
}
