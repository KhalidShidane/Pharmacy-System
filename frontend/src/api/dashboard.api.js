import { client } from './client';

export const dashboardApi = {
  summary: () => client.get('/dashboard/summary').then((r) => r.data.data),
  salesSeries: (days) => client.get('/dashboard/sales-series', { params: { days } }).then((r) => r.data.data),
  topMedicines: (params) => client.get('/dashboard/top-medicines', { params }).then((r) => r.data.data),
  salesByCategory: (params) => client.get('/dashboard/sales-by-category', { params }).then((r) => r.data.data),
  recentSales: (limit) => client.get('/dashboard/recent-sales', { params: { limit } }).then((r) => r.data.data),
};
