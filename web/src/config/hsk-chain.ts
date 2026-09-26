import { ethers } from 'ethers';
import deployedContracts from './deployed-contracts.json';
import contractsAbi from './contracts-abi.json';

export const HSK_CHAIN_CONFIG = {
  chainId: 133,
  chainIdHex: '0x85',
  chainName: 'HashKey Chain Testnet',
  nativeCurrency: {
    name: 'HashKey EcoPoints',
    symbol: 'HSK',
    decimals: 18,
  },
  rpcUrls: [
    'https://testnet.hsk.xyz',
    'https://133.rpc.thirdweb.com',
  ],
  blockExplorerUrls: [
    'https://testnet-explorer.hskchain.net',
  ],
  faucetUrl: 'https://faucet.hsk.xyz',
};

export const CONTRACT_ADDRESSES = {
  treasury: (deployedContracts as any).treasury || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  token: (deployedContracts as any).token || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  steward: (deployedContracts as any).steward || '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
  champion: (deployedContracts as any).champion || '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
  maintainer: (deployedContracts as any).maintainer || '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
};

export const CONTRACT_ABIS = {
  treasury: (contractsAbi as any).OpenWorksTreasury || [],
  token: (contractsAbi as any).MockTestToken || [],
};

/**
 * Returns a read-only ethers JsonRpcProvider connected to HashKey Chain Testnet
 */
export function getHskRpcProvider(): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(HSK_CHAIN_CONFIG.rpcUrls[0], {
    name: HSK_CHAIN_CONFIG.chainName,
    chainId: HSK_CHAIN_CONFIG.chainId,
  });
}

export function formatAddress(address: string): string {
  if (!address || address.length < 10) return address || '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function getExplorerAddressUrl(address: string): string {
  return `${HSK_CHAIN_CONFIG.blockExplorerUrls[0]}/address/${address}`;
}

export function getExplorerTxUrl(txHash: string): string {
  return `${HSK_CHAIN_CONFIG.blockExplorerUrls[0]}/tx/${txHash}`;
}
