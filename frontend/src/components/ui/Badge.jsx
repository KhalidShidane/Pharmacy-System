import { cn } from '../../lib/cn';

const tones = {
  success: 'bg-success-soft text-success-soft-text',
  warning: 'bg-warning-soft text-warning-soft-text',
  danger: 'bg-danger-soft text-danger-soft-text',
  info: 'bg-info-soft text-info-soft-text',
  primary: 'bg-primary-soft text-primary-soft-text',
  neutral: 'bg-surface-alt text-ink-muted',
};

const dotTones = {
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
  primary: 'bg-primary',
  neutral: 'bg-ink-subtle',
};

export default function Badge({ tone = 'neutral', dot = false, className, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        tones[tone],
        className
      )}
    >
      {dot && <span className={cn('size-1.5 rounded-full', dotTones[tone])} />}
      {children}
    </span>
  );
}
