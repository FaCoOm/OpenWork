/**
 * Demo Data & Replay Benchmarks
 *
 * Provides calibrated test tickets, demo mandate, treasury states,
 * and 12 labelled historical replay cases split across training and holdout sets.
 */

import { Mandate, Ticket, ReplayCase, TreasuryState } from './types.js';

export const DEMO_MANDATE: Mandate = {
  cause: 'Decentralized Infrastructure Resilience & Consensus Security',
  approvedRepos: [
    'openwork/core-consensus',
    'openwork/p2p-transport',
    'ethereum/consensus-specs',
  ],
  maxBountyPerTicket: 2500, // 2500 tokens
  maxSpendPerRound: 5000,   // 5000 tokens per round
  minUncommittedReserve: 1000, // 1000 tokens min reserve
  expiry: 1798761600, // Year 2027 timestamp (or ~1.79e9 seconds)
  isPaused: false,
  stewardAddress: '0x1111111111111111111111111111111111111111',
};

export const DEMO_TREASURY_STATE: TreasuryState = {
  balance: 10000,
  committed: 1500,
  roundSpend: 1200,
  fundedTicketIds: ['ticket-legacy-prefunded-001'],
};

/**
 * 3 Differentiated Demo Tickets matching Brief Section 7:
 */
export const DEMO_TICKETS: Ticket[] = [
  // Ticket 1: Urgent / High-Impact (Consensus Race Condition)
  {
    id: 'ticket-consensus-race-001',
    repo: 'openwork/core-consensus',
    title: 'P2P State Synchronization Race Condition under Network Partition Reconnect',
    sourceUrl: 'https://github.com/openwork/core-consensus/issues/104',
    affectedComponent: 'consensus/p2p-sync',
    observedFailure:
      'Under 250ms simulated network partition reconnect, validator nodes disagree on finality state due to non-atomic lock handoff in SyncBuffer, resulting in stall.',
    acceptanceConditions: [
      'Implement atomic mutex handoff in SyncBuffer state machine during peer reconnection',
      'Add deterministic integration test partition_reconnect_spec with 50 iterations showing 0 stalls',
      'Zero regressions on benchmark throughput test bench_sync_throughput',
    ],
    publicEvidence: [
      'https://github.com/openwork/core-consensus/actions/runs/88921102',
      'https://gist.github.com/openwork-ci/reproduce-partition-race.log',
      'commit:a9f24e10c73e89b41829e1208fb012e847c12345',
    ],
    reportedAt: 1727318400,
    isEligible: true,
    maintainerApproved: true,
    features: {
      urgency: 0.95,
      breadthOfEffect: 0.90,
      publicBenefit: 0.92,
      feasibility: 0.85,
      evidenceConfidence: 0.90,
    },
  },

  // Ticket 2: Routine / Moderate / Low Urgency (Documentation & Cleanup)
  {
    id: 'ticket-docs-cleanup-002',
    repo: 'openwork/core-consensus',
    title: 'Fix typos in crypto helper docstrings and update CLI README flag examples',
    sourceUrl: 'https://github.com/openwork/core-consensus/issues/108',
    affectedComponent: 'docs/crypto-helpers',
    observedFailure:
      'Several docstrings in crypto/bls_helpers.ts reference deprecated flags (--legacy-secp) and contain grammatical typos.',
    acceptanceConditions: [
      'Correct misspelled parameters in crypto/bls_helpers.ts docstrings',
      'Update root README and CLI examples to reflect latest flags',
      'Pass linter and typecheck without warning',
    ],
    publicEvidence: [
      'https://github.com/openwork/core-consensus/blob/main/crypto/bls_helpers.ts#L42',
    ],
    reportedAt: 1727322000,
    isEligible: true,
    maintainerApproved: true,
    features: {
      urgency: 0.15,
      breadthOfEffect: 0.20,
      publicBenefit: 0.30,
      feasibility: 0.95,
      evidenceConfidence: 0.85,
    },
  },

  // Ticket 3: High Urgency claim, but Unclear Evidence / Malformed reproduction
  {
    id: 'ticket-unverified-crash-003',
    repo: 'openwork/core-consensus',
    title: 'CRITICAL: Validator daemon crashes randomly on mainnet sync',
    sourceUrl: 'https://github.com/openwork/core-consensus/issues/112',
    affectedComponent: 'runtime/daemon',
    observedFailure:
      'My node stopped yesterday twice. I think it crashed when syncing blocks. Fix ASAP!',
    acceptanceConditions: [
      'Make validator stable without crashing',
    ],
    publicEvidence: [], // No reproduction logs, no crash dumps, no config provided
    reportedAt: 1727325600,
    isEligible: true,
    maintainerApproved: true, // Maintainer flagged it, but evidence is missing
    features: {
      urgency: 0.80,
      breadthOfEffect: 0.70,
      publicBenefit: 0.60,
      feasibility: 0.30,
      evidenceConfidence: 0.25, // Below automated pass threshold!
    },
  },
];

