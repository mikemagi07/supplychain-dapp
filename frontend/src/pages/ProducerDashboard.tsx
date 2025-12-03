import { useState, useEffect } from "react";
import { getContract, ALL_ADDRESSES, getLocalSigner, getAddressesForRole, getReadOnlyContract } from "../blockchain/contract";
import DashboardLayout from "../components/DashboardLayout";
import { useRole } from "../components/RoleContext";
import { useWallet } from "../components/WalletContext";
import { useAuth } from "../components/AuthContext";
import AddressSelect from "../components/AddressSelect";

export default function ProducerDashboard() {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [qty, setQty] = useState("");
  const [supplier, setSupplier] = useState("");
  const [pendingQuotations, setPendingQuotations] = useState<any[]>([]);
  const [selectedQuotations, setSelectedQuotations] = useState<Set<string>>(new Set());
  const [batchTotalQty, setBatchTotalQty] = useState("");
  const role = useRole();
  const { signer: metaMaskSigner, walletMode, useMetaMask } = useWallet();
  const { user, registeredAccounts } = useAuth();
  const includeMetaMask = useMetaMask();

  const getActiveSigner = async () => {
    if (walletMode === "metamask") {
      if (!metaMaskSigner) {
        alert("Please connect MetaMask to perform this action.");
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
          alert(`This MetaMask address (${metaMaskAddress.slice(0, 6)}...${metaMaskAddress.slice(-4)}) is not registered as a producer in the contract. Please use an owner account to register it first, or use a different MetaMask account that is registered as a producer.\n\nNote: If you just deployed, make sure the contract was deployed with MetaMask addresses registered.`);
          return null;
        }
      } catch (error: any) {
        console.error("Error checking producer registration:", error);
        // If we can't check, at least verify it's in the list
        if (!isInList) {
          alert(`Unable to verify producer registration. This address may not be registered. Please try refreshing the page or contact an owner to register this address.`);
          return null;
        }
      }
      
      return metaMaskSigner;
    }

    if (!user) {
      alert("Please login as a local producer first.");
      return null;
    }

    try {
      return await getLocalSigner(user.address);
    } catch (e: any) {
      alert("Unable to create local signer: " + (e.message || e));
      return null;
    }
  };

  const createProduct = async (refreshProducts: () => void) => {
    const signer = await getActiveSigner();
    if (!signer) return;

    const contract = getContract(role, signer, true);
    const tx = await contract.addProduct(name, desc, Number(qty));
    await tx.wait();
    refreshProducts();
  };

  const sendToSupplier = async (refreshProducts: () => void, productId: string) => {
    const signer = await getActiveSigner();
    if (!signer) return;

    const contract = getContract(role, signer, true);
    const tx = await contract.sendToSupplier(Number(productId), supplier);
    await tx.wait();
    refreshProducts();
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
    if (selectedQuotations.size === 0) {
      alert("Please select at least one quotation");
      return;
    }

    if (!batchTotalQty) {
      alert("Please enter total production quantity");
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
        alert(`Total quantity (${batchTotalQty}) must be >= sum of requested quantities (${totalRequested})`);
        return;
      }

      const tx = await contract.approveQuotations(quotationIds, Number(batchTotalQty));
      await tx.wait();
      alert("Quotations approved! Product created.");
      setSelectedQuotations(new Set());
      setBatchTotalQty("");
      loadPendingQuotations();
    } catch (error: any) {
      console.error("Error approving quotations:", error);
      alert("Error approving quotations: " + (error.message || error));
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
      alert("Quotation rejected");
      loadPendingQuotations();
    } catch (error: any) {
      console.error("Error rejecting quotation:", error);
      alert("Error rejecting quotation: " + (error.message || error));
    }
  };

  useEffect(() => {
    loadPendingQuotations();
  }, []);

  return (
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
                  <input
                    type="number"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded mb-2"
                    placeholder="Total Production Quantity (must be >= sum of requested)"
                    value={batchTotalQty}
                    onChange={(e) => setBatchTotalQty(e.target.value)}
                  />
                  <button
                    onClick={approveQuotations}
                    className="w-full bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg"
                  >
                    Approve Selected Quotations
                  </button>
                </div>
              )}
            </div>
          )}

          {/* CREATE PRODUCT */}
          <h2 className="font-semibold text-lg mt-2">Create Product (Manual)</h2>

          <input
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded"
            placeholder="Name"
            onChange={(e) => setName(e.target.value)}
          />

          <input
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded"
            placeholder="Description"
            onChange={(e) => setDesc(e.target.value)}
          />

          <input
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded"
            placeholder="Quantity"
            onChange={(e) => setQty(e.target.value)}
          />

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
            onChange={setSupplier}
            placeholder="Select Supplier Address"
            label="Supplier Address"
            role="suppliers"
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
  );
}
