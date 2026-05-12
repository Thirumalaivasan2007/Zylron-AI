import axios from 'axios';

const API_BASE_URL = 'https://zylron-agent-ai.onrender.com/api';

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
    notifyLogin: (userData) => api.post('/auth/notify-login', userData),
    sendOTP: (email, type) => api.post('/auth/send-otp', { email, type }),
    verifyOTP: (email, otp) => api.post('/auth/verify-otp', { email, otp })
};

export default api;
