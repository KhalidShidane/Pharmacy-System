import { useEffect, useMemo, useState } from 'react';
import { Printer, Download } from 'lucide-react';
import { reportsApi } from '../../api/reports.api';
import { useSettings } from '../../context/SettingsContext';
import { formatCurrency } from '../../lib/formatCurrency';
import { formatDate, formatDateTime } from '../../lib/formatDate';
import { exportCsv } from '../../lib/exportCsv';
import PageHeader from '../../components/ui/PageHeader';
import { Card, CardBody } from '../../components/ui/Card';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { TableSkeleton } from '../../components/ui/Skeleton';
import StatCard from '../../components/ui/StatCard';

const REPORT_TYPES = [
  { value: 'sales', label: 'Sales Summary', dateRange: true },
  { value: 'profit-loss', label: 'Profit & Loss', dateRange: true },
  { value: 'purchases', label: 'Purchases Summary', dateRange: true },
  { value: 'best-sellers', label: 'Best-Selling Medicines', dateRange: true },
  { value: 'inventory-valuation', label: 'Inventory Valuation', dateRange: false },
  { value: 'low-stock', label: 'Low Stock', dateRange: false },
  { value: 'expiring', label: 'Expiry Report', dateRange: false },
  { value: 'expenses', label: 'Expenses', dateRange: true },
  { value: 'customer-debts', label: 'Customer Debts', dateRange: false },
  { value: 'supplier-payables', label: 'Supplier Payables', dateRange: false },
  { value: 'payment-history', label: 'Payment History', dateRange: true },
];

