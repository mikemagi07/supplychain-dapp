import { useNavigate } from "react-router-dom";

export default function RoleSelector() {
  const navigate = useNavigate();

  const roles = [
    { title: "Producer", path: "/producer" },
    { title: "Supplier", path: "/supplier" },
    { title: "Retailer", path: "/retailer" },
    { title: "Consumer", path: "/consumer" },
  ];

  return (
    <div className="flex flex-col items-center mt-20">
      <h2 className="text-3xl font-semibold mb-6">Select Your Role</h2>

      <div className="grid grid-cols-2 gap-6">
        {roles.map((r) => (
          <button
            key={r.title}
            // onClick={() => navigate(r.path)}
            className="px-6 py-4 bg-slate-800 text-white rounded-xl shadow hover:scale-105 transition"
          >
            {r.title}
          </button>
        ))}
      </div>
    </div>
  );
}
