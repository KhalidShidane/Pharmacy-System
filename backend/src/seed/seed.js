/* eslint-disable no-console */
const connectDB = require('../config/db');
const mongoose = require('mongoose');
const { PERMISSIONS, ROLE_PERMISSIONS } = require('../config/permissions');

const Permission = require('../models/Permission');
const Role = require('../models/Role');
const User = require('../models/User');
const Category = require('../models/Category');
const Manufacturer = require('../models/Manufacturer');
const Medicine = require('../models/Medicine');
const Batch = require('../models/Batch');
const InventoryTransaction = require('../models/InventoryTransaction');
const Customer = require('../models/Customer');
const Setting = require('../models/Setting');
const Supplier = require('../models/Supplier');
const Purchase = require('../models/Purchase');
const PurchaseItem = require('../models/PurchaseItem');
const Expense = require('../models/Expense');
const Payment = require('../models/Payment');

const SEED_PASSWORD = 'Password@123';
const days = (n) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);

async function seedPermissionsAndRoles() {
  for (const key of Object.values(PERMISSIONS)) {
    const [module] = key.split('.');
    await Permission.findOneAndUpdate({ key }, { key, module, description: key }, { upsert: true });
  }

  const roles = {};
  for (const [roleName, permissions] of Object.entries(ROLE_PERMISSIONS)) {
    roles[roleName] = await Role.findOneAndUpdate(
      { name: roleName },
      { name: roleName, permissions, description: `${roleName.replace('_', ' ')} role` },
      { upsert: true, new: true }
    );
  }
  return roles;
}

async function seedUsers(roles) {
  const passwordHash = await User.hashPassword(SEED_PASSWORD);
  const users = [
    { name: 'Admin', email: 'admin@pharmacy.com', roleName: 'admin' },
    { name: 'Amina Pharmacist', email: 'pharmacist@pharmacy.com', roleName: 'pharmacist' },
    { name: 'Cyrus Cashier', email: 'cashier@pharmacy.com', roleName: 'cashier' },
    { name: 'Ivy Inventory', email: 'inventory@pharmacy.com', roleName: 'inventory_manager' },
  ];
  for (const u of users) {
    await User.findOneAndUpdate(
      { email: u.email },
      { name: u.name, email: u.email, passwordHash, role: roles[u.roleName]._id, roleName: u.roleName, isActive: true },
      { upsert: true }
    );
  }
}

async function seedCatalog() {
  const categoryNames = ['Pain Relief', 'Antibiotics', 'Vitamins & Supplements', 'Cold & Flu', 'Digestive Health'];
  const categories = {};
  for (const name of categoryNames) {
    categories[name] = await Category.findOneAndUpdate({ name }, { name }, { upsert: true, new: true });
  }

  const manufacturerNames = ['MediGen Labs', 'GlobalPharma', 'Pfizer', 'GSK'];
  const manufacturers = {};
  for (const name of manufacturerNames) {
    manufacturers[name] = await Manufacturer.findOneAndUpdate({ name }, { name }, { upsert: true, new: true });
  }

  return { categories, manufacturers };
}

async function upsertMedicine(data) {
  return Medicine.findOneAndUpdate({ name: data.name }, data, { upsert: true, new: true, setDefaultsOnInsert: true });
}

async function upsertBatch(medicine, data, adminUserId) {
  const existing = await Batch.findOne({ medicine: medicine._id, batchNumber: data.batchNumber });
  if (existing) return existing;

  const batch = await Batch.create({
    medicine: medicine._id,
    remainingQuantity: data.quantity,
    status: data.status || 'active',
    ...data,
  });

  await InventoryTransaction.create({
    medicine: medicine._id,
    batch: batch._id,
    type: 'purchase',
    quantity: data.quantity,
    previousQuantity: 0,
    newQuantity: data.quantity,
    user: adminUserId,
    referenceType: 'Batch',
    referenceId: batch._id,
    reason: `Seed data: initial stock for batch ${data.batchNumber}`,
  });

  return batch;
}

