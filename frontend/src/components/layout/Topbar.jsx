import { Menu } from 'lucide-react';
import GlobalSearch from './GlobalSearch';
import NotificationsBell from './NotificationsBell';
import ThemeToggle from './ThemeToggle';
import UserMenu from './UserMenu';

export default function Topbar({ onOpenMobileNav }) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-surface px-4 sm:px-6">
      <button
        onClick={onOpenMobileNav}
        className="flex size-9 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-alt md:hidden"
      >
        <Menu className="size-5" />
      </button>

      <GlobalSearch />

      <div className="ml-auto flex items-center gap-1.5">
        <ThemeToggle />
        <NotificationsBell />
        <div className="mx-1 h-6 w-px bg-border" />
        <UserMenu />
      </div>
    </header>
  );
}
