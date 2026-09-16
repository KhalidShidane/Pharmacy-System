import { client } from './client';

export const suppliersApi = {
  list: (params) => client.get('/suppliers', { params }).then((r) => r.data),
  getById: (id) => client.get(`/suppliers/${id}`).then((r) => r.data.data),
  create: (payload) => client.post('/suppliers', payload).then((r) => r.data.data),
  update: (id, payload) => client.patch(`/suppliers/${id}`, payload).then((r) => r.data.data),
};
