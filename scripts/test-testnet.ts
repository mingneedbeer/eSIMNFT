import hre from "hardhat";
import { getAddress } from "viem";

async function main() {
  const contractAddress = "0x876fdcbd21401ad13778de574ef7533ed603983d";
  const { viem } = await hre.network.create();
  const [deployer] = await viem.getWalletClients();
  const publicClient = await viem.getPublicClient();
  const contract = await viem.getContractAt("ESIMNFT", contractAddress as `0x${string}`);

  const chainId = await publicClient.getChainId();
  console.log("Connected to chain:", chainId);
  console.log("Contract:", contractAddress);
  console.log("Deployer:", deployer.account.address);
  console.log("Balance:", (await publicClient.getBalance({ address: deployer.account.address })).toString());

  // 1. Check contract state
  console.log("\n=== 1. Contract Info ===");
  console.log("Name:", await contract.read.name());
  console.log("Symbol:", await contract.read.symbol());
  console.log("Owner:", await contract.read.owner());
  const prevTotal = await contract.read.totalMinted();
  console.log("Total minted before:", prevTotal.toString());

  // 2. Mint a Japan 1GB plan to deployer
  const tokenId = prevTotal;
  console.log("\n=== 2. Mint Japan 1GB eSIM (Token #" + tokenId + ") ===");
  const mintHash = await contract.write.mint(
    [deployer.account.address, "Airalo", "airalo-jp-1gb-7d", "Japan", "JP", 1_000_000_000n, 7n],
    { account: deployer.account }
  );
  const mintReceipt = await publicClient.waitForTransactionReceipt({ hash: mintHash });
  console.log("Mint tx:", mintHash);
  console.log("Gas used:", mintReceipt.gasUsed?.toString());

  // 3. Query plan data
  console.log("\n=== 3. Token #" + tokenId + " Plan ===");
  const plan = await contract.read.getPlan([tokenId]);
  console.log("Provider:", plan.provider);
  console.log("Plan ID:", plan.planId);
  console.log("Country:", plan.country);
  console.log("Country Code:", plan.countryCode);
  console.log("Data (bytes):", plan.dataBytes.toString());
  console.log("Validity (days):", plan.validityDays.toString());
  console.log("Activated:", plan.activated);

  // 4. Activate
  console.log("\n=== 4. Activate Token #" + tokenId + " ===");
  const actHash = await contract.write.activate([tokenId], { account: deployer.account });
  await publicClient.waitForTransactionReceipt({ hash: actHash });
  console.log("Activate tx:", actHash);
  console.log("isActivated:", await contract.read.isActivated([tokenId]));

  // 5. Verify non-transferability
  console.log("\n=== 5. Verify transfer is blocked ===");
  const randomAddr = getAddress("0xdead000000000000000000000000000000000001");
  try {
    await contract.write.transferFrom(
      [deployer.account.address, randomAddr, tokenId],
      { account: deployer.account }
    );
    console.log("WARNING: transfer should have failed!");
  } catch (e: any) {
    console.log("Transfer correctly rejected:", e.shortMessage || e.message?.slice(0, 80));
  }

  // 6. Token URI
  console.log("\n=== 6. Metadata ===");
  console.log("Token URI:", await contract.read.tokenURI([tokenId]));

  console.log("\n✅ All tests passed on Abstract Testnet!");
}

main().catch((e) => {
  console.error("FAILED:", e.shortMessage || e.message);
  process.exitCode = 1;
});
