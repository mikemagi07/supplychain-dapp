const { ethers } = require("hardhat");

/**
 * Helper function to fund MetaMask accounts with test ETH
 * 
 * @param {string[]} addresses - Array of addresses to fund
 * @param {string} amount - Amount in ETH (default: "100")
 * @returns {Promise<void>}
 */
async function fundMetaMaskAccounts(addresses = [], amount = "100") {
  if (!addresses || addresses.length === 0) {
    return;
  }

  const signers = await ethers.getSigners();
  const funder = signers[0]; // Use the first Hardhat account (has lots of ETH)
  const amountWei = ethers.utils.parseEther(amount);

  console.log(`\n💰 Funding ${addresses.length} MetaMask account(s) with ${amount} ETH each...`);
  console.log(`   Funding from: ${funder.address}\n`);

  for (let i = 0; i < addresses.length; i++) {
    const address = addresses[i].trim();
    
    if (!address.startsWith("0x") || address.length !== 42) {
      console.log(`   ⚠️  Skipping invalid address: ${address}`);
      continue;
    }

    let checksumAddress;
    try {
      checksumAddress = ethers.utils.getAddress(address);
    } catch (e) {
      console.log(`   ⚠️  Skipping invalid address: ${address} (${e.message})`);
      continue;
    }

    try {
      const balance = await ethers.provider.getBalance(checksumAddress);
      const balanceEth = ethers.utils.formatEther(balance);
      
      // Only fund if balance is less than the amount we're sending
      if (balance.lt(amountWei)) {
        const tx = await funder.sendTransaction({
          to: checksumAddress,
          value: amountWei,
        });
        await tx.wait();
        const newBalance = await ethers.provider.getBalance(checksumAddress);
        console.log(`   ✅ [${i + 1}/${addresses.length}] Funded ${checksumAddress}`);
        console.log(`      Balance: ${ethers.utils.formatEther(newBalance)} ETH`);
      } else {
        console.log(`   ℹ️  [${i + 1}/${addresses.length}] ${checksumAddress} already has ${balanceEth} ETH (skipping)`);
      }
    } catch (error) {
      console.log(`   ❌ [${i + 1}/${addresses.length}] Failed to fund ${checksumAddress}: ${error.message}`);
    }
  }
  
  console.log("");
}

/**
 * Main function - reads addresses from environment variable
 * 
 * Usage:
 *   METAMASK_ADDRESSES="0x...,0x..." npx hardhat run scripts/fundMetaMaskAccounts.js --network localhost
 * 
 * Or on Windows PowerShell:
 *   $env:METAMASK_ADDRESSES="0x...,0x..."; npx hardhat run scripts/fundMetaMaskAccounts.js --network localhost
 */
async function main() {
  const addressesEnv = process.env.METAMASK_ADDRESSES;
  const amount = process.env.FUND_AMOUNT || "100";

  if (!addressesEnv) {
    console.log("ℹ️  No METAMASK_ADDRESSES environment variable set. Skipping funding.");
    console.log("   To fund accounts, set: METAMASK_ADDRESSES=\"0x...,0x...\"");
    return;
  }

  const addresses = addressesEnv
    .split(",")
    .map(addr => addr.trim())
    .filter(addr => addr.length > 0);

  if (addresses.length === 0) {
    console.log("ℹ️  No valid addresses found in METAMASK_ADDRESSES. Skipping funding.");
    return;
  }

  await fundMetaMaskAccounts(addresses, amount);
}

// Export for use in other scripts
if (typeof module !== "undefined" && module.exports) {
  module.exports = { fundMetaMaskAccounts };
}

// Run if called directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

