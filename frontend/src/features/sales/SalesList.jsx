import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';
import { salesApi } from '../../api/sales.api';
import { formatCurrency } from '../../lib/formatCurrency';
import { formatDateTime } from '../../lib/formatDate';
import PageHeader from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import Pagination from '../../components/ui/Pagination';

const STATUS_TONE = { paid: 'success', partial: 'warning', credit: 'info' };

export default function SalesList() {
  const navigate = useNavigate();
  const settings = useSettings();
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [sales, setSales] = useState([]);
  const [meta, setMeta] = useState({ total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    salesApi
      .list({ status: status || undefined, from: from || undefined, to: to || undefined, page, limit: 15 })
      .then((res) => {
        setSales(res.data);
        setMeta(res.meta);
      })
      .finally(() => setLoading(false));
  }, [status, from, to, page]);

  useEffect(() => setPage(1), [status, from, to]);

  const columns = [
    {
      key: 'invoiceNumber',
      header: 'Invoice',
      render: (s) => (
        <div>
          <p className="font-medium text-ink">{s.invoiceNumber}</p>
          <p className="text-xs text-ink-subtle">{formatDateTime(s.createdAt)}</p>
        </div>
      ),
    },
    { key: 'customer', header: 'Customer', render: (s) => s.customer?.name || 'Walk-in' },
    { key: 'cashier', header: 'Cashier', render: (s) => s.cashier?.name || '—' },
    { key: 'paymentMethod', header: 'Payment', render: (s) => <span className="capitalize">{s.paymentMethod}</span> },
    { key: 'total', header: 'Total', render: (s) => formatCurrency(s.total, settings.currency), className: 'tabular-nums font-medium' },
    { key: 'status', header: 'Status', render: (s) => <Badge tone={STATUS_TONE[s.status]}>{s.status}</Badge> },
  ];

  return (
    <div>
      <PageHeader title="Sales History" description="Every completed POS transaction, with receipts you can reprint." />

      <Card>
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} containerClassName="sm:max-w-[160px]" />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} containerClassName="sm:max-w-[160px]" />
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="sm:max-w-[160px]">
            <option value="">All statuses</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="credit">Credit</option>
          </Select>
        </div>
        <Table
          columns={columns}
          data={sales}
          loading={loading}
          onRowClick={(s) => navigate(`/sales/${s._id}`)}
          emptyTitle="No sales found"
          emptyDescription="Adjust your filters or make a sale in POS."
        />
        <Pagination page={meta.page || page} pages={meta.pages} total={meta.total} limit={15} onChange={setPage} />
      </Card>
    </div>
  );
}
