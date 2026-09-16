import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Banknote,
  TrendingUp,
  Receipt,
  Boxes,
  PackageX,
  CalendarClock,
  Users,
  Truck,
  AlertTriangle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { dashboardApi } from '../../api/dashboard.api';
import { inventoryApi } from '../../api/inventory.api';
import { useSettings } from '../../context/SettingsContext';
import { formatCurrency } from '../../lib/formatCurrency';
import { formatDate } from '../../lib/formatDate';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { CardSkeleton } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

const CHART_COLORS = ['#0f6e51', '#1d4ed8', '#b45309', '#b91c1c', '#7c3aed', '#0891b2'];

export default function Dashboard() {
  const settings = useSettings();
  const [summary, setSummary] = useState(null);
  const [series, setSeries] = useState([]);
  const [topMedicines, setTopMedicines] = useState([]);
  const [byCategory, setByCategory] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [expiring, setExpiring] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    Promise.all([
      dashboardApi.summary(),
      dashboardApi.salesSeries(14),
      dashboardApi.topMedicines({ days: 30, limit: 5 }),
      dashboardApi.salesByCategory({ days: 30 }),
      dashboardApi.recentSales(6),
      inventoryApi.lowStock(),
      inventoryApi.expiring({ days: 30 }),
    ])
      .then(([s, sr, tm, bc, rs, ls, exp]) => {
        setSummary(s);
        setSeries(sr);
        setTopMedicines(tm);
        setByCategory(bc);
        setRecentSales(rs);
        setLowStock(ls.slice(0, 5));
        setExpiring(exp.expiringSoon.slice(0, 5));
      })
      .catch((err) => setError(err.message || 'Failed to load dashboard data'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const currency = settings.currency;

  return (
    <div>
      <PageHeader title="Dashboard" description="A live snapshot of today's operations and business health." />

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={AlertTriangle}
          title="Couldn't load the dashboard"
          description={error}
          action={
            <Button size="sm" onClick={load}>
              Try again
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Today's Sales" value={formatCurrency(summary.todaySales, currency)} icon={Banknote} tone="primary" hint={`${summary.todaySalesCount} transaction(s)`} />
            <StatCard label="Today's Profit" value={formatCurrency(summary.todayProfit, currency)} icon={TrendingUp} tone="success" />
            <StatCard label="Today's Expenses" value={formatCurrency(summary.todayExpenses, currency)} icon={Receipt} tone="warning" />
            <StatCard label="Inventory Value" value={formatCurrency(summary.inventoryValue, currency)} icon={Boxes} tone="info" hint="Cost basis, sellable stock" />
            <StatCard
              label="Low Stock Items"
              value={summary.lowStockCount}
              icon={PackageX}
              tone={summary.lowStockCount > 0 ? 'danger' : 'neutral'}
            />
            <StatCard
              label="Expiring Soon"
              value={summary.expiringSoonCount}
              icon={CalendarClock}
              tone={summary.expiringSoonCount > 0 ? 'warning' : 'neutral'}
            />
            <StatCard label="Outstanding Debt" value={formatCurrency(summary.outstandingDebt, currency)} icon={Users} tone="info" hint="Owed by customers" />
            <StatCard label="Supplier Payables" value={formatCurrency(summary.supplierPayables, currency)} icon={Truck} tone="neutral" />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader title="Sales &amp; Profit" subtitle="Last 14 days" />
              <CardBody>
                {series.every((d) => d.revenue === 0) ? (
                  <EmptyState title="No sales yet" description="Ring up a sale in POS to see trends here." />
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={series} margin={{ left: -16, right: 8 }}>
                      <defs>
                        <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0f6e51" stopOpacity={0.25} />
                          <stop offset="100%" stopColor="#0f6e51" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="profitFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#1d4ed8" stopOpacity={0.2} />
                          <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke="var(--color-border)" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(d) => formatDate(d, 'MMM d')}
                        tick={{ fontSize: 11, fill: 'var(--color-ink-subtle)' }}
                        axisLine={{ stroke: 'var(--color-border)' }}
                        tickLine={false}
                      />
                      <YAxis tick={{ fontSize: 11, fill: 'var(--color-ink-subtle)' }} axisLine={false} tickLine={false} width={56} />
                      <RTooltip
                        contentStyle={{
                          background: 'var(--color-surface)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                        labelFormatter={(d) => formatDate(d)}
                        formatter={(value, name) => [formatCurrency(value, currency), name === 'revenue' ? 'Revenue' : 'Profit']}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#0f6e51" strokeWidth={2} fill="url(#revenueFill)" />
                      <Area type="monotone" dataKey="profit" stroke="#1d4ed8" strokeWidth={2} fill="url(#profitFill)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Sales by Category" subtitle="Last 30 days" />
              <CardBody>
                {byCategory.length === 0 ? (
                  <EmptyState title="No data yet" />
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={byCategory} dataKey="revenue" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                        {byCategory.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <RTooltip formatter={(value) => formatCurrency(value, currency)} />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value) => <span style={{ color: 'var(--color-ink-muted)', fontSize: 12 }}>{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardBody>
            </Card>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader title="Top Selling Medicines" subtitle="Last 30 days" />
              {topMedicines.length === 0 ? (
                <CardBody>
                  <EmptyState title="No sales yet" />
                </CardBody>
              ) : (
                <div className="divide-y divide-border">
                  {topMedicines.map((m, i) => {
                    const max = topMedicines[0].quantitySold || 1;
                    return (
                      <div key={m.medicineId} className="px-5 py-3">
                        <div className="flex items-center justify-between text-[13px]">
                          <span className="truncate font-medium text-ink">
                            {i + 1}. {m.name}
                          </span>
                          <span className="shrink-0 tabular-nums text-ink-subtle">{m.quantitySold} {m.unit}(s)</span>
                        </div>
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-alt">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${(m.quantitySold / max) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            <Card>
              <CardHeader title="Low Stock" subtitle="At or below minimum" actions={<Link to="/inventory" className="text-xs font-medium text-primary hover:underline">View all</Link>} />
              {lowStock.length === 0 ? (
                <CardBody>
                  <EmptyState title="Nothing low on stock" />
                </CardBody>
              ) : (
                <div className="divide-y divide-border">
                  {lowStock.map((m) => (
                    <div key={m._id} className="flex items-center justify-between px-5 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium text-ink">{m.name}</p>
                        <p className="text-xs text-ink-subtle">Min {m.minStockLevel}</p>
                      </div>
                      <Badge tone={m.currentStock === 0 ? 'danger' : 'warning'}>{m.currentStock} left</Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <CardHeader title="Expiring Soon" subtitle="Within 30 days" actions={<Link to="/inventory" className="text-xs font-medium text-primary hover:underline">View all</Link>} />
              {expiring.length === 0 ? (
                <CardBody>
                  <EmptyState title="Nothing expiring soon" />
                </CardBody>
              ) : (
                <div className="divide-y divide-border">
                  {expiring.map((b) => (
                    <div key={b._id} className="flex items-center justify-between px-5 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium text-ink">{b.medicine?.name}</p>
                        <p className="text-xs text-ink-subtle">Batch {b.batchNumber}</p>
                      </div>
                      <Badge tone="warning">{formatDate(b.expiryDate)}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <Card className="mt-4">
            <CardHeader title="Recent Sales" actions={<Link to="/sales" className="text-xs font-medium text-primary hover:underline">View all</Link>} />
            {recentSales.length === 0 ? (
              <CardBody>
                <EmptyState title="No sales yet" description="Completed POS sales will show up here." />
              </CardBody>
            ) : (
              <div className="divide-y divide-border">
                {recentSales.map((s) => (
                  <Link
                    key={s._id}
                    to={`/sales/${s._id}`}
                    className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-surface-alt"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-ink">{s.invoiceNumber}</p>
                      <p className="text-xs text-ink-subtle">
                        {s.customer?.name || 'Walk-in'} · {formatDate(s.createdAt, 'MMM d, h:mm a')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="tabular-nums text-[13px] font-semibold text-ink">{formatCurrency(s.total, currency)}</p>
                      <Badge tone={s.status === 'paid' ? 'success' : s.status === 'partial' ? 'warning' : 'info'}>{s.status}</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
