import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import ConnectWallet from "./ConnectWallet";
import { useRole } from "./RoleContext";

export default function Navbar() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const { setRole } = useRole();

  const handleSelectRole = (role: string) => {
    setOpen(false);
    setRole(role);   // 🔥 update global role
    navigate(`/${role}`);
  };


  return (
    <nav className="bg-gray-900 text-white px-6 py-4 flex justify-between items-center shadow-md">
      {/* LEFT SIDE LOGO + LINKS */}
      <div className="flex items-center gap-6">
        <Link to="/" className="font-bold text-lg hover:text-cyan-300">
          SupplyChain DApp
        </Link>

        <div className="hidden md:flex gap-6">
          <Link to="/producer" className="hover:text-cyan-300">Producer</Link>
          <Link to="/supplier" className="hover:text-cyan-300">Supplier</Link>
          <Link to="/retailer" className="hover:text-cyan-300">Retailer</Link>
          <Link to="/consumer" className="hover:text-cyan-300">Consumer</Link>
        </div>
      </div>

      {/* RIGHT SIDE: ROLE DROPDOWN + CONNECT WALLET */}
      <div className="flex items-center gap-4">

        {/* ROLE DROPDOWN */}
        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="bg-gray-800 px-4 py-2 rounded-lg hover:bg-gray-700 transition flex items-center gap-2"
          >
            Select Role
            <span className="text-sm">▾</span>
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-40 bg-white text-gray-800 rounded-lg shadow-lg overflow-hidden z-50">
              <button
                onClick={() => handleSelectRole("producer")}
                className="w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                Producer
              </button>

              <button
                onClick={() => handleSelectRole("supplier")}
                className="w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                Supplier
              </button>

              <button
                onClick={() => handleSelectRole("retailer")}
                className="w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                Retailer
              </button>

              <button
                onClick={() => handleSelectRole("consumer")}
                className="w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                Consumer
              </button>
            </div>
          )}
        </div>

        {/* CONNECT WALLET NEXT TO DROPDOWN */}
        <div className="ml-2">
          <ConnectWallet />
        </div>
      </div>
    </nav>
  );
}
