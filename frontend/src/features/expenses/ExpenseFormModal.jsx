import { useState } from 'react';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { expensesApi } from '../../api/expenses.api';
import { toast } from '../../lib/toast';

const CATEGORIES = ['rent', 'electricity', 'salaries', 'transportation', 'maintenance', 'supplies', 'other'];
const METHODS = ['cash', 'card', 'bank_transfer', 'other'];

const emptyForm = { category: 'other', amount: '', date: new Date().toISOString().slice(0, 10), description: '', paymentMethod: 'cash' };

export default function ExpenseFormModal({ open, onClose, onSaved }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.amount || Number(form.amount) <= 0) {
      setError('Amount must be a positive number');
      return;
    }
    setSaving(true);
    try {
      await expensesApi.create({ ...form, amount: Number(form.amount) });
      toast.success('Expense recorded');
      setForm(emptyForm);
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Record Expense"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={saving}>
            Save expense
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-[13px] text-danger-soft-text">{error}</p>}
        <div className="grid grid-cols-2 gap-3">
          <Select label="Category" value={form.category} onChange={update('category')}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <Input label="Amount" type="number" min="0.01" step="0.01" required value={form.amount} onChange={update('amount')} autoFocus />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Date" type="date" value={form.date} onChange={update('date')} />
          <Select label="Payment method" value={form.paymentMethod} onChange={update('paymentMethod')}>
            {METHODS.map((m) => (
              <option key={m} value={m}>
                {m.replace('_', ' ')}
              </option>
            ))}
          </Select>
        </div>
        <Input label="Description" value={form.description} onChange={update('description')} placeholder="What was this for?" />
      </form>
    </Modal>
  );
}
