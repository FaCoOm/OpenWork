# OpenWorks — How the Multi-Agent Strategy Functions (Credential Independence)

**Status:** Technical Architecture Note  
**Date:** 26 September 2026

---

## 1. Executive Summary

A critical question is: **How can the multi-agent strategy run and test if no external API credentials (e.g. OpenAI / Jev AI key) were provided by the user?**

The answer lies in the distinction between **Evolutionary Policy Optimization** and **Natural Language Feature Extraction**:

1. **The Multi-Agent System is an Algorithmic Strategy Engine**: It runs pure mathematical vector operations, mutations, and replay evaluations locally in TypeScript. It does not require any external LLM API to operate.
2. **The LLM (Jev AI) is an Issue Parser**: It is only used to extract feature vectors from raw markdown text. When no API key is provided, the system utilizes built-in deterministic heuristic analysis and pre-labelled benchmark cases.
3. **The Development Subagents (ECC)**: Ran inside the Antigravity IDE harness using the parent session's existing model execution environment.

---

## 2. In-App Multi-Agent Strategy Engine

The agents are **interpretable mathematical policy vectors**, not autonomous cloud LLMs:

$$\text{Agent Weights } W = \begin{bmatrix} w_{\text{urgency}} \\ w_{\text{breadth}} \\ w_{\text{publicBenefit}} \\ w_{\text{feasibility}} \\ w_{\text{evidence}} \end{bmatrix}, \quad \text{Ticket Features } F = \begin{bmatrix} f_{\text{urgency}} \\ f_{\text{breadth}} \\ f_{\text{publicBenefit}} \\ f_{\text{feasibility}} \\ f_{\text{evidence}} \end{bmatrix}$$

$$\text{Score} = W \cdot F = \sum_{i=1}^5 w_i f_i$$

- **Competition**: The 6 agents (`Consensus Guardian`, `Public Good Maximizer`, `Pragmatic Hunter`, `Deep Impact`, `Balanced Triage`, `Rapid Turnaround`) each have different weight profiles $W$.
- **Selection**: The agent with highest score on the candidate tickets proposes the allocation.
- **Mutation**: Shadow agents mutate 1–2 weights using an in-place Fisher-Yates shuffle and bounded Gaussian deltas.
- **Fitness Evaluation**: Candidate agents are evaluated against the 12 labelled historical replay cases.

**All of this executes 100% locally in `packages/core/src/strategy-engine.ts` with zero external network requests or credentials.**

---

## 3. Where Jev AI Fits & The Heuristic Fallback

When a real GitHub issue is ingested from a repository, its markdown text must be converted into the feature vector $F$:

```
Raw Issue Markdown (Text & Logs)
             │
             ▼
   [ JEV_AI_API_KEY set? ]
      ├── YES ──► JevAiService calls Jev AI API (Live LLM Extraction)
      └── NO  ──► Deterministic Heuristic Fallback (Local Rule-Based Extraction)
             │
             ▼
Normalized Feature Vector F [0.0 - 1.0]
             │
             ▼
OpenWorks Multi-Agent Competition (Weights W · F)
             │
             ▼
Policy Engine Invariant Check (9 Hard Rules)
             │
             ▼
OpenWorksTreasury.sol (On-Chain Reservation)
```

---

## 4. Complete Independence from External Credentials

1. **Smart Contracts (`contracts/`)**: Test suites execute on local in-memory Hardhat EVM network with 20 ephemeral accounts holding 10,000 ETH. No external RPC or private keys needed.
2. **Strategy & Policy Engine (`packages/core/`)**: Evaluates tickets, computes dot products, runs Fisher-Yates shuffles, and scores holdouts with standard math. No external APIs needed.
3. **Frontend Dashboard (`web/`)**: State context runs in Next.js React memory. It simulates or connects directly to HashKey Testnet via browser MetaMask.
