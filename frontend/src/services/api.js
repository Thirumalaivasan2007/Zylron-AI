import axios from 'axios';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';
const API_BASE_URL = backendUrl.endsWith('/api') ? backendUrl : `${backendUrl}/api`;

const api = axios.create({
    baseURL: API_BASE_URL,
});

// Add a request interceptor to include the JWT token
api.interceptors.request.use(
    (config) => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.token) {
            config.headers['Authorization'] = `Bearer ${user.token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export const authAPI = {
    loginUser: (credentials) => api.post('/auth/login', credentials),
    loginVerify: (email, deviceInfo) => api.post('/auth/login-verify', { email, deviceInfo }),
    registerUser: (userData) => api.post('/auth/register', userData),
    notifyLogin: (userData) => api.post('/auth/notify-login', userData),
    sendOTP: (email, type) => api.post('/auth/send-otp', { email, type }),
    verifyOTP: (email, otp) => api.post('/auth/verify-otp', { email, otp }),
    getDevices: () => api.get('/auth/devices'),
    revokeDevice: (id) => api.delete(`/auth/devices/${id}`)
};

export default api;
