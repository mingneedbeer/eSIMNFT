export interface Plan {
  id: string;
  provider: string;
  country: string;
  countryCode: string;
  dataBytes: bigint;
  dataDisplay: string;
  validityDays: number;
  priceUSD: number;
}

const BASE_PLANS: Omit<Plan, "provider" | "dataBytes">[] = [
  { id: "airalo-jp-1gb-7d", country: "Japan", countryCode: "JP", dataDisplay: "1 GB", validityDays: 7, priceUSD: 6.00 },
  { id: "airalo-us-5gb-30d", country: "United States", countryCode: "US", dataDisplay: "5 GB", validityDays: 30, priceUSD: 15.00 },
  { id: "airalo-de-3gb-14d", country: "Germany", countryCode: "DE", dataDisplay: "3 GB", validityDays: 14, priceUSD: 10.00 },
  { id: "airalo-global-1gb-7d", country: "Global", countryCode: "GL", dataDisplay: "1 GB", validityDays: 7, priceUSD: 12.99 },
];

function dataDisplayToBytes(s: string): bigint {
  const match = s.match(/^(\d+)\s*(GB|MB)$/);
  if (!match) return 0n;
  const n = BigInt(match[1]);
  return match[2] === "GB" ? n * 1_000_000_000n : n * 1_000_000n;
}

export const PLANS: Plan[] = BASE_PLANS.map((p) => ({
  ...p,
  provider: "Airalo",
  dataBytes: dataDisplayToBytes(p.dataDisplay),
}));
