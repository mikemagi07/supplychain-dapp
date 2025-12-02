import { useState } from "react";
import { getContract, ALL_ADDRESSES, getLocalSigner, getAddressesForRole, getReadOnlyContract } from "../blockchain/contract";
import DashboardLayout from "../components/DashboardLayout";
import { useRole } from "../components/RoleContext";
import { useWallet } from "../components/WalletContext";
import { useAuth } from "../components/AuthContext";
import AddressSelect from "../components/AddressSelect";

export default function ProducerDashboard() {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [qty, setQty] = useState("");
  const [supplier, setSupplier] = useState("");
  const role = useRole();
  const { signer: metaMaskSigner, walletMode, useMetaMask } = useWallet();
  const { user, registeredAccounts } = useAuth();
  const includeMetaMask = useMetaMask();

  const getActiveSigner = async () => {
    if (walletMode === "metamask") {
      if (!metaMaskSigner) {
        alert("Please connect MetaMask to perform this action.");
        return null;
      }
      
      // Verify the MetaMask address is registered as a producer in the contract
      const metaMaskAddress = await metaMaskSigner.getAddress();
      console.log("MetaMask address:", metaMaskAddress);
      // Check both the registeredAccounts list and directly with the contract
      const isInList = registeredAccounts.producers.some(
        addr => addr.toLowerCase() === metaMaskAddress.toLowerCase()
      );
      
      // Also verify directly with the contract to ensure it's actually registered
      try {
        const contract = getReadOnlyContract();
        const isRegisteredInContract = await contract.producers(metaMaskAddress);
        
        if (!isRegisteredInContract) {
          alert(`This MetaMask address (${metaMaskAddress.slice(0, 6)}...${metaMaskAddress.slice(-4)}) is not registered as a producer in the contract. Please use an owner account to register it first, or use a different MetaMask account that is registered as a producer.\n\nNote: If you just deployed, make sure the contract was deployed with MetaMask addresses registered.`);
          return null;
        }
      } catch (error: any) {
        console.error("Error checking producer registration:", error);
        // If we can't check, at least verify it's in the list
        if (!isInList) {
          alert(`Unable to verify producer registration. This address may not be registered. Please try refreshing the page or contact an owner to register this address.`);
          return null;
        }
      }
      
      return metaMaskSigner;
    }

    if (!user) {
      alert("Please login as a local producer first.");
      return null;
    }

    try {
      return await getLocalSigner(user.address);
    } catch (e: any) {
      alert("Unable to create local signer: " + (e.message || e));
      return null;
    }
  };

  const createProduct = async (refreshProducts: () => void) => {
    const signer = await getActiveSigner();
    if (!signer) return;

    const contract = getContract(role, signer, true);
    const tx = await contract.addProduct(name, desc, Number(qty));
    await tx.wait();
    refreshProducts();
  };

  const sendToSupplier = async (refreshProducts: () => void, productId: string) => {
    const signer = await getActiveSigner();
    if (!signer) return;

    const contract = getContract(role, signer, true);
    const tx = await contract.sendToSupplier(Number(productId), supplier);
    await tx.wait();
    refreshProducts();
  };

  return (
    <DashboardLayout
      title="Producer Dashboard"
      description="Create products and send them to suppliers."
    >
      {({ refreshProducts, selectedProduct }) => (
        <>
          {/* CREATE PRODUCT */}
          <h2 className="font-semibold text-lg mt-2">Create Product</h2>

          <input
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded"
            placeholder="Name"
            onChange={(e) => setName(e.target.value)}
          />

          <input
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded"
            placeholder="Description"
            onChange={(e) => setDesc(e.target.value)}
          />

          <input
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded"
            placeholder="Quantity"
            onChange={(e) => setQty(e.target.value)}
          />

          <button
            onClick={() => createProduct(refreshProducts)}
            className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
          >
            Create Product
          </button>

          {/* SEND TO SUPPLIER */}
          <h2 className="font-semibold text-lg mt-6">Send to Supplier</h2>

          <p className="text-sm opacity-90">
            Selected Product ID:{" "}
            <span className="text-cyan-300">
              {selectedProduct ?? "None selected"}
            </span>
          </p>

          <AddressSelect
            addresses={getAddressesForRole("suppliers", includeMetaMask)}
            value={supplier}
            onChange={setSupplier}
            placeholder="Select Supplier Address"
            label="Supplier Address"
            role="suppliers"
          />

          <button
            disabled={!selectedProduct}
            onClick={() => sendToSupplier(refreshProducts, selectedProduct!)}
            className="w-full bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg disabled:bg-gray-600"
          >
            Send to Supplier
          </button>
        </>
      )}
    </DashboardLayout>
  );
}
