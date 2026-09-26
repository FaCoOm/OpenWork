'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import {
  HSK_CHAIN_CONFIG,
  CONTRACT_ADDRESSES,
  CONTRACT_ABIS,
  getHskRpcProvider,
  formatAddress
} from '../config/hsk-chain';

export interface OnChainTreasuryData {
  isDeployedOnHsk: boolean;
  mandatePurpose: string;
  maxBountyPerTicket: string;
  minUncommittedReserve: string;
  treasuryTokenBalance: string;
  isPaused: boolean;
  steward: string;
  champion: string;
}

interface Web3HskContextType {
  account: string | null;
  chainId: number | null;
  isHskChain: boolean;
  isConnecting: boolean;
  hskBalance: string;
  liveBlockNumber: number | null;
  liveGasPrice: string | null;
  isRpcOnline: boolean;
  isLiveMode: boolean;
  onChainTreasuryData: OnChainTreasuryData | null;
  lastTxHash: string | null;
  error: string | null;
  // Actions
  connectWallet: () => Promise<void>;
  switchToHskTestnet: () => Promise<void>;
  refreshLiveState: () => Promise<void>;
  setIsLiveMode: (live: boolean) => void;
  reserveBountyOnChain: (ticketId: string, repo: string, amountTiers: number) => Promise<{ success: boolean; txHash?: string; error?: string }>;
  settleBountyOnChain: (ticketId: string, payeeAddress: string, prUrl: string) => Promise<{ success: boolean; txHash?: string; error?: string }>;
}

const Web3HskContext = createContext<Web3HskContextType | undefined>(undefined);

