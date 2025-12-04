import { useState } from "react";
import { getContract, ALL_ADDRESSES, ADDRESSES, getLocalSigner, getAddressesForRole, getReadOnlyContract } from "../blockchain/contract";
import DashboardLayout from "../components/DashboardLayout";
import { useRole } from "../components/RoleContext";
import { useWallet } from "../components/WalletContext";
import { useAuth } from "../components/AuthContext";
import AddressSelect from "../components/AddressSelect";

export default function OwnerDashboard() {
  const [producerAddress, setProducerAddress] = useState("");
  const [supplierAddress, setSupplierAddress] = useState("");
  const [retailerAddress, setRetailerAddress] = useState("");
  const [consumerAddress, setConsumerAddress] = useState("");
  const role = useRole();
  const { signer: metaMaskSigner, walletMode, useMetaMask } = useWallet();
  const { loadRegisteredAccounts, user, registeredAccounts } = useAuth();
  const [newOwnerAddress, setNewOwnerAddress] = useState("");
  
  // Include MetaMask addresses in dropdowns when using MetaMask
  const includeMetaMask = useMetaMask();

  const ensureSigner = async () => {
    // When in MetaMask mode, always use the connected MetaMask account
    if (walletMode === "metamask") {
      if (!metaMaskSigner) {
        alert("Please connect MetaMask as the owner.");
        return null;
      }
      
      // Verify the MetaMask address is registered as an owner in the contract
      const metaMaskAddress = await metaMaskSigner.getAddress();
      
      // Check both the registeredAccounts list and directly with the contract
      const isInList = registeredAccounts.owners.some(
        addr => addr.toLowerCase() === metaMaskAddress.toLowerCase()
      );
      
      // Also verify directly with the contract to ensure it's actually registered
      try {
        const contract = getReadOnlyContract();
        const isRegisteredInContract = await contract.owners(metaMaskAddress);
        
        if (!isRegisteredInContract) {
          alert(`This MetaMask address (${metaMaskAddress.slice(0, 6)}...${metaMaskAddress.slice(-4)}) is not registered as an owner in the contract. Please use the deployer account to add it as an owner first, or use a different MetaMask account that is registered as an owner.\n\nNote: If you just deployed, make sure the contract was deployed with MetaMask addresses registered.`);
          return null;
        }
      } catch (error: any) {
        console.error("Error checking owner registration:", error);
        // If we can't check, at least verify it's in the list
        if (!isInList) {
          alert(`Unable to verify owner registration. This address may not be registered. Please try refreshing the page or use the deployer account to add this address as an owner.`);
          return null;
        }
      }
      
      return metaMaskSigner;
    }

    // When in local mode, use the logged-in local owner account
    if (!user) {
      alert("Please login as the local owner first.");
      return null;
    }

    try {
      return await getLocalSigner(user.address);
    } catch (e: any) {
      alert("Unable to create local signer: " + (e.message || e));
      return null;
    }
  };

  const registerProducer = async () => {
    if (!producerAddress) {
      alert("Please enter a producer address");
      return;
    }
    try {
      const signer = await ensureSigner();
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
      const signer = await ensureSigner();
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
      const signer = await ensureSigner();
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

  const registerConsumer = async () => {
    if (!consumerAddress) {
      alert("Please enter a consumer address");
      return;
    }
    try {
      const signer = await ensureSigner();
      if (!signer) return;
      const contract = getContract(role, signer, true);
      const tx = await contract.registerConsumer(consumerAddress);
      await tx.wait();
      alert("Consumer registered successfully!");
      setConsumerAddress("");
      // Refresh registered accounts list
      await loadRegisteredAccounts();
    } catch (error: any) {
      alert("Error registering consumer: " + (error.message || error));
    }
  };

  const addOwner = async () => {
    if (!newOwnerAddress) {
      alert("Please enter an owner address");
      return;
    }
    try {
      const signer = await ensureSigner();
      if (!signer) return;
      const contract = getContract(role, signer, true);
      const tx = await contract.addOwner(newOwnerAddress);
      await tx.wait();
      alert("Owner added successfully!");
      setNewOwnerAddress("");
      await loadRegisteredAccounts();
    } catch (error: any) {
      alert("Error adding owner: " + (error.message || error));
    }
  };

  return (
    <DashboardLayout
      title="Owner Dashboard"
      description="Register new producers, suppliers, and retailers in the supply chain."
    >
      <div className="space-y-6">
        {/* Add Owner */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="font-semibold text-lg mb-3">Add Owner</h2>
          <AddressSelect
            addresses={[
              ...getAddressesForRole("owners", includeMetaMask),
              ...getAddressesForRole("producers", includeMetaMask),
              ...getAddressesForRole("suppliers", includeMetaMask),
              ...getAddressesForRole("retailers", includeMetaMask),
              ...getAddressesForRole("consumers", includeMetaMask),
            ]}
            value={newOwnerAddress}
            onChange={setNewOwnerAddress}
            placeholder="Select or enter Owner Address (0x...)"
            label="Owner Address"
            allowCustom={true}
            role="owners"
          />
          <button
            onClick={addOwner}
            className="w-full mt-3 bg-teal-600 hover:bg-teal-700 px-4 py-2 rounded-lg"
          >
            Add Owner
          </button>
        </div>

        {/* Register Producer */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="font-semibold text-lg mb-3">Register Producer</h2>
          <AddressSelect
            addresses={getAddressesForRole("producers", includeMetaMask)}
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
            addresses={getAddressesForRole("suppliers", includeMetaMask)}
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
            addresses={getAddressesForRole("retailers", includeMetaMask)}
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

        {/* Register Consumer */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="font-semibold text-lg mb-3">Register Consumer</h2>
          <AddressSelect
            addresses={getAddressesForRole("consumers", includeMetaMask)}
            value={consumerAddress}
            onChange={setConsumerAddress}
            placeholder="Select or enter Consumer Address (0x...)"
            label="Consumer Address"
            allowCustom={true}
            role="consumers"
          />
          <button
            onClick={registerConsumer}
            className="w-full mt-3 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg"
          >
            Register Consumer
          </button>
        </div>

        {/* Owner Info */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="font-semibold text-lg mb-3">Owner Information</h2>
          <p className="text-sm text-gray-300 mb-2">
            <span className="font-semibold">Current Owners:</span>
          </p>
          {registeredAccounts.owners.length > 0 ? (
            <ul className="space-y-1 text-sm text-cyan-300 font-mono">
              {registeredAccounts.owners.map((addr) => (
                <li key={addr}>{addr}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">No owners found.</p>
          )}
          <p className="text-sm text-gray-400 mt-2">
            As the owner, you can register new stakeholders in the supply chain.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}

