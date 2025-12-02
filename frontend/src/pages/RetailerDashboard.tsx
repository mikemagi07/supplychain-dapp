import { useState } from "react";
import { getContract, ALL_ADDRESSES, getLocalSigner } from "../blockchain/contract";
import DashboardLayout from "../components/DashboardLayout";
import { useRole } from "../components/RoleContext";
import { useWallet } from "../components/WalletContext";
import { useAuth } from "../components/AuthContext";
import AddressSelect from "../components/AddressSelect";

export default function RetailerDashboard() {
  const [productId, setProductId] = useState("");
  const [consumer, setConsumer] = useState("");
  const role = useRole();
  const { signer: metaMaskSigner, walletMode } = useWallet();
  const { user } = useAuth();

  const ensureSigner = async () => {
    if (walletMode === "metamask") {
      if (!metaMaskSigner) {
        alert("Please connect MetaMask to perform this action.");
        return null;
      }
      return metaMaskSigner;
    }

    if (!user) {
      alert("Please login as a local retailer first.");
      return null;
    }

    try {
      return await getLocalSigner(user.address);
    } catch (e: any) {
      alert("Unable to create local signer: " + (e.message || e));
      return null;
    }
  };

  const receive = async () => {
    const signer = await ensureSigner();
    if (!signer) return;
    const contract = getContract(role, signer, true);
    const tx = await contract.receiveProductFromSupplier(Number(productId));
    await tx.wait();
    alert("Received from Supplier");
  };

  const add = async () => {
    const signer = await ensureSigner();
    if (!signer) return;
    const contract = getContract(role, signer, true);
    const tx = await contract.addToStore(Number(productId));
    await tx.wait();
    alert("Product added to store");
  };

  const sell = async () => {
    const signer = await ensureSigner();
    if (!signer) return;
    const contract = getContract(role, signer, true);
    const tx = await contract.sellToConsumer(Number(productId), consumer);
    await tx.wait();
    alert("Sold to consumer");
  };

  return (
    <DashboardLayout
      title="Retailer Dashboard"
      description="Receive goods, mark them for sale, and sell to consumers."
    >
      <input
        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded"
        placeholder="Product ID"
        value={productId}
        onChange={(e) => setProductId(e.target.value)}
      />

      <button
        onClick={receive}
        className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
      >
        Receive from Supplier
      </button>

      <button
        onClick={add}
        className="w-full bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg"
      >
        Add to Store
      </button>

      <AddressSelect
        addresses={ALL_ADDRESSES.consumers}
        value={consumer}
        onChange={setConsumer}
        placeholder="Select Consumer Address"
        label="Consumer Address"
        role="consumers"
      />

      <button
        onClick={sell}
        className="w-full bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg"
      >
        Sell to Consumer
      </button>
    </DashboardLayout>
  );
}
