import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { SolanaAdapter } from '@reown/appkit-adapter-solana/react';
import { BitcoinAdapter } from '@reown/appkit-adapter-bitcoin';
import { bsc, mainnet, base, solana, bitcoin } from '@reown/appkit/networks';

export const projectId = import.meta.env.VITE_REOWN_PROJECT_ID;
if (!projectId) throw new Error('VITE_REOWN_PROJECT_ID não configurado.');

export const evmNetworks = [mainnet, base, bsc] as const;
export const networks = [mainnet, base, bsc, solana, bitcoin] as const;

export const metadata = {
  name: 'TopBid',
  description: 'Bid for the top rank on TopBid.',
  url: 'https://topbid-lol.onrender.com',
};

export const wagmiAdapter = new WagmiAdapter({
  networks: [...evmNetworks],
  projectId,
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
