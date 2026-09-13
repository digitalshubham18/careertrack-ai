import api from './api';

export const resumeService = {
  list: () => api.get('/resumes'),
  get: (id) => api.get(`/resumes/${id}`),
  upload: (file, onProgress) => {
    const formData = new FormData();
    formData.append('resume', file);
    return api.post('/resumes', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress,
    });
  },
  remove: (id) => api.delete(`/resumes/${id}`),
  setPrimary: (id) => api.put(`/resumes/${id}/primary`),
};
