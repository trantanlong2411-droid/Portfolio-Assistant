import {Interface,formatUnits,getAddress} from 'ethers';
export const CONFIG={
 chainId:1672,rpc:'https://rpc.pharos.xyz',chain:'Pharos Pacific Mainnet',
 morpho:'0x047cd0a91e9b92ed979189a6c8a120bf280f02e5',
 centrifuge:'0x8de0f3295b9e42b29e7617bada7c603277420451',
 centrifugeVault:'0xc427d079bda79a703749da3a7b22b121b6bea603',
 walletTokens:[
  {symbol:'USDC',address:'0xc879c018db60520f4355c26ed1a6d572cdac1815'},
  {symbol:'WPROS',address:'0x52c48d4213107b20bc583832b0d951fb9ca8f0b0'},
  {symbol:'WETH',address:'0x1f4b7011Ee3d53969bb67F59428a9ec0477856E9'}
 ]
};
export const ABI=new Interface([
 'function balanceOf(address) view returns (uint256)',
 'function decimals() view returns (uint8)',
 'function symbol() view returns (string)',
 'function asset() view returns (address)',
 'function convertToAssets(uint256) view returns (uint256)'
]);
export function validateInput(body){
 if(!body||typeof body!=='object'||Array.isArray(body))throw Error('JSON object expected');
 let address;
 try{address=getAddress(String(body.address||''))}catch{throw Error('Invalid EVM wallet address')}
 const question=String(body.question||'Show my portfolio').trim().slice(0,280);
 if(question.length<3)throw Error('A question is required');
 return {address,question};
}
export function classify(q){
 const t=q.toLowerCase();
 if(/earnings?|yield|apy|apr|interest|reward|profit/.test(t))return 'earnings';
 if(/biggest|largest|most valuable|highest value|top position/.test(t))return 'biggest';
 if(/sources?|contract address|block number|verify|provenance/.test(t))return 'sources';
 if(/centrifuge|dejtrsy|treasury|rwa/.test(t))return 'centrifuge';
 if(/morpho|rockaway|vault|share|lending/.test(t))return 'morpho';
 if(/usdc|usd coin|stablecoin/.test(t))return 'usdc';
 if(/weth|wrapped eth/.test(t))return 'weth';
 if(/wpros|wrapped pros/.test(t))return 'wpros';
 if(/\bpros\b|native balance|gas token/.test(t))return 'pros';
 return 'overview';
}
function ref(contract,method,block){return {chainId:1672,block,contract,method,explorer:'https://www.pharosscan.xyz/address/'+contract}}
async function read(exec,address,method,args,block){
 try{
  const data=ABI.encodeFunctionData(method,args);
  const encoded=await exec('eth_call',[{to:address,data},'0x'+BigInt(block).toString(16)]);
  if(!encoded||encoded==='0x')throw Error('Empty contract response');
  return {ok:true,value:ABI.decodeFunctionResult(method,encoded)[0]};
 }catch(e){return {ok:false,error:String(e.message||e).slice(0,180)}}
}
async function token(exec,address,contract,label,protocol,kind,block){
 const out={label,contract,protocol,kind,available:false,source:ref(contract,'balanceOf(address)',block)};
 try{
  const code=await exec('eth_getCode',[contract,'0x'+BigInt(block).toString(16)]);
  if(!code||code==='0x'||code==='0x0')throw Error('Contract not deployed at pinned block');
  const balance=await read(exec,contract,'balanceOf',[address],block);
  const decimals=await read(exec,contract,'decimals',[],block);
  if(!balance.ok||!decimals.ok)throw Error(balance.error||decimals.error||'Contract read unavailable');
  const d=Number(decimals.value);
  if(!Number.isInteger(d)||d<0||d>36)throw Error('Unsupported decimals');
  const symbol=await read(exec,contract,'symbol',[],block);
  Object.assign(out,{available:true,raw:BigInt(balance.value).toString(),
   quantity:formatUnits(balance.value,d),decimals:d,unit:symbol.ok?String(symbol.value):label,
   decimalsSource:ref(contract,'decimals()',block),verifiedBytecode:true});
 }catch(e){out.error=String(e.message||e).slice(0,190)}
 return out;
}
export async function snapshot(address,exec,opts={}){
 const id=await exec('eth_chainId',[]);
 if(Number(BigInt(id))!==1672)throw Error('Wrong chain: expected Pharos Mainnet 1672');
 const block=BigInt(opts.block??await exec('eth_blockNumber',[])).toString();
 if(BigInt(block)<1n)throw Error('Missing latest block');
 const hex='0x'+BigInt(block).toString(16);
 const native=BigInt(await exec('eth_getBalance',[address,hex]));
 const wallet={native:{label:'Native PROS',protocol:'Wallet',contract:address,
  kind:'native',raw:native.toString(),quantity:formatUnits(native,18),decimals:18,
  unit:'PROS',available:true,source:ref(address,'eth_getBalance',block)},tokens:[]};
 for(const a of CONFIG.walletTokens)wallet.tokens.push(await token(exec,address,a.address,a.symbol,'Wallet','token',block));
 const morpho=await token(exec,address,CONFIG.morpho,'RockawayX USDC Vault V2','Morpho','vaultShares',block);
 if(morpho.available){
  const asset=await read(exec,morpho.contract,'asset',[],block);
  morpho.assetAddress=asset.ok?String(asset.value):null;
  morpho.assetSource=ref(morpho.contract,'asset()',block);
  morpho.assetStatus=asset.ok?'VERIFIED':'UNAVAILABLE';
  if(asset.ok){
   const converted=await read(exec,morpho.contract,'convertToAssets',[BigInt(morpho.raw)],block);
   const d=await read(exec,morpho.assetAddress,'decimals',[],block);
   if(converted.ok&&d.ok&&Number(d.value)<=36){
    morpho.underlyingQuantity=formatUnits(converted.value,Number(d.value));
    morpho.underlyingDecimals=Number(d.value);
    morpho.underlyingUnit=morpho.assetAddress.toLowerCase()===CONFIG.walletTokens[0].address.toLowerCase()?'USDC':'underlying token';
    morpho.underlyingSource=ref(morpho.contract,'convertToAssets(shares)',block);
   }else morpho.underlyingError=converted.error||d.error||'Conversion unavailable';
  }else morpho.underlyingError=asset.error;
 }
 const centrifuge=await token(exec,address,CONFIG.centrifuge,'deJTRSY position token','Centrifuge','fundToken',block);
 centrifuge.relatedVault=CONFIG.centrifugeVault;
 centrifuge.qualification='Direct fund token balance; not proof of an active vault deposit, withdrawable amount, or USD NAV.';
 const positions=[morpho,centrifuge];
 const coverage={protocolCount:positions.filter(x=>x.available).length,
  requested:2,verifiedWalletTokens:wallet.tokens.filter(x=>x.available).length,
  warnings:[...positions,...wallet.tokens].filter(x=>!x.available).map(x=>x.label+': '+x.error)};
 return {schema:'portfolio-assistant-v1',chainId:1672,network:CONFIG.chain,
  address,block,observedAt:opts.when||new Date().toISOString(),
  wallet,positions,coverage,
  noPrices:true,noApy:true,transactionBroadcast:false,readOnly:true,
  disclaimer:'No USD valuation, earned yield, cost basis or historical APR is inferred. Direct Centrifuge token holding is not a vault deposit.'};
}
function display(x){return x.available?x.quantity+' '+x.unit:'Unavailable: '+x.error}
export function answer(data,question){
 const type=classify(question),w=data.wallet,m=data.positions[0],c=data.positions[1];
 const get=label=>w.tokens.find(t=>t.label===label);
 let message='',items=[];
 function add(x,label,field='quantity'){
  if(x&&x.available&&x[field]!=null){
   items.push({label:label||x.label,value:String(x[field]),
    unit:field==='underlyingQuantity'?x.underlyingUnit:x.unit,
    source:field==='underlyingQuantity'?x.underlyingSource:x.source});
  }
 }
 switch(type){
 case 'earnings':
  message='Verified earnings, APY and unrealized profit are unavailable. Current balances alone cannot establish rewards, historic deposits, withdrawals or purchase cost. I cannot guess a yield.';break;
 case 'biggest':
  message='I cannot rank the largest position by USD without verified prices/NAV for the vault and fund token. Raw token counts are not comparable valuations.';break;
 case 'centrifuge':
  message='Centrifuge direct deJTRSY token holding: '+display(c)+'. This is not proof of a deposited balance in a separate vault or a redeemable dollar value.';add(c);break;
 case 'morpho':
  message='Morpho RockawayX vault shares: '+display(m)+'. '+(m.underlyingQuantity!=null?
   'convertToAssets returns '+m.underlyingQuantity+' '+m.underlyingUnit+' in underlying token units; immediate liquidity is not verified.':
   'Asset conversion unavailable; its underlying value is unknown.');add(m);add(m,'Morpho underlying equivalent','underlyingQuantity');break;
 case 'usdc':
  message='Wallet USDC: '+display(get('USDC'))+'. '+(m.underlyingUnit==='USDC'&&m.underlyingQuantity!=null?
   'Morpho underlying USDC equivalent: '+m.underlyingQuantity+' USDC (not direct wallet balance or guaranteed redeemable amount).':
   'Morpho USDC exposure cannot be confirmed; no guessed total is shown.');
  add(get('USDC'));if(m.underlyingUnit==='USDC')add(m,'Morpho USDC equivalent','underlyingQuantity');break;
 case 'weth':message='Direct wallet WETH: '+display(get('WETH'))+'. This excludes untracked pooled positions.';add(get('WETH'));break;
 case 'wpros':message='Direct wallet WPROS: '+display(get('WPROS'))+'. It is distinct from native PROS.';add(get('WPROS'));break;
 case 'pros':message='Native PROS: '+display(w.native)+'. Wrapped PROS: '+display(get('WPROS'))+'. They are reported separately.';add(w.native);add(get('WPROS'));break;
 case 'sources':
  message='Every verified amount was read on Pharos mainnet at block '+data.block+'. Individual method, contract address and chain appear next to each number; unreadable fields remain unavailable.';[w.native,...w.tokens,...data.positions].forEach(x=>add(x));break;
 default:
  message='I checked native PROS, USDC, WPROS, WETH, Morpho RockawayX vault shares and Centrifuge deJTRSY token holdings. Morpho: '+display(m)+'. Centrifuge: '+display(c)+'. Native: '+display(w.native)+'. USD portfolio total and earnings remain unknown without pricing/history.';[w.native,...w.tokens,...data.positions].forEach(x=>add(x));
 }
 return {question,type,message,facts:items,block:data.block,
  uncertainty:'Yield, valuation and unsupported protocols are reported unknown, never guessed.',
  transactionBroadcast:false};
}
