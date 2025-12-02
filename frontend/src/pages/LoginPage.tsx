import { useState, useEffect } from "react";
import { useAuth } from "../components/AuthContext";
import { useNavigate } from "react-router-dom";
import { formatAddress, ALL_ADDRESSES, getAddressLabel } from "../blockchain/contract";
import { useWallet, WalletMode } from "../components/WalletContext";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [selectedAddress, setSelectedAddress] = useState("");
  const { login, loading, isAuthenticated, registeredAccounts } = useAuth();
  const { isConnected, address, connectWallet, walletMode, setWalletMode, isMetaMaskAvailable } =
    useWallet();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    let loginAddress: string | null = null;

    if (walletMode === "metamask") {
      if (!isConnected || !address) {
        setError("Please connect MetaMask before logging in.");
        return;
      }
      loginAddress = address;
    } else {
      if (!selectedAddress) {
        setError("Please select a local account.");
        return;
      }
      loginAddress = selectedAddress;
    }

    if (!password) {
      setError("Please enter a password");
      return;
    }

    const success = await login(loginAddress, password);
    if (success) {
      navigate("/");
    } else {
      setError("Invalid account or password");
    }
  };

  const localAccounts = [
    ...ALL_ADDRESSES.owners.map((addr) => ({
      address: addr,
      label: getAddressLabel(addr, "owners"),
      isRegistered: registeredAccounts.owners.some(
        (a) => a.toLowerCase() === addr.toLowerCase()
      ),
    })),
    ...ALL_ADDRESSES.producers.map((addr) => ({
      address: addr,
      label: getAddressLabel(addr, "producers"),
      isRegistered: registeredAccounts.producers.some(
        (a) => a.toLowerCase() === addr.toLowerCase()
      ),
    })),
    ...ALL_ADDRESSES.suppliers.map((addr) => ({
      address: addr,
      label: getAddressLabel(addr, "suppliers"),
      isRegistered: registeredAccounts.suppliers.some(
        (a) => a.toLowerCase() === addr.toLowerCase()
      ),
    })),
    ...ALL_ADDRESSES.retailers.map((addr) => ({
      address: addr,
      label: getAddressLabel(addr, "retailers"),
      isRegistered: registeredAccounts.retailers.some(
        (a) => a.toLowerCase() === addr.toLowerCase()
      ),
    })),
    ...ALL_ADDRESSES.consumers.map((addr) => ({
      address: addr,
      label: getAddressLabel(addr, "consumers"),
      isRegistered: registeredAccounts.consumers.some(
        (a) => a.toLowerCase() === addr.toLowerCase()
      ),
    })),
  ];

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

        {/* Wallet mode toggle (Local / MetaMask) */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Wallet Mode
          </label>
          <div className="flex items-center gap-2 bg-gray-700 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setWalletMode("local")}
              className={`flex-1 px-3 py-2 rounded text-sm font-semibold transition ${
                walletMode === "local"
                  ? "bg-gray-600 text-white"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              Local
            </button>
            <button
              type="button"
              onClick={() => setWalletMode("metamask")}
              disabled={!isMetaMaskAvailable}
              className={`flex-1 px-3 py-2 rounded text-sm font-semibold transition ${
                walletMode === "metamask"
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-gray-300"
              } ${!isMetaMaskAvailable ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              MetaMask
            </button>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 mt-4">
          {walletMode === "metamask" ? (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Connected MetaMask Account
              </label>
              {isConnected && address ? (
                <div className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white">
                  {formatAddress(address)}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => connectWallet()}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  Connect MetaMask
                </button>
              )}
              {!isConnected && (
                <p className="text-xs text-gray-500 mt-1">
                  Connect MetaMask to select an account.
                </p>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Local Account
              </label>
              <select
                value={selectedAddress}
                onChange={(e) => setSelectedAddress(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select an account --</option>
                {localAccounts.map((acc) => (
                  <option key={acc.address} value={acc.address}>
                    {acc.label} ({formatAddress(acc.address)})
                    {!acc.isRegistered && " (Not Registered)"}
                  </option>
                ))}
              </select>
              {localAccounts.length === 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  No local accounts configured in uiAddresses.
                </p>
              )}
            </div>
          )}

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
          {walletMode === "metamask" && !isConnected && (
            <p className="mt-2">Connect MetaMask to continue.</p>
          )}
        </div>
      </div>
    </div>
  );
}


