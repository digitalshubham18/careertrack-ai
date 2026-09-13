import api from './api';

export const authService = {
  register: (payload) => api.post('/auth/register', payload),
  verifyEmail: (email, otp) => api.post('/auth/verify-email', { email, otp }),
  resendVerification: (email) => api.post('/auth/resend-verification', { email }),
  login: (payload) => api.post('/auth/login', payload),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (payload) => api.post('/auth/reset-password', payload),
  changePassword: (payload) => api.post('/auth/change-password', payload),
};
