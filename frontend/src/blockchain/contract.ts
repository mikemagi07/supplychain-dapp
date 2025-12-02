import { ethers } from "ethers";
import artifact from "./SupplyChain.json";
import { RoleContextType } from "../components/RoleContext";

type ArtifactWithNetworks = typeof artifact & {
  networks?: Record<string, { address?: string }>;
};

const DEFAULT_CHAIN_ID =
  process.env.REACT_APP_CHAIN_ID ||
  process.env.REACT_APP_NETWORK_ID ||
  "31337";

const resolveContractAddress = (): string => {
  const networks = (artifact as ArtifactWithNetworks).networks || {};
  const networkEntry = networks[DEFAULT_CHAIN_ID];

  if (networkEntry?.address) {
    return networkEntry.address;
  }

  const fallback =
    process.env.REACT_APP_CONTRACT_ADDRESS || process.env.CONTRACT_ADDRESS;

  if (fallback) {
    console.warn(
      `[contract] Using fallback contract address from .env: ${fallback}`
    );
    return fallback;
  }

  throw new Error(
    `No contract address found for chain ${DEFAULT_CHAIN_ID}. Run "npx hardhat run scripts/deploy.js --network localhost" to deploy and update SupplyChain.json.`
  );
};

export const CONTRACT_ADDRESS = resolveContractAddress();

const OWNER_PK = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const PRODUCER_PKS = [
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
  "0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba",
  "0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e",
];

const SUPPLIER_PKS = [
  "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
  "0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97",
  "0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f5fecdcd4392c05",
];

const RETAILER_PKS = [
  "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6",
  "0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff04d547c",
  "0x47e99b3f17664089c0d7bf90d4c169061d3dd571601d9d0e8b5b0a3a9e0b1c2d",
];

const CONSUMER_PKS = [
  "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a",
  "0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97",
  "0x8da4ef21b864d2cc526dbdb2a120bd2874c36c9d0a1fb7f8c63d7f7a8b41de8f",
];

// MetaMask addresses are determined dynamically from MetaMask connection
// No need to hardcode private keys or addresses

const deriveAddresses = (privateKeys: string[]): string[] => {
  return privateKeys.map(pk => new ethers.Wallet(pk).address);
};

const PRODUCER_ADDRESSES = deriveAddresses(PRODUCER_PKS);
const SUPPLIER_ADDRESSES = deriveAddresses(SUPPLIER_PKS);
const RETAILER_ADDRESSES = deriveAddresses(RETAILER_PKS);
const CONSUMER_ADDRESSES = deriveAddresses(CONSUMER_PKS);

const OWNER_ADDRESS = new ethers.Wallet(OWNER_PK).address;

// Only include local Hardhat addresses - MetaMask addresses come from MetaMask connection
export const ALL_ADDRESSES = {
  owners: [OWNER_ADDRESS],
  producers: PRODUCER_ADDRESSES,
  suppliers: SUPPLIER_ADDRESSES,
  retailers: RETAILER_ADDRESSES,
  consumers: CONSUMER_ADDRESSES,
};

const PKS: Record<string, string[]> = {
  owner: [OWNER_PK],
  producer: PRODUCER_PKS,
  supplier: SUPPLIER_PKS,
  retailer: RETAILER_PKS,
  consumer: CONSUMER_PKS,
};

export const ADDRESSES = {
  owner: OWNER_ADDRESS,
  producer: PRODUCER_ADDRESSES[0],
  supplier: SUPPLIER_ADDRESSES[0],
  retailer: RETAILER_ADDRESSES[0],
  consumer: CONSUMER_ADDRESSES[0],
  contract: CONTRACT_ADDRESS,
  allProducers: PRODUCER_ADDRESSES,
  allSuppliers: SUPPLIER_ADDRESSES,
  allRetailers: RETAILER_ADDRESSES,
  allConsumers: CONSUMER_ADDRESSES,
};

