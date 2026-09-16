import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { expensesApi } from '../../api/expenses.api';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { formatCurrency } from '../../lib/formatCurrency';
import { formatDate } from '../../lib/formatDate';
import { PERMISSIONS } from '../../lib/permissions';
import { toast } from '../../lib/toast';
import PageHeader from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import Pagination from '../../components/ui/Pagination';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import ExpenseFormModal from './ExpenseFormModal';

const CATEGORIES = ['rent', 'electricity', 'salaries', 'transportation', 'maintenance', 'supplies', 'other'];

export default function Expenses() {
  const { can } = useAuth();
  const settings = useSettings();
  const [category, setCategory] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [expenses, setExpenses] = useState([]);
  const [meta, setMeta] = useState({ total: 0, pages: 1, sumAmount: 0 });
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    expensesApi
      .list({ category: category || undefined, from: from || undefined, to: to || undefined, page, limit: 15 })
      .then((res) => {
        setExpenses(res.data);
        setMeta(res.meta);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [category, from, to, page]);
  useEffect(() => setPage(1), [category, from, to]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await expensesApi.remove(deleteTarget._id);
      toast.success('Expense deleted');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const canManage = can(PERMISSIONS.EXPENSE_MANAGE);

  const columns = [
    {
      key: 'description',
      header: 'Expense',
      render: (e) => (
        <div>
          <p className="font-medium capitalize text-ink">{e.category}</p>
          <p className="text-xs text-ink-subtle">{e.description || '—'}</p>
        </div>
      ),
    },
    { key: 'date', header: 'Date', render: (e) => formatDate(e.date) },
    { key: 'paymentMethod', header: 'Method', render: (e) => <span className="capitalize">{e.paymentMethod?.replace('_', ' ')}</span> },
    { key: 'createdBy', header: 'Recorded by', render: (e) => e.createdBy?.name || '—' },
    { key: 'amount', header: 'Amount', render: (e) => formatCurrency(e.amount, settings.currency), className: 'tabular-nums font-medium' },
    ...(canManage
      ? [
          {
            key: 'actions',
            header: '',
            render: (e) => (
              <button onClick={() => setDeleteTarget(e)} className="text-ink-subtle hover:text-danger">
                <Trash2 className="size-3.5" />
              </button>
            ),
          },
        ]
      : []),
  ];

  return (
    <div>
      <PageHeader
        title="Expenses"
        description="Operating costs — rent, salaries, utilities and more."
        actions={
          canManage && (
            <Button icon={Plus} onClick={() => setModalOpen(true)}>
              Record Expense
            </Button>
          )
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-[13px] font-medium text-ink-subtle">Total (filtered)</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-ink">{formatCurrency(meta.sumAmount, settings.currency)}</p>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
          <Select value={category} onChange={(e) => setCategory(e.target.value)} className="sm:max-w-[180px]">
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} containerClassName="sm:max-w-[160px]" />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} containerClassName="sm:max-w-[160px]" />
        </div>
        <Table columns={columns} data={expenses} loading={loading} emptyTitle="No expenses recorded" emptyDescription="Record rent, salaries or other operating costs here." />
        <Pagination page={meta.page || page} pages={meta.pages} total={meta.total} limit={15} onChange={setPage} />
      </Card>

      <ExpenseFormModal open={modalOpen} onClose={() => setModalOpen(false)} onSaved={load} />
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete this expense?"
        description={deleteTarget ? `${deleteTarget.category} — ${formatCurrency(deleteTarget.amount, settings.currency)}` : ''}
        confirmLabel="Delete"
      />
    </div>
  );
}
