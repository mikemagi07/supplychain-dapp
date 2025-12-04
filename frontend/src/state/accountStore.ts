import { create } from "zustand";

type AccountState = {
  role: "producer" | "supplier" | "retailer" | "consumer";
  setRole: (role: AccountState["role"]) => void;
};

export const useAccountStore = create<AccountState>((set) => ({
  role: "producer",
  setRole: (role) => set({ role }),
}));
