import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ownerAPI, SOCKET_URL } from '../../utils/api';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import io from 'socket.io-client';
import Loader from '../../components/Loader';
import { FaHome, FaBox, FaTruckMoving, FaTruck, FaChartBar, FaBell, FaMap, FaCheckCircle, FaBalanceScale, FaExclamationTriangle, FaSyncAlt, FaRoute, FaClock, FaMapMarkerAlt, FaFlagCheckered, FaIdCard, FaFileAlt, FaCog } from 'react-icons/fa';
import ThemeToggle from '../../components/ThemeToggle';
import dashboardBg from '../../images/dashboard.png';
import fleetLogo from '../../images/fleetlink-logo.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const truckIcon = (color, size) => new L.DivIcon({
  html: `<div style="background:${color};border:3px solid #fff;border-radius:50%;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:${size * 0.6}px;box-shadow:0 2px 8px rgba(0,0,0,0.5);"><svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 640 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M624 352h-16V243.9c0-12.7-5.1-24.9-14.1-33.9L494 110.1c-9-9-21.2-14.1-33.9-14.1H416V48c0-26.5-21.5-48-48-48H48C21.5 0 0 21.5 0 48v320c0 26.5 21.5 48 48 48h16c0 53 43 96 96 96s96-43 96-96h128c0 53 43 96 96 96s96-43 96-96h48c8.8 0 16-7.2 16-16v-32c0-8.8-7.2-16-16-16zM160 464c-26.5 0-48-21.5-48-48s21.5-48 48-48 48 21.5 48 48-21.5 48-48 48zm320 0c-26.5 0-48-21.5-48-48s21.5-48 48-48 48 21.5 48 48-21.5 48-48 48zm80-208H416V144h44.1l99.9 99.9V256z"></path></svg></div>`,
  iconSize: [size, size], iconAnchor: [size / 2, size / 2], popupAnchor: [0, -size / 2], className: '',
});
const pickupIcon = new L.DivIcon({
  html: `<div style="background:#22c55e;border:3px solid #fff;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,0.4);"><svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 384 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67-9.535 13.774-29.93 13.773-39.464 0zM192 272c44.183 0 80-35.817 80-80s-35.817-80-80-80-80 35.817-80 80 35.817 80 80 80z"></path></svg></div>`,
  iconSize: [28, 28], iconAnchor: [14, 14], popupAnchor: [0, -16], className: '',
});
const dropIcon = new L.DivIcon({
  html: `<div style="background:#f59e0b;border:3px solid #fff;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,0.4);"><svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M0 32v448c0 17.7 14.3 32 32 32s32-14.3 32-32V320h224l32 64h128c17.7 0 32-14.3 32-32V32c0-17.7-14.3-32-32-32H256l-32 64H32C14.3 0 0 14.3 0 32z"></path></svg></div>`,
  iconSize: [28, 28], iconAnchor: [14, 14], popupAnchor: [0, -16], className: '',
});

// ✅ Helper to format duration (Handles both new String format and legacy Numeric format)
const formatDuration = (val) => {
  if (!val) return '---';
  if (typeof val === 'string') return val; // Already formatted as "1 hr 55 mins"
  
  // Fallback for legacy numeric minutes
  const h = Math.floor(val / 60);
  const m = val % 60;
  return h > 0 ? `${h} hr ${m} mins` : `${m} mins`;
};

const ROUTE_COLORS = ['var(--accent)', '#38bdf8', '#4ade80', '#f472b6', '#a78bfa', '#f59e0b', '#fb923c', '#34d399'];
const STAGE_COLORS = {
  'Waiting': { bg: '#2a2000', color: '#f59e0b', border: '#f59e0b' },
  'Approved': { bg: '#001a2a', color: '#38bdf8', border: '#38bdf8' },
  'Loading': { bg: '#1a1a00', color: '#facc15', border: '#facc15' },
  'In Transit': { bg: '#001a00', color: '#4ade80', border: '#4ade80' },
  'Unloading': { bg: '#1a000a', color: '#f472b6', border: '#f472b6' },
  'Completed': { bg: '#001a00', color: '#22c55e', border: '#22c55e' },
};
const VEHICLE_CAPACITY = { '6 Wheel': 11, '10 Wheel': 19, '12 Wheel': 25, '14 Wheel': 30, '16 Wheel': 35 };

const NAV_ITEMS = [
  { key: 'home', label: 'Home', icon: <FaHome /> },
  { key: 'map', label: 'Fleet Map', icon: <FaMap /> },
  { key: 'loads', label: 'Load Monitoring', icon: <FaBox /> },
  { key: 'drivers', label: 'Driver Management', icon: <FaTruckMoving /> },
  { key: 'fleet', label: 'Fleet Management', icon: <FaTruck /> },
  { key: 'reports', label: 'Reports', icon: <FaChartBar /> },
  { key: 'settings', label: 'Settings', icon: <FaCog /> },
];

function FitBounds({ positions }) {
  const map = useMap();
  const [hasFitted, setHasFitted] = useState(false);

  useEffect(() => { 
    if (positions.length > 0 && !hasFitted) { 
      map.fitBounds(positions, { padding: [50, 50] }); 
      setHasFitted(true);
    } 
  }, [positions, map, hasFitted]);
  return null;
}

