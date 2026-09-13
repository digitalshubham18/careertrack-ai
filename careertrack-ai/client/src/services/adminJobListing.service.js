import api from './api';

export const adminJobListingService = {
  list: (params) => api.get('/admin/job-listings', { params }),
  analytics: () => api.get('/admin/job-listings/analytics'),
  create: (payload) => api.post('/admin/job-listings', payload),
  update: (id, payload) => api.patch(`/admin/job-listings/${id}`, payload),
  publish: (id) => api.patch(`/admin/job-listings/${id}/publish`),
  close: (id) => api.patch(`/admin/job-listings/${id}/close`),
  remove: (id) => api.delete(`/admin/job-listings/${id}`),
};
