import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {answer,CONFIG} from '../src/portfolio.mjs';
const base=(process.env.PORTFOLIO_URL||'https://portfolio-assistant.trantanlong2411.workers.dev').replace(/\/$/,'');
const wallet=process.env.TEST_WALLET||'0x74B2c2E4E4B771F0C75dcE44f40787468E323f79';
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function req(path,payload){
 const r=await fetch(base+path,{method:payload?'POST':'GET',
  headers:payload?{'content-type':'application/json'}:{},
  body:payload?JSON.stringify(payload):undefined,signal:AbortSignal.timeout(120000)});
 const raw=await r.text();let val;
 try{val=JSON.parse(raw)}catch{throw Error(path+' non-JSON HTTP '+r.status+': '+raw.slice(0,150))}
 if(!r.ok||!val.ok)throw Error(path+' HTTP '+r.status+': '+JSON.stringify(val).slice(0,420));
 return val;
}
let health;
for(let i=0;i<20;i++){
 try{health=await req('/api/health');if(health.service==='portfolio-assistant')break}
 catch(e){console.log('HEALTH WAIT',i+1,String(e.message).slice(0,180))}
 await pause(4800);
}
assert.equal(health?.chainId,1672,'Worker has not deployed expected code');
assert.equal(health?.transactionsEnabled,false);
let body,err;
for(let i=0;i<4;i++){
 try{body=await req('/api/ask',{address:wallet,question:'Show my portfolio'});break}
 catch(e){err=e;console.log('LIVE RPC RETRY',i+1,String(e.message).slice(0,420));if(i<3)await pause(12000)}
}
if(!body)throw Error('Live Pharos RPC unavailable: '+err?.message);
const s=body.snapshot;
assert.equal(body.mode,'LIVE_PHAROS_RPC_READ_ONLY');assert.equal(s.chainId,1672);
assert.equal(body.transactionBroadcast,false);
assert.ok(BigInt(s.block)>0n);
assert.equal(s.wallet.native.source.block,s.block);
assert.equal(s.positions.length,2);
assert.equal(s.positions[0].contract,CONFIG.morpho);
assert.equal(s.positions[1].contract,CONFIG.centrifuge);
assert.equal(s.positions[1].relatedVault,CONFIG.centrifugeVault);
assert.equal(s.wallet.tokens.length,3);
for(const t of s.wallet.tokens.filter(x=>x.available)){
 assert.equal(t.source.block,s.block);
 assert.equal(t.source.method,'balanceOf(address)');
}
for(const position of s.positions){
 assert.equal(position.source.block,s.block);
 assert.equal(position.source.method,'balanceOf(address)');
 console.log('LIVE PROTOCOL READ',JSON.stringify({protocol:position.protocol,contract:position.contract,
  available:position.available,quantity:position.quantity??null,error:position.error??null}));
}
for(const q of [
 'Show my portfolio','Where is my USDC?','Show my Morpho vault shares',
 'How much deJTRSY do I hold?','How much WETH?','How much WPROS?',
 'How much native PROS?','What am I earning?','What is my biggest position?',
 'Show the sources'
]){
 const r=answer(s,q);assert.ok(r.message);
 assert.equal(r.block,s.block);assert.equal(r.transactionBroadcast,false);
 for(const f of r.facts){
  assert.equal(f.source.block,s.block);
  assert.ok(f.source.contract);assert.ok(f.source.method);
 }
 console.log('VERIFIED QUESTION',JSON.stringify({type:r.type,question:q,facts:r.facts.length,answer:r.message.slice(0,160)}));
}
assert.match(answer(s,'What is my biggest position?').message,/cannot rank/i);
assert.match(answer(s,'How much yield am I earning?').message,/unavailable/i);
assert.equal(s.coverage.protocolCount,2,
 'To claim the 200-point cross-protocol criterion, both protocol contracts must be readable; see logged reasons');
await mkdir('proof',{recursive:true});
await writeFile('proof/live-portfolio-evidence.json',JSON.stringify({
 schema:'pharos-portfolio-live-proof-v1',validatedAt:new Date().toISOString(),
 website:base,source:'Actual Pharos Mainnet JSON-RPC; no mocked contract responses',
 testedWallet:wallet,readOnly:true,transactionBroadcast:false,
 sourceMethods:['eth_chainId','eth_blockNumber','eth_getBalance','eth_getCode','eth_call'],
 evidence:body,
 testedQuestionTypes:['overview','usdc','morpho','centrifuge','weth','wpros','pros','earnings','biggest','sources']
},null,2)+'\n');
console.log('PORTFOLIO ASSISTANT LIVE PROOF SUCCESS',JSON.stringify({
 block:s.block,protocols:s.coverage.protocolCount,walletTokens:s.coverage.verifiedWalletTokens,
 noTransactions:true,proof:'proof/live-portfolio-evidence.json'}));
