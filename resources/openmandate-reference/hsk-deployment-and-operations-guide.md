# OpenMandate — Live HSK Chain Deployment & Operations Guide

**Version**: 1.0 (Hackathon Reference Edition)  
**Target Network**: HSK Chain Testnet  
**Chain ID**: `133`  
**RPC URL**: `https://testnet.hsk.xyz`  
**Explorer URL**: `https://testnet-explorer.hsk.xyz`  
**Faucet URL**: `https://hskchain.net/faucet`

---

## 1. Operational Architecture & Component Connections

To understand whether OpenMandate is properly operating, this diagram maps how every layer interacts and where the trust boundaries lie:

```mermaid
sequenceDiagram
    autonumber
    actor Principal as Human Principal (Owner)
    participant Vault as MandateVault.sol (HSK Chain)
    actor Agent as Autonomous Agent
    participant API as Fastify Merchant API
    participant Verifier as Receipt & Signature Verifier

    Note over Principal,Vault: Phase 1: Policy Setup & Escrow Funding
    Principal->>Vault: createMandate(agent, [merchant], budget=$10, cap=$2, 1h)
    Vault-->>Principal: MandateCreated(mandateId=1, liabilities=$10)

    Note over Agent,API: Phase 2: Quote Discovery & Policy Check
    Agent->>API: GET /quotes/sample-report
    API-->>Agent: HTTP 402 (orderId, amount=$1, resourceHash, expiresAt)
    Agent->>Agent: Check: merchant approved? $1 <= cap ($2)? $1 <= remaining ($10)?

    Note over Agent,Vault: Phase 3: On-Chain Settlement
    Agent->>Vault: pay(mandateId=1, merchant, amount=$1, orderId, resourceHash)
    Vault->>Vault: Verify: msg.sender==agent, merchant in allowlist, amount<=cap, order unused
    Vault->>Vault: Transfer $1 MockUSD to merchant; mark orderId settled
    Vault-->>Agent: Emit PaymentSettled(mandateId=1, txHash, orderId)

    Note over Agent,API: Phase 4: Cryptographic Claim & Delivery
    Agent->>API: GET /orders/:orderId/nonce?agent=:agentAddress
    API-->>Agent: Challenge Nonce (expires in 120s)
    Agent->>Agent: Sign EIP-712 MerchantClaim(orderId, txHash, nonce, agent)
    Agent->>API: POST /orders/:orderId/claim { txHash, nonce, signature }
    API->>Verifier: verifyPaymentReceipt(txHash, orderId, amount, merchant)
    Verifier->>Vault: Check transaction receipt, canonical block, PaymentSettled log
    API->>Verifier: verifyClaimSignature(signature, nonce, agent)
    API->>API: Atomic DB transaction: mark nonce consumed, store fulfillment
    API-->>Agent: HTTP 200 { report: "Delivered content..." }

    Note over Principal,Vault: Phase 5: Reclaiming Unspent Escrow
    Principal->>Vault: revoke(mandateId=1)
    Vault->>Vault: Calculate: unspent = totalBudget ($10) - spent ($1) = $9
    Vault->>Principal: Transfer $9 MockUSD back to Principal
    Vault-->>Principal: Emit MandateRevoked(mandateId=1, unspentRefund=$9)
```

---

## 2. Step-by-Step Live HSK Testnet Deployment Runbook

Follow these exact steps to transition OpenMandate from local simulation to live on-chain operations on HSK Testnet:

### Step 2.1: Prepare Deployer Account & Gas
1. Generate or export a disposable EVM private key (never use a mainnet key with real assets).
2. Get the public address of your private key:
   ```bash
   node -e "const { privateKeyToAccount } = require('viem/accounts'); console.log(privateKeyToAccount(process.env.OWNER_PRIVATE_KEY).address)"
   ```
