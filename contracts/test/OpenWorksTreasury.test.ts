import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { MockTestToken, OpenWorksTreasury } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("OpenWorksTreasury", function () {
  let token: MockTestToken;
  let treasury: OpenWorksTreasury;

  let owner: HardhatEthersSigner;
  let steward: HardhatEthersSigner;
  let champion: HardhatEthersSigner;
  let maintainer: HardhatEthersSigner;
  let contributor: HardhatEthersSigner;
  let randomUser: HardhatEthersSigner;

  const initialPurpose = "Support urgent bug fixes and security in approved OSS infrastructure";
  const maxBounty = ethers.parseEther("500"); // 500 tHSK
  const maxRoundSpend = ethers.parseEther("2000"); // 2000 tHSK
  const minReserve = ethers.parseEther("1000"); // 1000 tHSK
  const repoName = "openwork/core-engine";

  let mandateExpiry: number;

  beforeEach(async function () {
    [owner, steward, champion, maintainer, contributor, randomUser] = await ethers.getSigners();

    const currentBlockTime = await time.latest();
    mandateExpiry = currentBlockTime + 30 * 24 * 3600; // 30 days from now

    // Deploy Mock ERC20 Token ("OpenWorks Test HSK", "tHSK")
    const TokenFactory = await ethers.getContractFactory("MockTestToken");
    token = (await TokenFactory.deploy("OpenWorks Test HSK", "tHSK", owner.address)) as MockTestToken;
    await token.waitForDeployment();

    // Deploy OpenWorksTreasury
    const TreasuryFactory = await ethers.getContractFactory("OpenWorksTreasury");
    treasury = (await TreasuryFactory.deploy(
      await token.getAddress(),
      steward.address,
      champion.address,
      initialPurpose,
      maxBounty,
      maxRoundSpend,
      minReserve,
      mandateExpiry
    )) as OpenWorksTreasury;
    await treasury.waitForDeployment();

    // Fund Treasury with 5000 tHSK
    const fundAmount = ethers.parseEther("5000");
    await token.transfer(await treasury.getAddress(), fundAmount);

    // Steward registers approved repo and maintainer
    await treasury.connect(steward).approveRepository(repoName);
    await treasury.connect(steward).addMaintainer(repoName, maintainer.address);
  });

  describe("Initialization & Mandate State", function () {
    it("should initialize with correct steward, champion, and mandate limits", async function () {
      expect(await treasury.steward()).to.equal(steward.address);
      expect(await treasury.championAgent()).to.equal(champion.address);
      expect(await treasury.purpose()).to.equal(initialPurpose);
      expect(await treasury.maxBountyPerTicket()).to.equal(maxBounty);
      expect(await treasury.maxSpendPerRound()).to.equal(maxRoundSpend);
      expect(await treasury.minUncommittedReserve()).to.equal(minReserve);
      expect(await treasury.mandateExpiry()).to.equal(mandateExpiry);
      expect(await treasury.paused()).to.equal(false);
      expect(await treasury.getTreasuryBalance()).to.equal(ethers.parseEther("5000"));
      expect(await treasury.getUncommittedBalance()).to.equal(ethers.parseEther("5000"));
    });

    it("should allow steward to update mandate and emit event", async function () {
      const newExpiry = mandateExpiry + 60 * 24 * 3600;
      const newMaxBounty = ethers.parseEther("750");

      await expect(
        treasury
          .connect(steward)
          .updateMandate("Updated Mission", newMaxBounty, maxRoundSpend, minReserve, newExpiry)
      )
        .to.emit(treasury, "MandateUpdated")
        .withArgs("Updated Mission", newMaxBounty, maxRoundSpend, minReserve, newExpiry, steward.address);

      expect(await treasury.purpose()).to.equal("Updated Mission");
      expect(await treasury.maxBountyPerTicket()).to.equal(newMaxBounty);
    });

    it("should reject non-steward updating mandate", async function () {
      await expect(
        treasury
          .connect(randomUser)
          .updateMandate("Malicious", maxBounty, maxRoundSpend, minReserve, mandateExpiry)
      ).to.be.revertedWithCustomError(treasury, "UnauthorizedCaller");
    });
  });

  describe("Maintainer Registry", function () {
    it("should verify approved repositories and maintainers", async function () {
      expect(await treasury.isRepositoryApproved(repoName)).to.equal(true);
      expect(await treasury.isMaintainer(repoName, maintainer.address)).to.equal(true);
      expect(await treasury.isMaintainer(repoName, randomUser.address)).to.equal(false);
    });

    it("should allow steward to remove maintainer", async function () {
      await treasury.connect(steward).removeMaintainer(repoName, maintainer.address);
      expect(await treasury.isMaintainer(repoName, maintainer.address)).to.equal(false);
    });

    it("should reject non-steward adding maintainer", async function () {
      await expect(
        treasury.connect(randomUser).addMaintainer(repoName, randomUser.address)
      ).to.be.revertedWithCustomError(treasury, "UnauthorizedCaller");
    });
  });

  describe("Bounty Reservation", function () {
    const ticketId = "OW-ISSUE-101";
    const bountyAmount = ethers.parseEther("300");

    it("should allow champion agent to reserve a valid bounty within limits", async function () {
      await expect(treasury.connect(champion).reserveBounty(ticketId, repoName, bountyAmount, 0))
        .to.emit(treasury, "BountyReserved")
        .withArgs(
          ticketId,
          await treasury.ticketKey(ticketId),
          repoName,
          bountyAmount,
          champion.address,
          (val: any) => val > 0
        );

      const ticket = await treasury.getTicket(ticketId);
      expect(ticket.ticketId).to.equal(ticketId);
      expect(ticket.repoName).to.equal(repoName);
      expect(ticket.amount).to.equal(bountyAmount);
      expect(ticket.state).to.equal(1); // BountyState.Reserved
      expect(ticket.reservedBy).to.equal(champion.address);

      expect(await treasury.totalReserved()).to.equal(bountyAmount);
      expect(await treasury.getUncommittedBalance()).to.equal(
        ethers.parseEther("5000") - bountyAmount
      );
    });

    it("should allow steward to reserve a bounty directly", async function () {
      await expect(
        treasury.connect(steward).reserveBounty("OW-ISSUE-102", repoName, bountyAmount, 0)
      ).to.emit(treasury, "BountyReserved");
    });

    it("should reject unauthorized caller reserving bounty", async function () {
      await expect(
        treasury.connect(randomUser).reserveBounty(ticketId, repoName, bountyAmount, 0)
      ).to.be.revertedWithCustomError(treasury, "UnauthorizedCaller");
    });

    it("should reject reservation for unapproved repository", async function () {
      await expect(
        treasury.connect(champion).reserveBounty(ticketId, "unknown/unapproved-repo", bountyAmount, 0)
      ).to.be.revertedWithCustomError(treasury, "RepositoryNotApproved");
    });

    it("should reject over-cap bounty reservation (exceeds maxBountyPerTicket)", async function () {
      const excessiveBounty = ethers.parseEther("501"); // cap is 500
      await expect(
        treasury.connect(champion).reserveBounty(ticketId, repoName, excessiveBounty, 0)
      ).to.be.revertedWithCustomError(treasury, "ExceedsMaxBounty");
    });

    it("should reject duplicate reservation on the same ticketId", async function () {
      await treasury.connect(champion).reserveBounty(ticketId, repoName, bountyAmount, 0);

      await expect(
        treasury.connect(champion).reserveBounty(ticketId, repoName, bountyAmount, 0)
      ).to.be.revertedWithCustomError(treasury, "AlreadyReservedOrPaid");
    });

    it("should reject reservation violating minimum uncommitted reserve", async function () {
      // Treasury balance is 5000 tHSK. minReserve is 1000 tHSK. Max allowable total reservations is 4000 tHSK.
      // But maxSpendPerRound is 2000 tHSK, so let's temporarily raise maxSpendPerRound to test minReserve breach.
      await treasury
        .connect(steward)
        .updateMandate(initialPurpose, maxBounty, ethers.parseEther("10000"), minReserve, mandateExpiry);

      // Reserve 8 tickets of 500 = 4000 tHSK (leaving exactly 1000 reserve)
      for (let i = 1; i <= 8; i++) {
        await treasury.connect(champion).reserveBounty(`TICKET-${i}`, repoName, ethers.parseEther("500"), 0);
      }
      expect(await treasury.getUncommittedBalance()).to.equal(ethers.parseEther("1000"));

      // 9th ticket of 100 tHSK would leave 900 tHSK < 1000 minReserve -> ViolatesMinReserve
      await expect(
        treasury.connect(champion).reserveBounty("TICKET-9", repoName, ethers.parseEther("100"), 0)
      ).to.be.revertedWithCustomError(treasury, "ViolatesMinReserve");
    });

    it("should reject reservation that exceeds round spend limit", async function () {
      // maxSpendPerRound is 2000 tHSK.
      // Reserve 4 tickets of 500 tHSK = 2000 tHSK.
      for (let i = 1; i <= 4; i++) {
        await treasury.connect(champion).reserveBounty(`ROUND-${i}`, repoName, ethers.parseEther("500"), 0);
        // confirm and pay
        await treasury
          .connect(maintainer)
          .confirmFixAndPayout(`ROUND-${i}`, `https://github.com/pr/${i}`, contributor.address);
      }
      expect(await treasury.currentRoundSpend()).to.equal(ethers.parseEther("2000"));

      // 5th reservation would exceed round spend limit
      await expect(
        treasury.connect(champion).reserveBounty("ROUND-5", repoName, ethers.parseEther("100"), 0)
      ).to.be.revertedWithCustomError(treasury, "ExceedsRoundSpend");
    });
  });

  describe("Acceptance & Payout Workflow", function () {
    const ticketId = "OW-CRITICAL-404";
    const bountyAmount = ethers.parseEther("450");
    const prUrl = "https://github.com/openwork/core-engine/pull/42";

    beforeEach(async function () {
      await treasury.connect(champion).reserveBounty(ticketId, repoName, bountyAmount, 0);
    });

    it("should allow authorized maintainer to confirm fix and pay contributor", async function () {
      const initialContributorBalance = await token.balanceOf(contributor.address);

      await expect(treasury.connect(maintainer).confirmFixAndPayout(ticketId, prUrl, contributor.address))
        .to.emit(treasury, "FixAcceptedAndPaid")
        .withArgs(
          ticketId,
          await treasury.ticketKey(ticketId),
          repoName,
          bountyAmount,
          contributor.address,
          prUrl,
          maintainer.address
        );

      const finalContributorBalance = await token.balanceOf(contributor.address);
      expect(finalContributorBalance - initialContributorBalance).to.equal(bountyAmount);

      const ticket = await treasury.getTicket(ticketId);
      expect(ticket.state).to.equal(2); // BountyState.Paid
      expect(ticket.payee).to.equal(contributor.address);
      expect(ticket.pullRequestUrl).to.equal(prUrl);

      expect(await treasury.totalReserved()).to.equal(0);
      expect(await treasury.currentRoundSpend()).to.equal(bountyAmount);
    });

    it("should reject confirmation from an unauthorized non-maintainer", async function () {
      await expect(
        treasury.connect(randomUser).confirmFixAndPayout(ticketId, prUrl, contributor.address)
      ).to.be.revertedWithCustomError(treasury, "UnauthorizedMaintainer");
    });

    it("should reject duplicate payout attempt on same ticket (already paid)", async function () {
      // First payout succeeds
      await treasury.connect(maintainer).confirmFixAndPayout(ticketId, prUrl, contributor.address);

      // Duplicate attempt on the same ticket must be rejected
      await expect(
        treasury.connect(maintainer).confirmFixAndPayout(ticketId, prUrl, contributor.address)
      ).to.be.revertedWithCustomError(treasury, "AlreadyReservedOrPaid");
    });

    it("should reject payout to zero address", async function () {
      await expect(
        treasury.connect(maintainer).confirmFixAndPayout(ticketId, prUrl, ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(treasury, "InvalidPayee");
    });

    it("should reject payout for non-existent ticket", async function () {
      await expect(
        treasury.connect(maintainer).confirmFixAndPayout("NON-EXISTENT", prUrl, contributor.address)
      ).to.be.revertedWithCustomError(treasury, "TicketNotFound");
    });
  });

  describe("Emergency Pause & Mandate Expiry", function () {
    const ticketId = "OW-PAUSE-TEST";
    const bountyAmount = ethers.parseEther("200");

    it("should reject actions when paused and resume when unpaused", async function () {
      await treasury.connect(steward).setPaused(true);
      expect(await treasury.paused()).to.equal(true);

      // Attempt reservation while paused
      await expect(
        treasury.connect(champion).reserveBounty(ticketId, repoName, bountyAmount, 0)
      ).to.be.revertedWithCustomError(treasury, "ContractPaused");

      // Unpause and verify reservation succeeds
      await treasury.connect(steward).setPaused(false);
      await expect(
        treasury.connect(champion).reserveBounty(ticketId, repoName, bountyAmount, 0)
      ).to.emit(treasury, "BountyReserved");
    });

    it("should reject actions when mandate has expired", async function () {
      // Fast forward past mandate expiry
      await time.increaseTo(mandateExpiry + 1);

      await expect(
        treasury.connect(champion).reserveBounty(ticketId, repoName, bountyAmount, 0)
      ).to.be.revertedWithCustomError(treasury, "MandateExpired");
    });
  });

  describe("Reservation Expiry and Cancellation", function () {
    const ticketId = "OW-EXPIRY-TEST";
    const bountyAmount = ethers.parseEther("250");
    const customDuration = 3600; // 1 hour

    beforeEach(async function () {
      await treasury.connect(champion).reserveBounty(ticketId, repoName, bountyAmount, customDuration);
    });

    it("should allow anyone to release an expired reservation back to uncommitted balance", async function () {
      expect(await treasury.totalReserved()).to.equal(bountyAmount);

      // Before expiry, release should revert
      await expect(
        treasury.connect(randomUser).releaseExpiredReservation(ticketId)
      ).to.be.revertedWithCustomError(treasury, "ReservationNotExpired");

      // Advance time past reservation expiry
      await time.increase(customDuration + 10);

      // Now release succeeds
      await expect(treasury.connect(randomUser).releaseExpiredReservation(ticketId))
        .to.emit(treasury, "BountyExpired")
        .withArgs(ticketId, await treasury.ticketKey(ticketId), bountyAmount, randomUser.address);

      expect(await treasury.totalReserved()).to.equal(0);
      const ticket = await treasury.getTicket(ticketId);
      expect(ticket.state).to.equal(4); // BountyState.Expired
    });

    it("should reject maintainer confirmation on expired reservation", async function () {
      await time.increase(customDuration + 10);

      await expect(
        treasury
          .connect(maintainer)
          .confirmFixAndPayout(ticketId, "https://github.com/pr/1", contributor.address)
      ).to.be.revertedWithCustomError(treasury, "ReservationExpired");
    });

    it("should allow steward to cancel a reservation and return reserved funds", async function () {
      await expect(
        treasury.connect(steward).cancelReservation(ticketId, "Contributor abandoned task")
      )
        .to.emit(treasury, "BountyCancelled")
        .withArgs(
          ticketId,
          await treasury.ticketKey(ticketId),
          bountyAmount,
          "Contributor abandoned task",
          steward.address
        );

      expect(await treasury.totalReserved()).to.equal(0);
      const ticket = await treasury.getTicket(ticketId);
      expect(ticket.state).to.equal(3); // BountyState.Cancelled
    });
  });
});
