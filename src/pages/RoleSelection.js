import React from 'react';
import { Link } from 'react-router-dom';
import { FaTruck, FaBox, FaTruckMoving, FaArrowLeft } from 'react-icons/fa';
import welcomeImg from '../images/welcome.png';

const roles = [
  { icon: <FaTruck />, name: 'Owner', desc: 'Manage fleets and transport operations', path: '/owner/login' },
  { icon: <FaBox />, name: 'Loader', desc: 'Handle cargo and loading activities', path: '/loader/login' },
  { icon: <FaTruckMoving />, name: 'Driver', desc: 'Track trips, routes, and deliveries', path: '/driver/login' },
];

const RoleSelection = () => {
  return (
    <div className="role-page">
      {/* Background Image */}
      <img src={welcomeImg} alt="Welcome" className="role-bg-image" />
      <div className="role-bg-overlay" />

      <div className="role-selection-card">
        <Link to="/" className="back-link"><FaArrowLeft style={{ marginRight: 8 }} /> Back</Link>
        <div className="role-header">
          <span className="welcome-label">Welcome to</span>
          <h1 className="main-title">TRUCK MANAGEMENT</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, letterSpacing: 1, marginBottom: 8 }}>Your smart transport management system</p>
          <p className="subtitle">Select your role to get started</p>
        </div>
        <div className="role-grid">
          {roles.map((role, i) => (
            <Link
              key={role.name}
              to={role.path}
              className="role-card"
              style={{ animationDelay: `${i * 0.1}s`, animation: 'fadeInUp 0.5s ease both', border: 'none' }}
            >
              <span className="role-emoji">{role.icon}</span>
              <span className="role-name">{role.name}</span>
              <span className="role-desc">{role.desc}</span>
            </Link>
          ))}
        </div>
        <p style={{ textAlign: 'center', color: 'var(--accent)', fontSize: 11, marginTop: 40, letterSpacing: 2 }}>© 2026 PREMIUM LOGISTICS SOLUTIONS</p>
      </div>
    </div>
  );
};

export default RoleSelection;
