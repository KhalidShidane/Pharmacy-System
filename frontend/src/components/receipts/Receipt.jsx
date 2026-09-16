import { formatCurrency } from '../../lib/formatCurrency';
import { formatDateTime } from '../../lib/formatDate';

export default function Receipt({ sale, settings }) {
  if (!sale) return null;
  const currency = settings.currency;
  const balanceDue = Math.max(sale.total - sale.amountPaid, 0);
  const change = Math.max(sale.amountPaid - sale.total, 0);

  return (
    <div className="mx-auto w-full max-w-[320px] bg-white p-5 text-[13px] text-black">
      <div className="text-center">
        <p className="text-base font-bold">{settings.pharmacyName}</p>
        {settings.address && <p className="text-[11px]">{settings.address}</p>}
        {settings.phone && <p className="text-[11px]">{settings.phone}</p>}
      </div>

      <div className="my-3 border-t border-dashed border-black/40" />

      <div className="flex justify-between text-[11px]">
        <span>Invoice</span>
        <span className="font-medium">{sale.invoiceNumber}</span>
      </div>
      <div className="flex justify-between text-[11px]">
        <span>Date</span>
        <span>{formatDateTime(sale.createdAt)}</span>
      </div>
      <div className="flex justify-between text-[11px]">
        <span>Cashier</span>
        <span>{sale.cashier?.name || '—'}</span>
      </div>
      {sale.customer && (
        <div className="flex justify-between text-[11px]">
          <span>Customer</span>
          <span>{sale.customer.name}</span>
        </div>
      )}

      <div className="my-3 border-t border-dashed border-black/40" />

      <table className="w-full text-[11px]">
        <thead>
          <tr className="text-left">
            <th className="pb-1 font-semibold">Item</th>
            <th className="pb-1 text-right font-semibold">Qty</th>
            <th className="pb-1 text-right font-semibold">Price</th>
            <th className="pb-1 text-right font-semibold">Total</th>
          </tr>
        </thead>
        <tbody>
          {sale.items.map((item) => (
            <tr key={item._id}>
              <td className="py-0.5 pr-1">{item.medicine?.name}</td>
              <td className="py-0.5 text-right tabular-nums">{item.quantity}</td>
              <td className="py-0.5 text-right tabular-nums">{formatCurrency(item.unitPrice, currency)}</td>
              <td className="py-0.5 text-right tabular-nums">{formatCurrency(item.lineTotal, currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="my-3 border-t border-dashed border-black/40" />

      <div className="flex flex-col gap-0.5 text-[11px]">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span className="tabular-nums">{formatCurrency(sale.subtotal, currency)}</span>
        </div>
        {sale.discount > 0 && (
          <div className="flex justify-between">
            <span>Discount</span>
            <span className="tabular-nums">-{formatCurrency(sale.discount, currency)}</span>
          </div>
        )}
        {sale.tax > 0 && (
          <div className="flex justify-between">
            <span>Tax</span>
            <span className="tabular-nums">{formatCurrency(sale.tax, currency)}</span>
          </div>
        )}
        <div className="mt-1 flex justify-between text-sm font-bold">
          <span>Total</span>
          <span className="tabular-nums">{formatCurrency(sale.total, currency)}</span>
        </div>
        <div className="flex justify-between">
          <span>Paid ({sale.paymentMethod})</span>
          <span className="tabular-nums">{formatCurrency(sale.amountPaid, currency)}</span>
        </div>
        {change > 0 && (
          <div className="flex justify-between">
            <span>Change</span>
            <span className="tabular-nums">{formatCurrency(change, currency)}</span>
          </div>
        )}
        {balanceDue > 0 && (
          <div className="flex justify-between font-semibold">
            <span>Balance due</span>
            <span className="tabular-nums">{formatCurrency(balanceDue, currency)}</span>
          </div>
        )}
      </div>

      <div className="my-3 border-t border-dashed border-black/40" />
      <p className="text-center text-[11px]">{settings.receiptFooter}</p>
    </div>
  );
}
