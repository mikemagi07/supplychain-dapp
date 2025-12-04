import { useState, useEffect, useRef } from "react";
import { getContract, ALL_ADDRESSES, getLocalSigner, getAddressesForRole, getReadOnlyContract } from "../blockchain/contract";
import DashboardLayout from "../components/DashboardLayout";
import { useRole } from "../components/RoleContext";
import { useWallet } from "../components/WalletContext";
import { useAuth } from "../components/AuthContext";
import AddressSelect from "../components/AddressSelect";
import ErrorModal from "../components/ErrorModal";
import InlineError from "../components/InlineError";

export default function RetailerDashboard() {
  const [productId, setProductId] = useState("");
  const [consumer, setConsumer] = useState("");
  const [saleQuantity, setSaleQuantity] = useState("");
  const [fulfillProductId, setFulfillProductId] = useState("");
  const [productsWithQuotations, setProductsWithQuotations] = useState<any[]>([]);
  const [selectedQuotationsForFulfill, setSelectedQuotationsForFulfill] = useState<Set<string>>(new Set());
  const [surplusProducts, setSurplusProducts] = useState<any[]>([]);
  const [storeProducts, setStoreProducts] = useState<any[]>([]);
  
  // Error modal (for transaction errors)
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<"error" | "success" | "info">("error");

  // Inline field errors
  const [fieldErrors, setFieldErrors] = useState<{
    productId?: string;
    consumer?: string;
    saleQuantity?: string;
  }>({});

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
  const { signer: metaMaskSigner, walletMode, useMetaMask } = useWallet();
  const { user, registeredAccounts } = useAuth();
  const includeMetaMask = useMetaMask();

  const ensureSigner = async () => {
    if (walletMode === "metamask") {
      if (!metaMaskSigner) {
        showError("Please connect MetaMask to perform this action.");
        return null;
      }
      
      // Verify the MetaMask address is registered as a retailer in the contract
      const metaMaskAddress = await metaMaskSigner.getAddress();
      
      // Check both the registeredAccounts list and directly with the contract
      const isInList = registeredAccounts.retailers.some(
        addr => addr.toLowerCase() === metaMaskAddress.toLowerCase()
      );
      
      // Also verify directly with the contract to ensure it's actually registered
      try {
        const contract = getReadOnlyContract();
        const isRegisteredInContract = await contract.retailers(metaMaskAddress);
        
        if (!isRegisteredInContract) {
          showError(`This MetaMask address (${metaMaskAddress.slice(0, 6)}...${metaMaskAddress.slice(-4)}) is not registered as a retailer in the contract. Please use an owner account to register it first, or use a different MetaMask account that is registered as a retailer.\n\nNote: If you just deployed, make sure the contract was deployed with MetaMask addresses registered.`);
          return null;
        }
      } catch (error: any) {
        console.error("Error checking retailer registration:", error);
        // If we can't check, at least verify it's in the list
        if (!isInList) {
          showError(`Unable to verify retailer registration. This address may not be registered. Please try refreshing the page or contact an owner to register this address.`);
          return null;
        }
      }
      
      return metaMaskSigner;
    }

    if (!user) {
      showError("Please login as a local retailer first.");
      return null;
    }

    try {
      return await getLocalSigner(user.address);
    } catch (e: any) {
      showError("Unable to create local signer: " + (e.message || e));
      return null;
    }
  };

  const receive = async (pid?: string) => {
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
    
    const signer = await ensureSigner();
    if (!signer) return;
    try {
      const contract = getContract(role, signer, true);
      const tx = await contract.receiveProductFromSupplier(Number(idToUse));
      await tx.wait();
      showError("Received from Supplier", "success");
      clearAllFieldErrors();
      loadStoreProducts();
    } catch (error: any) {
      console.error("Error receiving product:", error);
      showError("Error receiving product: " + (error.message || error));
    }
  };

  const add = async (pid?: string) => {
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
    
    const signer = await ensureSigner();
    if (!signer) return;
    try {
      const contract = getContract(role, signer, true);
      const tx = await contract.addToStore(Number(idToUse));
      await tx.wait();
      showError("Product added to store", "success");
      clearAllFieldErrors();
      loadStoreProducts();
    } catch (error: any) {
      console.error("Error adding to store:", error);
      showError("Error adding to store: " + (error.message || error));
    }
  };

  const sell = async (pid?: string) => {
    const idToUse = pid || productId;
    clearFieldError("productId");
    clearFieldError("consumer");
    clearFieldError("saleQuantity");
    
    let hasError = false;
    if (!idToUse) {
      setFieldError("productId", "Please select or enter a product ID");
      hasError = true;
    } else if (isNaN(Number(idToUse)) || Number(idToUse) <= 0) {
      setFieldError("productId", "Please enter a valid product ID (positive number)");
      hasError = true;
    }
    if (!consumer) {
      setFieldError("consumer", "Please select a consumer");
      hasError = true;
    }
    if (!saleQuantity || Number(saleQuantity) <= 0) {
      setFieldError("saleQuantity", "Please enter a valid quantity (greater than 0)");
      hasError = true;
    }
    if (hasError) return;

    const signer = await ensureSigner();
    if (!signer) return;

    try {
      const contract = getContract(role, signer, true);
      const tx = await contract.sellToConsumer(Number(idToUse), consumer, Number(saleQuantity));
      await tx.wait();
      showError("Sold to consumer", "success");
      setProductId("");
      setConsumer("");
      setSaleQuantity("");
      clearAllFieldErrors();
      loadStoreProducts();
      loadSurplusInventory();
    } catch (error: any) {
      console.error("Error selling:", error);
      showError("Error selling: " + (error.message || error));
    }
  };

  const loadStoreProducts = async () => {
    try {
      const contract = getReadOnlyContract();
      const signer = await ensureSigner();
      if (!signer) return;

      const retailerAddress = await signer.getAddress();
      const [productIds, names, descriptions, totalQuantities, availableQuantities] = 
        await contract.getRetailerStoreProducts(retailerAddress);
      
      const products: any[] = [];
      for (let i = 0; i < productIds.length; i++) {
        products.push({
          productId: productIds[i].toString(),
          name: names[i],
          description: descriptions[i],
          totalQuantity: totalQuantities[i].toString(),
          availableQuantity: availableQuantities[i].toString(),
        });
      }
      setStoreProducts(products);
    } catch (error: any) {
      console.error("Error loading store products:", error);
    }
  };

  const loadProductsWithQuotations = async () => {
    try {
      const contract = getReadOnlyContract();
      const signer = await ensureSigner();
      if (!signer) return;

      const retailerAddress = await signer.getAddress();
      const count = await contract.productCount();
      
      const products: any[] = [];
      for (let i = 1; i <= Number(count); i++) {
        try {
          const product = await contract.getProductExtended(i);
          if (
            product[8].toLowerCase() === retailerAddress.toLowerCase() && // retailer
            product[10] === 5 && // AvailableForSale
            product[12].length > 0 // has quotations
          ) {
            const quotationDetails: any[] = [];
            for (const qId of product[12]) {
              const q = await contract.getQuotation(Number(qId));
              if (Number(q[6]) === 1) { // Approved status
                quotationDetails.push({
                  id: qId.toString(),
                  consumer: q[1],
                  requestedQuantity: q[4].toString(),
                  productName: q[2],
                });
              }
            }
            
            if (quotationDetails.length > 0) {
              products.push({
                productId: i,
                name: product[1],
                totalQuantity: product[3].toString(),
                availableQuantity: product[4].toString(),
                quotations: quotationDetails,
              });
            }
          }
        } catch (e) {
          // Skip invalid products
        }
      }
      setProductsWithQuotations(products);
    } catch (error: any) {
      console.error("Error loading products:", error);
    }
  };

  const loadSurplusInventory = async () => {
    try {
      const contract = getReadOnlyContract();
      const signer = await ensureSigner();
      if (!signer) return;

      const retailerAddress = await signer.getAddress();
      const count = await contract.productCount();
      
      const products: any[] = [];
      for (let i = 1; i <= Number(count); i++) {
        try {
          const product = await contract.getProductExtended(i);
          if (
            product[8].toLowerCase() === retailerAddress.toLowerCase() && // retailer
            product[10] === 5 && // AvailableForSale
            Number(product[4]) > 0 // has available quantity
          ) {
            products.push({
              productId: i,
              name: product[1],
              description: product[2],
              totalQuantity: product[3].toString(),
              availableQuantity: product[4].toString(),
            });
          }
        } catch (e) {
          // Skip invalid products
        }
      }
      setSurplusProducts(products);
    } catch (error: any) {
      console.error("Error loading surplus:", error);
    }
  };

  const fulfillQuotations = async () => {
    if (!fulfillProductId || selectedQuotationsForFulfill.size === 0) {
      showError("Please select a product and quotations to fulfill");
      return;
    }

    const signer = await ensureSigner();
    if (!signer) return;

    try {
      const contract = getContract(role, signer, true);
      const quotationIds = Array.from(selectedQuotationsForFulfill).map(id => Number(id));
      
      const tx = await contract.fulfillQuotations(Number(fulfillProductId), quotationIds);
      await tx.wait();
      showError("Quotations fulfilled successfully!", "success");
      setSelectedQuotationsForFulfill(new Set());
      setFulfillProductId("");
      loadProductsWithQuotations();
      loadSurplusInventory();
    } catch (error: any) {
      console.error("Error fulfilling quotations:", error);
      showError("Error fulfilling quotations: " + (error.message || error));
    }
  };

  // Track selectedProduct from DashboardLayout
  const [selectedProductFromLayout, setSelectedProductFromLayout] = useState<string | null>(null);

  useEffect(() => {
    loadProductsWithQuotations();
    loadSurplusInventory();
    loadStoreProducts();
  }, []);

  // Sync selectedProduct with local productId state
  useEffect(() => {
    if (selectedProductFromLayout) {
      setProductId(selectedProductFromLayout);
    }
  }, [selectedProductFromLayout]);

  return (
    <>
      <DashboardLayout
        title="Retailer Dashboard"
        description="Receive goods, mark them for sale, fulfill quotations, and sell to consumers."
      >
        {({ selectedProduct }) => {
          // Update selectedProduct state when it changes from layout
          if (selectedProduct !== selectedProductFromLayout) {
            setSelectedProductFromLayout(selectedProduct);
          }

          // Use selectedProduct if available, otherwise use local productId
          const currentProductId = selectedProduct || productId;

          return (
        <div className="space-y-6">
        {/* STORE PRODUCTS */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-semibold text-lg">My Store Products</h2>
            <button
              onClick={loadStoreProducts}
              className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
            >
              Refresh
            </button>
          </div>

          {storeProducts.length === 0 ? (
            <p className="text-sm text-gray-400 mb-4">No products in store</p>
          ) : (
            <div className="space-y-2 mb-4">
              {storeProducts.map((product) => (
                <div
                  key={product.productId}
                  className="bg-gray-800 p-3 rounded border border-gray-700"
                >
                  <p className="font-medium">
                    Product #{product.productId}: {product.name}
                  </p>
                  <p className="text-sm text-gray-400">{product.description}</p>
                  <p className="text-sm text-gray-300 mt-1">
                    Available: {product.availableQuantity} / {product.totalQuantity} units
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FULFILL QUOTATIONS */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-semibold text-lg">Fulfill Quotations</h2>
            <button
              onClick={loadProductsWithQuotations}
              className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
            >
              Refresh
            </button>
          </div>

          {productsWithQuotations.length === 0 ? (
            <p className="text-sm text-gray-400 mb-4">No products with pending quotations</p>
          ) : (
            <div className="space-y-3 mb-4">
              {productsWithQuotations.map((product) => (
                <div
                  key={product.productId}
                  className="bg-gray-800 p-3 rounded border border-gray-700"
                >
                  <p className="font-medium mb-2">
                    Product #{product.productId}: {product.name}
                  </p>
                  <p className="text-sm text-gray-400 mb-2">
                    Total: {product.totalQuantity} | Available: {product.availableQuantity}
                  </p>
                  <div className="space-y-1">
                    {product.quotations.map((q: any) => (
                      <div
                        key={q.id}
                        className="flex items-center gap-2 bg-gray-700 p-2 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={
                            fulfillProductId === product.productId.toString() &&
                            selectedQuotationsForFulfill.has(q.id)
                          }
                          onChange={() => {
                            setFulfillProductId(product.productId.toString());
                            const newSelected = new Set(selectedQuotationsForFulfill);
                            if (newSelected.has(q.id)) {
                              newSelected.delete(q.id);
                            } else {
                              newSelected.add(q.id);
                            }
                            setSelectedQuotationsForFulfill(newSelected);
                          }}
                        />
                        <div className="flex-1 text-sm">
                          <span>Qty: {q.requestedQuantity}</span>
                          <span className="ml-3 text-gray-400">
                            Consumer: {q.consumer.slice(0, 6)}...{q.consumer.slice(-4)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {fulfillProductId === product.productId.toString() &&
                    selectedQuotationsForFulfill.size > 0 && (
                      <button
                        onClick={fulfillQuotations}
                        className="mt-2 w-full bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg"
                      >
                        Fulfill Selected Quotations
                      </button>
                    )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SURPLUS INVENTORY */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-semibold text-lg">Surplus Inventory</h2>
            <button
              onClick={loadSurplusInventory}
              className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
            >
              Refresh
            </button>
          </div>

          {surplusProducts.length === 0 ? (
            <p className="text-sm text-gray-400 mb-4">No surplus inventory</p>
          ) : (
            <div className="space-y-2 mb-4">
              {surplusProducts.map((product) => (
                <div
                  key={product.productId}
                  className="bg-gray-800 p-3 rounded border border-gray-700"
                >
                  <p className="font-medium">
                    Product #{product.productId}: {product.name}
                  </p>
                  <p className="text-sm text-gray-400">
                    Available: {product.availableQuantity} / {product.totalQuantity} units
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* STANDARD OPERATIONS */}
        <div className="border-t border-gray-700 pt-4">
          <h2 className="font-semibold text-lg mb-2">Standard Operations</h2>
          <div>
            <input
              className={`w-full px-3 py-2 bg-gray-800 border rounded mb-1 ${
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
            onClick={() => receive(currentProductId)}
            className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg mb-2"
          >
            Receive from Supplier
          </button>

          <button
            onClick={() => add(currentProductId)}
            className="w-full bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg mb-2"
          >
            Add to Store
          </button>

          <h3 className="font-medium text-md mt-4 mb-2">Sell to Consumer</h3>
          <AddressSelect
            addresses={getAddressesForRole("consumers", includeMetaMask)}
            value={consumer}
            onChange={(value) => {
              setConsumer(value);
              clearFieldError("consumer");
            }}
            placeholder="Select Consumer Address"
            label="Consumer Address"
            role="consumers"
            error={fieldErrors.consumer}
          />

          <div>
            <input
              type="number"
              className={`w-full px-3 py-2 bg-gray-800 border rounded mb-1 ${
                fieldErrors.saleQuantity ? "border-red-500" : "border-gray-700"
              }`}
              placeholder="Quantity to sell"
              value={saleQuantity}
              onChange={(e) => {
                setSaleQuantity(e.target.value);
                clearFieldError("saleQuantity");
              }}
              min="1"
            />
            <InlineError message={fieldErrors.saleQuantity || ""} />
          </div>

          <button
            onClick={() => sell(currentProductId)}
            disabled={!currentProductId || !consumer || !saleQuantity}
            className="w-full bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg disabled:bg-gray-600"
          >
            Sell to Consumer (Partial Quantity)
          </button>
        </div>
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
    </>
  );
}
