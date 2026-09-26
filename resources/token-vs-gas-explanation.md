# Clarification: Native Gas Token (HSK) vs. Custom Grant Token (tHSK)

**Question:** Why does the wallet have 0.0946 HSK, and what is the 995,000?

---

## Summary Comparison Table

| Property | Native Token (`HSK`) | Custom ERC-20 Token (`tHSK`) |
| :--- | :--- | :--- |
| **Token Name** | HashKey EcoPoints (`HSK`) | OpenWorks Test HSK (`tHSK`) |
| **Role** | **Gas Currency** for transaction fees | **Grant / Bounty Asset** used by OpenWorks |
| **Where it came from** | Free faucet at `faucet.hsk.xyz` | Minted by your contract `MockTestToken.sol` |
| **Contract Address** | None (Built into the blockchain protocol) | `0x6eF665E77c12444a88D228246E9180790A731D07` |
| **Your Wallet Balance** | **`0.0946 HSK`** | **`995,000.0 tHSK`** |
| **Treasury Contract Balance**| Gas-less (smart contract) | **`5,000.0 tHSK`** (Initial fund pool) |

---

## 1. Why You Have 0.0946 HSK

- The official testnet faucet (`faucet.hsk.xyz`) drips **0.1000 HSK** of native gas per request.
- When you ran `npm run deploy:hsk`, your wallet paid gas fees for 4 on-chain transactions:
  1. Deploying `MockTestToken.sol`
  2. Deploying `OpenWorksTreasury.sol`
  3. Transferring initial funding to the treasury
  4. Registering the initial maintainer
- These 4 transactions consumed approximately **0.0054 HSK** in gas.
- **`0.1000 HSK` - `0.0054 HSK` = `0.0946 HSK`** remaining in your wallet to pay for future transactions.

---

## 2. What the 995,000 Refers To

- In [`OpenWorks-Project-Brief.md`](../OpenWorks-Project-Brief.md), OpenWorks requires an auditable test token to fund bounties for open-source contributors.
- When your contract `MockTestToken.sol` was deployed, it initialized with **1,000,000 `tHSK`** allocated to your wallet.
- The deployment script deposited **5,000 `tHSK`** into the `OpenWorksTreasury` contract (`0xB50b7B22DFaF8bA1eD90467C7DA68DaCEcbA0463`) to create the initial grant reserve.
- **`1,000,000 tHSK` - `5,000 tHSK` = `995,000 tHSK`** remaining in your wallet.
