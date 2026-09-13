import api from './api';

export const jobListingService = {
  list: (params) => api.get('/job-board', { params }),
  getNew: () => api.get('/job-board/new'),
  getClosingSoon: () => api.get('/job-board/closing-soon'),
  getRemote: () => api.get('/job-board/remote'),
  getSde: () => api.get('/job-board/sde'),
  getRecommended: () => api.get('/job-board/recommended'),
  getSaved: () => api.get('/job-board/saved'),
  getApplied: () => api.get('/job-board/applied'),
  get: (id) => api.get(`/job-board/${id}`),
  save: (id) => api.post(`/job-board/${id}/save`),
  unsave: (id) => api.delete(`/job-board/${id}/save`),
  apply: (id) => api.post(`/job-board/${id}/apply`),
  match: (id, resumeId) => api.post(`/job-board/${id}/match`, resumeId ? { resumeId } : {}),
};
