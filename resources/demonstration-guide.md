# OpenWorks — Demonstration & Showcase Guide

## Overview

This guide details the operation, live demonstration script, and testing instructions for **OpenWorks**, a public-goods grant and bounty allocator built for the Sydney AI x Web3 Hackathon according to `OpenWorks-Project-Brief.md`.

---

## 1. Quickstart Commands

```bash
# 1. Run all smart contract tests (24 tests)
npm run test:contracts

# 2. Run all core agent & policy engine tests (26 tests)
npm run test:core

# 3. Run all test suites across the monorepo (50 tests)
npm run test:all

# 4. Run the interactive end-to-end smart contract settlement simulation
npm run demo:simulate

# 5. Launch the Web UI & 3-Minute Showcase portal
npm run dev:web
# -> Open http://localhost:3000 in your browser
```

---

## 2. Three-Minute Hackathon Narrative Script (Brief Section 7)

OpenWorks includes a guided controller directly on the homepage (`/`) that executes the verbatim 3-minute showcase sequence:

### **0:00–0:30: Cause, Mandate & 3 Competing Tickets**
- **Action**: Navigate to `/` or click Phase 1.
- **Proof Shown**:
  - Steward's fixed mandate: Cause = *"Open-Source P2P Consensus Security & Infrastructure Resilience"*.
  - Approved repository list: `openwork-protocol/consensus-p2p`.
  - Treasury parameters: Total pool: 10,000 tHSK, max bounty: 500 tHSK, minimum uncommitted reserve floor: 2,500 tHSK.
  - 3 candidate tickets:
    1. `OW-TICKET-101`: Critical peer isolation deadlock under network partition (urgent, high impact, verified repro logs).
    2. `OW-TICKET-102`: Docstring spelling cleanup in math helper (routine, low impact).
    3. `OW-TICKET-103`: Periodic crash during RPC stress test with missing reproduction logs.

### **0:30–1:05: Competing Agent Rankings & Selection**
- **Action**: Advance to Phase 2.
- **Proof Shown**:
  - Competing agent strategies (Champion, Urgency Prioritizer, High-Assurance Evidence-First, Broad Public Benefit).
  - Transparent rationales showing how weights produce ticket scores.
  - Winning selection: `OW-TICKET-101` receives highest champion score (89.2%, 415 tHSK).
  - Policy Engine inspection: `OW-TICKET-103` triggers `REVIEW_REQUIRED` / `BLOCKED` due to missing reproduction logs and empty acceptance criteria.

### **1:05–1:55: Bounded Reservation & Testnet Payout**
- **Action**: Click "One-Click: Reserve, Confirm PR & Complete Payout" in Phase 3.
- **Proof Shown**:
  - On-chain reservation: 415 tHSK locked by `OpenWorksTreasury.sol`.
  - Contributor PR linked (`openwork-protocol/consensus-p2p#112`) and payee address bound (`0x71C...49A1`).
  - Authorized maintainer confirms all 3 acceptance conditions verified.
  - Final settlement executed on HashKey (HSK) testnet: tokens transferred once, ticket permanently marked `PAID`.

### **1:55–2:30: Invariant Enforcement & Rejections**
- **Action**: In Phase 4, click "Trigger Duplicate Payout Attempt" and "Trigger Over-Cap Bounty Attempt".
- **Proof Shown**:
  - Duplicate payout attempt on `OW-TICKET-101` immediately reverts on-chain with custom error `AlreadyReservedOrPaid()`.
  - Attempting to allocate 1,200 tHSK immediately reverts with custom error `ExceedsMaxBounty(1200, 500)`.
  - Proves that neither the AI agent nor any caller can bypass hard custody boundaries.

### **2:30–3:00: Immutable Timeline & Historical Replay Lineage**
- **Action**: Advance to Phase 5 or navigate to `/audit`.
- **Proof Shown**:
  - Full cryptographic and evidence lineage from GitHub issue through strategy scores to on-chain transaction hash.
  - Historical replay dataset illustrating strategy evolution across 4 generations.
  - Methodological transparency notice: training cases (5) clearly separated from holdout validation cases (3).
  - Overconfidence penalty breakdown demonstrating how agents are penalized for funding failed tasks.

---

## 3. Dedicated Role Portals

1. **Steward Portal (`/steward`)**:
   - Manage cause description and approve open-source repositories.
   - Adjust ticket bounty ceilings and minimum reserve floors.
   - Emergency pause/resume switch halting on-chain allocations.

2. **Maintainer Portal (`/maintainer`)**:
   - Review incoming maintainer tickets.
   - Verify acceptance criteria and opt-in tickets.
   - Inspect pull requests, verify automated test traces, and cryptographically sign acceptance attestations.

3. **Contributor Portal (`/contributor`)**:
   - Discover funded tickets with transparent criteria and bounty allocations.
   - Submit pull request links and bind HSK payout addresses.
   - Track live settlement status and view on-chain receipts.

4. **Public Observer Explorer (`/audit`)**:
   - Search and audit all decision lineages.
   - Inspect rule-by-rule deterministic checks.
   - Explore evolutionary strategy weights, mutations, and holdout benchmarks.
