import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaTruckMoving } from 'react-icons/fa';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    // Redirect each role to their own dashboard
    if (user.role === 'owner') {
      navigate('/owner/dashboard', { replace: true });
    } else if (user.role === 'loader') {
      navigate('/loader/dashboard', { replace: true });
    } else if (user.role === 'driver') {
      navigate('/driver/dashboard', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  // Show loading while redirecting
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: '#f8fafc',
      color: '#ff6b00',
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '20px',
      letterSpacing: '2px'
    }}>
      <FaTruckMoving style={{ marginBottom: 12, fontSize: 32 }} /> Loading Dashboard...
    </div>
  );
};

export default Dashboard;