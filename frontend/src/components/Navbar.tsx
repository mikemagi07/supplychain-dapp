import { Link, useNavigate } from "react-router-dom";
import ConnectWallet from "./ConnectWallet";
import { useAuth } from "./AuthContext";
import { formatAddress } from "../blockchain/contract";

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };


  return (
    <nav className="bg-gray-900 text-white px-6 py-4 flex justify-between items-center shadow-md">
      {/* LEFT SIDE LOGO + LINKS */}
      <div className="flex items-center gap-6">
        <Link to="/" className="font-bold text-lg hover:text-cyan-300">
          SupplyChain DApp
        </Link>

        <div className="hidden md:flex gap-6">
          <Link to="/owner" className="hover:text-cyan-300">Owner</Link>
          <Link to="/producer" className="hover:text-cyan-300">Producer</Link>
          <Link to="/supplier" className="hover:text-cyan-300">Supplier</Link>
          <Link to="/retailer" className="hover:text-cyan-300">Retailer</Link>
          <Link to="/consumer" className="hover:text-cyan-300">Consumer</Link>
        </div>
      </div>

      {/* RIGHT SIDE: CONNECT WALLET */}
      <div className="flex items-center gap-4">

        {/* CONNECT WALLET */}
        <div className="ml-2">
          <ConnectWallet />
        </div>

        {/* USER INFO & LOGOUT */}
        {user && (
          <div className="ml-4 flex items-center gap-3">
            <div className="text-sm text-gray-300">
              <span className="font-semibold">{user.role.toUpperCase()}</span>
              <br />
              <span className="text-xs">{formatAddress(user.address)}</span>
            </div>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
