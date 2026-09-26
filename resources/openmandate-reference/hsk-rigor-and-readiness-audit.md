# OpenMandate — Architectural Rigor, HSK Integration, and Ethereum Readiness Audit

**Date**: 2026-09-26  
**Query**: Compare the existing project against your hunch that the implementation is not as rigorous as expected, is not properly integrated with HSK Chain, and clarify whether it is currently functional as an Ethereum application.

---

## 1. Executive Verdict: Your Hunch is Accurate

Your intuition is **spot-on**. While the smart contract (`MandateVault.sol`), the verification engine (`packages/verifier`), and the merchant backend (`apps/merchant-api`) are implemented with strict cryptographic and stateful rigor, the **system as a whole is currently operating as a local in-memory simulation rather than a live, deployed Ethereum/HSK dApp**.

---

## 2. Deep Dive: What is Genuinely Rigorous vs. What is Simulated

| Architectural Layer | Reality / Current State | Rigor Level | Honest Limitation |
|---|---|---|---|
| **Smart Contract (`MandateVault.sol`)** | Real, idiomatic Solidity 0.8.24 with OpenZeppelin `SafeERC20`, `ReentrancyGuard`, checks-effects-interactions, and fee-on-transfer rejection. | **High (9/10)** | Passing 13 invariant and security tests locally. |
| **Receipt & Signature Verifier (`packages/verifier`)** | Real EIP-712 structured data verification (`verifyTypedData`), canonical block hash reorg detection, confirmation depth checks. | **High (9/10)** | Production-grade cryptographic decoding via `viem`. |
| **Merchant Backend (`apps/merchant-api`)** | Real Fastify service with SQLite WAL mode, atomic `BEGIN IMMEDIATE` transactions, and 20-worker concurrency tests. | **High (8.5/10)** | Genuinely idempotent and replay-proof. |
| **HSK Chain Integration** | **Preflight Only**. Currently tested only on local Hardhat EVM (Chain ID 31337). No transactions have been submitted to HSK Testnet (Chain ID 133). | **Low (3/10)** | The deployment script exists (`scripts/deploy/deploy.mjs`), but no live contract or explorer hash exists yet. |
| **Owner Dashboard (`apps/dashboard`)** | **Mocked / Visual Prototype**. The React components use hardcoded `useState` data rather than querying an RPC provider with Viem/Wagmi. | **Low (2.5/10)** | Clicking "Revoke" modifies local browser memory, not the blockchain. |
| **Agent Runner (`apps/agent-runner`)** | **Deterministic Scripted Runner**. Validates quotes against policy deterministically without connecting to a live OpenAI/Anthropic LLM API. | **Medium (5/10)** | Prevents prompt injection by omitting the LLM, but doesn't demonstrate autonomous AI reasoning. |

---

## 3. Is It Functional as an Ethereum Application?

### Protocol & Code Level: **YES**
The application is 100% EVM-native:
1. **Solidity**: Compiles to standard EVM bytecode and runs on any EVM chain (Ethereum, HSK, Arbitrum, Base).
2. **EIP-712**: Follows the Ethereum typed structured data standard for single-use agent claim challenges.
3. **RPC & Tooling**: Uses standard JSON-RPC (`eth_getTransactionReceipt`, `eth_getBlockByNumber`, `eth_call`, `eth_sendRawTransaction`).

### Deployment & User Experience Level: **NO (Not Yet)**
As an end-user looking to test it right now:
- You cannot connect a MetaMask wallet to the dashboard and see your real HSK testnet tokens.
- You cannot look up the contract on `https://testnet-explorer.hsk.xyz` because it has not been deployed to the live network.
- The `pnpm demo` runs against a transient, in-memory Hardhat node that disappears the millisecond the process exits.

---

## 4. Comparison to Competitors (AllScale, SafeFlow, sumplus-hsk-mandate)

| Feature | OpenMandate (This Repo) | AllScale Gateway | SafeFlow / SumPlus |
|---|---|---|---|
| **Contract Spending Limits** | ✅ Enforced strictly on-chain | ✅ Enforced on-chain | ✅ Enforced on-chain |
| **Receipt Verification** | ✅ Cryptographic EIP-712 + Event log decoding | ⚠️ Basic webhook / tx-hash check | ⚠️ Basic signature check |
| **Double-Spending Defense** | ✅ Global `(merchant, orderId)` vault replay defense + SQLite WAL | ⚠️ Merchant-level order state | ⚠️ Contract-level |
| **Live HSK Testnet Deployment** | ❌ **Local Only (Pending Faucet Gas)** | ✅ Deployed on HSK Testnet | ✅ Deployed on HSK Testnet |
| **Web3 Wallet Connection** | ❌ **Mocked State in UI** | ✅ WalletConnect / MetaMask | ✅ MetaMask |
| **Autonomous LLM Loop** | ❌ **Deterministic Tool Mock** | ⚠️ Scripted Agent | ⚠️ Scripted Agent |

---

## 5. What is Required to Make It a Live, Legitimate HSK Application

To upgrade this project from a local prototype to a fully integrated live HSK application:

1. **Fund an HSK Testnet Account**:
   - Obtain a disposable private key.
   - Request testnet HSK gas from `https://hskchain.net/faucet`.
2. **Execute Deployment to HSK Testnet (Chain ID 133)**:
   - Run `set OWNER_PRIVATE_KEY=0x...` and `node scripts/deploy/deploy.mjs`.
   - Record the deployed `MockUSD` and `MandateVault` contract addresses and explorer links.
3. **Connect the Dashboard to Real Chain State**:
   - Replace the hardcoded `useState` in `apps/dashboard/src/app/page.tsx` with a `createPublicClient` call to `https://testnet.hsk.xyz`.
   - Read live `mandates(1)` and token balances.
