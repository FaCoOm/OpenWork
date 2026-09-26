import './globals.css';
import type { Metadata } from 'next';
import { OpenWorkProvider } from '../lib/state-context';
import { Web3HskProvider } from '../lib/web3-hsk-context';
import Navbar from '../components/Navbar';
import HskNetworkBar from '../components/HskNetworkBar';

export const metadata: Metadata = {
  title: 'OpenWorks — Public Goods Grant & Bounty Allocator on HashKey Chain',
  description: 'Bounded evolving agents allocate public-goods grants for approved open-source repositories with end-to-end verifiable payment traces on HashKey Chain.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased">
        <Web3HskProvider>
          <OpenWorkProvider>
            <HskNetworkBar />
            <Navbar />
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>
          <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500 font-mono">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span>OpenWorks Protocol • Sydney AI x Web3 Hackathon</span>
              <span>Settlement: HashKey Chain (HSK Testnet, Chain ID 133)</span>
            </div>
          </footer>
        </OpenWorkProvider>
      </Web3HskProvider>
      </body>
    </html>
  );
}
