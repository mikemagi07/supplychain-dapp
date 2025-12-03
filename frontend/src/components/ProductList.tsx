import { useEffect, useState, useCallback, useMemo } from "react";
import { getReadOnlyContract } from "../blockchain/contract";
import ProductDetailsModal from "./ProductDetailsModal";
import useSupplyChainEvents from "../hooks/useSupplyChainEvents";

type Product = { 
  id: string; 
  name: string; 
  status: number;
  totalQuantity?: string;
  availableQuantity?: string;
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
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const c = getReadOnlyContract();
      const count = await c.productCount();

      const list: Product[] = [];
      // Load products in batches to avoid overwhelming the blockchain
      const batchSize = 10;
      for (let i = 1; i <= Number(count); i += batchSize) {
        const batchPromises = [];
        const productIds = [];
        for (let j = i; j < Math.min(i + batchSize, Number(count) + 1); j++) {
          productIds.push(j);
          batchPromises.push(c.getProduct(j));
        }
        const batchResults = await Promise.all(batchPromises);
        
        for (let k = 0; k < batchResults.length; k++) {
          const p = batchResults[k];
          const productId = productIds[k];
          if (p[0] !== BigInt(0)) {
            // For now, use basic product info
            // Extended info (quantities) can be loaded on-demand in ProductDetailsModal
            list.push({
              id: p[0].toString(),
              name: p[1],
              status: Number(p[9]),
            });
          }
        }
      }
      setProducts(list);
    } catch (err) {
      console.error("Error loading products:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // refresh on parent change
  useEffect(() => {
    loadProducts();
  }, [refreshKey, loadProducts]);

  // refresh automatically on blockchain events
  useSupplyChainEvents(loadProducts);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = 
        searchQuery === "" ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.includes(searchQuery);
      
      const matchesStatus = statusFilter === null || p.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [products, searchQuery, statusFilter]);

  const handleSelect = (id: string) => {
    if (onSelectProduct) onSelectProduct(id);
  };

  const handleOpenModal = (id: string) => {
    setSelectedId(id);
    if (onSelectProduct) onSelectProduct(id);
  };

  return (
    <div className="space-y-4 h-full">
      {/* FILTERS */}
      <div className="bg-white p-4 rounded-xl shadow-lg">
        <div className="flex gap-4 flex-wrap items-center">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter === null ? "" : statusFilter}
              onChange={(e) => setStatusFilter(e.target.value === "" ? null : Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              {Object.entries(statusLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Results Count */}
          <div className="text-sm text-gray-600">
            Showing {filteredProducts.length} of {products.length}
          </div>
        </div>
      </div>

      {/* PRODUCT LIST */}
      <div className="bg-white p-6 rounded-xl shadow-lg min-h-[600px] h-[calc(100vh-300px)] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Products</h2>
          {loading && (
            <span className="text-sm text-gray-500">Loading...</span>
          )}
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {products.length === 0 
                ? "No products found. Create your first product!" 
                : "No products match your filters."}
            </p>
          </div>
        ) : (
          filteredProducts.map((p) => (
            <div
              key={p.id}
              onClick={() => handleSelect(p.id)}
              className="border border-gray-200 p-4 rounded-lg mb-3 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all bg-white flex justify-between items-center group"
            >
              <div className="flex-1">
                <p className="font-semibold text-gray-900 mb-2 group-hover:text-blue-700 transition-colors">
                  #{p.id} — {p.name}
                </p>
                <div className="flex gap-3 items-center flex-wrap">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusColors[p.status]}`}
                  >
                    {statusLabels[p.status]}
                  </span>
                  {p.totalQuantity !== undefined && (
                    <span className="text-xs text-gray-600">
                      Total: {p.totalQuantity}
                    </span>
                  )}
                  {p.availableQuantity !== undefined && (
                    <span className={`text-xs font-medium ${
                      Number(p.availableQuantity) > 0 ? "text-green-600" : "text-red-600"
                    }`}>
                      Available: {p.availableQuantity}
                    </span>
                  )}
                </div>
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
          ))
        )}
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
