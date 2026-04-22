import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { forgotPassword } from '../utils/api';
import { FaTruck, FaArrowLeft, FaEnvelope, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import dashboardBg from '../images/dashboard.png'; // Using a generic background or role-specific if needed

const ForgotPassword = () => {
    const { role } = useParams(); // 'owner', 'loader', or 'driver'
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);
        try {
            const res = await forgotPassword(role, { email });
            setMessage(res.data.message);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send reset link.');
        } finally {
            setLoading(false);
        }
    };

    const roleDisplayName = role ? role.charAt(0).toUpperCase() + role.slice(1) : 'User';

    return (
        <div className="page-wrapper">
            <img src={dashboardBg} alt="Background" className="role-bg-image" />
            <div className="role-bg-overlay" />

            <div className="auth-card">
                <Link to={`/${role}/login`} className="back-link">
                    <FaArrowLeft style={{ marginRight: 8 }} /> Back to Login
                </Link>

                <div className="brand-header">
                    <span className="brand-icon"><FaTruck /></span>
                    <p className="brand-title">Truck Management System</p>
                    <h1 className="page-title">{roleDisplayName} Forgot Password</h1>
                    <p style={{ color: '#8899aa', fontSize: 13, marginTop: 8 }}>Enter your registered email to receive a password reset link.</p>
                </div>

                {error && <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FaExclamationTriangle /> {error}</div>}
                {message && <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid #22c55e', padding: '12px', borderRadius: '10px', fontSize: '14px', marginBottom: '20px' }}><FaCheckCircle /> {message}</div>}

                {!message && (
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <div style={{ position: 'relative' }}>
                                <FaEnvelope style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#ff6b00' }} />
                                <input
                                    className="form-input"
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    style={{ paddingLeft: 45 }}
                                    required
                                />
                            </div>
                        </div>

                        <div className="auth-glow-container">
                            <button className="auth-glow-btn" type="submit" disabled={loading}>
                                {loading ? 'SENDING...' : 'SEND RESET LINK'}
                            </button>
                        </div>
                    </form>
                )}
                
                {message && (
                    <div style={{ textAlign: 'center', marginTop: 20 }}>
                        <p style={{ color: '#8899aa', fontSize: 14 }}>Please check your inbox. If you don't see the email, check your spam folder.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
