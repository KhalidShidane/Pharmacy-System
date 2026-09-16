import { useEffect, useState } from 'react';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { suppliersApi } from '../../api/suppliers.api';
import { toast } from '../../lib/toast';

const emptyForm = { name: '', contactPerson: '', phone: '', email: '', address: '' };

export default function SupplierFormModal({ open, onClose, supplier, onSaved }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (supplier) {
      setForm({
        name: supplier.name || '',
        contactPerson: supplier.contactPerson || '',
        phone: supplier.phone || '',
        email: supplier.email || '',
        address: supplier.address || '',
      });
    } else {
      setForm(emptyForm);
    }
    setError('');
  }, [supplier, open]);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name) {
      setError('Supplier name is required');
      return;
    }
    setSaving(true);
    try {
      if (supplier) {
        await suppliersApi.update(supplier._id, form);
        toast.success('Supplier updated');
      } else {
        await suppliersApi.create(form);
        toast.success('Supplier added');
      }
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
      title={supplier ? 'Edit Supplier' : 'Add Supplier'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={saving}>
            {supplier ? 'Save changes' : 'Add supplier'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-[13px] text-danger-soft-text">{error}</p>}
        <Input label="Supplier name" required value={form.name} onChange={update('name')} autoFocus />
        <Input label="Contact person" value={form.contactPerson} onChange={update('contactPerson')} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Phone" value={form.phone} onChange={update('phone')} />
          <Input label="Email" type="email" value={form.email} onChange={update('email')} />
        </div>
        <Input label="Address" value={form.address} onChange={update('address')} />
      </form>
    </Modal>
  );
}
