import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Trash2, Search, AlertCircle } from 'lucide-react';
import { suppliersApi } from '../../api/suppliers.api';
import { medicinesApi } from '../../api/medicines.api';
import { purchasesApi } from '../../api/purchases.api';
import { useSettings } from '../../context/SettingsContext';
import { useDebounce } from '../../hooks/useDebounce';
import { formatCurrency } from '../../lib/formatCurrency';
import { toast } from '../../lib/toast';
import PageHeader from '../../components/ui/PageHeader';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import { Card, CardBody } from '../../components/ui/Card';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';

let rowKey = 0;

export default function NewPurchase() {
  const navigate = useNavigate();
  const settings = useSettings();
  const [searchParams] = useSearchParams();
  const preselectedSupplier = searchParams.get('supplier') || '';

  const [suppliers, setSuppliers] = useState([]);
  const [supplierId, setSupplierId] = useState(preselectedSupplier);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [discount, setDiscount] = useState('0');
  const [tax, setTax] = useState('0');
  const [amountPaid, setAmountPaid] = useState('0');
  const [paidTouched, setPaidTouched] = useState(false);

  const [medQuery, setMedQuery] = useState('');
  const debouncedMedQuery = useDebounce(medQuery, 250);
  const [medResults, setMedResults] = useState([]);
  const [lines, setLines] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    suppliersApi.list({ limit: 100 }).then((res) => setSuppliers(res.data));
  }, []);

  useEffect(() => {
    if (!debouncedMedQuery.trim()) {
      setMedResults([]);
      return;
    }
    medicinesApi.list({ query: debouncedMedQuery, limit: 6 }).then((res) => setMedResults(res.data));
  }, [debouncedMedQuery]);

  const addLine = (medicine) => {
    rowKey += 1;
    setLines((ls) => [
      ...ls,
      {
        key: rowKey,
        medicineId: medicine._id,
        name: medicine.name,
        unit: medicine.unit,
        batchNumber: '',
        expiryDate: '',
        quantity: 1,
        purchasePrice: medicine.purchasePrice,
        sellingPrice: medicine.sellingPrice,
      },
    ]);
    setMedQuery('');
    setMedResults([]);
  };

  const updateLine = (key, field, value) => {
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, [field]: value } : l)));
  };

  const removeLine = (key) => setLines((ls) => ls.filter((l) => l.key !== key));

  const subtotal = lines.reduce((sum, l) => sum + (Number(l.purchasePrice) || 0) * (Number(l.quantity) || 0), 0);
  const total = Math.max(subtotal - (Number(discount) || 0), 0) + (Number(tax) || 0);

  useEffect(() => {
    if (!paidTouched) setAmountPaid(total.toFixed(2));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total, paidTouched]);

  const handleSubmit = async () => {
    setError('');
    if (!supplierId) return setError('Select a supplier');
    if (lines.length === 0) return setError('Add at least one item');
    for (const l of lines) {
      if (!l.batchNumber || !l.expiryDate || !l.quantity || l.quantity <= 0) {
        return setError('Every line needs a batch number, expiry date and positive quantity');
      }
    }

    setSubmitting(true);
    try {
      const purchase = await purchasesApi.create({
        supplierId,
        invoiceNumber: invoiceNumber || undefined,
        discount: Number(discount) || 0,
        tax: Number(tax) || 0,
        amountPaid: Number(amountPaid) || 0,
        items: lines.map((l) => ({
          medicineId: l.medicineId,
          batchNumber: l.batchNumber,
          expiryDate: l.expiryDate,
          quantity: Number(l.quantity),
          purchasePrice: Number(l.purchasePrice),
          sellingPrice: Number(l.sellingPrice),
        })),
      });
      toast.success(`Purchase ${purchase.invoiceNumber} recorded`);
      navigate(`/purchases/${purchase._id}`);
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        breadcrumbs={<Breadcrumbs items={[{ label: 'Purchases', to: '/purchases' }, { label: 'New Purchase' }]} />}
        title="New Purchase"
        description="Receive new stock from a supplier — each item creates a fresh batch."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card>
            <CardBody className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Select label="Supplier" required value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                <option value="">Select supplier</option>
                {suppliers.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </Select>
              <Input label="Invoice / reference number" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder="Auto-generated if left blank" />
            </CardBody>
          </Card>

          <Card>
            <div className="border-b border-border p-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" />
                <input
                  value={medQuery}
                  onChange={(e) => setMedQuery(e.target.value)}
                  placeholder="Search medicine to add a line item…"
                  className="h-10 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm text-ink placeholder:text-ink-subtle outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                {medResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-20 mt-1.5 max-h-64 overflow-y-auto rounded-lg border border-border bg-surface py-1 shadow-lg shadow-black/10">
                    {medResults.map((m) => (
                      <button
                        key={m._id}
                        onClick={() => addLine(m)}
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-[13px] hover:bg-surface-alt"
                      >
                        <span className="font-medium text-ink">{m.name}</span>
                        <span className="text-ink-subtle">{formatCurrency(m.purchasePrice, settings.currency)} cost</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {lines.length === 0 ? (
              <EmptyState title="No items yet" description="Search above and select a medicine to add it as a line item." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-ink-subtle">
                      <th className="px-4 py-2.5">Medicine</th>
                      <th className="px-4 py-2.5">Batch #</th>
                      <th className="px-4 py-2.5">Expiry</th>
                      <th className="px-4 py-2.5 text-right">Qty</th>
                      <th className="px-4 py-2.5 text-right">Cost</th>
                      <th className="px-4 py-2.5 text-right">Sell</th>
                      <th className="px-4 py-2.5 text-right">Line Total</th>
                      <th className="px-4 py-2.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((l) => (
                      <tr key={l.key} className="border-b border-border last:border-0">
                        <td className="px-4 py-2 font-medium text-ink">{l.name}</td>
                        <td className="px-4 py-2">
                          <input
                            value={l.batchNumber}
                            onChange={(e) => updateLine(l.key, 'batchNumber', e.target.value)}
                            className="h-8 w-28 rounded-md border border-border bg-surface px-2 text-[13px] outline-none focus:border-primary"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="date"
                            value={l.expiryDate}
                            onChange={(e) => updateLine(l.key, 'expiryDate', e.target.value)}
                            className="h-8 w-36 rounded-md border border-border bg-surface px-2 text-[13px] outline-none focus:border-primary"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            min="1"
                            value={l.quantity}
                            onChange={(e) => updateLine(l.key, 'quantity', e.target.value)}
                            className="h-8 w-20 rounded-md border border-border bg-surface px-2 text-right text-[13px] outline-none focus:border-primary"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={l.purchasePrice}
                            onChange={(e) => updateLine(l.key, 'purchasePrice', e.target.value)}
                            className="h-8 w-20 rounded-md border border-border bg-surface px-2 text-right text-[13px] outline-none focus:border-primary"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={l.sellingPrice}
                            onChange={(e) => updateLine(l.key, 'sellingPrice', e.target.value)}
                            className="h-8 w-20 rounded-md border border-border bg-surface px-2 text-right text-[13px] outline-none focus:border-primary"
                          />
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums font-medium text-ink">
                          {formatCurrency((Number(l.purchasePrice) || 0) * (Number(l.quantity) || 0), settings.currency)}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <button onClick={() => removeLine(l.key)} className="text-ink-subtle hover:text-danger">
                            <Trash2 className="size-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        <Card>
          <CardBody className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-ink">Summary</p>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Discount" type="number" min="0" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} />
              <Input label="Tax" type="number" min="0" step="0.01" value={tax} onChange={(e) => setTax(e.target.value)} />
            </div>
            <Input
              label="Amount paid now"
              type="number"
              min="0"
              step="0.01"
              value={amountPaid}
              onChange={(e) => {
                setAmountPaid(e.target.value);
                setPaidTouched(true);
              }}
              hint="Leave less than the total to record a payable balance"
            />

            <div className="flex flex-col gap-1 border-t border-border pt-3 text-[13px]">
              <div className="flex justify-between text-ink-subtle">
                <span>Subtotal</span>
                <span className="tabular-nums">{formatCurrency(subtotal, settings.currency)}</span>
              </div>
              <div className="flex justify-between text-base font-semibold text-ink">
                <span>Total</span>
                <span className="tabular-nums">{formatCurrency(total, settings.currency)}</span>
              </div>
            </div>

            {error && (
              <p className="flex items-start gap-1.5 rounded-lg bg-danger-soft px-3 py-2 text-[13px] text-danger-soft-text">
                <AlertCircle className="mt-0.5 size-3.5 shrink-0" /> {error}
              </p>
            )}

            <Button size="lg" icon={Plus} onClick={handleSubmit} loading={submitting}>
              Record Purchase
            </Button>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
