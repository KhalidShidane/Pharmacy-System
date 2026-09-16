import { client } from './client';

export const categoriesApi = {
  list: () => client.get('/categories').then((r) => r.data.data),
  create: (payload) => client.post('/categories', payload).then((r) => r.data.data),
};

export const manufacturersApi = {
  list: () => client.get('/manufacturers').then((r) => r.data.data),
  create: (payload) => client.post('/manufacturers', payload).then((r) => r.data.data),
};

export const notificationsApi = {
  alerts: () => client.get('/notifications/alerts').then((r) => r.data.data),
};

export const settingsApi = {
  get: () => client.get('/settings').then((r) => r.data.data),
  update: (payload) => client.patch('/settings', payload).then((r) => r.data.data),
};

export const usersApi = {
  list: () => client.get('/users').then((r) => r.data.data),
  create: (payload) => client.post('/users', payload).then((r) => r.data.data),
  update: (id, payload) => client.patch(`/users/${id}`, payload).then((r) => r.data.data),
  setActive: (id, isActive) => client.patch(`/users/${id}/status`, { isActive }).then((r) => r.data.data),
  remove: (id) => client.delete(`/users/${id}`).then((r) => r.data.data),
};
