# OpenMandate — Product Evidence & Claims Register

Status: Technical Reference Implementation.

## 1. Competitive Positioning & Prior Art

As established in `OpenMandate-Project-Profile.md`, OpenMandate builds upon existing agent-commerce concepts on HSK Chain:
- **AllScale Agentic Commerce Gateway**: Prior art on HSK agent checkout, spending limits, on-chain settlement, receipt verification, and deduplication.
- **sumplus-hsk-mandate & SafeFlow**: Prior art on HSK agent-authorization overlaps.
- **ERC-8183 & Masumi**: Established prior art for agent-job escrow, expiry refunds, and agentic x402 escrows.

### Differentiation & Contribution
OpenMandate provides a **clean, test-verified, open-source reference implementation** demonstrating:
1. Owner-funded bounded mandate on HSK Testnet.
2. Invariant-governed spending caps and merchant allowlists enforced on-chain.
3. Merchant-side independent receipt verification (EIP-712 claim authentication + transaction log matching).
4. Idempotent fulfillment guaranteeing single delivery per paid order without charge duplicates.
5. Reusable TypeScript SDK and minimal merchant integration example.

## 2. Forbidden Claims (Anti-Slop Guardrails)

The project strictly prohibits marketing overclaims:
- **NO** claims of "production-ready" or "enterprise-grade security".
- **NO** claims of "real stablecoin" (MockUSD is an explicit, valueless test ERC-20).
- **NO** claims of "x402 compliant" (the protocol uses a custom HTTP 402-style quote/claim pattern).
- **NO** claims of "AP2 compliant" (AP2 compatibility is a future roadmap exploration).
- **NO** claims of "novel mandate invention" (mandate spending bounds are established prior art).
- **NO** claims of "guaranteed prize eligibility" or commercial revenue.

## 3. Verified Reference Links
- HSK Developer Quickstart: `https://docs.hskchain.net/docs/Developer-QuickStart`
- HSK Testnet Explorer: `https://testnet-explorer.hsk.xyz`
- HSK Faucet: `https://docs.hskchain.net/docs/Build-on-HashKey-Chain/Tools/Faucet`
