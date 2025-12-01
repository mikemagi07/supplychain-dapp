import { useState } from "react";
import { getContract } from "../blockchain/contract";
import DashboardLayout from "../components/DashboardLayout";
import { useRole } from "../components/RoleContext";

export default function SupplierDashboard() {
  const [productId, setProductId] = useState("");
  const [shipping, setShipping] = useState("");
  const [retailer, setRetailer] = useState("");
  const role = useRole();

  const receive = async () => {
    const tx = await getContract(role).receiveProduct(Number(productId));
    await tx.wait();
    alert("Received from Producer");
  };

  const update = async () => {
    const tx = await getContract(role).updateShippingInfo(Number(productId), shipping);
    await tx.wait();
    alert("Shipping updated");
  };

  const sendToRetailer = async () => {
    const tx = await getContract(role).sendToRetailer(Number(productId), retailer);
    await tx.wait();
    alert("Sent to retailer");
  };

  return (
    <DashboardLayout
      title="Supplier Dashboard"
      description="Receive goods, update shipping, and forward to retailers."
      onSelectProduct={(id) => setProductId(id)}
    >
      <input
        className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700"
        placeholder="Product ID"
        value={productId}
        onChange={(e) => setProductId(e.target.value)}
      />

      <button
        onClick={receive}
        className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
      >
        Receive from Producer
      </button>

      <textarea
        className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700"
        placeholder="Shipping Info"
        onChange={(e) => setShipping(e.target.value)}
      />

      <button
        onClick={update}
        className="w-full bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg"
      >
        Update Shipping
      </button>

      <input
        className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700"
        placeholder="Retailer Address"
        onChange={(e) => setRetailer(e.target.value)}
      />

      <button
        onClick={sendToRetailer}
        className="w-full bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg"
      >
        Send to Retailer
      </button>
    </DashboardLayout>
  );
}
