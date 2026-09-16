import { Inbox } from 'lucide-react';
import { cn } from '../../lib/cn';

export default function EmptyState({ icon: Icon = Inbox, title, description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 px-6 py-14 text-center', className)}>
      <div className="flex size-11 items-center justify-center rounded-full bg-surface-alt text-ink-subtle">
        <Icon className="size-5" />
      </div>
      <div>
        <p className="text-sm font-medium text-ink">{title}</p>
        {description && <p className="mt-1 max-w-sm text-[13px] text-ink-subtle">{description}</p>}
      </div>
      {action}
    </div>
  );
}
