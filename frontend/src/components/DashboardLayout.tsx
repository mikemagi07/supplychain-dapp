import ProductList from "./ProductList";

export default function DashboardLayout({
  title,
  description,
  children,
  onSelectProduct,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  onSelectProduct?: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 min-h-screen">

      {/* LEFT SIDE — ROLE CONTROLS */}
      <div className="bg-gray-900 text-white p-6 rounded-xl space-y-4 h-fit shadow-lg">
        <h1 className="text-2xl font-bold">{title}</h1>
        {description && <p className="text-sm opacity-80">{description}</p>}

        {/* Role-specific UI */}
        {children}
      </div>

      {/* RIGHT SIDE — PRODUCT LIST */}
      <div className="h-full">
        <ProductList onSelect={onSelectProduct} />
      </div>
    </div>
  );
}
