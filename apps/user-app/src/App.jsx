import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import LoginPage from './pages/LoginPage.jsx';
import MapPage from './pages/MapPage.jsx';
import StationDetailPage from './pages/StationDetailPage.jsx';
import SessionsPage from './pages/SessionsPage.jsx';
import BottomNav from './components/BottomNav.jsx';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { user } = useAuth();
  return (
    <BrowserRouter>
      <div className="h-screen flex flex-col bg-gray-950 text-white overflow-hidden">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={
            <ProtectedRoute>
              <MapPage />
            </ProtectedRoute>
          } />
          <Route path="/station/:id" element={
            <ProtectedRoute>
              <StationDetailPage />
            </ProtectedRoute>
          } />
          <Route path="/sessions" element={
            <ProtectedRoute>
              <SessionsPage />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        {user && <BottomNav />}
      </div>
    </BrowserRouter>
  );
}
