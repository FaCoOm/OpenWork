'use client';

import React from 'react';
import { X, ShieldCheck, CheckCircle2, XCircle, AlertCircle, FileText, Lock } from 'lucide-react';
import { Ticket } from '../types';
import VerdictBadge from './VerdictBadge';

interface PolicyInspectorModalProps {
  ticket: Ticket | null;
  onClose: () => void;
}

export default function PolicyInspectorModal({ ticket, onClose }: PolicyInspectorModalProps) {
  if (!ticket || !ticket.verdict) return null;

  const { verdict } = ticket;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white flex items-center space-x-2">
                <span>Verifiable Policy Engine Inspector</span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Evaluating {ticket.id} ({ticket.repo})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Status summary banner */}
          <div className="p-4 rounded-lg border bg-slate-950 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400 mb-1">Deterministic Output Verdict</div>
              <VerdictBadge status={verdict.status} size="lg" />
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400 mb-1">Proposed Bounty Allocation</div>
              <div className="font-mono text-base font-bold text-blue-400">
                {ticket.reservedBounty || 0} tHSK
              </div>
            </div>
          </div>

          {/* Core Rule Principle Banner */}
          <div className="bg-blue-950/30 border border-blue-800/40 rounded-lg p-3 text-xs text-blue-300 flex items-start space-x-2">
            <Lock className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <p>
              <strong>Deterministic Boundary Invariant:</strong> The AI model evaluates issue language and impact weightings, but cannot waive or override hard policy checks (Caps, Reserving, Expiry, Signatures).
            </p>
          </div>

          {/* Checklist of All Hard Checks */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Deterministic Verification Checks ({verdict.ruleCheckResults.filter(r => r.passed).length}/{verdict.ruleCheckResults.length} Passed)
            </h4>
            <div className="space-y-2">
              {verdict.ruleCheckResults.map((check, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border flex items-start space-x-3 transition-colors ${
                    check.passed
                      ? 'bg-slate-950/60 border-emerald-900/40 text-slate-300'
                      : 'bg-rose-950/30 border-rose-800/50 text-rose-200'
                  }`}
                >
                  {check.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-200">
                        {check.rule}
                      </span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        check.passed ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                      }`}>
                        {check.passed ? 'PASS' : 'FAIL'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{check.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Action */}
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg">
            <div className="text-xs font-semibold text-slate-400 mb-1">Recommended On-Chain Action</div>
            <p className="text-xs font-mono text-slate-200">{verdict.recommendedAction}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
