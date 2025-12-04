// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { WalletProvider } from "./components/WalletContext";
import { RoleProvider } from "./components/RoleContext";
import { AuthProvider, useAuth } from "./components/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import LoginPage from "./pages/LoginPage";
import ProducerDashboard from "./pages/ProducerDashboard";
import SupplierDashboard from "./pages/SupplierDashboard";
import RetailerDashboard from "./pages/RetailerDashboard";
import ConsumerDashboard from "./pages/ConsumerDashboard";
import OwnerDashboard from "./pages/OwnerDashboard";

function AppRoutes() {
  const { user } = useAuth();

  return (
    <>
      <Navbar />
      <div className="p-6 space-y-4">
        <Routes>
          <Route
            path="/"
            element={
              <Navigate
                to={`/${user?.role || "producer"}`}
                replace
              />
            }
          />
          <Route
            path="/owner"
            element={
              <ProtectedRoute allowedRoles={["owner"]}>
                <OwnerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/producer"
            element={
              <ProtectedRoute allowedRoles={["producer"]}>
                <ProducerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/supplier"
            element={
              <ProtectedRoute allowedRoles={["supplier"]}>
                <SupplierDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/retailer"
            element={
              <ProtectedRoute allowedRoles={["retailer"]}>
                <RetailerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/consumer"
            element={
              <ProtectedRoute allowedRoles={["consumer"]}>
                <ConsumerDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <WalletProvider>
        <RoleProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/*" element={<AppRoutes />} />
            </Routes>
          </BrowserRouter>
        </RoleProvider>
      </WalletProvider>
    </AuthProvider>
  );
}