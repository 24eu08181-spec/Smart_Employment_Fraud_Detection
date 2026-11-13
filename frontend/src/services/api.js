import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 120000,
  withCredentials: true,
});

export const login = (credentials) => api.post('/auth/login', credentials);
export const signup = (details) => api.post('/auth/signup', details);
export const getCurrentUser = () => api.get('/auth/me');
export const updateProfile = (details) => api.put('/auth/profile', details);
export const logout = () => api.post('/auth/logout');
export const getHealth = () => api.get('/health');
export const predictJob = (payload) => api.post('/predict', payload);
export const getPredictions = (params = {}) => api.get('/predictions', { params });
export const getPredictionById = (id) => api.get(`/predictions/${id}`);
export const deletePrediction = (id) => api.delete(`/predictions/${id}`);
export const getDashboardStats = () => api.get('/dashboard/stats');
export const getModelInfo = () => api.get('/model-info');
export const getTrainingHistory = () => api.get('/training-history');
export const trainModel = () => api.post('/train-model');

export default api;
