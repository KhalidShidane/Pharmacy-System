import { useEffect, useRef, useState } from 'react';
import { Minus, Plus, Trash2, ShoppingCart, ScanLine, AlertCircle } from 'lucide-react';
import { medicinesApi } from '../../api/medicines.api';
import { categoriesApi } from '../../api/misc.api';
import { salesApi } from '../../api/sales.api';
import { useSettings } from '../../context/SettingsContext';
import { useDebounce } from '../../hooks/useDebounce';
import { formatCurrency } from '../../lib/formatCurrency';
import { cn } from '../../lib/cn';
import { toast } from '../../lib/toast';
import PageHeader from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import Receipt from '../../components/receipts/Receipt';
import { useCart } from './useCart';
import CustomerPicker from './CustomerPicker';
import SaleSuccessModal from './SaleSuccessModal';

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'other', label: 'Other' },
];

export default function Pos() {
  const settings = useSettings();
  const cart = useCart();
  const searchRef = useRef(null);

  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState([]);
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const debouncedQuery = useDebounce(query, 200);

  const [customer, setCustomer] = useState(null);
  const [discount, setDiscount] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountPaid, setAmountPaid] = useState('0');
  const [paidTouched, setPaidTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [completedSale, setCompletedSale] = useState(null);

  useEffect(() => {
    categoriesApi.list().then(setCategories);
    searchRef.current?.focus();
  }, []);

  useEffect(() => {
    setSearching(true);
    medicinesApi
      .list({ query: debouncedQuery || undefined, category: categoryId || undefined, limit: 12 })
      .then((res) => setResults(res.data))
      .finally(() => setSearching(false));
  }, [debouncedQuery, categoryId]);

  const taxRate = settings.taxRate || 0;
  const orderDiscount = Number(discount) || 0;
  const taxableBase = Math.max(cart.subtotal - orderDiscount, 0);
  const tax = Math.round(taxableBase * (taxRate / 100) * 100) / 100;
  const total = Math.round((taxableBase + tax) * 100) / 100;

  useEffect(() => {
    if (!paidTouched) setAmountPaid(total.toFixed(2));
  }, [total, paidTouched]);

  const balanceDue = Math.max(total - (Number(amountPaid) || 0), 0);

  const handleAddByBarcode = async () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    const exact = results.find((m) => m.barcode === trimmed);
    if (exact) {
      cart.addItem(exact);
      setQuery('');
      return;
    }
    try {
      const res = await medicinesApi.list({ barcode: trimmed, limit: 1 });
      if (res.data[0]) {
        cart.addItem(res.data[0]);
        setQuery('');
      }
    } catch {
      /* no exact match, leave results as-is */
    }
  };

  const resetForNewSale = () => {
    cart.clear();
    setCustomer(null);
    setDiscount('0');
    setPaymentMethod('cash');
    setAmountPaid('0');
    setPaidTouched(false);
    setCompletedSale(null);
    setError('');
    searchRef.current?.focus();
  };

  const handleCheckout = async () => {
    setError('');
    if (cart.items.length === 0) {
      setError('Add at least one item to the cart');
      return;
    }
    setSubmitting(true);
    try {
      const sale = await salesApi.create({
        items: cart.items.map((i) => ({ medicineId: i.medicineId, quantity: i.quantity, discount: i.discount })),
        customerId: customer?._id,
        discount: orderDiscount,
        amountPaid: Number(amountPaid) || 0,
        paymentMethod,
      });
      toast.success(`Sale ${sale.invoiceNumber} completed`);
      setCompletedSale(sale);
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader title="Point of Sale" description="Search or scan a medicine to add it to the cart." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card className="p-4">
            <div className="relative">
              <ScanLine className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddByBarcode()}
                placeholder="Scan barcode or search medicine by name…"
                className="h-11 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm text-ink placeholder:text-ink-subtle outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <button
                onClick={() => setCategoryId('')}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  categoryId === '' ? 'border-primary bg-primary-soft text-primary-soft-text' : 'border-border text-ink-muted hover:bg-surface-alt'
                )}
              >
                All
              </button>
              {categories.map((c) => (
                <button
                  key={c._id}
                  onClick={() => setCategoryId(c._id)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    categoryId === c._id ? 'border-primary bg-primary-soft text-primary-soft-text' : 'border-border text-ink-muted hover:bg-surface-alt'
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </Card>

          <Card>
            {searching && results.length === 0 ? (
              <div className="p-4 text-center text-[13px] text-ink-subtle">Searching…</div>
            ) : results.length === 0 ? (
              <EmptyState title="No medicines found" description="Try a different search term or category." />
            ) : (
              <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
                {results.map((m) => {
                  const outOfStock = m.currentStock <= 0;
                  return (
                    <button
                      key={m._id}
                      disabled={outOfStock}
                      onClick={() => cart.addItem(m)}
                      className={cn(
                        'flex flex-col gap-2 rounded-lg border border-border bg-surface p-3.5 text-left transition-colors',
                        outOfStock ? 'cursor-not-allowed opacity-50' : 'hover:border-primary/40 hover:bg-primary-soft/40'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[13px] font-medium leading-tight text-ink">{m.name}</p>
                        <Badge tone={outOfStock ? 'danger' : m.currentStock <= m.minStockLevel ? 'warning' : 'neutral'} className="shrink-0">
                          {m.currentStock}
                        </Badge>
                      </div>
                      <p className="text-xs text-ink-subtle">{m.category?.name}</p>
                      <p className="tabular-nums text-sm font-semibold text-ink">{formatCurrency(m.sellingPrice, settings.currency)}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card className="flex flex-col">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <ShoppingCart className="size-4 text-ink-muted" />
              <p className="text-sm font-semibold text-ink">Cart</p>
              {cart.itemCount > 0 && <Badge tone="primary">{cart.itemCount}</Badge>}
            </div>

            {cart.items.length === 0 ? (
              <EmptyState title="Cart is empty" description="Add medicines from the left to start a sale." className="py-10" />
            ) : (
              <div className="flex max-h-80 flex-col divide-y divide-border overflow-y-auto">
                {cart.items.map((item) => (
                  <div key={item.medicineId} className="flex items-start justify-between gap-2 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-ink">{item.name}</p>
                      <p className="text-xs text-ink-subtle">{formatCurrency(item.unitPrice, settings.currency)} each</p>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <button
                          onClick={() => cart.setQuantity(item.medicineId, item.quantity - 1)}
                          className="flex size-6 items-center justify-center rounded-md border border-border text-ink-muted hover:bg-surface-alt"
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="w-7 text-center text-[13px] tabular-nums text-ink">{item.quantity}</span>
                        <button
                          onClick={() => cart.setQuantity(item.medicineId, item.quantity + 1)}
                          disabled={item.quantity >= item.availableStock}
                          className="flex size-6 items-center justify-center rounded-md border border-border text-ink-muted hover:bg-surface-alt disabled:opacity-40"
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <p className="tabular-nums text-[13px] font-semibold text-ink">
                        {formatCurrency(item.unitPrice * item.quantity - item.discount, settings.currency)}
                      </p>
                      <button onClick={() => cart.removeItem(item.medicineId)} className="text-ink-subtle hover:text-danger">
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-3 border-t border-border p-4">
              <div>
                <label className="text-[13px] font-medium text-ink-muted">Customer</label>
                <div className="mt-1.5">
                  <CustomerPicker customer={customer} onSelect={setCustomer} />
                </div>
              </div>

              <div>
                <label className="text-[13px] font-medium text-ink-muted">Payment method</label>
                <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                  {PAYMENT_METHODS.map((pm) => (
                    <button
                      key={pm.value}
                      onClick={() => setPaymentMethod(pm.value)}
                      className={cn(
                        'rounded-lg border py-1.5 text-[13px] font-medium transition-colors',
                        paymentMethod === pm.value ? 'border-primary bg-primary-soft text-primary-soft-text' : 'border-border text-ink-muted hover:bg-surface-alt'
                      )}
                    >
                      {pm.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[13px] font-medium text-ink-muted">Discount</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="mt-1.5 h-9 w-full rounded-lg border border-border bg-surface px-2.5 text-[13px] text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-[13px] font-medium text-ink-muted">Amount paid</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={amountPaid}
                    onChange={(e) => {
                      setAmountPaid(e.target.value);
                      setPaidTouched(true);
                    }}
                    className="mt-1.5 h-9 w-full rounded-lg border border-border bg-surface px-2.5 text-[13px] text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1 border-t border-border pt-3 text-[13px]">
                <div className="flex justify-between text-ink-subtle">
                  <span>Subtotal</span>
                  <span className="tabular-nums">{formatCurrency(cart.subtotal, settings.currency)}</span>
                </div>
                <div className="flex justify-between text-ink-subtle">
                  <span>Tax ({taxRate}%)</span>
                  <span className="tabular-nums">{formatCurrency(tax, settings.currency)}</span>
                </div>
                <div className="flex justify-between text-base font-semibold text-ink">
                  <span>Total</span>
                  <span className="tabular-nums">{formatCurrency(total, settings.currency)}</span>
                </div>
                {balanceDue > 0 && (
                  <div className="flex justify-between font-medium text-warning-soft-text">
                    <span>{customer ? 'Balance due (credit)' : 'Balance due'}</span>
                    <span className="tabular-nums">{formatCurrency(balanceDue, settings.currency)}</span>
                  </div>
                )}
              </div>

              {error && (
                <p className="flex items-start gap-1.5 rounded-lg bg-danger-soft px-3 py-2 text-[13px] text-danger-soft-text">
                  <AlertCircle className="mt-0.5 size-3.5 shrink-0" /> {error}
                </p>
              )}

              <Button size="lg" onClick={handleCheckout} loading={submitting} disabled={cart.items.length === 0}>
                Complete Sale
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {completedSale && (
        <div id="print-root" className="hidden">
          <Receipt sale={completedSale} settings={settings} />
        </div>
      )}
      <SaleSuccessModal open={Boolean(completedSale)} sale={completedSale} onClose={() => setCompletedSale(null)} onNewSale={resetForNewSale} />
    </div>
  );
}
