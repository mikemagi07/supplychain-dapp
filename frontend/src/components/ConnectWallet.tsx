import { useEffect, useState } from "react";
import { getSigner, ALL_ADDRESSES, ADDRESSES } from "../blockchain/contract";
import { useRole } from "./RoleContext";
import { useWallet, WalletMode } from "./WalletContext";
import { useAuth } from "./AuthContext";
import { formatAddress } from "../blockchain/contract";

export default function ConnectWallet() {
  const { role, accountIndex } = useRole();
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
  const { user, isAuthenticated } = useAuth();
  const [hardcodedAddress, setHardcodedAddress] = useState("");

  const localAddressMap: Record<string, string[] | undefined> = {
    owner: [ADDRESSES.owner],
    producer: ADDRESSES.allProducers,
    supplier: ADDRESSES.allSuppliers,
    retailer: ADDRESSES.allRetailers,
    consumer: ADDRESSES.allConsumers,
  };

  const localAddresses = localAddressMap[role];

  const getLocalIndex = () => {
    if (user && localAddresses) {
      const matchIdx = localAddresses.findIndex(
        (addr) => addr.toLowerCase() === user.address.toLowerCase()
      );
      if (matchIdx !== -1) {
        return matchIdx;
      }
    }
    if (localAddresses && localAddresses.length > 0) {
      if (accountIndex < localAddresses.length) {
        return accountIndex;
      }
      return 0;
    }
    return 0;
  };

  const localIndex = getLocalIndex();

  useEffect(() => {
    try {
      const signer = getSigner(role, localIndex);
      if (localAddresses && localAddresses[localIndex]) {
        setHardcodedAddress(localAddresses[localIndex]);
      } else {
        setHardcodedAddress(signer.address);
      }
    } catch (error) {
      console.error("Error getting hardcoded signer:", error);
    }
  }, [role, accountIndex, user?.address, localIndex, localAddresses]);

  const shouldUseMetaMask = useMetaMask();
  const canSwitchWalletMode = !isAuthenticated;

  const handleSetWalletMode = (mode: WalletMode) => {
    if (!canSwitchWalletMode) {
      alert("Please logout to switch wallet mode.");
      return;
    }
    setWalletMode(mode);
  };
  const displayAddress = shouldUseMetaMask ? metaMaskAddress : hardcodedAddress;
  const activeWalletType = shouldUseMetaMask ? "MetaMask" : "Hardcoded";

  const roleKeyMap: Record<string, keyof typeof ALL_ADDRESSES> = {
    owner: "owners",
    producer: "producers",
    supplier: "suppliers",
    retailer: "retailers",
    consumer: "consumers",
  };

  const addressesForRole = roleKeyMap[role]
    ? ALL_ADDRESSES[roleKeyMap[role]]
    : undefined;

  const derivedIndex =
    user && addressesForRole
      ? addressesForRole.findIndex(
          (addr) => addr.toLowerCase() === user.address.toLowerCase()
        )
      : -1;

  const displayIndex =
    derivedIndex >= 0
      ? derivedIndex
      : localAddresses && localAddresses.length > 0
      ? localIndex
      : accountIndex >= 0
      ? accountIndex
      : 0;

  return (
    <div className="flex items-center gap-2">
      {isMetaMaskAvailable ? (
        <div className="flex flex-col gap-2">
          {/* Wallet Mode Toggle */}
          <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => handleSetWalletMode("hardcoded")}
              disabled={!canSwitchWalletMode}
              className={`px-2 py-1 rounded text-xs font-semibold transition ${
                walletMode === "hardcoded"
                  ? "bg-gray-700 text-white"
                  : "text-gray-400 hover:text-gray-300"
              } ${!canSwitchWalletMode ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              Hardcoded
            </button>
            <button
              onClick={() => handleSetWalletMode("metamask")}
              disabled={!canSwitchWalletMode}
              className={`px-2 py-1 rounded text-xs font-semibold transition ${
                walletMode === "metamask"
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-gray-300"
              } ${!canSwitchWalletMode ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              MetaMask
            </button>
          </div>

          {/* Connection Status */}
          {walletMode === "metamask" ? (
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
            <div className="px-3 py-1.5 bg-gray-700 text-white rounded-lg text-xs font-semibold text-center">
              {hardcodedAddress ? formatAddress(hardcodedAddress) : "Loading..."}
            </div>
          )}

          <div className="text-xs text-gray-400 text-center">
            {activeWalletType} • {role.toUpperCase()}
            {role !== "owner" ? ` ${displayIndex + 1}` : ""}
          </div>
          {!canSwitchWalletMode && (
            <div className="text-[10px] text-yellow-400 text-center">
              Logout to switch wallet mode.
            </div>
          )}
        </div>
      ) : (
        <div className="p-2 bg-gray-800 text-white rounded-lg text-xs">
          <span className="font-semibold">{role.toUpperCase()}{role !== "owner" ? ` ${displayIndex + 1}` : ""}</span> Wallet:
          <br />
          {hardcodedAddress ? formatAddress(hardcodedAddress) : "Loading..."}
          <div className="text-gray-400 text-[10px] mt-1">Hardcoded</div>
        </div>
      )}
    </div>
  );
}
