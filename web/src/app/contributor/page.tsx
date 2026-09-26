'use client';

import React, { useState, useEffect } from 'react';
import {
  Award,
  ExternalLink,
  GitPullRequest,
  Wallet,
  CheckCircle2,
  DollarSign,
  ArrowRight
} from 'lucide-react';
import { useOpenWork } from '../../lib/state-context';
import { useWeb3Hsk } from '../../lib/web3-hsk-context';
import TicketCard from '../../components/TicketCard';

export default function ContributorPage() {
  const { tickets, submitPr } = useOpenWork();
  const { account, isHskChain } = useWeb3Hsk();

  const [activeModalTicket, setActiveModalTicket] = useState<string | null>(null);
  const [prUrl, setPrUrl] = useState('');
  const [payeeAddress, setPayeeAddress] = useState(account || '0x71C...49A1');
  const [submittedMessage, setSubmittedMessage] = useState(false);

  // Sync with connected account when modal opens or account changes
  useEffect(() => {
    if (account) {
      setPayeeAddress(account);
    }
  }, [account]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalTicket || !prUrl) return;

    submitPr(activeModalTicket, prUrl, payeeAddress);
    setSubmittedMessage(true);
    setTimeout(() => {
      setSubmittedMessage(false);
      setActiveModalTicket(null);
      setPrUrl('');
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-xs text-purple-400 font-mono mb-1">
            <Award className="w-4 h-4" />
            <span>Open Source Contributor Directory</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Discover Funded Tickets & Submit Fixes
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Find funded issues with clear acceptance criteria. Submit your pull request and bound EVM address for guaranteed one-time settlement upon maintainer merge.
          </p>
        </div>
      </div>

      {/* Available Tickets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {tickets.map((t) => (
          <TicketCard
            key={t.id}
            ticket={t}
            onSubmitPr={(id) => setActiveModalTicket(id)}
            showActions={true}
          />
        ))}
      </div>

      {/* PR Submission Modal */}
      {activeModalTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <GitPullRequest className="w-4 h-4 text-purple-400" />
                <span>Submit Contribution Claim for {activeModalTicket}</span>
              </h3>
              <button
                onClick={() => setActiveModalTicket(null)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Cancel
              </button>
            </div>

            {submittedMessage ? (
              <div className="p-4 bg-emerald-950/50 border border-emerald-800 rounded-lg text-center text-xs text-emerald-300 space-y-1">
                <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-400" />
                <p className="font-bold">Claim Submitted Successfully</p>
                <p className="text-slate-400 text-[11px]">Maintainer notified to inspect acceptance conditions.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Pull Request URL</label>
                  <input
                    type="url"
                    required
                    placeholder="https://github.com/openwork-protocol/consensus-p2p/pull/112"
                    value={prUrl}
                    onChange={(e) => setPrUrl(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-slate-400 font-medium">HSK Testnet Payee Address</label>
                    {account && (
                      <button
                        type="button"
                        onClick={() => setPayeeAddress(account)}
                        className="text-[10px] text-purple-400 hover:text-purple-300 font-mono hover:underline"
                      >
                        Use Connected HSK Wallet
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    value={payeeAddress}
                    onChange={(e) => setPayeeAddress(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-purple-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Settlement will be executed in tHSK to this address upon maintainer verification.
                  </p>
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setActiveModalTicket(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-md shadow-purple-600/20"
                  >
                    <span>Submit Claim</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
