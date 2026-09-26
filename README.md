# OpenWorks — Verifiable Public-Goods Grant & Bounty Allocator

> **Sydney AI x Web3 Hackathon Prototype**  
> Based on the specification in [`OpenWorks-Project-Brief.md`](./OpenWorks-Project-Brief.md).

---

## 1. Executive Summary

**OpenWorks** gives a fixed public-goods fund to a population of bounded agents that compete to find urgent, high-impact issues in approved open-source repositories; accepted fixes leave a traceable evidence trail and trigger a capped, one-time payment to the contributor.

### Key Architectural Pillars:
1. **Fixed Spending Mandate**: A steward deposits test tokens and publishes approved repositories, max bounty caps, round limits, and an immutable minimum uncommitted reserve floor. Money limits do not evolve with the agent.
2. **Maintainer Ticket Intake**: Issues are gathered from approved repositories, checked for reproduction logs, and confirmed by authorized maintainers with concrete acceptance conditions.
3. **Evolutionary Strategy Engine**: Candidate funding agents compete using visible, interpretable weights (urgency, breadth of effect, public benefit, feasibility, evidence confidence). A live Champion allocates; shadow agents produce shadow rankings. Generations mutate and score against a common replay corpus with strictly separated holdout benchmarks.
4. **Verifiable Policy Engine**: Deterministic rules enforce repo eligibility, double-spending prevention, cap compliance, and evidence thresholds, issuing unskippable verdicts (`ELIGIBLE`, `REVIEW_REQUIRED`, `BLOCKED`).
5. **On-Chain Settlement (HashKey HSK Testnet)**: EVM smart contracts (`OpenWorksTreasury.sol`) guarantee exactly-once payouts, maintainer signature checks, over-cap blocks, and emergency pauses.

---

## 2. Project Architecture

```
OpenWork/
├── contracts/                        # Hardhat + Solidity + Ethers v6 (HSK Testnet Compatible)
│   ├── contracts/
│   │   ├── OpenWorksTreasury.sol     # Core escrow, mandate, reservations & settlement
│   │   └── MockTestToken.sol         # ERC20 test token (tHSK)
│   ├── test/
│   │   └── OpenWorksTreasury.test.ts # 24 passing tests (100% coverage of edge cases)
│   └── scripts/
│       ├── deploy.ts                 # Testnet deployment script
│       └── simulate.ts               # End-to-end blockchain simulation
├── packages/
│   └── core/                         # TypeScript Core Engine
│       ├── src/
│       │   ├── policy-engine.ts      # Deterministic rule & verdict engine (9 rules)
│       │   ├── strategy-engine.ts    # Multi-agent population, ranking & mutation
│       │   ├── replay-evaluator.ts   # Replay corpus & holdout benchmark scoring
│       │   ├── intake-parser.ts      # GitHub issue intake & condition parser
│       │   ├── jev-ai-service.ts     # Semantic triage & feature extraction
│       │   └── demo-data.ts          # 3 Differentiated demo tickets & replay corpus
│       └── test/                     # 26 passing Vitest tests
├── web/                              # Next.js 15 + Tailwind CSS Interactive Portal
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx              # 3-Minute Showcase & Live Narrative Controller
│   │   │   ├── steward/page.tsx      # Fund Steward mandate & reserve controls
│   │   │   ├── maintainer/page.tsx   # Maintainer intake & fix acceptance portal
│   │   │   ├── contributor/page.tsx  # Contributor ticket directory & claim flow
│   │   │   └── audit/page.tsx        # Public observer audit trail & replay visualizer
│   │   └── components/               # Reactive UI components & Policy rule inspector modal
└── resources/                        # Specifications, plans, and evaluation guides
    ├── architecture-and-plan.md
    ├── core-package-spec.md
    ├── smart-contracts-spec.md
    └── demonstration-guide.md
```

---

## 3. Quick Start & Verification

### Run Complete Test Suites (50 Tests Total)
```bash
npm run test:all
```
- `contracts`: 24 passing tests (Mandates, maintainer registry, reservations, one-time payouts, over-cap blocks, duplicate rejections, pause switches).
- `packages/core`: 26 passing tests (Policy verdicts, strategy rankings, mutations, replay evaluator with holdout separation, Jev AI service).

### Run Blockchain Settlement Simulation
```bash
npm run demo:simulate
```
Executes a full Hardhat simulation illustrating legitimate payout to a contributor followed by hard on-chain rejections for duplicate payouts and over-cap allocations.

### HashKey Chain (HSK Testnet) Deployment & Verification
```bash
# 1. (Optional) Generate a deployment wallet
npm run wallet:generate

# 2. Get testnet HSK gas tokens from official faucet: https://faucet.hsk.xyz

# 3. Deploy contracts directly to HashKey Chain Testnet (Chain ID 133)
npm run deploy:hsk

# 4. Verify on-chain mandate & query live contracts on HashKey Chain
npm run verify:hsk
```
- **Official Chain ID**: `133` (`0x85`)
- **Official RPC**: `https://testnet.hsk.xyz`
- **Block Explorer**: [testnet-explorer.hskchain.net](https://testnet-explorer.hskchain.net)
- **Faucet**: [faucet.hsk.xyz](https://faucet.hsk.xyz)

### Launch the Web App & Interactive Showcase
```bash
npm run dev:web
```
Navigate to `http://localhost:3000` to interact with the live dashboard. Features:
- **Direct MetaMask/Web3 Integration**: Auto-switch or add HashKey Chain Testnet with 1-click EIP-3085.
- **Live HSK On-Chain Mode**: Sign live transactions on HashKey Chain Testnet and inspect receipts on Blockscout.
- **Real-Time RPC Monitoring**: Live block height counter and gas price fetched continuously from `https://testnet.hsk.xyz`.

---

## 4. 3-Minute Showcase Script (Section 7 of Brief)

The web dashboard features an interactive step-by-step narrative controller:
- **0:00–0:30**: Cause, approved repo, fund balance, and 3 competing tickets (`OW-TICKET-101`, `102`, `103`).
- **0:30–1:05**: Competing agent rankings, transparent rationales, winning strategy, and policy review requirement for missing reproduction logs.
- **1:05–1:55**: Bounded bounty reservation, accepted work, maintainer confirmation, and completed testnet payout.
- **1:55–2:30**: Invariant enforcement: attempt over-cap and duplicate payout to show hard on-chain revert (`AlreadyReservedOrPaid`, `ExceedsMaxBounty`).
- **2:30–3:00**: Immutable ticket-to-payment timeline and historical replay with strategy lineage and separate holdout benchmark.
