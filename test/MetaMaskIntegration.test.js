const { ethers } = require("hardhat");
const { expect } = require("chai");

/**
 * MetaMask Integration Tests
 * 
 * These tests verify that the Hardhat network is properly configured
 * for MetaMask integration and that transactions work correctly with
 * multiple accounts (simulating MetaMask wallet switching).
 */

describe("🦊 MetaMask Integration Tests", function () {
  let owner, producer1, producer2, supplier1, supplier2, retailer1, retailer2, consumer1, consumer2;
  let supplyChain;
  const HARDHAT_CHAIN_ID = 31337;

  beforeEach(async function () {
    // Get multiple signers to simulate different MetaMask accounts
    [owner, producer1, producer2, supplier1, supplier2, retailer1, retailer2, consumer1, consumer2] = 
      await ethers.getSigners();

    // Deploy contract
    const SupplyChain = await ethers.getContractFactory("SupplyChain");
    supplyChain = await SupplyChain.deploy();
    await supplyChain.deployed();

    // Register roles (simulating different MetaMask accounts)
    await supplyChain.registerProducer(producer1.address);
    await supplyChain.registerProducer(producer2.address);
    await supplyChain.registerSupplier(supplier1.address);
    await supplyChain.registerSupplier(supplier2.address);
    await supplyChain.registerRetailer(retailer1.address);
    await supplyChain.registerRetailer(retailer2.address);
    await supplyChain.registerConsumer(consumer1.address);
    await supplyChain.registerConsumer(consumer2.address);
  });

  describe("Network Configuration", function () {
    it("Should have correct chain ID (31337) for Hardhat network", async function () {
      const network = await ethers.provider.getNetwork();
      expect(network.chainId).to.equal(HARDHAT_CHAIN_ID);
      console.log(`✅ Network Chain ID: ${network.chainId} (expected: ${HARDHAT_CHAIN_ID})`);
    });

    it("Should be able to query network information", async function () {
      const network = await ethers.provider.getNetwork();
      expect(network).to.have.property("chainId");
      expect(network).to.have.property("name");
      console.log(`✅ Network Name: ${network.name}`);
      console.log(`✅ Network Chain ID: ${network.chainId}`);
    });

    it("Should have multiple accounts available (simulating MetaMask accounts)", async function () {
      const signers = await ethers.getSigners();
      expect(signers.length).to.be.at.least(9); // At least 9 accounts for our test
      console.log(`✅ Available accounts: ${signers.length}`);
    });
  });

  describe("Multi-Account Transactions (MetaMask Account Switching)", function () {
    it("Should allow producer1 to create a product", async function () {
      const tx = await supplyChain.connect(producer1).addProduct(
        "Test Product 1",
        "Description 1",
        100
      );
      const receipt = await tx.wait();
      
      expect(receipt.status).to.equal(1);
      
      const product = await supplyChain.getProduct(1);
      expect(product.producer).to.equal(producer1.address);
      expect(product.name).to.equal("Test Product 1");
      
      console.log(`✅ Producer1 (${producer1.address.slice(0, 10)}...) created product`);
    });

    it("Should allow producer2 to create a separate product (different MetaMask account)", async function () {
      // Producer1 creates first product
      await supplyChain.connect(producer1).addProduct("Product 1", "Desc 1", 50);
      
      // Producer2 creates second product (simulating account switch)
      const tx = await supplyChain.connect(producer2).addProduct(
        "Product 2",
        "Desc 2",
        75
      );
      const receipt = await tx.wait();
      
      expect(receipt.status).to.equal(1);
      
      const product1 = await supplyChain.getProduct(1);
      const product2 = await supplyChain.getProduct(2);
      
      expect(product1.producer).to.equal(producer1.address);
      expect(product2.producer).to.equal(producer2.address);
      
      console.log(`✅ Producer2 (${producer2.address.slice(0, 10)}...) created separate product`);
    });

    it("Should maintain correct ownership when switching between accounts", async function () {
      // Producer1 creates product
      await supplyChain.connect(producer1).addProduct("Product A", "Desc A", 100);
      
      // Switch to producer2 and create another product
      await supplyChain.connect(producer2).addProduct("Product B", "Desc B", 200);
      
      // Verify ownership is maintained
      const productA = await supplyChain.getProduct(1);
      const productB = await supplyChain.getProduct(2);
      
      expect(productA.producer).to.equal(producer1.address);
      expect(productB.producer).to.equal(producer2.address);
      expect(productA.producer).to.not.equal(productB.producer);
      
      console.log(`✅ Account ownership correctly maintained after switching`);
    });
  });

  describe("Full Supply Chain Flow with Multiple Accounts", function () {
    let productId;

    beforeEach(async function () {
      // Producer1 creates a product
      const tx = await supplyChain.connect(producer1).addProduct(
        "MetaMask Test Product",
        "Testing MetaMask integration",
        50
      );
      const receipt = await tx.wait();
      const event = receipt.events.find((e) => e.event === "ProductCreated");
      productId = event.args.productId;
    });

    it("Should complete full supply chain with producer1 → supplier1 → retailer1", async function () {
      // Producer1 sends to supplier1
      await expect(
        supplyChain.connect(producer1).sendToSupplier(productId, supplier1.address)
      ).to.emit(supplyChain, "ProductSentToSupplier");

      // Supplier1 receives
      await expect(
        supplyChain.connect(supplier1).receiveProduct(productId)
      ).to.emit(supplyChain, "ProductReceivedBySupplier");

      // Supplier1 sends to retailer1
      await expect(
        supplyChain.connect(supplier1).sendToRetailer(productId, retailer1.address)
      ).to.emit(supplyChain, "ProductSentToRetailer");

      // Retailer1 receives
      await expect(
        supplyChain.connect(retailer1).receiveProductFromSupplier(productId)
      ).to.emit(supplyChain, "ProductReceivedByRetailer");

      // Retailer1 adds to store
      await expect(
        supplyChain.connect(retailer1).addToStore(productId)
      ).to.emit(supplyChain, "ProductAddedToStore");

      // Retailer1 sells to consumer1
      await expect(
        supplyChain.connect(retailer1).sellToConsumer(productId, consumer1.address, 50)
      ).to.emit(supplyChain, "ProductSoldToConsumer");

      const finalProduct = await supplyChain.getProduct(productId);
      expect(finalProduct.status).to.equal(6); // SoldToConsumer
      expect(finalProduct.consumer).to.equal(consumer1.address);

      console.log(`✅ Full supply chain completed with multiple accounts`);
    });

    it("Should handle account switching mid-flow (producer1 → supplier2 → retailer2)", async function () {
      // Producer1 sends to supplier2 (different account)
      await supplyChain.connect(producer1).sendToSupplier(productId, supplier2.address);

      // Supplier2 receives (switched account)
      await supplyChain.connect(supplier2).receiveProduct(productId);

      // Supplier2 sends to retailer2 (different account)
      await supplyChain.connect(supplier2).sendToRetailer(productId, retailer2.address);

      // Retailer2 receives (switched account)
      await supplyChain.connect(retailer2).receiveProductFromSupplier(productId);

      const product = await supplyChain.getProduct(productId);
      expect(product.supplier).to.equal(supplier2.address);
      expect(product.retailer).to.equal(retailer2.address);

      console.log(`✅ Account switching mid-flow handled correctly`);
    });
  });

  describe("Access Control with Multiple Accounts", function () {
    let productId;

    beforeEach(async function () {
      const tx = await supplyChain.connect(producer1).addProduct("Test", "Desc", 100);
      const receipt = await tx.wait();
      const event = receipt.events.find((e) => e.event === "ProductCreated");
      productId = event.args.productId;
    });

    it("Should prevent producer2 from sending producer1's product", async function () {
      await expect(
        supplyChain.connect(producer2).sendToSupplier(productId, supplier1.address)
      ).to.be.revertedWith("You are not the producer of this product");
    });

    it("Should prevent supplier2 from receiving product assigned to supplier1", async function () {
      await supplyChain.connect(producer1).sendToSupplier(productId, supplier1.address);

      await expect(
        supplyChain.connect(supplier2).receiveProduct(productId)
      ).to.be.revertedWith("You are not the supplier of this product");
    });

    it("Should prevent retailer2 from receiving product assigned to retailer1", async function () {
      await supplyChain.connect(producer1).sendToSupplier(productId, supplier1.address);
      await supplyChain.connect(supplier1).receiveProduct(productId);
      await supplyChain.connect(supplier1).sendToRetailer(productId, retailer1.address);

      await expect(
        supplyChain.connect(retailer2).receiveProductFromSupplier(productId)
      ).to.be.revertedWith("You are not the retailer of this product");
    });

    it("Should allow correct account to perform actions", async function () {
      // Producer1 should be able to send their own product
      await expect(
        supplyChain.connect(producer1).sendToSupplier(productId, supplier1.address)
      ).to.emit(supplyChain, "ProductSentToSupplier");

      // Supplier1 should be able to receive
      await expect(
        supplyChain.connect(supplier1).receiveProduct(productId)
      ).to.emit(supplyChain, "ProductReceivedBySupplier");
    });
  });

  describe("Transaction Verification", function () {
    it("Should return correct transaction receipts", async function () {
      const tx = await supplyChain.connect(producer1).addProduct("Test", "Desc", 100);
      const receipt = await tx.wait();

      expect(receipt).to.have.property("status");
      expect(receipt).to.have.property("transactionHash");
      expect(receipt).to.have.property("gasUsed");
      expect(receipt.status).to.equal(1); // Success

      console.log(`✅ Transaction hash: ${receipt.transactionHash}`);
      console.log(`✅ Gas used: ${receipt.gasUsed.toString()}`);
    });

    it("Should emit correct events from transactions", async function () {
      const tx = await supplyChain.connect(producer1).addProduct("Event Test", "Desc", 50);
      const receipt = await tx.wait();

      const event = receipt.events.find((e) => e.event === "ProductCreated");
      expect(event).to.not.be.undefined;
      expect(event.args.productId).to.equal(1);
      expect(event.args.name).to.equal("Event Test");
      expect(event.args.producer).to.equal(producer1.address);
    });

    it("Should track gas usage for different operations", async function () {
      // Create first product
      const addProductTx1 = await supplyChain.connect(producer1).addProduct("Gas Test 1", "Desc", 100);
      const addProductReceipt1 = await addProductTx1.wait();
      
      // Create second product for comparison
      const addProductTx2 = await supplyChain.connect(producer1).addProduct("Gas Test 2", "Desc", 200);
      const addProductReceipt2 = await addProductTx2.wait();

      // Get product IDs from events
      const event1 = addProductReceipt1.events.find((e) => e.event === "ProductCreated");
      const event2 = addProductReceipt2.events.find((e) => e.event === "ProductCreated");
      const productId1 = event1.args.productId;
      const productId2 = event2.args.productId;

      // Verify products are in Created status before sending
      const product1Before = await supplyChain.getProduct(productId1);
      expect(product1Before.status).to.equal(0); // Created status

      // Send first product to supplier (different operation)
      const sendTx = await supplyChain.connect(producer1).sendToSupplier(productId1, supplier1.address);
      const sendReceipt = await sendTx.wait();

      expect(addProductReceipt1.gasUsed).to.be.gt(0);
      expect(addProductReceipt2.gasUsed).to.be.gt(0);
      expect(sendReceipt.gasUsed).to.be.gt(0);

      console.log(`✅ Add Product Gas: ${addProductReceipt1.gasUsed.toString()}`);
      console.log(`✅ Add Product 2 Gas: ${addProductReceipt2.gasUsed.toString()}`);
      console.log(`✅ Send to Supplier Gas: ${sendReceipt.gasUsed.toString()}`);
    });
  });

  describe("Account Balance and Funding", function () {
    it("Should have funded accounts (simulating MetaMask with ETH)", async function () {
      const producer1Balance = await ethers.provider.getBalance(producer1.address);
      const supplier1Balance = await ethers.provider.getBalance(supplier1.address);
      const retailer1Balance = await ethers.provider.getBalance(retailer1.address);

      expect(producer1Balance).to.be.gt(0);
      expect(supplier1Balance).to.be.gt(0);
      expect(retailer1Balance).to.be.gt(0);

      console.log(`✅ Producer1 balance: ${ethers.utils.formatEther(producer1Balance)} ETH`);
      console.log(`✅ Supplier1 balance: ${ethers.utils.formatEther(supplier1Balance)} ETH`);
      console.log(`✅ Retailer1 balance: ${ethers.utils.formatEther(retailer1Balance)} ETH`);
    });

    it("Should be able to send transactions (accounts have sufficient balance)", async function () {
      const initialBalance = await ethers.provider.getBalance(producer1.address);
      
      const tx = await supplyChain.connect(producer1).addProduct("Balance Test", "Desc", 100);
      const receipt = await tx.wait();
      
      const finalBalance = await ethers.provider.getBalance(producer1.address);
      const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);
      
      // Final balance should be initial minus gas
      expect(finalBalance).to.be.closeTo(
        initialBalance.sub(gasUsed),
        ethers.utils.parseEther("0.001") // Allow small variance
      );
    });
  });

  describe("Concurrent Transactions from Different Accounts", function () {
    it("Should handle multiple products from different producers simultaneously", async function () {
      // Create products from different accounts concurrently
      const [tx1, tx2, tx3] = await Promise.all([
        supplyChain.connect(producer1).addProduct("Product 1", "Desc 1", 100),
        supplyChain.connect(producer2).addProduct("Product 2", "Desc 2", 200),
        supplyChain.connect(producer1).addProduct("Product 3", "Desc 3", 300),
      ]);

      const [receipt1, receipt2, receipt3] = await Promise.all([
        tx1.wait(),
        tx2.wait(),
        tx3.wait(),
      ]);

      expect(receipt1.status).to.equal(1);
      expect(receipt2.status).to.equal(1);
      expect(receipt3.status).to.equal(1);

      // Get product IDs and producers from events (since transactions may execute in different order)
      const event1 = receipt1.events.find((e) => e.event === "ProductCreated");
      const event2 = receipt2.events.find((e) => e.event === "ProductCreated");
      const event3 = receipt3.events.find((e) => e.event === "ProductCreated");
      
      // Match products to their creators based on event data
      const products = [
        { id: event1.args.productId, producer: event1.args.producer, name: "Product 1" },
        { id: event2.args.productId, producer: event2.args.producer, name: "Product 2" },
        { id: event3.args.productId, producer: event3.args.producer, name: "Product 3" },
      ];

      // Find products by producer
      const producer1Products = products.filter(p => p.producer.toLowerCase() === producer1.address.toLowerCase());
      const producer2Products = products.filter(p => p.producer.toLowerCase() === producer2.address.toLowerCase());

      // Verify producer1 created 2 products (Product 1 and Product 3)
      expect(producer1Products.length).to.equal(2);
      // Verify producer2 created 1 product (Product 2)
      expect(producer2Products.length).to.equal(1);

      // Verify all products exist and have correct data
      for (const p of products) {
        const product = await supplyChain.getProduct(p.id);
        expect(product.producer).to.equal(p.producer);
        expect(product.name).to.equal(p.name);
      }

      console.log(`✅ Concurrent transactions from multiple accounts handled correctly`);
      products.forEach(p => {
        console.log(`   Product ${p.id} (${p.name}) by ${p.producer.slice(0, 10)}...`);
      });
    });
  });

  describe("Network Compatibility", function () {
    it("Should support standard Ethereum JSON-RPC methods", async function () {
      // Test block number
      const blockNumber = await ethers.provider.getBlockNumber();
      expect(blockNumber).to.be.a("number");
      expect(blockNumber).to.be.at.least(0);

      // Test block
      const block = await ethers.provider.getBlock(blockNumber);
      expect(block).to.have.property("number");
      expect(block).to.have.property("timestamp");

      console.log(`✅ Current block number: ${blockNumber}`);
    });

    it("Should support transaction queries", async function () {
      const tx = await supplyChain.connect(producer1).addProduct("Query Test", "Desc", 100);
      const receipt = await tx.wait();

      // Query transaction
      const txData = await ethers.provider.getTransaction(receipt.transactionHash);
      expect(txData).to.have.property("hash");
      expect(txData.hash).to.equal(receipt.transactionHash);

      console.log(`✅ Transaction query successful`);
    });
  });

});

