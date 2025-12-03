import { useState, useEffect } from "react";
import { getReadOnlyContract, getContract } from "../blockchain/contract";
import DashboardLayout from "../components/DashboardLayout";
import { useWallet } from "../components/WalletContext";
import { useAuth } from "../components/AuthContext";
import { useRole } from "../components/RoleContext";
import { getLocalSigner } from "../blockchain/contract";
import ErrorModal from "../components/ErrorModal";
import InlineError from "../components/InlineError";
import ProductTemplateSelector from "../components/ProductTemplateSelector";
import { ProductTemplate } from "../data/productTemplates";
import useSupplyChainEvents from "../hooks/useSupplyChainEvents";

type AvailableProduct = {
  productId: string;
  availableQuantity: string;
  productName?: string; // Store name for filtering
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
  const [allAvailableProducts, setAllAvailableProducts] = useState<AvailableProduct[]>([]); // Cache all products
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [purchaseProductId, setPurchaseProductId] = useState("");
  const [purchaseQuantity, setPurchaseQuantity] = useState("");

  // Create quotation
  const [quotationName, setQuotationName] = useState("");
  const [quotationDesc, setQuotationDesc] = useState("");
  const [quotationQty, setQuotationQty] = useState("");
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);

  // My quotations
  const [myQuotations, setMyQuotations] = useState<Quotation[]>([]);

  // My purchases
  const [myPurchases, setMyPurchases] = useState<any[]>([]);

  // Verify product
  const [productId, setProductId] = useState("");
  const [details, setDetails] = useState<any>(null);

  // Error modal (for transaction errors)
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<"error" | "success" | "info">("error");

  // Inline field errors
  const [fieldErrors, setFieldErrors] = useState<{
    searchName?: string;
    purchaseProductId?: string;
    purchaseQuantity?: string;
    quotationName?: string;
    quotationDesc?: string;
    quotationQty?: string;
    productId?: string;
  }>({});

  const { signer: metaMaskSigner, walletMode } = useWallet();
  const { user } = useAuth();
  const role = useRole();

  const showError = (message: string, type: "error" | "success" | "info" = "error") => {
    setErrorMessage(message);
    setErrorType(type);
  };

  const hideError = () => {
    setErrorMessage(null);
  };

  const setFieldError = (field: keyof typeof fieldErrors, message: string) => {
    setFieldErrors(prev => ({ ...prev, [field]: message }));
  };

  const clearFieldError = (field: keyof typeof fieldErrors) => {
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const clearAllFieldErrors = () => {
    setFieldErrors({});
  };

  const getActiveSigner = async () => {
    if (walletMode === "metamask") {
      if (!metaMaskSigner) {
        showError("Please connect MetaMask to perform this action.");
        return null;
      }
      return metaMaskSigner;
    }

    if (!user) {
      showError("Please login first.");
      return null;
    }

    try {
      return await getLocalSigner(user.address);
    } catch (e: any) {
      showError("Unable to create local signer: " + (e.message || e));
      return null;
    }
  };

  // Load all available products once (cached)
  const loadAllAvailableProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const contract = getReadOnlyContract();
      const count = await contract.productCount();
      
      const products: AvailableProduct[] = [];
      const productNames = new Set<string>(); // For suggestions
      
      // Load products in batches
      const batchSize = 10;
      for (let i = 1; i <= Number(count); i += batchSize) {
        const batchPromises = [];
        for (let j = i; j < Math.min(i + batchSize, Number(count) + 1); j++) {
          batchPromises.push(contract.getProduct(j));
        }
        const batchResults = await Promise.all(batchPromises);
        
        for (let k = 0; k < batchResults.length; k++) {
          const p = batchResults[k];
          const productId = i + k;
          
          if (p[0] !== BigInt(0)) {
            // Check if product is available for sale
            const status = Number(p[9]);
            if (status === 5) { // AvailableForSale
              try {
                // Get extended info for available quantity
                const extended = await contract.getProductExtended(productId);
                const availableQty = Number(extended.availableQuantity);
                
                if (availableQty > 0) {
                  const productName = p[1];
                  products.push({
                    productId: productId.toString(),
                    availableQuantity: availableQty.toString(),
                    productName: productName, // Store name for filtering
                  });
                  productNames.add(productName);
                }
              } catch {
                // Fallback: try exact name search
                try {
                  const [productIds, quantities] = await contract.getAvailableProductsByName(p[1]);
                  for (let idx = 0; idx < productIds.length; idx++) {
                    if (Number(productIds[idx]) === productId) {
                      products.push({
                        productId: productId.toString(),
                        availableQuantity: quantities[idx].toString(),
                        productName: p[1], // Store name
                      });
                      productNames.add(p[1]);
                      break;
                    }
                  }
                } catch {
                  // Skip if can't get quantity
                }
              }
            }
          }
        }
      }
      
      setAllAvailableProducts(products);
      setSearchSuggestions(Array.from(productNames).sort());
      
      // If there's a search query, filter immediately
      if (searchName.trim()) {
        filterProducts(searchName.trim(), products);
      } else {
        setAvailableProducts(products);
      }
    } catch (error: any) {
      console.error("Error loading products:", error);
      showError("Error loading products: " + (error.message || error));
    } finally {
      setIsLoadingProducts(false);
    }
  };

  // Client-side filtering with partial matching (synchronous)
  const filterProducts = (query: string, productsToFilter: AvailableProduct[] = allAvailableProducts) => {
    if (!query.trim()) {
      setAvailableProducts(productsToFilter);
      return;
    }

    const queryLower = query.toLowerCase();
    const filtered = productsToFilter.filter((p) => {
      // Match by product name (partial match)
      if (p.productName && p.productName.toLowerCase().includes(queryLower)) {
        return true;
      }
      // Match by product ID
      if (p.productId.includes(query)) {
        return true;
      }
      return false;
    });
    
    setAvailableProducts(filtered);
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchName.trim()) {
        filterProducts(searchName.trim());
      } else {
        setAvailableProducts(allAvailableProducts);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchName]);

  // Load all products on mount and when tab changes
  useEffect(() => {
    if (activeTab === "browse") {
      loadAllAvailableProducts();
    }
  }, [activeTab]);

  const searchAvailableProducts = async () => {
    clearFieldError("searchName");
    
    if (!searchName.trim()) {
      // Show all if search is empty
      setAvailableProducts(allAvailableProducts);
      return;
    }

    filterProducts(searchName.trim());
  };

  const purchaseFromSurplus = async () => {
    clearFieldError("purchaseProductId");
    clearFieldError("purchaseQuantity");
    
    let hasError = false;
    if (!purchaseProductId) {
      setFieldError("purchaseProductId", "Please select a product");
      hasError = true;
    }
    if (!purchaseQuantity || Number(purchaseQuantity) <= 0) {
      setFieldError("purchaseQuantity", "Please enter a valid quantity (greater than 0)");
      hasError = true;
    }
    if (hasError) return;

    const signer = await getActiveSigner();
    if (!signer) return;

    try {
      const contract = getContract(role, signer, true);
      const tx = await contract.purchaseFromSurplus(Number(purchaseProductId), Number(purchaseQuantity));
      await tx.wait();
      showError("Purchase successful!", "success");
      setPurchaseProductId("");
      setPurchaseQuantity("");
      clearAllFieldErrors();
      // Refresh available products and purchases
      loadAllAvailableProducts();
      loadMyPurchases(); // Refresh purchases list
    } catch (error: any) {
      console.error("Error purchasing:", error);
      showError("Error purchasing: " + (error.message || error));
    }
  };

  const createQuotation = async () => {
    clearFieldError("quotationName");
    clearFieldError("quotationDesc");
    clearFieldError("quotationQty");
    
    let hasError = false;
    if (!quotationName.trim()) {
      setFieldError("quotationName", "Product name is required");
      hasError = true;
    }
    if (!quotationDesc.trim()) {
      setFieldError("quotationDesc", "Description is required");
      hasError = true;
    }
    if (!quotationQty || Number(quotationQty) <= 0) {
      setFieldError("quotationQty", "Please enter a valid quantity (greater than 0)");
      hasError = true;
    }
    if (hasError) return;

    const signer = await getActiveSigner();
    if (!signer) return;

    try {
      const contract = getContract(role, signer, true);
      const tx = await contract.createQuotation(quotationName, quotationDesc, Number(quotationQty));
      await tx.wait();
      showError("Quotation created successfully!", "success");
      setQuotationName("");
      setQuotationDesc("");
      setQuotationQty("");
      clearAllFieldErrors();
      loadMyQuotations();
    } catch (error: any) {
      console.error("Error creating quotation:", error);
      showError("Error creating quotation: " + (error.message || error));
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

  const load = async (pid?: string) => {
    const idToUse = pid || productId;
    clearFieldError("productId");
    
    if (!idToUse) {
      setFieldError("productId", "Please select or enter a product ID");
      return;
    }
    
    if (isNaN(Number(idToUse)) || Number(idToUse) <= 0) {
      setFieldError("productId", "Please enter a valid product ID (positive number)");
      return;
    }
    
    try {
      const contract = getReadOnlyContract();
      const res = await contract.getProduct(Number(idToUse));
      setDetails(res);
      clearFieldError("productId");
    } catch (error: any) {
      console.error("Error loading product:", error);
      // Check if it's a validation error or transaction error
      if (error.message?.includes("does not exist") || error.message?.includes("revert")) {
        setFieldError("productId", "Product not found. Please check the product ID.");
      } else {
        showError("Error loading product: " + (error.message || error));
      }
    }
  };

  const loadMyPurchases = async () => {
    try {
      const signer = await getActiveSigner();
      if (!signer) {
        console.log("No signer available for loadMyPurchases");
        return;
      }

      const contract = getReadOnlyContract();
      const consumerAddress = await signer.getAddress();
      console.log("Loading purchases for consumer:", consumerAddress);
      
      const count = await contract.productCount();
      console.log("Total products:", Number(count));
      
      const purchases: any[] = [];
      for (let i = 1; i <= Number(count); i++) {
        try {
          // Check if product exists first
          const productCheck = await contract.getProduct(i);
          if (productCheck[0] === BigInt(0)) {
            continue; // Skip non-existent products
          }

          const quantity = await contract.getConsumerPurchaseQuantity(i, consumerAddress);
          console.log(`Product ${i}: purchase quantity = ${quantity.toString()}`);
          
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
            console.log(`Added purchase: Product ${i}, Quantity: ${quantity.toString()}`);
          }
        } catch (e: any) {
          // Log error but continue
          console.warn(`Error checking product ${i}:`, e.message || e);
        }
      }
      
      console.log("Total purchases found:", purchases.length);
      setMyPurchases(purchases);
    } catch (error: any) {
      console.error("Error loading purchases:", error);
      showError("Error loading purchases: " + (error.message || error));
    }
  };

  const acknowledgePurchase = async (productId: string) => {
    const signer = await getActiveSigner();
    if (!signer) return;

    try {
      const contract = getContract(role, signer, true);
      const tx = await contract.acknowledgePurchase(Number(productId));
      await tx.wait();
      showError("Purchase acknowledged!", "success");
      loadMyPurchases();
    } catch (error: any) {
      console.error("Error acknowledging purchase:", error);
      showError("Error acknowledging purchase: " + (error.message || error));
    }
  };

  // Track selectedProduct from DashboardLayout
  const [selectedProductFromLayout, setSelectedProductFromLayout] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === "quotation") {
      loadMyQuotations();
    } else if (activeTab === "purchases") {
      loadMyPurchases();
    } else if (activeTab === "browse") {
      loadAllAvailableProducts();
    }
  }, [activeTab]);

  // Auto-refresh on blockchain events
  useSupplyChainEvents(() => {
    // Refresh purchases if on purchases tab
    if (activeTab === "purchases") {
      loadMyPurchases();
    }
    // Refresh available products if on browse tab
    if (activeTab === "browse") {
      loadAllAvailableProducts();
    }
  });

  // Sync selectedProduct with local productId state
  useEffect(() => {
    if (selectedProductFromLayout) {
      setProductId(selectedProductFromLayout);
    }
  }, [selectedProductFromLayout]);

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
    <>
      <DashboardLayout
        title="Consumer Dashboard"
        description="Browse available products, create quotations, or verify product authenticity."
      >
        {({ selectedProduct }) => {
          // Update selectedProduct state when it changes from layout
          if (selectedProduct !== selectedProductFromLayout) {
            setSelectedProductFromLayout(selectedProduct);
          }

          // Use selectedProduct if available, otherwise use local productId
          const currentProductId = selectedProduct || productId;

          return (
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
            
            <div className="space-y-2">
              <div className="flex gap-2 relative">
                <div className="flex-1 relative">
                  <input
                    className={`w-full px-3 py-2 bg-gray-800 border rounded ${
                      fieldErrors.searchName ? "border-red-500" : "border-gray-700"
                    }`}
                    placeholder="Search by product name or ID (partial match supported)..."
                    value={searchName}
                    onChange={(e) => {
                      setSearchName(e.target.value);
                      clearFieldError("searchName");
                      setShowSuggestions(e.target.value.length > 0);
                    }}
                    onFocus={() => {
                      if (searchName.length > 0) setShowSuggestions(true);
                    }}
                    onBlur={() => {
                      // Delay to allow click on suggestion
                      setTimeout(() => setShowSuggestions(false), 200);
                    }}
                  />
                  
                  {/* Autocomplete Suggestions */}
                  {showSuggestions && searchSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {searchSuggestions
                        .filter((name) => 
                          name.toLowerCase().includes(searchName.toLowerCase())
                        )
                        .slice(0, 8) // Limit to 8 suggestions
                        .map((name, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setSearchName(name);
                              setShowSuggestions(false);
                              filterProducts(name);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-gray-700 text-sm text-gray-300 border-b border-gray-700 last:border-b-0"
                          >
                            {name}
                          </button>
                        ))}
                    </div>
                  )}
                  
                  <InlineError message={fieldErrors.searchName || ""} />
                </div>
                <button
                  onClick={searchAvailableProducts}
                  disabled={isLoadingProducts}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                  {isLoadingProducts ? "Loading..." : "Search"}
                </button>
                <button
                  onClick={() => {
                    setSearchName("");
                    setAvailableProducts(allAvailableProducts);
                  }}
                  className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg"
                  title="Clear search"
                >
                  Clear
                </button>
              </div>
              
              {/* Results info */}
              {availableProducts.length > 0 && (
                <p className="text-sm text-gray-400">
                  Found {availableProducts.length} product{availableProducts.length !== 1 ? 's' : ''}
                  {searchName && ` matching "${searchName}"`}
                </p>
              )}
            </div>

            {isLoadingProducts ? (
              <div className="text-center py-8">
                <p className="text-gray-400">Loading available products...</p>
              </div>
            ) : availableProducts.length > 0 ? (
              <div className="space-y-2">
                <h3 className="font-medium">Available Products:</h3>
                {availableProducts.map((product) => (
                  <div
                    key={product.productId}
                    className="bg-gray-800 p-3 rounded border border-gray-700 hover:border-blue-500 transition-colors"
                  >
                    <p className="text-sm font-medium mb-1">
                      {product.productName || `Product #${product.productId}`}
                    </p>
                    <p className="text-xs text-gray-400">
                      ID: {product.productId} | Available: {product.availableQuantity} units
                    </p>
                    <div className="mt-2 flex gap-2">
                      <div className="flex-1">
                        <input
                          type="number"
                          className={`w-full px-2 py-1 bg-gray-700 border rounded text-sm ${
                            fieldErrors.purchaseQuantity ? "border-red-500" : "border-gray-600"
                          }`}
                          placeholder="Quantity"
                          value={purchaseProductId === product.productId ? purchaseQuantity : ""}
                          onChange={(e) => {
                            setPurchaseProductId(product.productId);
                            setPurchaseQuantity(e.target.value);
                            clearFieldError("purchaseQuantity");
                          }}
                          max={product.availableQuantity}
                        />
                        <InlineError message={fieldErrors.purchaseQuantity || ""} />
                      </div>
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
            ) : searchName ? (
              <div className="text-center py-8">
                <p className="text-gray-400">No products found matching "{searchName}"</p>
                <button
                  onClick={() => {
                    setSearchName("");
                    setAvailableProducts(allAvailableProducts);
                  }}
                  className="mt-2 text-blue-400 hover:text-blue-300 text-sm"
                >
                  Show all available products
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400">No products available for sale at the moment.</p>
              </div>
            )}

            <div className="border-t border-gray-700 pt-4 mt-4">
              <div className="flex justify-between items-center mb-2">
                <h2 className="font-semibold text-lg">Create Quotation Request</h2>
                <button
                  onClick={() => setShowTemplateSelector(true)}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 rounded text-sm font-medium"
                >
                  📋 Use Template
                </button>
              </div>
              <p className="text-sm text-gray-400 mb-3">
                Can't find what you need? Request a product and producers will fulfill it.
              </p>

              <div>
                <input
                  className={`w-full px-3 py-2 bg-gray-800 border rounded mb-1 ${
                    fieldErrors.quotationName ? "border-red-500" : "border-gray-700"
                  }`}
                  placeholder="Product Name"
                  value={quotationName}
                  onChange={(e) => {
                    setQuotationName(e.target.value);
                    clearFieldError("quotationName");
                  }}
                />
                <InlineError message={fieldErrors.quotationName || ""} />
              </div>

              <div>
                <input
                  className={`w-full px-3 py-2 bg-gray-800 border rounded mb-1 ${
                    fieldErrors.quotationDesc ? "border-red-500" : "border-gray-700"
                  }`}
                  placeholder="Description"
                  value={quotationDesc}
                  onChange={(e) => {
                    setQuotationDesc(e.target.value);
                    clearFieldError("quotationDesc");
                  }}
                />
                <InlineError message={fieldErrors.quotationDesc || ""} />
              </div>

              <div>
                <input
                  type="number"
                  className={`w-full px-3 py-2 bg-gray-800 border rounded mb-1 ${
                    fieldErrors.quotationQty ? "border-red-500" : "border-gray-700"
                  }`}
                  placeholder="Requested Quantity"
                  value={quotationQty}
                  onChange={(e) => {
                    setQuotationQty(e.target.value);
                    clearFieldError("quotationQty");
                  }}
                />
                <InlineError message={fieldErrors.quotationQty || ""} />
              </div>

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
            <div>
              <input
                className={`w-full px-3 py-2 bg-gray-800 border rounded ${
                  fieldErrors.productId ? "border-red-500" : "border-gray-700"
                }`}
                placeholder="Product ID"
                value={currentProductId}
                onChange={(e) => {
                  setProductId(e.target.value);
                  clearFieldError("productId");
                }}
              />
              <InlineError message={fieldErrors.productId || ""} />
            </div>

            <button
              onClick={() => load(currentProductId)}
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
          );
        }}
      </DashboardLayout>
      {errorMessage && (
        <ErrorModal
          message={errorMessage}
          type={errorType}
          onClose={hideError}
        />
      )}
      {showTemplateSelector && (
        <ProductTemplateSelector
          onSelectTemplate={(template: ProductTemplate) => {
            setQuotationName(template.name);
            setQuotationDesc(template.description);
            setQuotationQty(template.defaultQuantity.toString());
            clearAllFieldErrors();
          }}
          onClose={() => setShowTemplateSelector(false)}
        />
      )}
    </>
  );
}
