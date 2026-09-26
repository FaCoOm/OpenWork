'use client';

import React from 'react';
import {
  Activity,
  Wallet,
  ExternalLink,
  Droplets,
  AlertCircle,
  CheckCircle2,
  Cpu,
  Layers,
  Sparkles,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { useWeb3Hsk } from '../lib/web3-hsk-context';
import {
  HSK_CHAIN_CONFIG,
  CONTRACT_ADDRESSES,
  formatAddress,
  getExplorerAddressUrl
} from '../config/hsk-chain';

export default function HskNetworkBar() {
  const {
    account,
    chainId,
    isHskChain,
    isConnecting,
    hskBalance,
    liveBlockNumber,
    liveGasPrice,
    isRpcOnline,
    isLiveMode,
    error,
    connectWallet,
    switchToHskTestnet,
    setIsLiveMode,
  } = useWeb3Hsk();

  return (
    <div className="bg-slate-950 border-b border-slate-800/80 px-4 py-2 text-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Chain Status & Live Block Info */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <span className="flex h-2 w-2 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isRpcOnline ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isRpcOnline ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
            </span>
            <span className="font-semibold text-slate-200">
              HashKey Chain Testnet
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-950 text-blue-300 border border-blue-800">
              Chain 133 (0x85)
            </span>
          </div>

          {liveBlockNumber && (
            <div className="hidden sm:flex items-center space-x-1.5 text-slate-400 font-mono text-[11px] pl-2 border-l border-slate-800">
              <Activity className="w-3 h-3 text-emerald-400" />
              <span>Block:</span>
              <span className="text-slate-200 font-bold">#{liveBlockNumber.toLocaleString()}</span>
              {liveGasPrice && (
                <>
                  <span className="text-slate-600">|</span>
                  <span>Gas:</span>
                  <span className="text-indigo-300">{liveGasPrice}</span>
                </>
              )}
            </div>
          )}

          {/* Treasury Contract Link on HSK */}
          <div className="hidden lg:flex items-center space-x-1.5 pl-2 border-l border-slate-800 text-[11px] font-mono">
            <span className="text-slate-400">Treasury:</span>
            <a
              href={getExplorerAddressUrl(CONTRACT_ADDRESSES.treasury)}
              target="_blank"
              rel="noreferrer"
              className="text-blue-400 hover:text-blue-300 hover:underline flex items-center space-x-0.5"
            >
              <span>{formatAddress(CONTRACT_ADDRESSES.treasury)}</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>

        {/* Right: Mode Toggle + Faucet Link + Wallet Controls */}
        <div className="flex items-center space-x-2.5">
          {/* Live Mode vs Simulation Toggle */}
          <button
            onClick={() => setIsLiveMode(!isLiveMode)}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors border ${
              isLiveMode
                ? 'bg-amber-950/60 border-amber-500 text-amber-300 shadow-sm shadow-amber-900/20'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle between Live HSK on-chain transaction mode and interactive simulation"
          >
            {isLiveMode ? (
              <>
                <ToggleRight className="w-3.5 h-3.5 text-amber-400" />
                <span>Live HSK Mode</span>
              </>
            ) : (
              <>
                <ToggleLeft className="w-3.5 h-3.5 text-slate-500" />
                <span>Showcase Mode</span>
              </>
            )}
          </button>

          {/* Faucet Link */}
          <a
            href={HSK_CHAIN_CONFIG.faucetUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-1 px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-blue-400 hover:text-blue-300 border border-slate-800 text-[11px] transition-colors"
          >
            <Droplets className="w-3 h-3 text-cyan-400" />
            <span>HSK Faucet</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>

          {/* Wallet Connection */}
          {!account ? (
            <button
              onClick={connectWallet}
              disabled={isConnecting}
              className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-sm shadow-blue-500/20 transition-colors disabled:opacity-50"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>{isConnecting ? 'Connecting...' : 'Connect HSK Wallet'}</span>
            </button>
          ) : !isHskChain ? (
            <button
              onClick={switchToHskTestnet}
              className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs shadow-sm shadow-amber-500/20 transition-colors"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Switch to HSK (133)</span>
            </button>
          ) : (
            <div className="flex items-center space-x-2 bg-slate-900 border border-emerald-900/60 rounded-lg px-2.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-emerald-400 font-mono text-[11px] font-bold">
                {hskBalance} HSK
              </span>
              <span className="text-slate-600">|</span>
              <a
                href={getExplorerAddressUrl(account)}
                target="_blank"
                rel="noreferrer"
                className="text-slate-300 hover:text-white font-mono text-[11px] hover:underline flex items-center space-x-1"
              >
                <span>{formatAddress(account)}</span>
                <ExternalLink className="w-2.5 h-2.5 text-slate-500" />
              </a>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="max-w-7xl mx-auto mt-1 text-[11px] text-rose-400 flex items-center space-x-1">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
