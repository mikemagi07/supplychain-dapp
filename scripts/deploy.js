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

      // Get MetaMask addresses from environment or use default list
      const metamaskAddressesEnv = process.env.METAMASK_ADDRESSES;
      let metamaskAddresses = [];

      if (metamaskAddressesEnv) {
        metamaskAddresses = metamaskAddressesEnv
          .split(",")
          .map(addr => addr.trim())
          .filter(addr => addr.length > 0)
          .map(addr => {
            try {
              return ethers.utils.getAddress(addr); // Normalize to checksum
            } catch (e) {
              console.warn(`⚠️  Invalid MetaMask address skipped: ${addr}`);
              return null;
            }
          })
          .filter(addr => addr !== null);
      } else {
        // Default MetaMask accounts if not set in environment
        const defaultMetamaskAddresses = [
          "0x7d0a9c42b9953a1adc0a8a15a6a66bb489994e57",
          "0x44da5566ef04234363b4882d856d590ab435096e",
          "0x933d4350bca858e6de702a929878a413352885d8",
          "0x2fa965d296f182848588f9a3ed97af2e9fdf2d76",
          "0xb6ce9af39c7ca87f179666c05204d72516649dfc",
          "0x5560e14d290bc0459ca186b647637238dde2cdfb",
          "0x8567da95c79efcd36f953478d4f3adec117ae179",
          "0x24dc4ef5604ee51c616c1a7f42906f44cf196afe",
          "0xE5A1385f95ACd5caD8192fb82F13F065aeBA86Cc",
          "0xd51c949838f9e35851b5c9be3f6309101b0687c2",
          "0x984e3ea2679d8febc93d0c885712158debcef02e",
          "0x171c52193664A2c624c5551C442A8bbde2D3a93e",
          "0xc693c588981179b5e3f951e12c38e74ea6082d1c",
          "0x34e817073401aaa0f21215d769cd9e3500b2e69e",
          "0x423536d127f738b31999b2259d1ff842c2d47080",
        ];

        metamaskAddresses = defaultMetamaskAddresses.map(addr => {
          try {
            return ethers.utils.getAddress(addr);
          } catch (e) {
            return null;
          }
        }).filter(addr => addr !== null);
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

  // Get MetaMask addresses (same logic as above)
  const metamaskAddressesEnv = process.env.METAMASK_ADDRESSES;
  let addressesToFund = [];

  if (metamaskAddressesEnv) {
    addressesToFund = metamaskAddressesEnv
      .split(",")
      .map(addr => addr.trim())
      .filter(addr => addr.length > 0)
      .map(addr => {
        try {
          return ethers.utils.getAddress(addr); // Normalize to checksum
        } catch (e) {
          console.warn(`⚠️  Invalid MetaMask address skipped: ${addr}`);
          return null;
        }
      })
      .filter(addr => addr !== null);
  } else {
    // Use default MetaMask accounts
    addressesToFund = [
      "0x7d0a9c42b9953a1adc0a8a15a6a66bb489994e57",
      "0x44da5566ef04234363b4882d856d590ab435096e",
      "0x933d4350bca858e6de702a929878a413352885d8",
      "0x2fa965d296f182848588f9a3ed97af2e9fdf2d76",
      "0xb6ce9af39c7ca87f179666c05204d72516649dfc",
      "0x5560e14d290bc0459ca186b647637238dde2cdfb",
      "0x8567da95c79efcd36f953478d4f3adec117ae179",
      "0x24dc4ef5604ee51c616c1a7f42906f44cf196afe",
      "0xE5A1385f95ACd5caD8192fb82F13F065aeBA86Cc",
      "0xd51c949838f9e35851b5c9be3f6309101b0687c2",
      "0x984e3ea2679d8febc93d0c885712158debcef02e",
      "0x171c52193664A2c624c5551C442A8bbde2D3a93e",
      "0xc693c588981179b5e3f951e12c38e74ea6082d1c",
      "0x34e817073401aaa0f21215d769cd9e3500b2e69e",
      "0x423536d127f738b31999b2259d1ff842c2d47080",
    ].map(addr => {
      try {
        return ethers.utils.getAddress(addr);
      } catch (e) {
        return null;
      }
    }).filter(addr => addr !== null);
  }

  if (addressesToFund.length > 0) {
    const fundAmount = process.env.FUND_AMOUNT || "100";
    console.log(`\n💰 Funding ${addressesToFund.length} MetaMask account(s)...`);
    await fundMetaMaskAccounts(addressesToFund, fundAmount);

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
      if (addressesToFund.length > 0) {
        // 1 owner (first address)
        if (addressesToFund.length >= 1) {
          roleAssignments.owners.push(addressesToFund[0]);
        }
        // 2 producers (next 2 addresses)
        if (addressesToFund.length >= 2) {
          roleAssignments.producers.push(addressesToFund[1]);
        }
        if (addressesToFund.length >= 3) {
          roleAssignments.producers.push(addressesToFund[2]);
        }
        // 2 suppliers (next 2 addresses)
        if (addressesToFund.length >= 4) {
          roleAssignments.suppliers.push(addressesToFund[3]);
        }
        if (addressesToFund.length >= 5) {
          roleAssignments.suppliers.push(addressesToFund[4]);
        }
        // 2 retailers (next 2 addresses)
        if (addressesToFund.length >= 6) {
          roleAssignments.retailers.push(addressesToFund[5]);
        }
        if (addressesToFund.length >= 7) {
          roleAssignments.retailers.push(addressesToFund[6]);
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
    const extraMetaMaskAddresses = addressesToFund.filter(addr => !assignedAddresses.has(addr));
    
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
