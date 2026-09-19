import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Sidebar from './components/Sidebar.jsx';
import LoginPage from './pages/LoginPage.jsx';
import CommandCenterPage from './pages/CommandCenterPage.jsx';
import SimulationPage from './pages/SimulationPage.jsx';
import SitingPage from './pages/SitingPage.jsx';
import ApprovalsPage from './pages/ApprovalsPage.jsx';
import TodPolicyPage from './pages/TodPolicyPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function Layout({ children }) {
  return (
    <div className="flex flex-col md:flex-row h-[100dvh] overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-slate-950 relative flex flex-col">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/command-center" element={<ProtectedRoute><Layout><CommandCenterPage /></Layout></ProtectedRoute>} />
        <Route path="/simulation" element={<ProtectedRoute><Layout><SimulationPage /></Layout></ProtectedRoute>} />
        <Route path="/siting" element={<ProtectedRoute><Layout><SitingPage /></Layout></ProtectedRoute>} />
        <Route path="/approvals" element={<ProtectedRoute><Layout><ApprovalsPage /></Layout></ProtectedRoute>} />
        <Route path="/tod-policy" element={<ProtectedRoute><Layout><TodPolicyPage /></Layout></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><Layout><ReportsPage /></Layout></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/command-center" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
