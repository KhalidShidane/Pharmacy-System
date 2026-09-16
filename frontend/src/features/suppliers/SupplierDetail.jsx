import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Pencil, Plus } from 'lucide-react';
import { suppliersApi } from '../../api/suppliers.api';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { formatCurrency } from '../../lib/formatCurrency';
import { formatDateTime } from '../../lib/formatDate';
import { PERMISSIONS } from '../../lib/permissions';
import PageHeader from '../../components/ui/PageHeader';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import { Card, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import { TableSkeleton } from '../../components/ui/Skeleton';
import SupplierFormModal from './SupplierFormModal';

const STATUS_TONE = { paid: 'success', partial: 'warning', pending: 'danger' };

export default function SupplierDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { can } = useAuth();
  const settings = useSettings();
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  const load = () => {
    setLoading(true);
    suppliersApi.getById(id).then(setSupplier).finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  if (loading || !supplier) {
    return (
      <div>
        <PageHeader title="Loading…" />
        <Card>
          <TableSkeleton />
        </Card>
      </div>
    );
  }

  const columns = [
    { key: 'invoiceNumber', header: 'Invoice', render: (p) => <span className="font-medium text-ink">{p.invoiceNumber}</span> },
    { key: 'createdAt', header: 'Date', render: (p) => formatDateTime(p.createdAt) },
    { key: 'total', header: 'Total', render: (p) => formatCurrency(p.total, settings.currency), className: 'tabular-nums' },
    { key: 'amountPaid', header: 'Paid', render: (p) => formatCurrency(p.amountPaid, settings.currency), className: 'tabular-nums' },
    { key: 'status', header: 'Status', render: (p) => <Badge tone={STATUS_TONE[p.status]}>{p.status}</Badge> },
  ];

  return (
    <div>
      <PageHeader
        breadcrumbs={<Breadcrumbs items={[{ label: 'Suppliers', to: '/suppliers' }, { label: supplier.name }]} />}
        title={supplier.name}
        description={supplier.contactPerson}
        actions={
          <>
            {can(PERMISSIONS.SUPPLIER_MANAGE) && (
              <Button variant="secondary" icon={Pencil} onClick={() => setEditOpen(true)}>
                Edit
              </Button>
            )}
            {can(PERMISSIONS.PURCHASE_MANAGE) && (
              <Button icon={Plus} onClick={() => navigate(`/purchases/new?supplier=${supplier._id}`)}>
                New Purchase
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <Card className="lg:col-span-1">
          <CardBody className="flex flex-col gap-4">
            <span className="text-xs font-medium uppercase tracking-wide text-ink-subtle">Overview</span>
            <dl className="flex flex-col gap-3 text-[13px]">
              <div className="flex justify-between gap-3">
                <dt className="text-ink-subtle">Phone</dt>
                <dd className="text-right font-medium text-ink">{supplier.phone || '—'}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-subtle">Email</dt>
                <dd className="text-right font-medium text-ink">{supplier.email || '—'}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-subtle">Address</dt>
                <dd className="text-right font-medium text-ink">{supplier.address || '—'}</dd>
              </div>
              <div className="flex justify-between gap-3 border-t border-border pt-3">
                <dt className="text-ink-subtle">Total purchased</dt>
                <dd className="text-right font-medium tabular-nums text-ink">{formatCurrency(supplier.totalPurchased, settings.currency)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-subtle">Payable</dt>
                <dd className="text-right">
                  <Badge tone={supplier.payable > 0 ? 'warning' : 'success'}>{formatCurrency(supplier.payable, settings.currency)}</Badge>
                </dd>
              </div>
            </dl>
          </CardBody>
        </Card>

        <Card className="lg:col-span-3">
          <div className="border-b border-border px-5 py-3 text-sm font-semibold text-ink">Purchase History</div>
          <Table
            columns={columns}
            data={supplier.purchases || []}
            onRowClick={(p) => navigate(`/purchases/${p._id}`)}
            emptyTitle="No purchases yet"
            emptyDescription="Purchases from this supplier will show up here."
          />
        </Card>
      </div>

      <SupplierFormModal open={editOpen} onClose={() => setEditOpen(false)} supplier={supplier} onSaved={load} />
    </div>
  );
}
