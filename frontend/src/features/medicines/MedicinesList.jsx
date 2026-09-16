import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { medicinesApi } from '../../api/medicines.api';
import { categoriesApi, manufacturersApi } from '../../api/misc.api';
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
import Select from '../../components/ui/Select';
import Pagination from '../../components/ui/Pagination';
import MedicineFormDrawer from './MedicineFormDrawer';

function stockBadge(medicine) {
  if (medicine.currentStock === 0) return <Badge tone="danger">Out of stock</Badge>;
  if (medicine.currentStock <= medicine.minStockLevel) return <Badge tone="warning">Low · {medicine.currentStock}</Badge>;
  return <Badge tone="success">{medicine.currentStock} in stock</Badge>;
}

export default function MedicinesList() {
  const { can } = useAuth();
  const settings = useSettings();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const debouncedQuery = useDebounce(query, 300);

  const [medicines, setMedicines] = useState([]);
  const [meta, setMeta] = useState({ total: 0, pages: 1 });
  const [categories, setCategories] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    Promise.all([categoriesApi.list(), manufacturersApi.list()]).then(([c, m]) => {
      setCategories(c);
      setManufacturers(m);
    });
  }, []);

  const load = () => {
    setLoading(true);
    medicinesApi
      .list({ query: debouncedQuery || undefined, category: category || undefined, page, limit: 12 })
      .then((res) => {
        setMedicines(res.data);
        setMeta(res.meta);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [debouncedQuery, category, page]);
  useEffect(() => setPage(1), [debouncedQuery, category]);

  const columns = [
    {
      key: 'name',
      header: 'Medicine',
      render: (m) => (
        <div>
          <p className="font-medium text-ink">{m.name}</p>
          <p className="text-xs text-ink-subtle">{m.genericName || m.brand || '—'}</p>
        </div>
      ),
    },
    { key: 'category', header: 'Category', render: (m) => m.category?.name || '—' },
    { key: 'sellingPrice', header: 'Price', render: (m) => formatCurrency(m.sellingPrice, settings.currency), className: 'tabular-nums' },
    { key: 'stock', header: 'Stock', render: stockBadge },
    {
      key: 'status',
      header: 'Status',
      render: (m) => <Badge tone={m.isActive ? 'neutral' : 'danger'}>{m.isActive ? 'Active' : 'Inactive'}</Badge>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Medicines"
        description="Manage your medicine catalog, pricing and batches."
        actions={
          can(PERMISSIONS.MEDICINE_MANAGE) && (
            <Button
              icon={Plus}
              onClick={() => {
                setEditing(null);
                setDrawerOpen(true);
              }}
            >
              Add Medicine
            </Button>
          )
        }
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
          <SearchField value={query} onChange={setQuery} placeholder="Search by name, generic name or barcode…" className="sm:max-w-sm" />
          <Select value={category} onChange={(e) => setCategory(e.target.value)} className="sm:max-w-[200px]">
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>

        <Table
          columns={columns}
          data={medicines}
          loading={loading}
          onRowClick={(m) => navigate(`/medicines/${m._id}`)}
          emptyTitle="No medicines found"
          emptyDescription="Try adjusting your search or add a new medicine to the catalog."
        />
        <Pagination page={meta.page || page} pages={meta.pages} total={meta.total} limit={12} onChange={setPage} />
      </Card>

      <MedicineFormDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        categories={categories}
        manufacturers={manufacturers}
        medicine={editing}
        onSaved={load}
      />
    </div>
  );
}
