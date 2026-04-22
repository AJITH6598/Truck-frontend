import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { loaderAPI, SOCKET_URL } from '../../utils/api';
import io from 'socket.io-client';
import Loader from '../../components/Loader';
import { FaHome, FaPlus, FaBox, FaChartBar, FaBell, FaClock, FaCheckCircle, FaTruckMoving, FaExclamationTriangle, FaTruck, FaSyncAlt, FaCog, FaRoute } from 'react-icons/fa';
import ThemeToggle from '../../components/ThemeToggle';
import dashboardBg from '../../images/dashboard.png';

const getVehicleSuggestion = (weight) => {
  const w = parseFloat(weight);
  if (!w || w <= 0) return null;
  if (w <= 11) return { wheel: '6 Wheel', capacity: 11 };
  if (w <= 19) return { wheel: '10 Wheel', capacity: 19 };
  if (w <= 25) return { wheel: '12 Wheel', capacity: 25 };
  if (w <= 30) return { wheel: '14 Wheel', capacity: 30 };
  if (w <= 35) return { wheel: '16 Wheel', capacity: 35 };
  return null;
};

const STATUS_STYLE = {
  'Waiting':    { bg: 'rgba(245,158,11,0.1)',  color: '#f59e0b', border: '#f59e0b', icon: <FaClock style={{ marginRight: 6 }} /> },
  'Booked':     { bg: 'rgba(34,197,94,0.1)',   color: '#22c55e', border: '#22c55e', icon: <FaCheckCircle style={{ marginRight: 6 }} /> },
  'In Transit': { bg: 'rgba(56,189,248,0.1)',  color: '#38bdf8', border: '#38bdf8', icon: <FaTruckMoving style={{ marginRight: 6 }} /> },
  'Completed':  { bg: 'rgba(34,197,94,0.08)',  color: '#4ade80', border: '#4ade80', icon: <FaCheckCircle style={{ marginRight: 6 }} /> },
};

const NAV_ITEMS = [
  { key: 'dashboard',    label: 'Dashboard',   icon: <FaHome /> },
  { key: 'create-load',  label: 'Create Load', icon: <FaPlus /> },
  { key: 'my-loads',     label: 'My Loads',    icon: <FaBox /> },
  { key: 'reports',      label: 'Reports',     icon: <FaChartBar /> },
  { key: 'settings',     label: 'Settings',    icon: <FaCog /> },
];

  const emptyForm = {
    material: '',
    weight: '',
    vehicleRequired: '',
    pickup: '',
    drop: '',
    pickupDate: '',
    distance: '',
    duration: 0,
    pickupCoords: [],
    dropCoords: [],
    notes: '',
    perTonCost: '',
    cost: '',
    commission: '',
    finalAmount: '',
  };
const lbl = { color: 'var(--text-muted)', fontSize: 11, letterSpacing: 1, display: 'block', marginBottom: 6, textTransform: 'uppercase' };
const inp = { width: '100%', background: 'rgba(0,0,0,0.03)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', color: 'var(--text-primary)', fontSize: 14, outline: 'none', fontFamily: "'Rajdhani',sans-serif", boxSizing: 'border-box' };

