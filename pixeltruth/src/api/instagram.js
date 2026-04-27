import api from './axios';
export const analyzeInstagramUrl = (url) => api.post('/instagram/analyze', { url });
