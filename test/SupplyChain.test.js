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
        await printTxDetails("Registering Consumer", await supplyChain.registerConsumer(consumer.address));
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
            await supplyChain.connect(retailer).sellToConsumer(productId, consumer.address, 100)
        );
        await printProduct(supplyChain, productId);

        console.log("\n✨ FULL SUPPLY CHAIN FLOW COMPLETED SUCCESSFULLY!");

        // Assertions for correctness
        const finalProduct = await supplyChain.getProduct(productId);
        expect(finalProduct.status).to.equal(6);
        expect(finalProduct.consumer).to.equal(consumer.address);
    });
});

describe("📝 REGISTRATION TESTS", function () {
    let owner, producer, supplier, retailer, consumer1, consumer2, nonOwner;
    let supplyChain;

    beforeEach(async function () {
        [owner, producer, supplier, retailer, consumer1, consumer2, nonOwner] = await ethers.getSigners();

        const SupplyChain = await ethers.getContractFactory("SupplyChain");
        supplyChain = await SupplyChain.deploy();
        await supplyChain.deployed();
    });

    describe("Consumer Registration", function () {
        it("Should allow owner to register a consumer", async function () {
            const tx = await supplyChain.connect(owner).registerConsumer(consumer1.address);

            await expect(tx)
                .to.emit(supplyChain, "ConsumerRegistered")
                .withArgs(consumer1.address);

            const isConsumer = await supplyChain.consumers(consumer1.address);
            expect(isConsumer).to.equal(true);
        });

        it("Should allow owner to register multiple consumers", async function () {
            await supplyChain.connect(owner).registerConsumer(consumer1.address);
            await supplyChain.connect(owner).registerConsumer(consumer2.address);

            const isConsumer1 = await supplyChain.consumers(consumer1.address);
            const isConsumer2 = await supplyChain.consumers(consumer2.address);

            expect(isConsumer1).to.equal(true);
            expect(isConsumer2).to.equal(true);
        });

        it("Should reject consumer registration from non-owner", async function () {
            await expect(
                supplyChain.connect(nonOwner).registerConsumer(consumer1.address)
            ).to.be.revertedWith("Only owner can perform this action");
        });

        it("Should reject consumer registration from producer", async function () {
            await supplyChain.connect(owner).registerProducer(producer.address);

            await expect(
                supplyChain.connect(producer).registerConsumer(consumer1.address)
            ).to.be.revertedWith("Only owner can perform this action");
        });

        it("Should reject consumer registration from supplier", async function () {
            await supplyChain.connect(owner).registerSupplier(supplier.address);

            await expect(
                supplyChain.connect(supplier).registerConsumer(consumer1.address)
            ).to.be.revertedWith("Only owner can perform this action");
        });

        it("Should reject consumer registration from retailer", async function () {
            await supplyChain.connect(owner).registerRetailer(retailer.address);

            await expect(
                supplyChain.connect(retailer).registerConsumer(consumer1.address)
            ).to.be.revertedWith("Only owner can perform this action");
        });

        it("Should allow registering same consumer multiple times (idempotent)", async function () {
            await supplyChain.connect(owner).registerConsumer(consumer1.address);
            
            // Register again - should not revert
            const tx = await supplyChain.connect(owner).registerConsumer(consumer1.address);
            await expect(tx)
                .to.emit(supplyChain, "ConsumerRegistered")
                .withArgs(consumer1.address);

            const isConsumer = await supplyChain.consumers(consumer1.address);
            expect(isConsumer).to.equal(true);
        });

        it("Should emit ConsumerRegistered event with correct address", async function () {
            const tx = await supplyChain.connect(owner).registerConsumer(consumer1.address);
            const receipt = await tx.wait();

            const event = receipt.events.find(e => e.event === "ConsumerRegistered");
            expect(event).to.not.be.undefined;
            expect(event.args[0]).to.equal(consumer1.address);
        });
    });

    describe("Registration Integration", function () {
        it("Should allow owner to register all stakeholder types", async function () {
            await supplyChain.connect(owner).registerProducer(producer.address);
            await supplyChain.connect(owner).registerSupplier(supplier.address);
            await supplyChain.connect(owner).registerRetailer(retailer.address);
            await supplyChain.connect(owner).registerConsumer(consumer1.address);

            expect(await supplyChain.producers(producer.address)).to.equal(true);
            expect(await supplyChain.suppliers(supplier.address)).to.equal(true);
            expect(await supplyChain.retailers(retailer.address)).to.equal(true);
            expect(await supplyChain.consumers(consumer1.address)).to.equal(true);
        });

        it("Should allow registered consumer to create quotations", async function () {
            await supplyChain.connect(owner).registerConsumer(consumer1.address);
            await supplyChain.connect(owner).registerProducer(producer.address);

            const tx = await supplyChain.connect(consumer1).createQuotation(
                "Widget",
                "Description",
                10
            );

            await expect(tx)
                .to.emit(supplyChain, "QuotationCreated")
                .withArgs(1, consumer1.address, "Widget", 10);
        });

        it("Should allow registered consumer to purchase from surplus", async function () {
            await supplyChain.connect(owner).registerConsumer(consumer1.address);
            await supplyChain.connect(owner).registerProducer(producer.address);
            await supplyChain.connect(owner).registerSupplier(supplier.address);
            await supplyChain.connect(owner).registerRetailer(retailer.address);

            // Create product and complete flow
            await supplyChain.connect(producer).addProduct("Widget", "Description", 20);
            await supplyChain.connect(producer).sendToSupplier(1, supplier.address);
            await supplyChain.connect(supplier).receiveProduct(1);
            await supplyChain.connect(supplier).sendToRetailer(1, retailer.address);
            await supplyChain.connect(retailer).receiveProductFromSupplier(1);
            await supplyChain.connect(retailer).addToStore(1);

            // Consumer purchases
            const tx = await supplyChain.connect(consumer1).purchaseFromSurplus(1, 5);
            await expect(tx)
                .to.emit(supplyChain, "ProductSoldToConsumer")
                .withArgs(1, consumer1.address);
        });
    });
});
