import { defineConfig } from "hardhat/config";
import hardhatToolboxViem from "@nomicfoundation/hardhat-toolbox-viem";
import "dotenv/config";

const PRIVATE_KEY = process.env.PRIVATE_KEY;
if (!PRIVATE_KEY) {
  console.warn("WARNING: PRIVATE_KEY not set. Deployments to live networks will fail.");
}

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
  verify: {
    etherscan: {
      apiKey: process.env.ABSCAN_API_KEY || process.env.ETHERSCAN_API_KEY || "",
    },
  },
});
