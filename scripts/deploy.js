const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");


async function main() {
  const signers = await ethers.getSigners();
  const owner = signers[0];
  
  const producers = [signers[1], signers[5], signers[9]];
  const suppliers = [signers[2], signers[6], signers[10]];
  const retailers = [signers[3], signers[7], signers[11]];
  const consumers = [signers[4], signers[8], signers[12]];

  console.log("Deploying SupplyChain contract...");
  console.log("Deployer:", owner.address);

  const SupplyChain = await ethers.getContractFactory("SupplyChain");
  const supplyChain = await SupplyChain.deploy();
  await supplyChain.deployed();

  const contractAddress = supplyChain.address;
  console.log("Contract deployed at:", contractAddress);
  
  // Copy contract artifact to frontend
  const artifactPath = path.join(__dirname, "..", "artifacts", "contracts", "SupplyChain.sol", "SupplyChain.json");
  const frontendArtifactPath = path.join(__dirname, "..", "frontend", "src", "blockchain", "SupplyChain.json");
  
  try {
    if (fs.existsSync(artifactPath)) {
      const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
      // Update the artifact with the deployed address (if not already present)
      if (!artifact.networks || !artifact.networks["31337"]) {
        if (!artifact.networks) artifact.networks = {};
        artifact.networks["31337"] = {
          address: contractAddress,
        };
      } else {
        artifact.networks["31337"].address = contractAddress;
      }
      
      // Ensure the frontend directory exists
      const frontendBlockchainDir = path.dirname(frontendArtifactPath);
      if (!fs.existsSync(frontendBlockchainDir)) {
        fs.mkdirSync(frontendBlockchainDir, { recursive: true });
      }
      
      fs.writeFileSync(frontendArtifactPath, JSON.stringify(artifact, null, 2), "utf8");
      console.log("✓ Contract artifact copied to frontend");
    } else {
      console.warn("⚠ Warning: Contract artifact not found at:", artifactPath);
    }
  } catch (error) {
    console.warn("⚠ Warning: Could not copy contract artifact:", error.message);
  }
  
  console.log("\nRegistering roles...");
  
  console.log("\nRegistering Producers:");
  for (let i = 0; i < producers.length; i++) {
    await supplyChain.registerProducer(producers[i].address);
    console.log(`   Producer ${i + 1}:`, producers[i].address);
  }
  
  console.log("\nRegistering Suppliers:");
  for (let i = 0; i < suppliers.length; i++) {
    await supplyChain.registerSupplier(suppliers[i].address);
    console.log(`   Supplier ${i + 1}:`, suppliers[i].address);
  }
  
  console.log("\nRegistering Retailers:");
  for (let i = 0; i < retailers.length; i++) {
    await supplyChain.registerRetailer(retailers[i].address);
    console.log(`   Retailer ${i + 1}:`, retailers[i].address);
  }
  
  console.log("\nConsumer addresses (not registered in contract):");
  for (let i = 0; i < consumers.length; i++) {
    console.log(`   Consumer ${i + 1}:`, consumers[i].address);
  }

  console.log("\nOwner address:");
  console.log(`   Owner (Local):`, owner.address);

  console.log("\nTip: Connect MetaMask and register addresses via Owner Dashboard after deployment");
  console.log("\nDeployment + Role Setup Complete!\n");
}

main().catch((err) => {
  console.error("ERROR:", err);
  process.exit(1);
});
