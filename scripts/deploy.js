const { ethers } = require("hardhat");

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

  console.log("Contract deployed at:", supplyChain.address);

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

  console.log("\nMetaMask Wallet Addresses (register via Owner Dashboard):");
  const metamaskOwner = new ethers.Wallet("0xab3f8423f55e98845cc80f86e511378c9c9e6c506f3ba06c07b85dd546a8b9f4");
  const metamaskProducers = [
    new ethers.Wallet("0x56348345b229733049706ccf7cbddc027bda0ca121a2f9f7eb85ad1a5f7eaf4a"),
    new ethers.Wallet("0x4601418d53c157601a3879cd525bf1c71e3e461462ed16de74eeaec2269411ae"),
    new ethers.Wallet("0x2b5695a45abdaa8272e44cfe4e67a4f4f5aac88f103372dd38f0ba535cf8fb22"),
  ];
  const metamaskSuppliers = [
    new ethers.Wallet("0xecfbddae299d996041fb863043ac20681cd53e7d83a29424e857a4800a76d4f7"),
    new ethers.Wallet("0x8311eca1674382edeb0fe728cadf332593b327c81f092c8fa0f707387e30a3a0"),
    new ethers.Wallet("0xd7aa654a59482642e3fbb9711c0ab26a002dec4976e706d0b8827f3028ce343f"),
  ];
  const metamaskRetailers = [
    new ethers.Wallet("0x3973c22e20a01bb005bf294b9dc7dd34d1002d897af33c5caba18fb774da8f9f"),
    new ethers.Wallet("0xf3c11b029fdf9948f30dc5e574dbfd8059a177fbb42e6471b3d909e0078d8724"),
    new ethers.Wallet("0xb46433a9fb5e2a593ca25ac3d2fab7677c3c75a0570ddc40573827c26962652f"),
  ];
  const metamaskConsumers = [
    new ethers.Wallet("0xa66a6b92bbf582f47b1362e827220be9637ff1e09b8425e9f7e5469835592fd0"),
    new ethers.Wallet("0x674a5512cdd4d0ba54146cc1af4f0284f7587b075731e809cc08dec7cc5f1d2f"),
    new ethers.Wallet("0x81d44b19e2cd3ab4505bee0a921e236651606e01aba8dfe4ff86182edcfaaf5e"),
  ];

  console.log(`   MetaMask Owner:`, metamaskOwner.address);
  console.log(`   MetaMask Producers:`);
  metamaskProducers.forEach((p, i) => console.log(`      ${i + 1}.`, p.address));
  console.log(`   MetaMask Suppliers:`);
  metamaskSuppliers.forEach((s, i) => console.log(`      ${i + 1}.`, s.address));
  console.log(`   MetaMask Retailers:`);
  metamaskRetailers.forEach((r, i) => console.log(`      ${i + 1}.`, r.address));
  console.log(`   MetaMask Consumers:`);
  metamaskConsumers.forEach((c, i) => console.log(`      ${i + 1}.`, c.address));

  console.log("\nTip: Register MetaMask addresses via Owner Dashboard after deployment");
  console.log("\nDeployment + Role Setup Complete!\n");
}

main().catch((err) => {
  console.error("ERROR:", err);
  process.exit(1);
});
