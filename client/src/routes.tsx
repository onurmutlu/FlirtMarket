import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";

export function AppRoutes() {
  return (
    <Routes>
      {/* Ana sayfadan dashboard'a yönlendir */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<Dashboard />} />
      {/* Diğer rotalar buraya eklenecek */}
    </Routes>
  );
} 