async function seedMedicinesAndBatches({ categories, manufacturers }, adminUserId) {
  const paracetamol = await upsertMedicine({
    name: 'Paracetamol 500mg',
    genericName: 'Paracetamol',
    brand: 'MediGen',
    category: categories['Pain Relief']._id,
    manufacturer: manufacturers['MediGen Labs']._id,
    dosageForm: 'tablet',
    strength: '500mg',
    unit: 'tablet',
    barcode: '6001000000017',
    purchasePrice: 0.05,
    sellingPrice: 0.15,
    minStockLevel: 100,
  });
  await upsertBatch(paracetamol, {
    batchNumber: 'PARA-2026-01',
    purchaseDate: days(-30),
    expiryDate: days(400),
    purchasePrice: 0.05,
    sellingPrice: 0.15,
    quantity: 2000,
  }, adminUserId);

  const amoxicillin = await upsertMedicine({
    name: 'Amoxicillin 250mg',
    genericName: 'Amoxicillin',
    brand: 'GlobalPharma',
    category: categories['Antibiotics']._id,
    manufacturer: manufacturers['GlobalPharma']._id,
    dosageForm: 'capsule',
    strength: '250mg',
    unit: 'capsule',
    barcode: '6001000000024',
    requiresPrescription: true,
    purchasePrice: 0.2,
    sellingPrice: 0.45,
    minStockLevel: 200,
  });
  // Deliberately low: below minStockLevel to demo the low-stock alert.
  await upsertBatch(amoxicillin, {
    batchNumber: 'AMOX-2026-03',
    purchaseDate: days(-10),
    expiryDate: days(300),
    purchasePrice: 0.2,
    sellingPrice: 0.45,
    quantity: 40,
  }, adminUserId);

  const vitaminC = await upsertMedicine({
    name: 'Vitamin C 1000mg',
    genericName: 'Ascorbic Acid',
    brand: 'GSK',
    category: categories['Vitamins & Supplements']._id,
    manufacturer: manufacturers['GSK']._id,
    dosageForm: 'tablet',
    strength: '1000mg',
    unit: 'tablet',
    barcode: '6001000000031',
    purchasePrice: 0.1,
    sellingPrice: 0.3,
    minStockLevel: 50,
  });
  // Expiring within the default 60-day window to demo the expiring-soon alert.
  await upsertBatch(vitaminC, {
    batchNumber: 'VITC-2025-11',
    purchaseDate: days(-200),
    expiryDate: days(25),
    purchasePrice: 0.1,
    sellingPrice: 0.3,
    quantity: 300,
  }, adminUserId);

  const coughSyrup = await upsertMedicine({
    name: 'Cough Syrup 100ml',
    genericName: 'Dextromethorphan',
    brand: 'Pfizer',
    category: categories['Cold & Flu']._id,
    manufacturer: manufacturers['Pfizer']._id,
    dosageForm: 'syrup',
    strength: '100ml',
    unit: 'bottle',
    barcode: '6001000000048',
    purchasePrice: 1.2,
    sellingPrice: 2.5,
    minStockLevel: 30,
  });
  // Already expired: demos the expired-stock alert and proves POS refuses to sell it.
  await upsertBatch(coughSyrup, {
    batchNumber: 'COUGH-2024-06',
    purchaseDate: days(-400),
    expiryDate: days(-5),
    purchasePrice: 1.2,
    sellingPrice: 2.5,
    quantity: 60,
    status: 'active',
  }, adminUserId);

  const ibuprofen = await upsertMedicine({
    name: 'Ibuprofen 400mg',
    genericName: 'Ibuprofen',
    brand: 'MediGen',
    category: categories['Pain Relief']._id,
    manufacturer: manufacturers['MediGen Labs']._id,
    dosageForm: 'tablet',
    strength: '400mg',
    unit: 'tablet',
    barcode: '6001000000055',
    purchasePrice: 0.08,
    sellingPrice: 0.22,
    minStockLevel: 100,
  });
  await upsertBatch(ibuprofen, {
    batchNumber: 'IBU-2026-02',
    purchaseDate: days(-15),
    expiryDate: days(500),
    purchasePrice: 0.08,
    sellingPrice: 0.22,
    quantity: 1500,
  }, adminUserId);

  const omeprazole = await upsertMedicine({
    name: 'Omeprazole 20mg',
    genericName: 'Omeprazole',
    brand: 'GlobalPharma',
    category: categories['Digestive Health']._id,
    manufacturer: manufacturers['GlobalPharma']._id,
    dosageForm: 'capsule',
    strength: '20mg',
    unit: 'capsule',
    barcode: '6001000000062',
    purchasePrice: 0.15,
    sellingPrice: 0.4,
    minStockLevel: 80,
  });
  await upsertBatch(omeprazole, {
    batchNumber: 'OMEP-2026-01',
    purchaseDate: days(-20),
    expiryDate: days(600),
    purchasePrice: 0.15,
    sellingPrice: 0.4,
    quantity: 500,
  }, adminUserId);
}

