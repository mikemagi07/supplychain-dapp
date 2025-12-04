/**
 * Default MetaMask addresses for development
 * 
 * ============================================================================
 * ⚠️  PLACE YOUR METAMASK ADDRESSES HERE ⚠️
 * ============================================================================
 * 
 * To use your own MetaMask accounts:
 * 1. Replace the addresses below with your MetaMask account addresses
 * 2. Each address should be a valid Ethereum address (0x followed by 40 hex characters)
 * 3. Addresses will be automatically normalized to checksum format
 * 
 * Example:
 *   const DEFAULT_METAMASK_ADDRESSES = [
 *     "0xYourFirstMetaMaskAddress",
 *     "0xYourSecondMetaMaskAddress",
 *     "0xYourThirdMetaMaskAddress",
 *     // ... add more addresses as needed
 *   ];
 * 
 * These addresses are used when METAMASK_ADDRESSES environment variable is not set.
 * 
 * Alternative: You can also set METAMASK_ADDRESSES environment variable:
 *   - PowerShell: $env:METAMASK_ADDRESSES="0x...,0x..."
 *   - Bash: export METAMASK_ADDRESSES="0x...,0x..."
 * ============================================================================
 */
const DEFAULT_METAMASK_ADDRESSES = [
  "0x7d0a9c42b9953a1adc0a8a15a6a66bb489994e57",
  "0x44da5566ef04234363b4882d856d590ab435096e",
  "0x933d4350bca858e6de702a929878a413352885d8",
  "0x2fa965d296f182848588f9a3ed97af2e9fdf2d76",
  "0xb6ce9af39c7ca87f179666c05204d72516649dfc",
  "0x5560e14d290bc0459ca186b647637238dde2cdfb",
  "0x8567da95c79efcd36f953478d4f3adec117ae179",
  "0x24dc4ef5604ee51c616c1a7f42906f44cf196afe",
  "0xE5A1385f95ACd5caD8192fb82F13F065aeBA86Cc",
  "0xd51c949838f9e35851b5c9be3f6309101b0687c2",
  "0x984e3ea2679d8febc93d0c885712158debcef02e",
  "0x171c52193664A2c624c5551C442A8bbde2D3a93e",
  "0xc693c588981179b5e3f951e12c38e74ea6082d1c",
  "0x34e817073401aaa0f21215d769cd9e3500b2e69e",
  "0x423536d127f738b31999b2259d1ff842c2d47080",
];

/**
 * Parse and normalize MetaMask addresses from environment variable or use defaults
 * @param {string} envValue - METAMASK_ADDRESSES environment variable value
 * @param {object} ethers - Ethers.js utils for address validation
 * @returns {string[]} Array of normalized checksum addresses
 */
function parseMetamaskAddresses(envValue, ethers) {
  let addresses = [];

  if (envValue) {
    addresses = envValue
      .split(",")
      .map(addr => addr.trim())
      .filter(addr => addr.length > 0)
      .map(addr => {
        try {
          return ethers.utils.getAddress(addr); // Normalize to checksum
        } catch (e) {
          console.warn(`⚠️  Invalid MetaMask address skipped: ${addr}`);
          return null;
        }
      })
      .filter(addr => addr !== null);
  } else {
    addresses = DEFAULT_METAMASK_ADDRESSES.map(addr => {
      try {
        return ethers.utils.getAddress(addr);
      } catch (e) {
        return null;
      }
    }).filter(addr => addr !== null);
  }

  return addresses;
}

module.exports = {
  DEFAULT_METAMASK_ADDRESSES,
  parseMetamaskAddresses,
};

