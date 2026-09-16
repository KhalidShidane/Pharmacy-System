const asyncHandler = require('express-async-handler');
const saleService = require('../services/sale.service');

const create = asyncHandler(async (req, res) => {
  const sale = await saleService.createSale(req.body, req.user, req);
  res.status(201).json({ success: true, data: sale });
});

const list = asyncHandler(async (req, res) => {
  const result = await saleService.listSales(req.query);
  res.json({ success: true, data: result.sales, meta: { total: result.total, page: result.page, pages: result.pages } });
});

const getById = asyncHandler(async (req, res) => {
  const sale = await saleService.getSaleById(req.params.id);
  res.json({ success: true, data: sale });
});

module.exports = { create, list, getById };
