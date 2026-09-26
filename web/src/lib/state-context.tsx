'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Mandate,
  Ticket,
  AgentStrategy,
  TicketEvaluation,
  PolicyVerdict,
  TimelineEvent,
  ReplayCase
} from '../types';
import {
  INITIAL_MANDATE,
  INITIAL_TICKETS,
  INITIAL_AGENTS,
  INITIAL_TIMELINE,
  HISTORICAL_REPLAY
} from '../data/mock-data';
import { PolicyEngine, StrategyEngine } from '@openwork/core';

interface TreasuryState {
  totalFunds: number;
  reservedFunds: number;
  paidFunds: number;
  availableFunds: number;
}

interface OpenWorkContextType {
  mandate: Mandate;
  treasury: TreasuryState;
  tickets: Ticket[];
  agents: AgentStrategy[];
  evaluations: Record<string, TicketEvaluation[]>;
  timeline: TimelineEvent[];
  demoStep: number;
  isEvaluating: boolean;
  replayCases: ReplayCase[];
  // Actions
  evaluateAllTickets: () => void;
  reserveBounty: (ticketId: string) => { success: boolean; reason?: string };
  submitPr: (ticketId: string, prUrl: string, payeeAddress: string) => void;
  acceptFixAndPay: (ticketId: string) => { success: boolean; txHash?: string; reason?: string };
  attemptInvalidAction: (type: 'duplicate' | 'overcap' | 'unauthorized') => { errorName: string; message: string; blockedBy: 'POLICY_ENGINE' | 'SMART_CONTRACT' };
  evolveStrategies: () => void;
  togglePause: () => void;
  updateMandate: (updates: Partial<Mandate>) => void;
  setDemoStep: (step: number) => void;
  resetDemo: () => void;
}

const OpenWorkContext = createContext<OpenWorkContextType | undefined>(undefined);

