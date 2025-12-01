import { useEffect, useState } from "react";
import { getContract } from "../blockchain/contract";
import ProductDetails from "./ProductDetails";
import { useRole } from "./RoleContext";

type Product = {
  id: string;
  name: string;
  status: number;
};

const statusLabels: Record<number, string> = {
  0: "Created",
  1: "Sent To Supplier",
  2: "Received By Supplier",
  3: "Sent To Retailer",
  4: "Received By Retailer",
  5: "Available For Sale",
  6: "Sold To Consumer",
};

export default function ProductList({ onSelect }: { onSelect?: (id: string) => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const role = useRole();

  const loadAllProducts = async () => {
    try {
      const c = getContract(role);
      const count = await c.productCount();

      const list: Product[] = [];
      for (let i = 1; i <= Number(count); i++) {
        const p = await c.getProduct(i);
        if (p[0] !== BigInt(0)) {
          list.push({
            id: p[0].toString(),
            name: p[1],
            status: Number(p[9]),
          });
        }
      }
      setProducts(list);
    } catch (err) {
      console.error("Error loading product list:", err);
    }
  };

  useEffect(() => {
    loadAllProducts();
  }, []);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    if (onSelect) onSelect(id);
  };

  return (
    <div className="space-y-4">

      {/* PRODUCT LIST */}
      <div className="bg-white shadow rounded-xl p-4 h-80 overflow-y-auto">
        <h2 className="text-lg font-bold mb-3">Products</h2>

        {products.map((p) => (
          <div
            key={p.id}
            onClick={() => handleSelect(p.id)}
            className="border p-3 rounded-lg mb-2 cursor-pointer hover:bg-gray-100 flex justify-between items-center"
          >
            <div>
              <p className="font-semibold">#{p.id} — {p.name}</p>
              <p className="text-xs text-gray-600">{statusLabels[p.status]}</p>
            </div>

            <button className="text-blue-600 hover:underline text-sm">
              View
            </button>
          </div>
        ))}
      </div>

      {/* PRODUCT DETAILS */}
      <div className="min-h-[250px]">
        {selectedId ? (
          <ProductDetails productId={selectedId} />
        ) : (
          <div className="bg-white p-5 rounded-xl shadow text-gray-500 text-sm">
            Select a product to view details.
          </div>
        )}
      </div>
    </div>
  );
}
