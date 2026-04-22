import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { resetPassword } from '../utils/api';
import { FaTruck, FaExclamationTriangle, FaCheckCircle, FaEye, FaEyeSlash } from 'react-icons/fa';
import dashboardBg from '../images/dashboard.png';

const ResetPassword = () => {
    const { role, token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (password.length < 6) {
            return setError('Password must be at least 6 characters long.');
        }

        if (password !== confirmPassword) {
            return setError('Passwords do not match.');
        }

        setLoading(true);
        try {
            const res = await resetPassword(role, token, { password });
            setMessage(res.data.message);
            setTimeout(() => {
                navigate(`/${role}/login`);
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password.');
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
                <div className="brand-header">
                    <span className="brand-icon"><FaTruck /></span>
                    <p className="brand-title">Truck Management System</p>
                    <h1 className="page-title">{roleDisplayName} Reset Password</h1>
                    <p style={{ color: '#8899aa', fontSize: 13, marginTop: 8 }}>Enter your new secure password below.</p>
                </div>

                {error && <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FaExclamationTriangle /> {error}</div>}
                {message && <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid #22c55e', padding: '12px', borderRadius: '10px', fontSize: '14px', marginBottom: '20px' }}><FaCheckCircle /> {message} Redirecting to login...</div>}

                {!message && (
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">New Password</label>
                            <div className="password-input-wrapper">
                                <input
                                    className="form-input"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Enter new password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <FaEye /> : <FaEyeSlash />}
                                </button>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Confirm New Password</label>
                            <div className="password-input-wrapper">
                                <input
                                    className="form-input"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Confirm new password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="auth-glow-container">
                            <button className="auth-glow-btn" type="submit" disabled={loading}>
                                {loading ? 'UPDATING...' : 'UPDATE PASSWORD'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ResetPassword;
