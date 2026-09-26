# Web3 Architecture Analysis: Smart Contract Settlement vs. Frontend Hosting

**Question Addressed:** Is OpenWorks "hosted on the HSK Chain itself"?  
**Short Answer:** No, and technically **no traditional website is hosted directly inside an EVM blockchain**.

---

## 1. Technical Clarification: Blockchain vs. Web Hosting

| Component | Where it Runs | Technology | Role |
| :--- | :--- | :--- | :--- |
| **Smart Contracts** | **On HashKey Chain (HSK)** | EVM Bytecode (Solidity) | Enforces spending rules, escrow, maintainer verification, and token settlement. |
| **Blockchain Node / RPC** | **HashKey Network Nodes** | Geth / OP Stack / AltLayer | Validates blocks, executes EVM transactions, responds to JSON-RPC at `https://testnet.hsk.xyz`. |
| **Frontend Web App** | **Client / Host Server (or IPFS)** | Next.js, React, HTML, CSS, JS | Renders user interface, prompts wallet signing (MetaMask), queries RPC for on-chain state. |

---

## 2. Why EVM Chains Do Not "Host" Websites

1. **EVM is a State Machine, Not an HTTP Server**:
   EVM blockchains (Ethereum, Arbitrum, HashKey Chain) store state (variables, mapping balances, code) and execute transactions deterministically. They do not listen on TCP ports (like port 80/443/3000) or serve HTTP requests.

2. **Storage Costs & Gas Limits**:
   Storing 1 MB of frontend JavaScript code inside EVM smart contract bytecode (`SSTORE`) would cost thousands of dollars in gas and exceeds block gas limits.

3. **How Web3 Applications Actually Work**:
   Virtually all Web3 DApps (Uniswap, Aave, Gitcoin, OpenWorks) follow a two-tier architecture:
   - **Tier 1 (The DApp UI)**: Hosted on Vercel, AWS, a local server, or decentralized storage (IPFS/Arweave).
   - **Tier 2 (The On-Chain Contracts)**: Deployed to the blockchain (HashKey Chain) where custody and rules live.

---

## 3. How to Make the Frontend Itself Fully Decentralized

If the goal is to make the website's front-end code as decentralized and immutable as the smart contracts, Web3 projects use:

1. **IPFS / Arweave Static Build**:
   Export Next.js to static files (`next export` / `output: 'export'`) and pin the build folder to IPFS or permanent Arweave storage.

2. **On-Chain Pointer (HashKey Chain)**:
   Add an on-chain immutable string or hash to the smart contract:
   ```solidity
   string public frontendIpfsCID = "ipfs://Qm...";
   ```
   Anyone querying the contract on HashKey Chain can retrieve the exact IPFS CID of the verified website.

3. **Decentralized DNS / ENS**:
   Binding the IPFS CID to a domain (e.g. `.eth` or `.hsk`) so browsers like Brave or Opera resolve it directly without centralized DNS.
