import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
export const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

// ── Axios instance ──────────────────────────────────
const api = axios.create({ baseURL: BASE_URL });

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ✅ FIXED: Only redirect on 401/403 for PROTECTED routes. 
// DON'T redirect if the error happens during login or registration!
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRequest = error.config?.url?.includes('/login') || error.config?.url?.includes('/register') || error.config?.url?.includes('/send-otp');
    
    if ((error.response?.status === 401 || error.response?.status === 403) && !isAuthRequest) {
      // Token expired or invalid on a protected route — clear and redirect
      localStorage.removeItem('token');
      localStorage.removeItem('lms_user');
      window.location.href = '/roles';
    }
    return Promise.reject(error);
  }
);

// ── AUTH endpoints ──────────────────────────────────
export const ownerSendOTP  = (data) => api.post('/owner/send-otp', data);
export const ownerRegister = (data) => api.post('/owner/register', data);
export const ownerLogin    = (data) => api.post('/owner/login', data);

export const loaderSendOTP  = (data) => api.post('/loader/send-otp', data);
export const loaderRegister = (data) => api.post('/loader/register', data);
export const loaderLogin    = (data) => api.post('/loader/login', data);

export const driverRegister = (data) => api.post('/driver/register', data);
export const driverLogin    = (data) => api.post('/driver/login', data);

// ── FORGOT / RESET PASSWORD ──────────────────────────
export const forgotPassword = (role, data) => api.post(`/${role}/forgot-password`, data);
export const resetPassword  = (role, token, data) => api.post(`/${role}/reset-password/${token}`, data);

export const getTransports  = ()     => api.get('/owner/transports');

// ── OWNER APIs ──────────────────────────────────────
export const ownerAPI = {
  getStats:    ()     => api.get('/owner/stats'),
  getDrivers:  ()     => api.get('/owner/drivers'),
  getVehicles: ()     => api.get('/owner/vehicles'),
  addVehicle:  (data) => api.post('/owner/vehicles', data),
  deleteVehicle: (id) => api.delete(`/owner/vehicles/${id}`),
  getLoads:    ()     => api.get('/owner/loads'),
  getNotifications: () => api.get('/owner/notifications'),
  readNotifications: () => api.patch('/owner/notifications/read'),
};

// ── LOADER APIs ─────────────────────────────────────
export const loaderAPI = {
  getStats:    ()     => api.get('/loader/stats'),
  getLoads:    ()     => api.get('/loader/loads'),
  createLoad:  (data) => api.post('/loader/loads', data),
  getNotifications: () => api.get('/loader/notifications'),
  readNotifications: () => api.patch('/loader/notifications/read'),
};

// ── DRIVER APIs ─────────────────────────────────────
export const driverAPI = {
  getStats:    ()           => api.get('/driver/stats'),
  getLoads:    ()           => api.get('/driver/loads'),
  getMyLoad:   ()           => api.get('/driver/my-load'),
  getHistory:  ()           => api.get('/driver/history'),
  acceptLoad:  (id)         => api.patch(`/driver/loads/${id}/accept`),
  updateStage: (id, stage)  => api.patch(`/driver/loads/${id}/stage`, { stage }),
  getProfile:  ()           => api.get('/driver/profile'),
  getNotifications: ()      => api.get('/driver/notifications'),
  readNotifications: ()     => api.patch('/driver/notifications/read'),
};

export default api;