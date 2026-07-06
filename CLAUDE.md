# eSIM NFT Project

## Commands
- `bun run compile` — Compile Solidity contracts
- `bun run test` — Run Hardhat tests (uses `hardhat test` under the hood)
- `bun run deploy:testnet` — Deploy to Abstract Sepolia Testnet
- `bun run deploy:mainnet` — Deploy to Abstract Mainnet
- `bun run backend list-plans` — List available eSIM plans
- `bun run backend mint <planId> <address>` — Mint an eSIM NFT
- `bun run backend activate <tokenId> <address>` — Activate an eSIM

## Conventions
- Use `bun` instead of `node`, `npm`, `npx`, or `ts-node`
- Solidity: 0.8.28, OpenZeppelin v5, ERC-721 + Enumerable
- Network: Abstract Chain (testnet chainId: 11124, mainnet: 2741)
- Use `hardhat-viem` (not `hardhat-ethers`) for all interactions
- Backend scripts import compiled ABI from `artifacts/`
- Environment variables in `.env` (bun auto-loads `.env`)

## Project Structure
- `contracts/` — Solidity smart contracts
- `test/` — Hardhat tests (using viem)
- `scripts/` — Hardhat deployment scripts
- `backend/` — Standalone eSIM provider integration scripts
- `backend/providers/` — eSIM provider interface + implementations

## Architecture
1. Platform mints NFTs representing eSIM plans (country, data, validity)
2. NFTs are tradeable on OpenSea (standard ERC-721) when unactivated
3. Buyer activates the eSIM on the platform → NFT becomes non-transferable
4. Activation is marked on-chain; the actual eSIM profile is delivered off-chain
