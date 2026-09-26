'use client';

import React, { useState } from 'react';
import { ExternalLink, CheckSquare, AlertCircle, FileCheck, DollarSign, Eye, ArrowRight, Shield } from 'lucide-react';
import { Ticket, TicketEvaluation } from '../types';
import VerdictBadge from './VerdictBadge';
import PolicyInspectorModal from './PolicyInspectorModal';

interface TicketCardProps {
  ticket: Ticket;
  evaluation?: TicketEvaluation;
  onReserve?: (ticketId: string) => void;
  onSubmitPr?: (ticketId: string) => void;
  onAcceptFix?: (ticketId: string) => void;
  showActions?: boolean;
}

export default function TicketCard({
  ticket,
  evaluation,
  onReserve,
  onSubmitPr,
  onAcceptFix,
  showActions = true,
}: TicketCardProps) {
  const [inspecting, setInspecting] = useState(false);

  const statusColors: Record<string, string> = {
    OPEN: 'bg-slate-800 text-slate-300 border-slate-700',
    RESERVED: 'bg-blue-950 text-blue-300 border-blue-800',
    PR_SUBMITTED: 'bg-purple-950 text-purple-300 border-purple-800',
    ACCEPTED: 'bg-teal-950 text-teal-300 border-teal-800',
    PAID: 'bg-emerald-950 text-emerald-300 border-emerald-800',
    REJECTED: 'bg-rose-950 text-rose-300 border-rose-800',
    EXPIRED: 'bg-amber-950 text-amber-300 border-amber-800',
  };
  const statusColorClass = statusColors[ticket.status] || 'bg-slate-800 text-slate-300 border-slate-700';

  return (
    <>
      <div className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl p-5 shadow-lg transition-all flex flex-col justify-between">
        <div>
          {/* Header row: ID, Repo, Status Pill, Verdict */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-blue-400 border border-slate-700">
                {ticket.id}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {ticket.repo}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {ticket.verdict && (
                <button
                  onClick={() => setInspecting(true)}
                  className="hover:opacity-80 transition-opacity"
                  title="Click to inspect Áureo verification rules"
                >
                  <VerdictBadge status={ticket.verdict.status} size="sm" />
                </button>
              )}
              <span className={`text-[11px] font-mono px-2 py-0.5 rounded border uppercase font-medium ${statusColorClass}`}>
                {ticket.status.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-base font-semibold text-white mb-2 leading-snug">
            {ticket.title}
          </h3>

          {/* Observed Failure */}
          <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg text-xs text-slate-300 mb-4 font-mono">
            <div className="text-[10px] uppercase font-bold text-slate-500 mb-1 flex items-center space-x-1">
              <AlertCircle className="w-3 h-3 text-amber-400" />
              <span>Observed Failure & Impact</span>
            </div>
            <p className="line-clamp-3">{ticket.observedFailure}</p>
            <div className="mt-2 text-slate-500 text-[11px]">
              Component: <span className="text-slate-300">{ticket.affectedComponent}</span>
            </div>
          </div>

          {/* Acceptance Conditions list */}
          <div className="mb-4">
            <div className="text-[11px] uppercase font-semibold text-slate-400 mb-2 flex items-center space-x-1">
              <CheckSquare className="w-3.5 h-3.5 text-blue-400" />
              <span>Acceptance Conditions ({ticket.acceptanceConditions.length})</span>
            </div>
            {ticket.acceptanceConditions.length > 0 ? (
              <ul className="space-y-1.5 text-xs text-slate-300">
                {ticket.acceptanceConditions.map((cond, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{cond}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-xs text-rose-400 italic bg-rose-950/20 p-2 rounded border border-rose-900/30">
                No acceptance conditions specified. Maintainer intake required.
              </div>
            )}
          </div>

          {/* Evidence references */}
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-500 font-mono text-[11px]">Public Evidence:</span>
            {ticket.publicEvidence.length > 0 ? (
              ticket.publicEvidence.map((ev, i) => (
                <a
                  key={i}
                  href={ev}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 text-blue-400 hover:text-blue-300 bg-blue-950/40 px-2 py-0.5 rounded border border-blue-800/40 text-[11px] font-mono truncate max-w-[200px]"
                >
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{ev.split('/').pop() || ev}</span>
                </a>
              ))
            ) : (
              <span className="text-amber-500/80 text-[11px] italic">Missing logs or repro</span>
            )}
          </div>

          {/* Evaluation score preview */}
          {evaluation && (
            <div className="p-3 bg-blue-950/20 border border-blue-900/30 rounded-lg mb-4 text-xs">
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-400 font-medium">Champion Agent Ranking</span>
                <span className="text-blue-400 font-mono font-bold">
                  Score: {(evaluation.scores.totalScore * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Proposed Bounty:</span>
                <span className="text-emerald-400 font-mono font-bold text-sm">
                  {ticket.reservedBounty || evaluation.proposedBounty} tHSK
                </span>
              </div>
              {evaluation.rationales.length > 0 && (
                <p className="text-[11px] text-slate-400 mt-1 italic">
                  "{evaluation.rationales[0]}"
                </p>
              )}
            </div>
          )}
        </div>

        {/* Action Controls */}
        {showActions && (
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
            <button
              onClick={() => setInspecting(true)}
              className="text-xs text-slate-400 hover:text-white flex items-center space-x-1 px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              <span>Inspect Rules</span>
            </button>

            {ticket.status === 'OPEN' && ticket.verdict?.status === 'ELIGIBLE' && onReserve && (
              <button
                onClick={() => onReserve(ticket.id)}
                className="text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-lg flex items-center space-x-1.5 shadow-md shadow-blue-600/20 transition-colors"
              >
                <span>Reserve Bounty ({ticket.reservedBounty} tHSK)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {ticket.status === 'RESERVED' && onSubmitPr && (
              <button
                onClick={() => onSubmitPr(ticket.id)}
                className="text-xs font-medium text-white bg-purple-600 hover:bg-purple-500 px-3 py-1.5 rounded-lg flex items-center space-x-1.5 shadow-md shadow-purple-600/20 transition-colors"
              >
                <span>Submit PR Fix</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {ticket.status === 'PR_SUBMITTED' && onAcceptFix && (
              <button
                onClick={() => onAcceptFix(ticket.id)}
                className="text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 rounded-lg flex items-center space-x-1.5 shadow-md shadow-emerald-600/20 transition-colors"
              >
                <span>Accept Fix & Pay</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {ticket.status === 'PAID' && (
              <div className="text-right">
                <span className="text-[11px] font-mono text-emerald-400 flex items-center space-x-1">
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Settled on HSK</span>
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <PolicyInspectorModal
        ticket={inspecting ? ticket : null}
        onClose={() => setInspecting(false)}
      />
    </>
  );
}
