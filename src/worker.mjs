import {validateInput,snapshot,answer,CONFIG} from './portfolio.mjs';
import {HTML} from './page.mjs';
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{
 'content-type':'application/json;charset=utf-8','cache-control':'no-store',
 'x-content-type-options':'nosniff'}});
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let counter=0;
async function rpc(method,params=[]){
 // Explicit read-only whitelist: no transactions, signing, tracing or debug calls.
 if(!['eth_chainId','eth_blockNumber','eth_getBalance','eth_getCode','eth_call'].includes(method))
  throw Error('RPC method blocked by read-only policy: '+method);
 let failure;
 for(let attempt=0;attempt<3;attempt++){
  try{
   const id=++counter;
   const r=await fetch(CONFIG.rpc,{
    method:'POST',headers:{'content-type':'application/json','accept':'application/json'},
    body:JSON.stringify({jsonrpc:'2.0',id,method,params}),
    signal:AbortSignal.timeout(16000)});
   if(!r.ok)throw Error('Pharos RPC HTTP '+r.status);
   const x=await r.json();
   if(x.id!==id||x.jsonrpc!=='2.0'||typeof x!=='object')throw Error('Invalid RPC response');
   if(x.error)throw Error(method+': '+String(x.error.message||'unknown error'));
   if(x.result==null)throw Error(method+' returned no result');
   return x.result;
  }catch(e){
   failure=e;if(attempt<2)await pause(650*(attempt+1));
  }
 }
 throw Error(String(failure?.message||failure||'RPC unavailable').slice(0,230));
}
export default{
 async fetch(req){
  const url=new URL(req.url);
  if(req.method==='GET'&&url.pathname==='/')return new Response(HTML,{headers:{
   'content-type':'text/html;charset=utf-8','cache-control':'no-store',
   'x-content-type-options':'nosniff'}});
  if(req.method==='GET'&&url.pathname==='/api/health')
   return json({ok:true,service:'portfolio-assistant',chainId:1672,
    readOnly:true,transactionsEnabled:false,protocols:['Morpho','Centrifuge'],
    note:'Health is not proof of live RPC/protocol accessibility'});
  if(req.method!=='POST'||url.pathname!=='/api/ask')return json({ok:false,error:'Not found'},404);
  let input;
  try{
   if(Number(req.headers.get('content-length')||0)>4096)throw Error('Request too large');
   const raw=await req.text();
   if(raw.length>4096)throw Error('Request too large');
   input=validateInput(JSON.parse(raw));
  }catch(e){return json({ok:false,decision:'NO_READ',error:String(e.message||e)},400)}
  try{
   const state=await snapshot(input.address,rpc);
   const result=answer(state,input.question);
   return json({ok:true,mode:'LIVE_PHAROS_RPC_READ_ONLY',snapshot:state,answer:result,
    request:input,transactionBroadcast:false,
    auditedAt:new Date().toISOString()});
  }catch(e){return json({ok:false,decision:'RPC_UNAVAILABLE_NO_FACTS',
   error:String(e.message||e).slice(0,300),
   transactionBroadcast:false},502)}
 }
};