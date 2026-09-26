import { describe, it, expect } from 'vitest';
import { PolicyEngine } from '../src/policy-engine.js';
import { Mandate, Ticket, TreasuryState } from '../src/types.js';
import { DEMO_MANDATE, DEMO_TREASURY_STATE, DEMO_TICKETS } from '../src/demo-data.js';

describe('OpenWorks Policy Engine - Deterministic Rule Verification', () => {
  const baseMandate: Mandate = { ...DEMO_MANDATE };
  const baseTreasury: TreasuryState = { ...DEMO_TREASURY_STATE };
  const validTicket: Ticket = { ...DEMO_TICKETS[0] };

  it('verdict is ELIGIBLE when all 9 deterministic policy rules pass', () => {
    const verdict = PolicyEngine.evaluate({
      mandate: baseMandate,
      ticket: validTicket,
      proposedBounty: 1500,
      treasuryState: baseTreasury,
      currentRoundSpend: 1000,
      evidenceConfidence: 0.90,
      now: 1727318400,
    });

    expect(verdict.status).toBe('ELIGIBLE');
    expect(verdict.ruleCheckResults.length).toBe(9);
    expect(verdict.ruleCheckResults.every((r) => r.passed)).toBe(true);
    expect(verdict.recommendedAction).toContain('Proceed with on-chain bounty reservation');
  });

  it('Rule 1: BLOCKS if repository is not in approved mandate list', () => {
    const unapprovedTicket: Ticket = {
      ...validTicket,
      repo: 'unauthorized/random-repo',
    };

    const verdict = PolicyEngine.evaluate({
      mandate: baseMandate,
      ticket: unapprovedTicket,
      proposedBounty: 1000,
      treasuryState: baseTreasury,
    });

    expect(verdict.status).toBe('BLOCKED');
    const r1 = verdict.ruleCheckResults.find((r) => r.rule === 'RULE_1_APPROVED_REPO');
    expect(r1?.passed).toBe(false);
    expect(verdict.reasons.some((reason) => reason.includes('not in approved mandate list'))).toBe(true);
  });

  it('Rule 2: BLOCKS duplicate ticket funding', () => {
    const duplicateTicket: Ticket = {
      ...validTicket,
      id: 'ticket-legacy-prefunded-001',
    };

    const verdict = PolicyEngine.evaluate({
      mandate: baseMandate,
      ticket: duplicateTicket,
      proposedBounty: 1000,
      treasuryState: baseTreasury,
    });

    expect(verdict.status).toBe('BLOCKED');
    const r2 = verdict.ruleCheckResults.find((r) => r.rule === 'RULE_2_NO_DUPLICATE_FUNDING');
    expect(r2?.passed).toBe(false);
    expect(verdict.reasons.some((reason) => reason.includes('already funded or resolved'))).toBe(true);
  });

  it('Rule 3: BLOCKS proposed bounty exceeding mandate maxBountyPerTicket or <= 0', () => {
    const overCapVerdict = PolicyEngine.evaluate({
      mandate: baseMandate,
      ticket: validTicket,
      proposedBounty: 3000, // Mandate cap is 2500
      treasuryState: baseTreasury,
    });
    expect(overCapVerdict.status).toBe('BLOCKED');
    const r3Over = overCapVerdict.ruleCheckResults.find((r) => r.rule === 'RULE_3_MAX_BOUNTY_PER_TICKET');
    expect(r3Over?.passed).toBe(false);

    const zeroBountyVerdict = PolicyEngine.evaluate({
      mandate: baseMandate,
      ticket: validTicket,
      proposedBounty: 0,
      treasuryState: baseTreasury,
    });
    expect(zeroBountyVerdict.status).toBe('BLOCKED');
    const r3Zero = zeroBountyVerdict.ruleCheckResults.find((r) => r.rule === 'RULE_3_MAX_BOUNTY_PER_TICKET');
    expect(r3Zero?.passed).toBe(false);
  });

  it('Rule 4: BLOCKS allocation exceeding maxSpendPerRound', () => {
    const verdict = PolicyEngine.evaluate({
      mandate: baseMandate, // maxSpendPerRound = 5000
      ticket: validTicket,
      proposedBounty: 2000,
      treasuryState: baseTreasury,
      currentRoundSpend: 4000, // 4000 + 2000 = 6000 > 5000
    });

    expect(verdict.status).toBe('BLOCKED');
    const r4 = verdict.ruleCheckResults.find((r) => r.rule === 'RULE_4_MAX_SPEND_PER_ROUND');
    expect(r4?.passed).toBe(false);
    expect(verdict.reasons.some((reason) => reason.includes('round cap'))).toBe(true);
  });

  it('Rule 5: BLOCKS allocation violating minUncommittedReserve', () => {
    const tightTreasury: TreasuryState = {
      balance: 3000,
      committed: 1000,
      roundSpend: 500,
      fundedTicketIds: [],
    };
    // minUncommittedReserve is 1000. Balance(3000) - (Committed(1000) + Proposed(1500)) = 500 < 1000!
    const verdict = PolicyEngine.evaluate({
      mandate: baseMandate,
      ticket: validTicket,
      proposedBounty: 1500,
      treasuryState: tightTreasury,
    });

    expect(verdict.status).toBe('BLOCKED');
    const r5 = verdict.ruleCheckResults.find((r) => r.rule === 'RULE_5_MIN_UNCOMMITTED_RESERVE');
    expect(r5?.passed).toBe(false);
    expect(verdict.reasons.some((reason) => reason.includes('reserve breach'))).toBe(true);
  });

  it('Rule 6: BLOCKS when mandate is paused or expired', () => {
    const pausedMandate: Mandate = { ...baseMandate, isPaused: true };
    const pausedVerdict = PolicyEngine.evaluate({
      mandate: pausedMandate,
      ticket: validTicket,
      proposedBounty: 1000,
      treasuryState: baseTreasury,
    });
    expect(pausedVerdict.status).toBe('BLOCKED');
    const r6Paused = pausedVerdict.ruleCheckResults.find((r) => r.rule === 'RULE_6_MANDATE_ACTIVE_AND_VALID');
    expect(r6Paused?.passed).toBe(false);
    expect(pausedVerdict.reasons.some((reason) => reason.includes('paused by steward'))).toBe(true);

    const expiredMandate: Mandate = { ...baseMandate, expiry: 1600000000 }; // Year 2020
    const expiredVerdict = PolicyEngine.evaluate({
      mandate: expiredMandate,
      ticket: validTicket,
      proposedBounty: 1000,
      treasuryState: baseTreasury,
      now: 1727318400, // Year 2024
    });
    expect(expiredVerdict.status).toBe('BLOCKED');
    const r6Expired = expiredVerdict.ruleCheckResults.find((r) => r.rule === 'RULE_6_MANDATE_ACTIVE_AND_VALID');
    expect(r6Expired?.passed).toBe(false);
    expect(expiredVerdict.reasons.some((reason) => reason.includes('expired'))).toBe(true);
  });

  it('Rule 7: BLOCKS when maintainer approval is missing', () => {
    const unapprovedTicket: Ticket = {
      ...validTicket,
      maintainerApproved: false,
    };

    const verdict = PolicyEngine.evaluate({
      mandate: baseMandate,
      ticket: unapprovedTicket,
      proposedBounty: 1000,
      treasuryState: baseTreasury,
    });

    expect(verdict.status).toBe('BLOCKED');
    const r7 = verdict.ruleCheckResults.find((r) => r.rule === 'RULE_7_MAINTAINER_OPT_IN');
    expect(r7?.passed).toBe(false);
  });

  it('Rule 8: BLOCKS when acceptance conditions are empty or malformed', () => {
    const emptyConditionsTicket: Ticket = {
      ...validTicket,
      acceptanceConditions: [],
    };

    const verdict = PolicyEngine.evaluate({
      mandate: baseMandate,
      ticket: emptyConditionsTicket,
      proposedBounty: 1000,
      treasuryState: baseTreasury,
    });

    expect(verdict.status).toBe('BLOCKED');
    const r8 = verdict.ruleCheckResults.find((r) => r.rule === 'RULE_8_ACCEPTANCE_CONDITIONS_VALID');
    expect(r8?.passed).toBe(false);
  });

  it('Rule 9: Triggers REVIEW_REQUIRED when evidence confidence is between 0.20 and 0.40', () => {
    const lowEvidenceTicket: Ticket = {
      ...validTicket,
      publicEvidence: ['https://example.com/log.txt'],
    };

    const verdict = PolicyEngine.evaluate({
      mandate: baseMandate,
      ticket: lowEvidenceTicket,
      proposedBounty: 1000,
      treasuryState: baseTreasury,
      evidenceConfidence: 0.32,
    });

    expect(verdict.status).toBe('REVIEW_REQUIRED');
    expect(verdict.recommendedAction).toContain('Requires human maintainer or steward review');
    const r9 = verdict.ruleCheckResults.find((r) => r.rule === 'RULE_9_EVIDENCE_CONFIDENCE_THRESHOLD');
    expect(r9?.passed).toBe(false);
  });

  it('Rule 9: BLOCKS when evidence confidence is critically low (< 0.20)', () => {
    const noEvidenceTicket: Ticket = {
      ...validTicket,
      publicEvidence: [],
      observedFailure: 'Node crashed',
    };

    const verdict = PolicyEngine.evaluate({
      mandate: baseMandate,
      ticket: noEvidenceTicket,
      proposedBounty: 1000,
      treasuryState: baseTreasury,
      evidenceConfidence: 0.10,
    });

    expect(verdict.status).toBe('BLOCKED');
    const r9 = verdict.ruleCheckResults.find((r) => r.rule === 'RULE_9_EVIDENCE_CONFIDENCE_THRESHOLD');
    expect(r9?.passed).toBe(false);
    expect(verdict.reasons.some((reason) => reason.includes('critically insufficient'))).toBe(true);
  });
});
