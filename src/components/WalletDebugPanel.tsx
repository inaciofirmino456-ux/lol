import React from 'react';

type Props={debug:boolean;connected:boolean;evmAddress?:string|null;solAddress?:string|null;btcAddress?:string|null;chainId?:number;rpc:string;loading:boolean;error:string;raw:string;updatedAt:string};

export const WalletDebugPanel:React.FC<Props>=({debug,connected,evmAddress,solAddress,btcAddress,chainId,rpc,loading,error,raw,updatedAt})=>{
  if(!debug)return null;
  const status=loading?'carregando':error?'erro':'ok';
  return <div className="rounded-xl bg-slate-950 text-white p-3 text-[10px] leading-4 break-all space-y-1">
    <div className="font-black text-xs">Diagnóstico</div>
    <div>Carteira ligada: {connected?'sim':'não'}</div>
    <div>EVM: {evmAddress||'—'}</div>
    <div>Solana: {solAddress||'—'}</div>
    <div>Bitcoin: {btcAddress||'—'}</div>
    <div>chainId: {chainId??'—'}</div>
    <div>RPC: {rpc||'—'}</div>
    <div>Estado saldo: {status}</div>
    <div>Resposta/erro: {raw||error||'—'}</div>
    <div>Última atualização: {updatedAt||'—'}</div>
  </div>;
};
