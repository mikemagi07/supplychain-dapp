const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");
const { parseMetamaskAddresses } = require("./config/metamask-addresses");

async function main() {
  const signers = await ethers.getSigners();
  const owner = signers[0];

  const producers = [signers[1], signers[5], signers[9]];
  const suppliers = [signers[2], signers[6], signers[10]];
  const retailers = [signers[3], signers[7], signers[11]];
  const consumers = [signers[4], signers[8], signers[12]];

  // Extra accounts (not registered yet) that can be assigned to ANY role later via the UI
  const usedAddresses = new Set([
    owner.address,
    ...producers.map((s) => s.address),
    ...suppliers.map((s) => s.address),
    ...retailers.map((s) => s.address),
    ...consumers.map((s) => s.address),
  ]);

  const extraAddresses = signers
    .map((s) => s.address)
    .filter((addr) => !usedAddresses.has(addr));

  console.log("Deploying SupplyChain contract...");
  console.log("Deployer:", owner.address);

  const SupplyChain = await ethers.getContractFactory("SupplyChain");
  const supplyChain = await SupplyChain.deploy();
  await supplyChain.deployed();

  const contractAddress = supplyChain.address;
  console.log("Contract deployed at:", contractAddress);

  // Get MetaMask addresses from environment or use default list (reused throughout)
  const metamaskAddresses = parseMetamaskAddresses(process.env.METAMASK_ADDRESSES, ethers);

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

      // Initial artifact setup (will be updated with MetaMask role assignments later)
      artifact.uiAddresses = {
        owner: owner.address,
        producers: producers.map((s) => s.address),
        suppliers: suppliers.map((s) => s.address),
        retailers: retailers.map((s) => s.address),
        consumers: consumers.map((s) => s.address),
        extra: extraAddresses,
        metamask: metamaskAddresses,
      };

      // Ensure the frontend directory exists
      const frontendBlockchainDir = path.dirname(frontendArtifactPath);
      if (!fs.existsSync(frontendBlockchainDir)) {
        fs.mkdirSync(frontendBlockchainDir, { recursive: true });
      }

      // Save artifact immediately with contract address and initial setup
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

  // Fund MetaMask accounts and assign roles
  const { fundMetaMaskAccounts } = require("./fundMetaMaskAccounts");

  if (metamaskAddresses.length > 0) {
    const fundAmount = process.env.FUND_AMOUNT || "100";
    console.log(`\n💰 Funding ${metamaskAddresses.length} MetaMask account(s)...`);
    await fundMetaMaskAccounts(metamaskAddresses, fundAmount);

    // Assign roles to MetaMask addresses
    console.log("\n🔐 Assigning roles to MetaMask addresses...");

    // Parse role assignments from environment variable (optional)
    // Format: METAMASK_ROLES="owner:0x...|producer:0x...,0x...|supplier:0x...,0x...|retailer:0x...,0x..."
    const metamaskRolesEnv = process.env.METAMASK_ROLES;
    let roleAssignments = {
      owners: [],
      producers: [],
      suppliers: [],
      retailers: [],
    };

    if (metamaskRolesEnv) {
      // Parse custom role assignments
      const roleGroups = metamaskRolesEnv.split("|");
      for (const group of roleGroups) {
        const [role, addresses] = group.split(":");
        if (addresses) {
          const addrList = addresses.split(",").map(addr => {
            try {
              return ethers.utils.getAddress(addr.trim());
            } catch (e) {
              return null;
            }
          }).filter(addr => addr !== null);

          if (role.toLowerCase() === "owner") {
            roleAssignments.owners.push(...addrList);
          } else if (role.toLowerCase() === "producer") {
            roleAssignments.producers.push(...addrList);
          } else if (role.toLowerCase() === "supplier") {
            roleAssignments.suppliers.push(...addrList);
          } else if (role.toLowerCase() === "retailer") {
            roleAssignments.retailers.push(...addrList);
          }
        }
      }
    } else {
      // Default: 1 owner, 2 producers, 2 suppliers, 2 retailers, rest are extra
      if (metamaskAddresses.length > 0) {
        // 1 owner (first address)
        if (metamaskAddresses.length >= 1) {
          roleAssignments.owners.push(metamaskAddresses[0]);
        }
        // 2 producers (next 2 addresses)
        if (metamaskAddresses.length >= 2) {
          roleAssignments.producers.push(metamaskAddresses[1]);
        }
        if (metamaskAddresses.length >= 3) {
          roleAssignments.producers.push(metamaskAddresses[2]);
        }
        // 2 suppliers (next 2 addresses)
        if (metamaskAddresses.length >= 4) {
          roleAssignments.suppliers.push(metamaskAddresses[3]);
        }
        if (metamaskAddresses.length >= 5) {
          roleAssignments.suppliers.push(metamaskAddresses[4]);
        }
        // 2 retailers (next 2 addresses)
        if (metamaskAddresses.length >= 6) {
          roleAssignments.retailers.push(metamaskAddresses[5]);
        }
        if (metamaskAddresses.length >= 7) {
          roleAssignments.retailers.push(metamaskAddresses[6]);
        }
        // Rest are extra (consumers/unassigned) - no registration needed
      }
    }

    // Register owners
    if (roleAssignments.owners.length > 0) {
      console.log("\n   Registering MetaMask Owners:");
      for (let i = 0; i < roleAssignments.owners.length; i++) {
        try {
          await supplyChain.addOwner(roleAssignments.owners[i]);
          console.log(`      ✅ Owner ${i + 1}: ${roleAssignments.owners[i]}`);
        } catch (error) {
          console.warn(`      ⚠️  Failed to register owner ${roleAssignments.owners[i]}: ${error.message}`);
        }
      }
    }

    // Register producers
    if (roleAssignments.producers.length > 0) {
      console.log("\n   Registering MetaMask Producers:");
      for (let i = 0; i < roleAssignments.producers.length; i++) {
        try {
          await supplyChain.registerProducer(roleAssignments.producers[i]);
          console.log(`      ✅ Producer ${i + 1}: ${roleAssignments.producers[i]}`);
        } catch (error) {
          console.warn(`      ⚠️  Failed to register producer ${roleAssignments.producers[i]}: ${error.message}`);
        }
      }
    }

    // Register suppliers
    if (roleAssignments.suppliers.length > 0) {
      console.log("\n   Registering MetaMask Suppliers:");
      for (let i = 0; i < roleAssignments.suppliers.length; i++) {
        try {
          await supplyChain.registerSupplier(roleAssignments.suppliers[i]);
          console.log(`      ✅ Supplier ${i + 1}: ${roleAssignments.suppliers[i]}`);
        } catch (error) {
          console.warn(`      ⚠️  Failed to register supplier ${roleAssignments.suppliers[i]}: ${error.message}`);
        }
      }
    }

    // Register retailers
    if (roleAssignments.retailers.length > 0) {
      console.log("\n   Registering MetaMask Retailers:");
      for (let i = 0; i < roleAssignments.retailers.length; i++) {
        try {
          await supplyChain.registerRetailer(roleAssignments.retailers[i]);
          console.log(`      ✅ Retailer ${i + 1}: ${roleAssignments.retailers[i]}`);
        } catch (error) {
          console.warn(`      ⚠️  Failed to register retailer ${roleAssignments.retailers[i]}: ${error.message}`);
        }
      }
    }

    // Show extra addresses (not assigned to any role - available as consumers or for later assignment)
    const assignedAddresses = new Set([
      ...roleAssignments.owners,
      ...roleAssignments.producers,
      ...roleAssignments.suppliers,
      ...roleAssignments.retailers,
    ]);
    const extraMetaMaskAddresses = metamaskAddresses.filter(addr => !assignedAddresses.has(addr));
    
    if (extraMetaMaskAddresses.length > 0) {
      console.log("\n   Extra addresses (available as consumers or for later role assignment):");
      for (let i = 0; i < extraMetaMaskAddresses.length; i++) {
        console.log(`      ℹ️  Extra ${i + 1}: ${extraMetaMaskAddresses[i]}`);
      }
    }

    // Update artifact with MetaMask role assignments for UI dropdowns
    if (fs.existsSync(frontendArtifactPath)) {
      const artifact = JSON.parse(fs.readFileSync(frontendArtifactPath, "utf8"));
      
      // Update artifact with MetaMask role assignments
      artifact.uiAddresses = {
        ...artifact.uiAddresses,
        metamaskOwners: roleAssignments.owners,
        metamaskProducers: roleAssignments.producers,
        metamaskSuppliers: roleAssignments.suppliers,
        metamaskRetailers: roleAssignments.retailers,
        metamaskConsumers: extraMetaMaskAddresses, // Extra addresses can be used as consumers
      };

      fs.writeFileSync(frontendArtifactPath, JSON.stringify(artifact, null, 2), "utf8");
      console.log("\n✓ Contract artifact updated with MetaMask role assignments");
    }
  }

  console.log("\n✅ Deployment + Role Setup Complete!");
  console.log("   MetaMask addresses are now registered and ready to use.\n");
}

main().catch((err) => {
  console.error("ERROR:", err);
  process.exit(1);
});
