import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { driverAPI, SOCKET_URL } from '../../utils/api';
import Loader from '../../components/Loader';
import io from 'socket.io-client'; // ✅ NEW
import { FaHome, FaSearch, FaRoad, FaFileAlt, FaTruckMoving, FaBell, FaKey, FaFlagCheckered, FaMapMarkerAlt, FaExclamationTriangle, FaCoffee, FaSyncAlt, FaCheckCircle, FaCog } from 'react-icons/fa';
import ThemeToggle from '../../components/ThemeToggle';
import dashboardBg from '../../images/dashboard.png';

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: <FaHome /> },
  { key: 'find-loads', label: 'Find Loads', icon: <FaSearch /> },
  { key: 'active-trip', label: 'Active Trip', icon: <FaRoad /> },
  { key: 'history', label: 'Trip History', icon: <FaFileAlt /> },
  { key: 'settings', label: 'Settings', icon: <FaCog /> },
];

export default function DriverDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [notifOpen, setNotifOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState(null);
  const [availableLoads, setAvailableLoads] = useState([]);
  const [activeTrip, setActiveTrip] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [,setError] = useState('');
  const [vehicle, setVehicle] = useState('Unassigned');
  const [assignedWheelType, setAssignedWheelType] = useState('');

  // ✅ NEW: notification state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const name = user?.username || 'Driver';

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [sR, availR, actR, histR, profileR, nR] = await Promise.allSettled([
        driverAPI.getStats(),
        driverAPI.getLoads(),
        driverAPI.getMyLoad(),
        driverAPI.getHistory(),
        driverAPI.getProfile(),
        driverAPI.getNotifications(),
      ]);

      if (sR.status === 'fulfilled') setStats(sR.value.data.data);
      if (availR.status === 'fulfilled') setAvailableLoads(availR.value.data.data || []);
      if (actR.status === 'fulfilled') setActiveTrip(actR.value.data.data);
      if (histR.status === 'fulfilled') setHistory(histR.value.data.data || []);
      if (nR.status === 'fulfilled') {
        const notifs = nR.value.data.data || [];
        setNotifications(notifs);
        setUnreadCount(notifs.filter(n => !n.isRead).length);
      }

      if (profileR.status === 'fulfilled') {
        const pData = profileR.value.data.data;
        const vNum = pData?.vehicleNumber;
        setVehicle(vNum && vNum !== '' ? vNum : 'Unassigned');
        setAssignedWheelType(pData?.wheelType || '');
      }

      if (sR.status === 'rejected') setError('Partial data load failure. Please refresh.');
    } catch (err) {
      setError('Failed to load dashboard data. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ✅ Socket.io — connect and join personal room AFTER connection established
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'], // fallback to polling if websocket fails
    });

    const userId = user?._id || user?.id;

    // ✅ KEY FIX: emit join INSIDE connect event, not before
    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
      if (userId) {
        socket.emit('join', userId);
        console.log('🔌 Joined room:', userId);
      }
    });

    socket.on('connect_error', (err) => {
      console.log('❌ Socket error:', err.message);
    });

    socket.on('notification', (data) => {
      console.log('🔔 Notification received:', data);
      const newNotif = { ...data, isRead: false };
      setNotifications(prev => [newNotif, ...prev]);
      setUnreadCount(prev => prev + 1);
      if (data.type === 'VEHICLE_ASSIGNED' || data.type === 'VEHICLE_REMOVED') {
        fetchAll();
      }
    });

    return () => socket.disconnect();
  }, [user, fetchAll]);

  const handleAcceptLoad = async (id) => {
    if (!window.confirm('Accept this load? It will become your active trip.')) return;
    try {
      setSubmitting(true);
      await driverAPI.acceptLoad(id);
      fetchAll();
      setActiveTab('active-trip');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept load');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStage = async (newStage) => {
    if (!activeTrip) return;
    try {
      setSubmitting(true);
      await driverAPI.updateStage(activeTrip._id, newStage);
      fetchAll();
      if (newStage === 'Completed') setActiveTab('history');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update stage');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader message="Loading Driver Dashboard..." />;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-dark)', color: 'var(--text-primary)', fontFamily: "'Rajdhani',sans-serif" }}>
      <img src={dashboardBg} alt="" style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.08, zIndex: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(135deg, var(--bg-dark) 0%, var(--bg-header) 50%, var(--bg-dark) 100%)', zIndex: 0, pointerEvents: 'none' }} />

      {/* Full-width header line */}
      <div style={{ position: 'fixed', top: 60, left: 0, right: 0, height: 1, background: 'rgba(var(--accent-rgb), 0.15)', zIndex: 1050, pointerEvents: 'none' }} />



      {/* Sidebar - Fixed Static Icon Strip */}

      {/* Sidebar */}
      <aside style={{ 
        width: 64, 
        height: '100vh', 
        background: 'var(--bg-sidebar)', 
        borderRight: '1px solid var(--border)', 
        display: 'flex', 
        flexDirection: 'column', 
        position: 'fixed', 
        left: 0, 
        top: 0, 
        bottom: 0, 
        zIndex: 1000, 
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
        overflow: 'hidden' 
      }}>
        <div style={{ padding: '20px 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 24, color: 'var(--accent)', flexShrink: 0 }}><FaTruckMoving /></span>
        </div>
        <nav style={{ flex: 1, padding: '12px 0' }}>
          {NAV_ITEMS.map(item => (
            <button 
              key={item.key} 
              onClick={() => { setActiveTab(item.key); }} 
              style={{ 
                width: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: 12, 
                padding: '12px 0', 
                background: activeTab === item.key ? 'rgba(255,107,0,0.12)' : 'transparent', 
                border: 'none', 
                borderLeft: activeTab === item.key ? '3px solid var(--accent)' : '3px solid transparent', 
                color: activeTab === item.key ? 'var(--accent)' : '#8899aa', 
                cursor: 'pointer', 
                fontSize: 14, 
                fontWeight: 600, 
                transition: 'all 0.2s', 
                textAlign: 'left', 
                whiteSpace: 'nowrap' 
              }}
            >
              <span style={{ fontSize: 20, flexShrink: 0 }}>{item.icon}</span>
              {/* Removed item.label for minimalist icon-only look */}
            </button>
          ))}
        </nav>
        {/* Removed toggle button */}
      </aside>

      {/* Main */}
      <div style={{ 
        flex: 1, 
        marginLeft: 64, 
        width: 'calc(100% - 64px)',
        display: 'flex', 
        flexDirection: 'column', 
        position: 'relative', 
        zIndex: 1, 
        transition: 'all 0.3s ease',
        minWidth: 0
      }}>
        {/* TopNav */}
        <nav style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: isMobile ? '0 16px' : '0 28px', 
          height: 60, 
          background: 'var(--bg-header)', 
          borderBottom: '1px solid var(--border)',
          position: 'sticky', 
          top: 0, 
          zIndex: 1100, 
          overflow: 'visible',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          <div />

          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 20, height: '100%', transform: 'translateY(-4px)' }}>
            {!isMobile && (
              <span style={{ color: 'var(--text-secondary)', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, display: 'flex', alignItems: 'center', height: 38 }}>
                Drive Safe, <span style={{ color: 'var(--text-primary)', fontWeight: 700, marginLeft: 6 }}>{name}</span>
              </span>
            )}

            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <button onClick={async () => {
                const newState = !notifOpen;
                setNotifOpen(newState);
                if (newState && unreadCount > 0) {
                  setUnreadCount(0);
                  setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                  try { await driverAPI.readNotifications(); } catch (err) { console.error(err); }
                }
              }}
                className="notif-btn">
                <div className="notif-bell-container">
                  <div className="notif-bell" />
                </div>
                {unreadCount > 0 && (
                  <span className="notif-badge">
                    {unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div style={{ position: 'fixed', right: 16, top: 68, width: 'min(300px, calc(100vw - 80px))', background: 'var(--bg-card)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,107,0,0.25)', borderRadius: 14, zIndex: 9999, maxHeight: 400, overflowY: 'auto', boxShadow: '0 12px 40px rgba(0,0,0,0.7)' }}>
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(var(--accent-rgb), 0.1)', color: 'var(--accent)', fontWeight: 700, fontSize: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FaBell /> Notifications</div>
                    {notifications.length > 0 && (
                      <button onClick={() => setNotifications([])} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer' }}>Clear all</button>
                    )}
                  </div>
                  {notifications.length === 0
                    ? <div style={{ padding: '20px', color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>No new notifications</div>
                    : notifications.map((n, i) => (
                      <div key={n._id || i} style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', background: !n.isRead ? 'rgba(255,107,0,0.06)' : 'transparent' }}>
                        <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 13 }}>{n.title}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 4, lineHeight: 1.4 }}>{n.message}</div>
                               <div style={{ color: 'var(--text-muted)', fontSize: 10, marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>{new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                <span>{new Date(n.timestamp).toLocaleDateString([], { day: '2-digit', month: 'short', year: '2-digit' })}</span>
                              </div>
                      </div>
                    ))
                  }
                </div>
              )}
            </div>

            <ThemeToggle />
            <span style={{ background: 'rgba(var(--accent-rgb), 0.15)', border: '1px solid rgba(var(--accent-rgb), 0.3)', color: 'var(--accent)', borderRadius: 10, padding: '0 12px', height: 38, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}><FaTruckMoving /> DRIVER</span>
            <button className="Btn" onClick={() => { logout(); navigate('/'); }}>
              <div className="sign">
                <svg viewBox="0 0 512 512">
                  <path d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z" />
                </svg>
              </div>
              <div className="logout-label">Logout</div>
            </button>
          </div>
        </nav>

        <div style={{ padding: 28, flex: 1 }}>

          {/* DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div>
              <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
                <div>
                  <h2 style={{ color: 'var(--text-primary)', fontSize: 26, fontWeight: 800, margin: 0 }}>On Duty, <span style={{ color: 'var(--accent)' }}>{name}</span></h2>
                  <p style={{ color: 'var(--text-muted)', margin: '4px 0 0', fontSize: 14, letterSpacing: 2 }}>DRIVER DASHBOARD</p>
                </div>
                <div style={{ background: 'var(--bg-card)', border: `1px solid ${vehicle === 'Unassigned' ? 'rgba(255,255,255,0.1)' : 'rgba(var(--accent-rgb), 0.3)'}`, borderRadius: 12, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ fontSize: 32, color: vehicle === 'Unassigned' ? '#556677' : 'var(--accent)' }}><FaKey /></div>
                  <div>
                    <div style={{ color: vehicle === 'Unassigned' ? '#556677' : 'var(--accent)', fontSize: 20, fontWeight: 800 }}>{vehicle}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 11, letterSpacing: 1, marginTop: 2 }}>ASSIGNED VEHICLE</div>
                  </div>
                </div>
              </div>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(130px, 1fr))', 
                gap: 16, 
                marginBottom: 28 
              }}>
                {[
                  { icon: <FaFlagCheckered />, label: 'TRIPS COMPLETED', value: stats?.completed ?? 0, color: '#22c55e' },
                  { icon: <FaRoad />, label: 'ONGOING TRIP', value: stats?.active > 0 ? 1 : 0, color: '#38bdf8' },
                  { icon: <FaSearch />, label: 'AVAILABLE LOADS', value: stats?.available ?? 0, color: 'var(--accent)' },
                ].map((s, i) => (
                  <div key={s.label} style={{ 
                    background: 'var(--bg-card)', 
                    border: 'none', 
                    borderRadius: 24, 
                    padding: '24px 16px', 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center', 
                    justifyContent: 'center',
                    textAlign: 'center',
                    gap: 12, 
                    boxShadow: 'var(--card-shadow)',
                    animation: `fadeUp 0.4s ease ${i * 0.07}s both`,
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: s.color, opacity: 0.8 }} />
                    <span style={{ fontSize: 32, color: s.color, background: `${s.color}15`, width: 56, height: 56, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.icon}</span>
                    <div>
                      <div style={{ color: s.color, fontSize: 24, fontWeight: 800, lineHeight: 1 }}>{s.value}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 10, letterSpacing: 1.5, marginTop: 4, fontWeight: 700 }}>{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {activeTrip && (
                <div style={{ background: 'rgba(56,189,248,0.05)', border: '1px solid rgba(56,189,248,0.3)', borderRadius: 12, padding: 24, marginBottom: 28 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3 style={{ color: '#38bdf8', margin: 0, fontSize: 16, letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 8 }}><FaRoad /> CURRENT ACTIVE TRIP</h3>
                    <button onClick={() => setActiveTab('active-trip')} style={{ background: '#38bdf8', border: 'none', color: '#000', borderRadius: 8, padding: '6px 16px', cursor: 'pointer', fontWeight: 800, fontSize: 13 }}>View Trip details ➔</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: 16 }}>
                    <div style={{ flex: 1, background: 'var(--bg-glass)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, padding: 16 }}>
                      <div style={{ color: 'var(--text-primary)', fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{activeTrip.pickup} ➔ {activeTrip.drop}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Material: <span style={{ color: 'var(--text-secondary)' }}>{activeTrip.material} ({activeTrip.weight}T)</span></div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Cost: <span style={{ color: '#4ade80', fontWeight: 700 }}>₹{activeTrip.cost?.toLocaleString()}</span></div>
                    </div>
                    <div style={{ background: 'rgba(var(--accent-rgb), 0.1)', border: '1px solid rgba(var(--accent-rgb), 0.3)', borderRadius: 8, padding: '16px 24px', textAlign: 'center' }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: 11, letterSpacing: 1, marginBottom: 4 }}>CURRENT STAGE</div>
                      <div style={{ color: 'var(--accent)', fontSize: 20, fontWeight: 800 }}>{activeTrip.stage}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* FIND LOADS */}
          {activeTab === 'find-loads' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ color: 'var(--text-primary)', fontSize: 22, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <FaSearch /> Find {assignedWheelType ? `${assignedWheelType} ` : 'Available '} Loads
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {assignedWheelType && (
                    <span style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid #38bdf8', color: '#38bdf8', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, letterSpacing: 0.5 }}>
                      FILTER: {assignedWheelType}
                    </span>
                  )}
                  <button onClick={fetchAll} style={{ background: 'rgba(var(--accent-rgb), 0.1)', border: '1px solid rgba(var(--accent-rgb), 0.3)', color: 'var(--accent)', borderRadius: 8, padding: '7px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}><FaSyncAlt /> Refresh List</button>
                </div>
              </div>
              {activeTrip && (
                <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid #f59e0b', borderRadius: 8, padding: '14px 16px', color: '#f59e0b', marginBottom: 20, fontSize: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <FaExclamationTriangle /> You already have an active trip. Complete it before accepting new loads.
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
                {availableLoads.length === 0 ? (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '64px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12 }}>
                    <div style={{ fontSize: 40, color: 'var(--text-secondary)', marginBottom: 16 }}><FaSearch /></div>
                    <p style={{ color: 'var(--text-muted)', fontSize: 16, marginTop: 12 }}>
                      No loads available right now.<br />Check back later.
                    </p>
                  </div>
                ) : availableLoads.map(load => (
                  <div key={load._id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <span style={{ color: '#f59e0b', fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>{load.loadId}</span>
                          <span style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid #22c55e', color: '#22c55e', padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 700 }}>NEW</span>
                        </div>
                        <h3 style={{ color: 'var(--text-primary)', margin: 0, fontSize: 18 }}>{load.material}</h3>
                        <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>Weight: <span style={{ color: 'var(--text-secondary)' }}>{load.weight} Ton</span></div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Cost: <span style={{ color: '#4ade80', fontWeight: 700 }}>₹{load.cost ? load.cost.toLocaleString() : 'N/A'}</span></div>
                        {load.commission > 0 && (
                          <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Commission: <span style={{ color: '#94a3b8', fontWeight: 700 }}>₹{load.commission.toLocaleString()}</span></div>
                        )}
                        {load.finalAmount > 0 && (
                          <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Payout: <span style={{ color: '#3b82f6', fontWeight: 800, fontSize: 14 }}>₹{load.finalAmount.toLocaleString()}</span></div>
                        )}
                      </div>
                      <div style={{ background: 'rgba(var(--accent-rgb), 0.1)', border: '1px solid rgba(var(--accent-rgb), 0.3)', color: 'var(--accent)', padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 800 }}>{load.vehicleRequired}</div>
                    </div>
                    <div style={{ background: 'var(--bg-glass)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, padding: 16, marginBottom: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--accent)' }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ color: 'var(--text-muted)', fontSize: 11, letterSpacing: 1 }}>PICKUP</div>
                          <div style={{ color: 'var(--text-primary)', fontSize: 14 }}>{load.pickup}</div>
                        </div>
                        <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(load.pickup)}`} target="_blank" rel="noreferrer" style={{ color: '#38bdf8', fontSize: 18, textDecoration: 'none' }}><FaMapMarkerAlt /></a>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#22c55e' }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ color: 'var(--text-muted)', fontSize: 11, letterSpacing: 1 }}>DROP</div>
                          <div style={{ color: 'var(--text-primary)', fontSize: 14 }}>{load.drop}</div>
                        </div>
                        <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(load.drop)}`} target="_blank" rel="noreferrer" style={{ color: '#38bdf8', fontSize: 18, textDecoration: 'none' }}><FaMapMarkerAlt /></a>
                      </div>
                    </div>
                    {load.notes && <div style={{ color: 'var(--text-secondary)', fontSize: 13, padding: '10px', background: 'rgba(0,0,0,0.02)', borderRadius: 6, marginBottom: 20, fontStyle: 'italic' }}>"{load.notes}"</div>}
                    <button onClick={() => handleAcceptLoad(load._id)} disabled={activeTrip || submitting}
                      style={{ width: '100%', background: (activeTrip || submitting) ? '#1a2030' : 'var(--accent)', border: 'none', color: (activeTrip || submitting) ? '#556677' : '#000', padding: '12px', borderRadius: 8, fontSize: 14, fontWeight: 800, cursor: (activeTrip || submitting) ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}>
                      {submitting ? 'PROCESSING...' : activeTrip ? 'TRIP IN PROGRESS' : 'ACCEPT LOAD'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ACTIVE TRIP */}
          {activeTab === 'active-trip' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ color: 'var(--text-primary)', fontSize: 22, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}><FaRoad /> Active Trip</h2>
                <button onClick={fetchAll} style={{ background: 'rgba(var(--accent-rgb), 0.1)', border: '1px solid rgba(var(--accent-rgb), 0.3)', color: 'var(--accent)', borderRadius: 8, padding: '7px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}><FaSyncAlt /> Refresh</button>
              </div>
              {!activeTrip ? (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '64px', textAlign: 'center' }}>
                  <div style={{ fontSize: 40, color: 'var(--text-secondary)', marginBottom: 16 }}><FaCoffee /></div>
                  <h3 style={{ color: 'var(--text-primary)', fontSize: 20, margin: '0 0 8px' }}>No Active Trip</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: 15, marginBottom: 24 }}>You are currently on standby.</p>
                  <button onClick={() => setActiveTab('find-loads')} style={{ background: 'var(--accent)', border: 'none', color: '#000', padding: '10px 24px', borderRadius: 8, fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>Find Loads ➔</button>
                </div>
              ) : (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 32 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: 24, marginBottom: 24, flexWrap: 'wrap', gap: 20 }}>
                    <div>
                      <div style={{ color: '#f59e0b', fontSize: 13, fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>LOAD ID: {activeTrip.loadId}</div>
                      <h3 style={{ color: 'var(--text-primary)', margin: '0 0 8px', fontSize: 28, fontWeight: 800 }}>{activeTrip.material}</h3>
                      <div style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Weight: <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>{activeTrip.weight} Ton</span></div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Cost: <span style={{ color: '#4ade80', fontWeight: 700 }}>₹{activeTrip.cost ? activeTrip.cost.toLocaleString() : 'N/A'}</span></div>
                    </div>
                    <div style={{ background: 'rgba(var(--accent-rgb), 0.05)', border: '1px solid rgba(255,107,0,0.2)', borderRadius: 12, padding: '16px 24px', textAlign: 'center', minWidth: 200 }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: 11, letterSpacing: 2, marginBottom: 8 }}>CURRENT STAGE</div>
                      <div style={{ color: 'var(--accent)', fontSize: 24, fontWeight: 800 }}>{activeTrip.stage}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 32, marginBottom: 32, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 280 }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: 12, letterSpacing: 1, marginBottom: 12 }}>ROUTE</div>
                      <div style={{ background: 'var(--bg-glass)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 24, position: 'relative' }}>
                          <div style={{ position: 'absolute', left: 8, top: 20, bottom: -24, width: 2, background: 'rgba(255,255,255,0.1)' }} />
                          <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, marginTop: 2, position: 'relative', zIndex: 1, border: '4px solid #f8fafc' }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ color: 'var(--text-muted)', fontSize: 12, letterSpacing: 1 }}>PICKUP LOCATION</div>
                            <div style={{ color: 'var(--text-primary)', fontSize: 18, fontWeight: 600, margin: '4px 0 8px' }}>{activeTrip.pickup}</div>
                            <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(activeTrip.pickup)}`} target="_blank" rel="noreferrer" style={{ background: 'rgba(56,189,248,0.1)', color: '#38bdf8', padding: '6px 12px', borderRadius: 6, textDecoration: 'none', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, width: 'fit-content' }}><FaMapMarkerAlt /> Navigate to Pickup</a>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                          <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#22c55e', flexShrink: 0, marginTop: 2, position: 'relative', zIndex: 1, border: '4px solid #f8fafc' }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ color: 'var(--text-muted)', fontSize: 12, letterSpacing: 1 }}>DROP LOCATION</div>
                            <div style={{ color: 'var(--text-primary)', fontSize: 18, fontWeight: 600, margin: '4px 0 8px' }}>{activeTrip.drop}</div>
                            <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(activeTrip.drop)}`} target="_blank" rel="noreferrer" style={{ background: 'rgba(56,189,248,0.1)', color: '#38bdf8', padding: '6px 12px', borderRadius: 6, textDecoration: 'none', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, width: 'fit-content' }}><FaMapMarkerAlt /> Navigate to Drop</a>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div style={{ flex: 1, minWidth: 280 }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: 12, letterSpacing: 1, marginBottom: 12 }}>UPDATE STAGE</div>
                      <div style={{ background: 'var(--bg-glass)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 20 }}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '0 0 16px', lineHeight: 1.5 }}>Update your progress to notify the owner and loader.</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {[
                            { s: 'Approved', l: 'Arrived at Pickup', c: '#38bdf8' },
                            { s: 'Loading', l: 'Loading Started', c: '#facc15' },
                            { s: 'In Transit', l: 'Loading Done & Dispatched', c: '#4ade80' },
                            { s: 'Unloading', l: 'Arrived at Drop', c: '#f472b6' },
                            { s: 'Completed', l: 'Unloaded & Completed', c: '#22c55e' },
                          ].map(btn => {
                            const stages = ['Waiting', 'Approved', 'Loading', 'In Transit', 'Unloading', 'Completed'];
                            const currIdx = stages.indexOf(activeTrip.stage);
                            const btnIdx = stages.indexOf(btn.s);
                            const isPast = btnIdx <= currIdx;
                            const isNext = btnIdx === currIdx + 1;
                            return (
                              <button key={btn.s} onClick={() => handleUpdateStage(btn.s)} disabled={!isNext || submitting}
                                style={{
                                  width: '100%', padding: '12px 16px', borderRadius: 8, fontSize: 14, fontWeight: 700, textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s',
                                  background: isPast ? `rgba(${hexToRgb(btn.c)},0.1)` : isNext ? btn.c : '#1a2030',
                                  border: `1px solid ${isPast ? btn.c : isNext ? btn.c : 'transparent'}`,
                                  color: isPast ? btn.c : isNext ? '#000' : '#556677',
                                  cursor: isNext && !submitting ? 'pointer' : 'not-allowed', opacity: isPast ? 0.7 : 1
                                }}>
                                <span>{isPast ? '✓' : isNext ? '➔' : '·'} {btn.l}</span>
                                {isPast && <span style={{ fontSize: 11, background: btn.c, color: '#000', padding: '2px 8px', borderRadius: 12 }}>DONE</span>}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* HISTORY */}
          {activeTab === 'history' && (
            <div>
              <h2 style={{ color: 'var(--text-primary)', fontSize: 22, fontWeight: 800, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}><FaFileAlt /> Trip History</h2>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
                {history.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: 40, color: 'var(--accent)', marginBottom: 16 }}><FaFileAlt /></div>
                    <p>No completed trips yet.</p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                          {['Load ID', 'Date', 'Material', 'Route', 'Weight', 'Cost', 'Status'].map(h => (
                            <th key={h} style={{ padding: '10px 14px', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: 1, textAlign: 'left', fontSize: 11 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {history.map(trip => (
                          <tr key={trip._id} style={{ borderBottom: '1px solid #e2e8f0' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,107,0,0.04)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <td style={{ padding: '14px', color: 'var(--accent)', fontWeight: 700 }}>{trip.loadId}</td>
                            <td style={{ padding: '14px', color: 'var(--text-muted)' }}>{new Date(trip.updatedAt).toLocaleDateString()}</td>
                            <td style={{ padding: '14px', color: 'var(--text-primary)', fontWeight: 600 }}>{trip.material}</td>
                            <td style={{ padding: '14px', color: 'var(--accent)' }}>{trip.pickup} ➔ {trip.drop}</td>
                            <td style={{ padding: '14px', color: 'var(--accent)' }}>{trip.weight}T</td>
                            <td style={{ padding: '14px', color: '#4ade80', fontWeight: 700 }}>₹{trip.cost ? trip.cost.toLocaleString() : 'N/A'}</td>
                            <td style={{ padding: '14px' }}><span style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid #22c55e', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}><FaCheckCircle /> COMPLETED</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SETTINGS */}
          {activeTab === 'settings' && (
            <div>
              <h2 style={{ color: 'var(--text-primary)', fontSize: 22, fontWeight: 800, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                <FaCog /> Settings
              </h2>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 30, color: 'var(--accent)' }}>
                <p style={{ fontSize: 16, marginBottom: 20, fontWeight: 600 }}>Preferences and Account Settings</p>
                <div style={{ padding: 20, background: 'var(--bg-dark)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <p>Settings options are currently being prepared.</p>
                </div>
              </div>
            </div>
          )}

        </div>
        <footer style={{ textAlign: 'center', padding: 16, color: 'var(--text-muted)', fontSize: 12, borderTop: '1px solid var(--border)', letterSpacing: 2 }}>© 2026 [ AJITH SIVAKUMAR ]</footer>
      </div>

      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:6px;height:6px}
        ::-webkit-scrollbar-track{background:var(--bg-dark)}
        ::-webkit-scrollbar-thumb{background:rgba(var(--accent-rgb), 0.3);border-radius:3px}
      `}</style>
    </div>
  );
}

function hexToRgb(hex) {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) { r = parseInt(hex[1] + hex[1], 16); g = parseInt(hex[2] + hex[2], 16); b = parseInt(hex[3] + hex[3], 16); }
  else if (hex.length === 7) { r = parseInt(hex.slice(1, 3), 16); g = parseInt(hex.slice(3, 5), 16); b = parseInt(hex.slice(5, 7), 16); }
  return `${r},${g},${b}`;
}