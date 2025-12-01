import { createContext, useContext, useState } from "react";

export type RoleContextType = {
  role: string;
  setRole: (r: string) => void;
};

const RoleContext = createContext<RoleContextType>({
  role: "producer",
  setRole: () => {},
});

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState("producer");
  return (
    <RoleContext.Provider value={{ role, setRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}
