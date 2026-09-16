import { cn } from '../../lib/cn';
import EmptyState from './EmptyState';
import { TableSkeleton } from './Skeleton';

/**
 * Generic data table. Renders a real <table> at md+ widths and collapses to
 * a stacked card list below that — driven by one `columns` config so the two
 * views never drift out of sync.
 *
 * columns: [{ key, header, render?(row), className?, mobileHidden? }]
 * `columns[0]` doubles as the mobile card's title unless `mobileTitle` is set.
 */
export default function Table({
  columns,
  data,
  keyField = '_id',
  loading = false,
  emptyTitle = 'Nothing here yet',
  emptyDescription,
  emptyAction,
  onRowClick,
  mobileTitle,
}) {
  if (loading) return <TableSkeleton columns={columns.length} />;
  if (!data || data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />;
  }

  const titleCol = mobileTitle || columns[0];
  const restCols = columns.filter((c) => c.key !== titleCol.key);

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-ink-subtle">
              {columns.map((col) => (
                <th key={col.key} className={cn('whitespace-nowrap px-4 py-3', col.headerClassName)}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr
                key={row[keyField]}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  'border-b border-border text-ink last:border-0',
                  onRowClick && 'cursor-pointer hover:bg-surface-alt'
                )}
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn('px-4 py-3 align-middle', col.className)}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-border md:hidden">
        {data.map((row) => (
          <div
            key={row[keyField]}
            onClick={() => onRowClick?.(row)}
            className={cn('flex flex-col gap-2 px-4 py-3', onRowClick && 'cursor-pointer active:bg-surface-alt')}
          >
            <div className="text-sm font-medium text-ink">
              {titleCol.render ? titleCol.render(row) : row[titleCol.key]}
            </div>
            {restCols
              .filter((c) => !c.mobileHidden)
              .map((col) => (
                <div key={col.key} className="flex items-center justify-between text-[13px]">
                  <span className="text-ink-subtle">{col.header}</span>
                  <span className="text-ink">{col.render ? col.render(row) : row[col.key]}</span>
                </div>
              ))}
          </div>
        ))}
      </div>
    </>
  );
}
