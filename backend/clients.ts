import { createWalletClient, createPublicClient, http, getContract, Address } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import "dotenv/config";
import ESIMNFTAbi from "../artifacts/contracts/ESIMNFT.sol/ESIMNFT.json";

const ABSTRACT_TESTNET = {
  id: 11124,
  name: "Abstract Sepolia Testnet",
  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://api.testnet.abs.xyz"] } },
} as const;

const ABSTRACT_MAINNET = {
  id: 2741,
  name: "Abstract",
  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://api.mainnet.abs.xyz"] } },
} as const;

function getClients() {
  const pk = process.env.PRIVATE_KEY;
  if (!pk) throw new Error("PRIVATE_KEY not set");
  const account = privateKeyToAccount(pk as `0x${string}`);

  const isTestnet = process.env.USE_TESTNET !== "false";
  const chain = isTestnet ? ABSTRACT_TESTNET : ABSTRACT_MAINNET;

  const publicClient = createPublicClient({
    chain,
    transport: http(),
  });

  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(),
  });

  return { account, publicClient, walletClient, chain };
}

export function getESIMNFTContract() {
  const address = process.env.CONTRACT_ADDRESS;
  if (!address) throw new Error("CONTRACT_ADDRESS not set");

  const { publicClient, walletClient } = getClients();

  return getContract({
    address: address as Address,
    abi: (ESIMNFTAbi as any).abi,
    client: { public: publicClient, wallet: walletClient },
  });
}

export { getClients, ABSTRACT_TESTNET, ABSTRACT_MAINNET };
