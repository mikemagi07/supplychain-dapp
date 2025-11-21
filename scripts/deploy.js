const hre = require("hardhat");

async function main() {
  // Get signers
  const [owner, producer, supplier, retailer] = await hre.ethers.getSigners();

  console.log("Deploying with owner:", owner.address);

  // Deploy contract (ethers v5 syntax)
  const SupplyChain = await hre.ethers.getContractFactory("SupplyChain");
  const contract = await SupplyChain.deploy();
  await contract.deployed(); // <-- This is correct for ethers v5

  console.log("SupplyChain deployed at:", contract.address);
  console.log("Registering roles...");

  // Register roles
  const tx1 = await contract.registerProducer(producer.address);
  await tx1.wait();

  const tx2 = await contract.registerSupplier(supplier.address);
  await tx2.wait();

  const tx3 = await contract.registerRetailer(retailer.address);
  await tx3.wait();

  console.log("\nRoles registered successfully:");
  console.log("Producer :", producer.address);
  console.log("Supplier :", supplier.address);
  console.log("Retailer :", retailer.address);

  console.log("\n🚀 Deployment + Role Setup Completed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
