import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Printer } from 'lucide-react';
import { salesApi } from '../../api/sales.api';
import { useSettings } from '../../context/SettingsContext';
import { formatCurrency } from '../../lib/formatCurrency';
import { formatDateTime } from '../../lib/formatDate';
import PageHeader from '../../components/ui/PageHeader';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import { Card, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { TableSkeleton } from '../../components/ui/Skeleton';
import Receipt from '../../components/receipts/Receipt';

const STATUS_TONE = { paid: 'success', partial: 'warning', credit: 'info' };

export default function SaleDetail() {
  const { id } = useParams();
  const settings = useSettings();
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    salesApi.getById(id).then(setSale).finally(() => setLoading(false));
  }, [id]);

  if (loading || !sale) {
    return (
      <div>
        <PageHeader title="Loading…" />
        <Card>
          <TableSkeleton />
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        breadcrumbs={<Breadcrumbs items={[{ label: 'Sales History', to: '/sales' }, { label: sale.invoiceNumber }]} />}
        title={sale.invoiceNumber}
        description={formatDateTime(sale.createdAt)}
        actions={
          <Button icon={Printer} variant="secondary" onClick={() => window.print()}>
            Print Receipt
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card>
            <CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="text-xs text-ink-subtle">Status</p>
                <Badge tone={STATUS_TONE[sale.status]} className="mt-1">
                  {sale.status}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-ink-subtle">Customer</p>
                <p className="mt-1 text-[13px] font-medium text-ink">{sale.customer?.name || 'Walk-in'}</p>
              </div>
              <div>
                <p className="text-xs text-ink-subtle">Cashier</p>
                <p className="mt-1 text-[13px] font-medium text-ink">{sale.cashier?.name}</p>
              </div>
              <div>
                <p className="text-xs text-ink-subtle">Payment method</p>
                <p className="mt-1 text-[13px] font-medium capitalize text-ink">{sale.paymentMethod}</p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-ink-subtle">
                    <th className="px-5 py-3">Medicine</th>
                    <th className="px-5 py-3">Batch</th>
                    <th className="px-5 py-3 text-right">Qty</th>
                    <th className="px-5 py-3 text-right">Unit Price</th>
                    <th className="px-5 py-3 text-right">Discount</th>
                    <th className="px-5 py-3 text-right">Line Total</th>
                    <th className="px-5 py-3 text-right">Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {sale.items.map((item) => (
                    <tr key={item._id} className="border-b border-border text-ink last:border-0">
                      <td className="px-5 py-3 font-medium">{item.medicine?.name}</td>
                      <td className="px-5 py-3 text-ink-subtle">{item.batch?.batchNumber}</td>
                      <td className="px-5 py-3 text-right tabular-nums">{item.quantity}</td>
                      <td className="px-5 py-3 text-right tabular-nums">{formatCurrency(item.unitPrice, settings.currency)}</td>
                      <td className="px-5 py-3 text-right tabular-nums">{formatCurrency(item.discount, settings.currency)}</td>
                      <td className="px-5 py-3 text-right tabular-nums font-medium">{formatCurrency(item.lineTotal, settings.currency)}</td>
                      <td className="px-5 py-3 text-right tabular-nums text-success">{formatCurrency(item.profit, settings.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <Card>
          <CardBody className="flex flex-col gap-2 text-[13px]">
            <div className="flex justify-between">
              <span className="text-ink-subtle">Subtotal</span>
              <span className="tabular-nums text-ink">{formatCurrency(sale.subtotal, settings.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-subtle">Discount</span>
              <span className="tabular-nums text-ink">-{formatCurrency(sale.discount, settings.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-subtle">Tax</span>
              <span className="tabular-nums text-ink">{formatCurrency(sale.tax, settings.currency)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-sm font-semibold">
              <span className="text-ink">Total</span>
              <span className="tabular-nums text-ink">{formatCurrency(sale.total, settings.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-subtle">Amount Paid</span>
              <span className="tabular-nums text-ink">{formatCurrency(sale.amountPaid, settings.currency)}</span>
            </div>
            {sale.total > sale.amountPaid && (
              <div className="flex justify-between font-medium text-danger">
                <span>Balance Due</span>
                <span className="tabular-nums">{formatCurrency(sale.total - sale.amountPaid, settings.currency)}</span>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <div id="print-root" className="hidden">
        <Receipt sale={sale} settings={settings} />
      </div>
    </div>
  );
}
