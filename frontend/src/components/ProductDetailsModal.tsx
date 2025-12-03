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
    // Use getProductExtended to get accurate availableQuantity
    const p = await c.getProductExtended(Number(productId));

    const formatTimestamp = (timestamp: bigint) => {
      if (timestamp === BigInt(0)) return "Not yet";
      return new Date(Number(timestamp) * 1000).toLocaleString();
    };

    setProduct({
      id: p[0].toString(),
      name: p[1],
      description: p[2],
      totalQuantity: p[3].toString(),
      availableQuantity: p[4].toString(),
      createdAt: new Date(Number(p[5]) * 1000).toLocaleString(),
      producer: p[6],
      supplier: p[7],
      retailer: p[8],
      consumer: p[9],
      status: Number(p[10]),
      shippingInfo: p[11],
      sentToSupplierAt: formatTimestamp(p[14]),
      receivedBySupplierAt: formatTimestamp(p[15]),
      sentToRetailerAt: formatTimestamp(p[16]),
      receivedByRetailerAt: formatTimestamp(p[17]),
      addedToStoreAt: formatTimestamp(p[18]),
      soldToConsumerAt: formatTimestamp(p[19]),
    });
  };

  useEffect(() => {
    loadProduct();
  }, [productId]);

  if (!product) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 w-[500px] max-w-[90vw] max-h-[90vh] overflow-y-auto shadow-xl relative" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-black text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          ✕
        </button>

        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Product #{product.id}
          </h2>
          <span
            className={`inline-block px-3 py-1.5 rounded-full text-sm font-semibold ${statusColors[product.status]}`}
          >
            {statusLabels[product.status]}
          </span>
        </div>

        <div className="space-y-4 text-sm">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="mb-1"><b className="text-gray-700">Name:</b> <span className="text-gray-900">{product.name}</span></p>
            <p className="mb-1"><b className="text-gray-700">Description:</b> <span className="text-gray-900">{product.description}</span></p>
            <p className="mb-1">
              <b className="text-gray-700">Total Quantity:</b> <span className="text-gray-900">{product.totalQuantity}</span>
            </p>
            <p className="mb-1">
              <b className="text-gray-700">Available Quantity:</b> 
              <span className={`font-semibold ${Number(product.availableQuantity) > 0 ? "text-green-600" : "text-red-600"}`}>
                {product.availableQuantity}
              </span>
            </p>
            {Number(product.totalQuantity) > 0 && Number(product.availableQuantity) < Number(product.totalQuantity) && (
              <p className="mb-1 text-sm text-gray-600">
                Sold: {Number(product.totalQuantity) - Number(product.availableQuantity)} units
              </p>
            )}
            <p><b className="text-gray-700">Created At:</b> <span className="text-gray-900">{product.createdAt}</span></p>
          </div>

          {product.shippingInfo && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p><b className="text-gray-700">Shipping Info:</b></p>
              <p className="text-gray-900 mt-1">{product.shippingInfo}</p>
            </div>
          )}

          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-800 mb-3">Supply Chain Participants</h3>
            <div className="space-y-2">
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
                <b className="text-gray-700">Last Consumer:</b>
                <span className="text-gray-900 font-mono text-xs">{product.consumer || "N/A"}</span>
              </p>
              {product.consumer && Number(product.availableQuantity) > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Note: This shows the last consumer. Product may have multiple partial sales.
                </p>
              )}
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-800 mb-3">Product Timeline</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-start">
                <b className="text-gray-700">Created:</b>
                <span className="text-gray-900 text-right">{product.createdAt}</span>
              </div>
              <div className="flex justify-between items-start">
                <b className="text-gray-700">Sent to Supplier:</b>
                <span className="text-gray-900 text-right">{product.sentToSupplierAt}</span>
              </div>
              <div className="flex justify-between items-start">
                <b className="text-gray-700">Received by Supplier:</b>
                <span className="text-gray-900 text-right">{product.receivedBySupplierAt}</span>
              </div>
              <div className="flex justify-between items-start">
                <b className="text-gray-700">Sent to Retailer:</b>
                <span className="text-gray-900 text-right">{product.sentToRetailerAt}</span>
              </div>
              <div className="flex justify-between items-start">
                <b className="text-gray-700">Received by Retailer:</b>
                <span className="text-gray-900 text-right">{product.receivedByRetailerAt}</span>
              </div>
              <div className="flex justify-between items-start">
                <b className="text-gray-700">Added to Store:</b>
                <span className="text-gray-900 text-right">{product.addedToStoreAt}</span>
              </div>
              <div className="flex justify-between items-start">
                <b className="text-gray-700">Sold to Consumer:</b>
                <span className="text-gray-900 text-right">{product.soldToConsumerAt}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
