import { client } from './client';

export const batchesApi = {
  update: (id, payload) => client.patch(`/batches/${id}`, payload).then((r) => r.data.data),
  adjust: (id, payload) => client.post(`/batches/${id}/adjust`, payload).then((r) => r.data.data),
};
