import { Search, X } from 'lucide-react';
import { cn } from '../../lib/cn';

export default function SearchField({ value, onChange, placeholder = 'Search…', className, autoFocus, onKeyDown }) {
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" />
      <input
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className={cn(
          'h-10 w-full rounded-lg border border-border bg-surface pl-9 pr-9 text-sm text-ink placeholder:text-ink-subtle',
          'transition-colors duration-150 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'
        )}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-ink-subtle hover:bg-surface-alt hover:text-ink"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
