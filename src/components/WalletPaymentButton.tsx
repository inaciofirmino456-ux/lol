import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Loader2, Wallet } from 'lucide-react';
import { useAppKit } from '@reown/appkit/react';
import {
  useAccount,
  useSendTransaction,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi';
import { parseEther, parseUnits, type Address } from 'viem';

type PaymentOption =
  | { id: 'eth'; label: string; symbol: 'ETH'; chainId: 1; kind: 'native'; recipient: Address; decimals: 18 }
  | { id: 'usdc-base'; label: string; symbol: 'USDC'; chainId: 8453; kind: 'erc20'; recipient: Address; token: Address; decimals: 6 }
  | { id: 'usdt-base'; label: string; symbol: 'USDT'; chainId: 8453; kind: 'erc20'; recipient: Address; token: Address; decimals: 6 }
  | { id: 'usdc-bsc'; label: string; symbol: 'USDC'; chainId: 56; kind: 'erc20'; recipient: Address; token: Address; decimals: 18 };

const PAYMENT_OPTIONS: PaymentOption[] = [
  { id: 'eth', label: 'ETH · Ethereum', symbol: 'ETH', chainId: 1, kind: 'native', recipient: '0x1291637D7635Ca893465CB764e9f2AF18C910109', decimals: 18 },
  { id: 'usdc-base', label: 'USDC · Base', symbol: 'USDC', chainId: 8453, kind: 'erc20', recipient: '0xD86dDD14536D9F1895cD42AF168C0686d6Be2B40', token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6 },
  { id: 'usdt-base', label: 'USDT · Base', symbol: 'USDT', chainId: 8453, kind: 'erc20', recipient: '0xD86dDD14536D9F1895cD42AF168C0686d6Be2B40', token: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2', decimals: 6 },
  { id: 'usdc-bsc', label: 'USDC · BNB Chain', symbol: 'USDC', chainId: 56, kind: 'erc20', recipient: '0xD86dDD14536D9F1895cD42AF168C0686d6Be2B40', token: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', decimals: 18 },
];

const ERC20_ABI = [
  {
    type: 'function',
    name: 'transfer',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

interface WalletPaymentButtonProps {
  usdAmount: number;
  onPaid: (txHash: string) => void;
  disabled?: boolean;
}

export const WalletPaymentButton: React.FC<WalletPaymentButtonProps> = ({ usdAmount, onPaid, disabled = false }) => {
  const { open } = useAppKit();
  const { address, isConnected } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { sendTransactionAsync, isPending: isNativePending } = useSendTransaction();
  const { writeContractAsync, isPending: isTokenPending } = useWriteContract();
  const [selectedId, setSelectedId] = useState<PaymentOption['id']>('usdc-base');
  const [assetUsd, setAssetUsd] = useState<Record<string, number>>({});
  const [txHash, setTxHash] = useState<`0x${string}`>();
  const [error, setError] = useState('');

  const selected = useMemo(() => PAYMENT_OPTIONS.find((option) => option.id === selectedId)!, [selectedId]);
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
    chainId: selected.chainId,
  });

  useEffect(() => {
    let cancelled = false;
    const loadPrices = async () => {
      try {
        const symbols = ['ETH', 'USDC', 'USDT'];
        const entries = await Promise.all(symbols.map(async (symbol) => {
          const response = await fetch('https://api.coinbase.com/v2/exchange-rates?currency=' + symbol);
          if (!response.ok) throw new Error('price');
          const data = await response.json();
          const price = Number(data?.data?.rates?.USD);
          return [symbol, price] as const;
        }));
        const prices = Object.fromEntries(entries.filter(([, price]) => Number.isFinite(price) && price > 0));
        if (!cancelled) setAssetUsd(prices);
      } catch {
        // Keep the previous successful quote if the provider is temporarily unavailable.
      }
    };
    loadPrices();
    const timer = window.setInterval(loadPrices, 30000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, []);

  useEffect(() => {
    if (isConfirmed && txHash) onPaid(txHash);
  }, [isConfirmed, txHash, onPaid]);

  const busy = isNativePending || isTokenPending || isConfirming;

  const handlePay = async () => {
    setError('');
    setTxHash(undefined);
    if (!isConnected || !address) {
      open();
      return;
    }

    try {
      await switchChainAsync({ chainId: selected.chainId });
      let hash: `0x${string}`;

      if (selected.kind === 'native') {
        const price = assetUsd[selected.symbol];
        if (!price) {
          setError('Cotação indisponível. Tenta novamente.');
          return;
        }
        const ethAmount = usdAmount / price;
        hash = await sendTransactionAsync({
          to: selected.recipient,
          value: parseEther(ethAmount.toFixed(18)),
        });
      } else {
        const price = assetUsd[selected.symbol];
        if (!price) {
          setError('Cotação indisponível. Tenta novamente.');
          return;
        }
        const tokenAmount = parseUnits((usdAmount / price).toFixed(selected.decimals), selected.decimals);
        hash = await writeContractAsync({
          address: selected.token,
          abi: ERC20_ABI,
          functionName: 'transfer',
          args: [selected.recipient, tokenAmount],
          chainId: selected.chainId,
        });
      }

      setTxHash(hash);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Pagamento cancelado ou falhou.';
      setError(message.length > 120 ? message.slice(0, 117) + '...' : message);
    }
  };

  const shortAddress = address ? address.slice(0, 6) + '…' + address.slice(-4) : '';

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <select value={selectedId} onChange={(e) => setSelectedId(e.target.value as PaymentOption['id'])} disabled={busy || disabled}
          className="flex-1 px-3 py-3 rounded-xl bg-white border border-[#ebdcd4] text-xs font-semibold text-[#1c1917] focus:outline-none focus:border-[#e05638]">
          {PAYMENT_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
        </select>
        <button type="button" onClick={handlePay} disabled={busy || disabled || usdAmount < 1}
          className="px-4 py-3 rounded-xl bg-[#1c1917] hover:bg-black text-white font-bold text-sm disabled:opacity-50 transition-all whitespace-nowrap">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4 inline mr-1.5" />}
          {busy ? 'A processar…' : 'Pagar'}
        </button>
      </div>
      <div className="text-[11px] text-[#78716c]">
        {assetUsd[selected.symbol]
          ? '≈ ' + (usdAmount / assetUsd[selected.symbol]).toFixed(selected.symbol === 'ETH' ? 6 : 4) + ' ' + selected.symbol
          : 'A obter cotação…'}
        {isConnected && <span> · {shortAddress}</span>}
      </div>
      {isConfirming && <div className="flex items-center gap-2 text-[11px] text-[#78716c]"><Loader2 className="w-3.5 h-3.5 animate-spin" />A aguardar confirmação da blockchain…</div>}
      {isConfirmed && <div className="flex items-center gap-2 text-[11px] text-emerald-700 font-semibold"><CheckCircle2 className="w-3.5 h-3.5" />Pagamento confirmado.</div>}
      {error && <div className="text-[11px] text-red-600 break-words">{error}</div>}
    </div>
  );
};
