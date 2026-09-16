import { Construction } from 'lucide-react';
import PageHeader from '../ui/PageHeader';

export default function ComingSoon({ title }) {
  return (
    <div>
      <PageHeader title={title} description="This module is planned for a future phase." />
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-surface py-20 text-center">
        <div className="flex size-11 items-center justify-center rounded-full bg-primary-soft text-primary-soft-text">
          <Construction className="size-5" />
        </div>
        <div>
          <p className="text-sm font-medium text-ink">{title} is coming soon</p>
          <p className="mt-1 max-w-sm text-[13px] text-ink-subtle">
            This part of the platform hasn't been built yet. Phase 1 focuses on Medicines, Inventory, POS and the
            Dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
