import { useState } from "react";
import { getContract, ALL_ADDRESSES } from "../blockchain/contract";
import DashboardLayout from "../components/DashboardLayout";
import { useRole } from "../components/RoleContext";
import { useWallet } from "../components/WalletContext";
import AddressSelect from "../components/AddressSelect";

export default function ProducerDashboard() {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [qty, setQty] = useState("");
  const [supplier, setSupplier] = useState("");
  const role = useRole();
  const { signer: metaMaskSigner } = useWallet();

  const createProduct = async (refreshProducts: () => void) => {
    if (!metaMaskSigner) {
      alert("Please connect MetaMask to create products.");
      return;
    }
    const contract = getContract(role, metaMaskSigner, true);
    const tx = await contract.addProduct(name, desc, Number(qty));
    await tx.wait();
    refreshProducts();
  };

  const sendToSupplier = async (refreshProducts: () => void, productId: string) => {
    if (!metaMaskSigner) {
      alert("Please connect MetaMask to send products.");
      return;
    }
    const contract = getContract(role, metaMaskSigner, true);
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
            addresses={ALL_ADDRESSES.suppliers}
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
