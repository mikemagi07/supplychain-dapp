import { useEffect, useState, useCallback } from "react";
import { getReadOnlyContract } from "../blockchain/contract";
import ProductDetailsModal from "./ProductDetailsModal";
import useSupplyChainEvents from "../hooks/useSupplyChainEvents";

type Product = { id: string; name: string; status: number };

const statusLabels: Record<number, string> = {
  0: "Created",
  1: "Sent To Supplier",
  2: "Received By Supplier",
  3: "Sent To Retailer",
  4: "Received By Retailer",
  5: "Available For Sale",
  6: "Sold To Consumer",
};

const statusColors: Record<number, string> = {
  0: "bg-gray-300 text-gray-800",
  1: "bg-blue-300 text-blue-800",
  2: "bg-purple-300 text-purple-800",
  3: "bg-yellow-300 text-yellow-800",
  4: "bg-green-300 text-green-800",
  5: "bg-emerald-300 text-emerald-900",
  6: "bg-red-300 text-red-800",
};

export default function ProductList({
  refreshKey,
  onSelectProduct,
}: {
  refreshKey: number;
  onSelectProduct?: (id: string) => void;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    try {
      const c = getReadOnlyContract();
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
      console.error("Error loading products:", err);
    }
  }, []);

  // refresh on parent change
  useEffect(() => {
    loadProducts();
  }, [refreshKey, loadProducts]);

  // refresh automatically on blockchain events
  useSupplyChainEvents(loadProducts);

  const handleSelect = (id: string) => {
    if (onSelectProduct) onSelectProduct(id);
  };

  const handleOpenModal = (id: string) => {
    setSelectedId(id);
    if (onSelectProduct) onSelectProduct(id);
  };

  return (
    <div className="space-y-4 h-full">

      {/* PRODUCT LIST */}
      <div className="bg-white p-6 rounded-xl shadow-lg min-h-[600px] h-[calc(100vh-200px)] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 text-gray-900">Products</h2>

        {products.map((p) => (
          <div
            key={p.id}
            onClick={() => handleSelect(p.id)}
            className="border border-gray-200 p-4 rounded-lg mb-3 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all bg-white flex justify-between items-center group"
          >
            <div className="flex-1">
              <p className="font-semibold text-gray-900 mb-2 group-hover:text-blue-700 transition-colors">
                #{p.id} — {p.name}
              </p>
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusColors[p.status]}`}
              >
                {statusLabels[p.status]}
              </span>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleOpenModal(p.id);
              }}
              className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              View Details
            </button>
          </div>
        ))}
      </div>

      {/* MODAL */}
      {selectedId && (
        <ProductDetailsModal
          productId={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
