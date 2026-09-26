'use client';

import React, { useState } from 'react';
import {
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Shield,
  Layers,
  Cpu,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  XCircle,
  FileCheck2,
  DollarSign
} from 'lucide-react';
import { useOpenWork } from '../lib/state-context';
import { useWeb3Hsk } from '../lib/web3-hsk-context';
import { CONTRACT_ADDRESSES, getExplorerTxUrl, getExplorerAddressUrl, formatAddress } from '../config/hsk-chain';
import TicketCard from './TicketCard';
import VerdictBadge from './VerdictBadge';

export default function NarrativeShowcase() {
  const {
    mandate,
    treasury,
    tickets,
    agents,
    evaluations,
    timeline,
    demoStep,
    setDemoStep,
    reserveBounty,
    submitPr,
    acceptFixAndPay,
    attemptInvalidAction,
    evolveStrategies,
    resetDemo,
  } = useOpenWork();

  const {
    account,
    isHskChain,
    hskBalance,
    isLiveMode,
    reserveBountyOnChain,
    settleBountyOnChain,
  } = useWeb3Hsk();

  const [onChainActionStatus, setOnChainActionStatus] = useState<string | null>(null);

  const [rejectedFeedback, setRejectedFeedback] = useState<{
    errorName: string;
    message: string;
    blockedBy: string;
  } | null>(null);

  const steps = [
    {
      time: "0:00–0:30",
      title: "Cause, Mandate & Competing Tickets",
      summary: "Inspect the fixed public-goods cause, approved repository list, fund treasury, and 3 differentiated tickets.",
      icon: Layers,
    },
    {
      time: "0:30–1:05",
      title: "Multi-Agent Strategy Rankings & Selection",
      summary: "Compare competing agent strategies, inspect transparent rationales, and verify why OW-TICKET-101 is selected.",
      icon: Cpu,
    },
    {
      time: "1:05–1:55",
      title: "Bounded Reservation & HSK Payout",
      summary: "Execute bounded on-chain reservation, record maintainer acceptance attestation, and settle testnet tokens.",
      icon: DollarSign,
    },
    {
      time: "1:55–2:30",
      title: "Invariant Enforcement & Contract Rejections",
      summary: "Test protocol security: attempt an over-cap bounty and duplicate payout, verifying hard on-chain revert.",
      icon: Shield,
    },
    {
      time: "2:30–3:00",
      title: "Ticket-to-Payment Trace & Evolutionary Replay",
      summary: "Audit full immutable lineage and examine historical strategy replay with strictly separated holdout data.",
      icon: Clock,
    }
  ];

  const handleExecuteP2pFlow = () => {
    reserveBounty("OW-TICKET-101");
    setTimeout(() => {
      submitPr(
        "OW-TICKET-101",
        "https://github.com/openwork-protocol/consensus-p2p/pull/112",
        "0x71C...49A1"
      );
    }, 400);
    setTimeout(() => {
      acceptFixAndPay("OW-TICKET-101");
    }, 900);
  };

  const handleTestDuplicate = () => {
    const err = attemptInvalidAction('duplicate');
    setRejectedFeedback(err);
  };

  const handleTestOvercap = () => {
    const err = attemptInvalidAction('overcap');
    setRejectedFeedback(err);
  };

  return (
    <div className="space-y-6">
      {/* Narrative Progress Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-900/60 text-blue-300 border border-blue-700/50">
                HACKATHON SHOWCASE NARRATIVE
              </span>
              <span className="text-xs text-slate-400">Section 7 Prototype Walkthrough</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">
              OpenWorks 3-Minute Proof of Value
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={resetDemo}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 hover:text-white flex items-center space-x-1.5 transition-colors border border-slate-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset State</span>
            </button>
            <button
              onClick={() => setDemoStep((demoStep + 1) % steps.length)}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white flex items-center space-x-1.5 shadow-md shadow-blue-500/20 transition-colors"
            >
              <span>Next Phase</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 5-Step Narrative Stepper */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-5">
          {steps.map((st, index) => {
            const Icon = st.icon;
            const isCurrent = demoStep === index;
            const isCompleted = demoStep > index;

            return (
              <button
                key={index}
                onClick={() => setDemoStep(index)}
                className={`p-3 rounded-lg border text-left transition-all relative ${
                  isCurrent
                    ? 'bg-blue-950/60 border-blue-500 shadow-md shadow-blue-900/20 ring-1 ring-blue-500/50'
                    : isCompleted
                    ? 'bg-slate-950 border-emerald-900/50 hover:border-slate-700 text-slate-300'
                    : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    isCurrent ? 'bg-blue-600 text-white' : isCompleted ? 'bg-emerald-900 text-emerald-300' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {st.time}
                  </span>
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Icon className={`w-3.5 h-3.5 ${isCurrent ? 'text-blue-400' : 'text-slate-500'}`} />
                  )}
                </div>
                <h4 className={`text-xs font-semibold line-clamp-1 ${isCurrent ? 'text-white' : isCompleted ? 'text-slate-200' : 'text-slate-400'}`}>
                  {st.title}
                </h4>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step Content Rendering */}
      {demoStep === 0 && (
        <div className="space-y-6 animate-in fade-in">
          {/* Overview Banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span>0:00–0:30 — Fixed Spending Mandate & 3 Competing Tickets</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              OpenWorks allocates a fixed test-token fund ({treasury.totalFunds.toLocaleString()} tHSK) strictly bounded by the steward's mandate. The agent cannot change custody or money limits. Here are the 3 candidate issues gathered from approved repo <code className="text-blue-400 bg-slate-950 px-1 py-0.5 rounded">{mandate.approvedRepos[0]}</code>.
            </p>
          </div>

          {/* 3 Tickets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {tickets.map((t) => (
              <TicketCard
                key={t.id}
                ticket={t}
                evaluation={evaluations[t.id]?.find(e => e.agentId === 'ow-champ-v2')}
                showActions={false}
              />
            ))}
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setDemoStep(1)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-2 transition-colors shadow-lg shadow-blue-500/20"
            >
              <span>Proceed to Phase 2: Agent Ranking & Evidence Analysis</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {demoStep === 1 && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span>0:30–1:05 — Competing Agent Strategies & Policy Verdict</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Multiple agents rank the same tickets using transparent weightings. Only the <strong className="text-white">Champion Agent</strong> can propose reservations. Notice that <strong>OW-TICKET-101</strong> achieves highest score due to active consensus failure urgency, while <strong>OW-TICKET-103</strong> is placed in <VerdictBadge status="REVIEW_REQUIRED" size="sm" /> by the Verifiable Policy Engine because reproduction logs are missing.
            </p>
          </div>

          {/* Agent Rankings Comparison Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 overflow-x-auto">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
              Agent Strategy Matrix & Comparative Ticket Scores
            </h4>
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono">
                  <th className="pb-3">Strategy Profile</th>
                  <th className="pb-3">Weights (Urg / Imp / Feas / Evid)</th>
                  <th className="pb-3">OW-TICKET-101 (Deadlock)</th>
                  <th className="pb-3">OW-TICKET-102 (Docs)</th>
                  <th className="pb-3">OW-TICKET-103 (No Repro)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {agents.map((ag) => {
                  const e1 = evaluations['OW-TICKET-101']?.find(e => e.agentId === ag.id);
                  const e2 = evaluations['OW-TICKET-102']?.find(e => e.agentId === ag.id);
                  const e3 = evaluations['OW-TICKET-103']?.find(e => e.agentId === ag.id);

                  return (
                    <tr key={ag.id} className={ag.isChampion ? 'bg-blue-950/20 text-white' : 'text-slate-300'}>
                      <td className="py-3 font-semibold flex items-center space-x-1.5">
                        {ag.isChampion && <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
                        <span>{ag.name}</span>
                        {ag.isChampion && (
                          <span className="text-[10px] bg-amber-900/60 text-amber-300 px-1.5 py-0.5 rounded ml-1 font-bold">
                            CHAMPION
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-slate-400">
                        {ag.weights.urgency} / {ag.weights.breadthOfEffect} / {ag.weights.feasibility} / {ag.weights.evidenceConfidence}
                      </td>
                      <td className="py-3 text-emerald-400 font-bold">
                        {e1 ? `${(e1.scores.totalScore * 100).toFixed(1)}% (${e1.proposedBounty} tHSK)` : '—'}
                      </td>
                      <td className="py-3 text-slate-400">
                        {e2 ? `${(e2.scores.totalScore * 100).toFixed(1)}% (${e2.proposedBounty} tHSK)` : '—'}
                      </td>
                      <td className="py-3 text-amber-400">
                        {e3 ? `${(e3.scores.totalScore * 100).toFixed(1)}% (${e3.proposedBounty} tHSK)` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setDemoStep(2)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-2 transition-colors shadow-lg shadow-blue-500/20"
            >
              <span>Proceed to Phase 3: Execute Reservation & Testnet Payout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {demoStep === 2 && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span>1:05–1:55 — On-Chain Reservation, Acceptance & Real Payout</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              The champion reserves a bounded bounty for <strong>OW-TICKET-101</strong> on HashKey (HSK) Testnet. Contributor submits the pull request, and the maintainer verifies the 3 acceptance conditions and confirms payment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Selected Ticket Action Card */}
            <div>
              <TicketCard
                ticket={tickets[0]}
                evaluation={evaluations['OW-TICKET-101']?.find(e => e.agentId === 'ow-champ-v2')}
                onReserve={reserveBounty}
                onSubmitPr={(id) => submitPr(id, 'https://github.com/openwork-protocol/consensus-p2p/pull/112', '0x71C...49A1')}
                onAcceptFix={acceptFixAndPay}
              />
            </div>

            {/* Live Settlement Status Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center space-x-1.5">
                  <FileCheck2 className="w-4 h-4 text-emerald-400" />
                  <span>Settlement State Machine</span>
                </h4>

                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400">Current Ticket Status:</span>
                    <span className="font-mono font-bold text-white px-2 py-0.5 rounded bg-slate-800">
                      {tickets[0].status}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400">Contract Bounty Amount:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {tickets[0].reservedBounty || 415} tHSK
                    </span>
                  </div>

                  {tickets[0].txHash && (
                    <div className="p-3 bg-emerald-950/30 border border-emerald-800/50 rounded-lg">
                      <div className="text-slate-400 text-[11px] mb-1">Settlement Transaction Hash (HSK):</div>
                      <a
                        href={getExplorerTxUrl(tickets[0].txHash)}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-emerald-300 text-xs flex items-center space-x-1 hover:underline break-all"
                      >
                        <span>{tickets[0].txHash}</span>
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col gap-2">
                {tickets[0].status !== 'PAID' ? (
                  <>
                    <button
                      onClick={handleExecuteP2pFlow}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition-colors shadow-lg shadow-emerald-600/20"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>One-Click: Reserve, Confirm PR & Complete Payout</span>
                    </button>

                    {account && isHskChain && (
                      <button
                        onClick={async () => {
                          setOnChainActionStatus('Signing and broadcasting to HashKey Chain...');
                          const res = await settleBountyOnChain(
                            'OW-TICKET-101',
                            account,
                            'https://github.com/openwork-protocol/consensus-p2p/pull/112'
                          );
                          if (res.success && res.txHash) {
                            setOnChainActionStatus(`Settled on HSK Chain! TX: ${res.txHash}`);
                          } else {
                            setOnChainActionStatus(`On-chain response: ${res.error}`);
                          }
                        }}
                        className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center justify-center space-x-2 transition-colors border border-slate-700"
                      >
                        <ExternalLink className="w-3 h-3 text-emerald-400" />
                        <span>Sign Live Transaction on HashKey Testnet</span>
                      </button>
                    )}
                  </>
                ) : (
                  <div className="text-center text-xs font-mono text-emerald-400 bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-800/40">
                    ✓ Payout verified and completed on HSK testnet!
                  </div>
                )}

                {onChainActionStatus && (
                  <div className="p-2 rounded bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300">
                    {onChainActionStatus}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setDemoStep(3)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-2 transition-colors shadow-lg shadow-blue-500/20"
            >
              <span>Proceed to Phase 4: Test Invariant Rejection</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {demoStep === 3 && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>1:55–2:30 — Invariant Enforcement: Rejecting Duplicate & Over-Cap Actions</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Brief Section 7 requirement: <em>"It must also show a rejected duplicate or over-cap payment."</em> Smart contract custom errors enforce exactly-once settlement and spending mandate caps.
            </p>
          </div>

          {/* Test Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-semibold text-white mb-2 flex items-center space-x-2">
                  <XCircle className="w-4 h-4 text-rose-400" />
                  <span>Test Duplicate Settlement Invariant</span>
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Attempt to execute a second payment for OW-TICKET-101 after it has already been paid. The Solidity smart contract will revert with <code className="text-rose-300 bg-slate-950 px-1 py-0.5 rounded">AlreadyReservedOrPaid()</code>.
                </p>
              </div>
              <button
                onClick={handleTestDuplicate}
                className="w-full py-2.5 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/80 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center space-x-2"
              >
                <span>Trigger Duplicate Payout Attempt</span>
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-semibold text-white mb-2 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Test Over-Cap Allocation Invariant</span>
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Attempt to allocate a 1,200 tHSK bounty (exceeding mandate limit of 500 tHSK). The deterministic engine and smart contract strictly revert with <code className="text-amber-300 bg-slate-950 px-1 py-0.5 rounded">ExceedsMaxBounty(1200, 500)</code>.
                </p>
              </div>
              <button
                onClick={handleTestOvercap}
                className="w-full py-2.5 bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-800/80 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center space-x-2"
              >
                <span>Trigger Over-Cap Bounty Attempt</span>
              </button>
            </div>
          </div>

          {/* Feedback Display */}
          {rejectedFeedback && (
            <div className="p-4 bg-rose-950/40 border border-rose-800/70 rounded-xl space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-rose-300">
                  REVERTED: {rejectedFeedback.errorName}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800">
                  HARD ENFORCEMENT: {rejectedFeedback.blockedBy}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {rejectedFeedback.message}
              </p>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={() => setDemoStep(4)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-2 transition-colors shadow-lg shadow-blue-500/20"
            >
              <span>Proceed to Phase 5: Audit Timeline & Replay Evolution</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {demoStep === 4 && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span>2:30–3:00 — Ticket-to-Payment Timeline & Historical Replay Lineage</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Inspect the end-to-end evidence trail from source GitHub issue to smart contract settlement. Below, explore the OpenWorks historical evolutionary replay showing strategy mutations and holdout benchmarks.
            </p>
          </div>

          {/* Timeline */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center space-x-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <span>Immutable Decision-to-Payment Audit Trail</span>
            </h4>
            <div className="space-y-4">
              {timeline.map((evt) => (
                <div key={evt.id} className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg flex items-start space-x-3 text-xs">
                  <div className={`p-1.5 rounded-full mt-0.5 ${
                    evt.status === 'SUCCESS' ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                  }`}>
                    {evt.status === 'SUCCESS' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{evt.title}</span>
                      <span className="font-mono text-[10px] text-slate-500">{evt.timestamp}</span>
                    </div>
                    <div className="text-slate-400 mt-1">{evt.details}</div>
                    <div className="mt-1.5 flex items-center space-x-3 text-[11px] font-mono text-slate-500">
                      <span>Actor: <span className="text-slate-300">{evt.actor}</span></span>
                      {evt.evidenceRef && (
                        <span>Evidence: <a href={evt.evidenceRef} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">{evt.evidenceRef}</a></span>
                      )}
                      {evt.txHash && (
                        <span>Tx: <span className="text-emerald-400">{evt.txHash.slice(0, 10)}...</span></span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mutation & Replay Quick Action */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-white">Evolve Next Strategy Generation</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Mutate shadow agent weights and evaluate against historical replay and holdout cases.
              </p>
            </div>
            <button
              onClick={evolveStrategies}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-2 transition-colors shadow-md shadow-indigo-600/20"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Mutate & Score Replay</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
