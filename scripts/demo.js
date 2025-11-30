const { ethers } = require("hardhat");

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Mapping for ProductStatus enum
const ProductStatus = [
    "Created",
    "SentToSupplier",
    "ReceivedBySupplier",
    "SentToRetailer",
    "ReceivedByRetailer",
    "AvailableForSale",
    "SoldToConsumer"
];

async function printTxDetails(description, tx) {
    const receipt = await tx.wait();
    console.log(`\n📌 ${description}`);
    console.log(`   ├─ 🧾 Tx Hash:       ${receipt.transactionHash}`);
    console.log(`   ├─ ⛽ Gas Used:      ${receipt.gasUsed.toString()}`);
    console.log(`   ├─ 📦 Block Number: ${receipt.blockNumber}`);
    console.log(`   └─ 🔍 Events:`);

    receipt.events?.forEach((event, idx) => {
        console.log(`       [${idx}] Event: ${event.event}`);
        if (event.args) {
            Object.keys(event.args)
                .filter(k => isNaN(k))
                .forEach(key => {
                    console.log(`            • ${key}: ${event.args[key]}`);
                });
        }
    });

    await sleep(300); // Just for smooth visual demo flow
    return receipt;
}

async function printProduct(supplyChain, productId) {
    const p = await supplyChain.getProduct(productId);

    console.log(`\n📝 Product State Snapshot`);
    console.log(`   ├─ ID:            ${p.id}`);
    console.log(`   ├─ Name:          ${p.name}`);
    console.log(`   ├─ Description:   ${p.description}`);
    console.log(`   ├─ Quantity:      ${p.quantity}`);
    console.log(`   ├─ Created At:    ${new Date(p.createdAt * 1000).toLocaleString()}`);
    console.log(`   ├─ Producer:      ${p.producer}`);
    console.log(`   ├─ Supplier:      ${p.supplier}`);
    console.log(`   ├─ Retailer:      ${p.retailer}`);
    console.log(`   ├─ Consumer:      ${p.consumer}`);
    console.log(`   ├─ Status:        ${ProductStatus[p.status]}`);
    console.log(`   └─ Shipping Info: ${p.shippingInfo}\n`);
}

async function main() {
    console.log("\n🚀 SUPPLY CHAIN DEMO STARTING...\n");

    // Get actors
    const [owner, producer, supplier, retailer, consumer] = await ethers.getSigners();

    console.log("👥 Actors:");
    console.log(`   Owner:    ${owner.address}`);
    console.log(`   Producer: ${producer.address}`);
    console.log(`   Supplier: ${supplier.address}`);
    console.log(`   Retailer: ${retailer.address}`);
    console.log(`   Consumer: ${consumer.address}`); 

    await sleep(500);

    // Deploy contract
    const SupplyChain = await ethers.getContractFactory("SupplyChain");
    const supplyChain = await SupplyChain.deploy();

    console.log("\n📄 Contract deployed!");
    console.log(`   Address: ${supplyChain.address}`);

    await sleep(500);

    // Register stakeholders
    await printTxDetails("Registering Producer", await supplyChain.registerProducer(producer.address));
    await printTxDetails("Registering Supplier", await supplyChain.registerSupplier(supplier.address));
    await printTxDetails("Registering Retailer", await supplyChain.registerRetailer(retailer.address));

    // Producer adds product
    console.log("\n🏭 Producer is adding a product...");
    const tx = await supplyChain.connect(producer).addProduct("Laptop", "High-end laptop", 100);
    const receipt = await printTxDetails("Product Created", tx);

    const event = receipt.events.find(e => e.event === "ProductCreated");
    const productId = event.args.productId;
    console.log(`\n🎉 Product created with ID: ${productId}\n`);

    await printProduct(supplyChain, productId);

    // Producer → Supplier
    await printTxDetails(
        "Producer sending product to Supplier",
        await supplyChain.connect(producer).sendToSupplier(productId, supplier.address)
    );
    await printProduct(supplyChain, productId);

    // Supplier receives product
    await printTxDetails(
        "Supplier receiving product",
        await supplyChain.connect(supplier).receiveProduct(productId)
    );
    await printProduct(supplyChain, productId);

    // Supplier updates shipping info
    await printTxDetails(
        "Supplier updating shipping info",
        await supplyChain.connect(supplier).updateShippingInfo(productId, "Dispatching to retailer warehouse")
    );
    await printProduct(supplyChain, productId);

    // Supplier → Retailer
    await printTxDetails(
        "Supplier sending product to Retailer",
        await supplyChain.connect(supplier).sendToRetailer(productId, retailer.address)
    );
    await printProduct(supplyChain, productId);

    // Retailer receives product
    await printTxDetails(
        "Retailer receiving product",
        await supplyChain.connect(retailer).receiveProductFromSupplier(productId)
    );
    await printProduct(supplyChain, productId);

    // Retailer adds to store
    await printTxDetails(
        "Retailer adding product to store",
        await supplyChain.connect(retailer).addToStore(productId)
    );
    await printProduct(supplyChain, productId);

    // Retailer sells to consumer
    await printTxDetails(
        "Retailer selling product to consumer",
        await supplyChain.connect(retailer).sellToConsumer(productId, consumer.address)
    );
    await printProduct(supplyChain, productId);

    console.log("\n🎯 SUPPLY CHAIN FLOW COMPLETED SUCCESSFULLY!");
    console.log("✨ All events, transactions, and state transitions were executed on-chain.\n");
}

main().catch((error) => {
    console.error("\n❌ ERROR:", error);
    process.exitCode = 1;
});
