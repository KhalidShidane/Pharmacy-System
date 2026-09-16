import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/cn';

export default function Pagination({ page, pages, onChange, total, limit }) {
  if (pages <= 1) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between border-t border-border px-4 py-3">
      <p className="text-xs text-ink-subtle">
        Showing <span className="font-medium text-ink">{from}</span>–<span className="font-medium text-ink">{to}</span> of{' '}
        <span className="font-medium text-ink">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className={cn(
            'flex size-7 items-center justify-center rounded-md border border-border text-ink-muted',
            'hover:bg-surface-alt disabled:cursor-not-allowed disabled:opacity-40'
          )}
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="px-2 text-xs text-ink-muted">
          {page} / {pages}
        </span>
        <button
          onClick={() => onChange(page + 1)}
          disabled={page >= pages}
          className={cn(
            'flex size-7 items-center justify-center rounded-md border border-border text-ink-muted',
            'hover:bg-surface-alt disabled:cursor-not-allowed disabled:opacity-40'
          )}
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
