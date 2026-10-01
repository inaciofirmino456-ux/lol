import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Loader2, Wallet } from 'lucide-react';
import { useAppKit, useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';
import {
  useAccount,
  useSendTransaction,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi';
import { parseEther, parseUnits, type Address } from 'viem';
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import {
  createTransferCheckedInstruction,
  createAssociatedTokenAccountIdempotentInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';

type PaymentId = 'eth' | 'usdc-base' | 'usdt-base' | 'usdc-bsc' | 'btc' | 'usdc-solana' | 'usdt-solana';

type PaymentOption = {
  id: PaymentId;
  label: string;
  symbol: 'ETH' | 'USDC' | 'USDT' | 'BTC';
  network: 'Ethereum' | 'Base' | 'BNB Chain' | 'Bitcoin' | 'Solana';
  chainId?: number;
  kind: 'nativeEvm' | 'erc20' | 'bitcoin' | 'solNative' | 'solSpl';
  recipient: string;
  token?: string;
  decimals: number;
};

const EVM_RECIPIENT = '0xD86dDD14536D9F1895cD42AF168C0686d6Be2B40';
const ETH_RECIPIENT = '0x1291637D7635Ca893465CB764e9f2AF18C910109';
const SOL_RECIPIENT = '39phSiQkBXM64VFUSHQB7wPuyEvPqJPyGkyAKyzYnYsH';
const BTC_RECIPIENT = 'bc1qa9fn20r8k58vqspg24qcs4tce76xkxugmufnzr';

const PAYMENT_OPTIONS: PaymentOption[] = [
  { id: 'usdc-base', label: 'USDC · Base', symbol: 'USDC', network: 'Base', chainId: 8453, kind: 'erc20', recipient: EVM_RECIPIENT, token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6 },
  { id: 'usdt-base', label: 'USDT · Base', symbol: 'USDT', network: 'Base', chainId: 8453, kind: 'erc20', recipient: EVM_RECIPIENT, token: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2', decimals: 6 },
  { id: 'usdc-bsc', label: 'USDC · BNB Chain', symbol: 'USDC', network: 'BNB Chain', chainId: 56, kind: 'erc20', recipient: EVM_RECIPIENT, token: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', decimals: 18 },
  { id: 'eth', label: 'ETH · Ethereum', symbol: 'ETH', network: 'Ethereum', chainId: 1, kind: 'nativeEvm', recipient: ETH_RECIPIENT, decimals: 18 },
  { id: 'usdc-solana', label: 'USDC · Solana', symbol: 'USDC', network: 'Solana', kind: 'solSpl', recipient: SOL_RECIPIENT, token: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', decimals: 6 },
  { id: 'usdt-solana', label: 'USDT · Solana', symbol: 'USDT', network: 'Solana', kind: 'solSpl', recipient: SOL_RECIPIENT, token: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', decimals: 6 },
  { id: 'btc', label: 'BTC · Bitcoin', symbol: 'BTC', network: 'Bitcoin', kind: 'bitcoin', recipient: BTC_RECIPIENT, decimals: 8 },
];

const ERC20_ABI = [{
  type: 'function',
  name: 'transfer',
  stateMutability: 'nonpayable',
  inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }],
  outputs: [{ name: '', type: 'bool' }],
}] as const;

const SOLANA_RPC = 'https://api.mainnet-beta.solana.com';
const solanaConnection = new Connection(SOLANA_RPC, 'confirmed');

interface WalletPaymentButtonProps {
  usdAmount: number;
  onPaid: (txHash: string) => void;
  disabled?: boolean;
  url: string;
  categorySlug: string;
}

export const WalletPaymentButton: React.FC<WalletPaymentButtonProps> = ({ usdAmount, onPaid, disabled = false, url, categorySlug }) => {
  const { open } = useAppKit();
  const { address: evmAddress, isConnected: evmConnected } = useAccount();
  const { address: solAddress, isConnected: solConnected } = useAppKitAccount({ namespace: 'solana' });
  const { address: btcAddress, isConnected: btcConnected } = useAppKitAccount({ namespace: 'bip122' });
  const { walletProvider: solProvider } = useAppKitProvider<any>('solana');
  const { walletProvider: btcProvider } = useAppKitProvider<any>('bip122');
  const { switchChainAsync } = useSwitchChain();
  const { sendTransactionAsync, isPending: isNativePending } = useSendTransaction();
  const { writeContractAsync, isPending: isTokenPending } = useWriteContract();

  const [selectedId, setSelectedId] = useState<PaymentId>('usdc-base');
  const [assetUsd, setAssetUsd] = useState<Record<string, number>>({});
  const [txHash, setTxHash] = useState<string>();
  const [confirmingOther, setConfirmingOther] = useState(false);
  const [confirmedOther, setConfirmedOther] = useState(false);
  const [error, setError] = useState('');
  const [orderId, setOrderId] = useState<string>();
  const [quote, setQuote] = useState<{expectedUnits:string; rateUsd:number; decimals:number; receivingAddress:string; token?:string|null}>();

  const selected = useMemo(() => PAYMENT_OPTIONS.find((o) => o.id === selectedId)!, [selectedId]);
  const { isLoading: isEvmConfirming, isSuccess: isEvmConfirmed } = useWaitForTransactionReceipt({
    hash: txHash && txHash.startsWith('0x') ? txHash as `0x${string}` : undefined,
    chainId: selected.chainId,
  });

  useEffect(() => {
    let cancelled = false;
    const loadPrices = async () => {
      try {
        const symbols = ['ETH', 'BTC', 'USDC', 'USDT'];
        const entries = await Promise.all(symbols.map(async (symbol) => {
          const response = await fetch('https://api.coinbase.com/v2/exchange-rates?currency=' + symbol);
          if (!response.ok) throw new Error('price');
          const data = await response.json();
          return [symbol, Number(data?.data?.rates?.USD)] as const;
        }));
        const prices = Object.fromEntries(entries.filter(([, p]) => Number.isFinite(p) && p > 0));
        if (!cancelled) setAssetUsd(prices);
      } catch {
        // Keep the last valid quote.
      }
    };
    loadPrices();
    const timer = window.setInterval(loadPrices, 30000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, []);

  useEffect(() => {
    if (isEvmConfirmed && txHash) onPaid(txHash);
  }, [isEvmConfirmed, txHash, onPaid]);

  useEffect(() => {
    if (confirmedOther && txHash) onPaid(txHash);
  }, [confirmedOther, txHash, onPaid]);

  const connectedForSelectedNetwork =
    selected.kind === 'bitcoin' ? btcConnected :
    selected.kind === 'solNative' || selected.kind === 'solSpl' ? solConnected :
    evmConnected;

  const busy = isNativePending || isTokenPending || isEvmConfirming || confirmingOther;

  const API = 'https://fvpglbppmmexcysuumth.supabase.co/functions/v1';

  const preparePayment = async () => {
    const create = await fetch(API + '/create-order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url, requestedTotalUsd: usdAmount, categorySlug }) });
    const created = await create.json();
    if (!create.ok || !created?.orderId) throw new Error(created?.error || 'Não foi possível criar o pagamento.');
    const instructions = await fetch(API + '/crypto-payment-instructions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId: created.orderId, network: selected.network === 'Ethereum' ? 'ethereum' : selected.network === 'Base' ? 'base' : selected.network === 'BNB Chain' ? 'bsc' : selected.network === 'Bitcoin' ? 'bitcoin' : 'solana', asset: selected.symbol }) });
    const q = await instructions.json();
    if (!instructions.ok || !q?.expectedUnits) throw new Error(q?.error || 'Não foi possível obter a cotação de pagamento.');
    setOrderId(created.orderId);
    setQuote(q);
    return { orderId: created.orderId as string, expectedUnits: String(q.expectedUnits) };
  };

  const verifyPayment = async (id: string, hash: string) => {
    const network = selected.network === 'Ethereum' ? 'ethereum' : selected.network === 'Base' ? 'base' : selected.network === 'BNB Chain' ? 'bsc' : selected.network === 'Bitcoin' ? 'bitcoin' : 'solana';
    const response = await fetch(API + '/verify-crypto-payment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId: id, network, asset: selected.symbol, txHash: hash }) });
    const result = await response.json();
    if (!response.ok || result?.ok !== true) throw new Error(result?.error || 'O pagamento ainda não foi confirmado pela blockchain.');
    return result;
  };

  const handleSolanaPay = async (amount: bigint) => {
    if (!solProvider || !solAddress) {
      open({ view: 'Connect', namespace: 'solana' });
      return;
    }

    const from = new PublicKey(solAddress);
    const to = new PublicKey(SOL_RECIPIENT);
    const latest = await solanaConnection.getLatestBlockhash('confirmed');
    const tx = new Transaction();
    tx.feePayer = from;
    tx.recentBlockhash = latest.blockhash;

    if (selected.kind === 'solNative') {
      tx.add(SystemProgram.transfer({
        fromPubkey: from,
        toPubkey: to,
        lamports: Number(amount),
      }));
    } else {
      const mint = new PublicKey(selected.token!);
      const sourceAta = await getAssociatedTokenAddress(mint, from);
      const destinationAta = await getAssociatedTokenAddress(mint, to);
      tx.add(createAssociatedTokenAccountIdempotentInstruction(
        from,
        destinationAta,
        to,
        mint,
        TOKEN_PROGRAM_ID,
      ));
      tx.add(createTransferCheckedInstruction(
        sourceAta,
        mint,
        destinationAta,
        from,
        Number(amount),
        selected.decimals,
        [],
        TOKEN_PROGRAM_ID,
      ));
    }

    const raw = tx.serialize({ requireAllSignatures: false, verifySignatures: false });
    const base64 = btoa(String.fromCharCode(...raw));
    const result = await solProvider.signAndSendTransaction({
      transaction: base64,
      pubkey: solAddress,
    });
    const signature = typeof result === 'string' ? result : result?.signature;
    if (!signature) throw new Error('A carteira não devolveu o hash da transação.');

    setTxHash(signature);
    setConfirmingOther(true);
    await solanaConnection.confirmTransaction({
      signature,
      blockhash: latest.blockhash,
      lastValidBlockHeight: latest.lastValidBlockHeight,
    }, 'confirmed');
    setConfirmingOther(false);
    setConfirmedOther(true);
  };

  const handleBitcoinPay = async (amountBtc: bigint) => {
    if (!btcProvider || !btcAddress) {
      open({ view: 'Connect', namespace: 'bip122' });
      return;
    }

    const satoshis = amountBtc;
    const result = await btcProvider.request({
      method: 'sendTransfer',
      params: {
        recipients: [{ address: selected.recipient, amount: String(satoshis) }],
      },
    });
    const txid = result?.txid || result?.result?.txid;
    if (!txid) throw new Error('A carteira não devolveu o ID da transação.');

    setTxHash(txid);
    setConfirmingOther(true);

    for (let i = 0; i < 30; i++) {
      const response = await fetch('https://blockstream.info/api/tx/' + txid + '/status');
      if (response.ok) {
        const status = await response.json();
        if (status.confirmed) {
          setConfirmingOther(false);
          setConfirmedOther(true);
          return;
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    setConfirmingOther(false);
    throw new Error('Transação BTC enviada, mas ainda aguarda confirmação.');
  };

  const handlePay = async () => {
    setError('');
    setTxHash(undefined);
    setConfirmedOther(false);

    const price = assetUsd[selected.symbol];
    if (!price) {
      setError('Cotação indisponível. Tenta novamente.');
      return;
    }

    try {
      if (!connectedForSelectedNetwork) {
        open({ view: 'Connect' });
        return;
      }

      const amount = usdAmount / price;

      const prepared = await preparePayment();
      const expected = BigInt(prepared.expectedUnits);

      if (selected.kind === 'bitcoin') {
        await handleBitcoinPay(expected);
        return;
      }

      if (selected.kind === 'solNative' || selected.kind === 'solSpl') {
        await handleSolanaPay(expected);
        return;
      }

      await switchChainAsync({ chainId: selected.chainId! });

      let hash: `0x${string}`;
      if (selected.kind === 'nativeEvm') {
        hash = await sendTransactionAsync({
          to: selected.recipient as Address,
          value: expected,
        });
      } else {
        hash = await writeContractAsync({
          address: selected.token as Address,
          abi: ERC20_ABI,
          functionName: 'transfer',
          args: [selected.recipient as Address, expected],
          chainId: selected.chainId,
        });
      }
      setTxHash(hash);
      setConfirmingOther(true);
      await verifyPayment(prepared.orderId, hash);
      setConfirmingOther(false);
      setConfirmedOther(true);
    } catch (err) {
      setConfirmingOther(false);
      const message = err instanceof Error ? err.message : 'Pagamento cancelado ou falhou.';
      setError(message.length > 160 ? message.slice(0, 157) + '...' : message);
    }
  };

  const shortAddress = (value?: string | null) => value ? value.slice(0, 6) + '…' + value.slice(-4) : '';

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value as PaymentId)}
          disabled={busy || disabled}
          className="flex-1 px-3 py-3 rounded-xl bg-white border border-[#ebdcd4] text-xs font-semibold text-[#1c1917] focus:outline-none focus:border-[#e05638]"
        >
          {PAYMENT_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
        </select>

        <button
          type="button"
          onClick={handlePay}
          disabled={busy || disabled || usdAmount < 1}
          className="px-4 py-3 rounded-xl bg-[#1c1917] hover:bg-black text-white font-bold text-sm disabled:opacity-50 transition-all whitespace-nowrap"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4 inline mr-1.5" />}
          {busy ? 'A processar…' : 'Pagar'}
        </button>
      </div>

      <div className="text-[11px] text-[#78716c]">
        {assetUsd[selected.symbol]
          ? '≈ ' + (usdAmount / assetUsd[selected.symbol]).toFixed(selected.symbol === 'BTC' ? 8 : selected.symbol === 'ETH' ? 6 : 4) + ' ' + selected.symbol
          : 'A obter cotação…'}
        {selected.network === 'Bitcoin' && btcAddress && <span> · {shortAddress(btcAddress)}</span>}
        {selected.network === 'Solana' && solAddress && <span> · {shortAddress(solAddress)}</span>}
        {selected.network !== 'Bitcoin' && selected.network !== 'Solana' && evmAddress && <span> · {shortAddress(evmAddress)}</span>}
      </div>

      {(isEvmConfirming || confirmingOther) && (
        <div className="flex items-center gap-2 text-[11px] text-[#78716c]">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          A aguardar confirmação da blockchain…
        </div>
      )}

      {(isEvmConfirmed || confirmedOther) && (
        <div className="flex items-center gap-2 text-[11px] text-emerald-700 font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Pagamento confirmado.
        </div>
      )}

      {error && <div className="text-[11px] text-red-600 break-words">{error}</div>}
    </div>
  );
};
