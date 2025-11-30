const { ethers } = require("hardhat");

async function main() {
  const [owner, producer, supplier, retailer] = await ethers.getSigners();

  console.log("🚀 Deploying SupplyChain contract...");
  console.log("Deployer:", owner.address);

  const SupplyChain = await ethers.getContractFactory("SupplyChain");
  const supplyChain = await SupplyChain.deploy();
  await supplyChain.deployed();

  console.log("📄 Contract deployed at:", supplyChain.address);

  // Register roles
  console.log("\n🔐 Registering roles...");
  await supplyChain.registerProducer(producer.address);
  await supplyChain.registerSupplier(supplier.address);
  await supplyChain.registerRetailer(retailer.address);

  console.log("   ✔ Producer :", producer.address);
  console.log("   ✔ Supplier :", supplier.address);
  console.log("   ✔ Retailer :", retailer.address);

  console.log("\n🎉 Deployment + Role Setup Complete!\n");
}

main().catch((err) => {
  console.error("❌ ERROR:", err);
  process.exit(1);
});
