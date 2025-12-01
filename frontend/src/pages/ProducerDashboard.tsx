import { useState } from "react";
import { getContract } from "../blockchain/contract";
import DashboardLayout from "../components/DashboardLayout";
import { useRole } from "../components/RoleContext";

export default function ProducerDashboard() {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [qty, setQty] = useState("");
  const role = useRole();

  const create = async () => {
    const contract = getContract(role);
    const tx = await contract.addProduct(name, desc, Number(qty));
    await tx.wait();
    alert("Product Created!");
  };

  return (
    <DashboardLayout
      title="Producer Dashboard"
      description="Create products and start the supply chain."
    >
      <input
        className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700"
        placeholder="Product Name"
        onChange={(e) => setName(e.target.value)}
      />

      <input
        className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700"
        placeholder="Description"
        onChange={(e) => setDesc(e.target.value)}
      />

      <input
        className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700"
        placeholder="Quantity"
        onChange={(e) => setQty(e.target.value)}
      />

      <button
        onClick={create}
        className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
      >
        Create Product
      </button>
    </DashboardLayout>
  );
}
