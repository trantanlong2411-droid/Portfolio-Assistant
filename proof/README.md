# Portfolio Assistant — verified Pharos Mainnet proof

[Additional original user-exported single-query evidence (block 22004613)](./USER-PROOF.md).

Verified 03 November 2026 using a live public Cloudflare Worker on Pharos mainnet chain ID 1672.

- [Open the website](https://portfolio-assistant.trantanlong2411.workers.dev/)
- [GitHub Actions run 41605763153: full proof artifact and logs](https://github.com/trantanlong2411-droid/Portfolio-Assistant/actions/runs/41605763153)
- [Compact verified JSON summary](./verified-run.json)
- [Source implementation and data scope](../README.md)

## Verified contracts and actual balances

All values were read at pinned block **21999193** from the public sample wallet address 0x74B2c2E4E4B771F0C75dcE44f40787468E323f79.

| Source | Contract address | Verified result |
| --- | --- | --- |
| RockawayX Morpho V2 vault shares | 0x047cd0a91e9b92ed979189a6c8a120bf280f02e5 | 0.0 roxUSDC |
| Centrifuge deJTRSY position token | 0x8de0f3295b9e42b29e7617bada7c603277420451 | 0.0 deJTRSY |
| Native PROS | Sample wallet | 0.0 PROS |
| Wallet USDC | 0xc879c018db60520f4355c26ed1a6d572cdac1815 | 0.0 USDC |
| Wallet WPROS | 0x52c48d4213107b20bc583832b0d951fb9ca8f0b0 | 0.0 WPROS |
| Wallet WETH | 0x1f4b7011Ee3d53969bb67F59428a9ec0477856E9 | 0.0 WETH |

These were actual zero balances read from live mainnet, not fabricated demo deposits. Both protocol token contracts were deployed and their balanceOf method responded. Centrifuge deJTRSY represents directly held tokenized fund tokens; it does NOT prove a separate vault deposit or redeemable USD amount.

## Task requirements demonstrated

| Task requirement | Live evidence |
| --- | --- |
| Two protocols or vaults, plus wallet balances | Morpho RockawayX vault share balance and Centrifuge direct deJTRSY token position, plus PROS, USDC, WPROS, WETH |
| Five or more natural-language question types | Ten intents tested: overview, USDC, Morpho, Centrifuge, WETH, WPROS, PROS, earnings, biggest, sources |
| Contract and block source for each number | Every returned numeric fact includes source contract, RPC/ABI method, chain ID, block 21999193 |
| Clear unknown instead of guessing | No APY or historical earnings inferred; largest position by USD is unknown without verified prices |
| Fully read-only | No signing or transaction broadcasting; limited to allowed read RPC methods |

## How to demonstrate

Open the app, enter any public Pharos EVM address, and ask the sample questions. The response shows contract and block source for each verified number. Expand the raw JSON and export the full evidence file.

The GitHub Actions run verified 8/8 automated tests, all ten question patterns, the two live protocol contract reads, all three wallet tokens and a successful Cloudflare Worker build. The raw source-rich JSON is downloadable as the pharos-portfolio-assistant-live-proof workflow artifact (30-day retention).

## Technical caveats

This is a scoped on-chain position and token holdings assistant, not a complete DeFi portfolio valuation service. No reliable historical cost basis, deposits, APR, current USD token prices or fund NAV feeds are included, so yield and dollar rankings are deliberately labeled unknown. A sample address with zero holdings still demonstrates legitimate contract reads. No wallet keys or real transactions are used.
