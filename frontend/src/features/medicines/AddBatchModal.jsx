import { useState } from 'react';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { medicinesApi } from '../../api/medicines.api';
import { toast } from '../../lib/toast';

const emptyForm = { batchNumber: '', expiryDate: '', purchasePrice: '', sellingPrice: '', quantity: '' };

export default function AddBatchModal({ open, onClose, medicine, onSaved }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.batchNumber || !form.expiryDate || !form.quantity || form.purchasePrice === '' || form.sellingPrice === '') {
      setError('All fields are required');
      return;
    }
    setSaving(true);
    try {
      await medicinesApi.addBatch(medicine._id, {
        batchNumber: form.batchNumber,
        expiryDate: form.expiryDate,
        purchasePrice: Number(form.purchasePrice),
        sellingPrice: Number(form.sellingPrice),
        quantity: Number(form.quantity),
      });
      toast.success('Batch added to inventory');
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
      title="Add Batch"
      description={medicine?.name}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={saving}>
            Add batch
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-[13px] text-danger-soft-text">{error}</p>}
        <div className="grid grid-cols-2 gap-3">
          <Input label="Batch number" required value={form.batchNumber} onChange={update('batchNumber')} placeholder="e.g. PARA-2026-02" />
          <Input label="Expiry date" required type="date" value={form.expiryDate} onChange={update('expiryDate')} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Input label="Quantity" required type="number" min="1" value={form.quantity} onChange={update('quantity')} />
          <Input label="Purchase price" required type="number" step="0.01" min="0" value={form.purchasePrice} onChange={update('purchasePrice')} />
          <Input label="Selling price" required type="number" step="0.01" min="0" value={form.sellingPrice} onChange={update('sellingPrice')} />
        </div>
      </form>
    </Modal>
  );
}
