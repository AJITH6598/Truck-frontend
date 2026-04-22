import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaTruck } from 'react-icons/fa';

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, loading } = useAuth();

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e84118', fontFamily: 'Rajdhani', fontSize: 24, letterSpacing: 3, gap: 12 }}>
      <FaTruck /> Loading...
    </div>
  );

  // If not logged in, go to home
  if (!user) return <Navigate to="/" replace />;

  // If role doesn't match, go to roles selection to re-login correctly
  if (allowedRole && user.role !== allowedRole) {
    console.warn(`Access denied: Required ${allowedRole}, but user is ${user.role}`);
    return <Navigate to="/roles" replace />;
  }

  return children;
};

export default ProtectedRoute;
