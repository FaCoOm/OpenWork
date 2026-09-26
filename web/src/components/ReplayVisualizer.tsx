'use client';

import React, { useState } from 'react';
import { Database, ShieldCheck, AlertCircle, BarChart3, Info } from 'lucide-react';
import { useOpenWork } from '../lib/state-context';

export default function ReplayVisualizer() {
  const { replayCases, agents } = useOpenWork();
  const [filter, setFilter] = useState<'ALL' | 'TRAINING' | 'HOLDOUT'>('ALL');

  const filteredCases = replayCases.filter((c) => {
    if (filter === 'TRAINING') return !c.holdout;
    if (filter === 'HOLDOUT') return c.holdout;
    return true;
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded bg-blue-500/10 text-blue-400">
              <Database className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-white">
              OpenWorks Replay Corpus & Holdout Validation Benchmark
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Interpretable multi-agent evolutionary selection. Holdout cases are strictly separated from training replay cases.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1 rounded transition-colors ${
              filter === 'ALL' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            All Cases ({replayCases.length})
          </button>
          <button
            onClick={() => setFilter('TRAINING')}
            className={`px-3 py-1 rounded transition-colors ${
              filter === 'TRAINING' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Training Replay ({replayCases.filter(c => !c.holdout).length})
          </button>
          <button
            onClick={() => setFilter('HOLDOUT')}
            className={`px-3 py-1 rounded transition-colors ${
              filter === 'HOLDOUT' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Holdout Test ({replayCases.filter(c => c.holdout).length})
          </button>
        </div>
      </div>

      {/* Methodological Transparency Note (Mandated by Section 4 & 7 of the brief) */}
      <div className="p-3.5 bg-amber-950/20 border border-amber-800/40 rounded-lg text-xs text-amber-300 flex items-start space-x-2.5">
        <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Methodological Limitation Notice:</strong> Synthetic and sparse historical replay data is labelled as illustrative for strategy benchmarking. It does not claim real-world outcome superiority until independently verified outcomes accumulate. Overconfident claims on tasks that fail acceptance conditions incur high fitness penalties.
        </div>
      </div>

      {/* Cases Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCases.map((cs) => {
          const outcomeColor = {
            ACCEPTED: 'bg-emerald-950 text-emerald-400 border-emerald-800',
            FAILED: 'bg-rose-950 text-rose-400 border-rose-800',
            ABANDONED: 'bg-slate-800 text-slate-400 border-slate-700',
          }[cs.resolutionOutcome];

          return (
            <div
              key={cs.id}
              className={`p-4 rounded-lg border flex flex-col justify-between ${
                cs.holdout
                  ? 'bg-slate-950/80 border-amber-800/50 ring-1 ring-amber-500/20'
                  : 'bg-slate-950/50 border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-xs font-bold text-slate-300">
                    {cs.id}
                  </span>
                  <div className="flex items-center space-x-1.5">
                    {cs.holdout ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold">
                        HOLDOUT
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        TRAINING
                      </span>
                    )}
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-medium ${outcomeColor}`}>
                      {cs.resolutionOutcome}
                    </span>
                  </div>
                </div>

                <h4 className="text-sm font-semibold text-white mb-2 leading-snug">
                  {cs.title}
                </h4>

                <div className="p-2.5 bg-slate-900 rounded border border-slate-800 text-xs space-y-1 mb-3 font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>Ground Truth Urgency:</span>
                    <span className="text-slate-200 font-bold">{(cs.groundTruthUrgency * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Ground Truth Impact:</span>
                    <span className="text-slate-200 font-bold">{(cs.groundTruthImpact * 100).toFixed(0)}%</span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 italic">
                  {cs.notes}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
