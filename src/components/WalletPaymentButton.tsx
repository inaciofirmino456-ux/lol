import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Copy, Loader2, Wallet, RefreshCw, Unplug } from 'lucide-react';
import { useAppKit, useAppKitAccount, useAppKitProvider, useDisconnect } from '@reown/appkit/react';
import {
  useAccount,
  useDisconnect as useWagmiDisconnect,
  useSendTransaction,
  useSwitchChain,
  useWriteContract,
  useBalance,
  useReadContract,
} from 'wagmi';
import { type Address } from 'viem';
import { createClient } from '@supabase/supabase-js';
import { Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import {
  createTransferCheckedInstruction,
  createAssociatedTokenAccountIdempotentInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';

type PaymentId = 'eth' | 'usdc-base' | 'usdt-base' | 'usdc-bsc' | 'btc' | 'usdc-solana' | 'usdt-solana';
type PaymentOption = {
  id: PaymentId; label: string; symbol: 'ETH' | 'USDC' | 'USDT' | 'BTC';
  network: 'Ethereum' | 'Base' | 'BNB Chain' | 'Bitcoin' | 'Solana';
  chainId?: number; kind: 'nativeEvm' | 'erc20' | 'bitcoin' | 'solNative' | 'solSpl';
  recipient: string; token?: string; decimals: number;
};

const EVM_RECIPIENT = '0xD86dDD14536D9F1895cD42AF168C0686d6Be2B40';
const ETH_RECIPIENT = '0x1291637D7635Ca893465CB764e9f2AF18C910109';
const SOL_RECIPIENT = '39phSiQkBXM64VFUSHQB7wPuyEvPqJPyGkyAKyzYnYsH';
const BTC_RECIPIENT = 'bc1qa9fn20r8k58vqspg24qcs4tce76xkxugmufnzr';
const PAYMENT_OPTIONS: PaymentOption[] = [
  { id:'usdc-base',label:'USDC · Base',symbol:'USDC',network:'Base',chainId:8453,kind:'erc20',recipient:EVM_RECIPIENT,token:'0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',decimals:6 },
  { id:'usdt-base',label:'USDT · Base',symbol:'USDT',network:'Base',chainId:8453,kind:'erc20',recipient:EVM_RECIPIENT,token:'0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',decimals:6 },
  { id:'usdc-bsc',label:'USDC · BNB Chain',symbol:'USDC',network:'BNB Chain',chainId:56,kind:'erc20',recipient:EVM_RECIPIENT,token:'0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',decimals:18 },
  { id:'eth',label:'ETH · Ethereum',symbol:'ETH',network:'Ethereum',chainId:1,kind:'nativeEvm',recipient:ETH_RECIPIENT,decimals:18 },
  { id:'usdc-solana',label:'USDC · Solana',symbol:'USDC',network:'Solana',kind:'solSpl',recipient:SOL_RECIPIENT,token:'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',decimals:6 },
  { id:'usdt-solana',label:'USDT · Solana',symbol:'USDT',network:'Solana',kind:'solSpl',recipient:SOL_RECIPIENT,token:'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',decimals:6 },
  { id:'btc',label:'BTC · Bitcoin',symbol:'BTC',network:'Bitcoin',kind:'bitcoin',recipient:BTC_RECIPIENT,decimals:8 },
];
const ERC20_ABI = [{type:'function',name:'transfer',stateMutability:'nonpayable',inputs:[{name:'to',type:'address'},{name:'amount',type:'uint256'}],outputs:[{name:'',type:'bool'}]}] as const;
const SOLANA_RPC=import.meta.env.VITE_SOLANA_RPC_URL||'';
const SOLANA_RPC_FALLBACKS=[import.meta.env.VITE_SOLANA_RPC_URL_2,import.meta.env.VITE_SOLANA_RPC_URL_3].filter(Boolean) as string[];
const solanaConnection=new Connection(SOLANA_RPC||'https://api.mainnet-beta.solana.com','confirmed');
const SUPABASE_URL=import.meta.env.VITE_SUPABASE_URL||'https://fvpglbppmmexcysuumth.supabase.co';
const SUPABASE_KEY=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY||import.meta.env.VITE_SUPABASE_ANON_KEY||'';
const supabase=SUPABASE_KEY?createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:false}}):null;

