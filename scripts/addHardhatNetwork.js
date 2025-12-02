/**
 * Helper script to add Hardhat local network to MetaMask
 * This script can be run in the browser console or integrated into the frontend
 * 
 * Usage in browser console:
 * 1. Open browser console (F12)
 * 2. Copy and paste this code
 * 3. Or use the addHardhatNetwork() function
 */

const HARDHAT_NETWORK = {
  chainId: "0x7A69", // 31337 in hex
  chainName: "Hardhat Local",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: ["http://127.0.0.1:8545"],
  blockExplorerUrls: [], // No block explorer for local network
};

async function addHardhatNetwork() {
  if (typeof window.ethereum === "undefined") {
    console.error("MetaMask is not installed!");
    return false;
  }

  try {
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [HARDHAT_NETWORK],
    });
    console.log("Hardhat network added to MetaMask successfully!");
    return true;
  } catch (error) {
    if (error.code === 4902) {
      // Chain doesn't exist, try to add it
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [HARDHAT_NETWORK],
        });
        console.log("Hardhat network added to MetaMask successfully!");
        return true;
      } catch (addError) {
        console.error("Error adding network:", addError);
        return false;
      }
    } else if (error.code === -32602) {
      console.error("Invalid parameters. Network might already be added.");
      return false;
    } else {
      console.error("Error:", error);
      return false;
    }
  }
}

async function switchToHardhatNetwork() {
  if (typeof window.ethereum === "undefined") {
    console.error("MetaMask is not installed!");
    return false;
  }

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: HARDHAT_NETWORK.chainId }],
    });
    console.log("Switched to Hardhat network successfully!");
    return true;
  } catch (error) {
    if (error.code === 4902) {
      // Chain doesn't exist, add it first
      console.log("Network not found. Adding Hardhat network...");
      return await addHardhatNetwork();
    } else {
      console.error("Error switching network:", error);
      return false;
    }
  }
}

// Export for use in frontend
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    addHardhatNetwork,
    switchToHardhatNetwork,
    HARDHAT_NETWORK,
  };
}

// Make available globally in browser
if (typeof window !== "undefined") {
  window.addHardhatNetwork = addHardhatNetwork;
  window.switchToHardhatNetwork = switchToHardhatNetwork;
}

