import React, { useState, useEffect } from 'react';
import { Link, } from 'react-router-dom';
import { driverRegister, getTransports } from '../../utils/api';
import { FaTruckMoving, FaArrowLeft, FaExclamationTriangle, FaEye, FaEyeSlash, FaClock, FaClipboardList, FaInfoCircle } from 'react-icons/fa';
import driverLogImg from '../../images/driver.log.png';

const DriverRegister = () => {
  const [form, setForm] = useState({
    transportName: '',
    username: '',
    mobile: '',
    email: '',
    password: '',
    confirmPassword: '',
    drivingLicense: null,
    aadhaar: null
  });
  const [transports, setTransports] = useState([]);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);


  useEffect(() => {
    getTransports()
      .then((res) => setTransports(res.data.data || []))
      .catch(() => { });
  }, []);

  const handleChange = (e) => {
    if (e.target.type === 'file') {
      setForm({ ...form, [e.target.name]: e.target.files[0] });
    } else {
      setForm({ ...form, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('transportName', form.transportName);
      formData.append('username', form.username);
      formData.append('mobile', form.mobile);
      formData.append('email', form.email);
      formData.append('password', form.password);
      formData.append('confirmPassword', form.confirmPassword);
      
      if (form.drivingLicense) formData.append('drivingLicense', form.drivingLicense);
      if (form.aadhaar) formData.append('aadhaar', form.aadhaar);

      console.log('🚀 Submitting Driver Registration with fields:', Array.from(formData.keys()));
      await driverRegister(formData);
      setSubmitted(true);
    } catch (err) {
      console.error('❌ Registration Error:', err.response?.data);
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="page-wrapper">
        <img src={driverLogImg} alt="Driver Background" className="role-bg-image" />
        <div className="role-bg-overlay" />
        <div className="auth-card" style={{ textAlign: 'center', maxWidth: 480 }}>
          <div style={{ fontSize: 60, color: '#ffd700', marginBottom: 16 }}><FaClock /></div>
          <p style={{ color: 'var(--accent)', fontSize: 12, letterSpacing: 3, textTransform: 'uppercase', fontFamily: 'Rajdhani', fontWeight: 600, marginBottom: 8 }}>
            Registration Submitted
          </p>
          <h2 style={{ fontFamily: 'Rajdhani', fontSize: 26, fontWeight: 700, marginBottom: 16 }}>
            Waiting for Approval
          </h2>
          <div style={{
            background: 'rgba(255,215,0,0.08)',
            border: '1px solid rgba(255,215,0,0.25)',
            borderRadius: 12,
            padding: '20px 24px',
            marginBottom: 24,
            textAlign: 'left',
          }}>
            <p style={{ color: '#ffd700', fontWeight: 600, marginBottom: 8, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}><FaClipboardList /> What happens next?</p>
            <ul style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.8, paddingLeft: 16 }}>
              <li>The Transport Owner has been notified via email</li>
              <li>They will review your registration request</li>
              <li>You will receive an email once approved or rejected</li>
              <li>After approval, you can login to the system</li>
            </ul>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>
            Your account is currently <span style={{ color: '#ffd700', fontWeight: 600 }}>PENDING</span> approval from the Transport Owner.
          </p>
          <Link to="/driver/login" className="btn btn-outline" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
            GO TO LOGIN
          </Link>
          <p style={{ textAlign: 'center', color: '#64748b', fontSize: 11, marginTop: 32, letterSpacing: 1 }}>© 2026 TRUCK MANAGEMENT SYSTEM</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <img src={driverLogImg} alt="Driver Background" className="role-bg-image" />
      <div className="role-bg-overlay" />
      <div className="auth-card" style={{ maxWidth: 500 }}>
        <Link to="/driver/login" className="back-link"><FaArrowLeft style={{ marginRight: 8 }} /> Back to Login</Link>
        <div className="brand-header">
          <span className="brand-icon"><FaTruckMoving /></span>
          <p className="brand-title">Truck Management System</p>
          <h1 className="page-title">Driver Registration</h1>
        </div>

        <div style={{
          background: 'rgba(232,65,24,0.06)',
          border: '1px solid rgba(232,65,24,0.2)',
          borderRadius: 10,
          padding: '10px 14px',
          marginBottom: 20,
          fontSize: 12,
          color: 'var(--text-secondary)',
          display: 'flex',
          gap: 8,
          alignItems: 'flex-start',
        }}>
          <span><FaInfoCircle /></span>
          <span>Your registration will be sent to the Transport Owner for approval. You'll be notified by email.</span>
        </div>

        {error && <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FaExclamationTriangle /> {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Select Transport Name</label>
            <select className="form-select" name="transportName" value={form.transportName} onChange={handleChange} required>
              <option value="">-- Select Transport --</option>
              {transports.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {[
            { label: 'Username', name: 'username', placeholder: 'Enter your name / username' },
            { label: 'Mobile Number', name: 'mobile', placeholder: '+91 XXXXXXXXXX', type: 'tel' },
            { label: 'Email ID', name: 'email', placeholder: 'Enter email address', type: 'email' },
            { label: 'Driving License (PDF/Image)', name: 'drivingLicense', type: 'file' },
            { label: 'Aadhaar Card (PDF/Image)', name: 'aadhaar', type: 'file' },
            { label: 'Password', name: 'password', placeholder: 'Min 6 characters', type: 'password', toggle: 'password' },
            { label: 'Confirm Password', name: 'confirmPassword', placeholder: 'Confirm your password', type: 'password', toggle: 'confirmPassword' },
          ].map((field) => (
            <div className="form-group" key={field.name}>
              <label className="form-label">{field.label}</label>
              {field.type === 'file' ? (
                <input
                  className="form-input"
                  type="file"
                  name={field.name}
                  onChange={handleChange}
                  accept=".pdf,image/*"
                  required
                />
              ) : (
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
              )}
            </div>
          ))}

          <div className="auth-glow-container">
            <button className="auth-glow-btn" type="submit" disabled={loading}>
              {loading ? 'SUBMITTING...' : 'REGISTER'}
            </button>
          </div>
        </form>

        <div className="footer-note" style={{ marginTop: 16 }}>
          Already have an account? <Link to="/driver/login">Login</Link>
        </div>

        <p style={{ textAlign: 'center', color: '#445566', fontSize: 11, marginTop: 24, letterSpacing: 1 }}>© 2026 TRUCK MANAGEMENT SYSTEM</p>
      </div>
    </div >
  );
};

export default DriverRegister;