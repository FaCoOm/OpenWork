import { ethers } from "ethers";

function main() {
  console.log("==================================================");
  console.log("🔑 HashKey Chain (HSK) Testnet Wallet Generator");
  console.log("==================================================");

  const wallet = ethers.Wallet.createRandom();

  console.log("\nA fresh EVM wallet has been generated for HSK Testnet deployment:");
  console.log("--------------------------------------------------");
  console.log("Address:     ", wallet.address);
  console.log("Private Key: ", wallet.privateKey);
  console.log("Mnemonic:    ", wallet.mnemonic?.phrase);
  console.log("--------------------------------------------------");

  console.log("\nNext Steps to Deploy to HashKey Chain Testnet:");
  console.log("1. Claim testnet HSK gas tokens for this address from the faucet:");
  console.log("   👉 https://faucet.hsk.xyz");
  console.log(`      Enter address: ${wallet.address}`);
  console.log("\n2. Set your environment variable in contracts/.env or shell:");
  console.log(`   PRIVATE_KEY=${wallet.privateKey}`);
  console.log("\n3. Run deployment to HashKey Chain Testnet:");
  console.log("   npm run deploy:hsk");
  console.log("\n4. Verify on HashKey Blockscout Explorer:");
  console.log(`   https://testnet-explorer.hskchain.net/address/${wallet.address}`);
  console.log("==================================================");
}

main();
