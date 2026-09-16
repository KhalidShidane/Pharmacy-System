import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';
import { useDebounce } from '../../hooks/useDebounce';
import { inventoryApi } from '../../api/inventory.api';
import { formatCurrency } from '../../lib/formatCurrency';
import { formatDate, formatDateTime } from '../../lib/formatDate';
import PageHeader from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import Tabs from '../../components/ui/Tabs';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import SearchField from '../../components/ui/SearchField';
import Pagination from '../../components/ui/Pagination';

const STOCK_STATUS = {
  out_of_stock: { tone: 'danger', label: 'Out of stock' },
  low_stock: { tone: 'warning', label: 'Low stock' },
  in_stock: { tone: 'success', label: 'In stock' },
};

export default function InventoryOverview() {
  const settings = useSettings();
  const [tab, setTab] = useState('stock');

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const [page, setPage] = useState(1);
  const [stock, setStock] = useState({ data: [], meta: { total: 0, pages: 1 } });
  const [stockLoading, setStockLoading] = useState(true);

  const [lowStock, setLowStock] = useState([]);
  const [lowStockLoading, setLowStockLoading] = useState(true);

  const [expiry, setExpiry] = useState({ expiringSoon: [], expired: [] });
  const [expiryLoading, setExpiryLoading] = useState(true);

  const [movements, setMovements] = useState({ data: [], meta: { total: 0, pages: 1 } });
  const [movementsPage, setMovementsPage] = useState(1);
  const [movementsLoading, setMovementsLoading] = useState(true);

  useEffect(() => {
    if (tab !== 'stock') return;
    setStockLoading(true);
    inventoryApi
      .summary({ query: debouncedQuery || undefined, page, limit: 12 })
      .then((res) => setStock({ data: res.data, meta: res.meta }))
      .finally(() => setStockLoading(false));
  }, [tab, debouncedQuery, page]);

  useEffect(() => setPage(1), [debouncedQuery]);

  useEffect(() => {
    if (tab !== 'low') return;
    setLowStockLoading(true);
    inventoryApi.lowStock().then(setLowStock).finally(() => setLowStockLoading(false));
  }, [tab]);

  useEffect(() => {
    if (tab !== 'expiry') return;
    setExpiryLoading(true);
    inventoryApi.expiring().then(setExpiry).finally(() => setExpiryLoading(false));
  }, [tab]);

  useEffect(() => {
    if (tab !== 'movements') return;
    setMovementsLoading(true);
    inventoryApi
      .transactions({ page: movementsPage, limit: 20 })
      .then((res) => setMovements({ data: res.data, meta: res.meta }))
      .finally(() => setMovementsLoading(false));
  }, [tab, movementsPage]);

  const stockColumns = [
    { key: 'name', header: 'Medicine', render: (m) => <Link to={`/medicines/${m._id}`} className="font-medium text-ink hover:text-primary">{m.name}</Link> },
    { key: 'category', header: 'Category', render: (m) => m.category?.name || '—' },
    { key: 'currentStock', header: 'Current Stock', render: (m) => <span className="tabular-nums">{m.currentStock}</span> },
    { key: 'minStockLevel', header: 'Minimum', render: (m) => <span className="tabular-nums">{m.minStockLevel}</span> },
    { key: 'status', header: 'Status', render: (m) => <Badge tone={STOCK_STATUS[m.status].tone}>{STOCK_STATUS[m.status].label}</Badge> },
  ];

  const lowStockColumns = [
    { key: 'name', header: 'Medicine', render: (m) => <Link to={`/medicines/${m._id}`} className="font-medium text-ink hover:text-primary">{m.name}</Link> },
    { key: 'category', header: 'Category', render: (m) => m.category?.name || '—' },
    { key: 'currentStock', header: 'Current Stock', render: (m) => <span className="tabular-nums">{m.currentStock}</span> },
    { key: 'minStockLevel', header: 'Minimum', render: (m) => <span className="tabular-nums">{m.minStockLevel}</span> },
    {
      key: 'status',
      header: 'Status',
      render: (m) => <Badge tone={m.currentStock === 0 ? 'danger' : 'warning'}>{m.currentStock === 0 ? 'Out of stock' : 'Low stock'}</Badge>,
    },
  ];

  const expiryColumns = (dangerLabel) => [
    { key: 'medicine', header: 'Medicine', render: (b) => <Link to={`/medicines/${b.medicine?._id}`} className="font-medium text-ink hover:text-primary">{b.medicine?.name}</Link> },
    { key: 'batchNumber', header: 'Batch #' },
    { key: 'expiryDate', header: 'Expiry Date', render: (b) => <Badge tone={dangerLabel ? 'danger' : 'warning'}>{formatDate(b.expiryDate)}</Badge> },
    { key: 'remainingQuantity', header: 'Quantity', render: (b) => <span className="tabular-nums">{b.remainingQuantity}</span> },
    { key: 'value', header: 'Cost Value', render: (b) => formatCurrency(b.remainingQuantity * b.purchasePrice, settings.currency), className: 'tabular-nums' },
  ];

  const movementColumns = [
    { key: 'createdAt', header: 'Date', render: (t) => formatDateTime(t.createdAt) },
    { key: 'medicine', header: 'Medicine', render: (t) => t.medicine?.name || '—' },
    { key: 'batch', header: 'Batch', render: (t) => t.batch?.batchNumber || '—' },
    { key: 'type', header: 'Type', render: (t) => <Badge tone={t.quantity >= 0 ? 'success' : 'danger'}>{t.type.replace('_', ' ')}</Badge> },
    { key: 'quantity', header: 'Change', render: (t) => <span className="tabular-nums">{t.quantity > 0 ? `+${t.quantity}` : t.quantity}</span> },
    { key: 'user', header: 'By', render: (t) => t.user?.name || '—' },
  ];

  return (
    <div>
      <PageHeader title="Inventory" description="Stock levels, expiry tracking and movement history across all medicines." />

      <Card>
        <Tabs
          className="px-5"
          tabs={[
            { value: 'stock', label: 'Stock Overview' },
            { value: 'low', label: 'Low Stock', count: lowStock.length || undefined },
            { value: 'expiry', label: 'Expiry Tracking', count: (expiry.expiringSoon.length + expiry.expired.length) || undefined },
            { value: 'movements', label: 'Stock Movements' },
          ]}
          active={tab}
          onChange={setTab}
        />

        {tab === 'stock' && (
          <>
            <div className="border-b border-border p-4">
              <SearchField value={query} onChange={setQuery} placeholder="Search medicines…" className="max-w-sm" />
            </div>
            <Table columns={stockColumns} data={stock.data} loading={stockLoading} emptyTitle="No medicines found" />
            <Pagination page={stock.meta.page || page} pages={stock.meta.pages} total={stock.meta.total} limit={12} onChange={setPage} />
          </>
        )}

        {tab === 'low' && (
          <Table columns={lowStockColumns} data={lowStock} loading={lowStockLoading} emptyTitle="Nothing is low on stock" emptyDescription="Every medicine is above its minimum stock level." />
        )}

        {tab === 'expiry' && (
          <div className="flex flex-col">
            <div className="border-b border-border px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-subtle">
              Expired — remove from sale
            </div>
            <Table columns={expiryColumns(true)} data={expiry.expired} loading={expiryLoading} emptyTitle="No expired stock" />
            <div className="border-y border-border px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-subtle">
              Expiring soon
            </div>
            <Table columns={expiryColumns(false)} data={expiry.expiringSoon} loading={expiryLoading} emptyTitle="Nothing expiring soon" />
          </div>
        )}

        {tab === 'movements' && (
          <>
            <Table columns={movementColumns} data={movements.data} loading={movementsLoading} emptyTitle="No stock movements yet" />
            <Pagination page={movements.meta.page || movementsPage} pages={movements.meta.pages} total={movements.meta.total} limit={20} onChange={setMovementsPage} />
          </>
        )}
      </Card>
    </div>
  );
}
