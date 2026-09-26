# OpenWorks Core Package Specification (`@openwork/core`)

**Date:** 26 September 2026  
**Status:** Implemented & Verified (100% Test Coverage)  
**Package Path:** `packages/core`

---

## 1. Overview & Architecture

The `@openwork/core` package provides the deterministic policy checks, evolutionary multi-agent strategy population, historical replay evaluation, and ticket parsing logic for the OpenWorks platform.

```
packages/core/
├── src/
│   ├── types.ts                # Strongly-typed domain models & state definitions
│   ├── policy-engine.ts        # OpenWorks Deterministic Policy Engine (9 unskippable rules)
│   ├── strategy-engine.ts      # Evolutionary Strategy Engine & Population
│   ├── replay-evaluator.ts     # Replay Benchmarking & Training/Holdout Evaluator
│   ├── intake-parser.ts        # GitHub issue markdown parser & feature extractor
│   ├── jev-ai-service.ts       # Semantic triage & feature extraction
│   ├── demo-data.ts            # Section 7 3-ticket demo set & 12-case replay corpus
│   └── index.ts                # Package entrypoint & barrel export
├── test/
│   ├── policy-engine.test.ts   # 11 unit tests covering all deterministic verdicts
│   ├── strategy-engine.test.ts # 6 unit tests covering ranking, scoring & mutation
│   ├── replay.test.ts          # 4 unit tests covering benchmark & overconfidence penalty
│   ├── intake.test.ts          # 2 unit tests covering markdown parsing & feature heuristics
│   └── jev-ai.test.ts          # 3 unit tests covering Jev AI integration & fallbacks
├── tsconfig.json               # NodeNext, ES2022, strict mode, declaration emit
└── package.json                # vitest, typescript, node typings
```

---

## 2. Core Domain Types (`src/types.ts`)

- **`Mandate`**: Represents steward-configured boundaries that **cannot** evolve with agents:
  `cause`, `approvedRepos`, `maxBountyPerTicket`, `maxSpendPerRound`, `minUncommittedReserve`, `expiry`, `isPaused`, `stewardAddress`.
- **`Ticket`**: Verifiable open-source issue:
  `id`, `repo`, `title`, `sourceUrl`, `affectedComponent`, `observedFailure`, `acceptanceConditions`, `publicEvidence`, `reportedAt`, `isEligible`, `maintainerApproved`, `features`.
- **`AgentStrategy`**: Population candidate with transparent weights:
  `id`, `name`, `version`, `generation`, `weights: { urgency, breadthOfEffect, publicBenefit, feasibility, evidenceConfidence, proposedAmountRatio }`, `isChampion`.
- **`TicketEvaluation`**: Agent triage output:
  `ticketId`, `agentId`, `scores: { urgency, breadthOfEffect, publicBenefit, feasibility, evidenceConfidence, totalScore }`, `proposedBounty`, `rationales`.
- **`PolicyVerdict`**: Deterministic verification result:
  `status: 'ELIGIBLE' | 'REVIEW_REQUIRED' | 'BLOCKED'`, `reasons`, `ruleCheckResults: { rule, passed, message }[]`, `recommendedAction`.
- **`ReplayCase`**: Historical ground-truth case:
  `ticket`, `groundTruthUrgency`, `groundTruthImpact`, `resolutionOutcome: 'ACCEPTED' | 'FAILED' | 'ABANDONED'`, `holdout: boolean`.
- **`StrategyFitness`**: Multi-dimensional fitness metric:
  `agentId`, `meanAbsoluteError`, `resolutionSuccessRate`, `budgetEfficiency`, `penaltyScore`, `overallFitness`.

---

## 3. Deterministic Policy Engine (`src/policy-engine.ts`)

The deterministic policy engine enforces 9 rules that LLMs / candidate agents **cannot waive**:

