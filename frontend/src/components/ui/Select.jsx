import { forwardRef, useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/cn';

const Select = forwardRef(({ className, label, error, hint, required, children, containerClassName, ...props }, ref) => {
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
        <select
          ref={ref}
          id={id}
          className={cn(
            'h-10 w-full appearance-none rounded-lg border bg-surface pl-3 pr-9 text-sm text-ink',
            'transition-colors duration-150 outline-none',
            'focus:border-primary focus:ring-2 focus:ring-primary/20',
            'disabled:cursor-not-allowed disabled:bg-surface-alt disabled:text-ink-subtle',
            error ? 'border-danger focus:border-danger focus:ring-danger/20' : 'border-border',
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" />
      </div>
      {error ? <p className="text-xs text-danger">{error}</p> : hint ? <p className="text-xs text-ink-subtle">{hint}</p> : null}
    </div>
  );
});
Select.displayName = 'Select';

export default Select;