// ✅ Real-Road Routing Component
function RoutingPolyline({ start, end, color, weight = 2, opacity = 1, onRouteFetched }) {
  const [path, setPath] = useState([start, end]); // Default to straight line
  const onRouteFetchedRef = React.useRef(onRouteFetched);

  // Keep ref updated without triggering re-fetch
  useEffect(() => { onRouteFetchedRef.current = onRouteFetched; });

  useEffect(() => {
    let active = true;
    const fetchRoute = async () => {
      try {
        // OSRM expects lon,lat format
        const response = await axios.get(`https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`);
        if (active && response.data?.routes?.[0]?.geometry?.coordinates) {
          // Transform [lon, lat] -> [lat, lon]
          const coords = response.data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
          setPath(coords);
          if (onRouteFetchedRef.current) onRouteFetchedRef.current(coords);
        }
      } catch (err) {
        console.warn('Routing API failed, falling back to straight line', err);
      }
    };
    fetchRoute();
    return () => { active = false; };
  }, [start, end]); // ✅ Only re-fetch when coords change, NOT when callback changes

  return <Polyline positions={path} color={color} weight={weight} opacity={opacity} />;
}

// ✅ Midpoint Helper for Routes
const getRouteMidpoint = (coords) => {
  if (!coords || coords.length === 0) return [0,0];
  return coords[Math.floor(coords.length / 2)];
};

const lbl = { color: 'var(--text-muted)', fontSize: 11, letterSpacing: 1, display: 'block', marginBottom: 6, textTransform: 'uppercase' };
const inp = { width: '100%', background: 'rgba(0,0,0,0.03)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', color: 'var(--text-primary)', fontSize: 14, outline: 'none', fontFamily: "'Rajdhani',sans-serif", boxSizing: 'border-box' };

