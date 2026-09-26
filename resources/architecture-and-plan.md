# OpenWorks — Architecture and Implementation Plan

## 1. Executive Summary & Core Mission
OpenWorks is a verifiable grant and bounty allocator that gives a fixed public-goods fund to a population of bounded agents that compete to find urgent, high-impact issues in approved open-source repositories. Accepted fixes leave a traceable evidence trail and trigger a capped, one-time payment to the contributor.

This implementation delivers:
1. **Fixed Mandate & Verifiable Policy Engine**: Deterministic rules checking repository eligibility, duplicate funding, budget caps, round limits, expiry, and maintainer role permissions. Emits clear verdicts (`ELIGIBLE`, `REVIEW_REQUIRED`, `BLOCKED`) with reason codes.
2. **Evolutionary Strategy Engine**: Multi-agent population (champion + shadow agents) with evolving transparent weights (urgency, breadth of effect, expected public benefit, feasibility, evidence confidence, proposed amount). Includes historical replay validation, fitness scoring, mutation operators, and holdout evaluation.
3. **Smart Contract Settlement Layer (HSK Testnet compatible)**: EVM-compatible Solidity contracts (`OpenWorksTreasury.sol`, `MockTestToken.sol`) enforcing on-chain spending limits, maintainer role authorizations, one-time bounty reservations, tamper-proof payout settlements, duplicate prevention, and pause switches.
4. **Interactive Full-Stack Web Application**: Next.js / Tailwind CSS / TypeScript dashboard providing Steward, Maintainer, Contributor, and Public Observer views, an interactive 3-Minute Demo walkthrough mode, and audit trail visualization.
5. **End-to-End Verification & Automated Testing**: Smart contract tests, evolutionary algorithm tests, deterministic rule engine tests, and end-to-end simulation scripts.

---

## 2. Directory Structure

```
OpenWork/
├── resources/                          # Research, plans, and evaluation datasets
│   ├── architecture-and-plan.md
│   └── replay-corpus.json
├── contracts/                          # Solidity contracts & Hardhat test suite
│   ├── contracts/
│   │   ├── OpenWorksTreasury.sol       # Core escrow, mandate, reservations & settlement
│   │   └── MockTestToken.sol           # ERC20 test token for HSK testnet simulations
│   ├── test/
│   │   └── OpenWorksTreasury.test.ts   # Contract unit & edge-case tests
│   ├── scripts/
│   │   ├── deploy.ts                   # Deployment script for HSK testnet / local
│   │   └── simulate.ts                 # Script demonstrating legitimate & rejected payouts
│   ├── hardhat.config.ts
│   └── package.json
├── packages/
│   └── core/                           # TypeScript Core Engine
│       ├── src/
│       │   ├── types.ts                # Domain types (Ticket, Mandate, Agent, Verdict, etc.)
│       │   ├── policy-engine.ts        # Deterministic verdict & rule enforcement engine
│       │   ├── strategy-engine.ts      # Strategy population, ranking, fitness & mutation
│       │   ├── replay-evaluator.ts     # Historical replay & holdout benchmark evaluator
│       │   ├── jev-ai-service.ts       # Semantic triage & feature extraction
│       │   └── intake-parser.ts        # Issue intake & acceptance condition schema
│       ├── test/
│       │   ├── policy-engine.test.ts
│       │   ├── strategy-engine.test.ts
│       │   ├── replay.test.ts
│       │   ├── intake.test.ts
│       │   └── jev-ai.test.ts
│       ├── tsconfig.json
│       └── package.json
├── web/                                # Next.js Interactive Dashboard & Demo App
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx                # Main portal / 3-minute showcase mode
│   │   │   ├── steward/page.tsx        # Fund Steward mandate & reserve controls
│   │   │   ├── maintainer/page.tsx     # Maintainer intake & fix acceptance portal
│   │   │   ├── contributor/page.tsx    # Contributor ticket directory & claim flow
│   │   │   └── audit/page.tsx          # Public observer audit trail & replay visualizer
│   │   ├── components/                 # UI components (Timeline, StrategyCard, VerdictBadge, etc.)
│   │   ├── lib/                        # Contract client, web3 mock/ethers provider, state store
│   │   └── data/                       # Preloaded mock repo issues & replay dataset
│   ├── tailwind.config.js
│   ├── package.json
│   └── tsconfig.json
└── README.md                           # Comprehensive documentation and run guide
```

---

## 3. Subagent Execution Plan

We will deploy specialized parallel subagents:
- **Subagent A (Contracts Architect)**: Implement Solidity contracts, compile with Hardhat/ethers, and write exhaustive tests (normal flow, double payout, over-cap, unauthorized maintainer, paused fund).
- **Subagent B (Agent & Rules Core)**: Implement deterministic policy engine, evolutionary strategy population, replay benchmark, and types.
- **Subagent C (Web Frontend & Interactive Showcase)**: Build the Next.js UI with Tailwind CSS, Lucide icons, live state store, timeline visualizer, and 3-minute walkthrough narrative mode.
- **Subagent D (Integration, Replay Benchmark & Testing)**: Wire contract interactions, ensure build passes cleanly, verify test suites, and write end-to-end demonstration scripts.
