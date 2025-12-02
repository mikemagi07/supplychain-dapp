import { useRole } from "./RoleContext";
import { useWallet } from "./WalletContext";
import { formatAddress } from "../blockchain/contract";

export default function ConnectWallet() {
  const { role } = useRole();
  const {
    isConnected,
    address,
    connectWallet,
    disconnectWallet,
    isMetaMaskAvailable,
  } = useWallet();

  if (!isMetaMaskAvailable) {
    return (
      <div className="p-2 bg-red-900/40 text-red-200 rounded-lg text-xs font-semibold">
        MetaMask not detected. Please install the extension and refresh.
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {isConnected ? (
        <button
          onClick={disconnectWallet}
          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold transition"
        >
          {address ? formatAddress(address) : "Disconnect"}
        </button>
      ) : (
        <button
          onClick={connectWallet}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition"
        >
          Connect MetaMask
        </button>
      )}

      <div className="text-xs text-gray-400">
        Wallet • {role.toUpperCase()}
      </div>
    </div>
  );
}
