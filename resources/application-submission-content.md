# OpenWork — Project Application Submission Content

> **Ready-to-Submit Copy for Hackathon & Grant Applications**  
> *Sydney AI x Web3 Hackathon / HashKey Track*

---

## 1. Challenges I Ran Into

*Prompt: Tell us about any specific bug or hurdle you ran into while building this project. How did you get over it? (Markdown supported)*

```markdown
### 1. Bridging Non-Deterministic AI Scoring with Deterministic Smart Contract Invariants
**The Hurdle**: The central technical challenge of OpenWork was avoiding the "Unbounded Agent" trap. Giving an autonomous LLM direct wallet keys or unrestricted ability to call smart contracts is an existential security flaw—hallucinations, prompt injection, or float arithmetic quirks could allow an agent to drain treasury funds or exceed spending mandates.
**The Solution**: We implemented the **Deterministic Policy Engine** as a strict, non-bypassable intermediary between the agent's semantic ranking and the EVM smart contract (`OpenWorksTreasury.sol`). The Policy Engine evaluates 9 hard mathematical checks (e.g., repository whitelist, duplicate ticket hash, max bounty ceiling, minimum uncommitted reserve floor) before any on-chain call can be signed. We also implemented modern Solidity `0.8.24` custom errors (`ExceedsMaxBounty`, `AlreadyReservedOrPaid`, `InsufficientReserveFloor`) that revert transactions on-chain if an agent or caller attempts an invalid state transition.

### 2. HashKey Chain (HSK Testnet Chain ID 133) Web3 Integration & Custom Error Decoding
**The Hurdle**: Deploying and integrating with HashKey Chain Testnet presented hurdles around wallet onboarding, gas token vs. test ERC-20 token semantics (native tHSK gas vs. `MockTestToken` escrow tokens), and decoding custom contract revert errors in Ethers v6 / Next.js 15. Standard EVM tools often treat custom errors as generic execution reverts.
**The Solution**: 
- Configured a dedicated Hardhat environment matching HashKey's EVM specifications, deploying verified contracts on Chain ID `133`.
- Built a native **EIP-3085** auto-switch hook in the frontend, enabling any user to add or switch to HashKey Testnet in MetaMask with a single click.
- Implemented client-side ABI error interface parsing (`contract.interface.parseError(data)`) so that contract reverts cleanly display exact diagnostic names (`AlreadyReservedOrPaid`, `ExceedsMaxBounty`) directly in the UI during our demo.

### 3. Agent Overfitting and Credential-Independent Local Evaluation
**The Hurdle**: We wanted an evolving multi-agent population (evolutionary strategy pattern) that competes to prioritize urgent issues, but relying on third-party cloud LLMs for every scoring loop made local testing slow, costly, and brittle. Furthermore, small test datasets risk severe overfitting.
**The Solution**: We decoupled **semantic feature extraction** from **policy optimization**:
- The multi-agent system runs locally as pure mathematical policy vectors ($\mathbf{W} \cdot \mathbf{F}$) with Fisher-Yates mutation and bounded Gaussian weight adjustments, executing with zero external API dependencies.
- To prevent overfitting, we created a 12-case historical replay corpus with **strict holdout isolation**: 5 training cases are completely partitioned from 3 unseen holdout validation benchmarks.
- Introduced an **overconfidence penalty** in the fitness function that heavily penalizes agents that propose funding for tasks that subsequently fail verification.
```

---

## 2. The Problem It Solves

*Prompt: Describe what can people use it for, or how it makes existing tasks easier/safer, etc. (Markdown supported)*

```markdown
### The Problem: The Open-Source Infrastructure Triage & Funding Crisis
Modern digital infrastructure relies on open-source repositories maintained by exhausted, unpaid developers. This creates a triple failure:
1. **Maintainer Triage Burnout**: Maintainers drown in mixed backlogs where trivial spelling cleanups obscure critical network-partition deadlocks or security vulnerabilities.
2. **Opaque & Slow Grant Allocations**: Traditional foundations and DAOs rely on quarterly committee votes or popularity-driven quadratic funding rounds. They are too slow for urgent zero-day bugs and disproportionately reward high-marketing projects over critical, low-visibility plumbing.
3. **The Unsafe "AI Agent" Dilemma**: Naive attempts to automate bounties using AI agents risk treasury drain, lack proof of reproduction, and fail to verify whether merged code actually solves the reported issue.

---

### What People Can Use OpenWork For

- **For Foundation Stewards & Donors**: Programmatically deploy a fixed treasury pool with hard spending boundaries (max caps, whitelisted repos, reserve floors). The steward sets the cause (e.g., *"P2P Consensus Resilience"*), and the autonomous agent population continuously and defensibly allocates bounties without manual committee delays.
- **For Open-Source Maintainers**: Automatically convert messy GitHub issues into structured bounties with objective acceptance conditions (passing test suites, repro traces). Maintainers maintain full sovereignty: bounties only pay out when the maintainer verifies and accepts the PR.
- **For Contributors**: Discover clearly specified, funded bounties with transparent payout terms. Contributors link their PR and bind their EVM address, receiving guaranteed, instantaneous one-time settlement upon merge.
- **For Public Observers & Auditors**: Follow a tamper-proof cryptographic audit trail linking: `GitHub Issue` $\rightarrow$ `Agent Weight Rationales` $\rightarrow$ `Policy Verdict` $\rightarrow$ `Maintainer Attestation` $\rightarrow$ `HashKey On-Chain Transaction Hash`.

---

### How OpenWork Makes Funding Safer and More Efficient

1. **Zero-Custody AI Architecture**: The AI agents have zero custody of private keys or funds. The EVM smart contract (`OpenWorksTreasury.sol`) acts as the supreme authority, guaranteeing that allocations can never exceed mandate ceilings or breach uncommitted reserve floors.
2. **Mathematical Invariant Enforcement**: Exactly-once payout protection prevents double-spending; maintainer signature checks prevent unauthorized release; and self-dealing checks flag conflicts of interest.
3. **Evidence-First Verification**: Unlike static bounty boards, OpenWork requires verified reproduction logs and automated test traces before a bounty can be reserved, ensuring public goods funds only reward verified, high-impact fixes.
4. **Evolving, Transparent Intelligence**: Competing agent strategies (Strategy Engine) allow the triage logic to evolve and improve over time while keeping all decision weights 100% visible and auditable.
```

---
*Created for OpenWork project application, September 2026.*
