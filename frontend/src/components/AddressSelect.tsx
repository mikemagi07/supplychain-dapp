import { useState } from "react";
import { formatAddress } from "../blockchain/contract";
import { useAuth } from "./AuthContext";

interface AddressSelectProps {
  addresses: string[];
  value: string;
  onChange: (address: string) => void;
  placeholder?: string;
  label?: string;
  allowCustom?: boolean;
  role?: string; // Optional role to help identify addresses
}

export default function AddressSelect({
  addresses,
  value,
  onChange,
  placeholder = "Select or enter address",
  label,
  allowCustom = true,
  role,
}: AddressSelectProps) {
  const [isCustom, setIsCustom] = useState(false);
  const [customAddress, setCustomAddress] = useState("");
  const { registeredAccounts } = useAuth();

  const getDynamicLabel = (addr: string): string => {
    // First, see if this address is registered under ANY role
    const allRoles: (keyof typeof registeredAccounts)[] = [
      "owners",
      "producers",
      "suppliers",
      "retailers",
      "consumers",
    ];

    const roleNameMap: Record<(keyof typeof registeredAccounts), string> = {
      owners: "Owner",
      producers: "Producer",
      suppliers: "Supplier",
      retailers: "Retailer",
      consumers: "Consumer",
    };

    const lower = addr.toLowerCase();

    for (const r of allRoles) {
      const list = registeredAccounts[r] || [];
      const idx = list.findIndex((a) => a.toLowerCase() === lower);
      if (idx >= 0) {
        return `${roleNameMap[r]} ${idx + 1}`;
      }
    }

    // Unregistered / extra address – just show shortened address
    return formatAddress(addr);
  };

  // If an "extra" address has already been registered under some other role,
  // hide it from the current dropdown so it doesn't appear as an "unregistered"
  // candidate for multiple roles.
  const filterAddressesForRole = (input: string[]): string[] => {
    if (!role) return input;

    const lowerMap = (list: string[]) => list.map((a) => a.toLowerCase());

    const owners = lowerMap(registeredAccounts.owners);
    const producers = lowerMap(registeredAccounts.producers);
    const suppliers = lowerMap(registeredAccounts.suppliers);
    const retailers = lowerMap(registeredAccounts.retailers);
    const consumers = lowerMap(registeredAccounts.consumers);

    const allRoleLists: Record<string, string[]> = {
      owners,
      producers,
      suppliers,
      retailers,
      consumers,
    };

    const currentRoleKey = role as keyof typeof allRoleLists;

    return input.filter((addr) => {
      const addrLower = addr.toLowerCase();

      // If this address is registered under a *different* role, drop it
      for (const [key, list] of Object.entries(allRoleLists)) {
        if (key === currentRoleKey) continue;
        if (list.includes(addrLower)) {
          return false;
        }
      }

      return true;
    });
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === "__custom__") {
      setIsCustom(true);
      if (customAddress) {
        onChange(customAddress);
      }
    } else {
      setIsCustom(false);
      onChange(e.target.value);
    }
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const addr = e.target.value;
    setCustomAddress(addr);
    onChange(addr);
  };

  const handleBackToDropdown = () => {
    setIsCustom(false);
    setCustomAddress("");
    onChange("");
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-300">
          {label}
        </label>
      )}
      
      {!isCustom ? (
        <div className="flex gap-2">
          <select
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
            value={value && addresses.includes(value) ? value : ""}
            onChange={handleSelectChange}
          >
            <option value="">{placeholder}</option>
            {filterAddressesForRole(addresses).map((addr) => {
              const addressLabel = getDynamicLabel(addr);
              return (
                <option key={addr} value={addr}>
                  {addressLabel} ({formatAddress(addr)})
                </option>
              );
            })}
            {allowCustom && (
              <option value="__custom__">+ Enter custom address</option>
            )}
          </select>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
              placeholder="0x..."
              value={customAddress}
              onChange={handleCustomInputChange}
            />
            <button
              onClick={handleBackToDropdown}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
            >
              Back
            </button>
          </div>
        </div>
      )}
      
      {value && (
        <p className="text-xs text-gray-400">
          Selected: <span className="text-cyan-300 font-mono">{value}</span>
        </p>
      )}
    </div>
  );
}

