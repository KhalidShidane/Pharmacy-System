import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { customersApi } from '../../api/customers.api';
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
import CustomerFormModal from './CustomerFormModal';

export default function Customers() {
  const { can } = useAuth();
  const settings = useSettings();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const [page, setPage] = useState(1);
  const [customers, setCustomers] = useState([]);
  const [meta, setMeta] = useState({ total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const load = () => {
    setLoading(true);
    customersApi
      .list({ query: debouncedQuery || undefined, page, limit: 12 })
      .then((res) => {
        setCustomers(res.data);
        setMeta(res.meta);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [debouncedQuery, page]);
  useEffect(() => setPage(1), [debouncedQuery]);

  const columns = [
    {
      key: 'name',
      header: 'Customer',
      render: (c) => (
        <div>
          <p className="font-medium text-ink">{c.name}</p>
          <p className="text-xs text-ink-subtle">{c.phone}</p>
        </div>
      ),
    },
    { key: 'email', header: 'Email', render: (c) => c.email || '—' },
    { key: 'creditLimit', header: 'Credit Limit', render: (c) => formatCurrency(c.creditLimit, settings.currency), className: 'tabular-nums' },
    {
      key: 'outstandingDebt',
      header: 'Outstanding Debt',
      render: (c) => (
        <span className="tabular-nums">
          <Badge tone={c.outstandingDebt > c.creditLimit ? 'danger' : c.outstandingDebt > 0 ? 'warning' : 'success'}>
            {formatCurrency(c.outstandingDebt, settings.currency)}
          </Badge>
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Manage customer records, credit limits and outstanding balances."
        actions={
          can(PERMISSIONS.CUSTOMER_MANAGE) && (
            <Button icon={Plus} onClick={() => setModalOpen(true)}>
              Add Customer
            </Button>
          )
        }
      />

      <Card>
        <div className="border-b border-border p-4">
          <SearchField value={query} onChange={setQuery} placeholder="Search by name or phone…" className="max-w-sm" />
        </div>
        <Table columns={columns} data={customers} loading={loading} emptyTitle="No customers yet" emptyDescription="Add a customer to start tracking credit sales." />
        <Pagination page={meta.page || page} pages={meta.pages} total={meta.total} limit={12} onChange={setPage} />
      </Card>

      <CustomerFormModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={load} />
    </div>
  );
}
