import api from './api';

export const careerScoreService = {
  get: () => api.get('/career-score'),
};
