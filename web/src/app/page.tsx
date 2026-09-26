'use client';

import React from 'react';
import NarrativeShowcase from '../components/NarrativeShowcase';
import { ShieldCheck, Cpu, ArrowUpRight, CheckCircle2, DollarSign } from 'lucide-react';
import { useOpenWork } from '../lib/state-context';

export default function HomePage() {
  const { treasury, mandate, tickets } = useOpenWork();

  const metrics = [
    {
      label: "Fixed Grant Pool",
      value: `${treasury.totalFunds.toLocaleString()} tHSK`,
      sub: "Mandate Capped",
      icon: DollarSign,
      color: "text-blue-400",
    },
    {
      label: "Minimum Uncommitted Reserve",
      value: `${mandate.minUncommittedReserve.toLocaleString()} tHSK`,
      sub: "Immutable Floor",
      icon: ShieldCheck,
      color: "text-amber-400",
    },
    {
      label: "Active Candidate Tickets",
      value: `${tickets.length}`,
      sub: `${tickets.filter(t => t.isEligible).length} Opted-In`,
      icon: Cpu,
      color: "text-emerald-400",
    },
    {
      label: "Settlement Chain",
      value: "HashKey HSK",
      sub: "Testnet (ID: 133)",
      icon: CheckCircle2,
      color: "text-indigo-400",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-900 pb-6">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-800/50 text-blue-400 text-xs font-semibold mb-3">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
            <span>Sydney AI x Web3 Hackathon Prototype</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Verifiable Grant & Bounty Allocator
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mt-2 leading-relaxed">
            OpenWorks gives a fixed public-goods fund to a population of bounded agents that compete to find urgent, high-impact issues in approved open-source repositories; accepted fixes leave a traceable evidence trail and trigger a capped, one-time payment.
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center space-x-3">
          <a
            href="https://github.com/openwork-protocol/consensus-p2p"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white flex items-center space-x-1.5 border border-slate-800 transition-colors"
          >
            <span>Approved Repo</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs">{m.label}</span>
                <Icon className={`w-4 h-4 ${m.color}`} />
              </div>
              <div className="text-xl font-bold font-mono text-white">{m.value}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{m.sub}</div>
            </div>
          );
        })}
      </div>

      {/* 3-Minute Showcase Controller */}
      <NarrativeShowcase />
    </div>
  );
}