/**
 * 12 Labelled Historical Replay Cases with Training / Holdout split.
 */
export const REPLAY_CORPUS: ReplayCase[] = [
  // --- Training Set (8 cases) ---
  {
    ticket: {
      id: 'hist-001',
      repo: 'openwork/core-consensus',
      title: 'Mempool memory exhaustion during high transaction spam',
      sourceUrl: 'https://github.com/openwork/core-consensus/issues/45',
      affectedComponent: 'mempool/eviction',
      observedFailure: 'OOM panic when incoming tx queue exceeds 50,000 unverified items',
      acceptanceConditions: ['Implement bounded ring buffer with fee-based eviction'],
      publicEvidence: ['https://gist.github.com/openwork-ci/oom-trace.txt'],
      reportedAt: 1715000000,
      isEligible: true,
      maintainerApproved: true,
      features: { urgency: 0.90, breadthOfEffect: 0.85, publicBenefit: 0.88, feasibility: 0.80, evidenceConfidence: 0.90 },
    },
    groundTruthUrgency: 0.92,
    groundTruthImpact: 0.88,
    resolutionOutcome: 'ACCEPTED',
    holdout: false,
  },
  {
    ticket: {
      id: 'hist-002',
      repo: 'openwork/p2p-transport',
      title: 'Deadlock in peer handshake when connection resets during TLS exchange',
      sourceUrl: 'https://github.com/openwork/p2p-transport/issues/12',
      affectedComponent: 'transport/tls',
      observedFailure: 'Worker goroutine permanently hangs waiting on unbuffered channel',
      acceptanceConditions: ['Wrap TLS handshake in timeout context and release channel lock'],
      publicEvidence: ['https://gist.github.com/openwork-ci/deadlock-dump.txt'],
      reportedAt: 1715100000,
      isEligible: true,
      maintainerApproved: true,
      features: { urgency: 0.88, breadthOfEffect: 0.80, publicBenefit: 0.85, feasibility: 0.85, evidenceConfidence: 0.85 },
    },
    groundTruthUrgency: 0.85,
    groundTruthImpact: 0.82,
    resolutionOutcome: 'ACCEPTED',
    holdout: false,
  },
  {
    ticket: {
      id: 'hist-003',
      repo: 'openwork/core-consensus',
      title: 'Typo in error message when signature verification fails',
      sourceUrl: 'https://github.com/openwork/core-consensus/issues/48',
      affectedComponent: 'crypto/verify',
      observedFailure: 'Misspelled "invalidd signature" in debug log',
      acceptanceConditions: ['Fix spelling error in verify.go line 112'],
      publicEvidence: ['https://github.com/openwork/core-consensus/blob/main/verify.go#L112'],
      reportedAt: 1715200000,
      isEligible: true,
      maintainerApproved: true,
      features: { urgency: 0.10, breadthOfEffect: 0.15, publicBenefit: 0.20, feasibility: 0.98, evidenceConfidence: 0.95 },
    },
    groundTruthUrgency: 0.12,
    groundTruthImpact: 0.15,
    resolutionOutcome: 'ACCEPTED',
    holdout: false,
  },
  {
    ticket: {
      id: 'hist-004',
      repo: 'openwork/core-consensus',
      title: 'Rewrite consensus engine in Rust for 10x hypothetical speedup',
      sourceUrl: 'https://github.com/openwork/core-consensus/issues/50',
      affectedComponent: 'engine/full',
      observedFailure: 'Vague suggestion with no architectural benchmarks or plan',
      acceptanceConditions: ['Rewrite entire engine in Rust'],
      publicEvidence: [],
      reportedAt: 1715300000,
      isEligible: true,
      maintainerApproved: false,
      features: { urgency: 0.30, breadthOfEffect: 0.90, publicBenefit: 0.40, feasibility: 0.10, evidenceConfidence: 0.15 },
    },
    groundTruthUrgency: 0.20,
    groundTruthImpact: 0.10,
    resolutionOutcome: 'ABANDONED',
    holdout: false,
  },
  {
    ticket: {
      id: 'hist-005',
      repo: 'openwork/p2p-transport',
      title: 'Off-by-one error in NAT hole punching port mapping retry counter',
      sourceUrl: 'https://github.com/openwork/p2p-transport/issues/19',
      affectedComponent: 'nat/upnp',
      observedFailure: 'Clients behind symmetric NAT give up after 2 attempts instead of 3',
      acceptanceConditions: ['Change <= loop bound and add unit test for max retries'],
      publicEvidence: ['https://gist.github.com/openwork-ci/nat-retry-test.txt'],
      reportedAt: 1715400000,
      isEligible: true,
      maintainerApproved: true,
      features: { urgency: 0.60, breadthOfEffect: 0.50, publicBenefit: 0.60, feasibility: 0.90, evidenceConfidence: 0.85 },
    },
    groundTruthUrgency: 0.58,
    groundTruthImpact: 0.62,
    resolutionOutcome: 'ACCEPTED',
    holdout: false,
  },
  {
    ticket: {
      id: 'hist-006',
      repo: 'ethereum/consensus-specs',
      title: 'Ambiguous spec wording on slashable attestation boundary condition',
      sourceUrl: 'https://github.com/ethereum/consensus-specs/issues/310',
      affectedComponent: 'specs/slashing',
      observedFailure: 'Different client teams interpret target epoch boundary differently',
      acceptanceConditions: ['Clarify normative text and update executable python test generator'],
      publicEvidence: ['https://github.com/ethereum/consensus-specs/pull/311'],
      reportedAt: 1715500000,
      isEligible: true,
      maintainerApproved: true,
      features: { urgency: 0.85, breadthOfEffect: 0.95, publicBenefit: 0.95, feasibility: 0.75, evidenceConfidence: 0.88 },
    },
    groundTruthUrgency: 0.88,
    groundTruthImpact: 0.94,
    resolutionOutcome: 'ACCEPTED',
    holdout: false,
  },
  {
    ticket: {
      id: 'hist-007',
      repo: 'openwork/core-consensus',
      title: 'Unbounded memory leak in telemetry websocket server',
      sourceUrl: 'https://github.com/openwork/core-consensus/issues/63',
      affectedComponent: 'telemetry/ws',
      observedFailure: 'Slow memory growth of 200MB/day when dashboard connects continuously',
      acceptanceConditions: ['Release closed websocket client pointers from connection pool'],
      publicEvidence: ['https://gist.github.com/openwork-ci/pprof-leak.png'],
      reportedAt: 1715600000,
      isEligible: true,
      maintainerApproved: true,
      features: { urgency: 0.75, breadthOfEffect: 0.40, publicBenefit: 0.60, feasibility: 0.80, evidenceConfidence: 0.80 },
    },
    groundTruthUrgency: 0.70,
    groundTruthImpact: 0.65,
    resolutionOutcome: 'ACCEPTED',
    holdout: false,
  },
  {
    ticket: {
      id: 'hist-008',
      repo: 'openwork/core-consensus',
      title: 'Fix build warning on experimental gcc-14 flag',
      sourceUrl: 'https://github.com/openwork/core-consensus/issues/71',
      affectedComponent: 'build/cmake',
      observedFailure: 'Compiler emits unused-parameter warning on stub struct',
      acceptanceConditions: ['Add (void) parameter cast or [[maybe_unused]]'],
      publicEvidence: ['https://gist.github.com/openwork-ci/gcc14-log.txt'],
      reportedAt: 1715700000,
      isEligible: true,
      maintainerApproved: true,
      features: { urgency: 0.25, breadthOfEffect: 0.20, publicBenefit: 0.25, feasibility: 0.95, evidenceConfidence: 0.90 },
    },
    groundTruthUrgency: 0.20,
    groundTruthImpact: 0.25,
    resolutionOutcome: 'ACCEPTED',
    holdout: false,
  },

  // --- Holdout Validation Set (4 cases) ---
  {
    ticket: {
      id: 'holdout-001',
      repo: 'openwork/core-consensus',
      title: 'Silent state root discrepancy between archiver node and validator',
      sourceUrl: 'https://github.com/openwork/core-consensus/issues/88',
      affectedComponent: 'storage/trie',
      observedFailure: 'Archiver node prunes trie nodes prematurely resulting in state root mismatch at block height 4,000,000',
      acceptanceConditions: [
        'Prevent trie pruning on nodes configured with --archive flag',
        'Verify block 4,000,000 replay matches canonical state root',
      ],
      publicEvidence: [
        'https://gist.github.com/openwork-ci/stateroot-diff.txt',
        'https://github.com/openwork/core-consensus/actions/runs/991823',
      ],
      reportedAt: 1716000000,
      isEligible: true,
      maintainerApproved: true,
      features: { urgency: 0.92, breadthOfEffect: 0.88, publicBenefit: 0.90, feasibility: 0.82, evidenceConfidence: 0.92 },
    },
    groundTruthUrgency: 0.94,
    groundTruthImpact: 0.90,
    resolutionOutcome: 'ACCEPTED',
    holdout: true,
  },
  {
    ticket: {
      id: 'holdout-002',
      repo: 'openwork/p2p-transport',
      title: 'Unbounded channel buffer in peer gossip router causes memory blowup',
      sourceUrl: 'https://github.com/openwork/p2p-transport/issues/32',
      affectedComponent: 'router/gossip',
      observedFailure: 'Channel blocks when downstream subscriber is slow, dropping valid attestations',
      acceptanceConditions: ['Replace unbounded queue with leaky bucket rate limiter and backpressure'],
      publicEvidence: ['https://gist.github.com/openwork-ci/gossip-trace.txt'],
      reportedAt: 1716100000,
      isEligible: true,
      maintainerApproved: true,
      features: { urgency: 0.86, breadthOfEffect: 0.82, publicBenefit: 0.85, feasibility: 0.80, evidenceConfidence: 0.88 },
    },
    groundTruthUrgency: 0.85,
    groundTruthImpact: 0.84,
    resolutionOutcome: 'ACCEPTED',
    holdout: true,
  },
  {
    ticket: {
      id: 'holdout-003',
      repo: 'openwork/core-consensus',
      title: 'Update copyright year in LICENSE file from 2025 to 2026',
      sourceUrl: 'https://github.com/openwork/core-consensus/issues/94',
      affectedComponent: 'legal/license',
      observedFailure: 'LICENSE header still states 2025',
      acceptanceConditions: ['Update year in LICENSE file'],
      publicEvidence: ['https://github.com/openwork/core-consensus/blob/main/LICENSE'],
      reportedAt: 1716200000,
      isEligible: true,
      maintainerApproved: true,
      features: { urgency: 0.10, breadthOfEffect: 0.10, publicBenefit: 0.15, feasibility: 1.0, evidenceConfidence: 1.0 },
    },
    groundTruthUrgency: 0.08,
    groundTruthImpact: 0.10,
    resolutionOutcome: 'ACCEPTED',
    holdout: true,
  },
  {
    ticket: {
      id: 'holdout-004',
      repo: 'openwork/p2p-transport',
      title: 'Speculative quantum encryption layer proposal',
      sourceUrl: 'https://github.com/openwork/p2p-transport/issues/40',
      affectedComponent: 'crypto/post-quantum',
      observedFailure: 'Proposal with no clear specification, prototype, or benchmark',
      acceptanceConditions: ['Implement post-quantum crypto'],
      publicEvidence: [],
      reportedAt: 1716300000,
      isEligible: true,
      maintainerApproved: false,
      features: { urgency: 0.40, breadthOfEffect: 0.80, publicBenefit: 0.30, feasibility: 0.15, evidenceConfidence: 0.20 },
    },
    groundTruthUrgency: 0.25,
    groundTruthImpact: 0.15,
    resolutionOutcome: 'FAILED',
    holdout: true,
  },
];
