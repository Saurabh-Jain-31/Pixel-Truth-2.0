import api from './axios';

// All admin routes now live under /api/admin/
export const getDashboardStats = () => api.get('/admin/stats');
export const getAllUsers       = () => api.get('/admin/users');
export const getAllUploads     = () => api.get('/admin/uploads');
export const getViolations     = () => api.get('/admin/violations');
export const getLogs           = () => api.get('/admin/logs');
export const deleteUser        = (id)       => api.delete(`/admin/users/${id}`);
export const updateUserRole    = (id, role) => api.patch(`/admin/users/${id}/role`, { role });
