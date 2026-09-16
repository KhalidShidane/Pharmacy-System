import { cn } from '../../lib/cn';

export function Skeleton({ className }) {
  return <div className={cn('animate-pulse rounded-md bg-surface-alt', className)} />;
}

export function TableSkeleton({ rows = 6, columns = 4 }) {
  return (
    <div className="w-full p-4">
      <div className="flex flex-col gap-3">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-4">
            {Array.from({ length: columns }).map((__, c) => (
              <Skeleton key={c} className={cn('h-4', c === 0 ? 'w-1/4' : 'flex-1')} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton({ className }) {
  return (
    <div className={cn('rounded-xl border border-border bg-surface p-5', className)}>
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-7 w-32" />
      <Skeleton className="mt-2 h-3 w-20" />
    </div>
  );
}