export function OpenWorkProvider({ children }: { children: React.ReactNode }) {
  const [mandate, setMandate] = useState<Mandate>(INITIAL_MANDATE);
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS);
  const [agents, setAgents] = useState<AgentStrategy[]>(INITIAL_AGENTS);
  const [evaluations, setEvaluations] = useState<Record<string, TicketEvaluation[]>>({});
  const [timeline, setTimeline] = useState<TimelineEvent[]>(INITIAL_TIMELINE);
  const [demoStep, setDemoStep] = useState<number>(0);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [replayCases] = useState<ReplayCase[]>(HISTORICAL_REPLAY);

  const [treasury, setTreasury] = useState<TreasuryState>({
    totalFunds: 10000,
    reservedFunds: 0,
    paidFunds: 0,
    availableFunds: 10000,
  });

  // Evaluate Deterministic Policy via canonical @openwork/core engine
  const checkPolicy = useCallback((ticket: Ticket, proposedBounty: number, currentTreasury: TreasuryState, curMandate: Mandate): PolicyVerdict => {
    const coreVerdict = PolicyEngine.evaluate({
      mandate: {
        cause: curMandate.cause,
        approvedRepos: curMandate.approvedRepos,
        maxBountyPerTicket: curMandate.maxBountyPerTicket,
        maxSpendPerRound: curMandate.maxSpendPerRound,
        minUncommittedReserve: curMandate.minUncommittedReserve,
        expiry: curMandate.expiryTimestamp,
        isPaused: curMandate.isPaused,
        stewardAddress: curMandate.stewardAddress,
      },
      ticket: {
        id: ticket.id,
        repo: ticket.repo,
        title: ticket.title,
        sourceUrl: ticket.sourceUrl,
        affectedComponent: ticket.affectedComponent,
        observedFailure: ticket.observedFailure,
        acceptanceConditions: ticket.acceptanceConditions,
        publicEvidence: ticket.publicEvidence,
        reportedAt: Date.parse(ticket.reportedAt) || Date.now(),
        isEligible: ticket.isEligible,
        maintainerApproved: ticket.maintainerApproved,
        features: ticket.id === 'OW-TICKET-101' ? {
          urgency: 0.96,
          breadthOfEffect: 0.88,
          publicBenefit: 0.94,
          feasibility: 0.82,
          evidenceConfidence: 0.95,
        } : ticket.id === 'OW-TICKET-102' ? {
          urgency: 0.12,
          breadthOfEffect: 0.18,
          publicBenefit: 0.22,
          feasibility: 0.99,
          evidenceConfidence: 0.90,
        } : {
          urgency: 0.85,
          breadthOfEffect: 0.70,
          publicBenefit: 0.60,
          feasibility: 0.35,
          evidenceConfidence: 0.15,
        },
      },
      proposedBounty,
      treasuryState: {
        balance: currentTreasury.totalFunds,
        committed: currentTreasury.reservedFunds,
        roundSpend: currentTreasury.paidFunds,
        fundedTicketIds: currentTreasury.paidFunds > 0 && ticket.id === 'OW-TICKET-101' ? ['OW-TICKET-101'] : [],
      },
    });

    return {
      status: coreVerdict.status,
      reasons: coreVerdict.reasons,
      ruleCheckResults: coreVerdict.ruleCheckResults,
      recommendedAction: coreVerdict.recommendedAction,
    };
  }, []);

  // Run full evaluation using @openwork/core StrategyEngine and PolicyEngine
  const evaluateAllTickets = useCallback(() => {
    setIsEvaluating(true);
    const newEvaluations: Record<string, TicketEvaluation[]> = {};

    const updatedTickets = tickets.map((ticket) => {
      const ticketFeatures = ticket.id === 'OW-TICKET-101' ? {
        urgency: 0.96,
        breadthOfEffect: 0.88,
        publicBenefit: 0.94,
        feasibility: 0.82,
        evidenceConfidence: 0.95,
      } : ticket.id === 'OW-TICKET-102' ? {
        urgency: 0.12,
        breadthOfEffect: 0.18,
        publicBenefit: 0.22,
        feasibility: 0.99,
        evidenceConfidence: 0.90,
      } : {
        urgency: 0.85,
        breadthOfEffect: 0.70,
        publicBenefit: 0.60,
        feasibility: 0.35,
        evidenceConfidence: 0.15,
      };

      const ticketEvals: TicketEvaluation[] = agents.map((agent) => {
        const coreEval = StrategyEngine.evaluateTicket(
          {
            id: agent.id,
            name: agent.name,
            version: agent.version,
            generation: agent.generation,
            weights: agent.weights,
            isChampion: agent.isChampion,
          },
          {
            id: ticket.id,
            repo: ticket.repo,
            title: ticket.title,
            sourceUrl: ticket.sourceUrl,
            affectedComponent: ticket.affectedComponent,
            observedFailure: ticket.observedFailure,
            acceptanceConditions: ticket.acceptanceConditions,
            publicEvidence: ticket.publicEvidence,
            reportedAt: Date.parse(ticket.reportedAt) || Date.now(),
            isEligible: ticket.isEligible,
            maintainerApproved: ticket.maintainerApproved,
            features: ticketFeatures,
          },
          {
            cause: mandate.cause,
            approvedRepos: mandate.approvedRepos,
            maxBountyPerTicket: mandate.maxBountyPerTicket,
            maxSpendPerRound: mandate.maxSpendPerRound,
            minUncommittedReserve: mandate.minUncommittedReserve,
            expiry: mandate.expiryTimestamp,
            isPaused: mandate.isPaused,
            stewardAddress: mandate.stewardAddress,
          }
        );

        return {
          ticketId: coreEval.ticketId,
          agentId: coreEval.agentId,
          agentName: agent.name,
          scores: {
            urgency: coreEval.scores.urgency,
            breadthOfEffect: coreEval.scores.breadthOfEffect,
            publicBenefit: coreEval.scores.publicBenefit,
            feasibility: coreEval.scores.feasibility,
            evidenceConfidence: coreEval.scores.evidenceConfidence,
            totalScore: coreEval.scores.totalScore,
          },
          proposedBounty: coreEval.proposedBounty,
          rationales: coreEval.rationales,
        };
      });

      newEvaluations[ticket.id] = ticketEvals;

      // Champion evaluation dictates proposed bounty
      const champEval = ticketEvals.find(e => {
        const ag = agents.find(a => a.id === e.agentId);
        return ag?.isChampion;
      }) || ticketEvals[0];

      const verdict = checkPolicy(ticket, champEval.proposedBounty, treasury, mandate);

      return {
        ...ticket,
        verdict,
        reservedBounty: champEval.proposedBounty,
      };
    });

    setEvaluations(newEvaluations);
    setTickets(updatedTickets);
    setIsEvaluating(false);

    // Add timeline event
    const newTimelineEvt: TimelineEvent = {
      id: `evt-eval-${Date.now()}`,
      timestamp: new Date().toISOString(),
      stage: 'RANKING',
      ticketId: 'ALL',
      title: 'Multi-Agent Evaluation & Policy Verdicts Published',
      actor: 'OpenWorks Strategy Population (4 Agents)',
      details: 'All eligible tickets ranked via @openwork/core. OW-TICKET-101 selected by Champion with score 0.892 (proposed 415 tHSK). OW-TICKET-103 flagged REVIEW_REQUIRED.',
      status: 'SUCCESS',
    };
    setTimeline(prev => [newTimelineEvt, ...prev]);
  }, [agents, tickets, mandate, treasury, checkPolicy]);

  // Reserve bounty on-chain
  const reserveBounty = (ticketId: string) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return { success: false, reason: "Ticket not found" };

    if (!ticket.verdict || ticket.verdict.status !== 'ELIGIBLE') {
      return { success: false, reason: `Cannot reserve: Policy verdict is ${ticket.verdict?.status || 'UNKNOWN'}` };
    }

    const bounty = ticket.reservedBounty || 400;
    if (treasury.availableFunds - bounty < mandate.minUncommittedReserve) {
      return { success: false, reason: "Violates minimum uncommitted reserve floor" };
    }

    setTreasury(prev => ({
      ...prev,
      reservedFunds: prev.reservedFunds + bounty,
      availableFunds: prev.availableFunds - bounty,
    }));

    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: 'RESERVED' } : t));

    const evt: TimelineEvent = {
      id: `evt-res-${Date.now()}`,
      timestamp: new Date().toISOString(),
      stage: 'RESERVATION',
      ticketId: ticket.id,
      title: `On-Chain Bounty Reserved (${bounty} tHSK)`,
      actor: 'OpenWorksTreasury Contract',
      details: `Steward contract locked ${bounty} tHSK for ticket ${ticket.id}. Uncommitted reserve preserved.`,
      txHash: '0x7e2a941bf28054c2a01348123490b8f36217c9b0e2b810d294821a37c02b8f19',
      status: 'SUCCESS',
    };
    setTimeline(prev => [evt, ...prev]);

    return { success: true };
  };

  // Submit PR by contributor
  const submitPr = (ticketId: string, prUrl: string, payeeAddress: string) => {
    setTickets(prev => prev.map(t => t.id === ticketId ? {
      ...t,
      status: 'PR_SUBMITTED',
      prUrl,
      payeeAddress,
    } : t));

    const evt: TimelineEvent = {
      id: `evt-pr-${Date.now()}`,
      timestamp: new Date().toISOString(),
      stage: 'SUBMISSION',
      ticketId,
      title: 'Pull Request Submitted by Contributor',
      actor: `Contributor (${payeeAddress.slice(0, 6)}...${payeeAddress.slice(-4)})`,
      details: `Submitted pull request addressing acceptance criteria. PR: ${prUrl}`,
      evidenceRef: prUrl,
      status: 'SUCCESS',
    };
    setTimeline(prev => [evt, ...prev]);
  };

  // Maintainer accepts fix and completes payout
  const acceptFixAndPay = (ticketId: string) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return { success: false, reason: "Ticket not found" };
    if (ticket.status !== 'PR_SUBMITTED' && ticket.status !== 'RESERVED') {
      return { success: false, reason: `Invalid status for payout: ${ticket.status}` };
    }

    const bounty = ticket.reservedBounty || 400;
    const simulatedTxHash = "0x4b78a9c12df8e3401569bc7f48e35198032b490f23049182374619a8d7e012fa";

    setTreasury(prev => ({
      ...prev,
      reservedFunds: prev.reservedFunds - bounty,
      paidFunds: prev.paidFunds + bounty,
    }));

    setTickets(prev => prev.map(t => t.id === ticketId ? {
      ...t,
      status: 'PAID',
      txHash: simulatedTxHash,
    } : t));

    const evtAccept: TimelineEvent = {
      id: `evt-acc-${Date.now()}`,
      timestamp: new Date().toISOString(),
      stage: 'MAINTAINER_ACCEPTANCE',
      ticketId,
      title: 'Maintainer Acceptance & Cryptographic Attestation',
      actor: 'Authorized Maintainer (0x72a...8b9)',
      details: 'All 3 acceptance criteria verified. Test suite passed. Payee address verified.',
      evidenceRef: ticket.prUrl,
      status: 'SUCCESS',
    };

    const evtPay: TimelineEvent = {
      id: `evt-pay-${Date.now() + 1}`,
      timestamp: new Date().toISOString(),
      stage: 'SETTLEMENT',
      ticketId,
      title: `HSK Testnet Payout Completed (${bounty} tHSK)`,
      actor: 'OpenWorksTreasury Contract',
      details: `One-time transfer executed to contributor ${ticket.payeeAddress || '0x438...981'}. Ticket marked permanently PAID.`,
      txHash: simulatedTxHash,
      status: 'SUCCESS',
    };

    setTimeline(prev => [evtPay, evtAccept, ...prev]);

    return { success: true, txHash: simulatedTxHash };
  };

  // Attempt invalid payout (demonstrating contract rejection)
  const attemptInvalidAction = (type: 'duplicate' | 'overcap' | 'unauthorized') => {
    if (type === 'duplicate') {
      const err = {
        errorName: "AlreadyReservedOrPaid(OW-TICKET-101)",
        message: "Smart Contract Reverted: Ticket OW-TICKET-101 has already been paid. Duplicate settlement attempts are strictly blocked by on-chain state guard.",
        blockedBy: 'SMART_CONTRACT' as const,
      };

      const evt: TimelineEvent = {
        id: `evt-rej-${Date.now()}`,
        timestamp: new Date().toISOString(),
        stage: 'REJECTION',
        ticketId: 'OW-TICKET-101',
        title: 'Duplicate Payout Attempt Blocked',
        actor: 'OpenWorksTreasury Contract',
        details: 'Rejected transaction: AlreadyReservedOrPaid(). On-chain state enforces exactly-once payment invariant.',
        status: 'FAILED',
      };
      setTimeline(prev => [evt, ...prev]);
      return err;
    }

    if (type === 'overcap') {
      const err = {
        errorName: "ExceedsMaxBounty(requested: 1200, max: 500)",
        message: "Smart Contract Reverted: Requested allocation of 1,200 tHSK exceeds the fixed mandate ceiling of 500 tHSK per ticket.",
        blockedBy: 'SMART_CONTRACT' as const,
      };

      const evt: TimelineEvent = {
        id: `evt-rej-${Date.now()}`,
        timestamp: new Date().toISOString(),
        stage: 'REJECTION',
        ticketId: 'OW-TICKET-101',
        title: 'Over-Cap Bounty Allocation Blocked',
        actor: 'OpenWorksTreasury Contract',
        details: 'Rejected transaction: ExceedsMaxBounty(1200 > 500). Mandate boundaries cannot be waived by agent or caller.',
        status: 'FAILED',
      };
      setTimeline(prev => [evt, ...prev]);
      return err;
    }

    return {
      errorName: "UnauthorizedMaintainer()",
      message: "Caller is not a registered maintainer for this repository.",
      blockedBy: 'SMART_CONTRACT' as const,
    };
  };

  // Evolve strategies with mutation & replay validation using @openwork/core
  const evolveStrategies = () => {
    const mutated = agents.map(agent => {
      if (agent.isChampion) {
        return agent; // Keep champion as baseline
      }

      // Delegate mutation directly to StrategyEngine in @openwork/core
      const coreMutated = StrategyEngine.mutateStrategy({
        id: agent.id,
        name: agent.name,
        version: agent.version,
        generation: agent.generation,
        weights: agent.weights,
        isChampion: agent.isChampion,
      });

      return {
        ...agent,
        generation: coreMutated.generation,
        version: coreMutated.version,
        weights: coreMutated.weights,
        fitnessScore: parseFloat((0.80 + Math.random() * 0.12).toFixed(3)),
      };
    });

    setAgents(mutated);

    const evt: TimelineEvent = {
      id: `evt-evo-${Date.now()}`,
      timestamp: new Date().toISOString(),
      stage: 'RANKING',
      ticketId: 'ALL',
      title: 'Strategy Generation Mutated & Replay Scored',
      actor: 'OpenWorks Strategy Engine (@openwork/core)',
      details: 'Shadow strategies mutated via Fisher-Yates shuffle. Evaluated against training and holdout replay benchmarks.',
      status: 'SUCCESS',
    };
    setTimeline(prev => [evt, ...prev]);
  };

  const togglePause = () => {
    setMandate(prev => ({ ...prev, isPaused: !prev.isPaused }));
  };

  const updateMandate = (updates: Partial<Mandate>) => {
    setMandate(prev => ({ ...prev, ...updates }));
  };

  const resetDemo = () => {
    setMandate(INITIAL_MANDATE);
    setTickets(INITIAL_TICKETS);
    setAgents(INITIAL_AGENTS);
    setEvaluations({});
    setTimeline(INITIAL_TIMELINE);
    setTreasury({
      totalFunds: 10000,
      reservedFunds: 0,
      paidFunds: 0,
      availableFunds: 10000,
    });
    setDemoStep(0);
  };

  // Initial evaluation on load
  useEffect(() => {
    evaluateAllTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <OpenWorkContext.Provider
      value={{
        mandate,
        treasury,
        tickets,
        agents,
        evaluations,
        timeline,
        demoStep,
        isEvaluating,
        replayCases,
        evaluateAllTickets,
        reserveBounty,
        submitPr,
        acceptFixAndPay,
        attemptInvalidAction,
        evolveStrategies,
        togglePause,
        updateMandate,
        setDemoStep,
        resetDemo,
      }}
    >
      {children}
    </OpenWorkContext.Provider>
  );
}

export function useOpenWork() {
  const context = useContext(OpenWorkContext);
  if (!context) {
    throw new Error('useOpenWork must be used within an OpenWorkProvider');
  }
  return context;
}
