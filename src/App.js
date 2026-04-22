import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';

import RoleSelection from './pages/RoleSelection';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';

import OwnerLogin from './pages/owner/OwnerLogin';
import OwnerRegister from './pages/owner/OwnerRegister';

import LoaderLogin from './pages/loader/LoaderLogin';
import LoaderRegister from './pages/loader/LoaderRegister';

import DriverLogin from './pages/driver/DriverLogin';
import DriverRegister from './pages/driver/DriverRegister';
import DriverDashboard from './pages/driver/DriverDashboard';

import OwnerDashboard from './pages/owner/OwnerDashboard';
import LoaderDashboard from './pages/loader/LoaderDashboard';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

import './index.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Onboarding — default landing */}
            <Route path="/" element={<Onboarding />} />

            {/* Role selection */}
            <Route path="/roles" element={<RoleSelection />} />

            {/* Owner */}
            <Route path="/owner/login" element={<OwnerLogin />} />
            <Route path="/owner/register" element={<OwnerRegister />} />
            <Route path="/owner/dashboard" element={<ProtectedRoute allowedRole="owner"><OwnerDashboard /></ProtectedRoute>} />

            {/* Loader */}
            <Route path="/loader/login" element={<LoaderLogin />} />
            <Route path="/loader/register" element={<LoaderRegister />} />
            <Route path="/loader/dashboard" element={<ProtectedRoute allowedRole="loader"><LoaderDashboard /></ProtectedRoute>} />

            {/* Driver */}
            <Route path="/driver/login" element={<DriverLogin />} />
            <Route path="/driver/register" element={<DriverRegister />} />
            <Route path="/driver/dashboard" element={<ProtectedRoute allowedRole="driver"><DriverDashboard /></ProtectedRoute>} />

            {/* Password Reset */}
            <Route path="/forgot-password/:role" element={<ForgotPassword />} />
            <Route path="/reset-password/:role/:token" element={<ResetPassword />} />

            {/* Protected Dashboard */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
