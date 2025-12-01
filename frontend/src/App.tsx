// src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProducerDashboard from "./pages/ProducerDashboard";
import SupplierDashboard from "./pages/SupplierDashboard";
import RetailerDashboard from "./pages/RetailerDashboard";
import ConsumerDashboard from "./pages/ConsumerDashboard";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <div className="p-6 space-y-4">
        <Routes>
          <Route path="/" element={<ProducerDashboard />} />
          <Route path="/producer" element={<ProducerDashboard />} />
          <Route path="/supplier" element={<SupplierDashboard />} />
          <Route path="/retailer" element={<RetailerDashboard />} />
          <Route path="/consumer" element={<ConsumerDashboard />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}