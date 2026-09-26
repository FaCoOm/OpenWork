import { Mandate, Ticket, AgentStrategy, ReplayCase, TimelineEvent } from '../types';

export const INITIAL_MANDATE: Mandate = {
  cause: "Open-Source P2P Consensus Security & Infrastructure Resilience",
  approvedRepos: ["openwork-protocol/consensus-p2p"],
  maxBountyPerTicket: 500,
  maxSpendPerRound: 2000,
  minUncommittedReserve: 2500,
  expiryTimestamp: Math.floor(Date.now() / 1000) + 86400 * 30, // 30 days
  isPaused: false,
  stewardAddress: "0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE",
};

export const INITIAL_TICKETS: Ticket[] = [
  {
    id: "OW-TICKET-101",
    repo: "openwork-protocol/consensus-p2p",
    title: "Critical peer isolation deadlock during gossip propagation under network partition",
    sourceUrl: "https://github.com/openwork-protocol/consensus-p2p/issues/101",
    affectedComponent: "p2p/gossip_sub.go",
    observedFailure: "Validator nodes drop out of active consensus quorum when 3+ simultaneous peer resets occur during slot changeover, resulting in an unrecoverable 12-second block stall.",
    acceptanceConditions: [
      "Deterministic test harness reproducing 3+ dropped peers during round switch with 0 goroutine leaks",
      "Adaptive peer backoff algorithm restores gossip connectivity in < 800ms",
      "Full consensus fuzz-test passing 100 iterations under 30% simulated packet loss"
    ],
    publicEvidence: [
      "https://github.com/openwork-protocol/consensus-p2p/issues/101#issuecomment-98231",
      "https://artifacts.openwork.net/p2p-deadlock-repro.log"
    ],
    reportedAt: "2026-09-24T10:15:00Z",
    isEligible: true,
    maintainerApproved: true,
    status: 'OPEN',
  },
  {
    id: "OW-TICKET-102",
    repo: "openwork-protocol/consensus-p2p",
    title: "Fix documentation typo and clean up outdated comments in math helper utilities",
    sourceUrl: "https://github.com/openwork-protocol/consensus-p2p/issues/102",
    affectedComponent: "common/math_utils.go",
    observedFailure: "Spelling error in exported comment line 42 ('addres' instead of 'address') and deprecated v1 reference.",
    acceptanceConditions: [
      "Correct spelling of 'address' and remove deprecated reference",
      "Existing unit tests in common/math_utils_test.go pass"
    ],
    publicEvidence: [
      "https://github.com/openwork-protocol/consensus-p2p/issues/102"
    ],
    reportedAt: "2026-09-25T14:30:00Z",
    isEligible: true,
    maintainerApproved: true,
    status: 'OPEN',
  },
  {
    id: "OW-TICKET-103",
    repo: "openwork-protocol/consensus-p2p",
    title: "Occasional crash during heavy RPC stress test with missing reproduction steps",
    sourceUrl: "https://github.com/openwork-protocol/consensus-p2p/issues/103",
    affectedComponent: "rpc/server.go",
    observedFailure: "Reporter claims server stopped responding during benchmarking. No core dump, stack trace, or environment details provided.",
    acceptanceConditions: [],
    publicEvidence: [],
    reportedAt: "2026-09-25T19:00:00Z",
    isEligible: false,
    maintainerApproved: false,
    status: 'OPEN',
  }
];

export const INITIAL_AGENTS: AgentStrategy[] = [
  {
    id: "ow-champ-v2",
    name: "OpenWorks Champion (Balanced Impact)",
    version: "2.1.0",
    generation: 4,
    weights: {
      urgency: 0.35,
      breadthOfEffect: 0.25,
      publicBenefit: 0.20,
      feasibility: 0.10,
      evidenceConfidence: 0.10,
      proposedAmountRatio: 0.90,
    },
    isChampion: true,
    fitnessScore: 0.912,
  },
  {
    id: "ow-shadow-urgency",
    name: "Shadow Agent (Urgency Prioritizer)",
    version: "1.9.4",
    generation: 3,
    weights: {
      urgency: 0.55,
      breadthOfEffect: 0.15,
      publicBenefit: 0.10,
      feasibility: 0.10,
      evidenceConfidence: 0.10,
      proposedAmountRatio: 0.95,
    },
    isChampion: false,
    fitnessScore: 0.841,
  },
  {
    id: "ow-shadow-evidence",
    name: "Shadow Agent (High-Assurance / Evidence First)",
    version: "1.8.2",
    generation: 3,
    weights: {
      urgency: 0.20,
      breadthOfEffect: 0.15,
      publicBenefit: 0.15,
      feasibility: 0.25,
      evidenceConfidence: 0.25,
      proposedAmountRatio: 0.75,
    },
    isChampion: false,
    fitnessScore: 0.865,
  },
  {
    id: "ow-shadow-broad",
    name: "Shadow Agent (Broad Public Benefit)",
    version: "2.0.1",
    generation: 4,
    weights: {
      urgency: 0.20,
      breadthOfEffect: 0.40,
      publicBenefit: 0.25,
      feasibility: 0.10,
      evidenceConfidence: 0.05,
      proposedAmountRatio: 0.85,
    },
    isChampion: false,
    fitnessScore: 0.829,
  }
];

