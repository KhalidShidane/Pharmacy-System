import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { suppliersApi } from '../../api/suppliers.api';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { useDebounce } from '../../hooks/useDebounce';
import { formatCurrency } from '../../lib/formatCurrency';
import { PERMISSIONS } from '../../lib/permissions';
import PageHeader from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import SearchField from '../../components/ui/SearchField';
import Pagination from '../../components/ui/Pagination';
import SupplierFormModal from './SupplierFormModal';

export default function Suppliers() {
  const { can } = useAuth();
  const settings = useSettings();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const [page, setPage] = useState(1);
  const [suppliers, setSuppliers] = useState([]);
  const [meta, setMeta] = useState({ total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const load = () => {
    setLoading(true);
    suppliersApi
      .list({ query: debouncedQuery || undefined, page, limit: 12 })
      .then((res) => {
        setSuppliers(res.data);
        setMeta(res.meta);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [debouncedQuery, page]);
  useEffect(() => setPage(1), [debouncedQuery]);

  const columns = [
    {
      key: 'name',
      header: 'Supplier',
      render: (s) => (
        <div>
          <p className="font-medium text-ink">{s.name}</p>
          <p className="text-xs text-ink-subtle">{s.contactPerson || s.phone || '—'}</p>
        </div>
      ),
    },
    { key: 'phone', header: 'Phone', render: (s) => s.phone || '—' },
    { key: 'email', header: 'Email', render: (s) => s.email || '—' },
    {
      key: 'payable',
      header: 'Payable',
      render: (s) => (
        <Badge tone={s.payable > 0 ? 'warning' : 'success'}>{formatCurrency(s.payable, settings.currency)}</Badge>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Suppliers"
        description="Manage vendors, contacts and outstanding payables."
        actions={
          can(PERMISSIONS.SUPPLIER_MANAGE) && (
            <Button icon={Plus} onClick={() => setModalOpen(true)}>
              Add Supplier
            </Button>
          )
        }
      />

      <Card>
        <div className="border-b border-border p-4">
          <SearchField value={query} onChange={setQuery} placeholder="Search by name, contact or phone…" className="max-w-sm" />
        </div>
        <Table
          columns={columns}
          data={suppliers}
          loading={loading}
          onRowClick={(s) => navigate(`/suppliers/${s._id}`)}
          emptyTitle="No suppliers yet"
          emptyDescription="Add a supplier to start recording purchases."
        />
        <Pagination page={meta.page || page} pages={meta.pages} total={meta.total} limit={12} onChange={setPage} />
      </Card>

      <SupplierFormModal open={modalOpen} onClose={() => setModalOpen(false)} onSaved={load} />
    </div>
  );
}
