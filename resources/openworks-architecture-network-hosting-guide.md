# OpenWorks: Comprehensive Architectural Breakdown & Web3 Infrastructure Guide

**Document Target:** Foundation Building Blocks, Web3 Stack (Network, RPC, Wallet, Explorer), and DApp Hosting Architecture  
**Project:** OpenWorks — Verifiable Public-Goods Grant & Bounty Allocator  
**Target Chain:** HashKey Chain Testnet (EVM L2)  
**Date:** September 2026  

---

## 1. Complete Project Breakdown: The 4 Foundational Pillars

OpenWorks bridges **autonomous AI agent intelligence** with **immutable, deterministic smart contract settlement** to fund open-source software maintenance.

```
┌────────────────────────────────────────────────────────────────────────┐
│                     1. MAINTAINER TICKET INTAKE                        │
│  • Scrapes & parses issues from approved GitHub repositories           │
│  • Validates reproduction logs, maintainer authorizations, test cases │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    2. STRATEGY AGENT POPULATION                        │
│  • Multi-agent evolutionary tournament (Champion & Shadow agents)      │
│  • Multi-objective ranking: Urgency, Breadth, Public Benefit,          │
│    Feasibility, Evidence Confidence                                    │
│  • Mutation & replay scoring against held-out benchmark historical data│
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                  3. DETERMINISTIC POLICY ENGINE                        │
│  • 9 unskippable mathematical & logical policy checks                  │
│  • Prevents double-claims, over-cap payouts, unverified repos          │
│  • Verdicts: ELIGIBLE | REVIEW_REQUIRED | BLOCKED                      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                 4. ON-CHAIN SETTLEMENT (HASHKEY CHAIN)                 │
│  • OpenWorksTreasury.sol (Custody, Escrow, Invariant Enforcement)      │
│  • MockTestToken.sol (ERC20 tHSK Bounties)                             │
│  • Hard reverts: ExceedsMaxBounty, ReserveFloorViolated,               │
│    AlreadyReservedOrPaid, UnauthorizedCaller                           │
└────────────────────────────────────────────────────────────────────────┘
```

### Pillar 1: Maintainer Ticket Intake Parser
- **Role**: Ingestion gatekeeper.
- **Function**: Takes raw GitHub issues or community bug submissions, extracts machine-readable criteria, verifies that the target repository is in the Steward's approved list, and validates whether actionable reproduction logs exist.

### Pillar 2: Multi-Agent Strategy Intelligence Engine
- **Role**: Adaptive priority evaluation.
- **Function**: Autonomous agents evaluate and rank competing tickets. Rather than a black-box LLM making spending decisions, each agent has an explicit, interpretable parameter matrix (weights on Urgency, Breadth of Effect, Public Benefit, Feasibility, and Evidence Confidence).
- **Evolution**: Agents undergo mutation and evaluation against a **replay corpus** with strictly segregated **holdout benchmarks** to prevent overfitting. The highest-performing agent becomes the active **Champion**.

### Pillar 3: Verifiable Policy Engine
- **Role**: Mathematical guardrails between AI agents and financial custody.
- **Function**: Evaluates every allocation proposal against 9 deterministic rules:
  1. Approved repository check.
  2. Max bounty cap enforcement (e.g., $\le$ 500 tHSK).
  3. Minimum reserve floor protection (e.g., maintaining $\ge$ 1,000 tHSK uncommitted).
  4. Non-zero ticket valuation.
  5. Contributor address format check.
  6. Exactly-once claim prevention.
  7. Reproduction log presence check.
  8. Maintainer signature requirement.
  9. Fund expiry check.
- **Verdicts**: Returns `ELIGIBLE` (proceed to reservation), `REVIEW_REQUIRED` (requires manual evidence), or `BLOCKED` (immediate rejection).

### Pillar 4: EVM Settlement Layer (`contracts/contracts/OpenWorksTreasury.sol`)
- **Role**: Non-custodial escrow and cryptographic enforcement.
- **Function**: Holds fund tokens, locks reservations upon Champion recommendation, and executes payouts exclusively when an authorized repository maintainer signs off on accepted PR work.
- **Invariants**: Guarantees that AI agents can never drain funds, exceed spending caps, or bypass maintainer approvals.

---

## 2. Web3 Foundation Building Blocks Explained

### A. Network (The Blockchain Layer)
- **What it is**: The decentralized, state-synchronized distributed ledger where transactions are processed and contract state is permanently stored.
- **OpenWorks Network**: **HashKey Chain Testnet**
  - **Type**: Ethereum Layer 2 (L2) Rollup / EVM-Compatible Network.
  - **Chain ID**: `133` (Hexadecimal: `0x85`).
  - **Native Gas Token**: `HSK` (18 decimals). Used to pay network validators/sequencers for EVM computation and storage.
  - **Application Token**: `tHSK` (ERC20 Mock Token deployed for bounty allocations).

### B. RPC (Remote Procedure Call)
- **What it is**: The communication bridge (API protocol) that enables Web3 apps, libraries (`ethers.js`, `viem`, `web3.js`), and user wallets to talk to nodes on the HashKey Chain network.
- **How it works**:
  - **Read Queries** (`eth_call`, `eth_blockNumber`, `eth_getBalance`): Free of gas, queries current state (e.g. Treasury balance, mandate details).
  - **Write Transactions** (`eth_sendRawTransaction`): Submits signed transaction payloads to the mempool for block inclusion.
