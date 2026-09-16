import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Pencil, Plus, PowerOff } from 'lucide-react';
import { medicinesApi } from '../../api/medicines.api';
import { categoriesApi, manufacturersApi } from '../../api/misc.api';
import { inventoryApi } from '../../api/inventory.api';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { formatCurrency } from '../../lib/formatCurrency';
import { formatDate, formatDateTime } from '../../lib/formatDate';
import { PERMISSIONS } from '../../lib/permissions';
import PageHeader from '../../components/ui/PageHeader';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import { Card, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Tabs from '../../components/ui/Tabs';
import Table from '../../components/ui/Table';
import { TableSkeleton } from '../../components/ui/Skeleton';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { toast } from '../../lib/toast';
import MedicineFormDrawer from './MedicineFormDrawer';
import AddBatchModal from './AddBatchModal';

function batchStatusBadge(batch) {
  const now = new Date();
  const expiry = new Date(batch.expiryDate);
  if (batch.status === 'damaged') return <Badge tone="neutral">Damaged</Badge>;
  if (expiry <= now) return <Badge tone="danger">Expired</Badge>;
  if (batch.remainingQuantity === 0) return <Badge tone="neutral">Depleted</Badge>;
  const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
  if (daysLeft <= 60) return <Badge tone="warning">Expires in {daysLeft}d</Badge>;
  return <Badge tone="success">Active</Badge>;
}

export default function MedicineDetail() {
  const { id } = useParams();
  const { can } = useAuth();
  const settings = useSettings();

  const [medicine, setMedicine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('batches');
  const [categories, setCategories] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [editOpen, setEditOpen] = useState(false);
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [movements, setMovements] = useState([]);
  const [movementsLoading, setMovementsLoading] = useState(false);

  const load = () => {
    setLoading(true);
    medicinesApi.getById(id).then(setMedicine).finally(() => setLoading(false));
  };

  useEffect(load, [id]);
  useEffect(() => {
    Promise.all([categoriesApi.list(), manufacturersApi.list()]).then(([c, m]) => {
      setCategories(c);
      setManufacturers(m);
    });
  }, []);

  useEffect(() => {
    if (tab !== 'movements') return;
    setMovementsLoading(true);
    inventoryApi
      .transactions({ medicine: id, limit: 30 })
      .then((res) => setMovements(res.data))
      .finally(() => setMovementsLoading(false));
  }, [tab, id]);

  if (loading || !medicine) {
    return (
      <div>
        <PageHeader title="Loading…" />
        <Card>
          <TableSkeleton />
        </Card>
      </div>
    );
  }

  const handleDeactivate = async () => {
    setDeactivating(true);
    try {
      await medicinesApi.remove(medicine._id);
      toast.success('Medicine deactivated');
      setDeactivateOpen(false);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeactivating(false);
    }
  };

  const batchColumns = [
    { key: 'batchNumber', header: 'Batch #', render: (b) => <span className="font-medium text-ink">{b.batchNumber}</span> },
    { key: 'supplier', header: 'Supplier', render: (b) => b.supplier?.name || '—' },
    { key: 'expiryDate', header: 'Expiry', render: (b) => formatDate(b.expiryDate) },
    { key: 'remaining', header: 'Remaining', render: (b) => <span className="tabular-nums">{b.remainingQuantity} / {b.quantity}</span> },
    { key: 'sellingPrice', header: 'Price', render: (b) => formatCurrency(b.sellingPrice, settings.currency), className: 'tabular-nums' },
    { key: 'status', header: 'Status', render: batchStatusBadge },
  ];

  const movementColumns = [
    { key: 'createdAt', header: 'Date', render: (t) => formatDateTime(t.createdAt) },
    { key: 'batch', header: 'Batch', render: (t) => t.batch?.batchNumber || '—' },
    {
      key: 'type',
      header: 'Type',
      render: (t) => <Badge tone={t.quantity >= 0 ? 'success' : 'danger'}>{t.type.replace('_', ' ')}</Badge>,
    },
    { key: 'quantity', header: 'Change', render: (t) => <span className="tabular-nums">{t.quantity > 0 ? `+${t.quantity}` : t.quantity}</span> },
    { key: 'newQuantity', header: 'Batch Qty After', render: (t) => <span className="tabular-nums">{t.newQuantity}</span> },
    { key: 'user', header: 'By', render: (t) => t.user?.name || '—' },
  ];

  return (
    <div>
      <PageHeader
        breadcrumbs={<Breadcrumbs items={[{ label: 'Medicines', to: '/medicines' }, { label: medicine.name }]} />}
        title={medicine.name}
        description={[medicine.genericName, medicine.strength, medicine.dosageForm].filter(Boolean).join(' · ')}
        actions={
          <>
            {can(PERMISSIONS.MEDICINE_MANAGE) && (
              <>
                <Button variant="secondary" icon={Pencil} onClick={() => setEditOpen(true)}>
                  Edit
                </Button>
                {medicine.isActive && (
                  <Button variant="outlineDanger" icon={PowerOff} onClick={() => setDeactivateOpen(true)}>
                    Deactivate
                  </Button>
                )}
              </>
            )}
            {can(PERMISSIONS.BATCH_MANAGE) && (
              <Button icon={Plus} onClick={() => setBatchModalOpen(true)}>
                Add Batch
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <Card className="lg:col-span-1">
          <CardBody className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-ink-subtle">Overview</span>
              <Badge tone={medicine.isActive ? 'success' : 'danger'}>{medicine.isActive ? 'Active' : 'Inactive'}</Badge>
            </div>
            <dl className="flex flex-col gap-3 text-[13px]">
              <div className="flex justify-between gap-3">
                <dt className="text-ink-subtle">Category</dt>
                <dd className="text-right font-medium text-ink">{medicine.category?.name || '—'}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-subtle">Manufacturer</dt>
                <dd className="text-right font-medium text-ink">{medicine.manufacturer?.name || '—'}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-subtle">Barcode</dt>
                <dd className="text-right font-medium text-ink">{medicine.barcode || '—'}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-subtle">Purchase price</dt>
                <dd className="text-right font-medium tabular-nums text-ink">{formatCurrency(medicine.purchasePrice, settings.currency)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-subtle">Selling price</dt>
                <dd className="text-right font-medium tabular-nums text-ink">{formatCurrency(medicine.sellingPrice, settings.currency)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-subtle">Min stock level</dt>
                <dd className="text-right font-medium tabular-nums text-ink">{medicine.minStockLevel}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-subtle">Current stock</dt>
                <dd className="text-right">
                  <Badge tone={medicine.currentStock === 0 ? 'danger' : medicine.currentStock <= medicine.minStockLevel ? 'warning' : 'success'}>
                    {medicine.currentStock}
                  </Badge>
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-subtle">Prescription</dt>
                <dd className="text-right font-medium text-ink">{medicine.requiresPrescription ? 'Required' : 'Not required'}</dd>
              </div>
            </dl>
            {medicine.description && (
              <div className="border-t border-border pt-3">
                <p className="text-xs font-medium uppercase tracking-wide text-ink-subtle">Description</p>
                <p className="mt-1.5 text-[13px] text-ink-muted">{medicine.description}</p>
              </div>
            )}
          </CardBody>
        </Card>

        <Card className="lg:col-span-3">
          <Tabs
            className="px-5"
            tabs={[
              { value: 'batches', label: 'Batches', count: medicine.batches?.length },
              { value: 'movements', label: 'Stock Movements' },
            ]}
            active={tab}
            onChange={setTab}
          />
          {tab === 'batches' ? (
            <Table
              columns={batchColumns}
              data={medicine.batches || []}
              loading={false}
              emptyTitle="No batches yet"
              emptyDescription="Add the first batch to start tracking stock for this medicine."
              emptyAction={
                can(PERMISSIONS.BATCH_MANAGE) && (
                  <Button size="sm" icon={Plus} onClick={() => setBatchModalOpen(true)}>
                    Add Batch
                  </Button>
                )
              }
            />
          ) : (
            <Table columns={movementColumns} data={movements} loading={movementsLoading} emptyTitle="No stock movements yet" />
          )}
        </Card>
      </div>

      <MedicineFormDrawer
        open={editOpen}
        onClose={() => setEditOpen(false)}
        categories={categories}
        manufacturers={manufacturers}
        medicine={medicine}
        onSaved={load}
      />
      <AddBatchModal open={batchModalOpen} onClose={() => setBatchModalOpen(false)} medicine={medicine} onSaved={load} />
      <ConfirmDialog
        open={deactivateOpen}
        onClose={() => setDeactivateOpen(false)}
        onConfirm={handleDeactivate}
        loading={deactivating}
        title="Deactivate this medicine?"
        description="It will no longer appear in POS search or the active catalog. Existing batches and sale history are preserved."
        confirmLabel="Deactivate"
      />
    </div>
  );
}