export default function OwnerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [notifOpen, setNotifOpen] = useState(false);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [selectedLoad, setSelectedLoad] = useState(null);
  const [stats, setStats] = useState(null);
  const [loads, setLoads] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [fleet, setFleet] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newVehicle, setNewVehicle] = useState({ vehicleNo: '', wheelType: '10 Wheel', driver: '', status: 'Idle' });
  const [saving, setSaving] = useState(false);
  const [routePaths, setRoutePaths] = useState({}); // ✅ Cache for real road paths

  // ✅ Notification state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const name = user?.username || 'Owner';
  const company = user?.transportName || '';
  const fetchAll = useCallback(async () => {
    try {
      setLoading(true); setError('');
      const [sR, lR, dR, vR, nR] = await Promise.allSettled([
        ownerAPI.getStats(),
        ownerAPI.getLoads(),
        ownerAPI.getDrivers(),
        ownerAPI.getVehicles(),
        ownerAPI.getNotifications()
      ]);

      if (sR.status === 'fulfilled') setStats(sR.value.data.data);
      if (lR.status === 'fulfilled') setLoads(lR.value.data.data || []);
      if (dR.status === 'fulfilled') setDrivers(dR.value.data.data || []);
      if (vR.status === 'fulfilled') setFleet(vR.value.data.data || []);
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

  // ✅ Socket.io — join personal room and receive notifications
  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['polling', 'websocket'] });
    const userId = user?._id || user?.id;

    socket.on('connect', () => {
      console.log('✅ Owner socket connected:', socket.id);
      if (userId) {
        socket.emit('join', userId);
        console.log('🔌 Owner joined room:', userId);
      }
    });

    socket.on('notification', (data) => {
      console.log('🔔 Owner notification:', data);
      const newNotif = { ...data, isRead: false };
      setNotifications(prev => [newNotif, ...prev]);
      setUnreadCount(prev => prev + 1);
      // Refresh loads when driver updates stage or accepts load
      if (data.type === 'LOAD_ACCEPTED' || data.type === 'STAGE_UPDATE') {
        fetchAll();
      }
    });

    return () => socket.disconnect();
  }, [user, fetchAll]);

  const handleAddVehicle = async () => {
    if (!newVehicle.vehicleNo) return;
    try {
      setSaving(true);
      await ownerAPI.addVehicle({ vehicleNo: newVehicle.vehicleNo, wheelType: newVehicle.wheelType, capacity: VEHICLE_CAPACITY[newVehicle.wheelType], driverName: newVehicle.driver, status: newVehicle.status });
      setNewVehicle({ vehicleNo: '', wheelType: '10 Wheel', driver: '', status: 'Idle' });
      setShowAddVehicle(false); fetchAll();
    } catch (err) { alert(err.response?.data?.message || 'Failed to add vehicle'); }
    finally { setSaving(false); }
  };

  const handleDeleteVehicle = async (id) => {
    if (!window.confirm('Delete this vehicle?')) return;
    try { await ownerAPI.deleteVehicle(id); fetchAll(); }
    catch { alert('Failed to delete vehicle'); }
  };

  const totalCapacity = fleet.reduce((s, v) => s + (v.capacity || 0), 0);
  const activeLoads = loads.filter(l => l.stage !== 'Completed');
  
  // Prepare all active loads for display using stored coordinates
  const mapLoads = activeLoads.map(l => {
    const hasC = l.pickupCoords?.length === 2 && l.dropCoords?.length === 2;
    return { 
      ...l, 
      pickupCoord: l.pickupCoords, 
      dropCoord: l.dropCoords, 
      hasCoords: hasC
    };
  });
  
  const loadsOnMap = mapLoads.filter(l => l.hasCoords);
  const allPositions = loadsOnMap.flatMap(l => [l.pickupCoord, l.dropCoord]);

  if (loading) return <Loader />;

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
        border: 'none', 
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
        <div style={{ padding: '16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid rgba(var(--accent-rgb), 0.1)' }}>
          <img src={fleetLogo} alt="FleetLink" style={{ width: '80%', height: 'auto', objectFit: 'contain' }} />
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
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{item.icon}</span>
                {item.key === 'map' && activeLoads.length > 0 && (
                  <span style={{ 
                    position: 'absolute', 
                    top: -8, 
                    right: -12, 
                    background: 'var(--accent)', 
                    color: '#000', 
                    borderRadius: 10, 
                    padding: '1px 5px', 
                    fontSize: 9, 
                    fontWeight: 800,
                    boxShadow: '0 0 10px rgba(255,107,0,0.4)'
                  }}>
                    {activeLoads.length}
                  </span>
                )}
              </div>
              {/* Removed item.label for minimalist icon-only look */}
            </button>
          ))}
        </nav>
        {/* Removed toggle button per user request */}
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
          boxShadow: '0 1px 0 var(--border)',
          position: 'sticky', 
          top: 0, 
          zIndex: 1100, 
          overflow: 'visible',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src={fleetLogo} alt="FleetLink" style={{ height: 42, width: 'auto', objectFit: 'contain' }} />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 20, height: '100%', transform: 'translateY(-4px)' }}>
            {!isMobile && (
              <span style={{ color: 'var(--text-secondary)', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, display: 'flex', alignItems: 'center', height: 38 }}>
                Welcome, <span style={{ color: 'var(--text-primary)', fontWeight: 700, marginLeft: 6 }}>{name}</span>
              </span>
            )}

            {/* ✅ Bell with badge + dropdown */}
            <div style={{ position: 'relative' }}>
              <button onClick={async () => { 
                const newState = !notifOpen;
                setNotifOpen(newState);
                if (newState && unreadCount > 0) {
                  setUnreadCount(0);
                  setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                  try { await ownerAPI.readNotifications(); } catch (err) { console.error(err); }
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
                <div style={{ position: 'fixed', right: 16, top: 68, width: 'min(340px, calc(100vw - 80px))', background: 'var(--bg-card)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,107,0,0.25)', borderRadius: 16, zIndex: 9999, boxShadow: '0 10px 40px rgba(0,0,0,0.6)', overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(var(--accent-rgb), 0.15)', background: 'rgba(255,107,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--accent)', fontWeight: 800, fontSize: 13, letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 8 }}><FaBell /> NOTIFICATIONS</span>
                    {notifications.length > 0 && (
                      <button onClick={() => setNotifications([])} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>Clear all</button>
                    )}
                  </div>
                  <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                    {notifications.length === 0
                      ? <div style={{ padding: '32px 20px', color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>
                          <FaBell style={{ fontSize: 24, opacity: 0.2, marginBottom: 12 }} /><br />No new notifications
                        </div>
                      : notifications.map((n, i) => {
                          const isLoad = n.type === 'LOAD_ACCEPTED' || n.type === 'NEW_LOAD';
                          const isNew = !n.isRead;
                          return (
                            <div key={i} style={{ padding: '14px 20px', borderBottom: '1px solid #e2e8f0', background: isNew ? 'rgba(255,107,0,0.03)' : 'transparent', transition: 'all 0.2s', borderLeft: isNew ? '3px solid var(--accent)' : '3px solid transparent' }}>
                              <div style={{ display: 'flex', gap: 12 }}>
                                <div style={{ width: 32, height: 32, borderRadius: '50%', background: isLoad ? 'rgba(34,197,94,0.1)' : 'rgba(56,189,248,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  {isLoad ? <FaCheckCircle style={{ color: '#22c55e' }} /> : <FaSyncAlt style={{ color: '#38bdf8', fontSize: 12 }} />}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    {n.title}
                                  </div>
                                  <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 4, lineHeight: 1.5 }}>{n.message}</div>
                                  <div style={{ color: 'var(--text-muted)', fontSize: 10, marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>{new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    <span>{new Date(n.timestamp).toLocaleDateString([], { day: '2-digit', month: 'short', year: '2-digit' })}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                    }
                  </div>
                </div>
              )}
            </div>
            <ThemeToggle />
            <span style={{ background: 'rgba(var(--accent-rgb), 0.15)', border: '1px solid rgba(var(--accent-rgb), 0.3)', color: 'var(--accent)', borderRadius: 10, padding: '0 12px', height: 38, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <FaTruck /> OWNER
            </span>
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

        <div style={{ padding: isMobile ? '20px 16px' : 28, flex: 1, overflowX: isMobile ? 'hidden' : 'visible' }}>
          {error && <div style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid #dc2626', borderRadius: 8, padding: '12px 16px', color: '#dc2626', marginBottom: 20, fontSize: 14, display: 'flex', alignItems: 'center', gap: 10 }}><FaExclamationTriangle /> {error} <button onClick={fetchAll} style={{ marginLeft: 12, background: 'transparent', border: '1px solid #dc2626', color: '#dc2626', borderRadius: 6, padding: '2px 10px', cursor: 'pointer', fontSize: 12 }}>Retry</button></div>}



          {/* HOME (DASHBOARD) */}
          {activeTab === 'home' && (
            <div>
              <div style={{ marginBottom: 28 }}>
                <h2 style={{ color: 'var(--text-primary)', fontSize: 26, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>Hello, <span style={{ color: 'var(--accent)', textTransform: 'uppercase' }}>{name}</span></h2>
                <p style={{ color: 'var(--text-muted)', margin: '4px 0 0', fontSize: 14, letterSpacing: 2 }}>{company ? `${company} · ` : ''}OWNER DASHBOARD</p>
              </div>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(130px, 1fr))', 
                gap: 16, 
                marginBottom: 28 
              }}>
                {[
                  { icon: <FaBox />, label: 'TOTAL LOADS', value: stats?.totalLoads ?? 0, color: 'var(--accent)' },
                  { icon: <FaTruckMoving />, label: 'TOTAL DRIVERS', value: stats?.totalDrivers ?? 0, color: '#38bdf8' },
                  { icon: <FaMap />, label: 'ACTIVE LOADS', value: stats?.activeLoads ?? 0, color: '#4ade80', click: true },
                  { icon: <FaCheckCircle />, label: 'COMPLETED', value: stats?.completedLoads ?? 0, color: '#22c55e' },
                  { icon: <FaTruck />, label: 'TOTAL VEHICLES', value: stats?.totalVehicles ?? 0, color: '#a78bfa' },
                  { icon: <FaBalanceScale />, label: 'FLEET CAPACITY', value: `${totalCapacity}T`, color: '#f59e0b' },
                ].map((s, i) => (
                  <div key={s.label} onClick={() => s.click && setActiveTab('map')} style={{ 
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
                    cursor: s.click ? 'pointer' : 'default',
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

              {loadsOnMap.length > 0 && (
                <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(255,107,0,0.2)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <h3 style={{ color: 'var(--accent)', margin: 0, fontSize: 16, letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 8 }}><FaMap /> LIVE FLEET MAP <span style={{ background: 'var(--accent)', color: '#000', borderRadius: 10, padding: '1px 8px', fontSize: 12, marginLeft: 6 }}>{loadsOnMap.length} ON MAP</span></h3>
                    <button onClick={() => setActiveTab('map')} style={{ background: 'rgba(var(--accent-rgb), 0.1)', border: '1px solid rgba(var(--accent-rgb), 0.3)', color: 'var(--accent)', borderRadius: 8, padding: '6px 16px', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>Full Map →</button>
                  </div>
                  <div style={{ height: 280, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
                    <MapContainer center={[10.9, 78.1]} zoom={7} style={{ height: '100%', width: '100%' }} zoomControl={true} scrollWheelZoom={true}>
                      <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution="CartoDB" />
                      {allPositions.length > 0 && <FitBounds positions={allPositions} />}
                      {loadsOnMap.map((l, i) => (
                        <React.Fragment key={l._id}>
                          <Marker position={l.pickupCoord} icon={pickupIcon}><Popup><b><FaMapMarkerAlt style={{ color: '#22c55e', marginRight: 4 }} /> {l.pickup}</b><br /><small>{l.loadId}</small></Popup></Marker>
                          <Marker position={l.dropCoord} icon={dropIcon}><Popup><b><FaFlagCheckered style={{ color: '#f59e0b', marginRight: 4 }} /> {l.drop}</b><br /><small>{l.loadId}</small></Popup></Marker>
                          <RoutingPolyline 
                            start={l.pickupCoord} 
                            end={l.dropCoord} 
                            color={ROUTE_COLORS[i % ROUTE_COLORS.length]} 
                            weight={2} 
                            dashArray="8,6" 
                            opacity={0.8} 
                            onRouteFetched={(coords) => setRoutePaths(p => ({ ...p, [l._id]: coords }))}
                          />
                          <Marker 
                            position={getRouteMidpoint(routePaths[l._id]) || l.pickupCoord} 
                            icon={truckIcon(ROUTE_COLORS[i % ROUTE_COLORS.length], 34)}
                          >
                            <Popup><b><FaTruck style={{ color: 'var(--accent)', marginRight: 4 }} /> {l.loadId}</b><br />{l.material} · {l.weight}T<br />{l.pickup} → {l.drop}</Popup>
                          </Marker>
                        </React.Fragment>
                      ))}
                    </MapContainer>
                  </div>
                </div>
              )}

              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
                <h3 style={{ color: 'var(--accent)', margin: '0 0 16px', fontSize: 16, letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 8 }}><FaBox /> RECENT LOADS</h3>
                {loads.length === 0 ? <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No loads yet</div> : <LoadsTable loads={loads.slice(0, 5)} />}
              </div>
            </div>
          )}

          {/* FLEET MAP */}
          {activeTab === 'map' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <h2 style={{ color: 'var(--text-primary)', fontSize: 22, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}><FaMap /> Fleet Map</h2>
                  <p style={{ color: 'var(--text-muted)', margin: '4px 0 0', fontSize: 13 }}>Live truck routes across Tamil Nadu</p>
                </div>
                <button onClick={fetchAll} style={{ background: 'rgba(var(--accent-rgb), 0.1)', border: '1px solid rgba(var(--accent-rgb), 0.3)', color: 'var(--accent)', borderRadius: 8, padding: '7px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}><FaSyncAlt /> Refresh</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 320px', gap: 20, alignItems: 'start' }}>
                <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(255,107,0,0.2)', borderRadius: 14, overflow: 'hidden' }}>
                  {loadsOnMap.length === 0 ? (
                    <div style={{ height: isMobile ? 350 : 580, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)' }}>
                      <FaMap style={{ fontSize: 56, opacity: 0.2, marginBottom: 20 }} />
                      <p style={{ fontSize: 18, fontWeight: 700 }}>{activeLoads.length > 0 ? 'City Coords Not Found' : 'No Active Loads on Map'}</p>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{activeLoads.length > 0 ? 'Check city names in load details' : 'Create loads to see truck routes'}</p>
                    </div>
                  ) : (
                    <MapContainer center={[10.9, 78.1]} zoom={7} style={{ height: isMobile ? 350 : 580, width: '100%' }} scrollWheelZoom={true}>
                      <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution="CartoDB dark" />
                      {allPositions.length > 0 && <FitBounds positions={allPositions} />}
                      {loadsOnMap.map((l, i) => {
                        const c = ROUTE_COLORS[i % ROUTE_COLORS.length];
                        const isSel = selectedLoad?._id === l._id;
                        const midPt = [(l.pickupCoord[0] + l.dropCoord[0]) / 2, (l.pickupCoord[1] + l.dropCoord[1]) / 2];
                        return (
                          <React.Fragment key={l._id}>
                            <Marker position={l.pickupCoord} icon={pickupIcon} eventHandlers={{ click: () => setSelectedLoad(l) }}>
                              <Popup><div style={{ fontFamily: 'sans-serif', minWidth: 150 }}><b style={{ color: '#22c55e' }}><FaMapMarkerAlt style={{ marginRight: 4 }} /> PICKUP</b><br /><b style={{ fontSize: 15 }}>{l.pickup}</b><br /><small style={{ color: 'var(--text-muted)' }}>{l.loadId} · {l.material}</small></div></Popup>
                            </Marker>
                            <Marker position={l.dropCoord} icon={dropIcon} eventHandlers={{ click: () => setSelectedLoad(l) }}>
                              <Popup><div style={{ fontFamily: 'sans-serif', minWidth: 150 }}><b style={{ color: '#f59e0b' }}><FaFlagCheckered style={{ marginRight: 4 }} /> DROP</b><br /><b style={{ fontSize: 15 }}>{l.drop}</b><br /><small style={{ color: 'var(--text-muted)' }}>{l.loadId} · {l.material}</small></div></Popup>
                            </Marker>
                            <RoutingPolyline 
                              start={l.pickupCoord} 
                              end={l.dropCoord} 
                              color={c} 
                              weight={isSel ? 4 : 2.5} 
                              opacity={isSel ? 1 : 0.75} 
                              onRouteFetched={(coords) => setRoutePaths(p => ({ ...p, [l._id]: coords }))}
                            />
                            <Marker 
                              position={getRouteMidpoint(routePaths[l._id]) || midPt} 
                              icon={truckIcon(c, isSel ? 44 : 34)} 
                              eventHandlers={{ click: () => setSelectedLoad(isSel ? null : l) }}
                            >
                              <Popup>
                                <div style={{ fontFamily: 'sans-serif', minWidth: 200 }}>
                                  <b style={{ color: 'var(--accent)', fontSize: 14 }}><FaTruck style={{ marginRight: 4 }} /> {l.loadId}</b><br />
                                  <b style={{ fontSize: 15 }}>{l.material}</b><br />
                                  <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{l.pickup} → {l.drop}</span><br />
                                  <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Weight: {l.weight}T · {l.vehicleRequired}</span><br />
                                  {l.vehicleNumber && <span style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 700 }}>Vehicle: {l.vehicleNumber}</span>}<br />
                                  {l.distance > 0 && <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Distance: ~{l.distance} km · <FaClock style={{ fontSize: 10 }} /> ~{formatDuration(l.duration)}</span>}<br />
                                  <b style={{ color: 'var(--accent)' }}>Stage: {l.stage}</b>
                                </div>
                              </Popup>
                            </Marker>
                          </React.Fragment>
                        );
                      })}
                    </MapContainer>
                  )}
                  <div style={{ padding: '10px 16px', background: 'var(--bg-card)', borderTop: '1px solid #e2e8f0', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                    {[{ e: <FaMapMarkerAlt />, l: 'Pickup', c: '#22c55e' }, { e: <FaFlagCheckered />, l: 'Drop', c: '#f59e0b' }, { e: <FaTruck />, l: 'Truck (click for info)', c: 'var(--accent)' }, { e: '━', l: 'Route', c: '#8899aa' }].map(x => (
                      <span key={x.l} style={{ color: x.c, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>{x.e} {x.l}</span>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
                    <h4 style={{ color: 'var(--accent)', margin: '0 0 12px', fontSize: 13, letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 8 }}><FaChartBar /> MAP STATS</h4>
                    {[{ l: 'Active Loads', v: activeLoads.length, c: '#4ade80' }, { l: 'On Map', v: mapLoads.length, c: '#38bdf8' }, { l: 'Total Drivers', v: drivers.length, c: 'var(--accent)' }].map(s => (
                      <div key={s.l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{s.l}</span>
                        <span style={{ color: s.c, fontWeight: 800, fontSize: 16 }}>{s.v}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, maxHeight: 340, overflowY: 'auto' }}>
                    <h4 style={{ color: 'var(--accent)', margin: '0 0 12px', fontSize: 13, letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 8 }}><FaTruck /> ACTIVE LOADS</h4>
                    {mapLoads.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No active loads</p> : mapLoads.map((l, i) => {
                      const c = ROUTE_COLORS[i % ROUTE_COLORS.length];
                      const isSel = selectedLoad?._id === l._id;
                      return (
                        <div key={l._id} onClick={() => setSelectedLoad(isSel ? null : l)} style={{ padding: '10px 12px', marginBottom: 8, borderRadius: 10, cursor: 'pointer', border: `1px solid ${isSel ? c : 'rgba(255,255,255,0.06)'}`, background: isSel ? `${c}15` : 'transparent', transition: 'all 0.2s' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <span style={{ color: c, fontWeight: 800, fontSize: 13 }}>{l.loadId}</span>
                            <span style={{ background: STAGE_COLORS[l.stage]?.bg || '#1a2030', color: STAGE_COLORS[l.stage]?.color || '#8899aa', border: `1px solid ${STAGE_COLORS[l.stage]?.border || '#334155'}`, borderRadius: 20, padding: '1px 8px', fontSize: 10, fontWeight: 700 }}>{l.stage}</span>
                          </div>
                          <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 13, marginBottom: 3 }}>{l.material} · {l.weight}T</div>
                          <div style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: 13 }}>{l.pickup} → {l.drop}</div>
                          {l.distance > 0 && <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 3 }}><FaRoute style={{ fontSize: 10 }} /> ~{l.distance} km · <FaClock style={{ fontSize: 10 }} /> ~{formatDuration(l.duration)}</div>}
                        </div>
                      );
                    })}
                  </div>
                  {selectedLoad && (
                    <div style={{ background: 'rgba(255,107,0,0.06)', border: '2px solid rgba(var(--accent-rgb), 0.3)', borderRadius: 12, padding: 16 }}>
                      <h4 style={{ color: 'var(--accent)', margin: '0 0 12px', fontSize: 13, letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 8 }}><FaBox /> SELECTED LOAD</h4>
                      {[
                        { l: 'Load ID', v: selectedLoad.loadId },
                        { l: 'Material', v: selectedLoad.material },
                        { l: 'Weight', v: `${selectedLoad.weight} Ton` },
                        { l: 'Vehicle Type', v: selectedLoad.vehicleRequired },
                        { l: 'Vehicle No', v: selectedLoad.vehicleNumber || 'Not Assigned' },
                        { l: 'Pickup', v: selectedLoad.pickup },
                        { l: 'Drop', v: selectedLoad.drop },
                        { l: 'Distance', v: selectedLoad.distance ? `~${selectedLoad.distance} km` : 'N/A' },
                        { l: 'Est. Time', v: selectedLoad.duration || 'N/A' },
                        { l: 'Load Cost', v: `₹${parseFloat(selectedLoad.cost || 0).toLocaleString()}`, c: '#22c55e' },
                        { l: 'Commission', v: `₹${parseFloat(selectedLoad.commission || 0).toLocaleString()}`, c: '#94a3b8' },
                        { l: 'Final Amount', v: `₹${parseFloat(selectedLoad.finalAmount || 0).toLocaleString()}`, c: '#3b82f6' },
                        { l: 'Stage', v: selectedLoad.stage },
                      ].map(item => (
                        <div key={item.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #e2e8f0' }}>
                          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{item.l}</span>
                          <span style={{ color: item.c || '#0f172a', fontWeight: 700, fontSize: 12 }}>{item.v}</span>
                        </div>
                      ))}
                      <a href={`https://www.google.com/maps/dir/${encodeURIComponent(selectedLoad.pickup + ', Tamil Nadu')}/${encodeURIComponent(selectedLoad.drop + ', Tamil Nadu')}`} target="_blank" rel="noreferrer" style={{ display: 'block', textAlign: 'center', marginTop: 12, background: 'var(--accent)', color: '#000', borderRadius: 8, padding: '8px', fontWeight: 800, fontSize: 13, textDecoration: 'none' }}><FaMap style={{ marginRight: 8 }} /> Open in Google Maps</a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* LOAD MONITORING */}
          {activeTab === 'loads' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ color: 'var(--text-primary)', fontSize: 22, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}><FaBox /> Load Monitoring</h2>
                <button onClick={fetchAll} style={{ background: 'rgba(var(--accent-rgb), 0.1)', border: '1px solid rgba(var(--accent-rgb), 0.3)', color: 'var(--accent)', borderRadius: 8, padding: '7px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}><FaSyncAlt /> Refresh</button>
              </div>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
                {loads.length === 0 ? <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}><FaBox style={{ fontSize: 40, opacity: 0.3 }} /><p style={{ marginTop: 12 }}>No loads found</p></div> : <LoadsTable loads={loads} />}
              </div>
            </div>
          )}

          {/* DRIVER MANAGEMENT */}
          {activeTab === 'drivers' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ color: 'var(--text-primary)', fontSize: 22, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}><FaTruckMoving /> Driver Management</h2>
                <button onClick={fetchAll} style={{ background: 'rgba(var(--accent-rgb), 0.1)', border: '1px solid rgba(var(--accent-rgb), 0.3)', color: 'var(--accent)', borderRadius: 8, padding: '7px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}><FaSyncAlt /> Refresh</button>
              </div>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
                {drivers.length === 0 ? <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}><FaTruckMoving style={{ fontSize: 40, opacity: 0.3 }} /><p style={{ marginTop: 12 }}>No drivers found</p></div> : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead><tr style={{ borderBottom: '1px solid #e2e8f0' }}>{['Driver', 'Email', 'Mobile', 'Transport', 'Licence', 'Aadhaar', 'Status'].map(h => <th key={h} style={{ padding: '10px 14px', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: 1, textAlign: 'left', fontSize: 11 }}>{h}</th>)}</tr></thead>
                      <tbody>{drivers.map(d => (
                        <tr key={d._id} style={{ borderBottom: '1px solid #e2e8f0' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,107,0,0.04)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <td style={{ padding: '12px 14px', color: 'var(--text-primary)', fontWeight: 700 }}><FaTruckMoving style={{ color: 'var(--accent)', marginRight: 8 }} />{d.username}</td>
                          <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>{d.email}</td>
                          <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>{d.mobile}</td>
                          <td style={{ padding: '12px 14px', color: 'var(--accent)' }}>{d.transportName}</td>
                          <td style={{ padding: '12px 14px' }}>
                            <a 
                              href={`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/driver/document/${d._id}/drivingLicense`} 
                              target="_blank" 
                              rel="noreferrer"
                              style={{ color: 'var(--accent)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 700 }}
                            >
                              <FaIdCard style={{ fontSize: 14 }} /> View
                            </a>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <a 
                              href={`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/driver/document/${d._id}/aadhaar`} 
                              target="_blank" 
                              rel="noreferrer"
                              style={{ color: 'var(--accent)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 700 }}
                            >
                              <FaFileAlt style={{ fontSize: 14 }} /> View
                            </a>
                          </td>
                          <td style={{ padding: '12px 14px' }}><span style={{ background: d.status === 'APPROVED' ? 'rgba(34,197,94,0.1)' : d.status === 'PENDING' ? 'rgba(245,158,11,0.1)' : 'rgba(220,38,38,0.1)', color: d.status === 'APPROVED' ? '#22c55e' : d.status === 'PENDING' ? '#f59e0b' : '#dc2626', border: `1px solid ${d.status === 'APPROVED' ? '#22c55e' : d.status === 'PENDING' ? '#f59e0b' : '#dc2626'}`, borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>{d.status}</span></td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* FLEET MANAGEMENT */}
          {activeTab === 'fleet' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ color: 'var(--text-primary)', fontSize: 22, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}><FaTruck /> Fleet Management</h2>
                <button onClick={() => setShowAddVehicle(p => !p)} style={{ background: 'var(--accent)', border: 'none', color: '#000', borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontWeight: 800, fontSize: 14 }}>+ Add Vehicle</button>
              </div>
              {showAddVehicle && (
                <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(var(--accent-rgb), 0.3)', borderRadius: 12, padding: 24, marginBottom: 20 }}>
                  <h3 style={{ color: 'var(--accent)', margin: '0 0 16px', fontSize: 16 }}>Add New Vehicle</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16 }}>
                    <div>
                      <label style={lbl}>Vehicle Number</label>
                      <input 
                        value={newVehicle.vehicleNo} 
                        onChange={e => {
                          let val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                          let formatted = '';
                          if (val.length > 0) formatted += val.substring(0, 2);
                          if (val.length > 2) formatted += '-' + val.substring(2, 4);
                          if (val.length > 4) formatted += '-' + val.substring(4, 10);
                          setNewVehicle(p => ({ ...p, vehicleNo: formatted }));
                        }} 
                        placeholder="TN-52-6598" 
                        style={{ ...inp, textTransform: 'uppercase' }} 
                      />
                    </div>
                    <div><label style={lbl}>Assign Driver (Optional)</label>
                      <select value={newVehicle.driver} onChange={e => setNewVehicle(p => ({ ...p, driver: e.target.value }))} style={{ ...inp, background: '#f1f5f9' }}>
                        <option value="">-- Not Assigned --</option>
                        {drivers.filter(d => d.status === 'APPROVED').map(d => (
                          <option key={d._id} value={d.username}>{d.username} — {d.mobile}</option>
                        ))}
                      </select>
                    </div>
                    <div><label style={lbl}>Wheel Type</label><select value={newVehicle.wheelType} onChange={e => setNewVehicle(p => ({ ...p, wheelType: e.target.value }))} style={{ ...inp, background: '#f1f5f9' }}>{Object.keys(VEHICLE_CAPACITY).map(w => <option key={w} value={w}>{w}</option>)}</select></div>
                    <div><label style={lbl}>Capacity (Auto)</label><div style={{ background: 'rgba(255,107,0,0.08)', border: '1px solid rgba(255,107,0,0.2)', borderRadius: 8, padding: '10px 14px', color: 'var(--accent)', fontWeight: 700 }}>{VEHICLE_CAPACITY[newVehicle.wheelType]} Ton</div></div>
                    <div><label style={lbl}>Status</label><select value={newVehicle.status} onChange={e => setNewVehicle(p => ({ ...p, status: e.target.value }))} style={{ ...inp, background: '#f1f5f9' }}>{['Active', 'Idle', 'Maintenance'].map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                  </div>
                  <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
                    <button onClick={handleAddVehicle} disabled={saving} style={{ background: saving ? '#556677' : 'var(--accent)', border: 'none', color: '#000', borderRadius: 8, padding: '10px 28px', cursor: 'pointer', fontWeight: 800, fontSize: 14 }}>{saving ? 'Saving...' : 'SAVE VEHICLE'}</button>
                    <button onClick={() => setShowAddVehicle(false)} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontSize: 14 }}>Cancel</button>
                  </div>
                </div>
              )}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
                {fleet.length === 0 ? <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}><FaTruck style={{ fontSize: 40, opacity: 0.3 }} /><p style={{ marginTop: 12 }}>No vehicles added yet</p><button onClick={() => setShowAddVehicle(true)} style={{ marginTop: 12, background: 'var(--accent)', border: 'none', color: '#000', borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontWeight: 800 }}>+ Add First Vehicle</button></div> : (
                  <>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead><tr style={{ borderBottom: '1px solid #e2e8f0' }}>{['Vehicle No', 'Wheel Type', 'Capacity', 'Driver', 'Status', 'Action'].map(h => <th key={h} style={{ padding: '10px 14px', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: 1, textAlign: 'left', fontSize: 11 }}>{h}</th>)}</tr></thead>
                        <tbody>{fleet.map(v => (
                          <tr key={v._id} style={{ borderBottom: '1px solid #e2e8f0' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,107,0,0.04)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <td style={{ padding: '12px 14px', color: 'var(--accent)', fontWeight: 700 }}>{v.vehicleNo}</td>
                            <td style={{ padding: '12px 14px', color: 'var(--text-primary)' }}>{v.wheelType}</td>
                            <td style={{ padding: '12px 14px', color: '#a78bfa', fontWeight: 700 }}>{v.capacity} Ton</td>
                            <td style={{ padding: '12px 14px', color: v.driverName ? '#cdd6e0' : '#556677' }}>{v.driverName || 'Not Assigned'}</td>
                            <td style={{ padding: '12px 14px' }}><span style={{ background: v.status === 'Active' ? 'rgba(34,197,94,0.1)' : 'rgba(100,116,139,0.1)', color: v.status === 'Active' ? '#22c55e' : '#64748b', border: `1px solid ${v.status === 'Active' ? '#22c55e' : '#64748b'}`, borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>{v.status}</span></td>
                            <td style={{ padding: '12px 14px' }}><button onClick={() => handleDeleteVehicle(v._id)} style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', color: '#dc2626', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 11 }}>Delete</button></td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                    <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 8, color: '#a78bfa', fontWeight: 700 }}><FaTruck style={{ marginRight: 8 }} /> Total Fleet Capacity: <span style={{ fontSize: 18 }}>{totalCapacity} Ton</span></div>
                  </>
                )}
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
                  { icon: <FaBox />, label: 'Total Loads', value: stats?.totalLoads ?? 0, sub: 'All Time', color: 'var(--accent)' },
                  { icon: <FaCheckCircle />, label: 'Completed Deliveries', value: stats?.completedLoads ?? 0, sub: 'All Time', color: '#22c55e' },
                  { icon: <FaMap />, label: 'Active Loads', value: stats?.activeLoads ?? 0, sub: 'Right Now', color: '#38bdf8' },
                  { icon: <FaTruckMoving />, label: 'Total Drivers', value: stats?.totalDrivers ?? 0, sub: 'Registered', color: '#a78bfa' },
                  { icon: <FaTruck />, label: 'Total Vehicles', value: stats?.totalVehicles ?? 0, sub: 'In Fleet', color: '#f59e0b' },
                  { icon: <FaBalanceScale />, label: 'Fleet Capacity', value: `${totalCapacity}T`, sub: 'Total Tons', color: '#4ade80' },
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
        ::-webkit-scrollbar-track{background:#f8fafc}
        ::-webkit-scrollbar-thumb{background:rgba(255,107,0,0.3);border-radius:3px}
        .leaflet-container{font-family:'Rajdhani',sans-serif;}
        .leaflet-popup-content-wrapper{background:var(--bg-card)!important;border:1px solid rgba(var(--accent-rgb),0.3)!important;border-radius:10px!important;color:var(--text-primary)!important;}
        .leaflet-popup-tip{background:var(--bg-card)!important;}
        .leaflet-popup-close-button{color:var(--accent)!important;}
        .leaflet-control-zoom a{background:var(--bg-card)!important;color:var(--accent)!important;border-color:rgba(var(--accent-rgb),0.3)!important;}
      `}</style>
    </div>
  );
}

function LoadsTable({ loads }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>{['Load ID', 'Material', 'Cost', 'Comm.', 'Final', 'Pickup', 'Drop', 'Weight', 'Vehicle', 'Stage'].map(h => <th key={h} style={{ padding: '8px 12px', color: '#64748b', fontWeight: 700, letterSpacing: 1, textAlign: 'left', fontSize: 11 }}>{h}</th>)}</tr></thead>
        <tbody>{loads.map(l => {
          const sc = STAGE_COLORS[l.stage] || STAGE_COLORS['Waiting'];
          return (
            <tr key={l._id} style={{ borderBottom: '1px solid var(--border)' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,107,0,0.04)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <td style={{ padding: '10px 12px', color: '#ff6b00', fontWeight: 700 }}>{l.loadId}</td>
              <td style={{ padding: '10px 12px', color: 'var(--text-primary)', fontWeight: 600 }}>{l.material}</td>
              <td style={{ padding: '10px 12px', color: '#4ade80', fontWeight: 700 }}>₹{l.cost ? l.cost.toLocaleString() : 'N/A'}</td>
              <td style={{ padding: '10px 12px', color: '#94a3b8' }}>₹{l.commission ? l.commission.toLocaleString() : '0'}</td>
              <td style={{ padding: '10px 12px', color: '#3b82f6', fontWeight: 700 }}>₹{l.finalAmount ? l.finalAmount.toLocaleString() : 'N/A'}</td>
              <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{l.pickup}</td>
              <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{l.drop}</td>
              <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{l.weight}T</td>
              <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{l.vehicleRequired}</td>
              <td style={{ padding: '10px 12px' }}><span style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>{l.stage}</span></td>
            </tr>
          );
        })}</tbody>
      </table>
    </div>
  );
}