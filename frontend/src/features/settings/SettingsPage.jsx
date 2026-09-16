import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { settingsApi } from '../../api/misc.api';
import { useSettings, useSettingsUpdater } from '../../context/SettingsContext';
import { toast } from '../../lib/toast';
import PageHeader from '../../components/ui/PageHeader';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'KES', 'SOS', 'AED', 'INR'];

export default function SettingsPage() {
  const settings = useSettings();
  const setSettings = useSettingsUpdater();
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);

  useEffect(() => setForm(settings), [settings]);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await settingsApi.update({ ...form, taxRate: Number(form.taxRate) || 0 });
      setSettings(updated);
      toast.success('Settings saved');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Settings" description="Pharmacy identity, currency and receipt details." />

      <Card className="max-w-2xl">
        <CardHeader title="Pharmacy details" subtitle="Used across receipts, invoices and reports" />
        <CardBody>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input label="Pharmacy name" value={form.pharmacyName} onChange={update('pharmacyName')} />
            <div className="grid grid-cols-2 gap-4">
              <Select label="Currency" value={form.currency} onChange={update('currency')}>
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
              <Input label="Tax rate (%)" type="number" min="0" step="0.01" value={form.taxRate} onChange={update('taxRate')} />
            </div>
            <Input label="Address" value={form.address} onChange={update('address')} />
            <Input label="Phone" value={form.phone} onChange={update('phone')} />
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-ink-muted">Receipt footer</label>
              <textarea
                rows={2}
                value={form.receiptFooter}
                onChange={update('receiptFooter')}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <Button type="submit" icon={Save} loading={saving}>
                Save changes
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
