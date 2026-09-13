import api from './api';

export const atsService = {
  analyze: (payload) => api.post('/ats/analyze', payload),
  get: (id) => api.get(`/ats/${id}`),
  listForResume: (resumeId) => api.get(`/ats/resume/${resumeId}`),
};
