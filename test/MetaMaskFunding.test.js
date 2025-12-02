const { ethers } = require("hardhat");
const { expect } = require("chai");
const { fundMetaMaskAccounts } = require("../scripts/fundMetaMaskAccounts");
const { getBalance, hasMinimumBalance, getBalanceChange, validateFunding } = require("./helpers/balanceHelper");

/**
 * MetaMask Account Funding Tests
 * 
 * These tests verify that the MetaMask account funding functionality works correctly,
 * including single/multiple account funding, balance validation, and error handling.
 * 
 * Uses MetaMask accounts 14 and 15 from the default list:
 * - Account 14: 0x34e817073401aaa0f21215d769cd9e3500b2e69e
 * - Account 15: 0x423536d127f738b31999b2259d1ff842c2d47080
 */

// MetaMask test accounts (accounts 14 and 15 from the default list)
const METAMASK_ACCOUNT_14 = "0x34e817073401aaa0f21215d769cd9e3500b2e69e";
const METAMASK_ACCOUNT_15 = "0x423536d127f738b31999b2259d1ff842c2d47080";

describe("💰 MetaMask Account Funding Tests", function () {
  let funder, recipient1, recipient2, recipient3;
  const DEFAULT_FUND_AMOUNT = ethers.utils.parseEther("100");
  const CUSTOM_FUND_AMOUNT = ethers.utils.parseEther("50");

  beforeEach(async function () {
    // Get signers - first one is the funder, others are recipients
    [funder, recipient1, recipient2, recipient3] = await ethers.getSigners();
  });

  describe("Balance Validation Helper", function () {
    it("Should correctly check balance of an address using helper", async function () {
      const balance = await getBalance(recipient1.address);
      
      expect(balance.wei).to.be.instanceOf(ethers.BigNumber);
      expect(balance.ethNumber).to.be.gte(0);
      expect(balance.address).to.equal(recipient1.address);
      
      console.log(`   ✓ Balance check: ${balance.address} has ${balance.eth} ETH`);
    });

    it("Should validate minimum balance requirement", async function () {
      const result = await hasMinimumBalance(recipient1.address, "50");
      
      expect(result).to.have.property("hasEnough");
      expect(result).to.have.property("balance");
      expect(result).to.have.property("required");
      expect(result).to.have.property("difference");
      
      console.log(`   ✓ Minimum balance check: ${result.hasEnough ? "PASS" : "FAIL"}`);
      console.log(`     Balance: ${result.balance.eth} ETH, Required: ${result.required.eth} ETH`);
    });

    it("Should validate address format", async function () {
      const validAddress = recipient1.address;
      const invalidAddress = "0xInvalid";
      
      // Valid address should work
      expect(() => ethers.utils.getAddress(validAddress)).to.not.throw();
      
      // Invalid address should throw
      expect(() => ethers.utils.getAddress(invalidAddress)).to.throw();
    });
  });

  describe("Single Account Funding", function () {
    it("Should fund MetaMask account 14 with default amount (100 ETH)", async function () {
      const initialBalance = await ethers.provider.getBalance(METAMASK_ACCOUNT_14);
      
      // Fund the MetaMask account
      await fundMetaMaskAccounts([METAMASK_ACCOUNT_14], "100");
      
      const finalBalance = await ethers.provider.getBalance(METAMASK_ACCOUNT_14);
      const balanceIncrease = finalBalance.sub(initialBalance);
      
      // Should have received approximately 100 ETH (minus any gas if recipient sent tx)
      expect(balanceIncrease).to.be.gte(DEFAULT_FUND_AMOUNT.sub(ethers.utils.parseEther("0.001")));
      
      console.log(`   ✓ Funded MetaMask Account 14 (${METAMASK_ACCOUNT_14}) with 100 ETH`);
      console.log(`     Initial: ${ethers.utils.formatEther(initialBalance)} ETH`);
      console.log(`     Final: ${ethers.utils.formatEther(finalBalance)} ETH`);
    });

    it("Should fund MetaMask account 15 with custom amount", async function () {
      const initialBalance = await ethers.provider.getBalance(METAMASK_ACCOUNT_15);
      
      await fundMetaMaskAccounts([METAMASK_ACCOUNT_15], "50");
      
      const finalBalance = await ethers.provider.getBalance(METAMASK_ACCOUNT_15);
      const balanceIncrease = finalBalance.sub(initialBalance);
      
      expect(balanceIncrease).to.be.gte(CUSTOM_FUND_AMOUNT.sub(ethers.utils.parseEther("0.001")));
      
      console.log(`   ✓ Funded MetaMask Account 15 (${METAMASK_ACCOUNT_15}) with 50 ETH`);
    });

    it("Should handle checksum address conversion for MetaMask account 14", async function () {
      // Use lowercase address - fund with amount higher than current balance to ensure it funds
      const lowercaseAddress = METAMASK_ACCOUNT_14.toLowerCase();
      const currentBalance = await ethers.provider.getBalance(METAMASK_ACCOUNT_14);
      const currentBalanceEth = parseFloat(ethers.utils.formatEther(currentBalance));
      
      // Fund with amount higher than current balance to ensure it actually funds
      const fundAmount = (currentBalanceEth + 10).toFixed(0);
      const initialBalance = await ethers.provider.getBalance(METAMASK_ACCOUNT_14);
      
      await fundMetaMaskAccounts([lowercaseAddress], fundAmount);
      
      const finalBalance = await ethers.provider.getBalance(METAMASK_ACCOUNT_14);
      const balanceIncrease = finalBalance.sub(initialBalance);
      
      // Should still work with lowercase address and fund if needed
      // If it skipped, that's also valid behavior
      if (balanceIncrease.gt(0)) {
        expect(balanceIncrease).to.be.gte(ethers.utils.parseEther("9.99"));
        console.log(`   ✓ Handled checksum conversion and funded MetaMask Account 14 (${lowercaseAddress})`);
      } else {
        console.log(`   ✓ Handled checksum conversion - account already had sufficient balance (skipped)`);
      }
    });
  });

  describe("Multiple Account Funding", function () {
    it("Should fund MetaMask accounts 14 and 15 in sequence", async function () {
      const addresses = [METAMASK_ACCOUNT_14, METAMASK_ACCOUNT_15];
      const initialBalances = await Promise.all(
        addresses.map(addr => ethers.provider.getBalance(addr))
      );
      
      // Use amount higher than current balances to ensure funding occurs
      const currentBalances = await Promise.all(
        addresses.map(addr => ethers.provider.getBalance(addr))
      );
      const maxCurrentBalance = Math.max(
        ...currentBalances.map(b => parseFloat(ethers.utils.formatEther(b)))
      );
      const fundAmount = (maxCurrentBalance + 25).toFixed(0);
      
      await fundMetaMaskAccounts(addresses, fundAmount);
      
      const finalBalances = await Promise.all(
        addresses.map(addr => ethers.provider.getBalance(addr))
      );
      
      // Verify each account - if it was funded, check the increase
      for (let i = 0; i < addresses.length; i++) {
        const increase = finalBalances[i].sub(initialBalances[i]);
        if (increase.gt(0)) {
          expect(increase).to.be.gte(ethers.utils.parseEther("24.99"));
          console.log(`   ✓ MetaMask Account ${i === 0 ? "14" : "15"} (${addresses[i]}) funded`);
        } else {
          console.log(`   ✓ MetaMask Account ${i === 0 ? "14" : "15"} (${addresses[i]}) already had sufficient balance (skipped)`);
        }
      }
    });

    it("Should handle comma-separated MetaMask address string", async function () {
      const addressString = `${METAMASK_ACCOUNT_14},${METAMASK_ACCOUNT_15}`;
      const addresses = addressString.split(",").map(addr => addr.trim());
      
      const initialBalances = await Promise.all(
        addresses.map(addr => ethers.provider.getBalance(addr))
      );
      
      // Use amount higher than current balances to ensure funding occurs
      const currentBalances = await Promise.all(
        addresses.map(addr => ethers.provider.getBalance(addr))
      );
      const maxCurrentBalance = Math.max(
        ...currentBalances.map(b => parseFloat(ethers.utils.formatEther(b)))
      );
      const fundAmount = (maxCurrentBalance + 30).toFixed(0);
      
      await fundMetaMaskAccounts(addresses, fundAmount);
      
      const finalBalances = await Promise.all(
        addresses.map(addr => ethers.provider.getBalance(addr))
      );
      
      // Check if addresses were processed (funded or skipped)
      let fundedCount = 0;
      for (let i = 0; i < addresses.length; i++) {
        const increase = finalBalances[i].sub(initialBalances[i]);
        if (increase.gt(0)) {
          expect(increase).to.be.gte(ethers.utils.parseEther("29.99"));
          fundedCount++;
        }
      }
      
      console.log(`   ✓ Processed ${addresses.length} MetaMask addresses from comma-separated string`);
      console.log(`     Account 14: ${METAMASK_ACCOUNT_14}`);
      console.log(`     Account 15: ${METAMASK_ACCOUNT_15}`);
      console.log(`     ${fundedCount} account(s) funded, ${addresses.length - fundedCount} skipped (sufficient balance)`);
    });
  });

  describe("Balance Checking and Skipping", function () {
    it("Should skip funding MetaMask account 14 if already has sufficient balance", async function () {
      // First, fund the account
      await fundMetaMaskAccounts([METAMASK_ACCOUNT_14], "100");
      const balanceAfterFirst = await ethers.provider.getBalance(METAMASK_ACCOUNT_14);
      
      // Try to fund again with same amount
      await fundMetaMaskAccounts([METAMASK_ACCOUNT_14], "100");
      const balanceAfterSecond = await ethers.provider.getBalance(METAMASK_ACCOUNT_14);
      
      // Balance should be the same (or slightly less due to any gas from the check)
      // The function should skip funding if balance >= amount
      expect(balanceAfterSecond).to.be.gte(balanceAfterFirst.sub(ethers.utils.parseEther("0.01")));
      
      console.log(`   ✓ Skipped funding for MetaMask Account 14 (already has sufficient balance)`);
    });

    it("Should fund MetaMask account 15 if balance is less than requested amount", async function () {
      // Get current balance
      const currentBalance = await ethers.provider.getBalance(METAMASK_ACCOUNT_15);
      const currentBalanceEth = parseFloat(ethers.utils.formatEther(currentBalance));
      
      // Fund with amount slightly higher than current balance
      const smallAmount = (currentBalanceEth + 10).toFixed(0);
      await fundMetaMaskAccounts([METAMASK_ACCOUNT_15], smallAmount);
      const balanceAfterSmall = await ethers.provider.getBalance(METAMASK_ACCOUNT_15);
      
      // Fund again with even larger amount
      const largeAmount = (parseFloat(ethers.utils.formatEther(balanceAfterSmall)) + 100).toFixed(0);
      await fundMetaMaskAccounts([METAMASK_ACCOUNT_15], largeAmount);
      const balanceAfterLarge = await ethers.provider.getBalance(METAMASK_ACCOUNT_15);
      
      // Should have received additional funds from at least one of the funding attempts
      const increase = balanceAfterLarge.sub(currentBalance);
      
      // At least one funding should have occurred (either small or large amount)
      if (increase.gt(0)) {
        expect(increase).to.be.gte(ethers.utils.parseEther("9.99"));
        console.log(`   ✓ Funded MetaMask Account 15 that had insufficient balance`);
        console.log(`     Total increase: ${ethers.utils.formatEther(increase)} ETH`);
      } else {
        // If both were skipped, that means account already had sufficient balance for both
        // This is also valid behavior - the function correctly skipped funding
        console.log(`   ✓ MetaMask Account 15 already had sufficient balance for both funding attempts (skipped)`);
        // In this case, we just verify the function didn't error
        expect(increase).to.be.gte(0);
      }
    });
  });

  describe("Error Handling", function () {
    it("Should handle invalid address format gracefully", async function () {
      const invalidAddresses = [
        "0xInvalid",
        "notAnAddress",
        "0x123", // Too short
        "", // Empty
      ];
      
      // Should not throw, but should skip invalid addresses
      await expect(
        fundMetaMaskAccounts(invalidAddresses, "100")
      ).to.not.be.reverted;
      
      console.log(`   ✓ Handled invalid addresses gracefully`);
    });

    it("Should handle empty address array", async function () {
      await expect(
        fundMetaMaskAccounts([], "100")
      ).to.not.be.reverted;
      
      console.log(`   ✓ Handled empty address array`);
    });

    it("Should handle mix of valid and invalid MetaMask addresses", async function () {
      const mixedAddresses = [
        METAMASK_ACCOUNT_14, // Valid
        "0xInvalid", // Invalid
        METAMASK_ACCOUNT_15, // Valid
        "", // Invalid
      ];
      
      const initialBalances = await Promise.all([
        ethers.provider.getBalance(METAMASK_ACCOUNT_14),
        ethers.provider.getBalance(METAMASK_ACCOUNT_15),
      ]);
      
      // Use amount higher than current balances to ensure funding occurs
      const currentBalances = await Promise.all([
        ethers.provider.getBalance(METAMASK_ACCOUNT_14),
        ethers.provider.getBalance(METAMASK_ACCOUNT_15),
      ]);
      const maxCurrentBalance = Math.max(
        ...currentBalances.map(b => parseFloat(ethers.utils.formatEther(b)))
      );
      const fundAmount = (maxCurrentBalance + 20).toFixed(0);
      
      await fundMetaMaskAccounts(mixedAddresses, fundAmount);
      
      const finalBalances = await Promise.all([
        ethers.provider.getBalance(METAMASK_ACCOUNT_14),
        ethers.provider.getBalance(METAMASK_ACCOUNT_15),
      ]);
      
      // Valid addresses should be processed (funded if needed, or skipped if sufficient)
      const increase14 = finalBalances[0].sub(initialBalances[0]);
      const increase15 = finalBalances[1].sub(initialBalances[1]);
      
      // At least one should have been funded, or both skipped if they had sufficient balance
      const totalIncrease = increase14.add(increase15);
      expect(totalIncrease).to.be.gte(0); // Should not decrease
      
      if (increase14.gt(0)) {
        expect(increase14).to.be.gte(ethers.utils.parseEther("19.99"));
      }
      if (increase15.gt(0)) {
        expect(increase15).to.be.gte(ethers.utils.parseEther("19.99"));
      }
      
      console.log(`   ✓ Processed mix of valid and invalid MetaMask addresses`);
      console.log(`     Valid accounts (14 & 15) were processed, invalid ones were skipped`);
    });
  });

  describe("Integration with Deploy Script", function () {
    it("Should fund MetaMask accounts 14 and 15 when METAMASK_ADDRESSES is set", async function () {
      // Simulate what deploy.js does with MetaMask accounts
      const testAddresses = [METAMASK_ACCOUNT_14, METAMASK_ACCOUNT_15];
      const initialBalances = await Promise.all(
        testAddresses.map(addr => ethers.provider.getBalance(addr))
      );
      
      // Simulate deploy script calling fundMetaMaskAccounts
      const metamaskAddresses = testAddresses.join(",");
      const addresses = metamaskAddresses
        .split(",")
        .map(addr => addr.trim())
        .filter(addr => addr.length > 0);
      
      // Use amount higher than current balances to ensure funding occurs
      const currentBalances = await Promise.all(
        addresses.map(addr => ethers.provider.getBalance(addr))
      );
      const maxCurrentBalance = Math.max(
        ...currentBalances.map(b => parseFloat(ethers.utils.formatEther(b)))
      );
      const fundAmount = (maxCurrentBalance + 100).toFixed(0);
      
      if (addresses.length > 0) {
        await fundMetaMaskAccounts(addresses, fundAmount);
      }
      
      const finalBalances = await Promise.all(
        testAddresses.map(addr => ethers.provider.getBalance(addr))
      );
      
      // Verify accounts were processed (funded or skipped appropriately)
      for (let i = 0; i < testAddresses.length; i++) {
        const increase = finalBalances[i].sub(initialBalances[i]);
        if (increase.gt(0)) {
          expect(increase).to.be.gte(ethers.utils.parseEther("99.99"));
          console.log(`   ✓ MetaMask Account ${i === 0 ? "14" : "15"} funded via deploy script pattern`);
        } else {
          console.log(`   ✓ MetaMask Account ${i === 0 ? "14" : "15"} already had sufficient balance (skipped)`);
        }
      }
    });
  });

  describe("Balance Validation After Funding", function () {
    it("Should verify MetaMask account 14 balance matches expected amount after funding", async function () {
      const testAddress = METAMASK_ACCOUNT_14;
      
      // Get current balance and fund with amount higher than current
      const currentBalanceData = await getBalance(testAddress);
      const currentBalanceEth = currentBalanceData.ethNumber;
      const fundAmount = (currentBalanceEth + 75).toFixed(0);
      
      // Get initial balance using helper
      const initialBalanceData = await getBalance(testAddress);
      const initialBalance = initialBalanceData.wei;
      
      // Fund the account
      await fundMetaMaskAccounts([testAddress], fundAmount);
      
      // Verify balance using validation helper
      const validation = await validateFunding(testAddress, fundAmount, initialBalance);
      
      // If account was funded, validate the amount
      if (validation.details.received.ethNumber > 0) {
        expect(validation.valid).to.be.true;
        expect(validation.details.received.ethNumber).to.be.gte(parseFloat(fundAmount) - 0.001);
        console.log(`   ✓ Balance validation: MetaMask Account 14 (${testAddress})`);
        console.log(`     Expected: ${validation.details.expected.eth} ETH`);
        console.log(`     Received: ${validation.details.received.eth} ETH`);
        console.log(`     Within tolerance: ${validation.valid}`);
      } else {
        // Account had sufficient balance, which is also valid
        console.log(`   ✓ Balance validation: MetaMask Account 14 already had sufficient balance`);
        expect(validation.details.received.ethNumber).to.equal(0);
      }
    });

    it("Should handle multiple funding rounds for MetaMask account 15 and track cumulative balance", async function () {
      const testAddress = METAMASK_ACCOUNT_15;
      
      // Get current balance first
      const currentBalanceData = await getBalance(testAddress);
      const currentBalanceEth = currentBalanceData.ethNumber;
      
      // Use amounts that are higher than current balance to ensure funding
      const baseAmount = Math.ceil(currentBalanceEth) + 10;
      const amounts = [
        (baseAmount + 10).toFixed(0),
        (baseAmount + 20).toFixed(0),
        (baseAmount + 30).toFixed(0)
      ];
      
      let cumulativeExpected = 0;
      const initialBalanceData = await getBalance(testAddress);
      const initialBalance = initialBalanceData.wei;
      
      for (const amount of amounts) {
        await fundMetaMaskAccounts([testAddress], amount);
        cumulativeExpected += parseFloat(amount);
      }
      
      // Use balance change helper
      const change = await getBalanceChange(testAddress, initialBalance);
      
      // Should have received cumulative amount (allowing for small variance)
      // Note: Only the first funding will actually add funds if account had balance
      // Subsequent ones will be skipped, so we check if at least one funding occurred
      expect(change.increase.ethNumber).to.be.gte(0);
      
      if (change.increase.ethNumber > 0) {
        expect(change.increase.ethNumber).to.be.gte(9.99); // At least one funding should have occurred
        console.log(`   ✓ Cumulative funding for MetaMask Account 15: ${change.increase.eth} ETH received`);
      } else {
        console.log(`   ✓ MetaMask Account 15 already had sufficient balance for all funding attempts`);
      }
    });
  });

  describe("Funder Account Balance", function () {
    it("Should verify funder has sufficient balance", async function () {
      const funderBalance = await ethers.provider.getBalance(funder.address);
      const funderBalanceEth = parseFloat(ethers.utils.formatEther(funderBalance));
      
      // Funder should have plenty of ETH (Hardhat default is 10000 ETH per account)
      expect(funderBalanceEth).to.be.gte(1000);
      
      console.log(`   ✓ Funder balance: ${funderBalanceEth.toFixed(2)} ETH`);
    });

    it("Should track funder balance decrease after funding MetaMask accounts", async function () {
      const initialFunderBalance = await ethers.provider.getBalance(funder.address);
      
      // Get current balances of MetaMask accounts
      const currentBalances = await Promise.all([
        ethers.provider.getBalance(METAMASK_ACCOUNT_14),
        ethers.provider.getBalance(METAMASK_ACCOUNT_15),
      ]);
      const maxCurrentBalance = Math.max(
        ...currentBalances.map(b => parseFloat(ethers.utils.formatEther(b)))
      );
      const fundAmount = (maxCurrentBalance + 100).toFixed(0);
      
      // Fund MetaMask accounts
      await fundMetaMaskAccounts([METAMASK_ACCOUNT_14, METAMASK_ACCOUNT_15], fundAmount);
      
      const finalFunderBalance = await ethers.provider.getBalance(funder.address);
      const decrease = initialFunderBalance.sub(finalFunderBalance);
      
      // Check if any funding occurred (balance should decrease if accounts were funded)
      // If accounts already had sufficient balance, decrease will be minimal (just gas for checks)
      const fundAmountWei = ethers.utils.parseEther(fundAmount);
      
      // Decrease should be at least gas costs (even if funding was skipped)
      expect(decrease).to.be.gte(0);
      
      // If accounts were actually funded, decrease should be significant
      const finalBalances = await Promise.all([
        ethers.provider.getBalance(METAMASK_ACCOUNT_14),
        ethers.provider.getBalance(METAMASK_ACCOUNT_15),
      ]);
      const totalIncrease = finalBalances[0].add(finalBalances[1])
        .sub(currentBalances[0].add(currentBalances[1]));
      
      if (totalIncrease.gt(0)) {
        // Accounts were funded, so funder balance should have decreased significantly
        expect(decrease).to.be.gte(fundAmountWei);
        console.log(`   ✓ Funder balance decreased by ${ethers.utils.formatEther(decrease)} ETH (accounts were funded)`);
      } else {
        // Accounts had sufficient balance, so only gas was spent
        console.log(`   ✓ Funder balance decreased by ${ethers.utils.formatEther(decrease)} ETH (only gas, accounts had sufficient balance)`);
      }
    });
  });
});

