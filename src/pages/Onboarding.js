import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronRight, FaBars, FaTimes, FaTruckMoving } from 'react-icons/fa';
import ThemeToggle from '../components/ThemeToggle';
import fleetLogo from '../images/fleetlink-logo.png';
import ownerImg from '../images/owner.png';
import loaderImg from '../images/loader.png';
import driverImg from '../images/driver.png';
import './Onboarding.css';

const slides = [
    {
        image: ownerImg,
        role: 'Owner',
        title: 'Manage Your Fleet',
        subtitle: 'Take full control of your transport operations, vehicles, and drivers from one smart dashboard.',
        bg: 'linear-gradient(160deg, #e84118 0%, #ff8a65 60%, #f8fafc 100%)',
    },
    {
        image: loaderImg,
        role: 'Loader',
        title: 'Streamline Cargo Handling',
        subtitle: 'Efficiently manage loading activities, track cargo assignments, and coordinate with transport teams.',
        bg: 'linear-gradient(160deg, #e84118 0%, #ffab91 60%, #f8fafc 100%)',
    },
    {
        image: driverImg,
        role: 'Driver',
        title: 'Track Every Journey',
        subtitle: 'Stay on top of your trips, routes, and deliveries — anytime, anywhere, with real-time updates.',
        bg: 'linear-gradient(160deg, #e84118 0%, #ffccbc 60%, #f8fafc 100%)',
    },
];

