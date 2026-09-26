'use client';

import React from 'react';
import {
  Cpu,
  Clock,
  ShieldCheck,
  Sparkles,
  GitCommit,
  CheckCircle2,
  AlertTriangle,
  Database
} from 'lucide-react';
import { useOpenWork } from '../../lib/state-context';
import ReplayVisualizer from '../../components/ReplayVisualizer';

export default function AuditPage() {
  const { agents, timeline, evolveStrategies } = useOpenWork();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-xs text-indigo-400 font-mono mb-1">
            <Cpu className="w-4 h-4" />
            <span>Public Observer & Audit Transparency Explorer</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Decision Lineage, Áureo Rules & Strategy Evolution
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Trace any funding choice from source issue through strategy weights and evidence to the final on-chain transaction receipt.
          </p>
        </div>

        <button
          onClick={evolveStrategies}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-2 transition-colors shadow-md shadow-indigo-600/20"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Evolve Strategy Generation</span>
        </button>
      </div>

      {/* OpenWorks Active Agent Strategy Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>OpenWorks Population: Strategy Weights & Lineage</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Candidate agents explore weight variations. Highest historical replay fitness determines the live Champion.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {agents.map((ag) => (
            <div
              key={ag.id}
              className={`p-4 rounded-xl border flex flex-col justify-between ${
                ag.isChampion
                  ? 'bg-blue-950/40 border-blue-500 shadow-md shadow-blue-900/20'
                  : 'bg-slate-950/60 border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    Gen {ag.generation} • v{ag.version}
                  </span>
                  {ag.isChampion ? (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold">
                      CHAMPION
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      SHADOW
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-semibold text-white mb-3">
                  {ag.name}
                </h4>

                {/* Weights list */}
                <div className="space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>Urgency:</span>
                    <span className="text-slate-200">{(ag.weights.urgency * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full" style={{ width: `${ag.weights.urgency * 100}%` }}></div>
                  </div>

                  <div className="flex justify-between text-slate-400 pt-1">
                    <span>Breadth of Effect:</span>
                    <span className="text-slate-200">{(ag.weights.breadthOfEffect * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full" style={{ width: `${ag.weights.breadthOfEffect * 100}%` }}></div>
                  </div>

                  <div className="flex justify-between text-slate-400 pt-1">
                    <span>Public Benefit:</span>
                    <span className="text-slate-200">{(ag.weights.publicBenefit * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full" style={{ width: `${ag.weights.publicBenefit * 100}%` }}></div>
                  </div>

                  <div className="flex justify-between text-slate-400 pt-1">
                    <span>Evidence Confidence:</span>
                    <span className="text-slate-200">{(ag.weights.evidenceConfidence * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-purple-500 h-full" style={{ width: `${ag.weights.evidenceConfidence * 100}%` }}></div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Replay Fitness:</span>
                <span className="text-emerald-400 font-bold">
                  {ag.fitnessScore ? ag.fitnessScore.toFixed(3) : '0.850'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Historical Replay Dataset & Holdout Benchmark */}
      <ReplayVisualizer />

      {/* Complete Immutable Timeline */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2 border-b border-slate-800 pb-3">
          <Clock className="w-4 h-4 text-blue-400" />
          <span>Ticket-to-Settlement Audit Timeline</span>
        </h3>

        <div className="space-y-3">
          {timeline.map((evt) => (
            <div
              key={evt.id}
              className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-lg flex items-start space-x-3 text-xs"
            >
              <div className="p-1 rounded bg-slate-900 text-blue-400 font-mono text-[10px] mt-0.5">
                {evt.stage}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white text-sm">{evt.title}</span>
                  <span className="font-mono text-[11px] text-slate-500">{evt.timestamp}</span>
                </div>
                <p className="text-slate-300 mt-1">{evt.details}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] font-mono text-slate-400">
                  <span>Actor: <strong className="text-slate-200">{evt.actor}</strong></span>
                  {evt.evidenceRef && (
                    <span>Ref: <a href={evt.evidenceRef} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">{evt.evidenceRef}</a></span>
                  )}
                  {evt.txHash && (
                    <span>On-Chain Tx: <code className="text-emerald-400">{evt.txHash}</code></span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
