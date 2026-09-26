'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, PlayCircle, Layers, Cpu, Award, ExternalLink, Activity } from 'lucide-react';
import { useOpenWork } from '../lib/state-context';

export default function Navbar() {
  const pathname = usePathname();
  const { mandate, treasury } = useOpenWork();

  const navLinks = [
    { href: '/', label: '3-Min Showcase', icon: PlayCircle },
    { href: '/steward', label: 'Steward Mandate', icon: ShieldCheck },
    { href: '/maintainer', label: 'Maintainer Opt-In', icon: Layers },
    { href: '/contributor', label: 'Contributor Bounties', icon: Award },
    { href: '/audit', label: 'Audit & Evolution', icon: Cpu },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Network Tag */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-blue-500/20">
                Ω
              </div>
              <span className="text-xl font-bold tracking-tight text-white">OpenWorks</span>
            </Link>
            <div className="hidden md:flex items-center space-x-2 pl-3 border-l border-slate-800">
              <a
                href="https://testnet-explorer.hskchain.net"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-950 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-800/60 transition-colors"
                title="View HashKey Chain Testnet Explorer"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
                HashKey (HSK) Testnet
              </a>
              <span className="text-xs text-slate-400 font-mono">
                Chain ID: 133
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Fund Metric Pill */}
          <div className="hidden lg:flex items-center space-x-3 text-xs font-mono">
            <div className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 flex items-center space-x-2">
              <Activity className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-slate-400">Available:</span>
              <span className="text-emerald-400 font-semibold">{treasury.availableFunds.toLocaleString()} tHSK</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">Min Reserve:</span>
              <span className="text-amber-400">{mandate.minUncommittedReserve.toLocaleString()} tHSK</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
