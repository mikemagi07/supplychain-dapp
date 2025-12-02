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
  extra?: string[];
};

type ArtifactWithExtras = typeof artifact & {
  networks?: Record<string, NetworkInfo>;
  uiAddresses?: UIAddresses;
};

const artifactData = artifact as ArtifactWithExtras;

const DEFAULT_CHAIN_ID = "31337";
const DEFAULT_RPC_URL = "http://127.0.0.1:8545";

const resolveContractAddress = (): string => {
  const networks = artifactData.networks || {};
  const networkEntry = networks[DEFAULT_CHAIN_ID];

  if (networkEntry?.address) return networkEntry.address;

  throw new Error(
    `No contract address found for chain ${DEFAULT_CHAIN_ID} in SupplyChain.json. Run "npx hardhat run scripts/deploy.js --network localhost" to deploy and update the artifact.`
  );
};

export const CONTRACT_ADDRESS = resolveContractAddress();

const uiAddresses: Required<UIAddresses> = {
  owner: artifactData.uiAddresses?.owner ?? "",
  producers: artifactData.uiAddresses?.producers ?? [],
  suppliers: artifactData.uiAddresses?.suppliers ?? [],
  retailers: artifactData.uiAddresses?.retailers ?? [],
  consumers: artifactData.uiAddresses?.consumers ?? [],
  extra: artifactData.uiAddresses?.extra ?? [],
};

export const ALL_ADDRESSES = {
  owners: uiAddresses.owner ? [uiAddresses.owner] : [],
  // Extra addresses are available to be assigned to ANY role, so
  // we include them in each list for selection in the UI.
  producers: [...uiAddresses.producers, ...uiAddresses.extra],
  suppliers: [...uiAddresses.suppliers, ...uiAddresses.extra],
  retailers: [...uiAddresses.retailers, ...uiAddresses.extra],
  consumers: [...uiAddresses.consumers, ...uiAddresses.extra],
};

export const ADDRESSES = {
  owner: uiAddresses.owner,
  producer: uiAddresses.producers[0] ?? uiAddresses.extra[0] ?? "",
  supplier: uiAddresses.suppliers[0] ?? uiAddresses.extra[0] ?? "",
  retailer: uiAddresses.retailers[0] ?? uiAddresses.extra[0] ?? "",
  consumer: uiAddresses.consumers[0] ?? uiAddresses.extra[0] ?? "",
  contract: CONTRACT_ADDRESS,
  allProducers: [...uiAddresses.producers, ...uiAddresses.extra],
  allSuppliers: [...uiAddresses.suppliers, ...uiAddresses.extra],
  allRetailers: [...uiAddresses.retailers, ...uiAddresses.extra],
  allConsumers: [...uiAddresses.consumers, ...uiAddresses.extra],
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

// Returns a signer for a local Hardhat account (unlocked on the JSON-RPC node)
// using the provided address. This is used when the UI is in "local" wallet mode.
export const getLocalSigner = async (address: string) => {
  if (!address) {
    throw new Error("Local signer requires a valid address");
  }
  const provider = getDefaultProvider();
  return provider.getSigner(address);
};

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
