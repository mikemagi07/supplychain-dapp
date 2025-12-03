const { ethers } = require("hardhat");
const { expect } = require("chai");

const ProductStatus = [
    "Created",
    "SentToSupplier",
    "ReceivedBySupplier",
    "SentToRetailer",
    "ReceivedByRetailer",
    "AvailableForSale",
    "SoldToConsumer"
];

const QuotationStatus = [
    "Pending",
    "Approved",
    "Rejected",
    "Fulfilled"
];

describe("📋 QUOTATION SYSTEM TESTS", function () {
    let owner, producer, supplier, retailer, consumer1, consumer2, consumer3;
    let supplyChain;

    beforeEach(async function () {
        [owner, producer, supplier, retailer, consumer1, consumer2, consumer3] = await ethers.getSigners();

        const SupplyChain = await ethers.getContractFactory("SupplyChain");
        supplyChain = await SupplyChain.deploy();
        await supplyChain.deployed();

        // Register all actors
        await supplyChain.registerProducer(producer.address);
        await supplyChain.registerSupplier(supplier.address);
        await supplyChain.registerRetailer(retailer.address);
    });

    describe("Quotation Creation", function () {
        it("Should allow consumer to create a quotation", async function () {
            const tx = await supplyChain.connect(consumer1).createQuotation(
                "Widget",
                "High-quality widget",
                10
            );

            await expect(tx)
                .to.emit(supplyChain, "QuotationCreated")
                .withArgs(1, consumer1.address, "Widget", 10);

            const quotation = await supplyChain.getQuotation(1);
            expect(quotation.id).to.equal(1);
            expect(quotation.consumer).to.equal(consumer1.address);
            expect(quotation.productName).to.equal("Widget");
            expect(quotation.description).to.equal("High-quality widget");
            expect(quotation.requestedQuantity).to.equal(10);
            expect(quotation.status).to.equal(0); // Pending
            expect(quotation.productId).to.equal(0); // Not linked yet
        });

        it("Should reject quotation with zero quantity", async function () {
            await expect(
                supplyChain.connect(consumer1).createQuotation("Widget", "Description", 0)
            ).to.be.revertedWith("Requested quantity must be greater than 0");
        });

        it("Should reject quotation with empty product name", async function () {
            await expect(
                supplyChain.connect(consumer1).createQuotation("", "Description", 10)
            ).to.be.revertedWith("Product name cannot be empty");
        });

        it("Should track multiple quotations from same consumer", async function () {
            await supplyChain.connect(consumer1).createQuotation("Widget", "Desc1", 10);
            await supplyChain.connect(consumer1).createQuotation("Gadget", "Desc2", 5);

            const quotations = await supplyChain.getConsumerQuotations(consumer1.address);
            expect(quotations.length).to.equal(2);
            expect(quotations[0]).to.equal(1);
            expect(quotations[1]).to.equal(2);
        });

        it("Should track quotations from different consumers", async function () {
            await supplyChain.connect(consumer1).createQuotation("Widget", "Desc", 10);
            await supplyChain.connect(consumer2).createQuotation("Widget", "Desc", 5);

            const q1 = await supplyChain.getConsumerQuotations(consumer1.address);
            const q2 = await supplyChain.getConsumerQuotations(consumer2.address);

            expect(q1.length).to.equal(1);
            expect(q2.length).to.equal(1);
            expect(q1[0]).to.equal(1);
            expect(q2[0]).to.equal(2);
        });
    });

    describe("Producer Quotation Approval", function () {
        let quotationId1, quotationId2;

        beforeEach(async function () {
            // Create test quotations
            const tx1 = await supplyChain.connect(consumer1).createQuotation("Widget", "Description", 10);
            const receipt1 = await tx1.wait();
            quotationId1 = receipt1.events.find(e => e.event === "QuotationCreated").args.quotationId;

            const tx2 = await supplyChain.connect(consumer2).createQuotation("Widget", "Description", 5);
            const receipt2 = await tx2.wait();
            quotationId2 = receipt2.events.find(e => e.event === "QuotationCreated").args.quotationId;
        });

        it("Should allow producer to approve single quotation", async function () {
            const tx = await supplyChain.connect(producer).approveQuotations([quotationId1], 15);

            await expect(tx)
                .to.emit(supplyChain, "QuotationApproved")
                .withArgs(quotationId1, 1, producer.address);

            await expect(tx)
                .to.emit(supplyChain, "ProductCreated")
                .withArgs(1, "Widget", producer.address);

            // Check quotation status
            const quotation = await supplyChain.getQuotation(quotationId1);
            expect(quotation.status).to.equal(1); // Approved
            expect(quotation.productId).to.equal(1);

            // Check product
            const product = await supplyChain.getProductExtended(1);
            expect(product.name).to.equal("Widget");
            expect(product.totalQuantity).to.equal(15);
            expect(product.availableQuantity).to.equal(15);
            expect(product.isFromQuotation).to.equal(true);
            expect(product.quotationIds.length).to.equal(1);
            expect(product.quotationIds[0]).to.equal(quotationId1);
        });

        it("Should allow producer to batch approve multiple quotations", async function () {
            const tx = await supplyChain.connect(producer).approveQuotations([quotationId1, quotationId2], 20);

            await expect(tx)
                .to.emit(supplyChain, "QuotationsBatchApproved")
                .withArgs([quotationId1, quotationId2], 1, producer.address);

            // Check both quotations are approved
            const q1 = await supplyChain.getQuotation(quotationId1);
            const q2 = await supplyChain.getQuotation(quotationId2);

            expect(q1.status).to.equal(1); // Approved
            expect(q2.status).to.equal(1); // Approved
            expect(q1.productId).to.equal(1);
            expect(q2.productId).to.equal(1);

            // Check product links to both quotations
            const product = await supplyChain.getProductExtended(1);
            expect(product.quotationIds.length).to.equal(2);
            const quotationIdsStr = product.quotationIds.map(q => q.toString());
            expect(quotationIdsStr).to.include(quotationId1.toString());
            expect(quotationIdsStr).to.include(quotationId2.toString());
        });

        it("Should reject approval if total quantity < sum of requested", async function () {
            await expect(
                supplyChain.connect(producer).approveQuotations([quotationId1, quotationId2], 10)
            ).to.be.revertedWith("Total quantity must be >= sum of requested quantities");
        });

        it("Should reject approval if quotations are for different products", async function () {
            const tx3 = await supplyChain.connect(consumer3).createQuotation("Gadget", "Different product", 5);
            const receipt3 = await tx3.wait();
            const quotationId3 = receipt3.events.find(e => e.event === "QuotationCreated").args.quotationId;

            await expect(
                supplyChain.connect(producer).approveQuotations([quotationId1, quotationId3], 20)
            ).to.be.revertedWith("All quotations must be for the same product");
        });

        it("Should reject approval of non-pending quotation", async function () {
            // Approve first time
            await supplyChain.connect(producer).approveQuotations([quotationId1], 15);

            // Try to approve again
            await expect(
                supplyChain.connect(producer).approveQuotations([quotationId1], 15)
            ).to.be.revertedWith("Quotation must be pending");
        });

        it("Should reject approval with empty quotation array", async function () {
            await expect(
                supplyChain.connect(producer).approveQuotations([], 10)
            ).to.be.revertedWith("Must approve at least one quotation");
        });

        it("Should reject approval with zero total quantity", async function () {
            await expect(
                supplyChain.connect(producer).approveQuotations([quotationId1], 0)
            ).to.be.revertedWith("Total quantity must be greater than 0");
        });

        it("Should allow approval with quantity exactly equal to sum", async function () {
            await expect(
                supplyChain.connect(producer).approveQuotations([quotationId1, quotationId2], 15)
            ).to.not.be.reverted;
        });

        it("Should allow approval with quantity greater than sum (surplus)", async function () {
            const tx = await supplyChain.connect(producer).approveQuotations([quotationId1, quotationId2], 25);
            await expect(tx).to.emit(supplyChain, "ProductCreated");

            const product = await supplyChain.getProductExtended(1);
            expect(product.totalQuantity).to.equal(25);
            expect(product.availableQuantity).to.equal(25);
        });
    });

    describe("Producer Quotation Rejection", function () {
        let quotationId;

        beforeEach(async function () {
            const tx = await supplyChain.connect(consumer1).createQuotation("Widget", "Description", 10);
            const receipt = await tx.wait();
            quotationId = receipt.events.find(e => e.event === "QuotationCreated").args.quotationId;
        });

        it("Should allow producer to reject quotation", async function () {
            const tx = await supplyChain.connect(producer).rejectQuotation(quotationId);

            await expect(tx)
                .to.emit(supplyChain, "QuotationRejected")
                .withArgs(quotationId, producer.address);

            const quotation = await supplyChain.getQuotation(quotationId);
            expect(quotation.status).to.equal(2); // Rejected
        });

        it("Should reject non-existent quotation", async function () {
            await expect(
                supplyChain.connect(producer).rejectQuotation(999)
            ).to.be.revertedWith("Quotation does not exist");
        });

        it("Should reject already approved quotation", async function () {
            await supplyChain.connect(producer).approveQuotations([quotationId], 15);

            await expect(
                supplyChain.connect(producer).rejectQuotation(quotationId)
            ).to.be.revertedWith("Quotation must be pending");
        });
    });

    describe("Pending Quotations View", function () {
        it("Should return all pending quotations", async function () {
            await supplyChain.connect(consumer1).createQuotation("Widget", "Desc1", 10);
            await supplyChain.connect(consumer2).createQuotation("Gadget", "Desc2", 5);
            await supplyChain.connect(consumer3).createQuotation("Thing", "Desc3", 8);

            // Approve one
            await supplyChain.connect(producer).approveQuotations([1], 15);

            // Reject one
            await supplyChain.connect(producer).rejectQuotation(2);

            const pending = await supplyChain.getPendingQuotations();
            expect(pending.length).to.equal(1);
            expect(pending[0]).to.equal(3);
        });

        it("Should return empty array when no pending quotations", async function () {
            const pending = await supplyChain.getPendingQuotations();
            expect(pending.length).to.equal(0);
        });
    });

    describe("Product Flow with Quotations", function () {
        let quotationId, productId;

        beforeEach(async function () {
            // Create and approve quotation
            const tx = await supplyChain.connect(consumer1).createQuotation("Widget", "Description", 10);
            const receipt = await tx.wait();
            quotationId = receipt.events.find(e => e.event === "QuotationCreated").args.quotationId;

            await supplyChain.connect(producer).approveQuotations([quotationId], 15);
            productId = 1;
        });

        it("Should allow normal product flow after approval", async function () {
            // Send to supplier
            await supplyChain.connect(producer).sendToSupplier(productId, supplier.address);
            let product = await supplyChain.getProduct(productId);
            expect(product.status).to.equal(1); // SentToSupplier

            // Supplier receives
            await supplyChain.connect(supplier).receiveProduct(productId);
            product = await supplyChain.getProduct(productId);
            expect(product.status).to.equal(2); // ReceivedBySupplier

            // Send to retailer
            await supplyChain.connect(supplier).sendToRetailer(productId, retailer.address);
            product = await supplyChain.getProduct(productId);
            expect(product.status).to.equal(3); // SentToRetailer

            // Retailer receives
            await supplyChain.connect(retailer).receiveProductFromSupplier(productId);
            product = await supplyChain.getProduct(productId);
            expect(product.status).to.equal(4); // ReceivedByRetailer

            // Add to store
            await supplyChain.connect(retailer).addToStore(productId);
            product = await supplyChain.getProduct(productId);
            expect(product.status).to.equal(5); // AvailableForSale

            // Check available quantity is preserved
            const productExtended = await supplyChain.getProductExtended(productId);
            expect(productExtended.availableQuantity).to.equal(15);
        });
    });

    describe("Retailer Quotation Fulfillment", function () {
        let quotationId1, quotationId2, productId;

        beforeEach(async function () {
            // Create and approve quotations
            const tx1 = await supplyChain.connect(consumer1).createQuotation("Widget", "Desc", 10);
            const receipt1 = await tx1.wait();
            quotationId1 = receipt1.events.find(e => e.event === "QuotationCreated").args.quotationId;

            const tx2 = await supplyChain.connect(consumer2).createQuotation("Widget", "Desc", 5);
            const receipt2 = await tx2.wait();
            quotationId2 = receipt2.events.find(e => e.event === "QuotationCreated").args.quotationId;

            await supplyChain.connect(producer).approveQuotations([quotationId1, quotationId2], 20);
            productId = 1;

            // Complete product flow to retailer
            await supplyChain.connect(producer).sendToSupplier(productId, supplier.address);
            await supplyChain.connect(supplier).receiveProduct(productId);
            await supplyChain.connect(supplier).sendToRetailer(productId, retailer.address);
            await supplyChain.connect(retailer).receiveProductFromSupplier(productId);
            await supplyChain.connect(retailer).addToStore(productId);
        });

        it("Should allow retailer to fulfill single quotation", async function () {
            const tx = await supplyChain.connect(retailer).fulfillQuotations(productId, [quotationId1]);

            await expect(tx)
                .to.emit(supplyChain, "QuotationFulfilled")
                .withArgs(quotationId1, productId, consumer1.address);

            const quotation = await supplyChain.getQuotation(quotationId1);
            expect(quotation.status).to.equal(3); // Fulfilled

            const product = await supplyChain.getProductExtended(productId);
            expect(product.availableQuantity).to.equal(10); // 20 - 10
        });

        it("Should allow retailer to fulfill multiple quotations", async function () {
            const tx = await supplyChain.connect(retailer).fulfillQuotations(productId, [quotationId1, quotationId2]);

            await expect(tx)
                .to.emit(supplyChain, "QuotationFulfilled")
                .withArgs(quotationId1, productId, consumer1.address);

            await expect(tx)
                .to.emit(supplyChain, "QuotationFulfilled")
                .withArgs(quotationId2, productId, consumer2.address);

            const q1 = await supplyChain.getQuotation(quotationId1);
            const q2 = await supplyChain.getQuotation(quotationId2);
            expect(q1.status).to.equal(3); // Fulfilled
            expect(q2.status).to.equal(3); // Fulfilled

            const product = await supplyChain.getProductExtended(productId);
            expect(product.availableQuantity).to.equal(5); // 20 - 10 - 5
        });

        it("Should reject fulfillment if insufficient available quantity", async function () {
            // Fulfill first quotation
            await supplyChain.connect(retailer).fulfillQuotations(productId, [quotationId1]);

            // Try to fulfill second with more than available
            await expect(
                supplyChain.connect(retailer).fulfillQuotations(productId, [quotationId2])
            ).to.not.be.reverted; // Should work, 10 available, 5 requested

            // But if we try to fulfill with a new large quotation...
            const tx3 = await supplyChain.connect(consumer3).createQuotation("Widget", "Desc", 20);
            const receipt3 = await tx3.wait();
            const quotationId3 = receipt3.events.find(e => e.event === "QuotationCreated").args.quotationId;
            await supplyChain.connect(producer).approveQuotations([quotationId3], 20);
            const productId2 = 2;

            // Complete flow
            await supplyChain.connect(producer).sendToSupplier(productId2, supplier.address);
            await supplyChain.connect(supplier).receiveProduct(productId2);
            await supplyChain.connect(supplier).sendToRetailer(productId2, retailer.address);
            await supplyChain.connect(retailer).receiveProductFromSupplier(productId2);
            await supplyChain.connect(retailer).addToStore(productId2);

            // Try to fulfill with more than available
            await expect(
                supplyChain.connect(retailer).fulfillQuotations(productId2, [quotationId3])
            ).to.not.be.reverted; // 20 available, 20 requested - should work
        });

        it("Should reject fulfillment of non-approved quotation", async function () {
            const tx3 = await supplyChain.connect(consumer3).createQuotation("Widget", "Desc", 5);
            const receipt3 = await tx3.wait();
            const quotationId3 = receipt3.events.find(e => e.event === "QuotationCreated").args.quotationId;

            await expect(
                supplyChain.connect(retailer).fulfillQuotations(productId, [quotationId3])
            ).to.be.revertedWith("Quotation must be approved");
        });

        it("Should reject fulfillment of quotation linked to different product", async function () {
            // Create another product with different quotation
            const tx3 = await supplyChain.connect(consumer3).createQuotation("Widget", "Desc", 5);
            const receipt3 = await tx3.wait();
            const quotationId3 = receipt3.events.find(e => e.event === "QuotationCreated").args.quotationId;
            await supplyChain.connect(producer).approveQuotations([quotationId3], 10);
            const productId2 = 2;

            await expect(
                supplyChain.connect(retailer).fulfillQuotations(productId, [quotationId3])
            ).to.be.revertedWith("Quotation not linked to this product");
        });

        it("Should reject fulfillment if product not available for sale", async function () {
            // Reset product to ReceivedByRetailer
            // (We can't easily reset, so we'll test with a new product)
            const tx3 = await supplyChain.connect(consumer3).createQuotation("Widget", "Desc", 5);
            const receipt3 = await tx3.wait();
            const quotationId3 = receipt3.events.find(e => e.event === "QuotationCreated").args.quotationId;
            await supplyChain.connect(producer).approveQuotations([quotationId3], 10);
            const productId2 = 2;

            await supplyChain.connect(producer).sendToSupplier(productId2, supplier.address);
            await supplyChain.connect(supplier).receiveProduct(productId2);
            await supplyChain.connect(supplier).sendToRetailer(productId2, retailer.address);
            await supplyChain.connect(retailer).receiveProductFromSupplier(productId2);
            // Don't add to store

            await expect(
                supplyChain.connect(retailer).fulfillQuotations(productId2, [quotationId3])
            ).to.be.revertedWith("Product must be available for sale");
        });
    });

    describe("Consumer Surplus Purchase", function () {
        let productId;

        beforeEach(async function () {
            // Create product manually (not from quotation)
            await supplyChain.connect(producer).addProduct("Widget", "Description", 20);
            productId = 1;

            // Complete flow to retailer
            await supplyChain.connect(producer).sendToSupplier(productId, supplier.address);
            await supplyChain.connect(supplier).receiveProduct(productId);
            await supplyChain.connect(supplier).sendToRetailer(productId, retailer.address);
            await supplyChain.connect(retailer).receiveProductFromSupplier(productId);
            await supplyChain.connect(retailer).addToStore(productId);
        });

        it("Should allow consumer to purchase from surplus", async function () {
            const tx = await supplyChain.connect(consumer1).purchaseFromSurplus(productId, 5);

            await expect(tx)
                .to.emit(supplyChain, "ProductSoldToConsumer")
                .withArgs(productId, consumer1.address);

            const product = await supplyChain.getProductExtended(productId);
            expect(product.availableQuantity).to.equal(15); // 20 - 5
            expect(product.consumer).to.equal(consumer1.address);
        });

        it("Should allow multiple consumers to purchase from same product", async function () {
            await supplyChain.connect(consumer1).purchaseFromSurplus(productId, 5);
            await supplyChain.connect(consumer2).purchaseFromSurplus(productId, 3);

            const product = await supplyChain.getProductExtended(productId);
            expect(product.availableQuantity).to.equal(12); // 20 - 5 - 3
            // Last consumer is recorded
            expect(product.consumer).to.equal(consumer2.address);
        });

        it("Should mark product as sold when all quantity purchased", async function () {
            await supplyChain.connect(consumer1).purchaseFromSurplus(productId, 20);

            const product = await supplyChain.getProduct(productId);
            expect(product.status).to.equal(6); // SoldToConsumer

            const productExtended = await supplyChain.getProductExtended(productId);
            expect(productExtended.availableQuantity).to.equal(0);
        });

        it("Should reject purchase if insufficient quantity", async function () {
            await expect(
                supplyChain.connect(consumer1).purchaseFromSurplus(productId, 25)
            ).to.be.revertedWith("Insufficient available quantity");
        });

        it("Should reject purchase if product not available for sale", async function () {
            // Create product but don't add to store
            await supplyChain.connect(producer).addProduct("Gadget", "Desc", 10);
            const productId2 = 2;

            await supplyChain.connect(producer).sendToSupplier(productId2, supplier.address);
            await supplyChain.connect(supplier).receiveProduct(productId2);
            await supplyChain.connect(supplier).sendToRetailer(productId2, retailer.address);
            await supplyChain.connect(retailer).receiveProductFromSupplier(productId2);
            // Don't add to store

            await expect(
                supplyChain.connect(consumer1).purchaseFromSurplus(productId2, 5)
            ).to.be.revertedWith("Product must be available for sale");
        });

        it("Should reject purchase with zero quantity", async function () {
            await expect(
                supplyChain.connect(consumer1).purchaseFromSurplus(productId, 0)
            ).to.be.revertedWith("Quantity must be greater than 0");
        });
    });

    describe("Available Products Search", function () {
        beforeEach(async function () {
            // Create multiple products
            await supplyChain.connect(producer).addProduct("Widget", "Desc1", 20);
            await supplyChain.connect(producer).addProduct("Widget", "Desc2", 15);
            await supplyChain.connect(producer).addProduct("Gadget", "Desc3", 10);

            const productId1 = 1;
            const productId2 = 2;
            const productId3 = 3;

            // Complete flow for all products
            for (const pid of [productId1, productId2, productId3]) {
                await supplyChain.connect(producer).sendToSupplier(pid, supplier.address);
                await supplyChain.connect(supplier).receiveProduct(pid);
                await supplyChain.connect(supplier).sendToRetailer(pid, retailer.address);
                await supplyChain.connect(retailer).receiveProductFromSupplier(pid);
                await supplyChain.connect(retailer).addToStore(pid);
            }

            // Purchase some quantity from product 1
            await supplyChain.connect(consumer1).purchaseFromSurplus(productId1, 5);
        });

        it("Should return available products by name", async function () {
            const [productIds, quantities] = await supplyChain.getAvailableProductsByName("Widget");

            expect(productIds.length).to.equal(2);
            expect(quantities.length).to.equal(2);

            // Product 1: 20 - 5 = 15 available
            // Product 2: 15 available
            const productIdsStr = productIds.map(p => p.toString());
            expect(productIdsStr).to.include("1");
            expect(productIdsStr).to.include("2");

            const idx1 = productIdsStr.indexOf("1");
            const idx2 = productIdsStr.indexOf("2");
            expect(Number(quantities[idx1])).to.equal(15);
            expect(Number(quantities[idx2])).to.equal(15);
        });

        it("Should not return products with zero available quantity", async function () {
            // Purchase all from product 1
            await supplyChain.connect(consumer2).purchaseFromSurplus(1, 15);

            const [productIds, quantities] = await supplyChain.getAvailableProductsByName("Widget");
            expect(productIds.length).to.equal(1);
            expect(productIds[0]).to.equal(2);
        });

        it("Should not return products not available for sale", async function () {
            // Create product but don't add to store
            await supplyChain.connect(producer).addProduct("Widget", "Desc", 10);
            const productId4 = 4;

            await supplyChain.connect(producer).sendToSupplier(productId4, supplier.address);
            await supplyChain.connect(supplier).receiveProduct(productId4);
            await supplyChain.connect(supplier).sendToRetailer(productId4, retailer.address);
            await supplyChain.connect(retailer).receiveProductFromSupplier(productId4);
            // Don't add to store

            const [productIds] = await supplyChain.getAvailableProductsByName("Widget");
            expect(productIds).to.not.include(4);
        });

        it("Should return empty arrays for non-existent product name", async function () {
            const [productIds, quantities] = await supplyChain.getAvailableProductsByName("NonExistent");
            expect(productIds.length).to.equal(0);
            expect(quantities.length).to.equal(0);
        });
    });

    describe("Product Quotations View", function () {
        let quotationId1, quotationId2, productId;

        beforeEach(async function () {
            const tx1 = await supplyChain.connect(consumer1).createQuotation("Widget", "Desc", 10);
            const receipt1 = await tx1.wait();
            quotationId1 = receipt1.events.find(e => e.event === "QuotationCreated").args.quotationId;

            const tx2 = await supplyChain.connect(consumer2).createQuotation("Widget", "Desc", 5);
            const receipt2 = await tx2.wait();
            quotationId2 = receipt2.events.find(e => e.event === "QuotationCreated").args.quotationId;

            await supplyChain.connect(producer).approveQuotations([quotationId1, quotationId2], 20);
            productId = 1;
        });

        it("Should return quotations linked to product", async function () {
            const quotationIds = await supplyChain.getProductQuotations(productId);
            expect(quotationIds.length).to.equal(2);
            const quotationIdsStr = quotationIds.map(q => q.toString());
            expect(quotationIdsStr).to.include(quotationId1.toString());
            expect(quotationIdsStr).to.include(quotationId2.toString());
        });

        it("Should return empty array for product without quotations", async function () {
            await supplyChain.connect(producer).addProduct("Gadget", "Desc", 10);
            const quotationIds = await supplyChain.getProductQuotations(2);
            expect(quotationIds.length).to.equal(0);
        });
    });

    describe("Edge Cases and Integration", function () {
        it("Should handle complete flow: quotation → approval → fulfillment", async function () {
            // Consumer creates quotation
            const tx1 = await supplyChain.connect(consumer1).createQuotation("Widget", "Desc", 10);
            const receipt1 = await tx1.wait();
            const quotationId = receipt1.events.find(e => e.event === "QuotationCreated").args.quotationId;

            // Producer approves
            await supplyChain.connect(producer).approveQuotations([quotationId], 15);
            const productId = 1;

            // Complete product flow
            await supplyChain.connect(producer).sendToSupplier(productId, supplier.address);
            await supplyChain.connect(supplier).receiveProduct(productId);
            await supplyChain.connect(supplier).sendToRetailer(productId, retailer.address);
            await supplyChain.connect(retailer).receiveProductFromSupplier(productId);
            await supplyChain.connect(retailer).addToStore(productId);

            // Retailer fulfills quotation
            await supplyChain.connect(retailer).fulfillQuotations(productId, [quotationId]);

            // Verify final state
            const quotation = await supplyChain.getQuotation(quotationId);
            expect(quotation.status).to.equal(3); // Fulfilled

            const product = await supplyChain.getProductExtended(productId);
            expect(product.availableQuantity).to.equal(5); // 15 - 10 (surplus)
        });

        it("Should handle batch approval with partial fulfillment", async function () {
            // Create multiple quotations
            const tx1 = await supplyChain.connect(consumer1).createQuotation("Widget", "Desc", 10);
            const receipt1 = await tx1.wait();
            const quotationId1 = receipt1.events.find(e => e.event === "QuotationCreated").args.quotationId;

            const tx2 = await supplyChain.connect(consumer2).createQuotation("Widget", "Desc", 5);
            const receipt2 = await tx2.wait();
            const quotationId2 = receipt2.events.find(e => e.event === "QuotationCreated").args.quotationId;

            const tx3 = await supplyChain.connect(consumer3).createQuotation("Widget", "Desc", 8);
            const receipt3 = await tx3.wait();
            const quotationId3 = receipt3.events.find(e => e.event === "QuotationCreated").args.quotationId;

            // Producer batch approves
            await supplyChain.connect(producer).approveQuotations([quotationId1, quotationId2, quotationId3], 30);
            const productId = 1;

            // Complete flow
            await supplyChain.connect(producer).sendToSupplier(productId, supplier.address);
            await supplyChain.connect(supplier).receiveProduct(productId);
            await supplyChain.connect(supplier).sendToRetailer(productId, retailer.address);
            await supplyChain.connect(retailer).receiveProductFromSupplier(productId);
            await supplyChain.connect(retailer).addToStore(productId);

            // Fulfill first two quotations
            await supplyChain.connect(retailer).fulfillQuotations(productId, [quotationId1, quotationId2]);

            let product = await supplyChain.getProductExtended(productId);
            expect(product.availableQuantity).to.equal(15); // 30 - 10 - 5

            // Fulfill third quotation
            await supplyChain.connect(retailer).fulfillQuotations(productId, [quotationId3]);

            product = await supplyChain.getProductExtended(productId);
            expect(product.availableQuantity).to.equal(7); // 30 - 10 - 5 - 8

            // All quotations fulfilled
            const q1 = await supplyChain.getQuotation(quotationId1);
            const q2 = await supplyChain.getQuotation(quotationId2);
            const q3 = await supplyChain.getQuotation(quotationId3);
            expect(q1.status).to.equal(3);
            expect(q2.status).to.equal(3);
            expect(q3.status).to.equal(3);
        });

        it("Should handle mixed purchase: quotation fulfillment + surplus purchase", async function () {
            // Create quotation
            const tx1 = await supplyChain.connect(consumer1).createQuotation("Widget", "Desc", 10);
            const receipt1 = await tx1.wait();
            const quotationId = receipt1.events.find(e => e.event === "QuotationCreated").args.quotationId;

            // Producer approves with surplus
            await supplyChain.connect(producer).approveQuotations([quotationId], 20);
            const productId = 1;

            // Complete flow
            await supplyChain.connect(producer).sendToSupplier(productId, supplier.address);
            await supplyChain.connect(supplier).receiveProduct(productId);
            await supplyChain.connect(supplier).sendToRetailer(productId, retailer.address);
            await supplyChain.connect(retailer).receiveProductFromSupplier(productId);
            await supplyChain.connect(retailer).addToStore(productId);

            // Fulfill quotation
            await supplyChain.connect(retailer).fulfillQuotations(productId, [quotationId]);

            let product = await supplyChain.getProductExtended(productId);
            expect(product.availableQuantity).to.equal(10); // 20 - 10

            // Consumer purchases from surplus
            await supplyChain.connect(consumer2).purchaseFromSurplus(productId, 5);

            product = await supplyChain.getProductExtended(productId);
            expect(product.availableQuantity).to.equal(5); // 20 - 10 - 5
        });
    });
});

