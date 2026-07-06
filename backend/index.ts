import "dotenv/config";
import { IESIMProvider, ESIMPlan } from "./providers/IESIMProvider";
import { MockProvider } from "./providers/MockProvider";
import { getESIMNFTContract } from "./clients";

type ESIMProvider = IESIMProvider;

const providers: Map<string, ESIMProvider> = new Map();

function initProviders() {
  // In production, register real providers here (Airalo, Holafly, etc.)
  const mock = new MockProvider();
  providers.set(mock.name, mock);
  console.log(`Registered provider: ${mock.name}`);
}

async function getAvailablePlans(): Promise<ESIMPlan[]> {
  const all: ESIMPlan[] = [];
  for (const provider of providers.values()) {
    const plans = await provider.listPlans();
    all.push(...plans);
  }
  return all;
}

async function mintESIMNFT(planId: string, recipientAddress: `0x${string}`) {
  const contract = getESIMNFTContract();

  // Find the plan
  let plan: ESIMPlan | null = null;
  for (const provider of providers.values()) {
    plan = await provider.getPlan(planId);
    if (plan) break;
  }
  if (!plan) throw new Error(`Plan ${planId} not found`);

  // Mint the NFT
  const hash = await contract.write.mint([
    recipientAddress,
    plan.provider,
    plan.id,
    plan.country,
    plan.countryCode,
    plan.dataBytes,
    BigInt(plan.validityDays),
  ]);

  console.log(`Minted NFT for plan ${planId} to ${recipientAddress}: tx ${hash}`);
  return hash;
}

async function activateESIM(tokenId: bigint, userAddress: `0x${string}`, email: string) {
  const contract = getESIMNFTContract();
  const plan = await contract.read.getPlan([tokenId]);

  if (plan.activated) throw new Error("Token already activated");

  // Find the provider
  const provider = providers.get(plan.provider);
  if (!provider) throw new Error(`Provider ${plan.provider} not configured`);

  // Purchase & activate from provider
  const activation = await provider.purchaseAndActivate(plan.planId, email);
  console.log(`Activation result:`, activation);

  // Mark as activated on-chain (operator activates on behalf of user)
  const hash = await contract.write.operatorActivate([tokenId, userAddress]);
  console.log(`Token ${tokenId} activated on-chain: tx ${hash}`);

  return { activation, txHash: hash };
}

// CLI handler
async function main() {
  initProviders();
  const command = process.argv[2];

  switch (command) {
    case "list-plans":
      const plans = await getAvailablePlans();
      console.table(plans.map((p) => ({
        id: p.id,
        country: p.country,
        data: p.dataDisplay,
        days: p.validityDays,
        price: `$${p.priceUSD}`,
      })));
      break;

    case "mint":
      const planId = process.argv[3];
      const recipient = process.argv[4] as `0x${string}`;
      if (!planId || !recipient) {
        console.error("Usage: bun run backend/index.ts mint <planId> <recipientAddress>");
        process.exit(1);
      }
      await mintESIMNFT(planId, recipient);
      break;

    case "activate":
      const tokenId = BigInt(process.argv[3] || "0");
      const userAddr = process.argv[4] as `0x${string}`;
      const email = process.argv[5] || "user@example.com";
      if (!tokenId || !userAddr) {
        console.error("Usage: bun run backend/index.ts activate <tokenId> <userAddress> [email]");
        process.exit(1);
      }
      const result = await activateESIM(tokenId, userAddr, email);
      console.log("Activation successful:", result.activation);
      break;

    default:
      console.log(`
Usage:
  bun run backend/index.ts list-plans
  bun run backend/index.ts mint <planId> <recipientAddress>
  bun run backend/index.ts activate <tokenId> <userAddress> [email]
      `);
  }
}

main().catch(console.error);
