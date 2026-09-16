import { useState } from 'react';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { usersApi } from '../../api/misc.api';
import { toast } from '../../lib/toast';

const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'pharmacist', label: 'Pharmacist' },
  { value: 'cashier', label: 'Cashier' },
  { value: 'inventory_manager', label: 'Inventory Manager' },
];

const emptyForm = { name: '', email: '', password: '', roleName: 'cashier' };

export default function UserFormModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.email || !form.password) {
      setError('Name, email and password are required');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setSaving(true);
    try {
      await usersApi.create(form);
      toast.success('User created');
      setForm(emptyForm);
      onCreated();
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
      title="Add User"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={saving}>
            Create user
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-[13px] text-danger-soft-text">{error}</p>}
        <Input label="Full name" required value={form.name} onChange={update('name')} autoFocus />
        <Input label="Email" type="email" required value={form.email} onChange={update('email')} />
        <Input label="Temporary password" type="password" required value={form.password} onChange={update('password')} hint="At least 8 characters" />
        <Select label="Role" required value={form.roleName} onChange={update('roleName')}>
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </Select>
      </form>
    </Modal>
  );
}
