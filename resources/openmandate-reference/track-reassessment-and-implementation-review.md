# OpenMandate — Hackathon Track Reassessment & Implementation Strategy Review

**Reference Document**: [Official EAG & HSK Submission Guidelines (Google Doc)](https://docs.google.com/document/d/1E2RP5ij_B1mYZaOH405Ezq-5iCccf-O8DUFhLnoK7LU/mobilebasic)  
**Date & Time**: 26 September 2026, ~12:45 AEST  
**Submission Deadline**: **14:00 AEST (Hard cutoff today)**  
**Demo Window**: 14:00 – 16:30 AEST (5 mins: 3 min Showcase + 2 min Q&A)

---

## 1. Track Mapping & Eligibility Reassessment

### Official Submission Rule Clarification
In [OpenMandate-Project-Profile.md](file:///c:/Users/Fate_Conqueror/GitHub/OpenMandate/OpenMandate-Project-Profile.md) and [release-gates.md](file:///c:/Users/Fate_Conqueror/GitHub/OpenMandate/docs/release-gates.md), `GATE-RULES` was previously marked `BLOCKED_EXTERNAL` due to uncertainty about dual-pool entry on Devfolio (`https://eag-global-buildathon.devfolio.co/`).

The official guideline **resolves this gate with 100% clarity**:
> *"2.1 All projects participating in the IRL hackathon MUST select **Sydney Hackathon**."*  
> *"2.2 Then, select the track that best matches your project, such as **AI x Ethereum & Agent Economy**."*  
> *"2.3 If your project is also participating in the HSK Chain Track, you **MUST select HSK Chain as well**."*

### Track 1: EAG Track
- **Primary Track**: **AI x Ethereum & Agent Economy**
  - **Official Track Focus**: *"agent payment middleware, autonomous service payments, agent identity, agent reputation, permissioned agent wallets, and safe spending policies for AI agents."*
  - **Fit Evaluation**: **Near-perfect match (10/10)**. OpenMandate's core functionality—a programmable spending firewall, per-payment caps, time-limited escrow budgets, and merchant allowlisting—is literally the definition of *"safe spending policies for AI agents"* and *"agent payment middleware"*.
- **Alternative / Secondary Track**: **Application Middleware & Open-Source Tooling** (Focuses on agent payment SDKs and developer tools).

### Track 2: HSK Chain Track
- **Selected Category**: **Payment** (or **AI Agents**)
  - **Official Requirements**:
    1. Built on HSK Chain.
    2. Deployed on HSK Chain Mainnet or Testnet (*"If time is limited, you are welcome to deploy on the testnet. Testnet Faucet: https://hskchain.net/faucet"*).
    3. Integrate HSK Chain technology (settlement & verification).
    4. GitHub repo with installation and execution instructions.
    5. Working demo (3-minute showcase + 2-minute Q&A).
  - **Prizes**: 1st (2,500 USDT), 2nd (1,500 USDT), 3rd (1,000 USDT).

---

## 2. Assessment of `openmandate-implementation.md`

### Where the Plan is Appropriate & Accurate
1. **Architectural & Economic Invariants**: The protocol decisions (atomic money, single fixed MockUSD, `MandateVault` stateful budget enforcement, EIP-712 single-use agent claim nonces, and SQLite atomic idempotency) directly satisfy the technical rigor expected by EAG and HSK judges.
2. **Honesty & Anti-Overclaim Posture**: The plan strictly avoids claiming novel mandate invention or AP2 compatibility, positioning OpenMandate accurately as an **open-source reference implementation of an agent spending firewall and receipt verifier on HSK**.
3. **Local Test & Invariant Verification**: All core contracts, verifiers, SDK, and merchant API have passing tests (`pnpm verify` passes cleanly).

### Where the Plan MUST Pivot (Urgent Timeline Reality)
1. **Time Constraint Reality**:
   - The implementation plan called for an **XL scope** (23-37 person-days) including a Next.js 15 Web Dashboard (`apps/dashboard`), browser automation, and deep UI flows.
   - **Current Time**: ~12:45. **Submission Deadline**: 14:00 (approx. 75 minutes remaining!).
2. **Acceptable Demo Formats**:
   - Official doc explicitly states: *"A functional demo is required. Web Apps, CLI tools, Bots, or Agents are all acceptable."*
   - A full Web UI is **NOT required** to qualify or win. A crisp, reproducible **CLI / Agent runner demo** showing an autonomous agent negotiating a quote, submitting an on-chain transaction, receiving paid data, getting blocked on overspend, and triggering a refund is completely sufficient and fits the 3-minute presentation limit.
3. **Mandatory Critical Path for Next 60 Minutes**:
   - **Step 1**: Complete `apps/agent-runner` or a unified CLI demonstration script (`scripts/demo.mjs` / `pnpm demo:local`).
   - **Step 2**: Obtain HSK testnet tokens from `https://hskchain.net/faucet` and deploy `MockUSD.sol` + `MandateVault.sol` to HSK Testnet (Chain ID 133). Record explorer links.
   - **Step 3**: Package the GitHub README, architecture documentation, and Devfolio submission write-up before 14:00.
