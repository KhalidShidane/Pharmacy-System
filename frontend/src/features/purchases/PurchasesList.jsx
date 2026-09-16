import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { purchasesApi } from '../../api/purchases.api';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { formatCurrency } from '../../lib/formatCurrency';
import { formatDateTime } from '../../lib/formatDate';
import { PERMISSIONS } from '../../lib/permissions';
import PageHeader from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import Pagination from '../../components/ui/Pagination';

const STATUS_TONE = { paid: 'success', partial: 'warning', pending: 'danger' };

export default function PurchasesList() {
  const navigate = useNavigate();
  const { can } = useAuth();
  const settings = useSettings();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [purchases, setPurchases] = useState([]);
  const [meta, setMeta] = useState({ total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    purchasesApi
      .list({ status: status || undefined, page, limit: 15 })
      .then((res) => {
        setPurchases(res.data);
        setMeta(res.meta);
      })
      .finally(() => setLoading(false));
  }, [status, page]);

  useEffect(() => setPage(1), [status]);

  const columns = [
    {
      key: 'invoiceNumber',
      header: 'Invoice',
      render: (p) => (
        <div>
          <p className="font-medium text-ink">{p.invoiceNumber}</p>
          <p className="text-xs text-ink-subtle">{formatDateTime(p.createdAt)}</p>
        </div>
      ),
    },
    { key: 'supplier', header: 'Supplier', render: (p) => p.supplier?.name || '—' },
    { key: 'createdBy', header: 'Recorded by', render: (p) => p.createdBy?.name || '—' },
    { key: 'total', header: 'Total', render: (p) => formatCurrency(p.total, settings.currency), className: 'tabular-nums font-medium' },
    { key: 'amountPaid', header: 'Paid', render: (p) => formatCurrency(p.amountPaid, settings.currency), className: 'tabular-nums' },
    { key: 'status', header: 'Status', render: (p) => <Badge tone={STATUS_TONE[p.status]}>{p.status}</Badge> },
  ];

  return (
    <div>
      <PageHeader
        title="Purchases"
        description="Stock received from suppliers, with payment status."
        actions={
          can(PERMISSIONS.PURCHASE_MANAGE) && (
            <Button icon={Plus} onClick={() => navigate('/purchases/new')}>
              New Purchase
            </Button>
          )
        }
      />

      <Card>
        <div className="border-b border-border p-4">
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="max-w-[180px]">
            <option value="">All statuses</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="pending">Pending</option>
          </Select>
        </div>
        <Table
          columns={columns}
          data={purchases}
          loading={loading}
          onRowClick={(p) => navigate(`/purchases/${p._id}`)}
          emptyTitle="No purchases yet"
          emptyDescription="Record a purchase to start receiving stock from suppliers."
        />
        <Pagination page={meta.page || page} pages={meta.pages} total={meta.total} limit={15} onChange={setPage} />
      </Card>
    </div>
  );
}
