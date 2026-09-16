import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import { ProtectedRoute, RequirePermission } from './ProtectedRoute';
import NotFound from '../components/layout/NotFound';
import { PERMISSIONS } from '../lib/permissions';

import Login from '../features/auth/Login';

const Dashboard = lazy(() => import('../features/dashboard/Dashboard'));
const Pos = lazy(() => import('../features/pos/Pos'));
const SalesList = lazy(() => import('../features/sales/SalesList'));
const SaleDetail = lazy(() => import('../features/sales/SaleDetail'));
const Customers = lazy(() => import('../features/customers/Customers'));
const MedicinesList = lazy(() => import('../features/medicines/MedicinesList'));
const MedicineDetail = lazy(() => import('../features/medicines/MedicineDetail'));
const InventoryOverview = lazy(() => import('../features/inventory/InventoryOverview'));
const UsersList = lazy(() => import('../features/users/UsersList'));
const SettingsPage = lazy(() => import('../features/settings/SettingsPage'));
const Suppliers = lazy(() => import('../features/suppliers/Suppliers'));
const SupplierDetail = lazy(() => import('../features/suppliers/SupplierDetail'));
const PurchasesList = lazy(() => import('../features/purchases/PurchasesList'));
const NewPurchase = lazy(() => import('../features/purchases/NewPurchase'));
const PurchaseDetail = lazy(() => import('../features/purchases/PurchaseDetail'));
const Expenses = lazy(() => import('../features/expenses/Expenses'));
const Reports = lazy(() => import('../features/reports/Reports'));
const Profile = lazy(() => import('../features/profile/Profile'));

function PageFallback() {
  return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="size-6 animate-spin text-primary" />
    </div>
  );
}

function withSuspense(Component) {
  return (
    <Suspense fallback={<PageFallback />}>
      <Component />
    </Suspense>
  );
}

const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/', element: <Navigate to="/dashboard" replace /> },
          { path: '/dashboard', element: withSuspense(Dashboard) },
          { path: '/pos', element: withSuspense(Pos) },
          { path: '/sales', element: withSuspense(SalesList) },
          { path: '/sales/:id', element: withSuspense(SaleDetail) },
          { path: '/customers', element: withSuspense(Customers) },
          { path: '/medicines', element: withSuspense(MedicinesList) },
          { path: '/medicines/:id', element: withSuspense(MedicineDetail) },
          { path: '/inventory', element: withSuspense(InventoryOverview) },
          {
            path: '/suppliers',
            element: <RequirePermission permission={PERMISSIONS.SUPPLIER_VIEW}>{withSuspense(Suppliers)}</RequirePermission>,
          },
          {
            path: '/suppliers/:id',
            element: <RequirePermission permission={PERMISSIONS.SUPPLIER_VIEW}>{withSuspense(SupplierDetail)}</RequirePermission>,
          },
          {
            path: '/purchases',
            element: <RequirePermission permission={PERMISSIONS.PURCHASE_VIEW}>{withSuspense(PurchasesList)}</RequirePermission>,
          },
          {
            path: '/purchases/new',
            element: <RequirePermission permission={PERMISSIONS.PURCHASE_MANAGE}>{withSuspense(NewPurchase)}</RequirePermission>,
          },
          {
            path: '/purchases/:id',
            element: <RequirePermission permission={PERMISSIONS.PURCHASE_VIEW}>{withSuspense(PurchaseDetail)}</RequirePermission>,
          },
          {
            path: '/expenses',
            element: <RequirePermission permission={PERMISSIONS.EXPENSE_VIEW}>{withSuspense(Expenses)}</RequirePermission>,
          },
          {
            path: '/reports',
            element: <RequirePermission permission={PERMISSIONS.REPORTS_VIEW}>{withSuspense(Reports)}</RequirePermission>,
          },
          {
            path: '/users',
            element: <RequirePermission permission={PERMISSIONS.USER_MANAGE}>{withSuspense(UsersList)}</RequirePermission>,
          },
          {
            path: '/settings',
            element: (
              <RequirePermission permission={PERMISSIONS.SETTINGS_MANAGE}>{withSuspense(SettingsPage)}</RequirePermission>
            ),
          },
          {
            path: '/profile',
            element: <RequirePermission permission={PERMISSIONS.PROFILE_MANAGE}>{withSuspense(Profile)}</RequirePermission>,
          },
        ],
      },
    ],
  },
  { path: '*', element: <NotFound /> },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