const Onboarding = () => {
    const [current, setCurrent] = useState(0);
    const [animating, setAnimating] = useState(false);
    const [view, setView] = useState('home'); // 'home', 'about', 'contact', 'privacy', 'terms', 'support'
    const [menuOpen, setMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const navigate = useNavigate();

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (menuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [menuOpen]);

    const toggleMenu = () => setMenuOpen(!menuOpen);
    const closeMenu = () => setMenuOpen(false);

    const handleViewChange = (v) => {
        setView(v);
        closeMenu();
    };

    const goToNext = useCallback(() => {
        setAnimating(true);
        setTimeout(() => {
            setCurrent((prev) => (prev + 1) % slides.length);
            setAnimating(false);
        }, 300);
    }, []);

    useEffect(() => {
        const timer = setInterval(goToNext, 3000);
        return () => clearInterval(timer);
    }, [goToNext]);

    const handleDot = (idx) => {
        setAnimating(true);
        setTimeout(() => {
            setCurrent(idx);
            setAnimating(false);
        }, 300);
    };

    const handleGetStarted = () => {
        navigate('/roles');
    };


    const slide = slides[current];

    return (
        <div className="onboarding-wrapper">
            {/* Top Navigation Bar */}
            <nav className="ob-top-nav">
                {/* Brand / Logo — always visible */}
                <div className="ob-nav-brand">
                    <img src={fleetLogo} alt="FleetLink" className="ob-brand-logo" />
                </div>

                {isMobile ? (
                    /* Mobile: ThemeToggle + Hamburger */
                    <div className="ob-nav-right">
                        <ThemeToggle />
                        <button className="ob-menu-btn" onClick={toggleMenu} aria-label="Menu">
                            {menuOpen ? <FaTimes /> : <FaBars />}
                        </button>

                        {/* Mobile slide-down menu */}
                        <div className={`ob-mobile-menu${menuOpen ? ' open' : ''}`}>
                            {[
                                { key: 'home', label: 'Home' },
                                { key: 'about', label: 'About' },
                                { key: 'contact', label: 'Contact' },
                                { key: 'privacy', label: 'Privacy Policy' },
                                { key: 'terms', label: 'Terms' },
                                { key: 'support', label: 'Support' },
                            ].map(item => (
                                <button
                                    key={item.key}
                                    className={`ob-mobile-link${view === item.key ? ' active' : ''}`}
                                    onClick={() => handleViewChange(item.key)}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                        {menuOpen && <div className="ob-menu-overlay" onClick={closeMenu} />}
                    </div>
                ) : (
                    /* Desktop: Nav links + ThemeToggle */
                    <div className="ob-nav-links">
                        {[
                            { key: 'home', label: 'Home' },
                            { key: 'about', label: 'About' },
                            { key: 'contact', label: 'Contact' },
                            { key: 'privacy', label: 'Privacy' },
                            { key: 'terms', label: 'Terms' },
                            { key: 'support', label: 'Support' },
                        ].map(item => (
                            <button
                                key={item.key}
                                className={`ob-nav-btn${view === item.key ? ' active' : ''}`}
                                onClick={() => setView(item.key)}
                            >
                                {item.label}
                            </button>
                        ))}
                        <div style={{ marginLeft: 8 }}>
                            <ThemeToggle />
                        </div>
                    </div>
                )}
            </nav>

            {/* VIEW CONTENT */}
            {view === 'home' && (
                <>
                    {/* Full-screen background image */}
                    <img
                        src={slide.image}
                        alt={slide.role}
                        className={`ob-bg-image ${animating ? 'ob-slide-out' : 'ob-slide-in'}`}
                    />

                    {/* Dark gradient overlay at the bottom */}
                    <div className="ob-gradient-overlay" />

                    {/* Glass card pinned to bottom */}
                    <div className="onboarding-card">

                        {/* Role pills */}
                        <div className="ob-role-pills">
                            {slides.map((s, i) => (
                                <button
                                    key={s.role}
                                    className={`ob-pill ${i === current ? 'ob-pill-active' : ''}`}
                                    onClick={() => handleDot(i)}
                                >
                                    {s.role}
                                </button>
                            ))}
                        </div>

                        {/* Text content */}
                        <div className={`ob-text ${animating ? 'ob-slide-out' : 'ob-slide-in'}`}>
                            <h2 className="ob-title">{slide.title}</h2>
                            <p className="ob-subtitle">{slide.subtitle}</p>
                        </div>

                        {/* Dot indicators */}
                        <div className="ob-dots">
                            {slides.map((_, i) => (
                                <button
                                    key={i}
                                    className={`ob-dot ${i === current ? 'ob-dot-active' : ''}`}
                                    onClick={() => handleDot(i)}
                                />
                            ))}
                        </div>

                        {/* Premium Get Started button */}
                        <div className="ob-actions">
                            <button className="btn-17" onClick={handleGetStarted}>
                                <span className="text-container">
                                    <span className="text">Get Started <FaChevronRight style={{ fontSize: 13, marginLeft: 8 }} /></span>
                                </span>
                            </button>
                        </div>
                        <p style={{ textAlign: 'center', color: 'var(--accent)', fontSize: 10, marginTop: 20, letterSpacing: 2 }}>© 2026 [ FLEETLINK LOGISTICS ]</p>
                    </div>
                </>
            )}

            {(view === 'about' || view === 'contact' || view === 'privacy' || view === 'terms' || view === 'support') && (
                <div className="ob-info-view">
                    <div className="ob-info-card">
                        {view === 'about' && (
                            <>
                                <h1 className="ob-info-title">About Our Solution</h1>
                                <p className="ob-info-text">
                                    The Truck Management System is an enterprise-grade logistics platform designed to optimize the transportation industry. We bridge the gap between Transport Owners, Loaders, and Drivers with real-time tracking, automated load assignments, and a secure document management system.
                                </p>
                                <div className="ob-features-grid">
                                    <div className="ob-feature-item">
                                        <h3>Real-time Fleet Map</h3>
                                        <p>Track every vehicle across the country with live updates and interactive mapping.</p>
                                    </div>
                                    <div className="ob-feature-item">
                                        <h3>Secure Documents</h3>
                                        <p>Drivers can securely upload License and Aadhaar documents, with instant owner verification.</p>
                                    </div>
                                    <div className="ob-feature-item">
                                        <h3>Load Monitoring</h3>
                                        <p>End-to-end monitoring of cargo from initial pickup to final destination delivery.</p>
                                    </div>
                                </div>
                            </>
                        )}

                        {view === 'contact' && (
                            <>
                                <h1 className="ob-info-title">Get In Touch</h1>
                                <p className="ob-info-text">Have questions or need technical support? Our team is here to help you optimize your logistics operations.</p>
                                <div className="ob-contact-details">
                                    <div className="ob-contact-item">
                                        <strong>Email</strong>
                                        <span>support@truckmgmt.com</span>
                                    </div>
                                    <div className="ob-contact-item">
                                        <strong>Phone</strong>
                                        <span>+91 98765 43210</span>
                                    </div>
                                    <div className="ob-contact-item">
                                        <strong>Location</strong>
                                        <span>Tamil Nadu, India</span>
                                    </div>
                                </div>
                            </>
                        )}

                        {view === 'privacy' && (
                            <>
                                <h1 className="ob-info-title">Privacy Policy</h1>
                                <p className="ob-info-text">Last Updated: April 2026</p>
                                <div style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.8 }}>
                                    <h3 style={{ color: 'var(--text-primary)', marginBottom: 10 }}>1. Data Collection</h3>
                                    <p style={{ marginBottom: 20 }}>We collect registration data (email, phone, transport name) and driver documentation (License, Aadhaar) solely for the purpose of verifying identities and facilitating logistics operations within the system.</p>

                                    <h3 style={{ color: 'var(--text-primary)', marginBottom: 10 }}>2. Information Use</h3>
                                    <p style={{ marginBottom: 20 }}>Your documents are securely stored in our encrypted MongoDB database. They are only accessible by Transport Owners whom you explicitly request to join.</p>

                                    <h3 style={{ color: 'var(--text-primary)', marginBottom: 10 }}>3. Security</h3>
                                    <p style={{ marginBottom: 20 }}>We implement industry-standard security measures to protect your binary data (Buffers) from unauthorized access, loss, or misuse.</p>

                                    <h3 style={{ color: 'var(--text-primary)', marginBottom: 10 }}>4. Data Rights</h3>
                                    <p style={{ marginBottom: 20 }}>Users have the right to request deletion of their account and associated documents at any time through our support channel.</p>
                                </div>
                            </>
                        )}

                        {view === 'terms' && (
                            <>
                                <h1 className="ob-info-title">Terms of Service</h1>
                                <p className="ob-info-text">Last Updated: April 2026</p>
                                <div style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.8 }}>
                                    <h3 style={{ color: 'var(--text-primary)', marginBottom: 10 }}>1. Terms</h3>
                                    <p style={{ marginBottom: 20 }}>By accessing this system, you are agreeing to be bound by these terms of service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws.</p>

                                    <h3 style={{ color: 'var(--text-primary)', marginBottom: 10 }}>2. Use License</h3>
                                    <p style={{ marginBottom: 20 }}>Permission is granted to temporarily use the Truck Management System for personal or commercial logistics coordination. This is the grant of a license, not a transfer of title.</p>

                                    <h3 style={{ color: 'var(--text-primary)', marginBottom: 10 }}>3. Disclaimer</h3>
                                    <p style={{ marginBottom: 20 }}>The materials on the system are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim all other warranties including, without limitation, implied warranties of merchantability.</p>

                                    <h3 style={{ color: 'var(--text-primary)', marginBottom: 10 }}>4. Limitations</h3>
                                    <p style={{ marginBottom: 20 }}>In no event shall the Truck Management System or its suppliers be liable for any damages arising out of the use or inability to use the materials on the system.</p>
                                </div>
                            </>
                        )}

                        {view === 'support' && (
                            <>
                                <h1 className="ob-info-title">Technical Support</h1>
                                <p className="ob-info-text">Our technical team is available 24/7 to ensure your logistics operations run smoothly.</p>
                                <div className="ob-contact-details">
                                    <div className="ob-contact-item">
                                        <strong>Live Help Desk</strong>
                                        <span>support.helpdesk@truckmgmt.com</span>
                                    </div>
                                    <div className="ob-contact-item">
                                        <strong>Emergency Hotline</strong>
                                        <span>+91 1800 456 7890</span>
                                    </div>
                                </div>
                                <h3 style={{ color: 'var(--text-primary)', marginTop: 30, marginBottom: 15, fontFamily: 'Rajdhani', fontSize: 18, textTransform: 'uppercase' }}>Frequently Asked Questions</h3>
                                <div className="ob-features-grid">
                                    <div className="ob-feature-item">
                                        <h4 style={{ color: '#ff6b00', marginBottom: 8 }}>Password Reset</h4>
                                        <p>Click 'Forgot Password' on any login screen to receive an OTP on your registered mobile/email.</p>
                                    </div>
                                    <div className="ob-feature-item">
                                        <h4 style={{ color: '#ff6b00', marginBottom: 8 }}>Document Verification</h4>
                                        <p>Verification usually takes 2-4 hours. You will receive an email confirmation once approved.</p>
                                    </div>
                                </div>
                            </>
                        )}
                        <button className="ob-info-back" onClick={() => setView('home')}>Back to Home</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Onboarding;
