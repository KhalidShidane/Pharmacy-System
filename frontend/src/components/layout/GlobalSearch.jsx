import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Pill } from 'lucide-react';
import { medicinesApi } from '../../api/medicines.api';
import { useDebounce } from '../../hooks/useDebounce';
import { cn } from '../../lib/cn';

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const debounced = useDebounce(query, 250);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!debounced.trim()) {
      setResults([]);
      return;
    }
    let cancelled = false;
    medicinesApi
      .list({ query: debounced, limit: 6 })
      .then((res) => !cancelled && setResults(res.data))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative hidden w-full max-w-sm md:block">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" />
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search medicines by name or barcode…"
        className="h-9 w-full rounded-lg border border-border bg-surface-alt pl-9 pr-3 text-[13px] text-ink placeholder:text-ink-subtle outline-none focus:border-primary focus:bg-surface focus:ring-2 focus:ring-primary/20"
      />
      {open && query.trim() && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1.5 max-h-80 overflow-y-auto rounded-lg border border-border bg-surface py-1.5 shadow-lg shadow-black/10">
          {results.length === 0 ? (
            <p className="px-3 py-3 text-[13px] text-ink-subtle">No medicines found</p>
          ) : (
            results.map((m) => (
              <button
                key={m._id}
                onClick={() => {
                  navigate(`/medicines/${m._id}`);
                  setOpen(false);
                  setQuery('');
                }}
                className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-surface-alt"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary-soft-text">
                  <Pill className="size-3.5" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-medium text-ink">{m.name}</span>
                  <span className={cn('block truncate text-[11px]', m.currentStock === 0 ? 'text-danger' : 'text-ink-subtle')}>
                    {m.currentStock} {m.unit || 'unit'}(s) in stock
                  </span>
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
