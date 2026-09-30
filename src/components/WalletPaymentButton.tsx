import React from 'react';
import { Wallet, CheckCircle2 } from 'lucide-react';
import { useAppKit } from '@reown/appkit/react';
import { useAccount } from 'wagmi';

export const WalletPaymentButton: React.FC = () => {
  const { open } = useAppKit();
  const { address, isConnected } = useAccount();

  const shortAddress = address
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : '';

  return (
    <button
      type="button"
      onClick={() => open()}
      className="w-full py-3 px-4 rounded-full border-2 border-[#1c1917] bg-white hover:bg-[#f8f3ef] text-[#1c1917] font-bold text-sm transition-all flex items-center justify-center gap-2"
    >
      {isConnected ? (
        <>
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Carteira conectada · {shortAddress}</span>
        </>
      ) : (
        <>
          <Wallet className="w-4 h-4" />
          <span>Pagar com carteira</span>
        </>
      )}
    </button>
  );
};
