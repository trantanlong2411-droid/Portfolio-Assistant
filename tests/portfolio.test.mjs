import test from 'node:test';import assert from 'node:assert/strict';
import {ABI,CONFIG,validateInput,classify,snapshot,answer} from '../src/portfolio.mjs';
const wallet='0x74B2c2E4E4B771F0C75dcE44f40787468E323f79';
const rpc=async(method,params)=>{
 if(method==='eth_chainId')return '0x688';
 if(method==='eth_blockNumber')return '0x100';
 if(method==='eth_getBalance')return '0xde0b6b3a7640000';
 if(method==='eth_getCode')return '0x6000';
 if(method==='eth_call'){
  const a=ABI.parseTransaction({data:params[0].data}),name=a.name;
  if(name==='balanceOf')return ABI.encodeFunctionResult(name,[1000000000000000000n]);
  if(name==='decimals')return ABI.encodeFunctionResult(name,[18]);
  if(name==='symbol')return ABI.encodeFunctionResult(name,['SHARE']);
  if(name==='asset')return ABI.encodeFunctionResult(name,[CONFIG.walletTokens[0].address]);
  if(name==='convertToAssets')return ABI.encodeFunctionResult(name,[1000000n]);
 }
 throw Error('Unexpected '+method);
};
test('input rejects malformed addresses',()=>{assert.throws(()=>validateInput({address:'bad'}),/Invalid EVM/);assert.ok(validateInput({address:wallet}).address)});
test('nine natural-language intents',()=>{
 const q=['What am I earning?','My biggest position','Show contract sources','Do I have deJTRSY?',
  'Show Morpho vault','Where is my USDC?','My WETH balance','Wrapped WPROS balance','Native PROS balance'];
 assert.deepEqual(q.map(classify),['earnings','biggest','sources','centrifuge','morpho','usdc','weth','wpros','pros']);
});
test('at least two actual protocol contract reads and wallet values on one block',async()=>{
 const s=await snapshot(wallet,rpc);assert.equal(s.chainId,1672);assert.equal(s.block,'256');
 assert.equal(s.coverage.protocolCount,2);assert.equal(s.coverage.verifiedWalletTokens,3);
 assert.equal(s.positions[0].source.block,'256');assert.equal(s.positions[1].source.block,'256');
 assert.equal(s.wallet.native.quantity,'1.0');assert.equal(s.transactionBroadcast,false);
});
test('five plus question types have supported numeric facts with source',async()=>{
 const s=await snapshot(wallet,rpc);
 for(const q of ['show portfolio','where is my USDC','Morpho shares','Centrifuge',
 'show WETH','show WPROS','native PROS','show sources']){
  const a=answer(s,q);assert.ok(a.message);
  for(const f of a.facts){assert.equal(f.source.block,'256');assert.ok(f.source.method)}
 }
 assert.match(answer(s,'What APY am I earning?').message,/unavailable/);
 assert.match(answer(s,'Biggest position?').message,/cannot rank/);
});
test('unreadable protocol is marked unavailable rather than zero',async()=>{
 const broken=async(method,params)=>{
  if(method==='eth_getCode'&&params[0]===CONFIG.centrifuge)return '0x';
  return rpc(method,params);
 };
 const s=await snapshot(wallet,broken);
 assert.equal(s.coverage.protocolCount,1);assert.equal(s.positions[1].available,false);
 assert.match(answer(s,'Centrifuge holdings').message,/Unavailable/);
});
test('wrong network is rejected',async()=>{
 await assert.rejects(snapshot(wallet,(m,p)=>m==='eth_chainId'?'0x1':rpc(m,p)),/Wrong chain/);
});
