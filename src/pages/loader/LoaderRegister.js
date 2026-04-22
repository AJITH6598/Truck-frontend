import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loaderSendOTP, loaderRegister } from '../../utils/api';
import { FaBox, FaArrowLeft, FaExclamationTriangle, FaCheckCircle, FaEye, FaEyeSlash, FaClock } from 'react-icons/fa';
import loaderLogImg from '../../images/loader.log.png';

const LoaderRegister = () => {
  const [form, setForm] = useState({ officeName: '', username: '', mobile: '', email: '', password: '', confirmPassword: '', otp: '' });
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;
    if (name === 'officeName' || name === 'username') {
      newValue = value.charAt(0).toUpperCase() + value.slice(1);
    }
    setForm({ ...form, [name]: newValue });
  };

  const startTimer = () => {
    setOtpTimer(60);
    const iv = setInterval(() => {
      setOtpTimer((t) => { if (t <= 1) { clearInterval(iv); return 0; } return t - 1; });
    }, 1000);
  };

  const handleSendOTP = async () => {
    setError('');
    if (!form.email || !form.username) return setError('Please fill in Username and Email first.');
    setOtpLoading(true);
    try {
      await loaderSendOTP({ email: form.email, username: form.username });
      setOtpSent(true);
      setSuccess('OTP sent to your email!');
      startTimer();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!otpSent) return setError('Please send OTP first.');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.');
    setLoading(true);
    try {
      await loaderRegister(form);
      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/loader/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <img src={loaderLogImg} alt="Loader Background" className="role-bg-image" />
      <div className="role-bg-overlay" />
      <div className="auth-card" style={{ maxWidth: 500 }}>
        <Link to="/loader/login" className="back-link"><FaArrowLeft style={{ marginRight: 8 }} /> Back to Login</Link>
        <div className="brand-header">
          <span className="brand-icon"><FaBox /></span>
          <p className="brand-title">Truck Management System</p>
          <h1 className="page-title">Loader Registration</h1>
        </div>

        {error && <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FaExclamationTriangle /> {error}</div>}
        {success && <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FaCheckCircle /> {success}</div>}

        <form onSubmit={handleSubmit}>
          {[
            { label: 'Office Name', name: 'officeName', placeholder: 'Enter office name' },
            { label: 'Username', name: 'username', placeholder: 'Choose a username' },
            { label: 'Mobile Number', name: 'mobile', placeholder: '+91 XXXXXXXXXX', type: 'tel' },
            { label: 'Email ID', name: 'email', placeholder: 'Enter email address', type: 'email' },
            { label: 'Password', name: 'password', placeholder: 'Min 6 characters', type: 'password', toggle: 'password' },
            { label: 'Confirm Password', name: 'confirmPassword', placeholder: 'Confirm your password', type: 'password', toggle: 'confirmPassword' },
          ].map((field) => (
            <div className="form-group" key={field.name}>
              <label className="form-label">{field.label}</label>
              <div className={field.toggle ? 'password-input-wrapper' : ''}>
                <input
                  className="form-input"
                  type={field.toggle ? (field.toggle === 'password' ? (showPassword ? 'text' : 'password') : (showConfirmPassword ? 'text' : 'password')) : (field.type || 'text')}
                  name={field.name}
                  placeholder={field.placeholder}
                  value={form[field.name]}
                  onChange={handleChange}
                  required
                />
                {field.toggle && (
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => field.toggle === 'password' ? setShowPassword(!showPassword) : setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={field.toggle === 'password' ? (showPassword ? 'Hide password' : 'Show password') : (showConfirmPassword ? 'Hide password' : 'Show password')}
                  >
                    {field.toggle === 'password' ? (showPassword ? <FaEye /> : <FaEyeSlash />) : (showConfirmPassword ? <FaEye /> : <FaEyeSlash />)}
                  </button>
                )}
              </div>
            </div>
          ))}

          <div className="form-group">
            <label className="form-label">OTP Verification</label>
            <div className="otp-row">
              <input className="form-input" type="text" name="otp" placeholder="Enter 6-digit OTP" value={form.otp} onChange={handleChange} maxLength={6} />
              <button type="button" className="btn btn-otp" onClick={handleSendOTP} disabled={otpLoading || otpTimer > 0}>
                {otpLoading ? '...' : otpTimer > 0 ? (<span><FaClock style={{ marginRight: 4 }} />{otpTimer}s</span>) : otpSent ? 'Resend' : 'Send OTP'}
              </button>
            </div>
          </div>

          <div className="auth-glow-container">
            <button className="auth-glow-btn" type="submit" disabled={loading}>
              {loading ? 'REGISTERING...' : 'VERIFY & REGISTER'}
            </button>
          </div>
        </form>

        <div className="footer-note" style={{ marginTop: 16 }}>
          Already have an account? <Link to="/loader/login">Login</Link>
        </div>

        <p style={{ textAlign: 'center', color: '#445566', fontSize: 11, marginTop: 24, letterSpacing: 1 }}>© 2026 TRUCK MANAGEMENT SYSTEM</p>
      </div>
    </div >
  );
};

export default LoaderRegister;
