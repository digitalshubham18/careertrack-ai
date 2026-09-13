import api from './api';

export const userService = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (payload) => api.put('/users/profile', payload),
  updateNotificationPreferences: (payload) => api.put('/users/notification-preferences', payload),
  uploadProfilePicture: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/users/profile-picture', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  removeProfilePicture: () => api.delete('/users/profile-picture'),
  requestEmailChange: (payload) => api.post('/users/change-email/request', payload),
  verifyEmailChange: (otp) => api.post('/users/change-email/verify', { otp }),
};
