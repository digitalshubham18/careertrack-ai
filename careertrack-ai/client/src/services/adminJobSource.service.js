import api from './api';

export const adminJobSourceService = {
  list: () => api.get('/admin/job-sources'),
  create: (payload) => api.post('/admin/job-sources', payload),
  update: (id, payload) => api.patch(`/admin/job-sources/${id}`, payload),
  remove: (id) => api.delete(`/admin/job-sources/${id}`),
  syncOne: (id) => api.post(`/admin/job-sources/${id}/sync`),
  syncAll: () => api.post('/admin/job-sources/sync-all'),
  logs: (limit) => api.get('/admin/job-sync-logs', { params: { limit } }),
};