function SimpleTable({ columns, rows, emptyTitle }) {
  if (!rows || rows.length === 0) return <EmptyState title={emptyTitle} />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-ink-subtle">
            {columns.map((c) => (
              <th key={c.key} className={`px-5 py-3 ${c.right ? 'text-right' : ''}`}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row._id || row.id || i} className="border-b border-border text-ink last:border-0">
              {columns.map((c) => (
                <td key={c.key} className={`px-5 py-3 ${c.right ? 'text-right tabular-nums' : ''}`}>
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Reports() {
  const settings = useSettings();
  const [reportType, setReportType] = useState('sales');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [data, setData] = useState(null);
  // Tracks which reportType `data` actually belongs to, so a report switch
  // never renders the new report's branch against the previous report's
  // (differently-shaped) data during the gap before the new fetch resolves.
  const [dataType, setDataType] = useState(null);
  const [loading, setLoading] = useState(true);

  const meta = REPORT_TYPES.find((r) => r.value === reportType);
  const currency = settings.currency;

  useEffect(() => {
    setLoading(true);
    const params = meta.dateRange ? { from: from || undefined, to: to || undefined } : undefined;
    const call = {
      sales: reportsApi.salesSummary,
      'profit-loss': reportsApi.profitLoss,
      purchases: reportsApi.purchasesSummary,
      'best-sellers': (p) => reportsApi.bestSellers({ ...p, limit: 20 }),
      'inventory-valuation': reportsApi.inventoryValuation,
      'low-stock': reportsApi.lowStock,
      expiring: reportsApi.expiring,
      expenses: reportsApi.expenses,
      'customer-debts': reportsApi.customerDebts,
      'supplier-payables': reportsApi.supplierPayables,
      'payment-history': reportsApi.paymentHistory,
    }[reportType];
    call(params)
      .then((result) => {
        setData(result);
        setDataType(reportType);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportType, from, to]);

  const dataReady = !loading && dataType === reportType;

  const csvExport = useMemo(() => {
    if (!data || dataType !== reportType) return null;
    switch (reportType) {
      case 'sales':
        return () => exportCsv('sales-summary', [{ key: 'date', header: 'Date' }, { key: 'transactions', header: 'Transactions' }, { key: 'revenue', header: 'Revenue' }, { key: 'discount', header: 'Discount' }, { key: 'tax', header: 'Tax' }], data.rows);
      case 'purchases':
        return () => exportCsv('purchases-summary', [{ key: 'name', header: 'Supplier' }, { key: 'purchaseCount', header: 'Purchases' }, { key: 'total', header: 'Total' }, { key: 'amountPaid', header: 'Paid' }, { key: 'payable', header: 'Payable' }], data.rows);
      case 'best-sellers':
        return () => exportCsv('best-sellers', [{ key: 'name', header: 'Medicine' }, { key: 'quantitySold', header: 'Qty Sold' }, { key: 'revenue', header: 'Revenue' }, { key: 'profit', header: 'Profit' }], data);
      case 'inventory-valuation':
        return () => exportCsv('inventory-valuation', [{ key: 'name', header: 'Medicine' }, { key: 'category', header: 'Category' }, { key: 'quantity', header: 'Quantity' }, { key: 'value', header: 'Value' }], data.rows);
      case 'low-stock':
        return () => exportCsv('low-stock', [{ key: 'name', header: 'Medicine' }, { key: 'currentStock', header: 'Current Stock' }, { key: 'minStockLevel', header: 'Minimum' }], data);
      case 'expenses':
        return () => exportCsv('expenses', [{ key: 'date', header: 'Date' }, { key: 'category', header: 'Category' }, { key: 'description', header: 'Description' }, { key: 'amount', header: 'Amount' }], data.rows);
      case 'customer-debts':
        return () => exportCsv('customer-debts', [{ key: 'name', header: 'Customer' }, { key: 'phone', header: 'Phone' }, { key: 'outstandingDebt', header: 'Debt' }, { key: 'creditLimit', header: 'Credit Limit' }], data.rows);
      case 'supplier-payables':
        return () => exportCsv('supplier-payables', [{ key: 'name', header: 'Supplier' }, { key: 'phone', header: 'Phone' }, { key: 'payable', header: 'Payable' }], data.rows);
      case 'payment-history':
        return () => exportCsv('payment-history', [{ key: 'date', header: 'Date' }, { key: 'partyName', header: 'Party' }, { key: 'direction', header: 'Direction' }, { key: 'amount', header: 'Amount' }, { key: 'method', header: 'Method' }], data);
      default:
        return null;
    }
  }, [data, dataType, reportType]);

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Business intelligence across sales, purchasing, inventory and finance."
        actions={
          <>
            {csvExport && (
              <Button variant="secondary" icon={Download} onClick={csvExport}>
                Export CSV
              </Button>
            )}
            <Button variant="secondary" icon={Printer} onClick={() => window.print()}>
              Print
            </Button>
          </>
        }
      />

      <Card className="mb-4">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <Select value={reportType} onChange={(e) => setReportType(e.target.value)} className="sm:max-w-[240px]">
            {REPORT_TYPES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </Select>
          {meta.dateRange && (
            <>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} containerClassName="sm:max-w-[160px]" />
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} containerClassName="sm:max-w-[160px]" />
            </>
          )}
        </div>
      </Card>

      <div id="print-root">
        {!dataReady ? (
          <Card>
            <TableSkeleton />
          </Card>
        ) : (
          <ReportBody reportType={reportType} data={data} currency={currency} />
        )}
      </div>
    </div>
  );
}

function ReportBody({ reportType, data, currency }) {
  if (!data) return null;

  if (reportType === 'sales') {
    return (
      <Card>
        <SimpleTable
          emptyTitle="No sales in this range"
          columns={[
            { key: 'date', header: 'Date' },
            { key: 'transactions', header: 'Transactions', right: true },
            { key: 'revenue', header: 'Revenue', right: true, render: (r) => formatCurrency(r.revenue, currency) },
            { key: 'discount', header: 'Discount', right: true, render: (r) => formatCurrency(r.discount, currency) },
            { key: 'tax', header: 'Tax', right: true, render: (r) => formatCurrency(r.tax, currency) },
          ]}
          rows={data.rows}
        />
        <div className="flex items-center justify-end gap-6 border-t border-border px-5 py-3 text-[13px]">
          <span className="text-ink-subtle">
            {data.totals.transactions} transaction(s)
          </span>
          <span className="font-semibold text-ink">Total revenue: {formatCurrency(data.totals.revenue, currency)}</span>
        </div>
      </Card>
    );
  }

  if (reportType === 'profit-loss') {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Gross Revenue" value={formatCurrency(data.grossRevenue, currency)} tone="primary" />
        <StatCard label="Order Discounts" value={formatCurrency(data.orderDiscounts, currency)} tone="neutral" />
        <StatCard label="Net Revenue" value={formatCurrency(data.netRevenue, currency)} tone="info" />
        <StatCard label="Cost of Goods Sold" value={formatCurrency(data.cogs, currency)} tone="warning" />
        <StatCard label="Gross Profit" value={formatCurrency(data.grossProfit, currency)} tone="success" />
        <StatCard label="Expenses" value={formatCurrency(data.expenses, currency)} tone="warning" />
        <StatCard
          label="Net Profit"
          value={formatCurrency(data.netProfit, currency)}
          tone={data.netProfit >= 0 ? 'success' : 'danger'}
        />
      </div>
    );
  }

  if (reportType === 'purchases') {
    return (
      <Card>
        <SimpleTable
          emptyTitle="No purchases in this range"
          columns={[
            { key: 'name', header: 'Supplier' },
            { key: 'purchaseCount', header: 'Purchases', right: true },
            { key: 'total', header: 'Total', right: true, render: (r) => formatCurrency(r.total, currency) },
            { key: 'amountPaid', header: 'Paid', right: true, render: (r) => formatCurrency(r.amountPaid, currency) },
            { key: 'payable', header: 'Payable', right: true, render: (r) => <Badge tone={r.payable > 0 ? 'warning' : 'success'}>{formatCurrency(r.payable, currency)}</Badge> },
          ]}
          rows={data.rows}
        />
        <div className="flex items-center justify-end gap-6 border-t border-border px-5 py-3 text-[13px]">
          <span className="font-semibold text-ink">Total: {formatCurrency(data.totals.total, currency)}</span>
        </div>
      </Card>
    );
  }

  if (reportType === 'best-sellers') {
    return (
      <Card>
        <SimpleTable
          emptyTitle="No sales in this range"
          columns={[
            { key: 'name', header: 'Medicine' },
            { key: 'quantitySold', header: 'Qty Sold', right: true },
            { key: 'revenue', header: 'Revenue', right: true, render: (r) => formatCurrency(r.revenue, currency) },
            { key: 'profit', header: 'Profit', right: true, render: (r) => formatCurrency(r.profit, currency) },
          ]}
          rows={data}
        />
      </Card>
    );
  }

  if (reportType === 'inventory-valuation') {
    return (
      <Card>
        <SimpleTable
          emptyTitle="No stock on hand"
          columns={[
            { key: 'name', header: 'Medicine' },
            { key: 'category', header: 'Category' },
            { key: 'quantity', header: 'Quantity', right: true },
            { key: 'value', header: 'Value', right: true, render: (r) => formatCurrency(r.value, currency) },
          ]}
          rows={data.rows}
        />
        <div className="flex items-center justify-end border-t border-border px-5 py-3 text-[13px]">
          <span className="font-semibold text-ink">Total inventory value: {formatCurrency(data.totalValue, currency)}</span>
        </div>
      </Card>
    );
  }

  if (reportType === 'low-stock') {
    return (
      <Card>
        <SimpleTable
          emptyTitle="Nothing is low on stock"
          columns={[
            { key: 'name', header: 'Medicine' },
            { key: 'currentStock', header: 'Current Stock', right: true },
            { key: 'minStockLevel', header: 'Minimum', right: true },
            { key: 'status', header: 'Status', right: true, render: (r) => <Badge tone={r.currentStock === 0 ? 'danger' : 'warning'}>{r.currentStock === 0 ? 'Out of stock' : 'Low'}</Badge> },
          ]}
          rows={data}
        />
      </Card>
    );
  }

  if (reportType === 'expiring') {
    return (
      <div className="flex flex-col gap-4">
        <Card>
          <div className="border-b border-border px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-subtle">Expired</div>
          <SimpleTable
            emptyTitle="No expired stock"
            columns={[
              { key: 'medicine', header: 'Medicine', render: (r) => r.medicine?.name },
              { key: 'batchNumber', header: 'Batch #' },
              { key: 'expiryDate', header: 'Expiry', render: (r) => <Badge tone="danger">{formatDate(r.expiryDate)}</Badge> },
              { key: 'remainingQuantity', header: 'Quantity', right: true },
            ]}
            rows={data.expired}
          />
        </Card>
        <Card>
          <div className="border-b border-border px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-subtle">Expiring Soon</div>
          <SimpleTable
            emptyTitle="Nothing expiring soon"
            columns={[
              { key: 'medicine', header: 'Medicine', render: (r) => r.medicine?.name },
              { key: 'batchNumber', header: 'Batch #' },
              { key: 'expiryDate', header: 'Expiry', render: (r) => <Badge tone="warning">{formatDate(r.expiryDate)}</Badge> },
              { key: 'remainingQuantity', header: 'Quantity', right: true },
            ]}
            rows={data.expiringSoon}
          />
        </Card>
      </div>
    );
  }

  if (reportType === 'expenses') {
    return (
      <div className="flex flex-col gap-4">
        <Card>
          <CardBody>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-subtle">By category</p>
            <div className="flex flex-wrap gap-2">
              {data.byCategory.map((c) => (
                <Badge key={c._id} tone="neutral" className="capitalize">
                  {c._id}: {formatCurrency(c.total, currency)}
                </Badge>
              ))}
            </div>
          </CardBody>
        </Card>
        <Card>
          <SimpleTable
            emptyTitle="No expenses in this range"
            columns={[
              { key: 'date', header: 'Date', render: (r) => formatDate(r.date) },
              { key: 'category', header: 'Category' },
              { key: 'description', header: 'Description' },
              { key: 'amount', header: 'Amount', right: true, render: (r) => formatCurrency(r.amount, currency) },
            ]}
            rows={data.rows}
          />
          <div className="flex items-center justify-end border-t border-border px-5 py-3 text-[13px]">
            <span className="font-semibold text-ink">Total: {formatCurrency(data.total, currency)}</span>
          </div>
        </Card>
      </div>
    );
  }

  if (reportType === 'customer-debts') {
    return (
      <Card>
        <SimpleTable
          emptyTitle="No customers with outstanding debt"
          columns={[
            { key: 'name', header: 'Customer' },
            { key: 'phone', header: 'Phone' },
            { key: 'creditLimit', header: 'Credit Limit', right: true, render: (r) => formatCurrency(r.creditLimit, currency) },
            { key: 'outstandingDebt', header: 'Debt', right: true, render: (r) => <Badge tone={r.outstandingDebt > r.creditLimit ? 'danger' : 'warning'}>{formatCurrency(r.outstandingDebt, currency)}</Badge> },
          ]}
          rows={data.rows}
        />
        <div className="flex items-center justify-end border-t border-border px-5 py-3 text-[13px]">
          <span className="font-semibold text-ink">Total owed: {formatCurrency(data.total, currency)}</span>
        </div>
      </Card>
    );
  }

  if (reportType === 'supplier-payables') {
    return (
      <Card>
        <SimpleTable
          emptyTitle="No outstanding payables"
          columns={[
            { key: 'name', header: 'Supplier' },
            { key: 'phone', header: 'Phone' },
            { key: 'payable', header: 'Payable', right: true, render: (r) => <Badge tone="warning">{formatCurrency(r.payable, currency)}</Badge> },
          ]}
          rows={data.rows}
        />
        <div className="flex items-center justify-end border-t border-border px-5 py-3 text-[13px]">
          <span className="font-semibold text-ink">Total payable: {formatCurrency(data.total, currency)}</span>
        </div>
      </Card>
    );
  }

  if (reportType === 'payment-history') {
    return (
      <Card>
        <SimpleTable
          emptyTitle="No payments in this range"
          columns={[
            { key: 'date', header: 'Date', render: (r) => formatDateTime(r.date) },
            { key: 'partyName', header: 'Party' },
            { key: 'direction', header: 'Direction', render: (r) => <Badge tone={r.direction === 'in' ? 'success' : 'info'}>{r.direction === 'in' ? 'Received' : 'Paid out'}</Badge> },
            { key: 'method', header: 'Method' },
            { key: 'amount', header: 'Amount', right: true, render: (r) => formatCurrency(r.amount, currency) },
          ]}
          rows={data}
        />
      </Card>
    );
  }

  return null;
}
