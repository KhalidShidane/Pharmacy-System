import { useEffect, useRef, useState } from 'react';
import { UserPlus, X } from 'lucide-react';
import { customersApi } from '../../api/customers.api';
import { useDebounce } from '../../hooks/useDebounce';
import CustomerFormModal from '../customers/CustomerFormModal';

export default function CustomerPicker({ customer, onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const debounced = useDebounce(query, 250);
  const ref = useRef(null);

  useEffect(() => {
    if (!debounced.trim()) {
      setResults([]);
      return;
    }
    customersApi.list({ query: debounced, limit: 6 }).then((res) => setResults(res.data));
  }, [debounced]);

  useEffect(() => {
    const onClickOutside = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  if (customer) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-border bg-surface-alt px-3 py-2">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-ink">{customer.name}</p>
          <p className="truncate text-xs text-ink-subtle">{customer.phone}</p>
        </div>
        <button onClick={() => onSelect(null)} className="rounded-md p-1 text-ink-subtle hover:bg-surface hover:text-ink">
          <X className="size-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Walk-in customer (optional)"
          className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-[13px] text-ink placeholder:text-ink-subtle outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border text-ink-muted hover:bg-surface-alt"
        >
          <UserPlus className="size-4" />
        </button>
      </div>
      {open && query.trim() && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1.5 max-h-56 overflow-y-auto rounded-lg border border-border bg-surface py-1 shadow-lg shadow-black/10">
          {results.length === 0 ? (
            <p className="px-3 py-2.5 text-[13px] text-ink-subtle">No customers found</p>
          ) : (
            results.map((c) => (
              <button
                key={c._id}
                onClick={() => {
                  onSelect(c);
                  setQuery('');
                  setOpen(false);
                }}
                className="flex w-full flex-col px-3 py-2 text-left hover:bg-surface-alt"
              >
                <span className="text-[13px] font-medium text-ink">{c.name}</span>
                <span className="text-xs text-ink-subtle">{c.phone}</span>
              </button>
            ))
          )}
        </div>
      )}

      <CustomerFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={(c) => {
          onSelect(c);
          setOpen(false);
        }}
      />
    </div>
  );
}
