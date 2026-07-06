import hre from "hardhat";

async function main() {
  const { viem } = await hre.network.create();
  const [deployer, user, user2] = await viem.getWalletClients();
  const publicClient = await viem.getPublicClient();

  // Deploy fresh for complete demo
  const contract = await viem.deployContract("ESIMNFT", ["https://api.esim.example/metadata/"]);
  console.log("=== Contract Deployed ===");
  console.log("Address:", contract.address);
  console.log("Name:", await contract.read.name());
  console.log("Symbol:", await contract.read.symbol());
  console.log("Owner:", await contract.read.owner());

  // Mint a Japan 1GB plan
  console.log("\n=== Minting Japan 1GB eSIM ===");
  const hash = await contract.write.mint(
    [user.account.address, "Airalo", "airalo-jp-1gb-7d", "Japan", "JP", 1_000_000_000n, 7n],
    { account: deployer.account }
  );
  await publicClient.waitForTransactionReceipt({ hash });
  console.log("Minted Token #0 to", user.account.address);

  // Check plan
  console.log("\n=== Token #0 Plan ===");
  const plan = await contract.read.getPlan([0n]);
  console.log("Provider:", plan.provider);
  console.log("Country:", plan.country);
  console.log("Data:", plan.dataBytes.toString(), "bytes (~1GB)");
  console.log("Validity:", plan.validityDays.toString(), "days");
  console.log("Activated:", plan.activated);

  // Transfer (should succeed)
  console.log("\n=== Transferring Token #0 (unactivated) ===");
  const tx1 = await contract.write.transferFrom(
    [user.account.address, user2.account.address, 0n],
    { account: user.account }
  );
  await publicClient.waitForTransactionReceipt({ hash: tx1 });
  console.log("New owner:", await contract.read.ownerOf([0n]));

  // Transfer back
  const tx2 = await contract.write.transferFrom(
    [user2.account.address, user.account.address, 0n],
    { account: user2.account }
  );
  await publicClient.waitForTransactionReceipt({ hash: tx2 });
  console.log("Owner after transfer back:", await contract.read.ownerOf([0n]));

  // Activate
  console.log("\n=== Activating Token #0 ===");
  const actTx = await contract.write.activate([0n], { account: user.account });
  await publicClient.waitForTransactionReceipt({ hash: actTx });
  console.log("Activated:", await contract.read.isActivated([0n]));

  // Try to transfer (should fail)
  console.log("\n=== Attempting transfer of activated token ===");
  try {
    await contract.write.transferFrom(
      [user.account.address, user2.account.address, 0n],
      { account: user.account }
    );
    console.log("ERROR: Transfer should have failed!");
  } catch (e: any) {
    console.log("Rejected:", e.shortMessage || e.message?.slice(0, 100));
  }

  // Metadata
  console.log("\n=== Metadata ===");
  console.log("Token URI:", await contract.read.tokenURI([0n]));

  console.log("\n✅ Full workflow verified!");
}

main().catch(console.error);
