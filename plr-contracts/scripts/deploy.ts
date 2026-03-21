import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "AVAX");

  const BACKEND_WALLET = process.env.BACKEND_WALLET_ADDRESS;
  if (!BACKEND_WALLET) {
    throw new Error("BACKEND_WALLET_ADDRESS env var is required");
  }

  const PLRToken = await ethers.getContractFactory("PLRToken");
  const plrToken = await PLRToken.deploy(deployer.address, BACKEND_WALLET);
  await plrToken.waitForDeployment();

  const address = await plrToken.getAddress();
  console.log("\nPLRToken deployed to:", address);
  console.log("\nVerify on Snowtrace:");
  console.log(`npx hardhat verify --network fuji ${address} ${deployer.address} ${BACKEND_WALLET}`);
  console.log("\nAdd to README:");
  console.log(`PLRToken: ${address}`);
  console.log(`Explorer: https://testnet.snowtrace.io/address/${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
