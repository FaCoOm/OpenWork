/**
 * OpenWorks Deterministic Policy Engine
 *
 * Implements deterministic rule checks for bounty reservation and ticket eligibility.
 * AI models may score or interpret issues, but CANNOT waive hard policy rules.
 */

import {
  Mandate,
  Ticket,
  TreasuryState,
  PolicyVerdict,
  RuleCheckResult,
  PolicyVerdictStatus,
} from './types.js';

export interface EvaluationContext {
  mandate: Mandate;
  ticket: Ticket;
  proposedBounty: number;
  treasuryState: TreasuryState;
  currentRoundSpend?: number;
  evidenceConfidence?: number;
  now?: number; // Optional mockable timestamp (epoch ms or seconds)
}

export class PolicyEngine {
  /**
   * Evaluates a ticket and proposed bounty reservation against all deterministic rules.
   */
  public static evaluate(context: EvaluationContext): PolicyVerdict {
    const {
      mandate,
      ticket,
      proposedBounty,
      treasuryState,
      currentRoundSpend = treasuryState.roundSpend ?? 0,
      evidenceConfidence = ticket.features?.evidenceConfidence ?? (ticket.publicEvidence.length > 0 ? 0.7 : 0.1),
      now = Date.now(),
    } = context;

    const ruleCheckResults: RuleCheckResult[] = [];
    const reasons: string[] = [];
    let hasBlockingFailure = false;
    let hasReviewRequired = false;

    // Helper to normalize timestamps (seconds vs milliseconds)
    const normalizedNow = now > 1e11 ? now : now * 1000;
    const normalizedExpiry = mandate.expiry > 1e11 ? mandate.expiry : mandate.expiry * 1000;

    // --- Rule 1: Repository Approval ---
    const isRepoApproved = mandate.approvedRepos.includes(ticket.repo);
    if (!isRepoApproved) {
      hasBlockingFailure = true;
      const msg = `Repository '${ticket.repo}' is not in approved mandate list [${mandate.approvedRepos.join(', ')}]`;
      ruleCheckResults.push({ rule: 'RULE_1_APPROVED_REPO', passed: false, message: msg });
      reasons.push(msg);
    } else {
      ruleCheckResults.push({
        rule: 'RULE_1_APPROVED_REPO',
        passed: true,
        message: `Repository '${ticket.repo}' is approved.`,
      });
    }

    // --- Rule 2: Duplicate Check ---
    const isDuplicate = treasuryState.fundedTicketIds.includes(ticket.id);
    if (isDuplicate) {
      hasBlockingFailure = true;
      const msg = `Ticket '${ticket.id}' is already funded or resolved in treasury registry`;
      ruleCheckResults.push({ rule: 'RULE_2_NO_DUPLICATE_FUNDING', passed: false, message: msg });
      reasons.push(msg);
    } else {
      ruleCheckResults.push({
        rule: 'RULE_2_NO_DUPLICATE_FUNDING',
        passed: true,
        message: `Ticket '${ticket.id}' is unique and unallocated.`,
      });
    }

    // --- Rule 3: Max Bounty Per Ticket ---
    const isBountyWithinLimit = proposedBounty > 0 && proposedBounty <= mandate.maxBountyPerTicket;
    if (!isBountyWithinLimit) {
      hasBlockingFailure = true;
      const msg = proposedBounty <= 0
        ? `Proposed bounty must be greater than zero (received ${proposedBounty})`
        : `Proposed bounty (${proposedBounty}) exceeds mandate max bounty per ticket (${mandate.maxBountyPerTicket})`;
      ruleCheckResults.push({ rule: 'RULE_3_MAX_BOUNTY_PER_TICKET', passed: false, message: msg });
      reasons.push(msg);
    } else {
      ruleCheckResults.push({
        rule: 'RULE_3_MAX_BOUNTY_PER_TICKET',
        passed: true,
        message: `Proposed bounty (${proposedBounty}) is within ticket cap (${mandate.maxBountyPerTicket}).`,
      });
    }

    // --- Rule 4: Max Spend Per Round ---
    const totalRoundSpendAfter = currentRoundSpend + proposedBounty;
    const isRoundSpendWithinLimit = totalRoundSpendAfter <= mandate.maxSpendPerRound;
    if (!isRoundSpendWithinLimit) {
      hasBlockingFailure = true;
      const msg = `Projected round spend (${totalRoundSpendAfter}) exceeds mandate round cap (${mandate.maxSpendPerRound})`;
      ruleCheckResults.push({ rule: 'RULE_4_MAX_SPEND_PER_ROUND', passed: false, message: msg });
      reasons.push(msg);
    } else {
      ruleCheckResults.push({
        rule: 'RULE_4_MAX_SPEND_PER_ROUND',
        passed: true,
        message: `Round spend after allocation (${totalRoundSpendAfter}) is within round cap (${mandate.maxSpendPerRound}).`,
      });
    }

    // --- Rule 5: Min Uncommitted Reserve ---
    const remainingUncommitted = treasuryState.balance - (treasuryState.committed + proposedBounty);
    const hasSufficientReserve = remainingUncommitted >= mandate.minUncommittedReserve;
    if (!hasSufficientReserve) {
      hasBlockingFailure = true;
      const msg = `Treasury reserve breach: remaining uncommitted balance (${remainingUncommitted}) violates mandated minimum reserve (${mandate.minUncommittedReserve})`;
      ruleCheckResults.push({ rule: 'RULE_5_MIN_UNCOMMITTED_RESERVE', passed: false, message: msg });
      reasons.push(msg);
    } else {
      ruleCheckResults.push({
        rule: 'RULE_5_MIN_UNCOMMITTED_RESERVE',
        passed: true,
        message: `Treasury retains sufficient uncommitted reserve (${remainingUncommitted} >= ${mandate.minUncommittedReserve}).`,
      });
    }

    // --- Rule 6: Mandate Active & Not Expired ---
    const isPaused = mandate.isPaused;
    const isExpired = normalizedExpiry > 0 && normalizedNow > normalizedExpiry;
    if (isPaused || isExpired) {
      hasBlockingFailure = true;
      const msg = isPaused && isExpired
        ? `Mandate is currently paused by steward AND has expired on ${new Date(normalizedExpiry).toISOString()}`
        : isPaused
        ? 'Mandate is currently paused by steward'
        : `Mandate expired on ${new Date(normalizedExpiry).toISOString()}`;
      ruleCheckResults.push({ rule: 'RULE_6_MANDATE_ACTIVE_AND_VALID', passed: false, message: msg });
      reasons.push(msg);
    } else {
      ruleCheckResults.push({
        rule: 'RULE_6_MANDATE_ACTIVE_AND_VALID',
        passed: true,
        message: 'Mandate is active and within validity window.',
      });
    }

    // --- Rule 7: Maintainer Opt-in ---
    const isMaintainerApproved = ticket.isEligible && ticket.maintainerApproved;
    if (!isMaintainerApproved) {
      hasBlockingFailure = true;
      const msg = !ticket.maintainerApproved
        ? `Ticket '${ticket.id}' has not been approved by an authorized repository maintainer`
        : `Ticket '${ticket.id}' is marked as ineligible by repository maintainer`;
      ruleCheckResults.push({ rule: 'RULE_7_MAINTAINER_OPT_IN', passed: false, message: msg });
      reasons.push(msg);
    } else {
      ruleCheckResults.push({
        rule: 'RULE_7_MAINTAINER_OPT_IN',
        passed: true,
        message: 'Ticket is marked eligible and approved by maintainer.',
      });
    }

    // --- Rule 8: Acceptance Conditions Well-Formed ---
    const hasValidConditions = Array.isArray(ticket.acceptanceConditions) &&
      ticket.acceptanceConditions.length > 0 &&
      ticket.acceptanceConditions.every((c) => typeof c === 'string' && c.trim().length > 0);

    if (!hasValidConditions) {
      hasBlockingFailure = true;
      const msg = `Ticket '${ticket.id}' must provide at least one concrete, non-empty acceptance condition`;
      ruleCheckResults.push({ rule: 'RULE_8_ACCEPTANCE_CONDITIONS_VALID', passed: false, message: msg });
      reasons.push(msg);
    } else {
      ruleCheckResults.push({
        rule: 'RULE_8_ACCEPTANCE_CONDITIONS_VALID',
        passed: true,
        message: `Ticket contains ${ticket.acceptanceConditions.length} verified acceptance condition(s).`,
      });
    }

    // --- Rule 9: Evidence Confidence Threshold ---
    // If critical failure (< 0.2 or missing evidence when failure reported): BLOCKED
    // If confidence < 0.4: REVIEW_REQUIRED
    if (evidenceConfidence < 0.2 || (ticket.publicEvidence.length === 0 && ticket.observedFailure.length > 0 && evidenceConfidence < 0.35)) {
      hasBlockingFailure = true;
      const msg = `Evidence confidence (${evidenceConfidence.toFixed(2)}) is critically insufficient for automated reservation (minimum 0.20 required)`;
      ruleCheckResults.push({ rule: 'RULE_9_EVIDENCE_CONFIDENCE_THRESHOLD', passed: false, message: msg });
      reasons.push(msg);
    } else if (evidenceConfidence < 0.4) {
      hasReviewRequired = true;
      const msg = `Evidence confidence (${evidenceConfidence.toFixed(2)}) is below automated pass threshold (0.40); manual steward review required`;
      ruleCheckResults.push({ rule: 'RULE_9_EVIDENCE_CONFIDENCE_THRESHOLD', passed: false, message: msg });
      reasons.push(msg);
    } else {
      ruleCheckResults.push({
        rule: 'RULE_9_EVIDENCE_CONFIDENCE_THRESHOLD',
        passed: true,
        message: `Evidence confidence (${evidenceConfidence.toFixed(2)}) satisfies automated confidence threshold (>= 0.40).`,
      });
    }

    // --- Verdict Determination ---
    let status: PolicyVerdictStatus = 'ELIGIBLE';
    let recommendedAction = 'Proceed with on-chain bounty reservation via Treasury contract.';

    if (hasBlockingFailure) {
      status = 'BLOCKED';
      recommendedAction = 'Reservation blocked. Correct failing deterministic conditions or select another ticket.';
    } else if (hasReviewRequired) {
      status = 'REVIEW_REQUIRED';
      recommendedAction = 'Requires human maintainer or steward review before bounty reservation can proceed.';
    }

    if (reasons.length === 0) {
      reasons.push('All 9 deterministic policy rules passed. Ticket is eligible for bounty reservation.');
    }

    return {
      status,
      reasons,
      ruleCheckResults,
      recommendedAction,
    };
  }
}
