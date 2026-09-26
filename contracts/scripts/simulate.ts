import { ethers } from "hardhat";
import { deployContracts } from "./deploy";

async function main() {
  console.log("\n========================================================");
  console.log("🎬 STARTING OPENWORKS END-TO-END SMART CONTRACT SIMULATION");
  console.log("========================================================");

  // Deploy contracts and seed environment
  const { token, treasury, deploymentInfo } = await deployContracts();
  const [deployer, steward, champion, maintainer, contributor, attacker] = await ethers.getSigners();

  const repo = deploymentInfo.primaryRepo;

  // Helper to format tokens
  const fmt = (wei: bigint) => `${ethers.formatEther(wei)} tHSK`;

  console.log("\n--------------------------------------------------------");
  console.log("📊 1. INITIAL BALANCES & MANDATE STATE");
  console.log("--------------------------------------------------------");
  console.log("Treasury Total Balance:      ", fmt(await treasury.getTreasuryBalance()));
  console.log("Treasury Uncommitted Reserve:", fmt(await treasury.getUncommittedBalance()));
  console.log("Mandate Max Bounty Per Ticket:", fmt(await treasury.maxBountyPerTicket()));
  console.log("Mandate Max Spend Per Round:  ", fmt(await treasury.maxSpendPerRound()));
  console.log("Mandate Min Reserve Floor:    ", fmt(await treasury.minUncommittedReserve()));
  console.log("Contributor Initial Balance:  ", fmt(await token.balanceOf(contributor.address)));

  // STEP 1: Legitimate Reservation by Champion Agent
  console.log("\n--------------------------------------------------------");
  console.log("🎯 2. RESERVING BOUNTY FOR HIGH-IMPACT TICKET");
  console.log("--------------------------------------------------------");
  const ticketId = "OW-2026-CRIT-001";
  const bountyAmount = ethers.parseEther("450"); // 450 tHSK <= 500 max cap
  console.log(`Ticket ID:           ${ticketId}`);
  console.log(`Repository:          ${repo}`);
  console.log(`Proposed Bounty:     ${fmt(bountyAmount)}`);
  console.log(`Calling agent:       ${champion.address} (Champion Agent)`);

  const reserveTx = await treasury.connect(champion).reserveBounty(ticketId, repo, bountyAmount, 0);
  const reserveReceipt = await reserveTx.wait();
  console.log(`✅ Bounty reserved on-chain! Tx: ${reserveReceipt?.hash}`);

  const ticketStateAfterReserve = await treasury.getTicket(ticketId);
  console.log(`Ticket State:        Reserved (Enum: ${ticketStateAfterReserve.state})`);
  console.log(`Total Reserved:      ${fmt(await treasury.totalReserved())}`);
  console.log(`Uncommitted Reserve: ${fmt(await treasury.getUncommittedBalance())}`);

  // STEP 2: Maintainer Confirmation and Contributor Payout
  console.log("\n--------------------------------------------------------");
  console.log("🤝 3. MAINTAINER ACCEPTS FIX AND TRIGGERS PAYOUT");
  console.log("--------------------------------------------------------");
  const prUrl = "https://github.com/openwork/core-engine/pull/133";
  console.log(`Pull Request:        ${prUrl}`);
  console.log(`Contributor (Payee): ${contributor.address}`);
  console.log(`Maintainer Signer:   ${maintainer.address}`);

  const payoutTx = await treasury
    .connect(maintainer)
    .confirmFixAndPayout(ticketId, prUrl, contributor.address);
  const payoutReceipt = await payoutTx.wait();
  console.log(`✅ Contributor paid! Tx: ${payoutReceipt?.hash}`);

  const contributorBalance = await token.balanceOf(contributor.address);
  console.log(`Contributor New Balance:     ${fmt(contributorBalance)} (+${fmt(bountyAmount)})`);

  const ticketStateAfterPayout = await treasury.getTicket(ticketId);
  console.log(`Ticket Final State:          Paid (Enum: ${ticketStateAfterPayout.state})`);
  console.log(`Treasury Balance Remaining:  ${fmt(await treasury.getTreasuryBalance())}`);
  console.log(`Current Round Total Spend:   ${fmt(await treasury.currentRoundSpend())}`);

  // STEP 3: Attempt Duplicate Payout Rejection
  console.log("\n--------------------------------------------------------");
  console.log("🛑 4. SECURITY CHECK: ATTEMPT DUPLICATE PAYOUT REJECTION");
  console.log("--------------------------------------------------------");
  console.log(`Attempting duplicate payout for ticket ${ticketId}...`);
  try {
    await treasury
      .connect(maintainer)
      .confirmFixAndPayout(ticketId, prUrl, contributor.address);
    console.error("❌ ERROR: Duplicate payout was not rejected!");
    process.exit(1);
  } catch (err: any) {
    console.log("🛡️  Contract Rejection Verified!");
    console.log("Expected Custom Error: AlreadyReservedOrPaid()");
    console.log("Contract Error Detail:", err.message.split("\n")[0]);
  }

  // STEP 4: Attempt Over-Cap Bounty Reservation Rejection
  console.log("\n--------------------------------------------------------");
  console.log("🛑 5. POLICY CHECK: ATTEMPT OVER-CAP BOUNTY REJECTION");
  console.log("--------------------------------------------------------");
  const overCapTicketId = "OW-2026-OVERCAP-TEST";
  const overCapAmount = ethers.parseEther("650"); // 650 tHSK exceeds 500 cap
  console.log(`Attempting to reserve ${fmt(overCapAmount)} for ${overCapTicketId} (Max: 500 tHSK)...`);
  try {
    await treasury.connect(champion).reserveBounty(overCapTicketId, repo, overCapAmount, 0);
    console.error("❌ ERROR: Over-cap reservation was not rejected!");
    process.exit(1);
  } catch (err: any) {
    console.log("🛡️  Contract Rejection Verified!");
    console.log("Expected Custom Error: ExceedsMaxBounty()");
    console.log("Contract Error Detail:", err.message.split("\n")[0]);
  }

  // STEP 5: Attempt Unauthorized Maintainer Confirmation Rejection
  console.log("\n--------------------------------------------------------");
  console.log("🛑 6. ACCESS CHECK: ATTEMPT UNAUTHORIZED MAINTAINER PAYOUT");
  console.log("--------------------------------------------------------");
  const validTicket2 = "OW-2026-AUTH-TEST";
  await treasury.connect(champion).reserveBounty(validTicket2, repo, ethers.parseEther("200"), 0);
  console.log(`Reserved 200 tHSK for ${validTicket2}`);
  console.log(`Attempting confirmation using unauthorized attacker address: ${attacker.address}...`);

  try {
    await treasury
      .connect(attacker)
      .confirmFixAndPayout(validTicket2, "https://github.com/spoofed/pr", attacker.address);
    console.error("❌ ERROR: Unauthorized maintainer was not rejected!");
    process.exit(1);
  } catch (err: any) {
    console.log("🛡️  Contract Rejection Verified!");
    console.log("Expected Custom Error: UnauthorizedMaintainer()");
    console.log("Contract Error Detail:", err.message.split("\n")[0]);
  }

  console.log("\n========================================================");
  console.log("🎉 ALL END-TO-END CONTRACT SIMULATION CHECKS PASSED!");
  console.log("========================================================");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Simulation run failed:", err);
    process.exit(1);
  });
