const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

const { clientOrigin, nodeEnv } = require('./config/env');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth.routes');
const categoryRoutes = require('./routes/category.routes');
const manufacturerRoutes = require('./routes/manufacturer.routes');
const medicineRoutes = require('./routes/medicine.routes');
const batchRoutes = require('./routes/batch.routes');
const inventoryRoutes = require('./routes/inventory.routes');
const customerRoutes = require('./routes/customer.routes');
const saleRoutes = require('./routes/sale.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const notificationRoutes = require('./routes/notification.routes');
const userRoutes = require('./routes/user.routes');
const settingRoutes = require('./routes/setting.routes');
const supplierRoutes = require('./routes/supplier.routes');
const purchaseRoutes = require('./routes/purchase.routes');
const expenseRoutes = require('./routes/expense.routes');
const reportsRoutes = require('./routes/reports.routes');

const app = express();

app.use(helmet());
app.use(cors({ origin: clientOrigin, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(mongoSanitize());
if (nodeEnv !== 'test') app.use(morgan(nodeEnv === 'development' ? 'dev' : 'combined'));

const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500, standardHeaders: true, legacyHeaders: false });
app.use('/api', apiLimiter);

app.use(
  '/uploads',
  express.static(path.join(__dirname, '../uploads'), {
    setHeaders: (res) => res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'),
  })
);

app.get('/api/health', (_req, res) => res.json({ success: true, data: { status: 'ok' } }));

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/manufacturers', manufacturerRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/reports', reportsRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
