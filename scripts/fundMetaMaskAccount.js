const { ethers } = require("hardhat");

/**
 * Script to fund a MetaMask account with test ETH on local Hardhat network
 * 
 * Usage:
 *   METAMASK_ADDRESS=0x... npx hardhat run scripts/fundMetaMaskAccount.js --network localhost
 * 
 * Or on Windows PowerShell:
 *   $env:METAMASK_ADDRESS="0x..."; npx hardhat run scripts/fundMetaMaskAccount.js --network localhost
 * 
 * Or on Windows CMD:
 *   set METAMASK_ADDRESS=0x... && npx hardhat run scripts/fundMetaMaskAccount.js --network localhost
 */
async function main() {
  const metaMaskAddress = process.env.METAMASK_ADDRESS;
  
  if (!metaMaskAddress) {
    console.error("❌ Please provide a MetaMask address via METAMASK_ADDRESS environment variable");
    console.log("\nUsage examples:");
    console.log("  Linux/Mac: METAMASK_ADDRESS=0x... npx hardhat run scripts/fundMetaMaskAccount.js --network localhost");
    console.log("  PowerShell: $env:METAMASK_ADDRESS=\"0x...\"; npx hardhat run scripts/fundMetaMaskAccount.js --network localhost");
    console.log("  CMD: set METAMASK_ADDRESS=0x... && npx hardhat run scripts/fundMetaMaskAccount.js --network localhost");
    process.exit(1);
  }

  // Normalize address (remove whitespace, convert to checksum)
  const normalizedAddress = metaMaskAddress.trim();
  
  // Basic validation - check if it looks like an Ethereum address
  if (!normalizedAddress.startsWith("0x") || normalizedAddress.length !== 42) {
    console.error("❌ Invalid address format. Address must start with 0x and be 42 characters long.");
    console.error(`   Received: ${normalizedAddress} (length: ${normalizedAddress.length})`);
    process.exit(1);
  }
  
  // Try to get checksum address (validates format)
  let checksumAddress;
  try {
    checksumAddress = ethers.utils.getAddress(normalizedAddress);
  } catch (e) {
    console.error("❌ Invalid address format. Address contains invalid characters.");
    console.error(`   Error: ${e.message}`);
    process.exit(1);
  }

  const signers = await ethers.getSigners();
  const funder = signers[0]; // Use the first Hardhat account (has lots of ETH)
  
  console.log(`\n📋 Funding MetaMask account: ${checksumAddress}`);
  console.log(`💰 Funding from: ${funder.address}`);
  
  const balance = await ethers.provider.getBalance(checksumAddress);
  console.log(`Current balance: ${ethers.utils.formatEther(balance)} ETH`);
  
  // Send 100 ETH (plenty for testing)
  const amount = ethers.utils.parseEther("100");
  
  console.log(`\n💸 Sending 100 ETH...`);
  const tx = await funder.sendTransaction({
    to: checksumAddress,
    value: amount,
  });
  
  console.log(`Transaction hash: ${tx.hash}`);
  console.log(`Waiting for confirmation...`);
  await tx.wait();
  
  const newBalance = await ethers.provider.getBalance(checksumAddress);
  console.log(`\n✅ Success! New balance: ${ethers.utils.formatEther(newBalance)} ETH`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

