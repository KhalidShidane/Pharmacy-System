import { forwardRef, useId } from 'react';
import { cn } from '../../lib/cn';

const Input = forwardRef(
  ({ className, label, error, hint, required, icon: Icon, containerClassName, ...props }, ref) => {
    const autoId = useId();
    const id = props.id || autoId;
    return (
      <div className={cn('flex flex-col gap-1.5', containerClassName)}>
        {label && (
          <label htmlFor={id} className="text-[13px] font-medium text-ink-muted">
            {label}
            {required && <span className="text-danger"> *</span>}
          </label>
        )}
        <div className="relative">
          {Icon && <Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" />}
          <input
            ref={ref}
            id={id}
            className={cn(
              'h-10 w-full rounded-lg border bg-surface px-3 text-sm text-ink placeholder:text-ink-subtle',
              'transition-colors duration-150 outline-none',
              'focus:border-primary focus:ring-2 focus:ring-primary/20',
              'disabled:cursor-not-allowed disabled:bg-surface-alt disabled:text-ink-subtle',
              error ? 'border-danger focus:border-danger focus:ring-danger/20' : 'border-border',
              Icon && 'pl-9',
              className
            )}
            {...props}
          />
        </div>
        {error ? (
          <p className="text-xs text-danger">{error}</p>
        ) : hint ? (
          <p className="text-xs text-ink-subtle">{hint}</p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = 'Input';

export default Input;