interface Props { usdAmount:number; onPaid:(txHash:string)=>void; disabled?:boolean; url:string; categorySlug:string; }

function short(value?:string|null){ return value ? value.slice(0,6)+'…'+value.slice(-4) : ''; }
function qrUrl(data:string){ return 'https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data='+encodeURIComponent(data); }
function evmUri(option:PaymentOption,units:string){
  if(option.kind==='nativeEvm') return 'ethereum:'+option.recipient+'?value='+BigInt(units).toString(16);
  return 'ethereum:'+option.token+'@'+option.chainId+'/transfer?address='+option.recipient+'&uint256='+units;
}
function paymentUri(option:PaymentOption,units:string){
  if(option.network==='Bitcoin') return 'bitcoin:'+option.recipient+'?amount='+Number(units)/1e8;
  if(option.network==='Solana') return option.token ? 'solana:'+option.recipient+'?amount='+Number(units)/10**option.decimals+'&spl-token='+option.token : 'solana:'+option.recipient+'?amount='+Number(units)/1e9;
  return evmUri(option,units);
}

export const WalletPaymentButton:React.FC<Props>=({usdAmount,onPaid,disabled=false,url,categorySlug})=>{
  const {open}=useAppKit();
  const {disconnect:disconnectAppKit}=useDisconnect();
  const {address:evmAddress,isConnected:evmConnected,chainId}=useAccount();
  const {disconnect:disconnectEvm}=useWagmiDisconnect();
  const {address:solAddress,isConnected:solConnected}=useAppKitAccount({namespace:'solana'});
  const {address:btcAddress,isConnected:btcConnected}=useAppKitAccount({namespace:'bip122'});
  const {walletProvider:solProvider}=useAppKitProvider<any>('solana');
  const {walletProvider:btcProvider}=useAppKitProvider<any>('bip122');
  const {switchChainAsync}=useSwitchChain();
  const {sendTransactionAsync,isPending:isNativePending}=useSendTransaction();
  const {writeContractAsync,isPending:isTokenPending}=useWriteContract();

  const [selectedId,setSelectedId]=useState<PaymentId>('usdc-base');
  const [assetUsd,setAssetUsd]=useState<Record<string,number>>({});
  const [txHash,setTxHash]=useState<string>();
  const [confirming,setConfirming]=useState(false);
  const [confirmed,setConfirmed]=useState(false);
  const [error,setError]=useState('');
  const [connecting,setConnecting]=useState(false);
  const [showFallback,setShowFallback]=useState(false);
  const [expectedUnits,setExpectedUnits]=useState<string>();
  const [paymentState,setPaymentState]=useState<'idle'|'waiting'|'confirming'|'confirmed'|'ranking'>('idle');
  const [balances,setBalances]=useState<string[]>([]);
  const [balanceLoading,setBalanceLoading]=useState(false);
  const [balanceError,setBalanceError]=useState('');
  const [balanceRpc,setBalanceRpc]=useState('');
  const [balanceUpdatedAt,setBalanceUpdatedAt]=useState('');
  const [balanceRaw,setBalanceRaw]=useState('');
  const debug=typeof window!=='undefined'&&new URLSearchParams(window.location.search).get('debug')==='1';

  const evmEnabled=Boolean(evmAddress);
  const ethBalance=useBalance({address:evmAddress,chainId:1,query:{enabled:evmEnabled,refetchInterval:15000,retry:3,retryDelay:1000}});
  const baseBalance=useBalance({address:evmAddress,chainId:8453,query:{enabled:evmEnabled,refetchInterval:15000,retry:3,retryDelay:1000}});
  const bnbBalance=useBalance({address:evmAddress,chainId:56,query:{enabled:evmEnabled,refetchInterval:15000,retry:3,retryDelay:1000}});
  const tokenAbi=[{type:'function',name:'balanceOf',stateMutability:'view',inputs:[{name:'account',type:'address'}],outputs:[{name:'',type:'uint256'}]}] as const;
  const usdcBase=useReadContract({address:'0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',abi:tokenAbi,functionName:'balanceOf',args:evmAddress?[evmAddress]:undefined,chainId:8453,query:{enabled:evmEnabled,refetchInterval:15000,retry:3,retryDelay:1000}});
  const usdtBase=useReadContract({address:'0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',abi:tokenAbi,functionName:'balanceOf',args:evmAddress?[evmAddress]:undefined,chainId:8453,query:{enabled:evmEnabled,refetchInterval:15000,retry:3,retryDelay:1000}});
  const usdcBsc=useReadContract({address:'0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',abi:tokenAbi,functionName:'balanceOf',args:evmAddress?[evmAddress]:undefined,chainId:56,query:{enabled:evmEnabled,refetchInterval:15000,retry:3,retryDelay:1000}});
  const selected=useMemo(()=>PAYMENT_OPTIONS.find(o=>o.id===selectedId)!,[selectedId]);
  const connectedForSelected=selected.network==='Bitcoin'?btcConnected:selected.network==='Solana'?solConnected:evmConnected;
  const supportedEvm=selected.network==='Ethereum'||selected.network==='Base'||selected.network==='BNB Chain';
  const selectedChainSupported=!supportedEvm||chainId===selected.chainId;
  const busy=isNativePending||isTokenPending||confirming;

  useEffect(()=>{
    let cancelled=false;
    const load=async()=>{
      try{
        const symbols=['ETH','BTC','USDC','USDT'];
        const entries=await Promise.all(symbols.map(async s=>{const r=await fetch('https://api.coinbase.com/v2/exchange-rates?currency='+s);if(!r.ok)throw Error('price');const j=await r.json();return [s,Number(j?.data?.rates?.USD)] as const;}));
        if(!cancelled)setAssetUsd(Object.fromEntries(entries.filter(([,p])=>Number.isFinite(p)&&p>0)));
      }catch{}
    };
    load();const t=window.setInterval(load,30000);return()=>{cancelled=true;clearInterval(t)};
  },[]);

  useEffect(()=>{
    if(connectedForSelected){setConnecting(false);setShowFallback(false);}
  },[connectedForSelected]);

  useEffect(()=>{
    if(!connecting)return;
    const t=window.setTimeout(async()=>{setConnecting(false);setError('A ligação demorou mais de 15 segundos. Tenta novamente ou paga por QR/endereço.'); try { await preparePayment(); setShowFallback(true); } catch (e) { setShowFallback(false); await logWalletError(e instanceof Error?e.message:'Não foi possível preparar o QR','qr_fallback'); }},15000);
    return()=>clearTimeout(t);
  },[connecting]);

  const logWalletError=async(message:string,type='connection')=>{
    console.error('[TopBid wallet]',message);
    try{await supabase?.from('wallet_errors').insert({error_type:type,message,network:selected.network,wallet_address:evmAddress||solAddress||btcAddress||null,metadata:{selected:selected.id}});}catch{}
  };

  const rpcJson=async(url:string,method:string,params:any[])=>{const controller=new AbortController();const timer=window.setTimeout(()=>controller.abort(),10000);try{const r=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:Date.now(),method,params}),signal:controller.signal});const j=await r.json();if(!r.ok)throw Error('HTTP '+r.status);if(j?.error)throw Error(j.error.message||'RPC error');return j?.result;}finally{clearTimeout(timer)}};
  const solanaRpc=async(method:string,params:any[])=>{const urls=[SOLANA_RPC,...SOLANA_RPC_FALLBACKS].filter(Boolean) as string[];if(!urls.length)throw Error('VITE_SOLANA_RPC_URL não configurado.');let last='RPC Solana indisponível';for(const u of urls){try{const result=await rpcJson(u,method,params);setBalanceRpc(u);return result;}catch(e){last=e instanceof Error?e.message:String(e)}}throw Error(last)};
  const loadBalances=async()=>{const address=selected.network==='Ethereum'||selected.network==='Base'||selected.network==='BNB Chain'?evmAddress:selected.network==='Solana'?solAddress:btcAddress;if(!address){setBalances([]);setBalanceError('Carteira não ligada.');return}setBalanceLoading(true);setBalanceError('');try{let vals:string[]=[];let raw='';if(selected.network==='Bitcoin'){const urls=['https://mempool.space/api/address/'+encodeURIComponent(address),'https://blockstream.info/api/address/'+encodeURIComponent(address)];let last='';for(const u of urls){try{const r=await fetch(u,{signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('HTTP '+r.status);const j=await r.json();const funded=Number(j?.chain_stats?.funded_txo_sum||0),spent=Number(j?.chain_stats?.spent_txo_sum||0);vals=['BTC '+((funded-spent)/1e8).toFixed(8)];setBalanceRpc(u);raw=JSON.stringify(j);last='';break}catch(e){last=e instanceof Error?e.message:String(e)}}if(!vals.length)throw Error(last||'APIs Bitcoin indisponíveis');}else if(selected.network==='Solana'){if(!SOLANA_RPC)throw Error('RPC Solana dedicado não configurado.');const b=await solanaRpc('getBalance',[address,{commitment:'confirmed'}]);const owner=new PublicKey(address);const tokenResult=await solanaRpc('getTokenAccountsByOwner',[owner.toBase58(),{programId:'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'},{encoding:'jsonParsed',commitment:'confirmed'}]);const accounts=tokenResult?.value||[];const amount=accounts.filter((a:any)=>selected.token&&a?.account?.data?.parsed?.info?.mint===selected.token).reduce((s:number,a:any)=>s+Number(a?.account?.data?.parsed?.info?.tokenAmount?.uiAmount||0),0);vals=['SOL '+(Number(b?.value||0)/1e9).toFixed(5),selected.symbol+' '+amount.toFixed(4)];raw=JSON.stringify({balance:b,tokenAccounts:accounts.length});}else{const native=selected.network==='Ethereum'?ethBalance.data:selected.network==='Base'?baseBalance.data:bnbBalance.data;const tokenVals:any[]=selected.network==='Base'?[['USDC',usdcBase.data,6],['USDT',usdtBase.data,6]]:selected.network==='BNB Chain'?[['USDC',usdcBsc.data,18]]:[];const nativeName=selected.network==='BNB Chain'?'BNB':'ETH';vals=[native?nativeName+' '+Number(native.formatted).toFixed(5):native?.value===0n?nativeName+' 0.00000':''];for(const [sym,data,dec] of tokenVals)if(data!==undefined)vals.push(sym+' '+(Number(data)/10**dec).toFixed(4));vals=vals.filter(Boolean);raw=JSON.stringify({native:native?.value?.toString?.(),tokens:tokenVals.map((x:any)=>[x[0],x[1]?.toString?.()])});const selectedError=selected.network==='Ethereum'?ethBalance.error:selected.network==='Base'?(usdcBase.error||usdtBase.error||baseBalance.error):usdcBsc.error||bnbBalance.error;if(selectedError)throw selectedError;setBalanceRpc('wagmi/viem fallback transport')}setBalances(vals);setBalanceRaw(raw);setBalanceUpdatedAt(new Date().toISOString());}catch(e){const msg=e instanceof Error?e.message:'Saldo indisponível';setBalanceError(msg);setBalanceRaw('ERROR: '+msg);setBalanceUpdatedAt(new Date().toISOString());await logWalletError(msg,'balance')}finally{setBalanceLoading(false)}};
  useEffect(()=>{loadBalances()},[selected.network,selected.token,evmAddress,solAddress,btcAddress,ethBalance.data,baseBalance.data,bnbBalance.data,usdcBase.data,usdtBase.data,usdcBsc.data]);
  useEffect(()=>{const t=window.setInterval(loadBalances,15000);return()=>clearInterval(t)},[selected.network,selected.token,evmAddress,solAddress,btcAddress]);

  const disconnect=async()=>{
    try{disconnectEvm();await disconnectAppKit();}catch(e){await logWalletError(e instanceof Error?e.message:'Falha ao desligar','disconnect');}
    setBalances([]);setExpectedUnits(undefined);setPaymentState('idle');
  };

  const preparePayment=async()=>{
    const create=await fetch(SUPABASE_URL+'/functions/v1/create-order',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url,requestedTotalUsd:usdAmount,categorySlug})});
    const created=await create.json();if(!create.ok||!created?.orderId)throw Error(created?.error||'Não foi possível criar o pagamento.');
    const network=selected.network==='Ethereum'?'ethereum':selected.network==='Base'?'base':selected.network==='BNB Chain'?'bsc':selected.network==='Bitcoin'?'bitcoin':'solana';
    const instructions=await fetch(SUPABASE_URL+'/functions/v1/crypto-payment-instructions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({orderId:created.orderId,network,asset:selected.symbol})});
    const q=await instructions.json();if(!instructions.ok||!q?.expectedUnits)throw Error(q?.error||'Não foi possível obter a cotação.');
    setExpectedUnits(String(q.expectedUnits));setPaymentState('waiting');
    return {orderId:String(created.orderId),expectedUnits:String(q.expectedUnits)};
  };

  const verifyPayment=async(id:string,hash:string)=>{
    const network=selected.network==='Ethereum'?'ethereum':selected.network==='Base'?'base':selected.network==='BNB Chain'?'bsc':selected.network==='Bitcoin'?'bitcoin':'solana';
    setPaymentState('confirming');let last='O pagamento ainda não foi confirmado pela blockchain.';
    for(let attempt=0;attempt<36;attempt++){
      const r=await fetch(SUPABASE_URL+'/functions/v1/verify-crypto-payment',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({orderId:id,network,asset:selected.symbol,txHash:hash})});
      const j=await r.json();if(r.ok&&j?.ok===true){setPaymentState('confirmed');return j;}
      last=j?.error||last;if(!['INSUFFICIENT_CONFIRMATIONS','TRANSACTION_NOT_CONFIRMED','SOLANA_TRANSACTION_NOT_CONFIRMED','BTC_TRANSACTION_NOT_FOUND'].includes(last))break;
      await new Promise(resolve=>setTimeout(resolve,5000));
    }
    throw Error(last);
  };

  const watchRealtime=(orderId:string)=>{
    if(!supabase)return ()=>{};
    const channel=supabase.channel('topbid-order-'+orderId).on('postgres_changes',{event:'UPDATE',schema:'public',table:'orders',filter:'id=eq.'+orderId},payload=>{
      const status=(payload.new as any)?.status;
      if(status==='paid'){setPaymentState('confirmed');setConfirmed(true);setPaymentState('ranking');}
    }).subscribe();
    return ()=>{supabase.removeChannel(channel);};
  };

  const handleSolana=async(amount:bigint,id:string)=>{
    if(!solProvider||!solAddress){open({view:'Connect',namespace:'solana'});return;}
    const from=new PublicKey(solAddress),to=new PublicKey(SOL_RECIPIENT),latest=await solanaConnection.getLatestBlockhash('confirmed'),tx=new Transaction();
    tx.feePayer=from;tx.recentBlockhash=latest.blockhash;
    const mint=selected.token?new PublicKey(selected.token):null;
    if(!mint)tx.add(SystemProgram.transfer({fromPubkey:from,toPubkey:to,lamports:Number(amount)}));
    else{
      const source=await getAssociatedTokenAddress(mint,from),destination=await getAssociatedTokenAddress(mint,to);
      tx.add(createAssociatedTokenAccountIdempotentInstruction(from,destination,to,mint,TOKEN_PROGRAM_ID));
      tx.add(createTransferCheckedInstruction(source,mint,destination,from,Number(amount),selected.decimals,[],TOKEN_PROGRAM_ID));
    }
    const raw=tx.serialize({requireAllSignatures:false,verifySignatures:false});const base64=btoa(String.fromCharCode(...raw));
    const result=await solProvider.signAndSendTransaction({transaction:base64,pubkey:solAddress});const signature=typeof result==='string'?result:result?.signature;
    if(!signature)throw Error('A carteira não devolveu o hash da transação.');
    setTxHash(signature);setConfirming(true);
    await solanaConnection.confirmTransaction({signature,blockhash:latest.blockhash,lastValidBlockHeight:latest.lastValidBlockHeight},'confirmed');
    await verifyPayment(id,signature);setConfirming(false);setConfirmed(true);setPaymentState('ranking');onPaid(signature);
  };

  const handleBitcoin=async(amount:bigint,id:string)=>{
    if(!btcProvider||!btcAddress){open({view:'Connect',namespace:'bip122'});return;}
    const result=await btcProvider.request({method:'sendTransfer',params:{recipients:[{address:selected.recipient,amount:String(amount)}]}});const txid=result?.txid||result?.result?.txid;
    if(!txid)throw Error('A carteira não devolveu o ID da transação.');
    setTxHash(txid);setConfirming(true);
    await verifyPayment(id,txid);setConfirming(false);setConfirmed(true);setPaymentState('ranking');onPaid(txid);
  };

  const handlePay=async()=>{
    setError('');setTxHash(undefined);setConfirmed(false);setShowFallback(false);
    if(usdAmount<1)return setError('O valor mínimo é $1.');
    try{
      if(!connectedForSelected){setConnecting(true);setShowFallback(false);open({view:'Connect'});return}
      if(supportedEvm&&!selectedChainSupported){setError('Muda para '+selected.network+' para consultar/pagar nesta rede.');try{await switchChainAsync({chainId:selected.chainId!})}catch(e){await logWalletError(e instanceof Error?e.message:'Não foi possível trocar de rede','switch_chain')}return}
      const prepared=await preparePayment();const expected=BigInt(prepared.expectedUnits);const stop=watchRealtime(prepared.orderId);
      try{
        if(selected.kind==='bitcoin'){await handleBitcoin(expected,prepared.orderId);return;}
        if(selected.kind==='solSpl'||selected.kind==='solNative'){await handleSolana(expected,prepared.orderId);return;}
        await switchChainAsync({chainId:selected.chainId!});
        let hash:`0x${string}`;
        if(selected.kind==='nativeEvm')hash=await sendTransactionAsync({to:selected.recipient as Address,value:expected});
        else hash=await writeContractAsync({address:selected.token as Address,abi:ERC20_ABI,functionName:'transfer',args:[selected.recipient as Address,expected],chainId:selected.chainId});
        setTxHash(hash);setConfirming(true);await verifyPayment(prepared.orderId,hash);setConfirming(false);setConfirmed(true);setPaymentState('ranking');onPaid(hash);
      } finally {stop();}
    }catch(e){
      setConfirming(false);setPaymentState('idle');const msg=e instanceof Error?e.message:'Pagamento cancelado ou falhou.';setError(msg.length>180?msg.slice(0,177)+'...':msg);await logWalletError(msg,'payment');
    }
  };

  const fallbackUri=expectedUnits?paymentUri(selected,expectedUnits):'';
  return <div className="space-y-2">
    <div className="flex gap-2">
      <select value={selectedId} onChange={e=>setSelectedId(e.target.value as PaymentId)} disabled={busy||disabled} className="flex-1 px-3 py-3 rounded-xl bg-white border border-[#ebdcd4] text-xs font-semibold text-[#1c1917] focus:outline-none focus:border-[#e05638]">
        {PAYMENT_OPTIONS.map(o=><option key={o.id} value={o.id}>{o.label}</option>)}
      </select>
      <button type="button" onClick={handlePay} disabled={busy||disabled||usdAmount<1} className="px-4 py-3 rounded-xl bg-[#1c1917] hover:bg-black text-white font-bold text-sm disabled:opacity-50 transition-all whitespace-nowrap">
        {busy?<Loader2 className="w-4 h-4 animate-spin"/>:<Wallet className="w-4 h-4 inline mr-1.5"/>}{busy?'A processar…':'Pagar'}
      </button>
    </div>

    {connectedForSelected&&<div className="rounded-xl bg-white border border-[#ebdcd4] p-3 space-y-2">
      <div className="flex items-center justify-between gap-2 text-[11px]"><span className="font-semibold">{selected.network} · {short(selected.network==='Bitcoin'?btcAddress:selected.network==='Solana'?solAddress:evmAddress)}</span><button type="button" onClick={disconnect} className="text-[#e05638] font-bold inline-flex items-center gap-1"><Unplug className="w-3 h-3"/>Desligar</button></div>
      {supportedEvm&&!selectedChainSupported&&<button type="button" onClick={async()=>{try{await switchChainAsync({chainId:selected.chainId!})}catch(e){const m=e instanceof Error?e.message:'Falha ao trocar de rede';setError(m);await logWalletError(m,'switch_chain')}}} className="w-full rounded-lg bg-[#1c1917] text-white text-[11px] font-bold py-2">Muda para {selected.network}</button>}
      <div className="flex items-center justify-between gap-2 text-[11px] text-[#78716c]"><span>{balanceLoading?'A atualizar saldo…':balanceError?'Erro: '+balanceError:balances.length?balances.join(' · '):'Saldo indisponível'}</span><button type="button" onClick={loadBalances} className="p-1 rounded hover:bg-[#f3eae4]" title="Atualizar"><RefreshCw className="w-3 h-3"/></button></div>
      {balanceError&&<button type="button" onClick={loadBalances} className="text-[11px] text-[#e05638] font-bold underline">Tentar de novo</button>}
    </div>
    {debug&&<div className="rounded-xl bg-slate-950 text-white p-3 text-[10px] leading-4 break-all space-y-1"><div className="font-black text-xs">Diagnóstico</div><div>Carteira ligada: {connectedForSelected?'sim':'não'}</div><div>EVM: {evmAddress||'—'}</div><div>Solana: {solAddress||'—'}</div><div>Bitcoin: {btcAddress||'—'}</div><div>chainId: {chainId??'—'}</div><div>RPC: {balanceRpc||'—'}</div><div>Estado saldo: {balanceLoading?'carregando':balanceError?'erro':'ok'}</div><div>Resposta/erro: {balanceRaw||balanceError||'—'}</div><div>Última atualização: {balanceUpdatedAt||'—'}</div></div>}
    }

    <div className="text-[11px] text-[#78716c]">{assetUsd[selected.symbol]?'≈ '+(usdAmount/assetUsd[selected.symbol]).toFixed(selected.symbol==='BTC'?8:selected.symbol==='ETH'?6:4)+' '+selected.symbol:'A obter cotação…'}</div>
    {paymentState!=='idle'&&<div className="text-[11px] font-semibold text-[#57534e]">Estado: {paymentState==='waiting'?'à espera':paymentState==='confirming'?'a confirmar':paymentState==='confirmed'?'confirmado':'no ranking'}</div>}
    {txHash&&<div className="text-[11px] text-[#78716c] break-all">TX: {txHash}</div>}
    {confirmed&&<div className="flex items-center gap-2 text-[11px] text-emerald-700 font-semibold"><CheckCircle2 className="w-3.5 h-3.5"/>Pagamento confirmado pela blockchain.</div>}
    {connecting&&<div className="text-[11px] text-[#78716c]">A abrir a carteira… QR no desktop ou ligação direta no telemóvel.</div>}
    {showFallback&&fallbackUri&&<div className="rounded-2xl bg-white border border-[#ebdcd4] p-3 space-y-2">
      <div className="text-xs font-bold">Pagar por QR / endereço</div>
      <div className="flex gap-3 items-center"><img src={qrUrl(fallbackUri)} alt="QR de pagamento" className="w-28 h-28 rounded-lg border border-[#ebdcd4]"/><div className="min-w-0 text-[10px] break-all text-[#57534e]"><div className="font-semibold mb-1">{selected.recipient}</div><div>{selected.symbol} · valor exato: {expectedUnits}</div><button type="button" onClick={()=>navigator.clipboard?.writeText(selected.recipient)} className="mt-2 inline-flex items-center gap-1 text-[#e05638] font-bold"><Copy className="w-3 h-3"/>Copiar endereço</button></div></div>
    </div>}
    {error&&<div className="text-[11px] text-red-600 break-words">{error} <button type="button" onClick={()=>{setError('');setShowFallback(false);setConnecting(true);open({view:'Connect'});}} className="underline font-bold">Tentar de novo</button></div>}
  </div>;
};
