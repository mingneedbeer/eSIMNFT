import hre from "hardhat";

const PLANS = [
  { provider: "Airalo", planId: "airalo-jp-1gb-7d", country: "Japan", countryCode: "JP", dataBytes: 1_000_000_000n, validityDays: 7n },
  { provider: "Airalo", planId: "airalo-us-5gb-30d", country: "United States", countryCode: "US", dataBytes: 5_000_000_000n, validityDays: 30n },
  { provider: "Airalo", planId: "airalo-de-3gb-14d", country: "Germany", countryCode: "DE", dataBytes: 3_000_000_000n, validityDays: 14n },
  { provider: "Airalo", planId: "airalo-global-1gb-7d", country: "Global", countryCode: "GL", dataBytes: 1_000_000_000n, validityDays: 7n },
];

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS;
  if (!contractAddress) {
    console.error("CONTRACT_ADDRESS env variable required");
    process.exit(1);
  }

  const { viem } = await hre.network.create();
  const [deployer] = await viem.getWalletClients();
  const publicClient = await viem.getPublicClient();
  const contract = await viem.getContractAt("ESIMNFT", contractAddress as `0x${string}`);

  console.log("Minting eSIM plans as NFTs...\n");

  for (const plan of PLANS) {
    const hash = await contract.write.mint(
      [deployer.account.address, plan.provider, plan.planId, plan.country, plan.countryCode, plan.dataBytes, plan.validityDays],
      { account: deployer.account }
    );
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log(`Minted: ${plan.country} (${plan.planId}) -> Token #${receipt.logs[0]?.topics?.[3] ? parseInt(receipt.logs[0].topics[3], 16) : "?"}`);
  }

  const total = await contract.read.totalMinted();
  console.log(`\nTotal tokens minted: ${total}`);
}

main().catch(console.error);
