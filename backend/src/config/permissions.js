// Central catalog of permission keys and the default matrix granted to each
// built-in role. Role documents in the DB are seeded from this matrix, and
// the JWT embeds a user's resolved permissions so `authorize()` middleware
// can enforce access without a DB round-trip per request.

const PERMISSIONS = {
  MEDICINE_VIEW: 'medicine.view',
  MEDICINE_MANAGE: 'medicine.manage',
  BATCH_VIEW: 'batch.view',
  BATCH_MANAGE: 'batch.manage',
  INVENTORY_VIEW: 'inventory.view',
  INVENTORY_ADJUST: 'inventory.adjust',
  CUSTOMER_VIEW: 'customer.view',
  CUSTOMER_MANAGE: 'customer.manage',
  SALE_CREATE: 'sale.create',
  SALE_VIEW: 'sale.view',
  DASHBOARD_VIEW: 'dashboard.view',
  USER_MANAGE: 'user.manage',
  SETTINGS_MANAGE: 'settings.manage',
  SUPPLIER_VIEW: 'supplier.view',
  SUPPLIER_MANAGE: 'supplier.manage',
  PURCHASE_VIEW: 'purchase.view',
  PURCHASE_MANAGE: 'purchase.manage',
  EXPENSE_VIEW: 'expense.view',
  EXPENSE_MANAGE: 'expense.manage',
  REPORTS_VIEW: 'reports.view',
  // Self-service "edit my own profile" — restricted per business rule to
  // Admin and Cashier accounts only (Pharmacist / Inventory Manager
  // accounts are managed by an admin instead).
  PROFILE_MANAGE: 'profile.manage',
};

const ROLE_PERMISSIONS = {
  admin: Object.values(PERMISSIONS),
  pharmacist: [
    PERMISSIONS.MEDICINE_VIEW,
    PERMISSIONS.MEDICINE_MANAGE,
    PERMISSIONS.BATCH_VIEW,
    PERMISSIONS.BATCH_MANAGE,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_ADJUST,
    PERMISSIONS.CUSTOMER_VIEW,
    PERMISSIONS.CUSTOMER_MANAGE,
    PERMISSIONS.SALE_CREATE,
    PERMISSIONS.SALE_VIEW,
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.SUPPLIER_VIEW,
    PERMISSIONS.PURCHASE_VIEW,
    PERMISSIONS.REPORTS_VIEW,
  ],
  cashier: [
    PERMISSIONS.MEDICINE_VIEW,
    PERMISSIONS.BATCH_VIEW,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.CUSTOMER_VIEW,
    PERMISSIONS.CUSTOMER_MANAGE,
    PERMISSIONS.SALE_CREATE,
    PERMISSIONS.SALE_VIEW,
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.PROFILE_MANAGE,
  ],
  inventory_manager: [
    PERMISSIONS.MEDICINE_VIEW,
    PERMISSIONS.MEDICINE_MANAGE,
    PERMISSIONS.BATCH_VIEW,
    PERMISSIONS.BATCH_MANAGE,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_ADJUST,
    PERMISSIONS.SALE_VIEW,
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.SUPPLIER_VIEW,
    PERMISSIONS.SUPPLIER_MANAGE,
    PERMISSIONS.PURCHASE_VIEW,
    PERMISSIONS.PURCHASE_MANAGE,
    PERMISSIONS.REPORTS_VIEW,
  ],
};

// admin gets PROFILE_MANAGE via Object.values(PERMISSIONS) above; cashier
// gets it explicitly. Pharmacist / inventory_manager intentionally excluded.

const ROLES = Object.keys(ROLE_PERMISSIONS);

module.exports = { PERMISSIONS, ROLE_PERMISSIONS, ROLES };
