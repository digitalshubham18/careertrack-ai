import api from './api';

export const adminService = {
  listUsers: (params) => api.get('/admin/users', { params }),
  toggleUserActive: (id) => api.put(`/admin/users/${id}/toggle-active`),
  analytics: () => api.get('/admin/analytics'),
};