1. **Rule 1 (`RULE_1_APPROVED_REPO`)**: Repository must exist in `mandate.approvedRepos`.
2. **Rule 2 (`RULE_2_NO_DUPLICATE_FUNDING`)**: Ticket must not exist in `treasuryState.fundedTicketIds`.
3. **Rule 3 (`RULE_3_MAX_BOUNTY_PER_TICKET`)**: Proposed bounty must be $> 0$ and $\le \text{mandate.maxBountyPerTicket}$.
4. **Rule 4 (`RULE_4_MAX_SPEND_PER_ROUND`)**: $\text{Proposed Bounty} + \text{Current Round Spend} \le \text{mandate.maxSpendPerRound}$.
5. **Rule 5 (`RULE_5_MIN_UNCOMMITTED_RESERVE`)**: $\text{Treasury Balance} - (\text{Committed} + \text{Proposed}) \ge \text{mandate.minUncommittedReserve}$.
6. **Rule 6 (`RULE_6_MANDATE_ACTIVE_AND_VALID`)**: `mandate.isPaused === false` and $\text{timestamp} \le \text{mandate.expiry}$.
7. **Rule 7 (`RULE_7_MAINTAINER_OPT_IN`)**: Ticket must have `isEligible: true` and `maintainerApproved: true`.
8. **Rule 8 (`RULE_8_ACCEPTANCE_CONDITIONS_VALID`)**: Acceptance conditions must contain at least 1 non-empty criteria string.
9. **Rule 9 (`RULE_9_EVIDENCE_CONFIDENCE_THRESHOLD`)**:
   - If $\text{confidence} < 0.20$ or missing evidence during active failure: `BLOCKED`.
   - If $0.20 \le \text{confidence} < 0.40$: `REVIEW_REQUIRED`.
   - If $\text{confidence} \ge 0.40$: passes check.

---

## 4. Evolutionary Strategy Engine (`src/strategy-engine.ts`)

- **Population**: 1 Champion + 5 Shadow Agents initialized with distinct triage philosophies:
  - *Consensus Guardian (Champion)*: Critical consensus bug & high evidence focus.
  - *Public Good Maximizer*: High public benefit and broad reach.
  - *Pragmatic Hunter*: High feasibility and reproducible test cases.
  - *Deep Impact*: Wide blast-radius system vulnerabilities.
  - *Balanced Triage*: Equal weighting across all 5 dimensions.
  - *Rapid Turnaround*: High feasibility and quick turnaround with lower bounty ratio.
- **Normalization**: Enforces $\sum_{i=1}^5 w_i = 1.0$, and keeps $w_{\text{proposedRatio}} \in [0.10, 1.00]$.
- **Rationales**: Transparently outputs step-by-step arithmetic rationales for each evaluated dimension.
- **Mutation Operator**: Mutates 1 or 2 dimensions by bounded delta $\pm [0.05, 0.15]$, re-normalizes weights, and increments generation/version.
- **Champion Selection**: Highest fitness candidate across the historical replay corpus is promoted to Champion for live funding.

---

## 5. Replay Evaluator & Holdout Benchmark (`src/replay-evaluator.ts`)

- **Dataset Split**: Strictly splits replay corpus into Training and Holdout subsets to prevent overfitting.
- **Fitness Formula**:
  $$\text{Fitness} = 0.40 \times (1 - \text{MAE}) + 0.30 \times \text{ResolutionSuccess} + 0.30 \times \text{BudgetEfficiency} - \text{Penalty}$$
- **Overconfidence Penalty**: Penalizes proposing bounties and assigning high scores to tasks that ended in `FAILED` or `ABANDONED`.
- **Honest Generalization Gap**: Compares holdout fitness vs training fitness across all population agents to verify generalization.

---

## 6. Demonstration Tickets & Replay Corpus (`src/demo-data.ts`)

- **Ticket 1 (`ticket-consensus-race-001`)**: High urgency (0.95), high breadth (0.90), high public benefit (0.92), 3 verified acceptance conditions, CI logs and reproduction trace.
- **Ticket 2 (`ticket-docs-cleanup-002`)**: Low urgency (0.15), low breadth (0.20), routine maintenance task.
- **Ticket 3 (`ticket-unverified-crash-003`)**: High claimed urgency (0.80) but evidence confidence is 0.25 (no reproduction steps/logs) -> Triggers `REVIEW_REQUIRED` / `BLOCKED`.
- **Replay Corpus**: 12 labelled historical cases with ground truth urgency, ground truth impact, and verified outcomes (`ACCEPTED`, `FAILED`, `ABANDONED`).

---

## 7. Verification Results

All 26 unit tests pass across 5 test suites:
- `test/intake.test.ts`: 2/2 passed
- `test/replay.test.ts`: 4/4 passed
- `test/strategy-engine.test.ts`: 6/6 passed
- `test/policy-engine.test.ts`: 11/11 passed
- `test/jev-ai.test.ts`: 3/3 passed
TypeScript compilation (`tsc`) compiles cleanly to `packages/core/dist` with full `.d.ts` declaration maps.
