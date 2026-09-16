import { client } from './client';

export const inventoryApi = {
  summary: (params) => client.get('/inventory/summary', { params }).then((r) => r.data),
  lowStock: () => client.get('/inventory/low-stock').then((r) => r.data.data),
  expiring: (params) => client.get('/inventory/expiring', { params }).then((r) => r.data.data),
  transactions: (params) => client.get('/inventory/transactions', { params }).then((r) => r.data),
};
