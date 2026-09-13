import api from './api';

export const dsaService = {
  getSummary: () => api.get('/dsa/summary'),
  updateGoal: (dailyGoal) => api.put('/dsa/goal', { dailyGoal }),
  logEntry: (payload) => api.post('/dsa/entries', payload),
  listEntries: (params) => api.get('/dsa/entries', { params }),
  deleteEntry: (id) => api.delete(`/dsa/entries/${id}`),
};
