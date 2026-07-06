# eSIM NFT — Transferable Voucher System

## Overview

A blockchain-based eSIM voucher marketplace. NFTs represent genuine eSIM entitlements from travel eSIM providers (Airalo, Holafly, etc.). Each NFT encodes the plan details (country, data, validity) on-chain. Unactivated NFTs trade freely on OpenSea. The buyer activates the eSIM on the platform, which locks the NFT and delivers the eSIM profile off-chain.

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  eSIM API   │────▶│   Platform   │────▶│  Smart      │
│  (Airalo)   │     │  (Backend)   │     │  Contract   │
└─────────────┘     └──────────────┘     └─────────────┘
                          │                      │
                          ▼                      ▼
                    ┌──────────────┐     ┌─────────────┐
                    │  Metadata    │     │  OpenSea    │
                    │  API (Vercel)│     │  (Trade)    │
                    └──────────────┘     └─────────────┘
```

---

## Architecture

### Smart Contract (`contracts/ESIMNFT.sol`)

| Feature | Detail |
|---------|--------|
| Standard | ERC-721 + Enumerable (OpenZeppelin v5) |
| Network | Abstract Chain (testnet `11124`, mainnet `2741`) |
| Mint | Owner-only, stores provider, planId, country, data, validity |
| Activate | Token owner marks as used → becomes non-transferable |
| Operators | Platform can activate gaslessly on user's behalf |
| EIP-712 | `activateWithPermit` — user signs, platform submits |
| Burn | Owner can burn activated tokens |

### Lifecycle

```
                  ┌──────────┐
                  │  Mint    │  Platform buys eSIM plan → mints NFT
                  └────┬─────┘
                       │
                  ┌────▼─────┐
                  │  List    │  Listed on OpenSea at cost + margin
                  └────┬─────┘
                       │
                  ┌────▼─────┐
                  │  Buy     │  Buyer purchases via OpenSea
                  └────┬─────┘
                       │
                  ┌────▼─────┐
                  │Activate  │  Buyer activates on platform
                  └────┬─────┘   → contract marks activated
                       │         → provider delivers profile
                  ┌────▼─────┐
                  │  Use     │  Install eSIM profile on phone
                  └──────────┘
```

### Backend (`backend/`)

```
backend/
├── providers/
│   ├── IESIMProvider.ts     # Abstract interface
│   └── MockProvider.ts      # 4 sample plans (JP, US, DE, Global)
├── clients.ts               # viem clients for Abstract
└── index.ts                 # CLI: list-plans / mint / activate
```

### Metadata API (`api/`)

Vercel serverless function reading live on-chain data:

```
GET /api/metadata/{tokenId}
→ {
    name: "Transferable eSIM Voucher #2",
    description: "Japan eSIM — 1 GB for 7 days via Airalo",
    image: "data:image/svg+xml;base64,...",
    attributes: [
      { trait_type: "Country", value: "Japan" },
      { trait_type: "Data", value: "1 GB" },
      { trait_type: "Status", value: "Activated" },
      ...
    ]
  }
```

---

## Deployment

| Instance | Chain ID | Contract Address |
|----------|----------|-----------------|
| Abstract Sepolia Testnet | `11124` | [`0x876fdcbd21401ad13778de574ef7533ed603983d`](https://sepolia.abscan.org/address/0x876fdcbd21401ad13778de574ef7533ed603983d) |
| Metadata API | — | [`https://esim-nft-metadata.vercel.app`](https://esim-nft-metadata.vercel.app/api/metadata/2) |

Contract verified on Sourcify: https://sourcify.dev/server/repo-ui/11124/0x876fdcbd21401ad13778de574ef7533ed603983d

---

## Local Development

```bash
bun install           # Install dependencies
bun run compile       # Compile Solidity
bun run test          # Run 13 test cases
bun run backend list-plans   # View eSIM plans

# Deploy to Abstract testnet
bun run deploy:testnet
```

---

## Commands

| Command | Description |
|---------|-------------|
| `bun run compile` | Compile contracts |
| `bun run test` | Run tests (Hardhat v3 + node:test) |
| `bun run deploy:testnet` | Deploy to Abstract Sepolia |
| `bun run backend list-plans` | List eSIM plans |
| `bun run backend mint <planId> <addr>` | Mint an NFT |
| `bun run backend activate <tokenId> <addr>` | Activate eSIM |

---

## Test Results

```
13 passing (13 nodejs)

ESIMNFT
  ✔ Deployment (name, symbol, owner)
  ✔ Minting (plan data, non-owner rejection)
  ✔ Activation (activate, non-owner, double-activate)
  ✔ Transfer (unactivated OK, activated blocked)
  ✔ Operator role (operator activate, non-operator)
  ✔ Burning
  ✔ TokenURI
```

---

## Tech Stack

- **Solidity** 0.8.28 + OpenZeppelin v5
- **Hardhat** v3 + `hardhat-toolbox-viem`
- **viem** for contract interactions
- **bun** as package manager / runtime
- **Vercel** serverless functions for metadata API
- **Abstract Chain** (ZKsync-based L2)
