import { client } from './client';

export const salesApi = {
  create: (payload) => client.post('/sales', payload).then((r) => r.data.data),
  list: (params) => client.get('/sales', { params }).then((r) => r.data),
  getById: (id) => client.get(`/sales/${id}`).then((r) => r.data.data),
};
