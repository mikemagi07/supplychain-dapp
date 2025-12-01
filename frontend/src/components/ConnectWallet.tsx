import { useEffect, useState } from "react";
import { getSigner } from "../blockchain/contract";
import { useRole } from "./RoleContext";

export default function ConnectWallet() {
  const { role } = useRole();
  const [address, setAddress] = useState("");

  useEffect(() => {
    const signer = getSigner(role);
    setAddress(signer.address);
  }, [role]);

  return (
    <div className="p-2 bg-gray-800 text-white rounded-lg text-xs">
      <span className="font-semibold">{role.toUpperCase()}</span> Wallet:
      <br />
      {address}
    </div>
  );
}
