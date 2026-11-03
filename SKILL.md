---
name: pharos-portfolio-assistant
description: Read Pharos mainnet wallet balances and two distinct protocol position-token contracts, then answer natural-language portfolio questions with contract, method and pinned block; explicitly refuse unverifiable yields and USD totals.
---
# Portfolio Assistant

1. Accept a public EVM wallet and a natural-language question. Never require a signature, wallet connection or secret key.
2. Verify Pharos Mainnet chain ID 1672 and pin the latest block for every read in one request.
3. Read native PROS, USDC, WPROS, WETH and two protocol contract positions: Morpho RockawayX vault share balance and Centrifuge deJTRSY direct fund token balance.
4. Verify deployed bytecode and decimals for each ERC20 call; each supported number must include contract, method, source block and unit. A contract failure means unavailable, not 0.
5. Where supported, separately convert Morpho vault shares into underlying token units with convertToAssets and confirm asset() address. Do not assume redemption liquidity.
6. Classify questions including overview, USDC whereabouts, Morpho, Centrifuge, native PROS, WETH, WPROS, biggest holding, earnings and sources. Return a sourced answer.
7. Missing USD NAV, prices or historical cash flows must yield an explicit 'cannot determine'; do not invent earnings, USD totals or yield.
8. Respond through POST /api/ask; export the complete JSON with sources and warnings. Never invoke any signing or transaction RPC method.

Direct Centrifuge fund token balance is distinct from a specific vault deposit. This application does not infer deposits, rewards, lending obligations or market prices from an ERC20 balance.
