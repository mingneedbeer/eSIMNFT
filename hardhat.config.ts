import { defineConfig } from "hardhat/config";
import hardhatToolboxViem from "@nomicfoundation/hardhat-toolbox-viem";
import "dotenv/config";

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

export default defineConfig({
  plugins: [hardhatToolboxViem],
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    hardhat: {
      type: "edr-simulated",
      chainId: 31337,
    },
    localhost: {
      type: "http",
      url: "http://127.0.0.1:8545",
      chainId: 31337,
      accounts: ["0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"],
    },
    abstractTestnet: {
      type: "http",
      url: "https://api.testnet.abs.xyz",
      chainId: 11124,
      accounts: [PRIVATE_KEY],
    },
    abstract: {
      type: "http",
      url: "https://api.mainnet.abs.xyz",
      chainId: 2741,
      accounts: [PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: {
      abstractTestnet: process.env.ABSCAN_API_KEY || "",
      abstract: process.env.ABSCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "abstractTestnet",
        chainId: 11124,
        urls: {
          apiURL: "https://api-sepolia.abscan.org/api",
          browserURL: "https://sepolia.abscan.org",
        },
      },
      {
        network: "abstract",
        chainId: 2741,
        urls: {
          apiURL: "https://api.abscan.org/api",
          browserURL: "https://abscan.org",
        },
      },
    ],
  },
});
