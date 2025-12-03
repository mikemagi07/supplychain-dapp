import { useState, useEffect } from "react";
import { getContract, ALL_ADDRESSES, getLocalSigner, getAddressesForRole, getReadOnlyContract } from "../blockchain/contract";
import DashboardLayout from "../components/DashboardLayout";
import { useRole } from "../components/RoleContext";
import { useWallet } from "../components/WalletContext";
import { useAuth } from "../components/AuthContext";
import AddressSelect from "../components/AddressSelect";
import ErrorModal from "../components/ErrorModal";
import InlineError from "../components/InlineError";

export default function ProducerDashboard() {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [qty, setQty] = useState("");
  const [supplier, setSupplier] = useState("");
  const [pendingQuotations, setPendingQuotations] = useState<any[]>([]);
  const [selectedQuotations, setSelectedQuotations] = useState<Set<string>>(new Set());
  const [batchTotalQty, setBatchTotalQty] = useState("");
  
  // Error modal (for transaction errors)
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<"error" | "success" | "info">("error");

  // Inline field errors
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    desc?: string;
    qty?: string;
    supplier?: string;
    batchTotalQty?: string;
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

  const getActiveSigner = async () => {
    if (walletMode === "metamask") {
      if (!metaMaskSigner) {
        showError("Please connect MetaMask to perform this action.");
        return null;
      }
      
      // Verify the MetaMask address is registered as a producer in the contract
      const metaMaskAddress = await metaMaskSigner.getAddress();
      console.log("MetaMask address:", metaMaskAddress);
      // Check both the registeredAccounts list and directly with the contract
      const isInList = registeredAccounts.producers.some(
        addr => addr.toLowerCase() === metaMaskAddress.toLowerCase()
      );
      
      // Also verify directly with the contract to ensure it's actually registered
      try {
        const contract = getReadOnlyContract();
        const isRegisteredInContract = await contract.producers(metaMaskAddress);
        
        if (!isRegisteredInContract) {
          showError(`This MetaMask address (${metaMaskAddress.slice(0, 6)}...${metaMaskAddress.slice(-4)}) is not registered as a producer in the contract. Please use an owner account to register it first, or use a different MetaMask account that is registered as a producer.\n\nNote: If you just deployed, make sure the contract was deployed with MetaMask addresses registered.`);
          return null;
        }
      } catch (error: any) {
        console.error("Error checking producer registration:", error);
        // If we can't check, at least verify it's in the list
        if (!isInList) {
          showError(`Unable to verify producer registration. This address may not be registered. Please try refreshing the page or contact an owner to register this address.`);
          return null;
        }
      }
      
      return metaMaskSigner;
    }

    if (!user) {
      showError("Please login as a local producer first.");
      return null;
    }

    try {
      return await getLocalSigner(user.address);
    } catch (e: any) {
      showError("Unable to create local signer: " + (e.message || e));
      return null;
    }
  };

  const createProduct = async (refreshProducts: () => void) => {
    clearFieldError("name");
    clearFieldError("desc");
    clearFieldError("qty");
    
    let hasError = false;
    if (!name.trim()) {
      setFieldError("name", "Product name is required");
      hasError = true;
    }
    if (!desc.trim()) {
      setFieldError("desc", "Description is required");
      hasError = true;
    }
    if (!qty || Number(qty) <= 0) {
      setFieldError("qty", "Please enter a valid quantity (greater than 0)");
      hasError = true;
    }
    if (hasError) return;

    const signer = await getActiveSigner();
    if (!signer) return;

    try {
      const contract = getContract(role, signer, true);
      const tx = await contract.addProduct(name, desc, Number(qty));
      await tx.wait();
      showError("Product created successfully!", "success");
      setName("");
      setDesc("");
      setQty("");
      clearAllFieldErrors();
      refreshProducts();
    } catch (error: any) {
      console.error("Error creating product:", error);
      showError("Error creating product: " + (error.message || error));
    }
  };

  const sendToSupplier = async (refreshProducts: () => void, productId: string) => {
    clearFieldError("supplier");
    
    if (!supplier) {
      setFieldError("supplier", "Please select a supplier");
      return;
    }

    const signer = await getActiveSigner();
    if (!signer) return;

    try {
      const contract = getContract(role, signer, true);
      const tx = await contract.sendToSupplier(Number(productId), supplier);
      await tx.wait();
      showError("Product sent to supplier successfully!", "success");
      setSupplier("");
      clearAllFieldErrors();
      refreshProducts();
    } catch (error: any) {
      console.error("Error sending to supplier:", error);
      showError("Error sending to supplier: " + (error.message || error));
    }
  };

  const loadPendingQuotations = async () => {
    try {
      const contract = getReadOnlyContract();
      const quotationIds = await contract.getPendingQuotations();
      
      const quotations: any[] = [];
      for (const id of quotationIds) {
        const q = await contract.getQuotation(Number(id));
        quotations.push({
          id: id.toString(),
          consumer: q[1],
          productName: q[2],
          description: q[3],
          requestedQuantity: q[4].toString(),
          createdAt: new Date(Number(q[5]) * 1000).toLocaleString(),
        });
      }
      setPendingQuotations(quotations);
    } catch (error: any) {
      console.error("Error loading quotations:", error);
    }
  };

  const toggleQuotationSelection = (quotationId: string) => {
    const newSelected = new Set(selectedQuotations);
    if (newSelected.has(quotationId)) {
      newSelected.delete(quotationId);
    } else {
      newSelected.add(quotationId);
    }
    setSelectedQuotations(newSelected);
  };

  const approveQuotations = async () => {
    clearFieldError("batchTotalQty");
    
    if (selectedQuotations.size === 0) {
      showError("Please select at least one quotation");
      return;
    }

    if (!batchTotalQty || Number(batchTotalQty) <= 0) {
      setFieldError("batchTotalQty", "Please enter a valid total production quantity (greater than 0)");
      return;
    }

    const signer = await getActiveSigner();
    if (!signer) return;

    try {
      const contract = getContract(role, signer, true);
      const quotationIds = Array.from(selectedQuotations).map(id => Number(id));
      
      // Calculate total requested
      let totalRequested = 0;
      for (const id of quotationIds) {
        const q = await contract.getQuotation(id);
        totalRequested += Number(q[4]);
      }

      if (Number(batchTotalQty) < totalRequested) {
        setFieldError("batchTotalQty", `Total quantity (${batchTotalQty}) must be >= sum of requested quantities (${totalRequested})`);
        return;
      }

      const tx = await contract.approveQuotations(quotationIds, Number(batchTotalQty));
      await tx.wait();
      showError("Quotations approved! Product created.", "success");
      setSelectedQuotations(new Set());
      setBatchTotalQty("");
      clearAllFieldErrors();
      loadPendingQuotations();
    } catch (error: any) {
      console.error("Error approving quotations:", error);
      showError("Error approving quotations: " + (error.message || error));
    }
  };

  const rejectQuotation = async (quotationId: string) => {
    if (!window.confirm("Are you sure you want to reject this quotation?")) return;

    const signer = await getActiveSigner();
    if (!signer) return;

    try {
      const contract = getContract(role, signer, true);
      const tx = await contract.rejectQuotation(Number(quotationId));
      await tx.wait();
      showError("Quotation rejected", "success");
      loadPendingQuotations();
    } catch (error: any) {
      console.error("Error rejecting quotation:", error);
      showError("Error rejecting quotation: " + (error.message || error));
    }
  };

  useEffect(() => {
    loadPendingQuotations();
  }, []);

  return (
    <>
      <DashboardLayout
        title="Producer Dashboard"
        description="Create products and send them to suppliers."
      >
        {({ refreshProducts, selectedProduct }) => (
          <>
            {/* PENDING QUOTATIONS */}
          <h2 className="font-semibold text-lg mt-2">Pending Quotations</h2>
          <div className="mb-4">
            <button
              onClick={loadPendingQuotations}
              className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm mb-2"
            >
              Refresh
            </button>
          </div>

          {pendingQuotations.length === 0 ? (
            <p className="text-sm text-gray-400 mb-4">No pending quotations</p>
          ) : (
            <div className="space-y-3 mb-6">
              {pendingQuotations.map((q) => (
                <div
                  key={q.id}
                  className="bg-gray-800 p-3 rounded border border-gray-700"
                >
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={selectedQuotations.has(q.id)}
                      onChange={() => toggleQuotationSelection(q.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{q.productName}</p>
                      <p className="text-sm text-gray-400">{q.description}</p>
                      <p className="text-sm text-gray-300 mt-1">
                        Quantity: {q.requestedQuantity} | Created: {q.createdAt}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Consumer: {q.consumer.slice(0, 6)}...{q.consumer.slice(-4)}
                      </p>
                    </div>
                    <button
                      onClick={() => rejectQuotation(q.id)}
                      className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}

              {selectedQuotations.size > 0 && (
                <div className="bg-blue-900/30 border border-blue-700 p-4 rounded">
                  <p className="text-sm mb-2">
                    {selectedQuotations.size} quotation(s) selected
                  </p>
                  <div>
                    <input
                      type="number"
                      className={`w-full px-3 py-2 bg-gray-800 border rounded mb-1 ${
                        fieldErrors.batchTotalQty ? "border-red-500" : "border-gray-700"
                      }`}
                      placeholder="Total Production Quantity (must be >= sum of requested)"
                      value={batchTotalQty}
                      onChange={(e) => {
                        setBatchTotalQty(e.target.value);
                        clearFieldError("batchTotalQty");
                      }}
                    />
                    <InlineError message={fieldErrors.batchTotalQty || ""} />
                  </div>
                  <button
                    onClick={approveQuotations}
                    className="w-full bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg mt-2"
                  >
                    Approve Selected Quotations
                  </button>
                </div>
              )}
            </div>
          )}

          {/* CREATE PRODUCT */}
          <h2 className="font-semibold text-lg mt-2">Create Product (Manual)</h2>

          <div>
            <input
              className={`w-full px-3 py-2 bg-gray-800 border rounded ${
                fieldErrors.name ? "border-red-500" : "border-gray-700"
              }`}
              placeholder="Name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                clearFieldError("name");
              }}
            />
            <InlineError message={fieldErrors.name || ""} />
          </div>

          <div>
            <input
              className={`w-full px-3 py-2 bg-gray-800 border rounded ${
                fieldErrors.desc ? "border-red-500" : "border-gray-700"
              }`}
              placeholder="Description"
              value={desc}
              onChange={(e) => {
                setDesc(e.target.value);
                clearFieldError("desc");
              }}
            />
            <InlineError message={fieldErrors.desc || ""} />
          </div>

          <div>
            <input
              className={`w-full px-3 py-2 bg-gray-800 border rounded ${
                fieldErrors.qty ? "border-red-500" : "border-gray-700"
              }`}
              placeholder="Quantity"
              value={qty}
              onChange={(e) => {
                setQty(e.target.value);
                clearFieldError("qty");
              }}
            />
            <InlineError message={fieldErrors.qty || ""} />
          </div>

          <button
            onClick={() => createProduct(refreshProducts)}
            className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
          >
            Create Product
          </button>

          {/* SEND TO SUPPLIER */}
          <h2 className="font-semibold text-lg mt-6">Send to Supplier</h2>

          <p className="text-sm opacity-90">
            Selected Product ID:{" "}
            <span className="text-cyan-300">
              {selectedProduct ?? "None selected"}
            </span>
          </p>

          <AddressSelect
            addresses={getAddressesForRole("suppliers", includeMetaMask)}
            value={supplier}
            onChange={(value) => {
              setSupplier(value);
              clearFieldError("supplier");
            }}
            placeholder="Select Supplier Address"
            label="Supplier Address"
            role="suppliers"
            error={fieldErrors.supplier}
          />

          <button
            disabled={!selectedProduct}
            onClick={() => sendToSupplier(refreshProducts, selectedProduct!)}
            className="w-full bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg disabled:bg-gray-600"
          >
            Send to Supplier
          </button>
          </>
        )}
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
