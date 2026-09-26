# MetaMask Configuration Guide: HashKey Chain & Custom tHSK Token

**Date:** 26 September 2026  
**Network:** HashKey Chain Testnet (Chain ID 133)  
**Contract Bytecode & Balance Verified Live On-Chain**  

---

## 1. Why Did MetaMask Show 0 Balance Previously?

There are two distinct types of tokens in this system:

1. **Native Gas Token (`HSK`)**:
   - The token sent by the faucet (`faucet.hsk.xyz`) is **Native HSK** on the HashKey Chain (like ETH on Ethereum).
   - If MetaMask is connected to Ethereum Mainnet or Sepolia, MetaMask will look at the wrong chain and show `0`.
   - Once you add and switch to **HashKey Chain Testnet (Chain ID 133)**, MetaMask will show the remaining balance: **`~0.0946 HSK`** (0.1 HSK received from faucet minus ~0.0054 HSK used to deploy both contracts).

2. **The Custom Token (`tHSK`)**:
   - Yes, the implementation includes a dedicated smart contract: **`MockTestToken.sol`** deployed on HashKey Chain at `0x6eF665E77c12444a88D228246E9180790A731D07`.
   - ERC-20 tokens are not automatically listed in MetaMask by default until you click **"Import Tokens"** and enter the contract address.
   - Your wallet already owns **`995,000.0 tHSK`** on-chain!

---

## 2. Step 1: Add HashKey Chain Testnet to MetaMask

In MetaMask, go to **Settings > Networks > Add a network > Add a network manually**, and enter:

| Setting | Value |
| :--- | :--- |
| **Network Name** | `HashKey Chain Testnet` |
| **New RPC URL** | `https://testnet.hsk.xyz` |
| **Chain ID** | `133` |
| **Currency Symbol** | `HSK` |
| **Block Explorer URL** | `https://testnet-explorer.hskchain.net` |

*(Tip: You can also just open your local OpenWorks site at `http://localhost:3000` and click **"Connect HSK Wallet"** or **"Switch to HSK"** in the top bar to have MetaMask add all these settings in 1 click).*

---

## 3. Step 2: Import the Deployer Wallet (If using a new MetaMask account)

If your MetaMask is not already using the deployer address (`0xE62Cd659FE1b64D018292432117009AB5921987a`):
1. In MetaMask, click the account dropdown at the top.
2. Click **"Add account or hardware wallet"** > **"Import account"**.
3. Select **Private Key** and paste:
   ```
   0x835e6cb417f824adeedbb4918198e27a152b8d7b35aa42a736c61a1628a01549
   ```
4. Click **Import**. Your address `0xE62Cd659FE1b64D018292432117009AB5921987a` will appear with its native HSK balance.

---

## 4. Step 3: Import the Custom Token (`tHSK`) into MetaMask

1. Make sure your MetaMask network is set to **HashKey Chain Testnet**.
2. Click on the **Tokens** tab.
3. Scroll to the bottom and click **"Import Tokens"**.
4. Fill in the token details:

| Field | Value |
| :--- | :--- |
| **Token Contract Address** | `0x6eF665E77c12444a88D228246E9180790A731D07` |
| **Token Symbol** | `tHSK` *(auto-filled)* |
| **Token Decimal** | `18` *(auto-filled)* |

5. Click **"Add Custom Token"**, then click **"Import Tokens"**.

### Expected Result:
MetaMask will now display:
- **`995,000 tHSK`** in your wallet
- Verified on Blockscout: [`https://testnet-explorer.hskchain.net/address/0x6eF665E77c12444a88D228246E9180790A731D07`](https://testnet-explorer.hskchain.net/address/0x6eF665E77c12444a88D228246E9180790A731D07)
