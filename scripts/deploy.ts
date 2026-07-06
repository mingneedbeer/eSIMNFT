import hre from "hardhat";

async function main() {
  const { viem } = await hre.network.create();
  const [deployer] = await viem.getWalletClients();
  const publicClient = await viem.getPublicClient();

  const chainId = await publicClient.getChainId();
  console.log("Deploying with account:", deployer.account.address);
  console.log("Chain ID:", chainId);

  const baseURI = process.env.BASE_TOKEN_URI || "https://api.esim.example/metadata/";

  const contract = await viem.deployContract("ESIMNFT", [baseURI]);
  console.log("ESIMNFT deployed to:", contract.address);

  const hash = await contract.write.setOperator([deployer.account.address, true], {
    account: deployer.account,
  });
  await publicClient.waitForTransactionReceipt({ hash });
  console.log("Deployer set as operator");

  console.log("\nDeployment complete!");
  console.log(`Contract: ${contract.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
