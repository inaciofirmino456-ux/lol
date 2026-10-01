import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { SolanaAdapter } from '@reown/appkit-adapter-solana/react';
import { BitcoinAdapter } from '@reown/appkit-adapter-bitcoin';
import { bsc, mainnet, base, solana, bitcoin } from '@reown/appkit/networks';
import { fallback, http } from 'wagmi';

export const projectId = import.meta.env.VITE_REOWN_PROJECT_ID;
if (!projectId) throw new Error('VITE_REOWN_PROJECT_ID não configurado.');

export const evmNetworks = [mainnet, base, bsc] as const;
export const networks = [mainnet, base, bsc, solana, bitcoin] as const;

export const metadata = {
  name: 'TopBid',
  description: 'Bid for the top rank on TopBid.',
  url: 'https://topbid-lol.onrender.com',
};

const rpc = {
  ethereum: [import.meta.env.VITE_RPC_ETHEREUM_1, import.meta.env.VITE_RPC_ETHEREUM_2, import.meta.env.VITE_RPC_ETHEREUM_3].filter(Boolean),
  base: [import.meta.env.VITE_RPC_BASE_1, import.meta.env.VITE_RPC_BASE_2, import.meta.env.VITE_RPC_BASE_3].filter(Boolean),
  bsc: [import.meta.env.VITE_RPC_BSC_1, import.meta.env.VITE_RPC_BSC_2, import.meta.env.VITE_RPC_BSC_3].filter(Boolean),
};
const transports = {
  [mainnet.id]: fallback(rpc.ethereum.map((url:string) => http(url, { timeout: 10_000 })) as any),
  [base.id]: fallback(rpc.base.map((url:string) => http(url, { timeout: 10_000 })) as any),
  [bsc.id]: fallback(rpc.bsc.map((url:string) => http(url, { timeout: 10_000 })) as any),
};

export const wagmiAdapter = new WagmiAdapter({
  networks: [...evmNetworks],
  projectId,
  transports,
});

export const solanaAdapter = new SolanaAdapter({});
export const bitcoinAdapter = new BitcoinAdapter({
  networks: [bitcoin],
  projectId,
});

createAppKit({
  adapters: [wagmiAdapter, solanaAdapter, bitcoinAdapter],
  networks: [...networks],
  projectId,
  metadata,
  features: {
    analytics: false,
    email: false,
    socials: [],
  },
  themeMode: 'light',
});
