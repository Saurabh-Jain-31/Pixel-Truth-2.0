import api from './axios';

export const uploadContent = (formData, onProgress) =>
  api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress) onProgress(Math.round((e.loaded * 100) / e.total));
    },
  });

export const getResult = (id) => api.get(`/results/${id}`);
export const getHistory = () => api.get('/history');
export const getHistoryItem = (id) => api.get(`/history/${id}`);
export const requestTakedown = (id, note, targetUrl) => api.post(`/history/${id}/takedown`, { note, targetUrl });
export const getEvidencePackage = (id) => api.get(`/history/${id}/evidence`);
export const verifyChain = () => api.get('/evidence/verify');
