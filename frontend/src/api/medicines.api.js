import { client } from './client';

export const medicinesApi = {
  list: (params) => client.get('/medicines', { params }).then((r) => r.data),
  getById: (id) => client.get(`/medicines/${id}`).then((r) => r.data.data),
  create: (payload) => client.post('/medicines', payload).then((r) => r.data.data),
  update: (id, payload) => client.patch(`/medicines/${id}`, payload).then((r) => r.data.data),
  remove: (id) => client.delete(`/medicines/${id}`).then((r) => r.data.data),
  addBatch: (id, payload) => client.post(`/medicines/${id}/batches`, payload).then((r) => r.data.data),
};
