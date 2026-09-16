import { client } from './client';

export const purchasesApi = {
  create: (payload) => client.post('/purchases', payload).then((r) => r.data.data),
  list: (params) => client.get('/purchases', { params }).then((r) => r.data),
  getById: (id) => client.get(`/purchases/${id}`).then((r) => r.data.data),
};