async function seedSuppliersAndPurchases(adminUserId) {
  const supplierDefs = [
    { name: 'PharmaDirect Distributors', contactPerson: 'Yusuf Ali', phone: '+252-61-5551001', email: 'sales@pharmadirect.example', address: 'Industrial Rd, Mogadishu' },
    { name: 'Horn Medical Supplies', contactPerson: 'Hodan Warsame', phone: '+252-61-5551002', email: 'orders@hornmedical.example', address: 'KM4, Mogadishu' },
    { name: 'Global Health Imports', contactPerson: 'Ahmed Nur', phone: '+252-61-5551003', email: 'info@globalhealthimports.example', address: 'Port Rd, Mogadishu' },
  ];
  const suppliers = {};
  for (const s of supplierDefs) {
    suppliers[s.name] = await Supplier.findOneAndUpdate({ name: s.name }, s, { upsert: true, new: true });
  }

  const ibuprofen = await Medicine.findOne({ name: 'Ibuprofen 400mg' });
  const omeprazole = await Medicine.findOne({ name: 'Omeprazole 20mg' });

  const purchaseDefs = [
    {
      invoiceNumber: 'PO-SEED-0001',
      supplier: suppliers['PharmaDirect Distributors']._id,
      medicine: ibuprofen,
      batchNumber: 'IBU-2026-03',
      quantity: 500,
      purchasePrice: 0.08,
      sellingPrice: 0.22,
      expiryDate: days(450),
      paidRatio: 1, // paid in full
    },
    {
      invoiceNumber: 'PO-SEED-0002',
      supplier: suppliers['Horn Medical Supplies']._id,
      medicine: omeprazole,
      batchNumber: 'OMEP-2026-02',
      quantity: 300,
      purchasePrice: 0.15,
      sellingPrice: 0.4,
      expiryDate: days(500),
      paidRatio: 0.6, // partially paid -> leaves a payable balance
    },
  ];

  for (const p of purchaseDefs) {
    const existing = await Purchase.findOne({ invoiceNumber: p.invoiceNumber });
    if (existing) continue;
    if (!p.medicine) continue;

    const subtotal = p.purchasePrice * p.quantity;
    const total = Math.round(subtotal * 100) / 100;
    const amountPaid = Math.round(total * p.paidRatio * 100) / 100;
    const status = amountPaid >= total ? 'paid' : amountPaid > 0 ? 'partial' : 'pending';

    const purchase = await Purchase.create({
      supplier: p.supplier,
      invoiceNumber: p.invoiceNumber,
      items: [],
      subtotal: total,
      discount: 0,
      tax: 0,
      total,
      amountPaid,
      status,
      createdBy: adminUserId,
    });

    const purchaseItem = await PurchaseItem.create({
      purchase: purchase._id,
      medicine: p.medicine._id,
      batchNumber: p.batchNumber,
      expiryDate: p.expiryDate,
      quantity: p.quantity,
      purchasePrice: p.purchasePrice,
      sellingPrice: p.sellingPrice,
    });
    purchase.items = [purchaseItem._id];
    await purchase.save();

    const batch = await Batch.create({
      medicine: p.medicine._id,
      batchNumber: p.batchNumber,
      supplier: p.supplier,
      purchaseDate: new Date(),
      expiryDate: p.expiryDate,
      purchasePrice: p.purchasePrice,
      sellingPrice: p.sellingPrice,
      quantity: p.quantity,
      remainingQuantity: p.quantity,
      status: 'active',
    });

    await InventoryTransaction.create({
      medicine: p.medicine._id,
      batch: batch._id,
      type: 'purchase',
      quantity: p.quantity,
      previousQuantity: 0,
      newQuantity: p.quantity,
      user: adminUserId,
      referenceType: 'Purchase',
      referenceId: purchase._id,
      reason: `Seed data: purchase ${p.invoiceNumber}`,
    });

    if (amountPaid > 0) {
      await Payment.create({
        partyType: 'supplier',
        party: p.supplier,
        partyModel: 'Supplier',
        direction: 'out',
        amount: amountPaid,
        method: 'bank_transfer',
        referenceType: 'purchase',
        referenceId: purchase._id,
        recordedBy: adminUserId,
      });
    }
  }
}

