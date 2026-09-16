import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { purchasesApi } from '../../api/purchases.api';
import { useSettings } from '../../context/SettingsContext';
import { formatCurrency } from '../../lib/formatCurrency';
import { formatDate, formatDateTime } from '../../lib/formatDate';
import PageHeader from '../../components/ui/PageHeader';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import { Card, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { TableSkeleton } from '../../components/ui/Skeleton';

const STATUS_TONE = { paid: 'success', partial: 'warning', pending: 'danger' };

export default function PurchaseDetail() {
  const { id } = useParams();
  const settings = useSettings();
  const [purchase, setPurchase] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    purchasesApi.getById(id).then(setPurchase).finally(() => setLoading(false));
  }, [id]);

  if (loading || !purchase) {
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
        breadcrumbs={<Breadcrumbs items={[{ label: 'Purchases', to: '/purchases' }, { label: purchase.invoiceNumber }]} />}
        title={purchase.invoiceNumber}
        description={formatDateTime(purchase.createdAt)}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card>
            <CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="text-xs text-ink-subtle">Status</p>
                <Badge tone={STATUS_TONE[purchase.status]} className="mt-1">
                  {purchase.status}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-ink-subtle">Supplier</p>
                <Link to={`/suppliers/${purchase.supplier?._id}`} className="mt-1 block text-[13px] font-medium text-ink hover:text-primary">
                  {purchase.supplier?.name}
                </Link>
              </div>
              <div>
                <p className="text-xs text-ink-subtle">Recorded by</p>
                <p className="mt-1 text-[13px] font-medium text-ink">{purchase.createdBy?.name}</p>
              </div>
              <div>
                <p className="text-xs text-ink-subtle">Items</p>
                <p className="mt-1 text-[13px] font-medium text-ink">{purchase.items?.length || 0}</p>
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
                    <th className="px-5 py-3">Expiry</th>
                    <th className="px-5 py-3 text-right">Qty</th>
                    <th className="px-5 py-3 text-right">Cost</th>
                    <th className="px-5 py-3 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {purchase.items.map((item) => (
                    <tr key={item._id} className="border-b border-border text-ink last:border-0">
                      <td className="px-5 py-3 font-medium">{item.medicine?.name}</td>
                      <td className="px-5 py-3 text-ink-subtle">{item.batchNumber}</td>
                      <td className="px-5 py-3">{formatDate(item.expiryDate)}</td>
                      <td className="px-5 py-3 text-right tabular-nums">{item.quantity}</td>
                      <td className="px-5 py-3 text-right tabular-nums">{formatCurrency(item.purchasePrice, settings.currency)}</td>
                      <td className="px-5 py-3 text-right tabular-nums font-medium">{formatCurrency(item.purchasePrice * item.quantity, settings.currency)}</td>
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
              <span className="tabular-nums text-ink">{formatCurrency(purchase.subtotal, settings.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-subtle">Discount</span>
              <span className="tabular-nums text-ink">-{formatCurrency(purchase.discount, settings.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-subtle">Tax</span>
              <span className="tabular-nums text-ink">{formatCurrency(purchase.tax, settings.currency)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-sm font-semibold">
              <span className="text-ink">Total</span>
              <span className="tabular-nums text-ink">{formatCurrency(purchase.total, settings.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-subtle">Amount Paid</span>
              <span className="tabular-nums text-ink">{formatCurrency(purchase.amountPaid, settings.currency)}</span>
            </div>
            {purchase.total > purchase.amountPaid && (
              <div className="flex justify-between font-medium text-warning-soft-text">
                <span>Payable</span>
                <span className="tabular-nums">{formatCurrency(purchase.total - purchase.amountPaid, settings.currency)}</span>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
