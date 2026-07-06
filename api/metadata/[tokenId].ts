import { createPublicClient, http, getContract } from "viem";

const ABSTRACT_TESTNET = {
  id: 11124,
  name: "Abstract Sepolia Testnet",
  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://api.testnet.abs.xyz"] } },
} as const;

const CONTRACT_ADDRESS = "0x876fdcbd21401ad13778de574ef7533ed603983d";

const ABI = [
  { type: "function", name: "getPlan", inputs: [{ name: "tokenId", type: "uint256" }], outputs: [{ type: "tuple", components: [
    { name: "provider", type: "string" },
    { name: "planId", type: "string" },
    { name: "country", type: "string" },
    { name: "countryCode", type: "string" },
    { name: "dataBytes", type: "uint256" },
    { name: "validityDays", type: "uint256" },
    { name: "activated", type: "bool" },
    { name: "activatedBy", type: "address" },
    { name: "activatedAt", type: "uint256" },
  ]}], stateMutability: "view" },
  { type: "function", name: "name", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" },
  { type: "function", name: "totalMinted", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
] as const;

function formatData(bytes: bigint): string {
  if (bytes >= 1_000_000_000n) return `${(Number(bytes) / 1_000_000_000).toFixed(0)} GB`;
  if (bytes >= 1_000_000n) return `${(Number(bytes) / 1_000_000).toFixed(0)} MB`;
  if (bytes >= 1_000n) return `${(Number(bytes) / 1_000).toFixed(0)} KB`;
  return `${bytes} B`;
}

function generateSVG(tokenId: string, country: string, data: string, days: string, activated: boolean): string {
  const status = activated ? "Activated" : "Unactivated";
  const statusColor = activated ? "#ef4444" : "#22c55e";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500">
  <rect width="400" height="500" rx="16" fill="#0f172a"/>
  <text x="200" y="60" text-anchor="middle" font-family="monospace" font-size="18" fill="#64748b">eSIM VOUCHER</text>
  <text x="200" y="100" text-anchor="middle" font-family="sans-serif" font-size="32" font-weight="bold" fill="#f8fafc">#${tokenId}</text>
  <rect x="40" y="130" width="320" height="2" fill="#334155"/>
  <text x="60" y="180" font-family="sans-serif" font-size="14" fill="#64748b">Country</text>
  <text x="60" y="205" font-family="sans-serif" font-size="22" font-weight="bold" fill="#f8fafc">${country}</text>
  <text x="60" y="260" font-family="sans-serif" font-size="14" fill="#64748b">Data</text>
  <text x="60" y="285" font-family="sans-serif" font-size="22" font-weight="bold" fill="#f8fafc">${data}</text>
  <text x="60" y="340" font-family="sans-serif" font-size="14" fill="#64748b">Validity</text>
  <text x="60" y="365" font-family="sans-serif" font-size="22" font-weight="bold" fill="#f8fafc">${days} days</text>
  <rect x="40" y="400" width="320" height="40" rx="20" fill="${statusColor}" opacity="0.15"/>
  <text x="200" y="426" text-anchor="middle" font-family="sans-serif" font-size="16" font-weight="bold" fill="${statusColor}">${status}</text>
</svg>`;
}

export default async function handler(req: any, res: any) {
  const { tokenId } = req.query;
  const id = BigInt(tokenId);

  try {
    const publicClient = createPublicClient({
      chain: ABSTRACT_TESTNET,
      transport: http(),
    });

    const contract = getContract({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      client: { public: publicClient },
    });

    const [plan, name, totalMinted] = await Promise.all([
      contract.read.getPlan([id]),
      contract.read.name(),
      contract.read.totalMinted(),
    ]);

    if (id >= totalMinted) {
      return res.status(404).json({ error: "Token does not exist" });
    }

    const dataDisplay = formatData(plan.dataBytes);
    const status = plan.activated ? "Activated" : "Unactivated";
    const svg = generateSVG(tokenId, plan.country, dataDisplay, plan.validityDays.toString(), plan.activated);
    const svgBase64 = Buffer.from(svg).toString("base64");

    res.setHeader("Cache-Control", "public, max-age=60, s-maxage=120");
    res.json({
      name: `${name} #${tokenId}`,
      description: `${plan.country} eSIM — ${dataDisplay} for ${plan.validityDays} days via ${plan.provider}. ${status === "Activated" ? "This voucher has been redeemed." : "Purchase and activate to receive your eSIM profile."}`,
      image: `data:image/svg+xml;base64,${svgBase64}`,
      attributes: [
        { trait_type: "Provider", value: plan.provider },
        { trait_type: "Country", value: plan.country },
        { trait_type: "Country Code", value: plan.countryCode },
        { trait_type: "Data", value: dataDisplay },
        { trait_type: "Validity", value: `${plan.validityDays} days` },
        { trait_type: "Status", value: status },
      ],
    });
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch metadata" });
  }
}
