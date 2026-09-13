import api from './api';

export const companyService = {
  list: () => api.get('/companies'),
  create: (payload) => api.post('/companies', payload),
  update: (id, payload) => api.put(`/companies/${id}`, payload),
  remove: (id) => api.delete(`/companies/${id}`),
};
