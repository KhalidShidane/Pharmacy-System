import { useEffect, useRef, useState } from 'react';
import { Bell, AlertTriangle, PackageX, CalendarClock, Wallet } from 'lucide-react';
import { useAlerts } from '../../hooks/useAlerts';
import { cn } from '../../lib/cn';

const ICONS = {
  low_stock: PackageX,
  expiring: CalendarClock,
  expired: AlertTriangle,
  debt: Wallet,
};

const SEVERITY_DOT = {
  critical: 'bg-danger',
  warning: 'bg-warning',
  info: 'bg-info',
};

export default function NotificationsBell() {
  const { alerts } = useAlerts();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const criticalCount = alerts.filter((a) => a.severity === 'critical').length;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="relative flex size-9 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-alt hover:text-ink"
      >
        <Bell className="size-[18px]" />
        {alerts.length > 0 && (
          <span
            className={cn(
              'absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full text-[9px] font-semibold text-white',
              criticalCount > 0 ? 'bg-danger' : 'bg-warning'
            )}
          >
            {alerts.length > 9 ? '9+' : alerts.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-80 rounded-lg border border-border bg-surface shadow-lg shadow-black/10">
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-ink">Alerts</p>
            <p className="text-xs text-ink-subtle">Live from inventory &amp; accounts</p>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {alerts.length === 0 ? (
              <p className="px-4 py-8 text-center text-[13px] text-ink-subtle">You're all caught up</p>
            ) : (
              alerts.slice(0, 20).map((alert) => {
                const Icon = ICONS[alert.type] || AlertTriangle;
                return (
                  <div key={alert.id} className="flex items-start gap-3 border-b border-border px-4 py-3 last:border-0">
                    <span className="relative mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-surface-alt text-ink-muted">
                      <Icon className="size-3.5" />
                      <span className={cn('absolute -right-0.5 -top-0.5 size-2 rounded-full ring-2 ring-surface', SEVERITY_DOT[alert.severity])} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-ink">{alert.title}</p>
                      <p className="mt-0.5 truncate text-xs text-ink-subtle">{alert.message}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
