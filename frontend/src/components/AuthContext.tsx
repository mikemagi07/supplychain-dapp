import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ethers } from "ethers";
import { ALL_ADDRESSES, CONTRACT_ADDRESS } from "../blockchain/contract";
import artifact from "../blockchain/SupplyChain.json";

// MetaMask addresses are determined dynamically from MetaMask connection

type User = {
  address: string;
  role: "owner" | "producer" | "supplier" | "retailer" | "consumer";
  accountIndex: number;
};

type AuthContextType = {
  user: User | null;
  login: (address: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
  registeredAccounts: {
    producers: string[];
    suppliers: string[];
    retailers: string[];
    consumers: string[];
    owners: string[];
  };
  loadRegisteredAccounts: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => false,
  logout: () => {},
  isAuthenticated: false,
  loading: true,
  registeredAccounts: {
    producers: [],
    suppliers: [],
    retailers: [],
    consumers: [],
    owners: [],
  },
  loadRegisteredAccounts: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [registeredAccounts, setRegisteredAccounts] = useState({
    producers: [] as string[],
    suppliers: [] as string[],
    retailers: [] as string[],
    consumers: [] as string[],
    owners: [] as string[],
  });

  // Load registered accounts from contract
  const loadRegisteredAccounts = async () => {
    try {
      const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
      const contract = new ethers.Contract(CONTRACT_ADDRESS, artifact.abi, provider);

      // Check which addresses are registered (both local and MetaMask)
      const allAddresses = Array.from(
        new Set([
          ...ALL_ADDRESSES.producers,
          ...ALL_ADDRESSES.suppliers,
          ...ALL_ADDRESSES.retailers,
          ...ALL_ADDRESSES.consumers,
          ...ALL_ADDRESSES.owners,
        ])
      );

      // Also check MetaMask connected address if available
      if (typeof window !== "undefined" && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: "eth_accounts" });
          if (accounts.length > 0) {
            const metaMaskAddress = accounts[0];
            // Add MetaMask address to the list if not already present
            if (!allAddresses.some(addr => addr.toLowerCase() === metaMaskAddress.toLowerCase())) {
              allAddresses.push(metaMaskAddress);
            }
          }
        } catch (e) {
          // MetaMask not available or error getting accounts
        }
      }

      const producers: string[] = [];
      const suppliers: string[] = [];
      const retailers: string[] = [];
      const consumers: string[] = [];
      const owners: string[] = [];

      // Check each address
      for (const addr of allAddresses) {
        try {
          const isProducer = await contract.producers(addr);
          const isSupplier = await contract.suppliers(addr);
          const isRetailer = await contract.retailers(addr);
          const isOwner = await contract.owners(addr);

          if (isProducer) producers.push(addr);
          if (isSupplier) suppliers.push(addr);
          if (isRetailer) retailers.push(addr);
          if (isOwner) owners.push(addr);
          // Consumers don't need to be registered, but we include all consumer addresses
          if (ALL_ADDRESSES.consumers.includes(addr)) consumers.push(addr);
        } catch (e) {
          // Skip if check fails
        }
      }

      setRegisteredAccounts({
        producers,
        suppliers,
        retailers,
        consumers: ALL_ADDRESSES.consumers, // All consumer addresses are allowed
        owners,
      });
    } catch (error) {
      console.error("Error loading registered accounts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRegisteredAccounts();
    
    // Check if user is already logged in (from localStorage)
    const savedUser = localStorage.getItem("supplychain_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem("supplychain_user");
      }
    }
  }, []);

  const login = async (address: string, password: string): Promise<boolean> => {
    // Password is just a placeholder - any value works
    if (!password || password.trim() === "") {
      return false;
    }

    // Determine role based on registered accounts
    let role: User["role"] | null = null;
    let accountIndex = 0;

    if (registeredAccounts.owners.some(addr => addr.toLowerCase() === address.toLowerCase())) {
      role = "owner";
      accountIndex = registeredAccounts.owners.findIndex(
        addr => addr.toLowerCase() === address.toLowerCase()
      );
    } else if (registeredAccounts.producers.some(addr => addr.toLowerCase() === address.toLowerCase())) {
      role = "producer";
      accountIndex = registeredAccounts.producers.findIndex(
        addr => addr.toLowerCase() === address.toLowerCase()
      );
    } else if (registeredAccounts.suppliers.some(addr => addr.toLowerCase() === address.toLowerCase())) {
      role = "supplier";
      accountIndex = registeredAccounts.suppliers.findIndex(
        addr => addr.toLowerCase() === address.toLowerCase()
      );
    } else if (registeredAccounts.retailers.some(addr => addr.toLowerCase() === address.toLowerCase())) {
      role = "retailer";
      accountIndex = registeredAccounts.retailers.findIndex(
        addr => addr.toLowerCase() === address.toLowerCase()
      );
    } else if (registeredAccounts.consumers.some(addr => addr.toLowerCase() === address.toLowerCase())) {
      role = "consumer";
      accountIndex = registeredAccounts.consumers.findIndex(
        addr => addr.toLowerCase() === address.toLowerCase()
      );
    }

    if (role) {
      const newUser: User = {
        address,
        role,
        accountIndex,
      };
      setUser(newUser);
      localStorage.setItem("supplychain_user", JSON.stringify(newUser));
      return true;
    }

    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("supplychain_user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        loading,
        registeredAccounts,
        loadRegisteredAccounts,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

