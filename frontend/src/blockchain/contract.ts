import { ethers } from "ethers";
import artifact from "./SupplyChain.json";
import { RoleContextType } from "../components/RoleContext";

type NetworkInfo = {
  address?: string;
};

type UIAddresses = {
  owner?: string;
  producers?: string[];
  suppliers?: string[];
  retailers?: string[];
  consumers?: string[];
};

type ArtifactWithExtras = typeof artifact & {
  networks?: Record<string, NetworkInfo>;
  uiAddresses?: UIAddresses;
};

const artifactData = artifact as ArtifactWithExtras;

const DEFAULT_CHAIN_ID =
  process.env.REACT_APP_CHAIN_ID ||
  process.env.REACT_APP_NETWORK_ID ||
  "31337";

const DEFAULT_RPC_URL =
  process.env.REACT_APP_RPC_URL || "http://127.0.0.1:8545";

const resolveContractAddress = (): string => {
  const networks = artifactData.networks || {};
  const networkEntry = networks[DEFAULT_CHAIN_ID];

  if (networkEntry?.address) {
    return networkEntry.address;
  }

  const fallback =
    process.env.REACT_APP_CONTRACT_ADDRESS || process.env.CONTRACT_ADDRESS;

  if (fallback) {
    console.warn(
      `[contract] Using fallback contract address from environment: ${fallback}`
    );
    return fallback;
  }

  throw new Error(
    `No contract address found for chain ${DEFAULT_CHAIN_ID}. Run "npx hardhat run scripts/deploy.js --network localhost" to deploy and update SupplyChain.json.`
  );
};

export const CONTRACT_ADDRESS = resolveContractAddress();

const uiAddresses: Required<UIAddresses> = {
  owner: artifactData.uiAddresses?.owner ?? "",
  producers: artifactData.uiAddresses?.producers ?? [],
  suppliers: artifactData.uiAddresses?.suppliers ?? [],
  retailers: artifactData.uiAddresses?.retailers ?? [],
  consumers: artifactData.uiAddresses?.consumers ?? [],
};

export const ALL_ADDRESSES = {
  owners: uiAddresses.owner ? [uiAddresses.owner] : [],
  producers: uiAddresses.producers,
  suppliers: uiAddresses.suppliers,
  retailers: uiAddresses.retailers,
  consumers: uiAddresses.consumers,
};

export const ADDRESSES = {
  owner: uiAddresses.owner,
  producer: uiAddresses.producers[0] ?? "",
  supplier: uiAddresses.suppliers[0] ?? "",
  retailer: uiAddresses.retailers[0] ?? "",
  consumer: uiAddresses.consumers[0] ?? "",
  contract: CONTRACT_ADDRESS,
  allProducers: uiAddresses.producers,
  allSuppliers: uiAddresses.suppliers,
  allRetailers: uiAddresses.retailers,
  allConsumers: uiAddresses.consumers,
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
    const index = roleAddresses.findIndex(
      (addr) => addr.toLowerCase() === address.toLowerCase()
    );

    if (index >= 0) {
      const roleNameMap: Record<string, string> = {
        owners: "Owner",
        producers: "Producer",
        suppliers: "Supplier",
        retailers: "Retailer",
        consumers: "Consumer",
      };

      const roleName = roleNameMap[r] || r;

      return `${roleName} ${index + 1}`;
    }
  }

  return formatAddress(address);
};

const getDefaultProvider = () => new ethers.JsonRpcProvider(DEFAULT_RPC_URL);

export const getReadOnlyContract = () =>
  new ethers.Contract(CONTRACT_ADDRESS, artifact.abi, getDefaultProvider());

export const getContract = (
  _roleContext?: RoleContextType,
  metaMaskSigner?: ethers.JsonRpcSigner | null,
  requireSigner: boolean = false
) => {
  if (metaMaskSigner) {
    return new ethers.Contract(CONTRACT_ADDRESS, artifact.abi, metaMaskSigner);
  }

  if (requireSigner) {
    throw new Error("No signer available. Please connect MetaMask.");
  }

  return getReadOnlyContract();
};
