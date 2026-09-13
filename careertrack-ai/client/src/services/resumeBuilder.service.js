import api from './api';

export const resumeBuilderService = {
  createDraft: () => api.post('/resumes/builder'),
  updateDraft: (id, payload) => api.put(`/resumes/builder/${id}`, payload),
  exportPdf: (id) => api.post(`/resumes/builder/${id}/export`),
  generateSummary: (id, targetRole) => api.post(`/resumes/builder/${id}/ai/summary`, { targetRole }),
  improveBullet: (id, text, context) => api.post(`/resumes/builder/${id}/ai/improve-bullet`, { text, context }),
  optimizeKeywords: (id, jobDescription) => api.post(`/resumes/builder/${id}/ai/optimize-keywords`, { jobDescription }),
};
