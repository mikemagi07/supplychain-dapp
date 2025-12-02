import { useState } from "react";
import ProductList from "./ProductList";
import { ReactNode } from "react";

type DashboardChildren =
  | ReactNode
  | ((props: { refreshProducts: () => void, selectedProduct: string | null }) => ReactNode);

export default function DashboardLayout({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: DashboardChildren;
}) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  const refreshProducts = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
      {/* LEFT PANEL */}
      <div className="bg-gray-900 text-white p-6 rounded-xl space-y-4 shadow-lg h-fit">
        <h1 className="text-2xl font-bold">{title}</h1>
        {description && <p className="text-sm opacity-80">{description}</p>}

        {typeof children === "function"
          ? children({ refreshProducts, selectedProduct })
          : children}
      </div>

      {/* RIGHT PANEL */}
      <ProductList
        refreshKey={refreshKey}
        onSelectProduct={setSelectedProduct}
      />
    </div>
  );
}
