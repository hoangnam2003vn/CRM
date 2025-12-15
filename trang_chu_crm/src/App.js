import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';

// Import components
import LoginLayout from './components/LoginLayout';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import CustomerForm from './components/CustomerForm';
import Products from './components/Products';
import Contracts from './components/Contracts';
import Transactions from './components/Transactions';
import Analytics from './components/Analytics';
import Sales from './components/Sales';
import ReportsPage from './components/ReportsPage';
import DigitalTwin from './components/DigitalTwin';
import PredictiveChurn from './components/PredictiveChurn';
import CopilotAI from './components/CopilotAI';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  // ========= THÊM ĐOẠN NÀY =========
  // Auto set token để bypass login trong development
  useEffect(() => {
    if (!localStorage.getItem('token')) {
      localStorage.setItem('token', 'demo-token-123');
      console.log('✅ Demo token đã được set!');
    }
  }, []);
  // ==================================

  // Layout cho các trang (không cần authentication trong demo)
  const MainLayout = ({ children }) => {
    return (
      <Box sx={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
        <Sidebar onPageChange={setCurrentPage} />
        <Box sx={{ flexGrow: 1, overflow: 'auto', backgroundColor: '#f5f5f5' }}>
          {children}
        </Box>
      </Box>
    );
  };

  return (
    <Router>
      <Routes>
        {/* Route cho trang login - vẫn giữ để xem giao diện */}
        <Route path="/login" element={<LoginLayout />} />
        
        {/* Redirect từ root đến dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Routes KHÔNG CẦN ProtectedRoute cho demo */}
        <Route path="/dashboard" element={
          <MainLayout>
            <Dashboard />
          </MainLayout>
        } />

        <Route path="/customers" element={
          <MainLayout>
            <CustomerForm />
          </MainLayout>
        } />

        <Route path="/products" element={
          <MainLayout>
            <Products />
          </MainLayout>
        } />

        <Route path="/contracts" element={
          <MainLayout>
            <Contracts />
          </MainLayout>
        } />

        <Route path="/transactions" element={
          <MainLayout>
            <Transactions />
          </MainLayout>
        } />

        <Route path="/analytics" element={
          <MainLayout>
            <Analytics />
          </MainLayout>
        } />

        <Route path="/sales" element={
          <MainLayout>
            <Sales />
          </MainLayout>
        } />

        <Route path="/reports" element={
          <MainLayout>
            <ReportsPage />
          </MainLayout>
        } />

        <Route path="/digital-twin" element={
          <MainLayout>
            <DigitalTwin />
          </MainLayout>
        } />

        <Route path="/copilotai" element={
          <MainLayout>
            <CopilotAI />
          </MainLayout>
        } />

        <Route path="/predictivechurn" element={
          <MainLayout>
            <PredictiveChurn />
          </MainLayout>
        } />

        {/* Catch all - redirect về dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;