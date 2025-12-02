import { useState, useEffect } from "react";
import { useAuth } from "../components/AuthContext";
import { useNavigate } from "react-router-dom";
import { formatAddress, ALL_ADDRESSES, getAddressLabel } from "../blockchain/contract";
import { useWallet } from "../components/WalletContext";

export default function LoginPage() {
  const [selectedAddress, setSelectedAddress] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, registeredAccounts, loading, isAuthenticated } = useAuth();
  const { walletMode, setWalletMode } = useWallet();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const allAccounts = [
    ...ALL_ADDRESSES.owners.map((addr, idx) => ({
      address: addr,
      role: "Owner",
      label: getAddressLabel(addr, "owners"),
      isMetaMask: false, // Local Hardhat addresses only
      isRegistered: registeredAccounts.owners.some(a => a.toLowerCase() === addr.toLowerCase()),
    })),
    ...ALL_ADDRESSES.producers.map((addr) => ({
      address: addr,
      role: "Producer",
      label: getAddressLabel(addr, "producers"),
      isMetaMask: false, // Local Hardhat addresses only
      isRegistered: registeredAccounts.producers.some(a => a.toLowerCase() === addr.toLowerCase()),
    })),
    ...ALL_ADDRESSES.suppliers.map((addr) => ({
      address: addr,
      role: "Supplier",
      label: getAddressLabel(addr, "suppliers"),
      isMetaMask: false, // Local Hardhat addresses only
      isRegistered: registeredAccounts.suppliers.some(a => a.toLowerCase() === addr.toLowerCase()),
    })),
    ...ALL_ADDRESSES.retailers.map((addr) => ({
      address: addr,
      role: "Retailer",
      label: getAddressLabel(addr, "retailers"),
      isMetaMask: false, // Local Hardhat addresses only
      isRegistered: registeredAccounts.retailers.some(a => a.toLowerCase() === addr.toLowerCase()),
    })),
    ...ALL_ADDRESSES.consumers.map((addr) => ({
      address: addr,
      role: "Consumer",
      label: getAddressLabel(addr, "consumers"),
      isMetaMask: false, // Local Hardhat addresses only
      isRegistered: registeredAccounts.consumers.some(a => a.toLowerCase() === addr.toLowerCase()),
    })),
  ];

  const filteredAccounts = allAccounts.filter((account) => {
    if (walletMode === "hardcoded") return !account.isMetaMask;
    if (walletMode === "metamask") return account.isMetaMask;
    return true;
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedAddress) {
      setError("Please select an account");
      return;
    }

    if (!password) {
      setError("Please enter a password");
      return;
    }

    const success = await login(selectedAddress, password);
    if (success) {
      navigate("/");
    } else {
      setError("Invalid account or password");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-lg">Loading accounts...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md">
        <h1 className="text-2xl font-bold text-white mb-2 text-center">
          Supply Chain DApp
        </h1>
        <p className="text-gray-400 text-center mb-6">Login to continue</p>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Wallet Mode
          </label>
          <div className="flex items-center gap-2 bg-gray-700 rounded-lg p-1">
            <button
              type="button"
              onClick={() => {
                setWalletMode("hardcoded");
                setSelectedAddress(""); // Reset selection when switching
              }}
              className={`flex-1 px-3 py-2 rounded text-sm font-semibold transition ${
                walletMode === "hardcoded"
                  ? "bg-gray-600 text-white"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              Local
            </button>
            <button
              type="button"
              onClick={() => {
                setWalletMode("metamask");
                setSelectedAddress(""); // Reset selection when switching
              }}
              className={`flex-1 px-3 py-2 rounded text-sm font-semibold transition ${
                walletMode === "metamask"
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              MetaMask
            </button>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Account
            </label>
            <select
              value={selectedAddress}
              onChange={(e) => setSelectedAddress(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select an account --</option>
              {filteredAccounts.map((account) => (
                <option key={account.address} value={account.address}>
                  {account.label} ({formatAddress(account.address)}) - {account.role}
                  {!account.isRegistered && account.role !== "Consumer" && account.isMetaMask && " (Not Registered)"}
                </option>
              ))}
            </select>
            {filteredAccounts.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">
                No {walletMode === "metamask" ? "MetaMask" : "local"} accounts available
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter any password (placeholder)"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Password is a placeholder - any value works
            </p>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            Login
          </button>
        </form>

        <div className="mt-6 text-xs text-gray-500 text-center">
          <p>Only accounts registered by the owner can login.</p>
          <p className="mt-2">
            Showing: {filteredAccounts.length} of {allAccounts.length} account
            {allAccounts.length !== 1 ? "s" : ""} for{" "}
            {walletMode === "metamask" ? "MetaMask" : "local"} mode.
          </p>
        </div>
      </div>
    </div>
  );
}


