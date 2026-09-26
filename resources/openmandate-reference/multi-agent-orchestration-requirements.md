# OpenMandate — Multi-Agent Orchestration Implementation Guide

**Date**: 2026-09-26  
**Purpose**: Detail the prerequisites and execution steps required to run the team-based multi-agent orchestration for OpenMandate.

---

## 1. Core Architecture of Multi-Agent Orchestration in Antigravity

In Google Antigravity, multi-agent orchestration is not simulated through text prompts; it operates via concrete subagent processes managed through the **`invoke_subagent`** and **`manage_subagents`** tool interfaces.

```mermaid
flowchart TD
  O[Lead Orchestrator (Main Session)] -->|invoke_subagent| W1[Worker: agent-runner]
  O -->|invoke_subagent| W2[Worker: agent-contracts]
  O -->|invoke_subagent| W3[Worker: agent-qa]
  O -->|invoke_subagent| W4[Worker: agent-frontend]

  W1 -->|Builds apps/agent-runner| H1[Handoff & Tests]
  W2 -->|Builds HSK Deploy & Config| H2[Handoff & Tests]
  W3 -->|Builds E2E Demo & Docs| H3[Handoff & Tests]
  W4 -->|Scaffolds apps/dashboard| H4[Handoff & Tests]

  H1 -->|Integrate & Verify| O
  H2 -->|Integrate & Verify| O
  H3 -->|Integrate & Verify| O
  H4 -->|Integrate & Verify| O
```

---

## 2. The 4 Necessary Requirements to Implement Desired Teamwork

### Requirement 1: Non-Overlapping File Ownership
Subagents run in parallel. If two subagents edit the same file (e.g., root `package.json` or `apps/merchant-api/src/server.ts`), they will produce race conditions or overwrite each other. Each worker must have strict, exclusive directory ownership:
- **`agent-runner`**: Owns `apps/agent-runner/**`.
- **`agent-contracts`**: Owns `contracts/script/**`, `scripts/deploy/**`.
- **`agent-frontend`**: Owns `apps/dashboard/**`.
- **`agent-qa`**: Owns `scripts/demo.mjs`, `tests/e2e/**`, `README.md`.

### Requirement 2: Explicit Task Cards & Acceptance Criteria (Agent Kanban)
Per `.agents/skills/team-agent-orchestration/SKILL.md`, each worker must receive a structured work card containing:
1. **Goal & References**: What to build and which schemas/ABIs to import.
2. **Acceptance Criteria**: Command that must exit 0 (e.g. `pnpm --filter @openmandate/agent-runner test`).
3. **Merge Gate**: Condition for the lead orchestrator to accept the code into mainline.

### Requirement 3: Dispatch via `invoke_subagent`
The lead orchestrator dispatches the squad concurrently in a single call to `invoke_subagent`:
```json
{
  "Subagents": [
    {
      "TypeName": "self",
      "Role": "Agent Runner Engineer",
      "Prompt": "Implement apps/agent-runner: Bounded tool loop that fetches quotes, checks mandate limits, submits pay tx, and requests report..."
    },
    {
      "TypeName": "self",
      "Role": "Smart Contract Deployer",
      "Prompt": "Implement HSK deployment script: deploy MockUSD and MandateVault to HSK testnet (Chain ID 133)..."
    },
    {
      "TypeName": "self",
      "Role": "QA & E2E Engineer",
      "Prompt": "Implement scripts/demo.mjs and submission documentation..."
    }
  ]
}
```

### Requirement 4: Reactive Synthesis & Integration Loop
- When subagents complete their work, the system automatically triggers a reactive wakeup.
- The Lead Orchestrator reviews the handoffs, runs `pnpm verify` to ensure zero compilation or invariant breaks across packages, and merges the work.

---

## 3. Recommended Sprint for the Hackathon Deadline (< 70 mins)

| Worker | Target Deliverable | Parallel Lane | Merge Gate |
|---|---|---|---|
| **Worker 1 (`agent-runner`)** | `apps/agent-runner` tool loop | Lane 1 | `pnpm --filter @openmandate/agent-runner test` passes |
| **Worker 2 (`agent-contracts`)** | `contracts/script/deploy-hsk.cjs` | Lane 2 | Anvil/HSK dry run produces valid bytecode and ABI parameters |
| **Worker 3 (`agent-qa`)** | `scripts/demo.mjs` + Hackathon `README.md` | Lane 3 | Full 3-minute demo script runs end-to-end against local Anvil |