3. Visit the **HSK Testnet Faucet**: [https://hskchain.net/faucet](https://hskchain.net/faucet).
4. Request testnet `HSK` gas tokens to your deployer address.

### Step 2.2: Run Network Preflight Check
Verify RPC connectivity and gas balance:
```powershell
$env:HSK_RPC_URL="https://testnet.hsk.xyz"
$env:HSK_CHAIN_ID="133"
$env:OWNER_PRIVATE_KEY="0xYOUR_PRIVATE_KEY_HERE"

node scripts/deploy/preflight.mjs
```
**Expected Output:**
```text
[HSK TESTNET PREFLIGHT CHECK]
 - Target RPC: https://testnet.hsk.xyz
 - Expected Chain ID: 133
 - Connected Chain ID: 133
 - Deployer Account: 0x...
 - Native Gas Balance: 0.5 HSK
[PREFLIGHT SUCCESS] HSK connection verified.
```

### Step 2.3: Deploy Contracts to HSK Testnet
Execute the automated deployment script:
```powershell
node scripts/deploy/deploy.mjs
```
**What this script performs:**
1. Deploys `MockUSD` (6 decimals ERC-20).
2. Deploys `MandateVault` bound to `MockUSD`.
3. Mints 100 demo `MockUSD` tokens to your deployer account.
4. Generates `deployments/manifest-133.json` with contract addresses, transaction hashes, and explorer links.

### Step 2.4: Verify on HSK Explorer
Open your generated explorer links:
- `https://testnet-explorer.hsk.xyz/address/<MANDATE_VAULT_ADDRESS>`
- `https://testnet-explorer.hsk.xyz/address/<MOCK_USD_ADDRESS>`

---

## 3. Connecting the Merchant API & Dashboard to Live HSK

Once deployed, point your services to the deployed addresses:

### Step 3.1: Start the Fastify Merchant API on Live Testnet
Create an `.env` or set environment variables:
```powershell
$env:HSK_RPC_URL="https://testnet.hsk.xyz"
$env:HSK_CHAIN_ID="133"
$env:MANDATE_VAULT_ADDRESS="0x<DEPLOYED_VAULT_ADDRESS>"
$env:MOCK_USD_ADDRESS="0x<DEPLOYED_MOCK_USD_ADDRESS>"
$env:MERCHANT_ADDRESS="0x<YOUR_MERCHANT_WALLET_ADDRESS>"
$env:MERCHANT_PORT="4020"

pnpm --filter @openmandate/merchant-api start
```
The API is now listening at `http://127.0.0.1:4020` and validates receipts directly against the HSK Testnet RPC!

### Step 3.2: Connecting the Dashboard UI to Real Chain Data
In `apps/dashboard/src/app/page.tsx`, replace the mock state with a live Viem public client:
```typescript
import { createPublicClient, http } from 'viem';
import { MANDATE_VAULT_ABI } from '@openmandate/protocol';

const publicClient = createPublicClient({
  transport: http(process.env.NEXT_PUBLIC_HSK_RPC_URL || 'https://testnet.hsk.xyz')
});

// Fetch live on-chain mandate state:
async function loadLiveMandate(mandateId: bigint, vaultAddress: `0x${string}`) {
  const mandate = await publicClient.readContract({
    address: vaultAddress,
    abi: MANDATE_VAULT_ABI,
    functionName: 'getMandate',
    args: [mandateId]
  });
  return mandate;
}
```

---

## 4. Live 3-Minute Hackathon Demo Script

During the 3-minute hackathon showcase, execute these steps live:

| Time | Action | Command / Screen | What Judges See |
|---|---|---|---|
| **0:00 - 0:45** | **Set Policy & Escrow** | `pnpm demo` (Step 1) or Dashboard | Owner deposits 10 MockUSD, sets $2 cap, 1 approved merchant. Vault verifies 100% solvency. |
| **0:45 - 1:30** | **Agent Payment & Delivery** | `pnpm demo` (Steps 2-5) | Agent compares quotes, pays $1 on-chain. Merchant independently verifies HSK receipt & EIP-712 signature, and serves the report. |
| **1:30 - 2:15** | **Firewall Enforcement** | `pnpm demo` (Steps 6-7) | Agent attempts $3 overspend $\rightarrow$ **Reverted on-chain with `CapExceeded`**. Attempt to pay unauthorized vendor $\rightarrow$ **Reverted with `UnapprovedMerchant`**. |
| **2:15 - 3:00** | **Instant Refund** | `pnpm demo` (Step 8) | Owner revokes mandate $\rightarrow$ Unspent $9 MockUSD is **atomically refunded** to owner. Vault remains 100% solvent. |

---

## 5. Troubleshooting & Operational Failure Modes

1. **Transaction Pending / Mining Delays**:
   - *Symptom*: Merchant API returns `PENDING_CONFIRMATIONS`.
   - *Fix*: The merchant requires `confirmationDepth` (default: 1 block). Allow 2-4 seconds for HSK block inclusion before polling claim.
2. **Late-Quote Settlement**:
   - *Symptom*: Transaction settles after `quote.expiresAt`.
   - *Behavior*: Merchant API rejects the claim with `QUOTE_EXPIRED_AT_SETTLEMENT`.
   - *Mitigation*: Client SDK applies `QUOTE_SAFETY_BUFFER_SECONDS = 30` to prevent broadcasting transactions close to quote expiration.
3. **Mempool Order-Poisoning (Documented v1 Limitation)**:
   - *Symptom*: Another party submits `pay` for the same `(merchant, orderId)`.
   - *Behavior*: The orderId is burned globally.
   - *Mitigation*: Merchant generates cryptographically secure 256-bit random order IDs. (v2 roadmap implements merchant-signed quotes).
