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
    <div className="bg-white rounded-xl shadow p-5 space-y-4">
      <h2 className="text-xl font-bold flex items-center gap-2">
        Product #{product.id}
        <span
          className={`px-2 py-1 rounded-full text-xs ${statusColors[product.status]}`}
        >
          {statusLabels[product.status]}
        </span>
      </h2>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <p><b>Name:</b> {product.name}</p>
        <p><b>Quantity:</b> {product.quantity}</p>
        <p className="col-span-2"><b>Description:</b> {product.description}</p>
        <p><b>Created:</b> {product.createdAt}</p>
      </div>

      <div className="pt-2 border-t text-sm space-y-1">
        <p><b>Producer:</b> {product.producer}</p>
        <p><b>Supplier:</b> {product.supplier}</p>
        <p><b>Retailer:</b> {product.retailer}</p>
        <p><b>Consumer:</b> {product.consumer}</p>
      </div>

      {product.shippingInfo && (
        <div className="pt-3 border-t text-sm">
          <b>Shipping Info:</b>
          <p className="text-gray-700">{product.shippingInfo}</p>
        </div>
      )}
    </div>
  );
}
