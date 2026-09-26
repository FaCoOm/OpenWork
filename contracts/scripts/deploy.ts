import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

export async function deployContracts() {
  const signers = await ethers.getSigners();
  const deployer = signers[0];
  if (!deployer) {
    throw new Error("No deployer signer found. Please ensure PRIVATE_KEY is configured in your environment.");
  }

  const network = await ethers.provider.getNetwork();
  const chainId = network.chainId.toString();
  const isHsk = chainId === "133" || network.name === "hskTestnet";

  console.log("==================================================");
  console.log(`🚀 OpenWorks Smart Contracts Deployment [${isHsk ? "HashKey Chain Testnet" : network.name}]`);
  console.log("==================================================");
  console.log("Network Name: ", network.name);
  console.log("Chain ID:     ", chainId);
  console.log("Deployer:     ", deployer.address);

  // Allow env address overrides or fallback to signers or deployer
  const stewardAddress = process.env.STEWARD_ADDRESS || (signers[1] ? signers[1].address : deployer.address);
  const championAddress = process.env.CHAMPION_ADDRESS || (signers[2] ? signers[2].address : deployer.address);
  const maintainerAddress = process.env.MAINTAINER_ADDRESS || (signers[3] ? signers[3].address : deployer.address);
  const contributorAddress = process.env.CONTRIBUTOR_ADDRESS || (signers[4] ? signers[4].address : deployer.address);

  console.log("Steward:      ", stewardAddress);
  console.log("Champion Agent:", championAddress);
  console.log("Maintainer:   ", maintainerAddress);
  console.log("Contributor:  ", contributorAddress);

  // 1. Deploy MockTestToken ("OpenWorks Test HSK", "tHSK")
  console.log("\n📦 Deploying MockTestToken (tHSK)...");
  const TokenFactory = await ethers.getContractFactory("MockTestToken");
  const token = await TokenFactory.deploy("OpenWorks Test HSK", "tHSK", deployer.address);
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("✅ MockTestToken deployed to:", tokenAddress);
  if (isHsk) {
    console.log(`   Explorer: https://testnet-explorer.hskchain.net/address/${tokenAddress}`);
  }

  // 2. Deploy OpenWorksTreasury with Fixed Mandate
  const currentBlockTime = (await ethers.provider.getBlock("latest"))?.timestamp || Math.floor(Date.now() / 1000);
  const mandateExpiry = currentBlockTime + 90 * 24 * 3600; // 90 days
  const purpose = "Public goods funding for urgent open-source security and core infrastructure defects";
  const maxBounty = ethers.parseEther("500"); // 500 tHSK
  const maxRoundSpend = ethers.parseEther("2000"); // 2000 tHSK
  const minReserve = ethers.parseEther("1000"); // 1000 tHSK

  console.log("\n🏛️  Deploying OpenWorksTreasury with Fixed Mandate...");
  const TreasuryFactory = await ethers.getContractFactory("OpenWorksTreasury");
  const treasury = await TreasuryFactory.deploy(
    tokenAddress,
    stewardAddress,
    championAddress,
    purpose,
    maxBounty,
    maxRoundSpend,
    minReserve,
    mandateExpiry
  );
  await treasury.waitForDeployment();
  const treasuryAddress = await treasury.getAddress();
  console.log("✅ OpenWorksTreasury deployed to:", treasuryAddress);
  if (isHsk) {
    console.log(`   Explorer: https://testnet-explorer.hskchain.net/address/${treasuryAddress}`);
  }

  // 3. Fund Treasury with Initial Reserve (5,000 tHSK)
  const initialFund = ethers.parseEther("5000");
  console.log(`\n💰 Funding Treasury with ${ethers.formatEther(initialFund)} tHSK...`);
  const fundTx = await token.transfer(treasuryAddress, initialFund);
  await fundTx.wait();
  console.log("✅ Treasury funded successfully. Treasury balance:", ethers.formatEther(await token.balanceOf(treasuryAddress)), "tHSK");

  // 4. Configure Initial Approved Repositories and Maintainers
  const primaryRepo = "openwork/core-engine";
  console.log(`\n⚙️  Configuring initial approved repository: ${primaryRepo}...`);
  // If deployer is steward, deployer calls; otherwise signer[1] if available
  const stewardSigner = (signers[1] && signers[1].address.toLowerCase() === stewardAddress.toLowerCase()) ? signers[1] : deployer;
  if (stewardSigner.address.toLowerCase() === stewardAddress.toLowerCase()) {
    const approveRepoTx = await treasury.connect(stewardSigner).approveRepository(primaryRepo);
    await approveRepoTx.wait();

    console.log(`👤 Registering maintainer ${maintainerAddress} for ${primaryRepo}...`);
    const addMaintainerTx = await treasury.connect(stewardSigner).addMaintainer(primaryRepo, maintainerAddress);
    await addMaintainerTx.wait();
    console.log("✅ Repository and Maintainer configured.");
  } else {
    console.log("⚠️ Deployer is not steward; skipping automatic repository and maintainer registration.");
  }

  // Save deployment artifact
  const deploymentInfo = {
    network: network.name,
    chainId,
    isHskNetwork: isHsk,
    explorerBaseUrl: isHsk ? "https://testnet-explorer.hskchain.net" : "",
    rpcUrl: isHsk ? (process.env.HSK_TESTNET_RPC || "https://testnet.hsk.xyz") : "http://127.0.0.1:8545",
    token: tokenAddress,
    treasury: treasuryAddress,
    steward: stewardAddress,
    champion: championAddress,
    maintainer: maintainerAddress,
    contributor: contributorAddress,
    primaryRepo,
    maxBountyPerTicket: ethers.formatEther(maxBounty),
    maxSpendPerRound: ethers.formatEther(maxRoundSpend),
    minUncommittedReserve: ethers.formatEther(minReserve),
    mandateExpiry,
    timestamp: new Date().toISOString(),
  };

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(deploymentsDir, "latest.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );

  if (isHsk) {
    fs.writeFileSync(
      path.join(deploymentsDir, "hskTestnet.json"),
      JSON.stringify(deploymentInfo, null, 2)
    );
  }
  console.log(`\n💾 Saved deployment details to deployments/latest.json`);

  // Sync artifacts to web app
  try {
    const webConfigDir = path.join(__dirname, "../../web/src/config");
    if (!fs.existsSync(webConfigDir)) {
      fs.mkdirSync(webConfigDir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(webConfigDir, "deployed-contracts.json"),
      JSON.stringify(deploymentInfo, null, 2)
    );

    const tokenArtifact = await (await import("hardhat")).artifacts.readArtifact("MockTestToken");
    const treasuryArtifact = await (await import("hardhat")).artifacts.readArtifact("OpenWorksTreasury");
    fs.writeFileSync(
      path.join(webConfigDir, "contracts-abi.json"),
      JSON.stringify({
        MockTestToken: tokenArtifact.abi,
        OpenWorksTreasury: treasuryArtifact.abi,
      }, null, 2)
    );
    console.log(`🔄 Synced deployment metadata & ABIs to web/src/config/`);
  } catch (err: any) {
    console.warn("Could not sync to web directory:", err.message);
  }

  return { token, treasury, deploymentInfo };
}

async function main() {
  await deployContracts();
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Deployment failed:", error);
      process.exit(1);
    });
}
