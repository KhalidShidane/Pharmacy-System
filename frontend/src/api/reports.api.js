import { client } from './client';

export const reportsApi = {
  salesSummary: (params) => client.get('/reports/sales-summary', { params }).then((r) => r.data.data),
  profitLoss: (params) => client.get('/reports/profit-loss', { params }).then((r) => r.data.data),
  purchasesSummary: (params) => client.get('/reports/purchases-summary', { params }).then((r) => r.data.data),
  inventoryValuation: () => client.get('/reports/inventory-valuation').then((r) => r.data.data),
  bestSellers: (params) => client.get('/reports/best-sellers', { params }).then((r) => r.data.data),
  customerDebts: () => client.get('/reports/customer-debts').then((r) => r.data.data),
  supplierPayables: () => client.get('/reports/supplier-payables').then((r) => r.data.data),
  expenses: (params) => client.get('/reports/expenses', { params }).then((r) => r.data.data),
  paymentHistory: (params) => client.get('/reports/payment-history', { params }).then((r) => r.data.data),
  lowStock: () => client.get('/reports/low-stock').then((r) => r.data.data),
  expiring: () => client.get('/reports/expiring').then((r) => r.data.data),
};
