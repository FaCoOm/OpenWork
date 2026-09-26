# OpenWorks .gitignore Security & Exclusions Audit

This document records the ignore policies configured in [.gitignore](file:///c:/Users/Fate_Conqueror/GitHub/OpenWork/.gitignore) to protect credentials, secret keys, build artifacts, and dependency directories across the OpenWorks monorepo.

## 1. Monorepo Structure Covered

- **Root**: Global environment configurations, agent metadata, monorepo scripts.
- **`contracts/`**: Ethereum/Hardhat smart contracts (`OpenWorksTreasury`, `MockTestToken`), deployment scripts, testnet configurations.
- **`packages/core/`**: Deterministic policy engines (`PolicyEngine`, `StrategyEngine`, `JevAI`, `IntakeParser`), TypeScript compilation artifacts.
- **`web/`**: Next.js 14 frontend web application, Tailwind CSS, static traces.

---

## 2. Excluded Categories & Protection Rationale

| Category | Patterns Ignored | Rationale / Risk Prevented |
| :--- | :--- | :--- |
| **Secrets & Keys** | `.env`, `.env.*`, `*.pem`, `*.key`, `*.keystore`, `*.pfx`, `*.p12`, `credentials.json`, `secrets/` | Prevents leaking deployer/validator EVM private keys (`PRIVATE_KEY`), RPC keys, and credentials. Keeps `!.env.example` safe for onboarding. |
| **Smart Contract Artifacts** | `artifacts/`, `cache/`, `typechain-types/`, `.openzeppelin/`, `cache_hardhat/`, `flattened/` | Hardhat compile outputs (~hundreds of MBs of JSON AST and cached compilation states) that should be generated locally. |
| **Dependencies** | `node_modules/`, `*/node_modules/`, `.pnp*`, `.yarn/*`, `.package-lock.json` | Tens of thousands of third-party package files across monorepo subdirectories. |
| **Frontend & Compiler Outputs** | `dist/`, `build/`, `out/`, `.next/`, `.turbo/`, `*.tsbuildinfo`, `.cache/` | Next.js server cache, trace files, and TypeScript dist bundles. |
| **Testing & Coverage** | `coverage/`, `*.lcov`, `.nyc_output/`, `test-results/`, `playwright-report/` | Test runner artifacts and HTML/LCOV code coverage reports. |
| **Diagnostics & Logs** | `logs/`, `*.log`, `npm-debug.log*`, `yarn-error.log*`, `pnpm-debug.log*` | Execution and runtime logs that may contain verbose operational memory or error stacks. |
| **Agent / Local Context** | `/.agents`, `.claude/`, `.gemini/`, `.codegraph/` | Local AI agent harness metadata and local indexes. |
| **OS & Editor Metadata** | `.DS_Store`, `Thumbs.db`, `Desktop.ini`, `.idea/`, `.vscode/*` (except `settings.json`, `extensions.json`) | System noise and workstation-specific editor settings. |

---

## 3. Verification Commands Run

```bash
# Verify sensitive file exclusion
git check-ignore -v .env contracts/.env web/.env.local id_rsa.key contracts/artifacts/a.json packages/core/dist/index.js web/.next/test web/node_modules/react

# Verify non-sensitive configuration/template preservation
git check-ignore -v .env.example contracts/.env.example
```
All verifications succeeded with expected ignore matches and whitelist preservations.
