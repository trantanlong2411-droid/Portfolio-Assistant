import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {answer} from '../src/portfolio.mjs';
const uploaded=JSON.parse(await readFile(new URL('../proof/user-portfolio-export-2026-11-03.json',import.meta.url),'utf8'));
assert.equal(uploaded.ok,true);
assert.equal(uploaded.mode,'LIVE_PHAROS_RPC_READ_ONLY');
const state=uploaded.snapshot;
assert.equal(state.chainId,1672);
assert.equal(state.block,'22004613');
assert.equal(state.network,'Pharos Pacific Mainnet');
assert.equal(state.coverage.protocolCount,2);
assert.equal(state.coverage.requested,2);
assert.equal(state.coverage.verifiedWalletTokens,3);
assert.equal(state.wallet.tokens.length,3);
assert.deepEqual(state.positions.map(x=>x.protocol),['Morpho','Centrifuge']);
assert.deepEqual(state.positions.map(x=>x.unit),['roxUSDC','deJTRSY']);
assert.equal(state.wallet.native.source.block,state.block);
assert.ok(state.positions.every(x=>x.available&&x.verifiedBytecode&&x.source.block===state.block));
assert.ok(state.wallet.tokens.every(x=>x.available&&x.verifiedBytecode&&x.source.block===state.block));
assert.ok(state.positions.concat(state.wallet.tokens).every(x=>x.raw==='0'));
assert.equal(state.wallet.native.raw,'0');
assert.equal(state.positions[0].underlyingQuantity,'0.0');
assert.equal(state.positions[0].assetStatus,'VERIFIED');
assert.equal(state.positions[1].qualification.includes('not proof'),true);
assert.equal(state.readOnly,true);
assert.equal(state.transactionBroadcast,false);
assert.equal(uploaded.transactionBroadcast,false);
assert.equal(uploaded.answer.transactionBroadcast,false);
assert.equal(uploaded.request.question,'What is my biggest position?');
assert.equal(uploaded.answer.type,'biggest');
assert.equal(uploaded.answer.block,state.block);
assert.deepEqual(uploaded.answer.facts,[]);
assert.match(uploaded.answer.message,/cannot rank the largest position by USD/i);
assert.match(uploaded.answer.message,/without verified prices/i);
assert.deepEqual(answer(state,uploaded.request.question),uploaded.answer);
for(const item of [state.wallet.native,...state.wallet.tokens,...state.positions]){
 assert.ok(item.source.contract);
 assert.equal(item.source.block,state.block);
 assert.ok(['eth_getBalance','balanceOf(address)'].includes(item.source.method));
}
for(const question of [
 'Show my portfolio','Where is my USDC?','What is my Morpho position?',
 'How much deJTRSY do I have?','Show my WETH','Show my WPROS',
 'How much native PROS?','What am I earning?','What is my biggest position?',
 'Show sources and block number'
]){
 const r=answer(state,question);
 assert.ok(r.message);
 assert.equal(r.block,state.block);
 assert.equal(r.transactionBroadcast,false);
 for(const fact of r.facts){
  assert.equal(fact.source.block,state.block);
  assert.ok(fact.source.method);
  assert.ok(fact.source.contract);
 }
}
console.log('USER PORTFOLIO EXPORT VERIFIED',JSON.stringify({
 observedAt:state.observedAt,block:state.block,
 protocols:state.coverage.protocolCount,
 tokenReads:state.coverage.verifiedWalletTokens,
 intent:uploaded.answer.type,correctlyUnknownUSD:true,transactionBroadcast:false,
 questionsReplayed:10
}));
