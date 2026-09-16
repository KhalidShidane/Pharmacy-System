import { cn } from '../../lib/cn';

const tones = {
  primary: 'bg-primary-soft text-primary-soft-text',
  success: 'bg-success-soft text-success-soft-text',
  warning: 'bg-warning-soft text-warning-soft-text',
  danger: 'bg-danger-soft text-danger-soft-text',
  info: 'bg-info-soft text-info-soft-text',
  neutral: 'bg-surface-alt text-ink-muted',
};

export default function StatCard({ label, value, icon: Icon, tone = 'neutral', hint, onClick }) {
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      onClick={onClick}
      className={cn(
        'flex items-start justify-between gap-3 rounded-xl border border-border bg-surface p-5 text-left',
        onClick && 'transition-shadow hover:shadow-sm hover:shadow-black/5'
      )}
    >
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-ink-subtle">{label}</p>
        <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-ink">{value}</p>
        {hint && <p className="mt-1.5 text-xs text-ink-subtle">{hint}</p>}
      </div>
      {Icon && (
        <div className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg', tones[tone])}>
          <Icon className="size-[18px]" />
        </div>
      )}
    </Comp>
  );
}
