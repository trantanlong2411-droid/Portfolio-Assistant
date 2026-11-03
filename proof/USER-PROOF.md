# Portfolio Assistant — user-exported on-chain snapshot and question proof

This is the original browser-exported JSON the user supplied on **3 November 2026**. It contains a single live Portfolio Assistant query with all on-chain snapshot readings and the question **"What is my biggest position?"**.

- [Original exported JSON](./user-portfolio-export-2026-11-03.json)
- [Reproducible checker](../scripts/verify-user-proof.mjs)
- [Public demo](https://portfolio-assistant.trantanlong2411.workers.dev/)
- [Previous successful independent live integration run](https://github.com/trantanlong2411-droid/Portfolio-Assistant/actions/runs/41606214252)
- Uploaded original file SHA-256: d2e5f0c32980cf23af0d03b58239405bdc6cdeb7de1a0a86b66ef465a1c7fac7

## Exported state

- Network: Pharos Pacific Mainnet, Chain ID 1672
- Single pinned block: 22004613
- UTC observation: 2026-11-03T10:20:24.592Z
- Wallet: 0x74B2c2E4E4B771F0C75dcE44f40787468E323f79
- Sources and contracts: six account / contract reads in the same block

| Holding | Source | Read result |
| --- | --- | --- |
| Native wallet PROS | eth_getBalance, sample wallet | 0.0 PROS |
| Wallet USDC | 0xc879c018db60520f4355c26ed1a6d572cdac1815 | 0.0 USDC |
| Wallet WPROS | 0x52c48d4213107b20bc583832b0d951fb9ca8f0b0 | 0.0 WPROS |
| Wallet WETH | 0x1f4b7011Ee3d53969bb67F59428a9ec0477856E9 | 0.0 WETH |
| Morpho / RockawayX USDC Vault V2 | 0x047cd0a91e9b92ed979189a6c8a120bf280f02e5 | 0.0 roxUSDC shares |
| Centrifuge | 0x8de0f3295b9e42b29e7617bada7c603277420451 | 0.0 deJTRSY directly held fund tokens |

The original file explicitly shows available: true for both protocol balances and each wallet ERC20 balance, verified bytecode, decimals and source block. Morpho's asset() and convertToAssets(shares) were also read, returning 0.0 USDC equivalent for zero vault shares.

A real zero balance is not proof of a funded portfolio, but it proves the attempted contract reading produced a valid zero. The Centrifuge fund-token balance is not proof of an actual deposit in a separate vault.

## Why the assistant did not name the biggest position

The question was "What is my biggest position?". The app reported:

> I cannot rank the largest position by USD without verified prices/NAV for the vault and fund token. Raw token counts are not comparable valuations.

The answer has no invented USD value, no unjustified numerical rankings and zero numerical facts. This satisfies the requirement to declare missing portfolio valuation data rather than guessing it.

The JSON records readOnly: true and transactionBroadcast: false. The repository's RPC whitelist contains no transaction-broadcast or signature methods.

## Verification and caveats

The CI checker re-runs the same answer engine against the exported snapshot, checks exact contract provenance and block for all six balances, and exercises 10 distinct question patterns against those same values. This replay verifies application consistency, **not** 10 independently submitted on-chain queries. Prior separate deployed Worker integration tests verify real RPC access, contract availability and the 10 question patterns.

This export can support the task's requirements for two readable protocol holdings/contracts, wallet balances, block+contract sources, explicit unknowns and read-only operation. It does not demonstrate positive balance, verified yield, a live USD valuation or a staked Centrifuge vault position, and should not be described as doing so.

## Reviewer walkthrough

Open the [public website](https://portfolio-assistant.trantanlong2411.workers.dev/), try the provided sample address or any public Pharos wallet, ask at least five of the suggested questions, inspect **Numbers and their chain sources** and export JSON proof. To inspect independent deployed integration evidence, visit the [successful GitHub Actions run](https://github.com/trantanlong2411-droid/Portfolio-Assistant/actions/runs/41606214252).
