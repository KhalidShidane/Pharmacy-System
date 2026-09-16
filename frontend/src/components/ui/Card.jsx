import { cn } from '../../lib/cn';

export function Card({ className, children, ...props }) {
  return (
    <div className={cn('rounded-xl border border-border bg-surface', className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className, title, subtitle, actions, children }) {
  if (children) {
    return <div className={cn('flex items-center justify-between gap-4 border-b border-border px-5 py-4', className)}>{children}</div>;
  }
  return (
    <div className={cn('flex items-center justify-between gap-4 border-b border-border px-5 py-4', className)}>
      <div>
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-ink-subtle">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

export function CardBody({ className, children }) {
  return <div className={cn('p-5', className)}>{children}</div>;
}