export function Web3HskProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [hskBalance, setHskBalance] = useState('0.00');
  const [liveBlockNumber, setLiveBlockNumber] = useState<number | null>(null);
  const [liveGasPrice, setLiveGasPrice] = useState<string | null>(null);
  const [isRpcOnline, setIsRpcOnline] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [onChainTreasuryData, setOnChainTreasuryData] = useState<OnChainTreasuryData | null>(null);

  const isHskChain = chainId === HSK_CHAIN_CONFIG.chainId;

  // Poll RPC status, latest block, and gas price directly from HSK Testnet
  const fetchLiveHskRpcData = useCallback(async () => {
    try {
      const provider = getHskRpcProvider();
      const [blockNum, feeData] = await Promise.all([
        provider.getBlockNumber(),
        provider.getFeeData(),
      ]);

      setLiveBlockNumber(blockNum);
      if (feeData.gasPrice) {
        setLiveGasPrice(`${parseFloat(ethers.formatUnits(feeData.gasPrice, 'gwei')).toFixed(2)} Gwei`);
      }
      setIsRpcOnline(true);

      // Also check deployed contracts on HSK
      try {
        const treasuryCode = await provider.getCode(CONTRACT_ADDRESSES.treasury);
        if (treasuryCode && treasuryCode !== '0x') {
          const treasuryContract = new ethers.Contract(
            CONTRACT_ADDRESSES.treasury,
            CONTRACT_ABIS.treasury,
            provider
          );
          const [purpose, maxBounty, minReserve, isPaused, steward, champion] = await Promise.all([
            treasuryContract.purpose(),
            treasuryContract.maxBountyPerTicket(),
            treasuryContract.minUncommittedReserve(),
            treasuryContract.paused(),
            treasuryContract.steward(),
            treasuryContract.championAgent(),
          ]);

          let tokenBal = '0';
          try {
            const tokenContract = new ethers.Contract(
              CONTRACT_ADDRESSES.token,
              CONTRACT_ABIS.token,
              provider
            );
            const bal = await tokenContract.balanceOf(CONTRACT_ADDRESSES.treasury);
            tokenBal = ethers.formatEther(bal);
          } catch {
            tokenBal = '5000.0';
          }

          setOnChainTreasuryData({
            isDeployedOnHsk: true,
            mandatePurpose: purpose,
            maxBountyPerTicket: ethers.formatEther(maxBounty),
            minUncommittedReserve: ethers.formatEther(minReserve),
            treasuryTokenBalance: tokenBal,
            isPaused,
            steward,
            champion,
          });
        } else {
          setOnChainTreasuryData({
            isDeployedOnHsk: false,
            mandatePurpose: 'OpenWorks Public Goods Funding on HashKey Chain',
            maxBountyPerTicket: '500.0',
            minUncommittedReserve: '1000.0',
            treasuryTokenBalance: '5000.0',
            isPaused: false,
            steward: CONTRACT_ADDRESSES.steward,
            champion: CONTRACT_ADDRESSES.champion,
          });
        }
      } catch {
        // Fallback info
      }
    } catch (err: any) {
      setIsRpcOnline(false);
      console.warn('HSK RPC query error:', err.message);
    }
  }, []);

  // Update wallet native HSK balance
  const updateWalletBalance = useCallback(async (addr: string) => {
    try {
      const provider = getHskRpcProvider();
      const balanceWei = await provider.getBalance(addr);
      setHskBalance(parseFloat(ethers.formatEther(balanceWei)).toFixed(4));
    } catch {
      setHskBalance('0.00');
    }
  }, []);

  // Initialize listener for window.ethereum
  useEffect(() => {
    fetchLiveHskRpcData();
    const interval = setInterval(fetchLiveHskRpcData, 15000);

    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const eth = (window as any).ethereum;

      eth.request({ method: 'eth_chainId' }).then((hexChainId: string) => {
        setChainId(parseInt(hexChainId, 16));
      }).catch(console.error);

      eth.request({ method: 'eth_accounts' }).then((accounts: string[]) => {
        if (accounts && accounts.length > 0) {
          setAccount(accounts[0]);
          updateWalletBalance(accounts[0]);
        }
      }).catch(console.error);

      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          updateWalletBalance(accounts[0]);
        } else {
          setAccount(null);
          setHskBalance('0.00');
        }
      };

      const handleChainChanged = (hexChainId: string) => {
        setChainId(parseInt(hexChainId, 16));
        if (account) updateWalletBalance(account);
      };

      eth.on('accountsChanged', handleAccountsChanged);
      eth.on('chainChanged', handleChainChanged);

      return () => {
        clearInterval(interval);
        if (eth.removeListener) {
          eth.removeListener('accountsChanged', handleAccountsChanged);
          eth.removeListener('chainChanged', handleChainChanged);
        }
      };
    }

    return () => clearInterval(interval);
  }, [fetchLiveHskRpcData, updateWalletBalance, account]);

  // Connect Wallet
  const connectWallet = async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      setError('Please install an EVM-compatible wallet (MetaMask, OKX, Rabby) to connect to HashKey Chain.');
      return;
    }
    try {
      setIsConnecting(true);
      setError(null);
      const accounts = await (window as any).ethereum.request({
        method: 'eth_requestAccounts',
      });
      if (accounts && accounts.length > 0) {
        setAccount(accounts[0]);
        const currentChainHex = await (window as any).ethereum.request({ method: 'eth_chainId' });
        const curChain = parseInt(currentChainHex, 16);
        setChainId(curChain);
        await updateWalletBalance(accounts[0]);

        if (curChain !== HSK_CHAIN_CONFIG.chainId) {
          await switchToHskTestnet();
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  // Switch to HashKey Chain Testnet (Chain ID 133 / 0x85)
  const switchToHskTestnet = async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum) return;
    try {
      setError(null);
      await (window as any).ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: HSK_CHAIN_CONFIG.chainIdHex }],
      });
      setChainId(HSK_CHAIN_CONFIG.chainId);
    } catch (switchError: any) {
      // Error code 4902 indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902 || switchError.data?.originalError?.code === 4902) {
        try {
          await (window as any).ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: HSK_CHAIN_CONFIG.chainIdHex,
                chainName: HSK_CHAIN_CONFIG.chainName,
                nativeCurrency: HSK_CHAIN_CONFIG.nativeCurrency,
                rpcUrls: HSK_CHAIN_CONFIG.rpcUrls,
                blockExplorerUrls: HSK_CHAIN_CONFIG.blockExplorerUrls,
              },
            ],
          });
          setChainId(HSK_CHAIN_CONFIG.chainId);
        } catch (addError: any) {
          setError(`Failed to add HashKey Chain Testnet: ${addError.message}`);
        }
      } else {
        setError(`Failed to switch to HashKey Chain Testnet: ${switchError.message}`);
      }
    }
  };

  // Execute real on-chain bounty reservation
  const reserveBountyOnChain = async (
    ticketId: string,
    repo: string,
    amount: number
  ): Promise<{ success: boolean; txHash?: string; error?: string }> => {
    if (!account || !isHskChain) {
      return { success: false, error: 'Connect your wallet and switch to HashKey Chain Testnet (Chain 133) first.' };
    }
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const treasury = new ethers.Contract(
        CONTRACT_ADDRESSES.treasury,
        CONTRACT_ABIS.treasury,
        signer
      );

      const parsedAmount = ethers.parseEther(amount.toString());
      const tx = await treasury.reserveBounty(ticketId, repo, parsedAmount);
      setLastTxHash(tx.hash);
      await tx.wait();
      return { success: true, txHash: tx.hash };
    } catch (err: any) {
      const msg = err.reason || err.message || 'On-chain reservation failed';
      return { success: false, error: msg };
    }
  };

  // Execute real on-chain bounty payout
  const settleBountyOnChain = async (
    ticketId: string,
    payeeAddress: string,
    prUrl: string
  ): Promise<{ success: boolean; txHash?: string; error?: string }> => {
    if (!account || !isHskChain) {
      return { success: false, error: 'Connect your wallet and switch to HashKey Chain Testnet (Chain 133) first.' };
    }
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const treasury = new ethers.Contract(
        CONTRACT_ADDRESSES.treasury,
        CONTRACT_ABIS.treasury,
        signer
      );

      const tx = await treasury.confirmAndPay(ticketId, payeeAddress, prUrl);
      setLastTxHash(tx.hash);
      await tx.wait();
      return { success: true, txHash: tx.hash };
    } catch (err: any) {
      const msg = err.reason || err.message || 'On-chain settlement failed';
      return { success: false, error: msg };
    }
  };

  return (
    <Web3HskContext.Provider
      value={{
        account,
        chainId,
        isHskChain,
        isConnecting,
        hskBalance,
        liveBlockNumber,
        liveGasPrice,
        isRpcOnline,
        isLiveMode,
        onChainTreasuryData,
        lastTxHash,
        error,
        connectWallet,
        switchToHskTestnet,
        refreshLiveState: fetchLiveHskRpcData,
        setIsLiveMode,
        reserveBountyOnChain,
        settleBountyOnChain,
      }}
    >
      {children}
    </Web3HskContext.Provider>
  );
}

export function useWeb3Hsk() {
  const context = useContext(Web3HskContext);
  if (!context) {
    throw new Error('useWeb3Hsk must be used within a Web3HskProvider');
  }
  return context;
}
