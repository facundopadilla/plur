import { expect } from "chai";
import { ethers } from "hardhat";
import { PLRToken } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("PLRToken", function () {
  let token: PLRToken;
  let admin: HardhatEthersSigner;
  let minterBackend: HardhatEthersSigner;
  let user: HardhatEthersSigner;
  let attacker: HardhatEthersSigner;

  const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
  const BURNER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("BURNER_ROLE"));
  const PAUSER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("PAUSER_ROLE"));

  const refId = (id: string) => ethers.keccak256(ethers.toUtf8Bytes(id));
  const PLR = (n: number) => ethers.parseEther(n.toString());

  beforeEach(async function () {
    [admin, minterBackend, user, attacker] = await ethers.getSigners();
    const PLRToken = await ethers.getContractFactory("PLRToken");
    token = await PLRToken.deploy(admin.address, minterBackend.address) as PLRToken;
  });

  describe("Roles — constructor grants", function () {
    it("grants MINTER_ROLE to minterBackend", async function () {
      expect(await token.hasRole(MINTER_ROLE, minterBackend.address)).to.be.true;
    });

    it("grants BURNER_ROLE to minterBackend", async function () {
      expect(await token.hasRole(BURNER_ROLE, minterBackend.address)).to.be.true;
    });

    it("grants PAUSER_ROLE to admin", async function () {
      expect(await token.hasRole(PAUSER_ROLE, admin.address)).to.be.true;
    });

    it("grants DEFAULT_ADMIN_ROLE to admin", async function () {
      const DEFAULT_ADMIN_ROLE = await token.DEFAULT_ADMIN_ROLE();
      expect(await token.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.be.true;
    });
  });

  describe("T08 — Custodial semantics (no allowance needed for burn)", function () {
    it("BURNER_ROLE burns from user without any approve() call", async function () {
      await token.connect(minterBackend).mint(user.address, PLR(100), "purchase", refId("mint-1"));
      expect(await token.balanceOf(user.address)).to.equal(PLR(100));

      await token.connect(minterBackend).burnFrom(user.address, PLR(50), "ai_generation", refId("burn-1"));
      expect(await token.balanceOf(user.address)).to.equal(PLR(50));
    });

    it("non-BURNER_ROLE cannot call burnFrom", async function () {
      await token.connect(minterBackend).mint(user.address, PLR(100), "purchase", refId("mint-2"));
      await expect(
        token.connect(attacker).burnFrom(user.address, PLR(50), "hack", refId("burn-2"))
      ).to.be.reverted;
    });

    it("non-MINTER_ROLE cannot call mint", async function () {
      await expect(
        token.connect(attacker).mint(user.address, PLR(100), "hack", refId("mint-atk"))
      ).to.be.reverted;
    });

    it("CreditsIssued event emitted on mint", async function () {
      const rid = refId("mint-evt");
      await expect(
        token.connect(minterBackend).mint(user.address, PLR(100), "purchase", rid)
      )
        .to.emit(token, "CreditsIssued")
        .withArgs(user.address, PLR(100), "purchase", rid);
    });

    it("CreditsBurned event emitted on burnFrom", async function () {
      await token.connect(minterBackend).mint(user.address, PLR(100), "purchase", refId("mint-3"));
      const rid = refId("burn-evt");
      await expect(
        token.connect(minterBackend).burnFrom(user.address, PLR(40), "ai_generation", rid)
      )
        .to.emit(token, "CreditsBurned")
        .withArgs(user.address, PLR(40), "ai_generation", rid);
    });
  });

  describe("T09 — Anti-duplicate referenceId", function () {
    it("minting twice with same referenceId reverts on second call", async function () {
      const rid = refId("dup-mint");
      await token.connect(minterBackend).mint(user.address, PLR(100), "purchase", rid);
      await expect(
        token.connect(minterBackend).mint(user.address, PLR(100), "purchase", rid)
      ).to.be.revertedWith("PLR: referenceId already used");
    });

    it("burning twice with same referenceId reverts on second call", async function () {
      await token.connect(minterBackend).mint(user.address, PLR(200), "purchase", refId("mint-for-burn-dup"));
      const rid = refId("dup-burn");
      await token.connect(minterBackend).burnFrom(user.address, PLR(50), "ai_generation", rid);
      await expect(
        token.connect(minterBackend).burnFrom(user.address, PLR(50), "ai_generation", rid)
      ).to.be.revertedWith("PLR: referenceId already used");
    });

    it("different referenceIds succeed independently", async function () {
      await token.connect(minterBackend).mint(user.address, PLR(100), "purchase", refId("ref-A"));
      await token.connect(minterBackend).mint(user.address, PLR(100), "purchase", refId("ref-B"));
      expect(await token.balanceOf(user.address)).to.equal(PLR(200));
    });

    it("isReferenceIdUsed returns false before use", async function () {
      const rid = refId("unused");
      expect(await token.isReferenceIdUsed(rid)).to.be.false;
    });

    it("isReferenceIdUsed returns true after mint", async function () {
      const rid = refId("used-in-mint");
      await token.connect(minterBackend).mint(user.address, PLR(10), "purchase", rid);
      expect(await token.isReferenceIdUsed(rid)).to.be.true;
    });

    it("isReferenceIdUsed returns true after burnFrom", async function () {
      await token.connect(minterBackend).mint(user.address, PLR(100), "purchase", refId("pre-burn-check"));
      const rid = refId("used-in-burn");
      await token.connect(minterBackend).burnFrom(user.address, PLR(10), "ai_generation", rid);
      expect(await token.isReferenceIdUsed(rid)).to.be.true;
    });
  });

  describe("T10 — pause() blocks mint and burnFrom", function () {
    it("after pause(), mint() reverts", async function () {
      await token.connect(admin).pause();
      await expect(
        token.connect(minterBackend).mint(user.address, PLR(100), "purchase", refId("paused-mint"))
      ).to.be.reverted;
    });

    it("after pause(), burnFrom() reverts", async function () {
      await token.connect(minterBackend).mint(user.address, PLR(100), "purchase", refId("pre-pause-mint"));
      await token.connect(admin).pause();
      await expect(
        token.connect(minterBackend).burnFrom(user.address, PLR(50), "fee", refId("paused-burn"))
      ).to.be.reverted;
    });

    it("after unpause(), mint() works again", async function () {
      await token.connect(admin).pause();
      await token.connect(admin).unpause();
      await token.connect(minterBackend).mint(user.address, PLR(100), "purchase", refId("after-unpause-mint"));
      expect(await token.balanceOf(user.address)).to.equal(PLR(100));
    });

    it("after unpause(), burnFrom() works again", async function () {
      await token.connect(minterBackend).mint(user.address, PLR(100), "purchase", refId("pre-pause-burn2"));
      await token.connect(admin).pause();
      await token.connect(admin).unpause();
      await token.connect(minterBackend).burnFrom(user.address, PLR(30), "fee", refId("after-unpause-burn"));
      expect(await token.balanceOf(user.address)).to.equal(PLR(70));
    });

    it("only PAUSER_ROLE can call pause()", async function () {
      await expect(token.connect(attacker).pause()).to.be.reverted;
    });

    it("only PAUSER_ROLE can call unpause()", async function () {
      await token.connect(admin).pause();
      await expect(token.connect(attacker).unpause()).to.be.reverted;
    });
  });

  describe("T11 — MAX_MINT_PER_TX limit", function () {
    it("mint at exactly MAX_MINT_PER_TX succeeds", async function () {
      const maxAmount = await token.MAX_MINT_PER_TX();
      await token.connect(minterBackend).mint(user.address, maxAmount, "purchase", refId("max-exact"));
      expect(await token.balanceOf(user.address)).to.equal(maxAmount);
    });

    it("mint at MAX_MINT_PER_TX + 1 wei reverts", async function () {
      const maxAmount = await token.MAX_MINT_PER_TX();
      await expect(
        token.connect(minterBackend).mint(user.address, maxAmount + 1n, "purchase", refId("over-max"))
      ).to.be.revertedWith("PLR: amount exceeds per-tx limit");
    });

    it("MAX_MINT_PER_TX is 1_000_000 PLR", async function () {
      expect(await token.MAX_MINT_PER_TX()).to.equal(PLR(1_000_000));
    });
  });
});
