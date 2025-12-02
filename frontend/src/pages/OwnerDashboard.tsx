import { useState } from "react";
import { getContract, ALL_ADDRESSES, ADDRESSES } from "../blockchain/contract";
import DashboardLayout from "../components/DashboardLayout";
import { useRole } from "../components/RoleContext";
import { useWallet } from "../components/WalletContext";
import { useAuth } from "../components/AuthContext";
import AddressSelect from "../components/AddressSelect";

export default function OwnerDashboard() {
  const [producerAddress, setProducerAddress] = useState("");
  const [supplierAddress, setSupplierAddress] = useState("");
  const [retailerAddress, setRetailerAddress] = useState("");
  const role = useRole();
  const { signer: metaMaskSigner } = useWallet();
  const { loadRegisteredAccounts } = useAuth();

  const ensureSigner = () => {
    if (!metaMaskSigner) {
      alert("Please connect MetaMask as the owner.");
      return null;
    }
    return metaMaskSigner;
  };

  const registerProducer = async () => {
    if (!producerAddress) {
      alert("Please enter a producer address");
      return;
    }
    try {
      const signer = ensureSigner();
      if (!signer) return;
      const contract = getContract(role, signer, true);
      const tx = await contract.registerProducer(producerAddress);
      await tx.wait();
      alert("Producer registered successfully!");
      setProducerAddress("");
      // Refresh registered accounts list
      await loadRegisteredAccounts();
    } catch (error: any) {
      alert("Error registering producer: " + (error.message || error));
    }
  };

  const registerSupplier = async () => {
    if (!supplierAddress) {
      alert("Please enter a supplier address");
      return;
    }
    try {
      const signer = ensureSigner();
      if (!signer) return;
      const contract = getContract(role, signer, true);
      const tx = await contract.registerSupplier(supplierAddress);
      await tx.wait();
      alert("Supplier registered successfully!");
      setSupplierAddress("");
      // Refresh registered accounts list
      await loadRegisteredAccounts();
    } catch (error: any) {
      alert("Error registering supplier: " + (error.message || error));
    }
  };

  const registerRetailer = async () => {
    if (!retailerAddress) {
      alert("Please enter a retailer address");
      return;
    }
    try {
      const signer = ensureSigner();
      if (!signer) return;
      const contract = getContract(role, signer, true);
      const tx = await contract.registerRetailer(retailerAddress);
      await tx.wait();
      alert("Retailer registered successfully!");
      setRetailerAddress("");
      // Refresh registered accounts list
      await loadRegisteredAccounts();
    } catch (error: any) {
      alert("Error registering retailer: " + (error.message || error));
    }
  };

  return (
    <DashboardLayout
      title="Owner Dashboard"
      description="Register new producers, suppliers, and retailers in the supply chain."
    >
      <div className="space-y-6">
        {/* Register Producer */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="font-semibold text-lg mb-3">Register Producer</h2>
          <AddressSelect
            addresses={ALL_ADDRESSES.producers}
            value={producerAddress}
            onChange={setProducerAddress}
            placeholder="Select or enter Producer Address (0x...)"
            label="Producer Address"
            allowCustom={true}
            role="producers"
          />
          <button
            onClick={registerProducer}
            className="w-full mt-3 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
          >
            Register Producer
          </button>
        </div>

        {/* Register Supplier */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="font-semibold text-lg mb-3">Register Supplier</h2>
          <AddressSelect
            addresses={ALL_ADDRESSES.suppliers}
            value={supplierAddress}
            onChange={setSupplierAddress}
            placeholder="Select or enter Supplier Address (0x...)"
            label="Supplier Address"
            allowCustom={true}
            role="suppliers"
          />
          <button
            onClick={registerSupplier}
            className="w-full mt-3 bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg"
          >
            Register Supplier
          </button>
        </div>

        {/* Register Retailer */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="font-semibold text-lg mb-3">Register Retailer</h2>
          <AddressSelect
            addresses={ALL_ADDRESSES.retailers}
            value={retailerAddress}
            onChange={setRetailerAddress}
            placeholder="Select or enter Retailer Address (0x...)"
            label="Retailer Address"
            allowCustom={true}
            role="retailers"
          />
          <button
            onClick={registerRetailer}
            className="w-full mt-3 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg"
          >
            Register Retailer
          </button>
        </div>

        {/* Owner Info */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="font-semibold text-lg mb-3">Owner Information</h2>
          <p className="text-sm text-gray-300">
            <span className="font-semibold">Owner Address:</span>{" "}
            <span className="text-cyan-300 font-mono">{ADDRESSES.owner}</span>
          </p>
          <p className="text-sm text-gray-400 mt-2">
            As the owner, you can register new stakeholders in the supply chain.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}

