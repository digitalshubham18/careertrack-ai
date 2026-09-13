import api from './api';

export const jobService = {
  list: (params) => api.get('/jobs', { params }),
  get: (id) => api.get(`/jobs/${id}`),
  create: (payload) => api.post('/jobs', payload),
  update: (id, payload) => api.put(`/jobs/${id}`, payload),
  updateStatus: (id, status) => api.patch(`/jobs/${id}/status`, { status }),
  updateNotes: (id, notes) => api.patch(`/jobs/${id}/notes`, { notes }),
  remove: (id) => api.delete(`/jobs/${id}`),
  generateInterview: (id) => api.post(`/jobs/${id}/interview`),
  getInterview: (id) => api.get(`/jobs/${id}/interview`),
  submitAnswer: (id, payload) => api.post(`/jobs/${id}/interview/answer`, payload),
};
