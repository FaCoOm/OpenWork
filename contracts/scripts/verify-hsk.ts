import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("==================================================");
  console.log("🔍 HashKey Chain Testnet Inspector & Verifier");
  console.log("==================================================");

  const provider = ethers.provider;
  const network = await provider.getNetwork();
  const blockNumber = await provider.getBlockNumber();
  const feeData = await provider.getFeeData();

  console.log("Connected Network Name: ", network.name);
  console.log("Chain ID:               ", network.chainId.toString());
  console.log("Latest HSK Block:       ", blockNumber);
  console.log("Gas Price:              ", feeData.gasPrice ? `${ethers.formatUnits(feeData.gasPrice, "gwei")} Gwei` : "N/A");

  if (network.chainId.toString() !== "133") {
    console.warn("\n⚠️ Notice: Currently connected to chainId", network.chainId.toString(), "instead of HashKey Testnet (133).");
    console.log("To check against HashKey Testnet, run:");
    console.log("npx hardhat run scripts/verify-hsk.ts --network hskTestnet\n");
  } else {
    console.log("✅ Successfully connected to official HashKey Chain Testnet!");
    console.log("   RPC: https://testnet.hsk.xyz");
    console.log("   Explorer: https://testnet-explorer.hskchain.net");
  }

  // Check deployments/latest.json or deployments/hskTestnet.json
  const hskDeploymentPath = path.join(__dirname, "../deployments/hskTestnet.json");
  const latestDeploymentPath = path.join(__dirname, "../deployments/latest.json");
  
  const deploymentFile = fs.existsSync(hskDeploymentPath) ? hskDeploymentPath : (fs.existsSync(latestDeploymentPath) ? latestDeploymentPath : null);

  if (!deploymentFile) {
    console.log("\nNo deployment artifacts found. Deploy first using:");
    console.log("npm run deploy:hsk");
    return;
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  console.log("\n📋 Inspecting Deployed Contracts:");
  console.log("Treasury Address: ", deployment.treasury);
  console.log("Token Address:    ", deployment.token);

  try {
    const treasuryCode = await provider.getCode(deployment.treasury);
    if (treasuryCode === "0x") {
      console.log(`⚠️ No contract bytecode found at ${deployment.treasury} on chain ${network.chainId.toString()}. Contract may not be deployed to this specific chain yet.`);
      return;
    }

    console.log(`✅ Treasury contract bytecode verified on-chain (${treasuryCode.length / 2} bytes)`);

    const Treasury = await ethers.getContractAt("OpenWorksTreasury", deployment.treasury);
    const purpose = await Treasury.purpose();
    const maxBounty = await Treasury.maxBountyPerTicket();
    const minReserve = await Treasury.minUncommittedReserve();
    const isPaused = await Treasury.paused();
    const steward = await Treasury.steward();
    const champion = await Treasury.championAgent();

    console.log("\n🏛️  On-Chain Mandate Status:");
    console.log("- Purpose:                 ", purpose);
    console.log("- Max Bounty per Ticket:   ", ethers.formatEther(maxBounty), "tHSK");
    console.log("- Min Uncommitted Reserve: ", ethers.formatEther(minReserve), "tHSK");
    console.log("- Steward:                 ", steward);
    console.log("- Champion Agent:          ", champion);
    console.log("- Treasury Paused:         ", isPaused);

    const Token = await ethers.getContractAt("MockTestToken", deployment.token);
    const treasuryBalance = await Token.balanceOf(deployment.treasury);
    console.log("- Treasury Token Balance:  ", ethers.formatEther(treasuryBalance), "tHSK");
    console.log("\n🔗 Block Explorer Links:");
    console.log(`   Treasury: https://testnet-explorer.hskchain.net/address/${deployment.treasury}`);
    console.log(`   Token:    https://testnet-explorer.hskchain.net/address/${deployment.token}`);
  } catch (err: any) {
    console.error("Error inspecting contracts:", err.message);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
