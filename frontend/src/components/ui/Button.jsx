import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/cn';

const variants = {
  primary:
    'bg-primary text-white hover:bg-primary-hover active:bg-primary-active shadow-sm shadow-black/5 disabled:bg-primary/50',
  secondary:
    'bg-surface text-ink border border-border hover:bg-surface-alt active:bg-surface-alt disabled:text-ink-subtle',
  ghost: 'text-ink-muted hover:bg-surface-alt hover:text-ink disabled:text-ink-subtle',
  danger: 'bg-danger text-white hover:brightness-110 active:brightness-95 disabled:bg-danger/50',
  outlineDanger: 'border border-danger/40 text-danger hover:bg-danger-soft disabled:opacity-50',
};

const sizes = {
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-md',
  md: 'h-10 px-4 text-sm gap-2 rounded-lg',
  lg: 'h-12 px-5 text-[15px] gap-2 rounded-lg',
};

const Button = forwardRef(
  ({ className, variant = 'primary', size = 'md', loading = false, disabled, icon: Icon, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
          'disabled:cursor-not-allowed',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading ? <Loader2 className="size-4 animate-spin" /> : Icon ? <Icon className="size-4" /> : null}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export default Button;
