import { useState, useEffect } from "react";
import { getReadOnlyContract, getContract } from "../blockchain/contract";
import DashboardLayout from "../components/DashboardLayout";
import { useWallet } from "../components/WalletContext";
import { useAuth } from "../components/AuthContext";
import { useRole } from "../components/RoleContext";
import { getLocalSigner } from "../blockchain/contract";

type AvailableProduct = {
  productId: string;
  availableQuantity: string;
};

type Quotation = {
  id: string;
  productName: string;
  description: string;
  requestedQuantity: string;
  status: number;
  productId: string;
  createdAt: string;
};

export default function ConsumerDashboard() {
  const [activeTab, setActiveTab] = useState<"browse" | "quotation" | "verify" | "purchases">("browse");
  
  // Browse products
  const [searchName, setSearchName] = useState("");
  const [availableProducts, setAvailableProducts] = useState<AvailableProduct[]>([]);
  const [purchaseProductId, setPurchaseProductId] = useState("");
  const [purchaseQuantity, setPurchaseQuantity] = useState("");

  // Create quotation
  const [quotationName, setQuotationName] = useState("");
  const [quotationDesc, setQuotationDesc] = useState("");
  const [quotationQty, setQuotationQty] = useState("");

  // My quotations
  const [myQuotations, setMyQuotations] = useState<Quotation[]>([]);

  // My purchases
  const [myPurchases, setMyPurchases] = useState<any[]>([]);

  // Verify product
  const [productId, setProductId] = useState("");
  const [details, setDetails] = useState<any>(null);

  const { signer: metaMaskSigner, walletMode } = useWallet();
  const { user } = useAuth();
  const role = useRole();

  const getActiveSigner = async () => {
    if (walletMode === "metamask") {
      if (!metaMaskSigner) {
        alert("Please connect MetaMask to perform this action.");
        return null;
      }
      return metaMaskSigner;
    }

    if (!user) {
      alert("Please login first.");
      return null;
    }

    try {
      return await getLocalSigner(user.address);
    } catch (e: any) {
      alert("Unable to create local signer: " + (e.message || e));
      return null;
    }
  };

  const searchAvailableProducts = async () => {
    if (!searchName.trim()) {
      alert("Please enter a product name to search");
      return;
    }

    try {
      const contract = getReadOnlyContract();
      const [productIds, quantities] = await contract.getAvailableProductsByName(searchName);
      
      const products: AvailableProduct[] = [];
      for (let i = 0; i < productIds.length; i++) {
        products.push({
          productId: productIds[i].toString(),
          availableQuantity: quantities[i].toString(),
        });
      }
      setAvailableProducts(products);
    } catch (error: any) {
      console.error("Error searching products:", error);
      alert("Error searching products: " + (error.message || error));
    }
  };

  const purchaseFromSurplus = async () => {
    if (!purchaseProductId || !purchaseQuantity) {
      alert("Please select a product and enter quantity");
      return;
    }

    const signer = await getActiveSigner();
    if (!signer) return;

    try {
      const contract = getContract(role, signer, true);
      const tx = await contract.purchaseFromSurplus(Number(purchaseProductId), Number(purchaseQuantity));
      await tx.wait();
      alert("Purchase successful!");
      setPurchaseProductId("");
      setPurchaseQuantity("");
      searchAvailableProducts(); // Refresh
    } catch (error: any) {
      console.error("Error purchasing:", error);
      alert("Error purchasing: " + (error.message || error));
    }
  };

  const createQuotation = async () => {
    if (!quotationName || !quotationDesc || !quotationQty) {
      alert("Please fill all fields");
      return;
    }

    const signer = await getActiveSigner();
    if (!signer) return;

    try {
      const contract = getContract(role, signer, true);
      const tx = await contract.createQuotation(quotationName, quotationDesc, Number(quotationQty));
      await tx.wait();
      alert("Quotation created successfully!");
      setQuotationName("");
      setQuotationDesc("");
      setQuotationQty("");
      loadMyQuotations();
    } catch (error: any) {
      console.error("Error creating quotation:", error);
      alert("Error creating quotation: " + (error.message || error));
    }
  };

  const loadMyQuotations = async () => {
    try {
      const signer = await getActiveSigner();
      if (!signer) return;

      const address = await signer.getAddress();
      const contract = getReadOnlyContract();
      const quotationIds = await contract.getConsumerQuotations(address);
      
      const quotations: Quotation[] = [];
      for (const id of quotationIds) {
        const q = await contract.getQuotation(Number(id));
        quotations.push({
          id: id.toString(),
          productName: q[2],
          description: q[3],
          requestedQuantity: q[4].toString(),
          status: Number(q[6]),
          productId: q[7].toString(),
          createdAt: new Date(Number(q[5]) * 1000).toLocaleString(),
        });
      }
      setMyQuotations(quotations);
    } catch (error: any) {
      console.error("Error loading quotations:", error);
    }
  };

  const load = async () => {
    const contract = getReadOnlyContract();
    const res = await contract.getProduct(Number(productId));
    setDetails(res);
  };

  const loadMyPurchases = async () => {
    try {
      const signer = await getActiveSigner();
      if (!signer) return;

      const contract = getReadOnlyContract();
      const consumerAddress = await signer.getAddress();
      const count = await contract.productCount();
      
      const purchases: any[] = [];
      for (let i = 1; i <= Number(count); i++) {
        try {
          const quantity = await contract.getConsumerPurchaseQuantity(i, consumerAddress);
          if (Number(quantity) > 0) {
            const product = await contract.getProductExtended(i);
            const isAcknowledged = await contract.isPurchaseAcknowledged(i, consumerAddress);
            
            purchases.push({
              productId: i.toString(),
              name: product[1],
              description: product[2],
              quantity: quantity.toString(),
              isAcknowledged,
            });
          }
        } catch (e) {
          // Skip invalid products
        }
      }
      setMyPurchases(purchases);
    } catch (error: any) {
      console.error("Error loading purchases:", error);
    }
  };

  const acknowledgePurchase = async (productId: string) => {
    const signer = await getActiveSigner();
    if (!signer) return;

    try {
      const contract = getContract(role, signer, true);
      const tx = await contract.acknowledgePurchase(Number(productId));
      await tx.wait();
      alert("Purchase acknowledged!");
      loadMyPurchases();
    } catch (error: any) {
      console.error("Error acknowledging purchase:", error);
      alert("Error acknowledging purchase: " + (error.message || error));
    }
  };

  useEffect(() => {
    if (activeTab === "quotation") {
      loadMyQuotations();
    } else if (activeTab === "purchases") {
      loadMyPurchases();
    }
  }, [activeTab]);

  const statusLabels: Record<number, string> = {
    0: "Pending",
    1: "Approved",
    2: "Rejected",
    3: "Fulfilled",
  };

  const statusColors: Record<number, string> = {
    0: "bg-yellow-300 text-yellow-800",
    1: "bg-blue-300 text-blue-800",
    2: "bg-red-300 text-red-800",
    3: "bg-green-300 text-green-800",
  };

  return (
    <DashboardLayout
      title="Consumer Dashboard"
      description="Browse available products, create quotations, or verify product authenticity."
    >
      <div className="space-y-4">
        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-700">
          <button
            onClick={() => setActiveTab("browse")}
            className={`px-4 py-2 font-medium ${
              activeTab === "browse"
                ? "border-b-2 border-blue-500 text-blue-400"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            Browse Products
          </button>
          <button
            onClick={() => setActiveTab("quotation")}
            className={`px-4 py-2 font-medium ${
              activeTab === "quotation"
                ? "border-b-2 border-blue-500 text-blue-400"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            My Quotations
          </button>
          <button
            onClick={() => setActiveTab("verify")}
            className={`px-4 py-2 font-medium ${
              activeTab === "verify"
                ? "border-b-2 border-blue-500 text-blue-400"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            Verify Product
          </button>
          <button
            onClick={() => setActiveTab("purchases")}
            className={`px-4 py-2 font-medium ${
              activeTab === "purchases"
                ? "border-b-2 border-blue-500 text-blue-400"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            My Purchases
          </button>
        </div>

        {/* Browse Products Tab */}
        {activeTab === "browse" && (
          <div className="space-y-4">
            <h2 className="font-semibold text-lg">Search Available Products</h2>
            
            <div className="flex gap-2">
              <input
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded"
                placeholder="Product name"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
              />
              <button
                onClick={searchAvailableProducts}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
              >
                Search
              </button>
            </div>

            {availableProducts.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium">Available Products:</h3>
                {availableProducts.map((product) => (
                  <div
                    key={product.productId}
                    className="bg-gray-800 p-3 rounded border border-gray-700"
                  >
                    <p className="text-sm">
                      Product ID: {product.productId} | Available: {product.availableQuantity} units
                    </p>
                    <div className="mt-2 flex gap-2">
                      <input
                        type="number"
                        className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm"
                        placeholder="Quantity"
                        value={purchaseProductId === product.productId ? purchaseQuantity : ""}
                        onChange={(e) => {
                          setPurchaseProductId(product.productId);
                          setPurchaseQuantity(e.target.value);
                        }}
                        max={product.availableQuantity}
                      />
                      <button
                        onClick={purchaseFromSurplus}
                        disabled={purchaseProductId !== product.productId || !purchaseQuantity}
                        className="bg-emerald-600 hover:bg-emerald-700 px-3 py-1 rounded text-sm disabled:bg-gray-600"
                      >
                        Purchase
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-gray-700 pt-4 mt-4">
              <h2 className="font-semibold text-lg mb-2">Create Quotation Request</h2>
              <p className="text-sm text-gray-400 mb-3">
                Can't find what you need? Request a product and producers will fulfill it.
              </p>

              <input
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded mb-2"
                placeholder="Product Name"
                value={quotationName}
                onChange={(e) => setQuotationName(e.target.value)}
              />

              <input
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded mb-2"
                placeholder="Description"
                value={quotationDesc}
                onChange={(e) => setQuotationDesc(e.target.value)}
              />

              <input
                type="number"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded mb-2"
                placeholder="Requested Quantity"
                value={quotationQty}
                onChange={(e) => setQuotationQty(e.target.value)}
              />

              <button
                onClick={createQuotation}
                className="w-full bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg"
              >
                Create Quotation
              </button>
            </div>
          </div>
        )}

        {/* My Quotations Tab */}
        {activeTab === "quotation" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold text-lg">My Quotations</h2>
              <button
                onClick={loadMyQuotations}
                className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
              >
                Refresh
              </button>
            </div>

            {myQuotations.length === 0 ? (
              <p className="text-gray-400 text-sm">No quotations found. Create one in the Browse Products tab.</p>
            ) : (
              <div className="space-y-3">
                {myQuotations.map((q) => (
                  <div
                    key={q.id}
                    className="bg-gray-800 p-4 rounded border border-gray-700"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">{q.productName}</p>
                        <p className="text-sm text-gray-400">{q.description}</p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${statusColors[q.status]}`}
                      >
                        {statusLabels[q.status]}
                      </span>
                    </div>
                    <div className="text-sm text-gray-300 mt-2">
                      <p>Quantity: {q.requestedQuantity} units</p>
                      <p>Created: {q.createdAt}</p>
                      {q.productId !== "0" && (
                        <p className="text-blue-400">Linked Product ID: {q.productId}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Verify Product Tab */}
        {activeTab === "verify" && (
          <div className="space-y-4">
            <h2 className="font-semibold text-lg">Verify Product</h2>
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
              <div className="bg-gray-800 p-4 rounded border border-gray-700">
                <p className="text-sm text-gray-300">
                  <strong>Product Name:</strong> {details[1]} <br />
                  <strong>Status:</strong> {details[9].toString()} <br />
                  <strong>Quantity:</strong> {details[3].toString()}
                </p>
              </div>
            )}
          </div>
        )}

        {/* My Purchases Tab */}
        {activeTab === "purchases" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold text-lg">My Purchases</h2>
              <button
                onClick={loadMyPurchases}
                className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
              >
                Refresh
              </button>
            </div>

            {myPurchases.length === 0 ? (
              <p className="text-gray-400 text-sm">No purchases found.</p>
            ) : (
              <div className="space-y-3">
                {myPurchases.map((purchase) => (
                  <div
                    key={purchase.productId}
                    className="bg-gray-800 p-4 rounded border border-gray-700"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">Product #{purchase.productId}: {purchase.name}</p>
                        <p className="text-sm text-gray-400">{purchase.description}</p>
                        <p className="text-sm text-gray-300 mt-1">
                          Quantity: {purchase.quantity} units
                        </p>
                      </div>
                      {purchase.isAcknowledged ? (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-green-300 text-green-800">
                          Acknowledged
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-300 text-yellow-800">
                          Pending
                        </span>
                      )}
                    </div>
                    {!purchase.isAcknowledged && (
                      <button
                        onClick={() => acknowledgePurchase(purchase.productId)}
                        className="mt-2 w-full bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg"
                      >
                        Acknowledge Purchase
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
