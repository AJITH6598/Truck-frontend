import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { driverLogin, getTransports } from '../../utils/api';
import { FaTruckMoving, FaArrowLeft, FaExclamationTriangle, FaEye, FaEyeSlash, FaClock, FaTimesCircle } from 'react-icons/fa';
import driverLogImg from '../../images/driver.log.png';
import fleetLogo from '../../images/fleetlink-logo.png';

const DriverLogin = () => {
  const [form, setForm] = useState({ transportName: '', identifier: '', password: '' });
  const [transports, setTransports] = useState([]);
  const [error, setError] = useState('');
  const [statusCode, setStatusCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    getTransports()
      .then((res) => setTransports(res.data.data || []))
      .catch(() => { });
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setStatusCode('');
    setLoading(true);
    try {
      const res = await driverLogin(form);
      login(res.data.data, res.data.token);
      navigate('/driver/dashboard');
    } catch (err) {
      const data = err.response?.data;
      setStatusCode(data?.statusCode || '');
      setError(data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderError = () => {
    if (!error) return null;
    if (statusCode === 'PENDING') {
      return (
        <div style={{ background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.3)', borderRadius: 12, padding: '16px 18px', marginBottom: 18 }}>
          <p style={{ color: '#ffd700', fontWeight: 700, marginBottom: 6, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}><FaClock /> Approval Pending</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: 0 }}>
            Your account is waiting for approval from the Transport Owner. You will receive an email once approved.
          </p>
        </div>
      );
    }
    if (statusCode === 'REJECTED') {
      return (
        <div style={{ background: 'rgba(255,71,87,0.08)', border: '1px solid rgba(255,71,87,0.3)', borderRadius: 12, padding: '16px 18px', marginBottom: 18 }}>
          <p style={{ color: '#ff4757', fontWeight: 700, marginBottom: 6, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}><FaTimesCircle /> Account Rejected</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: 0 }}>
            Your account has been rejected by the Transport Owner. Please contact them directly.
          </p>
        </div>
      );
    }
    return <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FaExclamationTriangle /> {error}</div>;
  };

  return (
    <div className="page-wrapper">
      <img src={driverLogImg} alt="Driver Background" className="role-bg-image" />
      <div className="role-bg-overlay" />
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <img src={fleetLogo} alt="FleetLink" style={{ height: 50, width: 'auto' }} />
        </div>
        <Link to="/roles" className="back-link"><FaArrowLeft style={{ marginRight: 8 }} /> Back to Roles</Link>
        <div className="brand-header">
          <span className="brand-icon"><FaTruckMoving /></span>
          <p className="brand-title">Truck Management System</p>
          <h1 className="page-title">Driver Login</h1>
        </div>

        {renderError()}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Select Transport Name</label>
            <select className="form-select" name="transportName" value={form.transportName} onChange={handleChange} required>
              <option value="">-- Select Transport --</option>
              {transports.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Username / Email</label>
            <input className="form-input" type="text" name="identifier" placeholder="Enter username or email" value={form.identifier} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="password-input-wrapper">
              <input
                className="form-input"
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Enter password"
                value={form.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <FaEye /> : <FaEyeSlash />}
              </button>
            </div>
            <div style={{ textAlign: 'right', marginTop: 8, marginBottom: 16 }}>
              <Link to="/forgot-password/driver" style={{ color: 'var(--accent)', fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>Forgot Password?</Link>
            </div>
          </div>
          <div className="auth-glow-container">
            <button className="auth-glow-btn" type="submit" disabled={loading}>
              {loading && <span className="spinner" style={{ marginRight: 8 }} />}
              {loading ? 'Logging in...' : 'LOGIN'}
            </button>
          </div>
        </form>

        <div className="divider">OR</div>
        <p className="footer-note">Don't have an account?</p>
        <div className="auth-glow-container" style={{ padding: 2 }}>
          <Link to="/driver/register" className="auth-glow-btn" style={{ textDecoration: 'none', fontSize: 13, padding: '0.6em 1.5em' }}>
            REGISTER
          </Link>
        </div>

        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 11, marginTop: 24, letterSpacing: 1 }}>© 2026 TRUCK MANAGEMENT SYSTEM</p>
      </div>
    </div>
  );
};

export default DriverLogin;