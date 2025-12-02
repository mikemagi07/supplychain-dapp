import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

export type RoleContextType = {
  role: string;
  accountIndex: number;
  setRole: (r: string, index?: number) => void;
};

const RoleContext = createContext<RoleContextType>({
  role: "producer",
  accountIndex: 0,
  setRole: () => {},
});

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [role, setRoleState] = useState("producer");
  const [accountIndex, setAccountIndex] = useState(0);
  
  // Always sync RoleContext with AuthContext when user changes
  useEffect(() => {
    if (user) {
      setRoleState(user.role);
      setAccountIndex(user.accountIndex);
    }
  }, [user]);
  
  const setRole = (r: string, index: number = 0) => {
    // Only allow role changes if user is not logged in (for testing/development)
    // When logged in, role is controlled by AuthContext
    if (!user) {
      setRoleState(r);
      setAccountIndex(index);
    } else {
      console.warn("Cannot change role while logged in. Role is determined by your login account.");
    }
  };
  
  return (
    <RoleContext.Provider value={{ role, accountIndex, setRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}
