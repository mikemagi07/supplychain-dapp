const { ethers } = require("hardhat");

/**
 * Script to check balance of an address on local Hardhat network
 * 
 * Usage:
 *   METAMASK_ADDRESS=0x... npx hardhat run scripts/checkBalance.js --network localhost
 * 
 * Or on Windows PowerShell:
 *   $env:METAMASK_ADDRESS="0x..."; npx hardhat run scripts/checkBalance.js --network localhost
 */
async function main() {
  const address = process.env.METAMASK_ADDRESS;
  
  if (!address) {
    console.error("❌ Please provide an address via METAMASK_ADDRESS environment variable");
    process.exit(1);
  }

  const normalizedAddress = address.trim();
  let checksumAddress;
  try {
    checksumAddress = ethers.utils.getAddress(normalizedAddress);
  } catch (e) {
    console.error("❌ Invalid address format");
    process.exit(1);
  }

  const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");
  
  console.log(`\n🔍 Checking balance for: ${checksumAddress}`);
  console.log(`📡 Connected to: http://127.0.0.1:8545`);
  
  try {
    const balance = await provider.getBalance(checksumAddress);
    const balanceInEth = ethers.utils.formatEther(balance);
    
    console.log(`\n💰 Balance: ${balanceInEth} ETH`);
    console.log(`   (${balance.toString()} wei)`);
    
    if (balance.isZero()) {
      console.log(`\n⚠️  Balance is 0. The address may not have been funded yet.`);
      console.log(`   Run: $env:METAMASK_ADDRESS="${checksumAddress}"; npx hardhat run scripts/fundMetaMaskAccount.js --network localhost`);
    } else {
      console.log(`\n✅ Address has ETH! If MetaMask doesn't show it:`);
      console.log(`   1. Make sure MetaMask is on the correct network (Chain ID: 31337)`);
      console.log(`   2. Refresh MetaMask or reset account cache`);
      console.log(`   3. Verify the address in MetaMask matches: ${checksumAddress}`);
    }
  } catch (error) {
    console.error("❌ Error checking balance:", error.message);
    if (error.message.includes("ECONNREFUSED") || error.message.includes("connect")) {
      console.error("\n⚠️  Cannot connect to Hardhat node!");
      console.error("   Make sure Hardhat node is running: npx hardhat node");
    }
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

