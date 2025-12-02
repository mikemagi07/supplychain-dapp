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

export default function ProductDetailsModal({
  productId,
  onClose,
}: {
  productId: string;
  onClose: () => void;
}) {
  const [product, setProduct] = useState<any>(null);

  const loadProduct = async () => {
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
  };

  useEffect(() => {
    loadProduct();
  }, [productId]);

  if (!product) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-white rounded-xl p-6 w-[450px] shadow-xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-black text-xl"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold mb-2">
          Product #{product.id}
        </h2>

        <div className="space-y-2 text-sm">
          <p><b>Name:</b> {product.name}</p>
          <p><b>Description:</b> {product.description}</p>
          <p><b>Quantity:</b> {product.quantity}</p>
          <p><b>Created At:</b> {product.createdAt}</p>

          <p><b>Status:</b> {statusLabels[product.status]}</p>

          {product.shippingInfo && (
            <p><b>Shipping:</b> {product.shippingInfo}</p>
          )}

          <hr />

          <p><b>Producer:</b> {product.producer}</p>
          <p><b>Supplier:</b> {product.supplier}</p>
          <p><b>Retailer:</b> {product.retailer}</p>
          <p><b>Consumer:</b> {product.consumer}</p>
        </div>
      </div>
    </div>
  );
}
