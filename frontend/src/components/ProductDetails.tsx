import { useEffect, useState } from "react";
import { getReadOnlyContract } from "../blockchain/contract";

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

export default function ProductDetails({ productId }: { productId: string }) {
  const [product, setProduct] = useState<any>(null);

  const loadProduct = async () => {
    try {
      const c = getReadOnlyContract();
      const p = await c.getProduct(Number(productId));

      setProduct({
        id: p[0].toString(),
        name: p[1],
        description: p[2],
        quantity: p[3].toString(),
        createdAt: new Date(Number(p[4]) * 1000).toLocaleString(),
        producer: p[5],
        supplier: p[6],
        retailer: p[7],
        consumer: p[8],
        status: Number(p[9]),
        shippingInfo: p[10],
      });
    } catch (error) {
      console.error("Error loading product details:", error);
    }
  };

  useEffect(() => {
    if (productId) loadProduct();
  }, [productId]);

  if (!product) {
    return (
      <div className="p-4 bg-white rounded-xl shadow text-gray-500">
        Select a product to view details.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          Product #{product.id}
        </h2>
        <span
          className={`px-3 py-1.5 rounded-full text-sm font-semibold ${statusColors[product.status]}`}
        >
          {statusLabels[product.status]}
        </span>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-3">
          <p><b className="text-gray-700">Name:</b> <span className="text-gray-900">{product.name}</span></p>
          <p><b className="text-gray-700">Quantity:</b> <span className="text-gray-900">{product.quantity}</span></p>
        </div>
        <p><b className="text-gray-700">Description:</b> <span className="text-gray-900">{product.description}</span></p>
        <p><b className="text-gray-700">Created:</b> <span className="text-gray-900">{product.createdAt}</span></p>
      </div>

      <div className="pt-2 border-t">
        <h3 className="font-semibold text-gray-800 mb-3 text-sm">Supply Chain Participants</h3>
        <div className="space-y-2 text-sm">
          <p className="flex justify-between">
            <b className="text-gray-700">Producer:</b>
            <span className="text-gray-900 font-mono text-xs">{product.producer || "N/A"}</span>
          </p>
          <p className="flex justify-between">
            <b className="text-gray-700">Supplier:</b>
            <span className="text-gray-900 font-mono text-xs">{product.supplier || "N/A"}</span>
          </p>
          <p className="flex justify-between">
            <b className="text-gray-700">Retailer:</b>
            <span className="text-gray-900 font-mono text-xs">{product.retailer || "N/A"}</span>
          </p>
          <p className="flex justify-between">
            <b className="text-gray-700">Consumer:</b>
            <span className="text-gray-900 font-mono text-xs">{product.consumer || "N/A"}</span>
          </p>
        </div>
      </div>

      {product.shippingInfo && (
        <div className="pt-3 border-t">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-sm">
            <b className="text-gray-700">Shipping Info:</b>
            <p className="text-gray-900 mt-1">{product.shippingInfo}</p>
          </div>
        </div>
      )}
    </div>
  );
}
