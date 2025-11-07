import "dotenv/config";
import hre from "hardhat";
import { ethers } from "ethers";

async function main() {
  const rpcUrl = process.env.RPC_URL || "http://127.0.0.1:8545";
  const privateKey = process.env.PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  
  console.log("Deploying with account:", wallet.address);
  
  const artifact = await hre.artifacts.readArtifact("SupplyChain");
  
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  
  const supplyChain = await factory.deploy();
  await supplyChain.waitForDeployment();

  console.log("SupplyChain deployed to:", await supplyChain.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
