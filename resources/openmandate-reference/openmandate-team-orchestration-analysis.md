# OpenMandate — Comprehensive Analysis & Team Agent Orchestration Blueprint

## 1. Executive Summary & Project Profile Synthesis

Based on the [OpenMandate-Project-Profile.md](file:///c:/Users/Fate_Conqueror/GitHub/OpenMandate/OpenMandate-Project-Profile.md) and the technical reference plan in `.omo/plans/openmandate-implementation.md`, OpenMandate is designed as a **spending firewall and payment receipt kit for AI agents on HSK Chain**.

### Core Value Proposition
- **Problem**: Autonomous AI agents that require online digital services cannot be granted unrestricted wallet access without exposing human owners to catastrophic overspending, misdirected funds, or repeat draining. Simultaneously, merchants require verifiable, tamper-proof proof that a specific order has settled on-chain before serving paid resources.
- **Solution**: A human principal deposits funds into a time-limited mandate escrow contract on HSK Chain (`MandateVault.sol`). The mandate strictly defines the designated agent address, permitted merchant addresses, a per-payment cap, and a total budget. An agent can discover services and request quotes, but execution must satisfy contract-enforced policy. A merchant-side receipt verifier independently authenticates on-chain settlement against its own order, token, and resource commitment before releasing data, with idempotent retry support.

### The Economic Invariants (The Non-Negotiable Contract Boundary)
1. **Agent Authorization**: Only the designated `agent` address can invoke `pay(...)` on an active, non-expired mandate.
2. **Merchant Whitelist**: Payments can only be transferred to merchants explicitly authorized within that mandate.
3. **Per-Payment Cap**: Every payment amount must satisfy `0 < amount <= perPaymentCap`.
4. **Budget Invariant**: For every mandate, `0 <= spent <= totalBudget`. The cumulative spend never exceeds the deposited escrow.
5. **Global Order Replay Prevention**: The pair `(merchant, bytes32 orderId)` can settle exactly once across the entire vault, preventing double-spending and replay attacks.
6. **Owner Reclamation**: The mandate owner can call `revoke(...)` at any time (or after expiry), immediately disabling future spend and returning remaining unspent escrow (`totalBudget - spent`) in one atomic transaction.
7. **Solvency**: Total vault token balance must always equal or exceed the sum of all remaining liabilities across all funded, active, or expired-unrefunded mandates.

---

## 2. Technical Stack & Architectural Decisions

| Layer | Selected Component | Rationale & Constraint |
|---|---|---|
| **Language & Monorepo** | pnpm workspaces, TypeScript project references | Strict boundary isolation between SDK, contracts, backend, frontend, and runner. |
| **Smart Contracts** | Solidity 0.8.24+, Foundry / Forge | Rapid test cycles, fuzzing, stateful invariant testing, OpenZeppelin `SafeERC20` & `ReentrancyGuard`. |
| **Payment Token** | `MockUSD.sol` (6 decimals, ERC-20) | Valueless test asset for demo safety; avoids mainnet confusion and token rebasing/fee vulnerabilities. |
| **Settlement Layer** | HSK Testnet (Chain ID 133) | EVM compatible, gas token HSK, RPC `https://testnet.hsk.xyz`, explorer `https://testnet-explorer.hsk.xyz`. |
| **Merchant Backend** | Fastify + TypeBox + SQLite (WAL) | Fast, schema-validated 402-style quote & claim API with strict `BEGIN IMMEDIATE` atomic fulfillment transactions. |
| **Authentication & Claim** | EIP-712 Typed Signatures + Nonce | Prevents public transaction-hash theft; only the designated agent who signed can claim the report. |
| **Client SDK** | Viem + TypeScript | Lightweight, typed, framework-agnostic library exposing `createMandate`, `quote`, `pay`, `verifyPaymentEvent`, and `claimOrder`. |
| **Agent Runner** | Node.js Bounded Agent Tool Loop | Strictly isolated test wallet; exposes only catalog, quote, pay, and claim tools. Deterministic fallback included. |
| **Dashboard** | Next.js 15 (App Router) + Viem | Derives state strictly from confirmed on-chain reads and verified logs; zero optimistic financial accounting. |

---

## 3. Team Agent Orchestration Framework

Using the `/team-agent-orchestration` framework (`.agents/skills/team-agent-orchestration/SKILL.md`), the implementation is structured as an engineering squad operating over an **Agent Kanban Board** with explicit work items, code boundaries, handoffs, and merge gates.

### 3.1 Agent Squad Roster & Responsibilities

In accordance with [AGENTS.md](file:///c:/Users/Fate_Conqueror/GitHub/OpenMandate/AGENTS.md), substantive implementation, architecture, and review tasks are assigned to worker agents running `gpt-6-sol`, with uncomplicated documentation/checks routed to `gpt-6-luna`.

1. **Lead Orchestrator (`orchestrator`)**
   - **Role**: Overall project architecture, task decomposition, wave synchronization, merge gates, and final integration.
2. **Platform & Protocol Engineer (`agent-platform`)**
   - **Role**: Monorepo scaffolding, TypeScript configuration, shared TypeBox schemas, contract ABI synchronization, and CI workflows.
   - **Ownership**: `package.json`, `pnpm-workspace.yaml`, `tsconfig*.json`, `packages/config/**`, `packages/protocol/**`, `.github/workflows/**`.
3. **Smart Contract Engineer (`agent-contracts`)**
   - **Role**: `MockUSD.sol` and `MandateVault.sol`, Foundry unit/fuzz/invariant tests, deployment scripts.
   - **Ownership**: `contracts/**`.
4. **Backend & Security Engineer (`agent-backend`)**
   - **Role**: SQLite schema, atomic persistence, receipt/signature verifier (`packages/verifier/**`), Fastify Merchant API (`apps/merchant-api/**`).
   - **Ownership**: `packages/verifier/**`, `apps/merchant-api/**`.
5. **SDK & Integration Engineer (`agent-sdk`)**
   - **Role**: Framework-neutral TypeScript SDK (`packages/sdk/**`), ABI bindings, external integration example (`examples/merchant-minimal/**`).
   - **Ownership**: `packages/sdk/**`, `examples/merchant-minimal/**`.
6. **Frontend UI Engineer (`agent-frontend`)**
   - **Role**: Next.js Owner Dashboard (`apps/dashboard/**`), Viem wallet integration, confirmed chain state rendering, accessibility.
   - **Ownership**: `apps/dashboard/**`.
7. **Agent Systems Engineer (`agent-runner`)**
   - **Role**: Bounded agent tool loop (`apps/agent-runner/**`), quote decision engine, deterministic fallback, auditable trace logs.
   - **Ownership**: `apps/agent-runner/**`.
8. **QA & Evidence Auditor (`agent-qa`)**
   - **Role**: Local Anvil E2E automation, Playwright tests, HSK Testnet deployment runbook, documentation, evidence manifests.
   - **Ownership**: `scripts/dev/**`, `tests/e2e/**`, `docs/**`, `README.md`.

---

## 4. Agent Kanban Board & Execution Waves

### Wave 1: Foundation & Shared Protocol (Zero Prerequisites)
*Goal: Establish rock-solid type contracts, build toolchain, and frozen project boundaries.*

- **Card OM-01 [FOUNDATION]**: Monorepo Scaffold & Toolchain Preflight
  - **Owner**: `agent-platform`
  - **Scope**: Root workspace, tsconfig, lint/formatting, `.env.example`, `pnpm verify` skeleton.
  - **Merge Gate**: `pnpm install`, `pnpm lint`, `pnpm typecheck` exit 0 cleanly.
- **Card OM-02 [PRODUCT]**: Honest Claims & Release Gates Specification
  - **Owner**: `agent-qa`
  - **Scope**: `docs/product-evidence.md`, `docs/release-gates.md`, `scripts/check-claims.*`.
  - **Merge Gate**: Claims check passes; unresolved gates (naming, external user) report `BLOCKED_EXTERNAL`.
- **Card OM-03 [PROTOCOL]**: Shared Schemas, Types, Hashing, and ABI Specifications
  - **Owner**: `agent-platform`
  - **Scope**: `packages/protocol/**`, TypeBox schemas (quotes, nonces, EIP-712 claims, events, errors).
  - **Merge Gate**: Golden fixtures produce matching digests, atomic amount parsing strictly validated (`bigint`).

---

### Wave 2: Core Components in Parallel (Blocked by Wave 1)
*Goal: Implement smart contract logic, receipt verifier, persistence, dashboard shell, and CI gates.*

- **Card OM-04 [CONTRACTS]**: MockUSD & MandateVault with Stateful Invariant Suite
  - **Owner**: `agent-contracts`
  - **Scope**: `contracts/src/**`, `contracts/test/**`.
  - **Merge Gate**: `forge test -vvv` passes; 100% economic invariant branches tested; coverage >= 80%.
- **Card OM-05 [DATA]**: SQLite Persistence Layer & Atomic Claim Transitions
  - **Owner**: `agent-backend`
  - **Scope**: `apps/merchant-api/src/db/**`, migrations, concurrency tests.
  - **Merge Gate**: Zero double-fulfillments in 20-worker race conditions; crash-recovery test passes.
- **Card OM-06 [VERIFIER]**: Receipt, Event, and EIP-712 Signature Verification Engine
  - **Owner**: `agent-backend`
  - **Scope**: `packages/verifier/**`.
  - **Merge Gate**: Exact log identity checks pass; reorgs detected; historical events claimable even if mandate revoked.
- **Card OM-08 [DASHBOARD-SHELL]**: Accessible Owner Dashboard Shell & State Machines
  - **Owner**: `agent-frontend`
  - **Scope**: `apps/dashboard/**` (UI components, mocked SDK hooks).
  - **Merge Gate**: Zero serious/critical accessibility errors; explicit pending/failed/confirmed visual states.
- **Card OM-09 [CI]**: Quality Gates, Linters, Coverage & Security Scanners
  - **Owner**: `agent-platform`
  - **Scope**: `.github/workflows/**`, root check scripts.
  - **Merge Gate**: All active package checks pass in CI workflow validation.

---

### Wave 3: Integration, API, SDK, and Deployment (Blocked by Wave 2)
*Goal: Assemble the working interfaces, runnable merchant server, and SDK.*

- **Card OM-07 [SDK]**: Reusable TypeScript Mandate Client Surface
  - **Owner**: `agent-sdk`
  - **Scope**: `packages/sdk/**`. Exposes `createMandate`, `quote`, `pay`, `claimOrder`, re-exports verifier.
  - **Merge Gate**: Package exports build; coverage >= 80%; Anvil local integration tests pass.
- **Card OM-10 [MERCHANT]**: Fastify Merchant API & Idempotent Report Delivery
  - **Owner**: `agent-backend`
  - **Scope**: `apps/merchant-api/**`.
  - **Merge Gate**: 402-style quote, nonce issue, receipt polling, and atomic fulfillment pass integration tests.
- **Card OM-11 [DASHBOARD-WIRE]**: Live Dashboard Viem & Contract Connection
  - **Owner**: `agent-frontend`
  - **Scope**: `apps/dashboard/**` live wiring.
  - **Merge Gate**: Playwright local wallet test completes create, pay display, and revoke with real contract reads.
- **Card OM-12 [HSK-DEPLOY]**: Idempotent HSK Testnet Deployment & Evidence Pipeline
  - **Owner**: `agent-contracts`
  - **Scope**: `contracts/script/**`, `scripts/deploy/**`.
  - **Merge Gate**: Anvil dry-run passes; HSK preflight script checks Chain ID 133, gas, and balance without side-effects.
- **Card OM-13 [EXAMPLE]**: External Minimal Merchant SDK Integration Example
  - **Owner**: `agent-sdk`
  - **Scope**: `examples/merchant-minimal/**`.
  - **Merge Gate**: Operates strictly using public `@openmandate/sdk` package; zero internal imports.

---

### Wave 4: Agent Runner, End-to-End Orchestration, and Documentation (Blocked by Wave 3)
*Goal: Complete the autonomous agent loop, verify the entire lifecycle, and package the release.*

- **Card OM-14 [AGENT]**: Bounded Tool Runner & Decision Trace Engine
  - **Owner**: `agent-runner`
  - **Scope**: `apps/agent-runner/**`.
  - **Merge Gate**: Agent only calls approved payment tools; prompt injection cannot drain wallet; trace recorded.
- **Card OM-15 [E2E]**: Full Lifecycle Local Orchestration & Verification Suite
  - **Owner**: `agent-qa`
  - **Scope**: `scripts/dev/**`, `tests/e2e/**`.
  - **Merge Gate**: `pnpm demo:local:verify` runs end-to-end without manual database intervention.
- **Card OM-16 [RELEASE]**: Comprehensive Documentation, Threat Model & Submission Package
  - **Owner**: `agent-qa`
  - **Scope**: `README.md`, `docs/**`.
  - **Merge Gate**: All claims verified against implementation; all limitations (order poisoning, late quotes) documented.

---

## 5. Risk Controls & Security Mitigations

1. **Order-Poisoning Front-running (Known Limitation)**:
   - In the v1 baseline ABI `pay(mandateId, merchant, amount, orderId, resourceHash)`, an attacker observing a pending `orderId` in the mempool could call `pay` from their own mandate with a different amount/resource, burning the `(merchant, orderId)` key.
   - *Mitigation*: Generate cryptographically random, unpredictable 256-bit `orderId`s; document this limitation explicitly in the threat model and tests; specify v2 roadmap with merchant-signed quote binding `(merchant, agent, mandate, orderId, amount, expiry)`.
2. **Late-Quote Inclusion**:
   - If an agent submits a transaction near `quote.expiresAt` and mining delays cause inclusion after quote expiry, the merchant will reject the claim.
   - *Mitigation*: Client applies a strict safety buffer (`QUOTE_SAFETY_BUFFER_SECONDS`); UI warns user; API provides clear error response.
3. **Public Transaction Hash Theft**:
   - On a public blockchain, anyone can observe the `PaymentSettled` transaction hash.
   - *Mitigation*: The merchant requires an EIP-712 signature over a fresh single-use server nonce signed by the designated `agent` address before fulfilling data.
4. **Agent Prompt Injection & Unbounded Spending**:
   - An LLM may hallucinate, experience prompt injection, or attempt to send arbitrary transactions.
   - *Mitigation*: The LLM is NEVER given raw private keys or generic transaction tools. It can only propose actions to a deterministic runner that validates the quote against mandate policy before signing.
