import { useEffect, useState } from "react";
import { getContract } from "../blockchain/contract";
import ProductDetailsModal from "./ProductDetailsModal";
import useSupplyChainEvents from "../hooks/useSupplyChainEvents";
import { useRole } from "./RoleContext";

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

export default function ProductList({
  refreshKey,
  onSelectProduct,
}: {
  refreshKey: number;
  onSelectProduct?: (id: string) => void;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const role = useRole();

  const loadProducts = async () => {
    try {
      // For read-only operations, we can use a provider instead of signer
      // But to keep it simple, we'll use getContract with undefined for wallet params
      const c = getContract(role, undefined, false, undefined);
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
  };

  // refresh on parent change
  useEffect(() => {
    loadProducts();
  }, [refreshKey, role]);

  // refresh automatically on blockchain events
  useSupplyChainEvents(() => loadProducts());

  const handleOpen = (id: string) => {
    setSelectedId(id);
    if (onSelectProduct) onSelectProduct(id);
  };

  return (
    <div className="space-y-4">

      {/* PRODUCT LIST */}
      <div className="bg-white p-4 rounded-xl shadow min-h-[500px] max-h-[calc(100vh-150px)] overflow-y-auto">
        <h2 className="text-lg font-bold mb-3">Products</h2>

        {products.map((p) => (
          <div
            key={p.id}
            className="border p-3 rounded-lg mb-2 cursor-pointer hover:bg-gray-100 flex justify-between"
          >
            <div>
              <p className="font-semibold">
                #{p.id} — {p.name}
              </p>
              <p className="text-xs text-gray-600">{statusLabels[p.status]}</p>
            </div>

            <button
              onClick={() => handleOpen(p.id)}
              className="text-blue-600 hover:underline text-sm"
            >
              View
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
