import { client } from './client';

export const customersApi = {
  list: (params) => client.get('/customers', { params }).then((r) => r.data),
  getById: (id) => client.get(`/customers/${id}`).then((r) => r.data.data),
  create: (payload) => client.post('/customers', payload).then((r) => r.data.data),
  update: (id, payload) => client.patch(`/customers/${id}`, payload).then((r) => r.data.data),
};
