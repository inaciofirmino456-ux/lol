import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { bsc, mainnet, base } from '@reown/appkit/networks';

export const projectId =
  import.meta.env.VITE_REOWN_PROJECT_ID ||
  '52b71fb9a45b4c8184c75d946b0839d5';

export const networks = [mainnet, base, bsc] as const;

export const metadata = {
  name: 'TopBid',
  description: 'Bid for the top rank on TopBid.',
  url: 'https://topbid-lol.onrender.com',
};

export const wagmiAdapter = new WagmiAdapter({
  networks: [...networks],
  projectId,
});

createAppKit({
  adapters: [wagmiAdapter],
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
