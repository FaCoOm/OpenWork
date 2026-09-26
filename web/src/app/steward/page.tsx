'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  PauseCircle,
  PlayCircle,
  AlertTriangle,
  Lock,
  Layers,
  Save,
  CheckCircle2,
  DollarSign,
  ExternalLink,
  Cpu
} from 'lucide-react';
import { useOpenWork } from '../../lib/state-context';
import { useWeb3Hsk } from '../../lib/web3-hsk-context';
import { CONTRACT_ADDRESSES, getExplorerAddressUrl, formatAddress } from '../../config/hsk-chain';

export default function StewardPage() {
  const { mandate, treasury, togglePause, updateMandate } = useOpenWork();

  const [formState, setFormState] = useState({
    cause: mandate.cause,
    maxBountyPerTicket: mandate.maxBountyPerTicket,
    maxSpendPerRound: mandate.maxSpendPerRound,
    minUncommittedReserve: mandate.minUncommittedReserve,
    newRepo: '',
  });

  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateMandate({
      cause: formState.cause,
      maxBountyPerTicket: Number(formState.maxBountyPerTicket),
      maxSpendPerRound: Number(formState.maxSpendPerRound),
      minUncommittedReserve: Number(formState.minUncommittedReserve),
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleAddRepo = () => {
    if (!formState.newRepo.trim()) return;
    updateMandate({
      approvedRepos: [...mandate.approvedRepos, formState.newRepo.trim()],
    });
    setFormState(prev => ({ ...prev, newRepo: '' }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-xs text-blue-400 font-mono mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Fund Steward Control Plane</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Spending Mandate & Treasury Reserves
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure hard mandate boundaries. The agent allocates within these bounds but cannot alter money caps, reserve floors, or custody rules.
          </p>
        </div>

        {/* Emergency Pause Toggle */}
        <button
          onClick={togglePause}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 border transition-all ${
            mandate.isPaused
              ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-900/30'
              : 'bg-slate-900 hover:bg-slate-800 text-amber-300 border-amber-800/80'
          }`}
        >
          {mandate.isPaused ? (
            <>
              <PlayCircle className="w-4 h-4" />
              <span>RESUME TREASURY ALLOCATIONS</span>
            </>
          ) : (
            <>
              <PauseCircle className="w-4 h-4" />
              <span>EMERGENCY PAUSE TREASURY</span>
            </>
          )}
        </button>
      </div>

      {mandate.isPaused && (
        <div className="p-4 bg-rose-950/60 border border-rose-800 rounded-xl flex items-center space-x-3 text-xs text-rose-300">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <div>
            <strong>Treasury Paused:</strong> All new on-chain bounty reservations and settlements are halted by Steward emergency order.
          </div>
        </div>
      )}

      {/* Treasury Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="text-xs text-slate-500 mb-1">Total Funded Pool</div>
          <div className="text-xl font-bold font-mono text-white">
            {treasury.totalFunds.toLocaleString()} tHSK
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            Steward: {mandate.stewardAddress.slice(0, 8)}...
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="text-xs text-slate-500 mb-1">Currently Reserved</div>
          <div className="text-xl font-bold font-mono text-blue-400">
            {treasury.reservedFunds.toLocaleString()} tHSK
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Escrowed for active claims</div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="text-xs text-slate-500 mb-1">Total Settled & Paid</div>
          <div className="text-xl font-bold font-mono text-emerald-400">
            {treasury.paidFunds.toLocaleString()} tHSK
          </div>
          <div className="text-[11px] text-slate-400 mt-1">To accepted contributors</div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="text-xs text-slate-500 mb-1">Available Uncommitted</div>
          <div className="text-xl font-bold font-mono text-amber-400">
            {treasury.availableFunds.toLocaleString()} tHSK
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Floor: {mandate.minUncommittedReserve.toLocaleString()} tHSK</div>
        </div>
      </div>

      {/* On-Chain Settlement Registry on HashKey Chain */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">
              HashKey Chain (HSK) Settlement Registry
            </h3>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60">
            EVM Chain ID: 133
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex justify-between items-center">
            <div>
              <div className="text-slate-500 text-[10px] uppercase font-bold">OpenWorksTreasury Contract</div>
              <div className="text-slate-200 mt-0.5">{CONTRACT_ADDRESSES.treasury}</div>
            </div>
            <a
              href={getExplorerAddressUrl(CONTRACT_ADDRESSES.treasury)}
              target="_blank"
              rel="noreferrer"
              className="text-blue-400 hover:text-blue-300 flex items-center space-x-1 hover:underline ml-2"
            >
              <span>Explore</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex justify-between items-center">
            <div>
              <div className="text-slate-500 text-[10px] uppercase font-bold">Test Token (tHSK ERC20)</div>
              <div className="text-slate-200 mt-0.5">{CONTRACT_ADDRESSES.token}</div>
            </div>
            <a
              href={getExplorerAddressUrl(CONTRACT_ADDRESSES.token)}
              target="_blank"
              rel="noreferrer"
              className="text-blue-400 hover:text-blue-300 flex items-center space-x-1 hover:underline ml-2"
            >
              <span>Explore</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Mandate Configuration Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Lock className="w-4 h-4 text-blue-400" />
            <span>Fixed Mandate Governance Parameters</span>
          </h3>
          {savedNotice && (
            <span className="text-xs text-emerald-400 flex items-center space-x-1 font-mono animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mandate updated successfully</span>
            </span>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Public Goods Cause & Purpose</label>
            <input
              type="text"
              value={formState.cause}
              onChange={(e) => setFormState({ ...formState, cause: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Max Bounty Per Ticket (tHSK)</label>
              <input
                type="number"
                value={formState.maxBountyPerTicket}
                onChange={(e) => setFormState({ ...formState, maxBountyPerTicket: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Max Spend Per Round (tHSK)</label>
              <input
                type="number"
                value={formState.maxSpendPerRound}
                onChange={(e) => setFormState({ ...formState, maxSpendPerRound: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Min Uncommitted Reserve Floor (tHSK)</label>
              <input
                type="number"
                value={formState.minUncommittedReserve}
                onChange={(e) => setFormState({ ...formState, minUncommittedReserve: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Approved Repositories */}
          <div className="pt-2">
            <label className="block text-slate-400 mb-2 font-medium">Approved Open-Source Repositories</label>
            <div className="space-y-2 mb-3">
              {mandate.approvedRepos.map((repo, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-800 rounded-lg font-mono text-slate-300">
                  <span>{repo}</span>
                  <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800">
                    APPROVED
                  </span>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="org/repo-name (e.g. openwork-protocol/consensus-p2p)"
                value={formState.newRepo}
                onChange={(e) => setFormState({ ...formState, newRepo: e.target.value })}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleAddRepo}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
              >
                Add Repository
              </button>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold flex items-center space-x-2 transition-colors shadow-md shadow-blue-600/20"
            >
              <Save className="w-4 h-4" />
              <span>Update Spending Mandate</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
