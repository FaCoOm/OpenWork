# What "Deploying via the Testnet Faucet" Means in Web3

**Question:** What does it mean to "deploy on the testnet via the Testnet Faucet at `hskchain.net/faucet`"?

---

## 1. The Short Answer

The faucet **does not** deploy code. 

**"Deploying via the faucet"** is developer shorthand for a two-step process:
1. **Get Free Gas Tokens from the Faucet:** You use the faucet website (`hskchain.net/faucet` or `faucet.hsk.xyz`) to receive free testnet tokens (`tHSK`) into your developer wallet.
2. **Deploy Using Those Tokens:** Your deployment tool (Hardhat) uses those faucet tokens to pay the blockchain transaction fees ("gas") required to compile, broadcast, and permanently store your smart contract bytecode onto the HashKey Chain Testnet.

---

## 2. Why Is a Faucet Required to Deploy?

On any EVM blockchain (Ethereum, Polygon, HashKey Chain):
1. **Contract Deployment Is an On-Chain Transaction**: 
   When you deploy `OpenWorksTreasury.sol`, the EVM must store thousands of bytes of compiled bytecode into the distributed ledger across all network validators.
2. **Every Transaction Requires "Gas"**:
   To prevent spam and incentivize network validators, every transaction consumes gas paid in the native currency (`HSK`).
3. **Testnets Use Faucets Instead of Real Money**:
   - On **Mainnet**, you must buy real cryptocurrency with fiat money to pay for gas.
   - On **Testnet**, developers should not spend real money. Instead, the network provides a **Faucet**—a free automated web dispenser that gives developers small amounts of test tokens purely for testing and deploying contracts.

---

## 3. Step-by-Step Flow

```
┌────────────────────────────────┐
│   1. Developer Wallet (EOA)    │  (Has 0 HSK balance)
└───────────────┬────────────────┘
                │
                ▼ Enters wallet address
┌────────────────────────────────┐
│   2. Testnet Faucet            │
│   (hskchain.net/faucet)        │
└───────────────┬────────────────┘
                │
                ▼ Sends ~1.0 testnet HSK (free gas tokens)
┌────────────────────────────────┐
│   3. Funded Developer Wallet   │  (Now has balance to pay for gas)
└───────────────┬────────────────┘
                │
                ▼ Runs `npm run deploy:hsk` via Hardhat
┌────────────────────────────────┐
│   4. HashKey Chain Testnet     │
│      • OpenWorksTreasury.sol   │  (Smart contracts permanently deployed!)
│      • MockTestToken.sol       │
└────────────────────────────────┘
```

---

## 4. How to Do It for OpenWorks

1. **Get Your Deployer Address**:
   Your deployer address configured in `.env` is:
   `0xE62Cd659FE1b64D018292432117009AB5921987a`

2. **Claim Tokens from Faucet**:
   - Go to `https://faucet.hsk.xyz` (or `https://hskchain.net/faucet`).
   - Paste `0xE62Cd659FE1b64D018292432117009AB5921987a`.
   - Complete the human verification and click **Request HSK**.

3. **Run Deployment**:
   ```bash
   npm run deploy:hsk
   ```
   Hardhat connects to `https://testnet.hsk.xyz`, uses the gas tokens you received from the faucet, and publishes the contracts to HashKey Chain.
