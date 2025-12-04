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

  // Load registered accounts from contract using events (ideal approach)
  const loadRegisteredAccounts = async () => {
    try {
      const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
      const contract = new ethers.Contract(CONTRACT_ADDRESS, artifact.abi, provider);

      const producers: string[] = [];
      const suppliers: string[] = [];
      const retailers: string[] = [];
      const owners: string[] = [];

      // Query past events to discover all registered addresses
      try {
        // Query OwnerAdded events
        const ownerAddedFilter = contract.filters.OwnerAdded();
        const ownerAddedEvents = await contract.queryFilter(ownerAddedFilter);
        ownerAddedEvents.forEach((event) => {
          if (event instanceof ethers.EventLog) {
            const addr = event.args[0];
            if (addr && !owners.some(a => a.toLowerCase() === addr.toLowerCase())) {
              owners.push(addr);
            }
          }
        });

        // Query ProducerRegistered events
        const producerFilter = contract.filters.ProducerRegistered();
        const producerEvents = await contract.queryFilter(producerFilter);
        producerEvents.forEach((event) => {
          if (event instanceof ethers.EventLog) {
            const addr = event.args[0];
            if (addr && !producers.some(a => a.toLowerCase() === addr.toLowerCase())) {
              producers.push(addr);
            }
          }
        });

        // Query SupplierRegistered events
        const supplierFilter = contract.filters.SupplierRegistered();
        const supplierEvents = await contract.queryFilter(supplierFilter);
        supplierEvents.forEach((event) => {
          if (event instanceof ethers.EventLog) {
            const addr = event.args[0];
            if (addr && !suppliers.some(a => a.toLowerCase() === addr.toLowerCase())) {
              suppliers.push(addr);
            }
          }
        });

        // Query RetailerRegistered events
        const retailerFilter = contract.filters.RetailerRegistered();
        const retailerEvents = await contract.queryFilter(retailerFilter);
        retailerEvents.forEach((event) => {
          if (event instanceof ethers.EventLog) {
            const addr = event.args[0];
            if (addr && !retailers.some(a => a.toLowerCase() === addr.toLowerCase())) {
              retailers.push(addr);
            }
          }
        });

        // Handle OwnerRemoved events - remove from owners list
        const ownerRemovedFilter = contract.filters.OwnerRemoved();
        const ownerRemovedEvents = await contract.queryFilter(ownerRemovedFilter);
        ownerRemovedEvents.forEach((event) => {
          if (event instanceof ethers.EventLog) {
            const addr = event.args[0];
            if (addr) {
              const index = owners.findIndex(a => a.toLowerCase() === addr.toLowerCase());
              if (index >= 0) {
                owners.splice(index, 1);
              }
            }
          }
        });
      } catch (eventError) {
        console.warn("Error querying events, falling back to direct checks:", eventError);
      }

      // Always verify known addresses to catch:
      // 1. Initial owner from constructor (no event emitted)
      // 2. Any addresses manually set that might have been missed
      // 3. MetaMask addresses that aren't in ALL_ADDRESSES
      const addressesToCheck = Array.from(
        new Set([
          ...ALL_ADDRESSES.producers,
          ...ALL_ADDRESSES.suppliers,
          ...ALL_ADDRESSES.retailers,
          ...ALL_ADDRESSES.owners,
        ])
      );

      // Also check MetaMask connected address if available
      if (typeof window !== "undefined" && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: "eth_accounts" });
          if (accounts.length > 0) {
            const metaMaskAddress = accounts[0];
            if (!addressesToCheck.some(addr => addr.toLowerCase() === metaMaskAddress.toLowerCase())) {
              addressesToCheck.push(metaMaskAddress);
            }
          }
        } catch (e) {
          // MetaMask not available
        }
      }

      // Verify current state of all known addresses
      for (const addr of addressesToCheck) {
        try {
          const isProducer = await contract.producers(addr);
          const isSupplier = await contract.suppliers(addr);
          const isRetailer = await contract.retailers(addr);
          const isOwner = await contract.owners(addr);

          if (isProducer && !producers.some(a => a.toLowerCase() === addr.toLowerCase())) {
            producers.push(addr);
          }
          if (isSupplier && !suppliers.some(a => a.toLowerCase() === addr.toLowerCase())) {
            suppliers.push(addr);
          }
          if (isRetailer && !retailers.some(a => a.toLowerCase() === addr.toLowerCase())) {
            retailers.push(addr);
          }
          if (isOwner && !owners.some(a => a.toLowerCase() === addr.toLowerCase())) {
            owners.push(addr);
          }
        } catch (e) {
          // Skip if check fails
        }
      }

      setRegisteredAccounts({
        producers,
        suppliers,
        retailers,
        consumers: [...ALL_ADDRESSES.consumers, ...(ALL_ADDRESSES.metamaskConsumers || [])], // All consumer addresses are allowed (including MetaMask)
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

    // Listen to registration events for real-time updates
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    const contract = new ethers.Contract(CONTRACT_ADDRESS, artifact.abi, provider);

    const handleOwnerAdded = (owner: string) => {
      setRegisteredAccounts((prev) => {
        if (!prev.owners.some(a => a.toLowerCase() === owner.toLowerCase())) {
          return { ...prev, owners: [...prev.owners, owner] };
        }
        return prev;
      });
    };

    const handleOwnerRemoved = (owner: string) => {
      setRegisteredAccounts((prev) => ({
        ...prev,
        owners: prev.owners.filter(a => a.toLowerCase() !== owner.toLowerCase()),
      }));
    };

    const handleProducerRegistered = (producer: string) => {
      setRegisteredAccounts((prev) => {
        if (!prev.producers.some(a => a.toLowerCase() === producer.toLowerCase())) {
          return { ...prev, producers: [...prev.producers, producer] };
        }
        return prev;
      });
    };

    const handleSupplierRegistered = (supplier: string) => {
      setRegisteredAccounts((prev) => {
        if (!prev.suppliers.some(a => a.toLowerCase() === supplier.toLowerCase())) {
          return { ...prev, suppliers: [...prev.suppliers, supplier] };
        }
        return prev;
      });
    };

    const handleRetailerRegistered = (retailer: string) => {
      setRegisteredAccounts((prev) => {
        if (!prev.retailers.some(a => a.toLowerCase() === retailer.toLowerCase())) {
          return { ...prev, retailers: [...prev.retailers, retailer] };
        }
        return prev;
      });
    };

    // Attach event listeners
    try {
      contract.on("OwnerAdded", handleOwnerAdded);
      contract.on("OwnerRemoved", handleOwnerRemoved);
      contract.on("ProducerRegistered", handleProducerRegistered);
      contract.on("SupplierRegistered", handleSupplierRegistered);
      contract.on("RetailerRegistered", handleRetailerRegistered);
    } catch (e) {
      console.warn("Could not attach event listeners (events may not exist in contract):", e);
    }

    // Cleanup listeners on unmount
    return () => {
      try {
        contract.off("OwnerAdded", handleOwnerAdded);
        contract.off("OwnerRemoved", handleOwnerRemoved);
        contract.off("ProducerRegistered", handleProducerRegistered);
        contract.off("SupplierRegistered", handleSupplierRegistered);
        contract.off("RetailerRegistered", handleRetailerRegistered);
      } catch (e) {
        // Ignore cleanup errors
      }
    };
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

