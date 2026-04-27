import api from './axios';

// Upload file for analysis
export const uploadContent = (formData, onProgress) =>
  api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress) onProgress(Math.round((e.loaded * 100) / e.total));
    },
  });

// Get analysis result for a specific upload
export const getResult = (id) => api.get(`/results/${id}`);

// Get upload history for current user
export const getHistory = () => api.get('/history');

// Get a single history item
export const getHistoryItem = (id) => api.get(`/history/${id}`);
