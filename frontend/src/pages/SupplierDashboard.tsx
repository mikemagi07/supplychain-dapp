import { useState } from "react";
import { getContract, ALL_ADDRESSES } from "../blockchain/contract";
import DashboardLayout from "../components/DashboardLayout";
import { useRole } from "../components/RoleContext";
import { useWallet } from "../components/WalletContext";
import AddressSelect from "../components/AddressSelect";

export default function SupplierDashboard() {
  const [shipping, setShipping] = useState("");
  const [retailer, setRetailer] = useState("");
  const role = useRole();
  const { signer: metaMaskSigner } = useWallet();

  const ensureSigner = () => {
    if (!metaMaskSigner) {
      alert("Please connect MetaMask to perform this action.");
      return null;
    }
    return metaMaskSigner;
  };

  const receive = async (refreshProducts: () => void, productId: string) => {
    const signer = ensureSigner();
    if (!signer) return;
    const contract = getContract(role, signer, true);
    const tx = await contract.receiveProduct(Number(productId));
    await tx.wait();
    alert("Received from Producer");
    refreshProducts();
  };

  const update = async (refreshProducts: () => void, productId: string) => {
    const signer = ensureSigner();
    if (!signer) return;
    const contract = getContract(role, signer, true);
    const tx = await contract.updateShippingInfo(Number(productId), shipping);
    await tx.wait();
    alert("Shipping updated");
    refreshProducts();
  };

  const sendToRetailer = async (refreshProducts: () => void, productId: string) => {
    const signer = ensureSigner();
    if (!signer) return;
    const contract = getContract(role, signer, true);
    const tx = await contract.sendToRetailer(Number(productId), retailer);
    await tx.wait();
    alert("Sent to retailer");
    refreshProducts();
  };

  return (
    <DashboardLayout
      title="Supplier Dashboard"
      description="Receive goods, update shipping, and forward to retailers."
    >
      {({ refreshProducts, selectedProduct }) => (
        <>
          {/* RECEIVE FROM PRODUCER */}
          <h2 className="font-semibold text-lg mt-2">Receive from Producer</h2>

          <p className="text-sm opacity-90">
            Selected Product ID:{" "}
            <span className="text-cyan-300">
              {selectedProduct ?? "None selected"}
            </span>
          </p>

          <button
            disabled={!selectedProduct}
            onClick={() => receive(refreshProducts, selectedProduct!)}
            className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg disabled:bg-gray-600"
          >
            Receive from Producer
          </button>

          {/* UPDATE SHIPPING */}
          <h2 className="font-semibold text-lg mt-6">Update Shipping</h2>

          <p className="text-sm opacity-90">
            Selected Product ID:{" "}
            <span className="text-cyan-300">
              {selectedProduct ?? "None selected"}
            </span>
          </p>

          <textarea
            className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700"
            placeholder="Shipping Info"
            value={shipping}
            onChange={(e) => setShipping(e.target.value)}
          />

          <button
            disabled={!selectedProduct}
            onClick={() => update(refreshProducts, selectedProduct!)}
            className="w-full bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg disabled:bg-gray-600"
          >
            Update Shipping
          </button>

          {/* SEND TO RETAILER */}
          <h2 className="font-semibold text-lg mt-6">Send to Retailer</h2>

          <p className="text-sm opacity-90">
            Selected Product ID:{" "}
            <span className="text-cyan-300">
              {selectedProduct ?? "None selected"}
            </span>
          </p>

          <AddressSelect
            addresses={ALL_ADDRESSES.retailers}
            value={retailer}
            onChange={setRetailer}
            placeholder="Select Retailer Address"
            label="Retailer Address"
            role="retailers"
          />

          <button
            disabled={!selectedProduct}
            onClick={() => sendToRetailer(refreshProducts, selectedProduct!)}
            className="w-full bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg disabled:bg-gray-600"
          >
            Send to Retailer
          </button>
        </>
      )}
    </DashboardLayout>
  );
}
