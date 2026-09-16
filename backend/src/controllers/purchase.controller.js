const asyncHandler = require('express-async-handler');
const purchaseService = require('../services/purchase.service');

const create = asyncHandler(async (req, res) => {
  const purchase = await purchaseService.createPurchase(req.body, req.user, req);
  res.status(201).json({ success: true, data: purchase });
});

const list = asyncHandler(async (req, res) => {
  const result = await purchaseService.listPurchases(req.query);
  res.json({ success: true, data: result.purchases, meta: { total: result.total, page: result.page, pages: result.pages } });
});

const getById = asyncHandler(async (req, res) => {
  const purchase = await purchaseService.getPurchaseById(req.params.id);
  res.json({ success: true, data: purchase });
});

module.exports = { create, list, getById };
