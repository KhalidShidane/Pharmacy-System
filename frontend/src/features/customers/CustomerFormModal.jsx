import { useState } from 'react';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { customersApi } from '../../api/customers.api';
import { toast } from '../../lib/toast';

const emptyForm = { name: '', phone: '', email: '', address: '', creditLimit: 0 };

export default function CustomerFormModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.phone) {
      setError('Name and phone are required');
      return;
    }
    setSaving(true);
    try {
      const customer = await customersApi.create({ ...form, creditLimit: Number(form.creditLimit) || 0 });
      toast.success('Customer added');
      setForm(emptyForm);
      onCreated(customer);
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
      title="Add Customer"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={saving}>
            Add customer
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-[13px] text-danger-soft-text">{error}</p>}
        <Input label="Full name" required value={form.name} onChange={update('name')} autoFocus />
        <Input label="Phone" required value={form.phone} onChange={update('phone')} />
        <Input label="Email" type="email" value={form.email} onChange={update('email')} />
        <Input label="Address" value={form.address} onChange={update('address')} />
        <Input label="Credit limit" type="number" min="0" step="0.01" value={form.creditLimit} onChange={update('creditLimit')} hint="Maximum debt this customer can carry" />
      </form>
    </Modal>
  );
}
