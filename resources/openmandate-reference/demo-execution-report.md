# OpenMandate — End-to-End Live Hackathon Demonstration Report

## Overview
This report documents the design, implementation, and verification of the end-to-end hackathon demonstration script in [`scripts/demo.mjs`](../scripts/demo.mjs).

The demonstration script showcases the complete lifecycle of the OpenMandate spending firewall and payment protocol in under 3 minutes, executing directly on an in-memory Hardhat network provider with zero external infrastructure dependencies.

---

## Architecture & Components Utilized
The demonstration orchestrates all key layers of the OpenMandate stack:
1. **Protocol Core (`@openmandate/protocol`)**: EIP-712 domain hashing, money conversion primitives (`atomicToHumanUsd`, `parseAtomicAmount`), contract ABI definitions.
2. **SDK (`@openmandate/sdk`)**: Principal mandate creation (`createMandate`), revocation (`revokeMandate`), payment settlement (`pay`), merchant quote discovery (`fetchQuote`), and resource claiming (`claimOrder`).
3. **Merchant Service (`@openmandate/merchant-api`)**: Fastify-based HTTP 402 catalog endpoint, single-use nonce issuance, and independent verification of on-chain receipts and EIP-712 agent signatures.
4. **Agent Sandbox (`@openmandate/agent-runner`)**: `BoundedAgentToolbox` and `BoundedAgentRunner` enforcing explicit capability boundaries and recording auditable decision traces.
5. **Smart Contracts (`@openmandate/contracts`)**: Solidity implementations of `MandateVault` and `MockUSD` deployed in-memory.

---

## 8-Step Lifecycle Execution Details

| Step | Action | Counterparty | Invariant / Policy Verified | Result |
| :--- | :--- | :--- | :--- | :--- |
| **Step 1** | Mandate Creation | Principal (Owner) | 10.00 MockUSD budget, 2.00 MockUSD cap, 1 hour expiry | **PASS** — Mandate 1 created; Vault 100% solvent |
| **Step 2** | Quote Discovery | Agent & Merchant API | Catalog item `sample-report` quoted at 1.00 MockUSD | **PASS** — Within cap ($1 <= $2) and within budget ($1 <= $10) |
| **Step 3** | Payment Settlement | Agent on `MandateVault` | On-chain settlement via `mandateVault.pay(...)` | **PASS** — Merchant credited $1; Mandate budget decremented to $9 |
| **Step 4** | Verification & Fulfillment | Merchant Service | Independent receipt verification & EIP-712 signature check | **PASS** — Nonce consumed, claim verified |
| **Step 5** | Content Delivery & Trace | Agent | Report delivery and decision trace printing | **PASS** — Delivered: `"Sample Paid Intelligence Report: OpenMandate invariant verification succeeded."` |
| **Step 6** | Negative Test 1 | Agent on `MandateVault` | Overspend attempt: $3.00 MockUSD payment with $2.00 cap | **PASS** — Reverted on-chain with `CapExceeded` |
| **Step 7** | Negative Test 2 | Agent on `MandateVault` | Payment to unapproved merchant address | **PASS** — Reverted on-chain with `UnapprovedMerchant` |
| **Step 8** | Revocation & Escrow Refund | Principal on `MandateVault` | Principal revokes mandate, recovering remaining escrow | **PASS** — $9.00 refunded instantly; Subsequent payments revert with `MandateNotActive` |

---

## Verification & Execution Proof

### Running the Demo
```bash
node scripts/demo.mjs
# or via npm/pnpm script:
pnpm demo
```

### Clean Exit
- **Execution Time**: ~1.1s
- **Exit Code**: 0
- **Regression Check**: `pnpm verify` (all 6 gates: env check, claims check, release gates, typecheck, workspace tests, and contract tests) passed with 0 failures.