function LoadsTable({ loads }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
            {['Load ID', 'Material', 'Pickup', 'Drop', 'Dist (KM)', 'Weight', 'Vehicle', 'Cost', 'Comm.', 'Final', 'Status', 'Date'].map(h => (
              <th key={h} style={{ padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: 1, textAlign: 'left', fontSize: 11 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loads.map(l => {
            const st = STATUS_STYLE[l.status] || STATUS_STYLE['Waiting'];
            return (
              <tr key={l._id} style={{ borderBottom: '1px solid #e2e8f0' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,107,0,0.04)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '10px 12px', color: 'var(--accent)', fontWeight: 700 }}>{l.loadId}</td>
                <td style={{ padding: '10px 12px', color: 'var(--text-primary)', fontWeight: 600 }}>{l.material}</td>
                <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{l.pickup}</td>
                <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{l.drop}</td>
                <td style={{ padding: '10px 12px', color: 'var(--accent)', fontWeight: 700 }}>{l.distance || '---'} KM</td>
                <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{l.weight}T</td>
                <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{l.vehicleRequired}</td>
                <td style={{ padding: '10px 12px', color: '#4ade80', fontWeight: 700 }}>₹{l.cost ? l.cost.toLocaleString() : 'N/A'}</td>
                <td style={{ padding: '10px 12px', color: '#94a3b8' }}>₹{l.commission ? l.commission.toLocaleString() : '0'}</td>
                <td style={{ padding: '10px 12px', color: '#3b82f6', fontWeight: 700 }}>₹{l.finalAmount ? l.finalAmount.toLocaleString() : 'N/A'}</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}`, borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center' }}>{st.icon}{l.status}</span>
                </td>
                <td style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: 12 }}>{new Date(l.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function LoaderDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab,    setActiveTab]    = useState('dashboard');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [notifOpen,    setNotifOpen]    = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');
  const [form,         setForm]         = useState(emptyForm);
  const [posted,       setPosted]       = useState(false);
  const [submitting,   setSubmitting]   = useState(false);
  const [formError,    setFormError]    = useState('');
  const [stats,        setStats]        = useState(null);
  const [loads,        setLoads]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');

  // ✅ Notification state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);

  const name    = user?.username || 'Loader';
  const company = user?.officeName || '';

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true); setError('');
      const [sR, lR, nR] = await Promise.allSettled([
        loaderAPI.getStats(),
        loaderAPI.getLoads(),
        loaderAPI.getNotifications()
      ]);

      if (sR.status === 'fulfilled') setStats(sR.value.data.data);
      if (lR.status === 'fulfilled') setLoads(lR.value.data.data || []);
      if (nR.status === 'fulfilled') {
        const notifs = nR.value.data.data || [];
        setNotifications(notifs);
        setUnreadCount(notifs.filter(n => !n.isRead).length);
      }
      
      if (sR.status === 'rejected') setError('Partial data load failure. Please refresh.');
    } catch (err) { setError('Failed to load data. Please refresh.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  
  const [calculatingDist, setCalculatingDist] = useState(false);

  // ✅ Distance Calculation Logic
  useEffect(() => {
    if (form.pickup.trim().length > 3 && form.drop.trim().length > 3) {
      const timer = setTimeout(async () => {
        try {
          setCalculatingDist(true);
          // ✅ Geocode with regional bias (India)
          const q1 = `${form.pickup}, India`;
          const q2 = `${form.drop}, India`;
          
          const [g1, g2] = await Promise.all([
            axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q1)}&limit=1`),
            axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q2)}&limit=1`)
          ]);
          
          if (g1.data?.[0] && g2.data?.[0]) {
            const p1 = [parseFloat(g1.data[0].lat), parseFloat(g1.data[0].lon)];
            const p2 = [parseFloat(g2.data[0].lat), parseFloat(g2.data[0].lon)];
            // OSRM Road Distance & Duration
            const road = await axios.get(`https://router.project-osrm.org/route/v1/driving/${p1[1]},${p1[0]};${p2[1]},${p2[0]}?overview=false`);
            if (road.data?.routes?.[0]) {
              const km = Math.round(road.data.routes[0].distance / 1000);
              const durSec = Math.round(road.data.routes[0].duration);
              const durMin = Math.round(durSec / 60);
              const h = Math.floor(durMin / 60);
              const m = durMin % 60;
              const durStr = h > 0 ? `${h} hr ${m} mins` : `${m} mins`;

              setForm(prev => ({ 
                ...prev, 
                distance: km.toString(), 
                duration: durStr,
                pickupCoords: p1,
                dropCoords: p2
              }));
            }
          }
        } catch (err) {
          console.error('Distance calculation failed:', err);
        } finally {
          setCalculatingDist(false);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [form.pickup, form.drop]);

  // ✅ Auto-calculate Total Cost
  useEffect(() => {
    const w = parseFloat(form.weight) || 0;
    const p = parseFloat(form.perTonCost) || 0;
    if (w > 0 && p > 0) {
      setForm(prev => ({ ...prev, cost: (w * p).toString() }));
    }
  }, [form.weight, form.perTonCost]);

  // ✅ Auto-calculate Final Amount (Cost - Commission)
  useEffect(() => {
    const c = parseFloat(form.cost) || 0;
    const comm = parseFloat(form.commission) || 0;
    if (c > 0) {
      setForm(prev => ({ ...prev, finalAmount: (c - comm).toString() }));
    }
  }, [form.cost, form.commission]);

  // ✅ Socket.io — join personal room and receive notifications
  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['polling', 'websocket'] });
    const userId = user?._id || user?.id;

    socket.on('connect', () => {
      console.log('✅ Loader socket connected:', socket.id);
      if (userId) {
        socket.emit('join', userId);
        console.log('🔌 Loader joined room:', userId);
      }
    });

    socket.on('notification', (data) => {
      console.log('🔔 Loader notification:', data);
      const newNotif = { ...data, isRead: false };
      setNotifications(prev => [newNotif, ...prev]);
      setUnreadCount(prev => prev + 1);
      // Refresh loads when driver accepts or updates stage
      if (data.type === 'LOAD_ACCEPTED' || data.type === 'STAGE_UPDATE') {
        fetchAll();
      }
    });

    return () => socket.disconnect();
  }, [user, fetchAll]);

  const suggestion = getVehicleSuggestion(form.weight);
  const weightNum  = parseFloat(form.weight);
  const overLimit  = weightNum > 35;

  const handlePost = async () => {
    if (!form.material || !form.weight || !form.pickup || !form.drop || !form.cost || !form.finalAmount || overLimit || !suggestion) {
      setFormError('Please ensure all required fields (Material, Weight, Locations, and Cost) are filled.');
      return;
    }
    try {
      setSubmitting(true); setFormError('');
      await loaderAPI.createLoad({ 
        material: form.material, 
        weight: parseFloat(form.weight), 
        vehicleRequired: suggestion.wheel, 
        pickup: form.pickup, 
        drop: form.drop, 
        pickupDate: form.pickupDate, 
        notes: form.notes, 
        cost: parseFloat(form.cost),
        perTonCost: parseFloat(form.perTonCost || 0),
        commission: parseFloat(form.commission || 0),
        finalAmount: parseFloat(form.finalAmount),
        distance: parseFloat(form.distance || 0),
        duration: form.duration || 0,
        pickupCoords: form.pickupCoords || [],
        dropCoords: form.dropCoords || []
      });
      setPosted(true);
      setTimeout(() => { setPosted(false); setForm(emptyForm); fetchAll(); setActiveTab('my-loads'); }, 1800);
    } catch (err) { setFormError(err.response?.data?.message || 'Failed to post load.'); }
    finally { setSubmitting(false); }
  };

  const filteredLoads = filterStatus === 'All' ? loads : loads.filter(l => l.status === filterStatus);

  if (loading) return <Loader message="Loading Loader Dashboard..." />;

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
          <span style={{ fontSize: 24, color: 'var(--accent)', flexShrink: 0 }}><FaBox /></span>
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
                Welcome, <span style={{ color: 'var(--text-primary)', fontWeight: 700, marginLeft: 6 }}>{name}</span>
              </span>
            )}

            {/* ✅ Bell with badge + dropdown */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <button onClick={async () => { 
                const newState = !notifOpen;
                setNotifOpen(newState);
                if (newState && unreadCount > 0) {
                  setUnreadCount(0);
                  setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                  try { await loaderAPI.readNotifications(); } catch (err) { console.error(err); }
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
                <div style={{ position: 'fixed', right: 16, top: 68, width: 'min(320px, calc(100vw - 80px))', background: 'var(--bg-card)', backdropFilter: 'blur(12px)', border: '1px solid rgba(var(--accent-rgb), 0.25)', borderRadius: 14, zIndex: 9999, maxHeight: 400, overflowY: 'auto', boxShadow: '0 12px 40px rgba(0,0,0,0.7)' }}>
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(var(--accent-rgb), 0.1)', color: 'var(--accent)', fontWeight: 700, fontSize: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FaBell /> Notifications</div>
                    {notifications.length > 0 && (
                      <button onClick={() => setNotifications([])} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer' }}>Clear all</button>
                    )}
                  </div>
                    {notifications.length === 0
                      ? <div style={{ padding: '32px 20px', color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>
                          <FaBell style={{ fontSize: 24, opacity: 0.2, marginBottom: 12 }} /><br />No new notifications
                        </div>
                      : notifications.map((n, i) => {
                          const isNew = !n.isRead;
                          return (
                            <div key={n._id || i} style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', background: isNew ? 'rgba(255,107,0,0.06)' : 'transparent' }}>
                              <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 13 }}>{n.title}</div>
                              <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 4, lineHeight: 1.4 }}>{n.message}</div>
                               <div style={{ color: 'var(--text-muted)', fontSize: 10, marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>{new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                <span>{new Date(n.timestamp).toLocaleDateString([], { day: '2-digit', month: 'short', year: '2-digit' })}</span>
                              </div>
                            </div>
                          );
                        })
                    }
                </div>
              )}
            </div>
            <ThemeToggle />
            <span style={{ background: 'rgba(var(--accent-rgb), 0.15)', border: '1px solid rgba(255,107,0,0.3)', color: 'var(--accent)', borderRadius: 10, padding: '0 12px', height: 38, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}><FaBox /> LOADER</span>
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
          {error && <div style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid #dc2626', borderRadius: 8, padding: '12px 16px', color: '#dc2626', marginBottom: 20, fontSize: 14, display: 'flex', alignItems: 'center', gap: 10 }}><FaExclamationTriangle /> {error} <button onClick={fetchAll} style={{ marginLeft: 12, background: 'transparent', border: '1px solid #dc2626', color: '#dc2626', borderRadius: 6, padding: '2px 10px', cursor: 'pointer', fontSize: 12 }}>Retry</button></div>}

          {/* DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div>
              <div style={{ marginBottom: 28 }}>
                <h2 style={{ color: 'var(--text-primary)', fontSize: 26, fontWeight: 800, margin: 0 }}>Hello, <span style={{ color: 'var(--accent)', textTransform: 'uppercase' }}>{name}</span></h2>
                <p style={{ color: 'var(--text-muted)', margin: '4px 0 0', fontSize: 14, letterSpacing: 2 }}>{company ? `${company} · ` : ''}LOADER DASHBOARD</p>
              </div>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(130px, 1fr))', 
                gap: 16, 
                marginBottom: 28 
              }}>
                {[
                  { icon: <FaBox />,         label: 'TOTAL LOADS', value: stats?.total      ?? 0, color: 'var(--accent)' },
                  { icon: <FaClock />,        label: 'WAITING',     value: stats?.waiting    ?? 0, color: '#f59e0b' },
                  { icon: <FaCheckCircle />,  label: 'BOOKED',      value: stats?.booked     ?? 0, color: '#22c55e' },
                  { icon: <FaTruckMoving />,  label: 'IN TRANSIT',  value: stats?.inTransit  ?? 0, color: '#38bdf8' },
                  { icon: <FaCheckCircle />,  label: 'COMPLETED',   value: stats?.completed  ?? 0, color: '#4ade80' },
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
                    <span style={{ fontSize: 30, color: s.color, background: `${s.color}15`, width: 56, height: 56, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.icon}</span>
                    <div>
                      <div style={{ color: s.color, fontSize: 24, fontWeight: 800, lineHeight: 1 }}>{s.value}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 10, letterSpacing: 1.5, marginTop: 4, fontWeight: 700 }}>{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ color: 'var(--accent)', margin: 0, fontSize: 16, letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 8 }}><FaBox /> MY RECENT LOADS</h3>
                  <button onClick={() => setActiveTab('create-load')} style={{ background: 'var(--accent)', border: 'none', color: '#000', borderRadius: 10, padding: '0 16px', height: 36, cursor: 'pointer', fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform='translateY(-1px)'} onMouseLeave={e => e.currentTarget.style.transform='none'}><FaPlus /> New Load</button>
                </div>
                {loads.length === 0 ? <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No loads yet. Create your first load!</div> : <LoadsTable loads={loads.slice(0, 4)} />}
              </div>
            </div>
          )}

          {/* CREATE LOAD */}
          {activeTab === 'create-load' && (
            <div>
              <h2 style={{ color: 'var(--text-primary)', fontSize: 22, fontWeight: 800, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}><FaPlus /> Create New Load</h2>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 28 }}>
                {posted ? (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <div style={{ fontSize: 50, color: '#22c55e', marginBottom: 16 }}><FaCheckCircle /></div>
                    <h3 style={{ color: '#22c55e', fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>Load Posted!</h3>
                    <p style={{ color: 'var(--text-muted)' }}>Redirecting to My Loads...</p>
                  </div>
                ) : (
                  <>
                    {formError && <div style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid #dc2626', borderRadius: 8, padding: '10px 14px', color: '#dc2626', marginBottom: 16, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}><FaExclamationTriangle /> {formError}</div>}
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 12 : 20 }}>
                      <div style={{ gridColumn: '1/-1' }}>
                        <label style={lbl}>Material Type</label>
                        <input 
                          value={form.material} 
                          onChange={e => {
                            const val = e.target.value;
                            const capped = val.charAt(0).toUpperCase() + val.slice(1);
                            setForm(p => ({ ...p, material: capped }));
                          }} 
                          placeholder="e.g. Cement, Steel, Sand..." 
                          style={inp} 
                        />
                      </div>
                      <div>
                        <label style={lbl}>Pickup Location</label>
                        <input 
                          value={form.pickup} 
                          onChange={e => {
                            const val = e.target.value;
                            const capped = val.charAt(0).toUpperCase() + val.slice(1);
                            setForm(p => ({ ...p, pickup: capped }));
                          }} 
                          placeholder="e.g. Salem" 
                          style={inp} 
                        />
                      </div>
                      <div>
                        <label style={lbl}>Drop Location</label>
                        <input 
                          value={form.drop} 
                          onChange={e => {
                            const val = e.target.value;
                            const capped = val.charAt(0).toUpperCase() + val.slice(1);
                            setForm(p => ({ ...p, drop: capped }));
                          }} 
                          placeholder="e.g. Trichy" 
                          style={inp} 
                        />
                      </div>
                      <div>
                        <label style={lbl}>Pickup Date</label>
                        <input type="date" value={form.pickupDate} onChange={e => setForm(p => ({ ...p, pickupDate: e.target.value }))} style={inp} />
                      </div>
                      <div>
                        <label style={lbl}>Distance (KM)</label>
                        <div style={{ position: 'relative' }}>
                          <input 
                            type="number" 
                            name="distance" 
                            value={form.distance} 
                            onChange={e => setForm(p => ({ ...p, distance: e.target.value }))} 
                            placeholder={calculatingDist ? "Calculating..." : "Distance in KM"} 
                            style={{ ...inp, paddingRight: 40 }} 
                          />
                          <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: calculatingDist ? 'var(--accent)' : '#64748b' }}>
                            <FaRoute className={calculatingDist ? "spin-slow" : ""} />
                          </div>
                        </div>
                      </div>
                      <div>
                        <label style={lbl}>Weight (Ton)</label>
                        <input type="number" value={form.weight} onChange={e => setForm(p => ({ ...p, weight: e.target.value }))} placeholder="e.g. 18" style={{ ...inp, borderColor: overLimit ? '#dc2626' : 'rgba(255,255,255,0.1)' }} />
                        {overLimit && <p style={{ color: '#dc2626', fontSize: 12, marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}><FaExclamationTriangle /> Max 35 Ton</p>}
                      </div>
                      <div>
                        <label style={lbl}>Vehicle Suggestion</label>
                        <div style={{ 
                          background: suggestion ? 'linear-gradient(135deg, #ffffff 0%, #fff7ed 100%)' : 'rgba(0,0,0,0.02)', 
                          border: '1px solid var(--border)', 
                          borderRadius: 12, 
                          padding: '10px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          minHeight: 58, 
                          transition: 'all 0.3s ease',
                          boxSizing: 'border-box'
                        }}>
                          {suggestion ? (
                            <>
                              <div style={{ 
                                width: 32, 
                                height: 32, 
                                background: 'var(--accent)', 
                                borderRadius: 8, 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                color: '#fff', 
                                fontSize: 16 
                              }}>
                                <FaTruck />
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ color: 'var(--accent)', fontWeight: 800, fontSize: 16, lineHeight: 1.2 }}>{suggestion.wheel}</div>
                                <div style={{ color: '#64748b', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>
                                  SUGGEST CAPACITY: {suggestion.capacity}T
                                </div>
                              </div>
                            </>
                          ) : (
                            <div style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 600 }}>Weight for Suggestion</div>
                          )}
                        </div>
                      </div>
                      <div>
                        <label style={lbl}>Per Ton Cost (₹)</label>
                        <input
                          type="number"
                          placeholder="e.g. 1000"
                          value={form.perTonCost}
                          onChange={e => setForm(p => ({ ...p, perTonCost: e.target.value }))}
                          style={inp}
                        />
                      </div>

                      <div style={{ position: 'relative' }}>
                        <label style={lbl}>LOAD COST (₹)</label>
                        <div style={{ 
                          position: 'relative', 
                          background: (parseFloat(form.weight) > 0 && parseFloat(form.perTonCost) > 0) ? 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)' : '#ffffff',
                          border: '1px solid var(--border)',
                          borderRadius: 12,
                          padding: '10px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          transition: 'all 0.3s ease'
                        }}>
                          <div style={{ 
                            width: 32, 
                            height: 32, 
                            background: (parseFloat(form.weight) > 0 && parseFloat(form.perTonCost) > 0) ? '#22c55e' : '#64748b', 
                            borderRadius: 8, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            color: '#fff', 
                            fontSize: 16,
                            fontWeight: 900
                          }}>₹</div>
                          <div style={{ flex: 1 }}>
                            <input
                              type="number"
                              placeholder="0.00"
                              value={form.cost}
                              onChange={e => setForm(p => ({ ...p, cost: e.target.value }))}
                              style={{ 
                                width: '100%', 
                                border: 'none', 
                                background: 'transparent', 
                                color: (parseFloat(form.weight) > 0 && parseFloat(form.perTonCost) > 0) ? '#166534' : '#0f172a', 
                                fontSize: 18, 
                                fontWeight: 800, 
                                outline: 'none',
                                fontFamily: "'Rajdhani', sans-serif" 
                              }}
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label style={lbl}>Commission (₹)</label>
                        <input
                          type="number"
                          placeholder="e.g. 200"
                          value={form.commission}
                          onChange={e => setForm(p => ({ ...p, commission: e.target.value }))}
                          style={inp}
                        />
                      </div>

                      <div style={{ position: 'relative' }}>
                        <label style={lbl}>Final Amount (₹)</label>
                        <div style={{ 
                          position: 'relative', 
                          background: (parseFloat(form.finalAmount) > 0) ? 'linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)' : '#ffffff',
                          border: '1px solid var(--border)',
                          borderRadius: 12,
                          padding: '10px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          transition: 'all 0.3s ease'
                        }}>
                          <div style={{ 
                            width: 32, 
                            height: 32, 
                            background: (parseFloat(form.finalAmount) > 0) ? '#3b82f6' : '#64748b', 
                            borderRadius: 8, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            color: '#fff', 
                            fontSize: 16,
                            fontWeight: 900
                          }}>₹</div>
                          <div style={{ flex: 1 }}>
                            <input
                              type="number"
                              placeholder="0.00"
                              value={form.finalAmount}
                              readOnly
                              style={{ 
                                width: '100%', 
                                border: 'none', 
                                background: 'transparent', 
                                color: (parseFloat(form.finalAmount) > 0) ? '#1e40af' : '#0f172a', 
                                fontSize: 18, 
                                fontWeight: 800, 
                                outline: 'none',
                                fontFamily: "'Rajdhani', sans-serif" 
                              }}
                            />
                            <div style={{ color: (parseFloat(form.finalAmount) > 0) ? '#3b82f6' : '#64748b', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                              { (parseFloat(form.finalAmount) > 0) ? 'Payout Amount' : 'Balance' }
                            </div>
                          </div>
                        </div>
                      </div>
                      <div style={{ gridColumn: '1/-1' }}>
                        <label style={lbl}>Special Notes (Optional)</label>
                        <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={3} style={{ ...inp, resize: 'vertical', minHeight: 80 }} />
                      </div>
                    </div>
                    {suggestion && form.pickup && form.drop && form.cost && (
                      <div style={{ margin: '20px 0', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10, padding: '14px 16px' }}>
                        <div style={{ color: '#4ade80', fontWeight: 700, fontSize: 13, marginBottom: 8 }}>📋 LOAD SUMMARY</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 8 }}>
                          {[
                            { l: 'Material', v: form.material },
                            { l: 'Weight', v: `${form.weight} Ton` },
                            { l: 'Vehicle', v: suggestion.wheel },
                            { l: 'Pickup', v: form.pickup },
                            { l: 'Drop', v: form.drop },
                            { l: 'Distance', v: `${form.distance} KM` },
                            { l: 'Cost', v: `₹${parseFloat(form.cost || 0).toLocaleString()}`, c: '#22c55e' },
                            { l: 'Commission', v: `₹${parseFloat(form.commission || 0).toLocaleString()}`, c: '#94a3b8' },
                            { l: 'Final Amount', v: `₹${parseFloat(form.finalAmount || 0).toLocaleString()}`, c: '#3b82f6' },
                          ].map(item => (
                            <div key={item.l}><div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{item.l}</div><div style={{ color: item.c || 'var(--text-primary)', fontWeight: 700, fontSize: 13 }}>{item.v}</div></div>
                          ))}
                        </div>
                      </div>
                    )}
                    <button onClick={handlePost} disabled={!form.material || !form.weight || !form.pickup || !form.drop || overLimit || !suggestion || submitting}
                      style={{ width: '100%', background: (submitting || overLimit || !suggestion) ? '#1a2030' : 'var(--accent)', border: 'none', color: (submitting || overLimit || !suggestion) ? '#556677' : '#000', borderRadius: 10, padding: '14px', cursor: 'pointer', fontWeight: 800, fontSize: 16, letterSpacing: 2, marginTop: 8 }}>
                      {submitting ? <><FaClock style={{ marginRight: '8px' }} /> Posting...</> : <><FaTruck style={{ marginRight: '8px' }} /> POST LOAD</>}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* MY LOADS */}
          {activeTab === 'my-loads' && (
            <div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h2 style={{ color: 'var(--text-primary)', fontSize: 22, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}><FaBox /> My Loads</h2>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={fetchAll} style={{ background: 'rgba(var(--accent-rgb), 0.1)', border: '1px solid rgba(255,107,0,0.3)', color: 'var(--accent)', borderRadius: 10, width: 38, height: 38, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background='rgba(255,107,0,0.2)'} onMouseLeave={e => e.currentTarget.style.background='rgba(var(--accent-rgb), 0.1)'}><FaSyncAlt /></button>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  {['All', 'Waiting', 'Booked', 'In Transit', 'Completed'].map(s => (
                    <button key={s} onClick={() => setFilterStatus(s)} style={{ flexShrink: 0, background: filterStatus === s ? 'var(--accent)' : 'rgba(255,255,255,0.05)', border: `1px solid ${filterStatus === s ? 'var(--accent)' : 'rgba(255,255,255,0.1)'}`, color: filterStatus === s ? '#000' : '#8899aa', borderRadius: 20, padding: '6px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 700, transition: 'all 0.2s' }}>{s}</button>
                  ))}
                </div>
              </div>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
                {filteredLoads.length === 0 ? <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}><div style={{ fontSize: 40, color: 'var(--text-secondary)', marginBottom: 12 }}><FaBox /></div><p style={{ marginTop: 12 }}>No loads found</p></div> : <LoadsTable loads={filteredLoads} />}
              </div>
            </div>
          )}

          {/* REPORTS */}
          {activeTab === 'reports' && (
            <div>
              <h2 style={{ color: 'var(--text-primary)', fontSize: 22, fontWeight: 800, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}><FaChartBar /> Reports</h2>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(130px, 1fr))', 
                gap: 16 
              }}>
                {[
                  { icon: <FaBox />,        label: 'Total Loads Posted',    value: stats?.total     ?? 0,                             sub: 'All Time',  color: 'var(--accent)' },
                  { icon: <FaCheckCircle />, label: 'Completed Deliveries', value: stats?.completed ?? 0,                             sub: 'All Time',  color: '#22c55e' },
                  { icon: <FaTruckMoving />, label: 'Active Loads',         value: (stats?.booked ?? 0) + (stats?.inTransit ?? 0),    sub: 'Right Now', color: '#38bdf8' },
                  { icon: <FaClock />,       label: 'Waiting for Driver',   value: stats?.waiting   ?? 0,                             sub: 'Pending',   color: '#f59e0b' },
                ].map((r, i) => (
                  <div key={r.label} style={{ 
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
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: r.color, opacity: 0.8 }} />
                    <span style={{ fontSize: 30, color: r.color, background: `${r.color}15`, width: 56, height: 56, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{r.icon}</span>
                    <div>
                      <div style={{ color: r.color, fontSize: 24, fontWeight: 800, lineHeight: 1 }}>{r.value}</div>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 13, marginTop: 4, whiteSpace: 'nowrap' }}>{r.label}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 }}>{r.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SETTINGS */}
          {activeTab === 'settings' && (
            <div>
              <h2 style={{ color: 'var(--text-primary)', fontSize: 22, fontWeight: 800, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                <FaCog /> Settings
              </h2>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 30, color: 'var(--text-secondary)' }}>
                <p style={{ fontSize: 16, marginBottom: 20, fontWeight: 600 }}>Preferences and Account Settings</p>
                <div style={{ padding: 20, background: '#f8fafc', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <p>Settings options are currently being prepared.</p>
                </div>
              </div>
            </div>
          )}
        </div>
        <footer style={{ textAlign: 'center', padding: 16, color: 'var(--text-secondary)', fontSize: 12, borderTop: '1px solid var(--border)', letterSpacing: 2 }}>© 2026 [ AJITH SIVAKUMAR ]</footer>
      </div>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        *{box-sizing:border-box}
        input::placeholder,textarea::placeholder{color:#334155}
        ::-webkit-scrollbar{width:6px;height:6px}
        ::-webkit-scrollbar-track{background:#f8fafc}
        ::-webkit-scrollbar-thumb{background:rgba(255,107,0,0.3);border-radius:3px}
        @keyframes spinSlow { from { transform: translateY(-50%) rotate(0deg); } to { transform: translateY(-50%) rotate(360deg); } }
        .spin-slow { animation: spinSlow 3s linear infinite; }
      `}</style>
    </div>
  );
}