- **Configured RPC Endpoints in OpenWorks**:
  - **Primary**: `https://testnet.hsk.xyz`
  - **Fallback / Alternative**: `https://133.rpc.thirdweb.com`

### C. Wallet (Identity, Signing & Key Custody)
- **What it is**: An asymmetric cryptographic key pair (Private Key + Public Ethereum Address / EOA).
  - **Private Key**: Kept secret, used to cryptographically sign messages and transactions.
  - **Public Address**: 42-character hexadecimal string (`0x...`) that represents the user or contract on-chain.
- **Roles in OpenWorks**:
  1. **Fund Steward Wallet**: Deposits funds, configures spending mandates, approved repos, and reserve floors. Holds emergency pause rights.
  2. **Champion Agent Wallet**: Proposes bounty allocations according to strategy rankings.
  3. **Maintainer Wallet**: Verifies code PRs, confirms acceptance criteria, and triggers the payout.
  4. **Contributor Wallet**: Receives the ERC20 bounty token (`tHSK`) settlement.
  5. **MetaMask / EIP-1193 Browser Wallet**: Used in `web/` to interactively sign transactions via EIP-3085 (`wallet_addEthereumChain`).

### D. Block Explorer
- **What it is**: A public web search engine and ledger indexer that provides full visibility into every block, transaction, smart contract code, event log, and account balance.
- **Configured Explorer in OpenWorks**:
  - **Primary**: `https://testnet-explorer.hskchain.net` (Blockscout instance)
  - **Ecosystem Mirror**: `https://hashkey.blockscout.com`
- **Explorer Capabilities**:
  - Track payout transaction hashes (e.g., `https://testnet-explorer.hskchain.net/tx/0x...`).
  - Inspect contract bytecode and verified Solidity source code.
  - Read public variables (`steward`, `mandate`, `minUncommittedReserve`).
  - Verify ERC20 token transfers and emitted events (`TicketPaid`, `MandateCreated`).

---

## 3. Can OpenWorks Be Hosted Inside the Block Explorer as a Subdomain?

### The Direct Answer: **No, not as an arbitrary website host.**

### Why? (Technical Reasons)

1. **Domain Ownership & DNS Sovereignty**:
   - `testnet-explorer.hskchain.net` is a domain owned and administered exclusively by the HashKey network infrastructure team and Blockscout operators.
   - Creating a subdomain (e.g., `openworks.testnet-explorer.hskchain.net`) requires access to HashKey's authoritative DNS zone records (A/CNAME records) and SSL/TLS certificate issuing authorities (Let's Encrypt / DigiCert / Cloudflare).

2. **Block Explorers Are Analytical Indexers, Not Web Hosting Servers**:
   - A block explorer (like Etherscan or Blockscout) runs indexing engines (PostgreSQL, ClickHouse, node listeners) and web frontends dedicated to inspecting blocks, addresses, and transactions.
   - They do not offer generic website hosting (PaaS), Node.js application hosting, or arbitrary static web hosting to developers.

3. **Blockchains & Explorers Do Not Serve HTTP/HTML**:
   - The EVM executes bytecode deterministically in a closed sandbox. It has no networking stack, does not listen on HTTP/HTTPS ports (80/443), and cannot serve Next.js web applications.

---

## 4. How DApps Actually Integrate With Block Explorers & Web3 Hosting

While you cannot host OpenWorks as an arbitrary subdomain of HashKey's explorer, here is how the Web3 ecosystem handles this relationship:

### Option 1: Block Explorer DApp Marketplace / Directory (Blockscout DApp Store)
- Blockscout features a built-in **DApp Marketplace** (accessible via `/apps` in modern Blockscout explorers).
- Project teams submit their DApp metadata (Name, URL, Logo, Contract Addresses).
- Users browsing the HashKey Explorer can discover OpenWorks and open it embedded inside an iframe or as a verified ecosystem app directly from the explorer UI!

### Option 2: Direct Explorer "Read/Write Contract" Portal
- Once you verify your Solidity source code on `testnet-explorer.hskchain.net` (using Hardhat or Blockscout API):
  - Users can navigate directly to `https://testnet-explorer.hskchain.net/address/0xB50b7B22DFaF8bA1eD90467C7DA68DaCEcbA0463#writeContract`.
  - The block explorer renders an interactive form for every public function (`reserveBounty`, `confirmFixAndPayout`, `pause`).
  - Users connect MetaMask directly to the block explorer and execute contract functions without needing any external website.

### Option 3: Production Web Hosting (Cloud / Edge)
- Host the Next.js portal on:
  - **Vercel / Cloudflare Pages / AWS Amplify / Netlify**: Connects to your custom domain (e.g., `openworks.network` or `hsk-openworks.vercel.app`).
  - The frontend connects to HashKey Chain via the RPC URL `https://testnet.hsk.xyz` and prompts the user's browser wallet.

### Option 4: True Decentralized Web3 Hosting (IPFS + Decentralized Domains)
- **Static Export**: Build Next.js to pure static HTML/JS (`output: 'export'`).
- **IPFS / Arweave**: Pin the build folder to IPFS (InterPlanetary File System).
- **On-Chain Pointer**: Store the IPFS Content Identifier (CID) in the smart contract itself:
  ```solidity
  string public constant FRONTEND_IPFS_CID = "ipfs://Qm...";
  ```
- **Web3 DNS (ENS / HSK Name Service)**: Map `openworks.hsk` or `openworks.eth` to the IPFS CID.
