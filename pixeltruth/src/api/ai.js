import api from './axios';

export const sendChatMessage = (message, history) =>
  api.post('/ai/chat', { message, history });
