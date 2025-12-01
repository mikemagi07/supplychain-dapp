import { ethers } from "ethers";
import artifact from "./SupplyChain.json";
import { useAccountStore } from "../state/accountStore";
import { RoleContextType } from "../components/RoleContext";

const RPC = "http://127.0.0.1:8545";

// Get the values from npx hardhat run scripts/deploy.js --localhost
const PRODUCER_PK=""
const SUPPLIER_PK=""
const RETAILER_PK=""
const CONSUMER_PK=""
const CONTRACT_ADDRESS=""

const PKS: Record<string, string> = {
  producer: PRODUCER_PK,
  supplier: SUPPLIER_PK,
  retailer: RETAILER_PK,
  consumer: CONSUMER_PK,
};


export const getSigner = (role: string) => {
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  return new ethers.Wallet(PKS[role], provider);
};

export const getContract = (roleContext: RoleContextType) => {
  console.log("Current Role: ", roleContext)
  const signer = getSigner(roleContext.role);
  return new ethers.Contract(
    CONTRACT_ADDRESS,
    artifact.abi,
    signer
  );
};
