import api from './axios';

export const analyzeYouTubeUrl = (url) =>
  api.post('/youtube/analyze', { url });
