import api from './api';

export const applicationAssistantService = {
  generate: (applicationId, type) => api.post(`/jobs/${applicationId}/assistant`, { type }),
  list: (applicationId) => api.get(`/jobs/${applicationId}/assistant`),
};
