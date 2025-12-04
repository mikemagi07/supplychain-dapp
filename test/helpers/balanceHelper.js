const { ethers } = require("hardhat");

/**
 * Balance Helper Utilities for Testing
 * 
 * Provides reusable functions for checking and validating account balances
 * in tests, similar to the checkBalance script but as test utilities.
 */

/**
 * Get the balance of an address in ETH
 * @param {string} address - The address to check
 * @param {ethers.Provider} provider - The ethers provider (optional, defaults to current provider)
 * @returns {Promise<{wei: ethers.BigNumber, eth: string, ethNumber: number}>}
 */
async function getBalance(address, provider = null) {
  const prov = provider || ethers.provider;
  
  if (!ethers.utils.isAddress(address)) {
    throw new Error(`Invalid address: ${address}`);
  }
  
  const checksumAddress = ethers.utils.getAddress(address);
  const balance = await prov.getBalance(checksumAddress);
  const balanceEth = ethers.utils.formatEther(balance);
  const balanceNumber = parseFloat(balanceEth);
  
  return {
    wei: balance,
    eth: balanceEth,
    ethNumber: balanceNumber,
    address: checksumAddress,
  };
}

/**
 * Check if an address has at least a certain amount of ETH
 * @param {string} address - The address to check
 * @param {string|ethers.BigNumber} minAmount - Minimum amount in ETH (string) or wei (BigNumber)
 * @param {ethers.Provider} provider - The ethers provider (optional)
 * @returns {Promise<{hasEnough: boolean, balance: object, required: object, difference: object}>}
 */
async function hasMinimumBalance(address, minAmount, provider = null) {
  const balance = await getBalance(address, provider);
  
  const minAmountWei = typeof minAmount === "string" 
    ? ethers.utils.parseEther(minAmount)
    : minAmount;
  
  const hasEnough = balance.wei.gte(minAmountWei);
  const difference = balance.wei.sub(minAmountWei);
  
  return {
    hasEnough,
    balance,
    required: {
      wei: minAmountWei,
      eth: ethers.utils.formatEther(minAmountWei),
      ethNumber: parseFloat(ethers.utils.formatEther(minAmountWei)),
    },
    difference: {
      wei: difference,
      eth: ethers.utils.formatEther(difference.abs()),
      ethNumber: parseFloat(ethers.utils.formatEther(difference.abs())),
    },
  };
}

/**
 * Get balance difference between two points in time
 * @param {string} address - The address to check
 * @param {ethers.BigNumber} initialBalance - Initial balance in wei
 * @param {ethers.Provider} provider - The ethers provider (optional)
 * @returns {Promise<{increase: object, decrease: object, final: object, initial: object}>}
 */
async function getBalanceChange(address, initialBalance, provider = null) {
  const finalBalance = await getBalance(address, provider);
  
  const increase = finalBalance.wei.sub(initialBalance);
  const decrease = initialBalance.sub(finalBalance.wei);
  
  return {
    increase: {
      wei: increase.gte(0) ? increase : ethers.BigNumber.from(0),
      eth: ethers.utils.formatEther(increase.gte(0) ? increase : ethers.BigNumber.from(0)),
      ethNumber: parseFloat(ethers.utils.formatEther(increase.gte(0) ? increase : ethers.BigNumber.from(0))),
    },
    decrease: {
      wei: decrease.gte(0) ? decrease : ethers.BigNumber.from(0),
      eth: ethers.utils.formatEther(decrease.gte(0) ? decrease : ethers.BigNumber.from(0)),
      ethNumber: parseFloat(ethers.utils.formatEther(decrease.gte(0) ? decrease : ethers.BigNumber.from(0))),
    },
    final: finalBalance,
    initial: {
      wei: initialBalance,
      eth: ethers.utils.formatEther(initialBalance),
      ethNumber: parseFloat(ethers.utils.formatEther(initialBalance)),
    },
  };
}

/**
 * Validate that funding occurred correctly
 * @param {string} address - The address that was funded
 * @param {string} expectedAmount - Expected amount in ETH
 * @param {ethers.BigNumber} initialBalance - Initial balance before funding
 * @param {ethers.Provider} provider - The ethers provider (optional)
 * @param {number} tolerance - Tolerance in ETH for gas fees (default: 0.001)
 * @returns {Promise<{valid: boolean, details: object}>}
 */
async function validateFunding(address, expectedAmount, initialBalance, provider = null, tolerance = 0.001) {
  const change = await getBalanceChange(address, initialBalance, provider);
  const expectedWei = ethers.utils.parseEther(expectedAmount);
  const toleranceWei = ethers.utils.parseEther(tolerance.toString());
  
  const received = change.increase.wei;
  const expectedMin = expectedWei.sub(toleranceWei);
  const expectedMax = expectedWei.add(toleranceWei);
  
  const valid = received.gte(expectedMin) && received.lte(expectedMax);
  
  return {
    valid,
    details: {
      expected: {
        wei: expectedWei,
        eth: expectedAmount,
        ethNumber: parseFloat(expectedAmount),
      },
      received: change.increase,
      tolerance: {
        wei: toleranceWei,
        eth: tolerance.toString(),
        ethNumber: tolerance,
      },
      withinTolerance: valid,
      difference: {
        wei: received.sub(expectedWei),
        eth: ethers.utils.formatEther(received.sub(expectedWei)),
        ethNumber: parseFloat(ethers.utils.formatEther(received.sub(expectedWei))),
      },
    },
  };
}

/**
 * Format balance for display
 * @param {ethers.BigNumber|string} balance - Balance in wei or ETH string
 * @param {boolean} inWei - Whether the input is in wei (default: true)
 * @returns {string} Formatted balance string
 */
function formatBalance(balance, inWei = true) {
  const balanceWei = inWei 
    ? (balance instanceof ethers.BigNumber ? balance : ethers.BigNumber.from(balance))
    : ethers.utils.parseEther(balance.toString());
  
  return ethers.utils.formatEther(balanceWei);
}

module.exports = {
  getBalance,
  hasMinimumBalance,
  getBalanceChange,
  validateFunding,
  formatBalance,
};

