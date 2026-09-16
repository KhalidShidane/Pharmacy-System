import { client } from './client';

export const authApi = {
  login: (email, password) => client.post('/auth/login', { email, password }).then((r) => r.data.data),
  logout: () => client.post('/auth/logout').then((r) => r.data.data),
  me: () => client.get('/auth/me').then((r) => r.data.data),
  updateProfile: (payload) => client.patch('/auth/me', payload).then((r) => r.data.data),
  changePassword: (payload) => client.post('/auth/change-password', payload).then((r) => r.data.data),
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return client.post('/auth/me/avatar', formData).then((r) => r.data.data);
  },
};
