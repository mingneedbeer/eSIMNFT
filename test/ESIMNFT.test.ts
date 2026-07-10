import { describe, it } from "node:test";
import assert from "node:assert/strict";
import hre from "hardhat";

const PLAN = {
  provider: "Airalo",
  planId: "airalo-jp-1gb-7d",
  country: "Japan",
  countryCode: "JP",
  dataBytes: 1_000_000_000n,
  validityDays: 7n,
};

async function setup() {
  const { viem } = await hre.network.create();
  const [owner, user1, user2] = await viem.getWalletClients();
  const publicClient = await viem.getPublicClient();
  const contract = await viem.deployContract("ESIMNFT", ["https://api.esim.example/metadata/"]);
  return { viem, contract, publicClient, owner, user1, user2 };
}

async function mint(contract: any, publicClient: any, owner: any, to: any) {
  const hash = await contract.write.mint(
    [to.account.address, PLAN.provider, PLAN.planId, PLAN.country, PLAN.countryCode, PLAN.dataBytes, PLAN.validityDays],
    { account: owner.account }
  );
  await publicClient.waitForTransactionReceipt({ hash });
}

describe("ESIMNFT", async () => {
  describe("Deployment", async () => {
    it("should set correct name and symbol", async () => {
      const { contract } = await setup();
      assert.equal(await contract.read.name(), "Transferable eSIM Voucher");
      assert.equal(await contract.read.symbol(), "eSIM");
    });

    it("should set the owner as deployer", async () => {
      const { contract, owner } = await setup();
      const contractOwner = await contract.read.owner();
      assert.equal(
        contractOwner.toLowerCase(),
        owner.account.address.toLowerCase()
      );
    });
  });

  describe("Minting", async () => {
    it("should mint a token with correct plan data", async () => {
      const { contract, publicClient, owner, user1 } = await setup();
      await mint(contract, publicClient, owner, user1);

      assert.equal(
        (await contract.read.ownerOf([0n])).toLowerCase(),
        user1.account.address.toLowerCase()
      );

      const plan = await contract.read.getPlan([0n]);
      assert.equal(plan.provider, PLAN.provider);
      assert.equal(plan.planId, PLAN.planId);
      assert.equal(plan.country, PLAN.country);
      assert.equal(plan.countryCode, PLAN.countryCode);
      assert.equal(plan.dataBytes, PLAN.dataBytes);
      assert.equal(plan.validityDays, PLAN.validityDays);
      assert.equal(plan.activated, false);
    });

    it("should reject minting from non-owner", async () => {
      const { viem, contract, user1 } = await setup();
      await viem.assertions.revertWithCustomError(
        contract.write.mint(
          [user1.account.address, PLAN.provider, PLAN.planId, PLAN.country, PLAN.countryCode, PLAN.dataBytes, PLAN.validityDays],
          { account: user1.account }
        ),
        contract,
        "OwnableUnauthorizedAccount"
      );
    });
  });

  describe("Activation", async () => {
    it("should activate a token", async () => {
      const { contract, publicClient, owner, user1 } = await setup();
      await mint(contract, publicClient, owner, user1);

      const hash = await contract.write.activate([0n], { account: user1.account });
      await publicClient.waitForTransactionReceipt({ hash });

      assert.equal(await contract.read.isActivated([0n]), true);
      const plan = await contract.read.getPlan([0n]);
      assert.equal(plan.activated, true);
      assert.equal(
        plan.activatedBy.toLowerCase(),
        user1.account.address.toLowerCase()
      );
      assert.ok(plan.activatedAt > 0n);
    });

    it("should reject activation by non-owner", async () => {
      const { viem, contract, publicClient, owner, user1, user2 } = await setup();
      await mint(contract, publicClient, owner, user1);

      await viem.assertions.revertWithCustomError(
        contract.write.activate([0n], { account: user2.account }),
        contract,
        "NotTokenOwner"
      );
    });

    it("should reject double activation", async () => {
      const { viem, contract, publicClient, owner, user1 } = await setup();
      await mint(contract, publicClient, owner, user1);
      await contract.write.activate([0n], { account: user1.account });

      await viem.assertions.revertWithCustomError(
        contract.write.activate([0n], { account: user1.account }),
        contract,
        "AlreadyActivated"
      );
    });
  });

  describe("Transfer restrictions", async () => {
    it("should allow transferring unactivated tokens", async () => {
      const { contract, publicClient, owner, user1, user2 } = await setup();
      await mint(contract, publicClient, owner, user1);

      const hash = await contract.write.transferFrom(
        [user1.account.address, user2.account.address, 0n],
        { account: user1.account }
      );
      await publicClient.waitForTransactionReceipt({ hash });

      assert.equal(
        (await contract.read.ownerOf([0n])).toLowerCase(),
        user2.account.address.toLowerCase()
      );
    });

    it("should reject transferring activated tokens", async () => {
      const { viem, contract, publicClient, owner, user1, user2 } = await setup();
      await mint(contract, publicClient, owner, user1);
      await contract.write.activate([0n], { account: user1.account });

      await viem.assertions.revertWithCustomError(
        contract.write.transferFrom(
          [user1.account.address, user2.account.address, 0n],
          { account: user1.account }
        ),
        contract,
        "CannotTransferActivated"
      );
    });
  });

  describe("Operator role", async () => {
    it("should allow operator to activate", async () => {
      const { contract, publicClient, owner, user1 } = await setup();
      await contract.write.setOperator([owner.account.address, true], { account: owner.account });
      await mint(contract, publicClient, owner, user1);

      const hash = await contract.write.operatorActivate([0n, user1.account.address], { account: owner.account });
      await publicClient.waitForTransactionReceipt({ hash });

      assert.equal(await contract.read.isActivated([0n]), true);
    });

    it("should reject non-operator from operatorActivate", async () => {
      const { viem, contract, publicClient, owner, user1, user2 } = await setup();
      await mint(contract, publicClient, owner, user1);

      await viem.assertions.revertWithCustomError(
        contract.write.operatorActivate([0n, user1.account.address], { account: user2.account }),
        contract,
        "NotOperator"
      );
    });
  });

  describe("Burning", async () => {
    it("should burn a token", async () => {
      const { contract, publicClient, owner, user1 } = await setup();
      await mint(contract, publicClient, owner, user1);
      await contract.write.activate([0n], { account: user1.account });

      const hash = await contract.write.burn([0n], { account: user1.account });
      await publicClient.waitForTransactionReceipt({ hash });

      await assert.rejects(
        async () => contract.read.ownerOf([0n])
      );
    });

    it("should reject queries for burned tokens", async () => {
      const { contract, publicClient, owner, user1 } = await setup();
      await mint(contract, publicClient, owner, user1);
      await contract.write.activate([0n], { account: user1.account });
      await contract.write.burn([0n], { account: user1.account });

      await assert.rejects(async () => contract.read.getPlan([0n]));
      await assert.rejects(async () => contract.read.isActivated([0n]));
      await assert.rejects(async () => contract.read.tokenURI([0n]));
    });
  });

  describe("TokenURI", async () => {
    it("should return correct token URI", async () => {
      const { contract, publicClient, owner, user1 } = await setup();
      await mint(contract, publicClient, owner, user1);
      const uri = await contract.read.tokenURI([0n]);
      assert.equal(uri, "https://api.esim.example/metadata/0");
    });
  });
});
