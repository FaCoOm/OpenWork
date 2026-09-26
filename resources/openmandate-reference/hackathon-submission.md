# OpenMandate — Hackathon Submission Manifest

> **A spending firewall and payment receipt kit for AI agents on HSK Chain**  
> **Working Title:** OpenMandate  
> **Submission Portal:** [https://eag-global-buildathon.devfolio.co/](https://eag-global-buildathon.devfolio.co/)  
> **Event Deadline:** September 26, 2026 @ 14:00 AEST (Sydney IRL Hackathon)  
> **Status:** Technical Reference Implementation (Verification Complete)

---

## 1. Executive Summary & Metadata

| Field                    | Detail                                                                                                            |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| **Project Name**         | **OpenMandate** (provisional working title; domain/trademark clearance pending)                                   |
| **Tagline**              | _A spending firewall and payment receipt kit for AI agents on HSK Chain_                                          |
| **Live Network**         | HSK Testnet (Chain ID `133`, RPC: `https://testnet.hsk.xyz`, Explorer: `https://testnet-explorer.hsk.xyz`)        |
| **Test Token**           | `MockUSD` (Standard ERC-20, 6 decimals — explicit, valueless test asset for demonstration)                        |
| **Primary Repositories** | Monorepo containing contracts, protocol schemas, receipt verifier, SDK, merchant API, agent runner, and dashboard |
| **Verification Command** | `pnpm verify` (runs linter, typecheck, unit tests, concurrent race tests, invariant suites, and preflight checks) |
| **Demo Command**         | `pnpm demo` (runs full end-to-end lifecycle verification test suite)                                              |

---

## 2. Track Selections & Strategic Alignment

OpenMandate targets the dual-prize structure established at the Sydney IRL Hackathon:

### A. IRL Hackathon Entry

- **Location:** Sydney Hackathon (September 26, 2026)
- **Eligibility:** Fully built and verified on-site during designated build blocks.

### B. EAG Track: "AI x Ethereum & Agent Economy"

- **Prize Target:** EAG Prize Pool (ShanHaiWoo Scholarship & Devcon tickets)
- **Why It Fits:**  
  As AI agents transition from read-only assistants to economic actors capable of procuring data, compute, and services, the central blocker is the **custody paradox**: principals cannot safely grant autonomous agents unrestricted wallet private keys without risking runaway spend, prompt-injection draining, or catastrophic model hallucination.  
  OpenMandate solves this by bringing human-defined economic policy to the EVM layer. Agents operate with autonomous discretion in choosing services and executing transactions, but **all economic invariants are strictly enforced on-chain**. The agent economy gains a deterministic spending firewall, and API providers receive cryptographic settlement guarantees.

### C. HSK Track: "HSK Chain" -> "Payment" (Alternative: "AI Agents")

- **Prize Target:** HSK Chain 1st Prize (2,500 USDT) / 2nd Prize (1,500 USDT) / 3rd Prize (1,000 USDT)
- **Why It Fits:**  
  High-frequency, low-latency micro-payments between machines require ultra-low transaction fees and fast block confirmations. OpenMandate designates **HSK Chain (Testnet Chain ID 133)** as its core settlement and authorization engine. The system provides an end-to-end payment loop:
  1. Principal escrows funds in `MandateVault.sol` on HSK.
  2. The agent executes micro-payments on HSK to approved merchant addresses.
  3. The merchant’s independent receipt verifier validates HSK transaction receipts, event topics, and block confirmations before releasing paid digital payload.
  4. Idempotent fulfillment ensures zero double-spending or duplicate deliveries.

---

## 3. Problem & Solution

### The Problem

1. **Unbounded Agent Risk:** Granting an LLM direct access to an unconstrained private key creates catastrophic financial exposure. Prompt injection attacks, loops, or malformed queries can drain a treasury within seconds.
2. **Merchant Verification Friction:** API merchants selling digital goods to autonomous bots cannot rely on off-chain promises or unauthenticated transaction hashes. They require cryptographic proof that an on-chain transfer settled for their exact order before dispensing proprietary data.
3. **Double-Spend & Replay Exposure:** Naive payment implementations allow malicious or buggy agents to claim orders repeatedly using stale transaction receipts or front-run order identifiers.

### The Solution: OpenMandate

OpenMandate introduces a bi-directional payment firewall and independent verification architecture:

- **Principal-to-Vault (On-Chain Policy):** A human owner deposits test funds into an escrowed smart contract (`MandateVault.sol`). The owner defines strict immutable bounds: designated agent address, merchant allowlist, per-payment maximum cap, total budget, and expiration timestamp.
- **Agent-to-Merchant (Autonomous Procurement):** The autonomous agent discovers HTTP 402-style quotes from paid merchants, evaluates utility, and calls `pay(...)` on `MandateVault`.
- **Contract Enforcement:** The contract programmatically rejects any payment violating the mandate’s policy, regardless of model output or prompt manipulation.
- **Merchant Independent Verification:** The merchant verifies the transaction receipt directly against the HSK Chain RPC, confirms the `PaymentSettled` event data, and requires an EIP-712 structured claim signature from the designated agent over a single-use server nonce before delivering the payload.

---

## 4. The 7 Economic Invariants of `MandateVault.sol`

The core contract guarantees that regardless of prompt injection, model malfunction, or network retry loops, these 7 invariants can never be violated:

1. **Designated Caller Invariant:**  
   `msg.sender == mandate.agent`  
   Only the cryptographically designated agent address can initiate payments on an active mandate.
2. **Merchant Allowlist Invariant:**  
   `isApprovedMerchant[mandateId][merchant] == true`  
   Payments can only be routed to merchant addresses explicitly approved by the principal upon mandate creation.
3. **Per-Payment Cap Invariant:**  
   `0 < amount <= mandate.perPaymentCap`  
   No single transaction can ever exceed the configured ceiling, preventing rogue lump-sum drains.
4. **Cumulative Budget Invariant:**  
   `0 <= spent + amount <= mandate.totalBudget`  
   The cumulative payments executed under a mandate can never exceed the initial funded escrow.
5. **Global Order Replay Invariant:**  
   `isOrderSettled[merchant][orderId] == false`  
   A unique merchant order ID can settle exactly once across the entire vault, eliminating cross-mandate and intra-mandate replay attacks.
6. **Owner Reclamation & Revocation Invariant:**  
   At any time, the principal can revoke an active mandate. The contract immediately terminates spending authority and atomically refunds the exact remaining unspent balance (`totalBudget - spent`) directly to the owner.
7. **Vault Solvency Invariant:**  
   `token.balanceOf(address(vault)) >= aggregate(totalBudget - spent)`  
   The vault maintains 100% solvency at all times across all active mandates without fractional reserve or deficit.

---

## 5. Technical Architecture & Monorepo Tour

OpenMandate is architected as a clean, modular pnpm monorepo with 100% typed boundaries:

```text
OpenMandate/
├── contracts/                  # Solidity 0.8.24 contracts & Hardhat test suite
│   ├── src/
│   │   ├── MandateVault.sol    # Core escrow & 7 economic invariants engine
│   │   └── MockUSD.sol         # Valueless 6-decimal test token for HSK testnet
│   └── test/
│       ├── MandateVault.test.cjs  # Invariant & negative attack vector tests
│       └── e2e-lifecycle.test.cjs # Full owner-agent-merchant lifecycle test
├── packages/
│   ├── protocol/               # TypeBox schemas, atomic bigint money math, EIP-712 types
│   ├── verifier/               # HSK receipt verifier, canonical reorg check, signature verification
│   └── sdk/                    # Reusable TypeScript client for owners, agents, and merchants
├── apps/
│   ├── merchant-api/           # Fastify service: HTTP 402 quotes, challenge nonces, SQLite WAL delivery
│   ├── agent-runner/           # Autonomous agent loop with sandboxed tool execution and audit trace
│   └── dashboard/              # Next.js 15 principal control panel with real-time on-chain state reads
├── examples/
│   └── merchant-minimal/       # Zero-internal-import external merchant integration sample
├── scripts/
│   ├── deploy/                 # HSK Testnet deployment and preflight verification scripts
│   ├── check-env.mjs           # Network and RPC configuration validator
│   ├── check-claims.mjs        # Anti-overclaim scanner (prevents forbidden claims)
│   └── check-gates.mjs         # Manifest and release gate automated validator
└── docs/                       # Product evidence, threat models, release gate manifests
```

### Key Subsystems:

- **`packages/protocol`:** Enforces precision-safe conversions between human-readable currency strings and 6-decimal atomic units via native BigInt math. Defines the EIP-712 typed data domain:
  ```json
  "MerchantClaim": [
    { "name": "merchant", "type": "address" },
    { "name": "orderId", "type": "bytes32" },
    { "name": "mandateId", "type": "uint256" },
    { "name": "transactionHash", "type": "bytes32" },
    { "name": "agent", "type": "address" },
    { "name": "token", "type": "address" },
    { "name": "amount", "type": "uint256" },
    { "name": "resourceHash", "type": "bytes32" },
    { "name": "nonce", "type": "bytes32" },
    { "name": "issuedAt", "type": "uint64" },
    { "name": "expiresAt", "type": "uint64" }
  ]
  ```
- **`packages/verifier`:** Queries HSK Chain RPC nodes, verifies receipt status `0x1`, matches event log topics against `PaymentSettled(uint256,address,address,address,uint256,bytes32,bytes32)`, and confirms the block hash is part of the canonical tip to guard against chain reorgs.
- **`apps/merchant-api`:** Implements high-performance atomic order fulfillment in SQLite with WAL mode. Tested and verified under a **20-worker concurrent claim race**, proving zero double-fulfillments.

---

## 6. 3-Minute Live Demo Walkthrough (`pnpm demo`)

Judges and evaluators can verify the entire protocol locally in under 3 minutes using the automated verification suite:

```bash
# Execute the complete automated end-to-end lifecycle verification
pnpm demo
```

### Breakdown of the 3-Minute Demonstration:

| Time          | Stage                                | Action & System Verification                                                                                                                                                                                                                                              | Invariant Verified                                 |
| ------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| **0:00–0:40** | **Mandate Creation**                 | The human principal deposits 10 MockUSD into `MandateVault.sol`, designating an agent address, allowlisting Merchant A, setting a 2 MockUSD per-payment cap, and 30-minute expiry.                                                                                        | Initial Solvency & Creation Policy                 |
| **0:40–1:20** | **Autonomous Quote & Payment**       | The agent requests a quote from the merchant for `market-intelligence` (1 MockUSD). The agent submits `pay(mandateId, merchant, 1 MockUSD, orderId, resourceHash)` to the vault. Vault decrements remaining budget to 9 MockUSD and transfers 1 MockUSD to the merchant.  | Designated Caller, Cap, Budget, Merchant Allowlist |
| **1:20–2:00** | **Independent Receipt Verification** | The agent requests a challenge nonce from the merchant and signs an EIP-712 claim. The merchant API verifies the transaction receipt on HSK, verifies the agent signature, marks the order fulfilled in SQLite, and serves the intelligence report.                       | Cryptographic Receipt Claim Proof                  |
| **2:00–2:20** | **Idempotent Retry Test**            | The agent re-submits the exact same claim. The merchant returns the cached report immediately without re-charging or double-crediting.                                                                                                                                    | Idempotent Replay Resistance                       |
| **2:20–2:40** | **Negative Invariant Rejections**    | 1. Agent attempts to spend 3 MockUSD (exceeds 2 MockUSD cap) -> Reverts with `CapExceeded`.<br>2. Agent attempts to pay unapproved merchant -> Reverts with `UnapprovedMerchant`.<br>3. Agent attempts to replay previous order ID -> Reverts with `OrderAlreadySettled`. | Robust Boundary Enforcement                        |
| **2:40–3:00** | **Principal Revocation & Refund**    | The principal invokes `revoke(mandateId)`. The vault immediately inactivates the mandate and atomically transfers the unspent 9 MockUSD back to the owner's wallet.                                                                                                       | Owner Reclamation & Solvency                       |

---

## 7. Security Model & Transparent Discussion of Limitations

OpenMandate adheres to disciplined security boundaries and transparent engineering disclosure:

### Security Boundaries:

- **LLM Boundary Isolation:** The language model is strictly isolated outside the cryptographic boundary. The model can choose which tool to invoke (`fetchQuote`, `pay`), but the private key is held in an isolated wallet client, and authorization is enforced strictly by EVM contract logic.
- **Replay Protection:** Two-tier protection: on-chain global `(merchant, orderId)` uniqueness in `MandateVault.sol`, coupled with single-use cryptographic nonces and database transactions on the merchant API.
- **Public Tx Hash Theft Prevention:** A third party observing an on-chain transaction hash on the HSK explorer cannot claim the paid digital resource because the merchant requires a signed EIP-712 structured claim from the specific agent address matching the on-chain receipt.

### Known Limitations & Responsible Disclosure:

1. **Order-Poisoning Front-running Limitation (Documented & Tested):**
   - _Limitation:_ In the v1 contract, `orderId`s are 256-bit unique hashes generated by merchants. If an unconfirmed transaction sits in a public mempool, a malicious third party could observe the pending `orderId` and submit a `pay(...)` transaction from their own separate mandate. While the attacker burns their own funds and cannot claim the merchant payload (since the merchant requires the victim agent’s EIP-712 signature), the victim’s transaction would revert with `OrderAlreadySettled`.
   - _Test Evidence:_ Formally characterized and proved in `contracts/test/MandateVault.test.cjs` (`characterizes known order-poisoning limitation across mandates`).
   - _Mitigation Plan:_ Roadmap v2 introduces **mandate-bound quotes**, where `orderId` derivation includes `keccak256(mandateId, merchantOrderId)` or merchant-signed quotes specifying the permitted payer.
2. **Late Quote Settlement:**  
   If an on-chain transaction is confirmed after the merchant quote timestamp expires, the merchant will reject the claim. In v1, there is no automated on-chain dispute/escrow resolution; expired orders require merchant support.
3. **Key Custody in Reference Implementation:**  
   The current runner demonstrates address-based EOA authorization. Production hardening will integrate ERC-4337 smart accounts and session keys.

---

## 8. Verification Evidence & Release Gate Status

All local and protocol gates have been verified:

| Gate            | Name                              | Status                 | Evidence                                                                                      |
| --------------- | --------------------------------- | ---------------------- | --------------------------------------------------------------------------------------------- |
| `GATE-CONTRACT` | Invariant & Solvency Verification | **VERIFIED_LOCAL**     | 13/13 passing tests in `contracts/test/` (`MandateVault.test.cjs` + `e2e-lifecycle.test.cjs`) |
| `GATE-RECEIPT`  | Merchant Receipt Verification     | **VERIFIED_LOCAL**     | Verified across `@openmandate/verifier` and `@openmandate/merchant-api`                       |
| `GATE-REPLAY`   | Idempotency & Replay Resistance   | **VERIFIED_LOCAL**     | 20-worker concurrent claim race test passing with SQLite WAL                                  |
| `GATE-RULES`    | Event Track Confirmation          | **RESOLVED_CONFIRMED** | Confirmed via Devfolio official submission guidelines (EAG AI Track + HSK Payment)            |
| `GATE-HSK`      | HSK Testnet Live Settlement       | **PREFLIGHT_READY**    | Preflight check verified on Chain ID 133; deployment scripts ready for live funding           |
| `GATE-NAME`     | Public Naming Clearance           | **BLOCKED_EXTERNAL**   | OpenMandate is a provisional working title; domain/trademark clearance pending                |
| `GATE-USER`     | External User Validation          | **BLOCKED_EXTERNAL**   | Reference implementation complete; third-party pilot integration scheduled post-hackathon     |

---

## 9. Future Roadmap

1. **Mandate-Bound & Merchant-Signed Quotes (v2):**  
   Introduce merchant EIP-712 signed quotes that bind the price, expiry, and order ID to a designated `mandateId`, completely mitigating cross-mandate front-running order poisoning.
2. **Mainnet HSK Deployment & Production Stablecoin Support:**  
   Deploy to HSK Chain Mainnet with native USDT/USDC token support once formal smart contract audits are completed.
3. **ERC-4337 Session Key Integration:**  
   Migrate from EOA test keys to scoped smart-account session keys, enabling granular gas sponsorship and hardware-enclave key protection.
4. **Standardized Protocol Adapters:**  
   Build official adapter plugins for the emerging Google AP2 mandate specifications and x402 V2 payment facilitators.
5. **Multi-Merchant Dispute Escrow:**  
   Introduce time-locked challenge windows allowing agents to reclaim funds if a merchant fails to sign an acknowledgment receipt.
