import {
  LayoutDashboard,
  ScanLine,
  Receipt,
  Users,
  Pill,
  Boxes,
  Truck,
  Building2,
  Wallet,
  BarChart3,
  UserCog,
  Settings,
} from 'lucide-react';
import { PERMISSIONS } from '../../lib/permissions';

export const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [{ label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, permission: PERMISSIONS.DASHBOARD_VIEW }],
  },
  {
    label: 'Sales',
    items: [
      { label: 'POS', to: '/pos', icon: ScanLine, permission: PERMISSIONS.SALE_CREATE },
      { label: 'Sales History', to: '/sales', icon: Receipt, permission: PERMISSIONS.SALE_VIEW },
      { label: 'Customers', to: '/customers', icon: Users, permission: PERMISSIONS.CUSTOMER_VIEW },
    ],
  },
  {
    label: 'Inventory',
    items: [
      { label: 'Medicines', to: '/medicines', icon: Pill, permission: PERMISSIONS.MEDICINE_VIEW },
      { label: 'Inventory', to: '/inventory', icon: Boxes, permission: PERMISSIONS.INVENTORY_VIEW },
      { label: 'Purchases', to: '/purchases', icon: Truck, permission: PERMISSIONS.PURCHASE_VIEW },
      { label: 'Suppliers', to: '/suppliers', icon: Building2, permission: PERMISSIONS.SUPPLIER_VIEW },
    ],
  },
  {
    label: 'Finance',
    items: [
      { label: 'Expenses', to: '/expenses', icon: Wallet, permission: PERMISSIONS.EXPENSE_VIEW },
      { label: 'Reports', to: '/reports', icon: BarChart3, permission: PERMISSIONS.REPORTS_VIEW },
    ],
  },
  {
    label: 'Administration',
    items: [
      { label: 'Users', to: '/users', icon: UserCog, permission: PERMISSIONS.USER_MANAGE },
      { label: 'Settings', to: '/settings', icon: Settings, permission: PERMISSIONS.SETTINGS_MANAGE },
    ],
  },
];
