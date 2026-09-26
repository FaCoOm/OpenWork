# HashKey Chain (HSK) Deployment & Explicit Access Architecture

**Status:** Verified & Integrated  
**Target Chain:** HashKey Chain Testnet (EVM L2)  
**Date:** 26 September 2026  

---

## 1. Executive Summary & Specification

In accordance with Section 7 and 8 of [`OpenWorks-Project-Brief.md`](../OpenWorks-Project-Brief.md), OpenWorks requires an auditable ticket-to-payment settlement pipeline deployed to and accessible explicitly via the **HashKey Chain (HSK)**.

This document records the exact chain network parameters, deployed contract architecture, one-command deployment workflow, and the live Web3 interface capabilities that make the protocol accessible directly through HashKey Chain.

---

## 2. HashKey Chain Verified Network Parameters

The following parameters have been verified against active HashKey Chain endpoints:

| Parameter | Value | Details / Verification Source |
| :--- | :--- | :--- |
| **Network Name** | `HashKey Chain Testnet` | Official HashKey L2 test network |
| **Chain ID (Decimal)** | `133` | Confirmed via `eth_chainId` returning `0x85` |
| **Chain ID (Hex)** | `0x85` | Used in EIP-3085 `wallet_addEthereumChain` |
| **Native Gas Currency** | `HSK` | 18 decimals (`HashKey EcoPoints`) |
| **Primary RPC Endpoint** | `https://testnet.hsk.xyz` | HTTP 200, active block production (~1s block time) |
| **Fallback RPC Endpoint** | `https://133.rpc.thirdweb.com` | High-availability secondary endpoint |
| **Block Explorer** | `https://testnet-explorer.hskchain.net` | Blockscout-based EVM block explorer |
| **Alternative Explorer** | `https://hashkey.blockscout.com` | Mainnet / ecosystem mirror |
| **Official Faucet** | `https://faucet.hsk.xyz` | Claim testnet HSK gas tokens |
| **Current Gas Price** | `~1.001 Gwei` | Low-fee, fast L2 settlement |

---

## 3. On-Chain Smart Contract Architecture

The core settlement layer is implemented in Solidity (`contracts/contracts/OpenWorksTreasury.sol`):

```
                        ┌─────────────────────────────────────┐
                        │          Fund Steward (EOA)         │
                        │   • Sets fixed spending mandate     │
                        │   • Approves repos & maintainers    │
                        │   • Emergency pause authority       │
                        └──────────────────┬──────────────────┘
                                           │
                                           ▼
┌───────────────────────┐       ┌─────────────────────────────────────┐
│ Champion Agent (EOA)  │──────▶│      OpenWorksTreasury.sol          │
│ • Proposes allocations│       │                                     │
│ • Within max bounty   │       │ • Fixed mandate boundaries          │
└───────────────────────┘       │ • Max bounty cap enforcement        │
                                │ • Minimum reserve floor invariant   │
┌───────────────────────┐       │ • Exactly-once ticket payout check  │
│  Maintainer (EOA)     │──────▶│ • Emergency pause switch            │
│ • Confirms fix & payee│       └──────────────────┬──────────────────┘
└───────────────────────┘                          │
                                                   ▼
                                ┌─────────────────────────────────────┐
                                │     MockTestToken.sol (tHSK ERC20)  │
                                │ • Bounded transfer to contributor   │
                                └─────────────────────────────────────┘
```

### Core Invariants Enforced by `OpenWorksTreasury.sol`:
1. **`ExceedsMaxBounty`**: Smart contract reverts if an allocation exceeds the mandate ceiling (e.g., 500 tHSK).
2. **`ReserveFloorViolated`**: Transactions cannot reduce available funds below `minUncommittedReserve` (e.g., 1,000 tHSK).
3. **`AlreadyReservedOrPaid`**: Every ticket ID can only ever be settled once; duplicate settlements are strictly rejected on-chain.
4. **`UnauthorizedCaller`**: Only registered maintainers can accept work and trigger payout to contributors.
5. **`EmergencyPause`**: Steward can freeze payouts instantly if anomalies are detected.

---

## 4. Deployment to HashKey Chain (Step-by-Step)

### Step 1: Generate or Configure Deployment Account
Generate a fresh EVM wallet:
```bash
npm run wallet:generate
```
Or set your existing key in `.env` or `contracts/.env`:
```bash
HSK_TESTNET_RPC=https://testnet.hsk.xyz
PRIVATE_KEY=0x...
```

### Step 2: Request Gas Tokens
Acquire testnet HSK from the official faucet:
- Visit **https://faucet.hsk.xyz**
- Paste your deployer address and request testnet HSK.

### Step 3: Execute Deployment Script
```bash
npm run deploy:hsk
```
The script will:
1. Verify the deployer balance on HashKey Chain Testnet (Chain ID 133).
2. Deploy `MockTestToken` (`tHSK`).
3. Deploy `OpenWorksTreasury` with fixed mandate limits and 90-day expiry.
4. Transfer 5,000 tHSK initial funding to the Treasury contract.
5. Approve the primary repository `openwork/core-engine` and register maintainers.
6. Automatically save deployment metadata to:
   - `contracts/deployments/hskTestnet.json`
   - `contracts/deployments/latest.json`
   - `web/src/config/deployed-contracts.json`
7. Automatically export compiled contract ABIs to `web/src/config/contracts-abi.json`.

### Step 4: Verify Deployment on HashKey Chain
Run the on-chain verification script:
```bash
npm run verify:hsk
```
This queries the live HashKey Chain RPC directly, reads the on-chain mandate parameters, verifies contract bytecode, and prints direct Blockscout explorer links.

---

## 5. Explicit Accessibility in the Web Application

The frontend (`web/`) is configured to make the HashKey Chain accessible and visible across all interfaces:

### 1. Persistent Top Network Bar (`HskNetworkBar.tsx`)
- **Live RPC Health & Block Counter**: Direct real-time polling of `https://testnet.hsk.xyz`, showing the latest block number and current gas price.
- **One-Click Wallet Connection**: Connects to MetaMask, OKX, Rabby, or any EIP-1193 browser wallet.
- **Auto Network Switching (Chain 133 / 0x85)**: If the user is on another network (e.g. Ethereum or Sepolia), clicking "Switch to HSK" sends an EIP-3085 `wallet_addEthereumChain` request with full HashKey Chain metadata.
- **Live Mode Toggle**: Easily switch between **Live HSK On-Chain Mode** (wallet transactions on testnet) and **Showcase Simulation Mode** (offline narrative demonstration).
- **Direct Explorer & Faucet Access**: Direct external links to `https://testnet-explorer.hskchain.net` and `https://faucet.hsk.xyz`.

### 2. Contributor Directory (`contributor/page.tsx`)
- One-click **"Use Connected HSK Wallet"** autofills the contributor's bound payout address directly from their connected HashKey wallet.

### 3. Fund Steward Portal (`steward/page.tsx`)
- **On-Chain Settlement Registry**: Explicitly displays the deployed `OpenWorksTreasury` and `MockTestToken` addresses on HashKey Chain with direct links to the block explorer.

### 4. 3-Minute Showcase (`NarrativeShowcase.tsx`)
- In Phase 3 (1:05–1:55), users can click **"Sign Live Transaction on HashKey Testnet"** to execute real contract settlements with MetaMask, or use the instant simulation flow.
- All transaction receipts link directly to the official HashKey Chain explorer (`https://testnet-explorer.hskchain.net/tx/<hash>`).