export const formatAddress = (address: string): string => {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const getAddressLabel = (address: string, role?: string): string => {
  if (!address) return "";
  
  const roles: Array<keyof typeof ALL_ADDRESSES> = role 
    ? [role as keyof typeof ALL_ADDRESSES]
    : ["owners", "producers", "suppliers", "retailers", "consumers"];
  
  for (const r of roles) {
    const roleAddresses = ALL_ADDRESSES[r];
    const index = roleAddresses.findIndex(addr => addr.toLowerCase() === address.toLowerCase());
    
    if (index >= 0) {
      const localCount = r === "owners" ? 1 : 3;
      const isMetaMask = index >= localCount;
      const localIdx = isMetaMask ? index - localCount : index;
      
      const roleNameMap: Record<string, string> = {
        "owners": "Owner",
        "producers": "Producer",
        "suppliers": "Supplier",
        "retailers": "Retailer",
        "consumers": "Consumer",
      };
      
      const roleName = roleNameMap[r] || r;
      
      return `${roleName} ${localIdx + 1}${isMetaMask ? " (MetaMask)" : ""}`;
    }
  }
  
  return formatAddress(address);
};


export const getSigner = (role: string, index: number = 0, metaMaskSigner?: ethers.JsonRpcSigner | null) => {
  if (metaMaskSigner) {
    return metaMaskSigner;
  }
  
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  const roleKeys = PKS[role];
  if (!roleKeys || roleKeys.length === 0) {
    throw new Error(`No private keys found for role: ${role}`);
  }
  if (index >= roleKeys.length) {
    throw new Error(`Index ${index} out of bounds for role ${role}. Available: ${roleKeys.length}`);
  }
  return new ethers.Wallet(roleKeys[index], provider);
};

// Check if address is from MetaMask by checking if it's NOT in local addresses
const isMetaMaskAddress = (address: string, role: string): boolean => {
  const roleAddresses = ALL_ADDRESSES[role as keyof typeof ALL_ADDRESSES];
  if (!roleAddresses) return false;
  
  // If address is not in local addresses, it's likely from MetaMask
  return !roleAddresses.some(addr => addr.toLowerCase() === address.toLowerCase());
};

const findLocalIndex = (address: string, role: string): number => {
  const roleAddresses = ALL_ADDRESSES[role as keyof typeof ALL_ADDRESSES];
  if (!roleAddresses) return 0;
  
  const localCount = role === "owner" ? 1 : 3;
  const localAddresses = roleAddresses.slice(0, localCount);
  const index = localAddresses.findIndex(addr => addr.toLowerCase() === address.toLowerCase());
  return index >= 0 ? index : 0;
};

export const getContract = (
  roleContext: RoleContextType,
  metaMaskSigner?: ethers.JsonRpcSigner | null,
  useMetaMask?: boolean,
  userAddress?: string
) => {
  console.log("Current Role: ", roleContext.role, "Account Index:", roleContext.accountIndex, "User Address:", userAddress);
  
  const isMetaMaskAddr = userAddress ? isMetaMaskAddress(userAddress, roleContext.role) : false;
  const shouldUseMetaMask = (useMetaMask && metaMaskSigner) || (isMetaMaskAddr && metaMaskSigner);
  
  if (isMetaMaskAddr && !metaMaskSigner) {
    throw new Error("This account requires MetaMask. Please connect MetaMask and switch to MetaMask mode.");
  }
  
  let localIndex = 0;
  if (shouldUseMetaMask) {
    localIndex = 0;
  } else if (userAddress) {
    localIndex = findLocalIndex(userAddress, roleContext.role);
  } else {
    const localCount = roleContext.role === "owner" ? 1 : 3;
    localIndex = roleContext.accountIndex < localCount ? roleContext.accountIndex : 0;
  }
  
  console.log("Using local index:", localIndex, "for role:", roleContext.role);
  
  const signer = getSigner(roleContext.role, localIndex, shouldUseMetaMask ? metaMaskSigner : null);
  return new ethers.Contract(
    CONTRACT_ADDRESS,
    artifact.abi,
    signer
  );
};
