import { defineChain } from "viem";

export const abstractSepolia = /*#__PURE__*/ defineChain({
  id: 11_124,
  name: "Abstract Sepolia Testnet",
  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://api.testnet.abs.xyz"] },
  },
  blockExplorers: {
    default: {
      name: "Abscann",
      url: "https://sepolia.abscan.org",
    },
  },
  testnet: true,
});

export const CONTRACT_ADDRESS = "0x224bbbad39004054bdfd52878bc13179e9010d43";
export const ABSCAN_URL = "https://sepolia.abscan.org";

export const contractABI = [
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "string", name: "provider", type: "string" },
      { internalType: "string", name: "planId", type: "string" },
      { internalType: "string", name: "country", type: "string" },
      { internalType: "string", name: "countryCode", type: "string" },
      { internalType: "uint256", name: "dataBytes", type: "uint256" },
      { internalType: "uint256", name: "validityDays", type: "uint256" },
    ],
    name: "mint",
    outputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "ownerOf",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalMinted",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "getPlan",
    outputs: [
      {
        components: [
          { internalType: "string", name: "provider", type: "string" },
          { internalType: "string", name: "planId", type: "string" },
          { internalType: "string", name: "country", type: "string" },
          { internalType: "string", name: "countryCode", type: "string" },
          { internalType: "uint256", name: "dataBytes", type: "uint256" },
          { internalType: "uint256", name: "validityDays", type: "uint256" },
          { internalType: "bool", name: "activated", type: "bool" },
          { internalType: "address", name: "activatedBy", type: "address" },
          { internalType: "uint256", name: "activatedAt", type: "uint256" },
        ],
        internalType: "struct ESIMNFT.ESIMPlan",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "tokenId", type: "uint256" },
      { indexed: false, internalType: "string", name: "provider", type: "string" },
      { indexed: false, internalType: "string", name: "planId", type: "string" },
      { indexed: false, internalType: "string", name: "country", type: "string" },
      { indexed: false, internalType: "string", name: "countryCode", type: "string" },
    ],
    name: "PlanMinted",
    type: "event",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
