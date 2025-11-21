const { ethers } = require("hardhat");
const { expect } = require("chai");

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

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

    await sleep(150);
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

describe("🚀 SUPPLY CHAIN LOGGED DEMO", function () {
    let owner, producer, supplier, retailer, consumer;
    let supplyChain;

    beforeEach(async function () {
        [owner, producer, supplier, retailer, consumer] = await ethers.getSigners();

        console.log("\n👥 Actors:");
        console.log(`   Owner:    ${owner.address}`);
        console.log(`   Producer: ${producer.address}`);
        console.log(`   Supplier: ${supplier.address}`);
        console.log(`   Retailer: ${retailer.address}`);
        console.log(`   Consumer: ${consumer.address}`);

        const SupplyChain = await ethers.getContractFactory("SupplyChain");
        supplyChain = await SupplyChain.deploy();
        await supplyChain.deployed();

        console.log(`\n📄 Contract deployed at ${supplyChain.address}`);

        await printTxDetails("Registering Producer", await supplyChain.registerProducer(producer.address));
        await printTxDetails("Registering Supplier", await supplyChain.registerSupplier(supplier.address));
        await printTxDetails("Registering Retailer", await supplyChain.registerRetailer(retailer.address));
    });

    it("Full supply chain lifecycle with logs", async function () {
        console.log("\n🏭 Producer adding product...");
        const tx = await supplyChain.connect(producer).addProduct(
            "Laptop",
            "High-end laptop",
            100
        );
        const receipt = await printTxDetails("Product Created", tx);

        const event = receipt.events.find((e) => e.event === "ProductCreated");
        const productId = event.args.productId;

        console.log(`\n🎉 Product created with ID: ${productId}`);
        await printProduct(supplyChain, productId);

        await printTxDetails(
            "Producer → Supplier",
            await supplyChain.connect(producer).sendToSupplier(productId, supplier.address)
        );
        await printProduct(supplyChain, productId);

        await printTxDetails(
            "Supplier Received",
            await supplyChain.connect(supplier).receiveProduct(productId)
        );
        await printProduct(supplyChain, productId);

        await printTxDetails(
            "Supplier Shipping Info Update",
            await supplyChain.connect(supplier).updateShippingInfo(productId, "Dispatching from warehouse")
        );
        await printProduct(supplyChain, productId);

        await printTxDetails(
            "Supplier → Retailer",
            await supplyChain.connect(supplier).sendToRetailer(productId, retailer.address)
        );
        await printProduct(supplyChain, productId);

        await printTxDetails(
            "Retailer Received",
            await supplyChain.connect(retailer).receiveProductFromSupplier(productId)
        );
        await printProduct(supplyChain, productId);

        await printTxDetails(
            "Retailer Adds to Store",
            await supplyChain.connect(retailer).addToStore(productId)
        );
        await printProduct(supplyChain, productId);

        await printTxDetails(
            "Retailer Sells to Consumer",
            await supplyChain.connect(retailer).sellToConsumer(productId, consumer.address)
        );
        await printProduct(supplyChain, productId);

        console.log("\n✨ FULL SUPPLY CHAIN FLOW COMPLETED SUCCESSFULLY!");

        // Assertions for correctness
        const finalProduct = await supplyChain.getProduct(productId);
        expect(finalProduct.status).to.equal(6);
        expect(finalProduct.consumer).to.equal(consumer.address);
    });
});
