import { useState } from "react";
import { getAddressLabel, formatAddress } from "../blockchain/contract";

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
            {addresses.map((addr) => {
              const addressLabel = getAddressLabel(addr, role);
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

