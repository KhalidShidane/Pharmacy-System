import { useEffect, useState } from 'react';
import Drawer from '../../components/ui/Drawer';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { medicinesApi } from '../../api/medicines.api';
import { toast } from '../../lib/toast';

const DOSAGE_FORMS = ['tablet', 'capsule', 'syrup', 'injection', 'cream', 'drops', 'inhaler', 'other'];

const emptyForm = {
  name: '',
  genericName: '',
  brand: '',
  category: '',
  manufacturer: '',
  dosageForm: 'tablet',
  strength: '',
  unit: 'unit',
  barcode: '',
  requiresPrescription: false,
  purchasePrice: '',
  sellingPrice: '',
  minStockLevel: 10,
  description: '',
};

export default function MedicineFormDrawer({ open, onClose, categories, manufacturers, medicine, onSaved }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (medicine) {
      setForm({
        name: medicine.name || '',
        genericName: medicine.genericName || '',
        brand: medicine.brand || '',
        category: medicine.category?._id || medicine.category || '',
        manufacturer: medicine.manufacturer?._id || medicine.manufacturer || '',
        dosageForm: medicine.dosageForm || 'tablet',
        strength: medicine.strength || '',
        unit: medicine.unit || 'unit',
        barcode: medicine.barcode || '',
        requiresPrescription: Boolean(medicine.requiresPrescription),
        purchasePrice: medicine.purchasePrice ?? '',
        sellingPrice: medicine.sellingPrice ?? '',
        minStockLevel: medicine.minStockLevel ?? 10,
        description: medicine.description || '',
      });
    } else {
      setForm({ ...emptyForm, category: categories[0]?._id || '' });
    }
    setError('');
  }, [medicine, open, categories]);

  const update = (field) => (e) => {
    const value = e?.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e;
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.category || form.purchasePrice === '' || form.sellingPrice === '') {
      setError('Name, category, purchase price and selling price are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        manufacturer: form.manufacturer || undefined,
        barcode: form.barcode || undefined,
        purchasePrice: Number(form.purchasePrice),
        sellingPrice: Number(form.sellingPrice),
        minStockLevel: Number(form.minStockLevel),
      };
      if (medicine) {
        await medicinesApi.update(medicine._id, payload);
        toast.success('Medicine updated');
      } else {
        await medicinesApi.create(payload);
        toast.success('Medicine created');
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
    <Drawer
      open={open}
      onClose={onClose}
      title={medicine ? 'Edit Medicine' : 'Add Medicine'}
      description={medicine ? medicine.name : 'Create a new medicine record'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={saving}>
            {medicine ? 'Save changes' : 'Create medicine'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-[13px] text-danger-soft-text">{error}</p>}

        <Input label="Medicine name" required value={form.name} onChange={update('name')} placeholder="Paracetamol 500mg" />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Generic name" value={form.genericName} onChange={update('genericName')} />
          <Input label="Brand" value={form.brand} onChange={update('brand')} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select label="Category" required value={form.category} onChange={update('category')}>
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Select label="Manufacturer" value={form.manufacturer} onChange={update('manufacturer')}>
            <option value="">None</option>
            {manufacturers.map((m) => (
              <option key={m._id} value={m._id}>
                {m.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Select label="Dosage form" value={form.dosageForm} onChange={update('dosageForm')}>
            {DOSAGE_FORMS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </Select>
          <Input label="Strength" value={form.strength} onChange={update('strength')} placeholder="500mg" />
          <Input label="Unit" value={form.unit} onChange={update('unit')} placeholder="tablet" />
        </div>

        <Input label="Barcode" value={form.barcode} onChange={update('barcode')} placeholder="Scan or enter barcode" />

        <div className="grid grid-cols-2 gap-3">
          <Input label="Purchase price" required type="number" step="0.01" min="0" value={form.purchasePrice} onChange={update('purchasePrice')} />
          <Input label="Selling price" required type="number" step="0.01" min="0" value={form.sellingPrice} onChange={update('sellingPrice')} />
        </div>

        <Input
          label="Minimum stock level"
          type="number"
          min="0"
          value={form.minStockLevel}
          onChange={update('minStockLevel')}
          hint="Triggers a low-stock alert at or below this quantity"
        />

        <label className="flex items-center gap-2 text-[13px] text-ink-muted">
          <input type="checkbox" checked={form.requiresPrescription} onChange={update('requiresPrescription')} className="size-4 rounded border-border accent-[var(--color-primary)]" />
          Requires prescription
        </label>

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-ink-muted">Description</label>
          <textarea
            rows={3}
            value={form.description}
            onChange={update('description')}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </form>
    </Drawer>
  );
}
