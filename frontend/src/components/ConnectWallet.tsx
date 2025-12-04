import { useState, useEffect } from "react";
import { useRole } from "./RoleContext";
import { useWallet, WalletMode } from "./WalletContext";
import { ADDRESSES, formatAddress } from "../blockchain/contract";
import { useAuth } from "./AuthContext";

export default function ConnectWallet() {
  const { role } = useRole();
  const {
    isConnected,
    address: metaMaskAddress,
    connectWallet,
    disconnectWallet,
    isMetaMaskAvailable,
    walletMode,
    setWalletMode,
    useMetaMask,
  } = useWallet();
  const { isAuthenticated } = useAuth();
  const [localAddress, setLocalAddress] = useState<string>("");

  // Simple local address mapping: first address per role from ADDRESSES
  useEffect(() => {
    const map: Record<string, string> = {
      owner: ADDRESSES.owner,
      producer: ADDRESSES.producer,
      supplier: ADDRESSES.supplier,
      retailer: ADDRESSES.retailer,
      consumer: ADDRESSES.consumer,
    };
    setLocalAddress(map[role] || "");
  }, [role]);

  const shouldUseMetaMask = useMetaMask();
  const canSwitchWalletMode = !isAuthenticated;

  const handleSetWalletMode = (mode: WalletMode) => {
    if (!canSwitchWalletMode) {
      alert("Please logout to switch wallet mode.");
      return;
    }
    setWalletMode(mode);
  };

  if (!isMetaMaskAvailable && walletMode === "metamask") {
    // If MetaMask isn't available, force local mode
    setWalletMode("local");
  }

  const displayAddress = shouldUseMetaMask ? metaMaskAddress : localAddress;
  const activeWalletType = shouldUseMetaMask ? "MetaMask" : "Local";

  return (
    <div className="flex items-center gap-3">
      {/* Mode toggle */}
      <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
        <button
          onClick={() => handleSetWalletMode("local")}
          disabled={!canSwitchWalletMode}
          className={`px-2 py-1 rounded text-xs font-semibold transition ${
            walletMode === "local"
              ? "bg-gray-700 text-white"
              : "text-gray-400 hover:text-gray-300"
          } ${!canSwitchWalletMode ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          Local
        </button>
        <button
          onClick={() => handleSetWalletMode("metamask")}
          disabled={!isMetaMaskAvailable || !canSwitchWalletMode}
          className={`px-2 py-1 rounded text-xs font-semibold transition ${
            walletMode === "metamask"
              ? "bg-blue-600 text-white"
              : "text-gray-400 hover:text-gray-300"
          } ${
            (!isMetaMaskAvailable || !canSwitchWalletMode) &&
            "opacity-60 cursor-not-allowed"
          }`}
        >
          MetaMask
        </button>
      </div>

      {/* Connection / address display */}
      {walletMode === "metamask" ? (
        isMetaMaskAvailable ? (
          isConnected ? (
            <button
              onClick={disconnectWallet}
              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold transition"
            >
              {metaMaskAddress ? formatAddress(metaMaskAddress) : "Connected"}
            </button>
          ) : (
            <button
              onClick={connectWallet}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition"
            >
              Connect MetaMask
            </button>
          )
        ) : (
          <div className="p-2 bg-red-900/40 text-red-200 rounded-lg text-xs font-semibold">
            MetaMask not detected.
          </div>
        )
      ) : (
        <div className="px-3 py-1.5 bg-gray-700 text-white rounded-lg text-xs font-semibold text-center">
          {localAddress ? formatAddress(localAddress) : "No local address"}
        </div>
      )}

      <div className="text-xs text-gray-400">
        {activeWalletType} • {role.toUpperCase()}
      </div>
    </div>
  );
}
