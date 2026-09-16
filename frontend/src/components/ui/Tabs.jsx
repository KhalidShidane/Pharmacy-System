import { cn } from '../../lib/cn';

export default function Tabs({ tabs, active, onChange, className }) {
  return (
    <div className={cn('flex items-center gap-1 border-b border-border', className)}>
      {tabs.map((tab) => {
        const isActive = tab.value === active;
        return (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className={cn(
              'relative flex items-center gap-2 px-3.5 py-2.5 text-[13px] font-medium transition-colors',
              isActive ? 'text-primary' : 'text-ink-subtle hover:text-ink'
            )}
          >
            {tab.label}
            {tab.count != null && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[11px]',
                  isActive ? 'bg-primary-soft text-primary-soft-text' : 'bg-surface-alt text-ink-subtle'
                )}
              >
                {tab.count}
              </span>
            )}
            {isActive && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" />}
          </button>
        );
      })}
    </div>
  );
}
