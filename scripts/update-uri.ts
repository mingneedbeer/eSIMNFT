import hre from "hardhat";

async function main() {
  const contractAddress = "0x876fdcbd21401ad13778de574ef7533ed603983d";
  const { viem } = await hre.network.create();
  const [deployer] = await viem.getWalletClients();
  const publicClient = await viem.getPublicClient();
  const contract = await viem.getContractAt("ESIMNFT", contractAddress as `0x${string}`);

  const oldURI = await contract.read.tokenURI([0n]);
  console.log("Old URI:", oldURI);

  const newBase = "https://www.1esim.xyz/api/metadata/";
  const hash = await contract.write.setBaseURI([newBase], { account: deployer.account });
  await publicClient.waitForTransactionReceipt({ hash });

  const newURI = await contract.read.tokenURI([0n]);
  console.log("New URI:", newURI);
  console.log("✅ Contract baseURI updated");
}

main().catch(console.error);
