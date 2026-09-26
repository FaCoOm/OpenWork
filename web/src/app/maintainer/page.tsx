'use client';

import React, { useState } from 'react';
import {
  Layers,
  CheckSquare,
  FileCheck,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { useOpenWork } from '../../lib/state-context';
import TicketCard from '../../components/TicketCard';

export default function MaintainerPage() {
  const { tickets, acceptFixAndPay } = useOpenWork();
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-xs text-blue-400 font-mono mb-1">
            <Layers className="w-4 h-4" />
            <span>Repository Maintainer Portal</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            OpenWorks Ticket Intake & Acceptance Attestation
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Opt-in tickets, define objective acceptance conditions, and cryptographically verify submitted pull requests.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs px-3 py-1.5 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-mono">
            Maintainer Role: Verified (0x72a...8b9)
          </span>
        </div>
      </div>

      {/* Maintainer Guidance Note */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 flex items-start space-x-3">
        <ShieldCheck className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Maintainer Responsibility:</strong> Under the OpenWorks model, maintainers validate ticket clarity and confirm whether a submitted fix meets published conditions. Maintainers cannot unilaterally award bounties or bypass Áureo policy limits. If a maintainer or related address claims a bounty, steward conflict review is required.
        </div>
      </div>

      {/* Tickets List */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
          Managed Repository Issues ({tickets.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tickets.map((t) => (
            <TicketCard
              key={t.id}
              ticket={t}
              onAcceptFix={acceptFixAndPay}
              showActions={true}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