async function seedExpenses(adminUserId) {
  const expenseDefs = [
    { category: 'rent', amount: 450, date: days(-28), description: 'Monthly pharmacy premises rent', paymentMethod: 'bank_transfer' },
    { category: 'electricity', amount: 62.5, date: days(-10), description: 'Electricity bill', paymentMethod: 'cash' },
    { category: 'salaries', amount: 900, date: days(-5), description: 'Staff salaries (partial run)', paymentMethod: 'bank_transfer' },
    { category: 'supplies', amount: 34.2, date: days(-2), description: 'Printer paper & packaging', paymentMethod: 'cash' },
    { category: 'transportation', amount: 18, date: days(0), description: 'Delivery fuel', paymentMethod: 'cash' },
  ];
  for (const e of expenseDefs) {
    const existing = await Expense.findOne({ category: e.category, description: e.description });
    if (existing) continue;
    await Expense.create({ ...e, createdBy: adminUserId });
  }
}

async function seedCustomer() {
  await Customer.findOneAndUpdate(
    { phone: '+252-61-0000001' },
    { name: 'Walk-in Test Customer', phone: '+252-61-0000001', creditLimit: 50, outstandingDebt: 0 },
    { upsert: true }
  );
  // Opening balance demo customer, so the Customer Debts report isn't empty
  // on a fresh seed even before any credit sale has been rung up.
  await Customer.findOneAndUpdate(
    { phone: '+252-61-0000002' },
    { name: 'Amina Hassan', phone: '+252-61-0000002', creditLimit: 100, outstandingDebt: 15.5 },
    { upsert: true }
  );
}

async function seedSettings() {
  await Setting.findOneAndUpdate(
    { key: 'pharmacy_settings' },
    { key: 'pharmacy_settings', pharmacyName: 'Kalsan Pharmacy', currency: 'USD', taxRate: 5 },
    { upsert: true }
  );
}

async function run() {
  await connectDB();
  const roles = await seedPermissionsAndRoles();
  await seedUsers(roles);
  const admin = await User.findOne({ email: 'admin@pharmacy.com' });
  const catalog = await seedCatalog();
  await seedMedicinesAndBatches(catalog, admin._id);
  await seedSuppliersAndPurchases(admin._id);
  await seedExpenses(admin._id);
  await seedCustomer();
  await seedSettings();

  console.log('\nSeed complete. Login with any of:');
  console.log('  admin@pharmacy.com / Password@123 (admin)');
  console.log('  pharmacist@pharmacy.com / Password@123 (pharmacist)');
  console.log('  cashier@pharmacy.com / Password@123 (cashier)');
  console.log('  inventory@pharmacy.com / Password@123 (inventory_manager)\n');

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('[seed] failed', err);
  process.exit(1);
});
