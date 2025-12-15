import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginLayout from './components/LoginLayout';
import Dashboard from "./components/Dashboard";
import CustomerForm from "./components/CustomerForm";
import Transactions from "./components/Transactions";
import Sidebar from "./components/Sidebar";
import Analytics from "./components/Analytics";
import Sale from "./components/Sales";
import ReportsPage from "./components/ReportsPage";
import Products from "./components/Products";
import Contracts from "./components/Contracts";
import ProtectedRoute from "./components/ProtectedRoute"; // 👉 Import bảo vệ route


const App = () => {
  return (
    <Router>
      <Routes>
        {/* Auth routes */}
        <Route path="/login" element={<LoginLayout />} />
        <Route path="/register" element={<LoginLayout />} />
        <Route path="/forgot-password" element={<LoginLayout />} />
        <Route path="/reset-password" element={<LoginLayout />} />

        {/* CRM pages */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <div style={{ display: "flex" }}>
              <Sidebar />
              <Dashboard />
            </div>
          </ProtectedRoute>
        } />

        <Route path="/customers" element={
          <ProtectedRoute>
            <div style={{ display: "flex" }}>
              <Sidebar />
              <CustomerForm />
            </div>
          </ProtectedRoute>
        } />

        <Route path="/transactions" element={
          <ProtectedRoute>
            <div style={{ display: "flex" }}>
              <Sidebar />
              <Transactions />
            </div>
          </ProtectedRoute>
        } />

        <Route path="/analytics" element={
          <ProtectedRoute>
            <div style={{ display: "flex" }}>
              <Sidebar />
              <Analytics />
            </div>
          </ProtectedRoute>
        } />

        <Route path="/sales" element={
          <ProtectedRoute>
            <div style={{ display: "flex" }}>
              <Sidebar />
              <Sale />
            </div>
          </ProtectedRoute>
        } />
        <Route path="/reports" element={
          <ProtectedRoute>
            <div style={{ display: "flex" }}>
              <Sidebar />
              <ReportsPage />
            </div>
          </ProtectedRoute>
        } />
        <Route path="/products" element={
          <ProtectedRoute>
            <div style={{ display: "flex" }}>
              <Sidebar />
              <Products />
            </div>
          </ProtectedRoute>
        } />
        <Route path="/contracts" element={
          <ProtectedRoute>
            <div style={{ display: "flex" }}>
              <Sidebar />
              <Contracts />
            </div>
          </ProtectedRoute>
        } />
        {/* Redirect tất cả route lạ về login */}
        <Route path="*" element={<LoginLayout />} />
      </Routes>
    </Router>
  );
};

export default App;