export const HISTORICAL_REPLAY: ReplayCase[] = [
  {
    id: "HIST-01",
    title: "Mempool memory exhaustion during fee spike",
    repo: "openwork-protocol/consensus-p2p",
    groundTruthUrgency: 0.92,
    groundTruthImpact: 0.88,
    resolutionOutcome: "ACCEPTED",
    holdout: false,
    notes: "Critical fix merged; stopped validator out-of-memory aborts.",
  },
  {
    id: "HIST-02",
    title: "Spelling corrections in CLI usage flags",
    repo: "openwork-protocol/consensus-p2p",
    groundTruthUrgency: 0.08,
    groundTruthImpact: 0.05,
    resolutionOutcome: "ACCEPTED",
    holdout: false,
    notes: "Trivial cosmetic PR; maintainer approved without urgent need.",
  },
  {
    id: "HIST-03",
    title: "Unverified panic report with broken GitHub attachment",
    repo: "openwork-protocol/consensus-p2p",
    groundTruthUrgency: 0.70,
    groundTruthImpact: 0.40,
    resolutionOutcome: "ABANDONED",
    holdout: false,
    notes: "Closed as unreproducible after 14 days of contributor silence.",
  },
  {
    id: "HIST-04",
    title: "Zero-copy buffer allocation in wire message encoder",
    repo: "openwork-protocol/consensus-p2p",
    groundTruthUrgency: 0.65,
    groundTruthImpact: 0.75,
    resolutionOutcome: "ACCEPTED",
    holdout: false,
    notes: "34% throughput boost under heavy transaction load.",
  },
  {
    id: "HIST-05",
    title: "Flaky integration test in CI for arm64 runners",
    repo: "openwork-protocol/consensus-p2p",
    groundTruthUrgency: 0.45,
    groundTruthImpact: 0.50,
    resolutionOutcome: "ACCEPTED",
    holdout: false,
    notes: "Stabilized build pipeline for secondary architectures.",
  },
  // Holdout cases (Strictly held out from strategy selection)
  {
    id: "HIST-HOLDOUT-01",
    title: "Remote denial of service via malformed handshake frame",
    repo: "openwork-protocol/consensus-p2p",
    groundTruthUrgency: 0.98,
    groundTruthImpact: 0.95,
    resolutionOutcome: "ACCEPTED",
    holdout: true,
    notes: "Holdout case: High urgency, high public benefit. Champion correctly funded at max cap.",
  },
  {
    id: "HIST-HOLDOUT-02",
    title: "Vague report requesting full rewrite in alternative language",
    repo: "openwork-protocol/consensus-p2p",
    groundTruthUrgency: 0.10,
    groundTruthImpact: 0.05,
    resolutionOutcome: "FAILED",
    holdout: true,
    notes: "Holdout case: Agent penalization test. Overconfident shadow agents penalized for funding.",
  },
  {
    id: "HIST-HOLDOUT-03",
    title: "State trie pruning memory leak under continuous sync",
    repo: "openwork-protocol/consensus-p2p",
    groundTruthUrgency: 0.85,
    groundTruthImpact: 0.89,
    resolutionOutcome: "ACCEPTED",
    holdout: true,
    notes: "Holdout case: Verified fix delivered cleanly within bounty terms.",
  }
];

export const INITIAL_TIMELINE: TimelineEvent[] = [
  {
    id: "evt-01",
    timestamp: "2026-09-26T02:00:00Z",
    stage: "INTAKE",
    ticketId: "OW-TICKET-101",
    title: "Ticket Ingested & Parsed",
    actor: "OpenWorks Intake Service",
    details: "Ingested issue #101 from approved repository openwork-protocol/consensus-p2p. Extracted 3 acceptance conditions.",
    evidenceRef: "https://github.com/openwork-protocol/consensus-p2p/issues/101",
    status: "SUCCESS"
  },
  {
    id: "evt-02",
    timestamp: "2026-09-26T02:05:00Z",
    stage: "INTAKE",
    ticketId: "OW-TICKET-101",
    title: "Maintainer Opt-in Confirmed",
    actor: "Maintainer (0x72a...8b9)",
    details: "Maintainer confirmed ticket eligibility and validated acceptance criteria.",
    status: "SUCCESS"
  }
];
