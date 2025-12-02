import { useState } from "react";
import { getReadOnlyContract } from "../blockchain/contract";
import DashboardLayout from "../components/DashboardLayout";

export default function ConsumerDashboard() {
  const [productId, setProductId] = useState("");
  const [details, setDetails] = useState<any>(null);

  const load = async () => {
    const contract = getReadOnlyContract();
    const res = await contract.getProduct(Number(productId));
    setDetails(res);
  };

  return (
    <DashboardLayout
      title="Consumer Dashboard"
      description="Verify product authenticity and trace provenance."
    >
      <input
        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded"
        placeholder="Product ID"
        value={productId}
        onChange={(e) => setProductId(e.target.value)}
      />

      <button
        onClick={load}
        className="w-full bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg"
      >
        Verify Product
      </button>

      {details && (
        <p className="text-sm text-gray-300 pt-4">
          Product Name: {details[1]} <br />
          Status: {details[9].toString()}
        </p>
      )}
    </DashboardLayout>
  );
}
