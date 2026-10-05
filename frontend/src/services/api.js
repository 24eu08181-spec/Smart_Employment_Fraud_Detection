import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 120000,
});

export const getHealth = () => api.get('/health');
export const predictJob = (payload) => api.post('/predict', payload);
export const getPredictions = (params = {}) => api.get('/predictions', { params });
export const getPredictionById = (id) => api.get(`/predictions/${id}`);
export const deletePrediction = (id) => api.delete(`/predictions/${id}`);
export const getDashboardStats = () => api.get('/dashboard/stats');
export const getModelInfo = () => api.get('/model-info');
export const trainModel = () => api.post('/train-model');

export default api;
