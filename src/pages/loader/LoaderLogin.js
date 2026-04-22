import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { loaderLogin } from '../../utils/api';
import { FaBox, FaArrowLeft, FaExclamationTriangle, FaEye, FaEyeSlash } from 'react-icons/fa';
import loaderLogImg from '../../images/loader.log.png';

const LoaderLogin = () => {
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await loaderLogin(form);
      login(res.data.data, res.data.token);
      navigate('/loader/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <img src={loaderLogImg} alt="Loader Background" className="role-bg-image" />
      <div className="role-bg-overlay" />
      <div className="auth-card">
        <Link to="/roles" className="back-link"><FaArrowLeft style={{ marginRight: 8 }} /> Back to Roles</Link>
        <div className="brand-header">
          <span className="brand-icon"><FaBox /></span>
          <p className="brand-title">Truck Management System</p>
          <h1 className="page-title">Loader Login</h1>
        </div>

        {error && <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FaExclamationTriangle /> {error}</div>}

        <form onSubmit={handleSubmit}>
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
              <Link to="/forgot-password/loader" style={{ color: 'var(--accent)', fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>Forgot Password?</Link>
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
          <Link to="/loader/register" className="auth-glow-btn" style={{ textDecoration: 'none', fontSize: 13, padding: '0.6em 1.5em' }}>
            REGISTER
          </Link>
        </div>

        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 11, marginTop: 24, letterSpacing: 1 }}>© 2026 TRUCK MANAGEMENT SYSTEM</p>
      </div>
    </div>
  );
};

export default LoaderLogin;
