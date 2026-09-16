import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../lib/cn';

export default function Drawer({ open, onClose, title, description, children, footer, widthClassName = 'max-w-lg' }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className={cn(
          'relative flex h-full w-full flex-col border-l border-border bg-surface shadow-xl shadow-black/10',
          'animate-[slideIn_0.2s_ease-out]',
          widthClassName
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-ink">{title}</h2>
            {description && <p className="mt-0.5 text-xs text-ink-subtle">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-ink-subtle transition-colors hover:bg-surface-alt hover:text-ink"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">{footer}</div>}
      </div>
      <style>{`@keyframes slideIn { from { transform: translateX(24px); opacity: 0 } to { transform: translateX(0); opacity: 1 } }`}</style>
    </div>,
    document.body
  );
}
