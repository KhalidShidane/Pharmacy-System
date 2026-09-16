import { NavLink } from 'react-router-dom';
import { ChevronsLeft, Pill as LogoIcon, Clock } from 'lucide-react';
import { cn } from '../../lib/cn';
import { useAuth } from '../../context/AuthContext';
import Tooltip from '../ui/Tooltip';
import { NAV_GROUPS } from './nav.config';

function NavItem({ item, collapsed, onNavigate }) {
  const content = (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors',
          collapsed && 'justify-center px-0',
          isActive
            ? 'bg-primary-soft text-primary-soft-text'
            : 'text-ink-muted hover:bg-surface-alt hover:text-ink'
        )
      }
    >
      <item.icon className="size-[18px] shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
      {!collapsed && item.comingSoon && (
        <span className="ml-auto flex items-center gap-1 rounded-full bg-surface-alt px-1.5 py-0.5 text-[10px] text-ink-subtle">
          <Clock className="size-2.5" /> Soon
        </span>
      )}
    </NavLink>
  );

  if (collapsed) {
    return (
      <Tooltip label={item.label} side="right">
        {content}
      </Tooltip>
    );
  }
  return content;
}

export default function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }) {
  const { user, can } = useAuth();

  const body = (
    <div className="flex h-full flex-col bg-surface">
      <div className={cn('flex h-16 items-center gap-2.5 border-b border-border px-4', collapsed && 'justify-center px-0')}>
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
          <LogoIcon className="size-[18px]" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">Kalsan Pharmacy</p>
            <p className="truncate text-[11px] text-ink-subtle">Management System</p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
        {NAV_GROUPS.map((group) => {
          const items = group.items.filter((item) => can(item.permission));
          if (items.length === 0) return null;
          return (
            <div key={group.label} className="mb-5">
              {!collapsed && (
                <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wide text-ink-subtle">
                  {group.label}
                </p>
              )}
              <div className="flex flex-col gap-0.5">
                {items.map((item) => (
                  <NavItem key={item.to} item={item} collapsed={collapsed} onNavigate={onCloseMobile} />
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      <div className={cn('border-t border-border p-3', collapsed && 'flex justify-center')}>
        <button
          onClick={onToggleCollapse}
          className={cn(
            'hidden md:flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium text-ink-subtle hover:bg-surface-alt hover:text-ink',
            collapsed && 'justify-center px-2'
          )}
        >
          <ChevronsLeft className={cn('size-4 transition-transform', collapsed && 'rotate-180')} />
          {!collapsed && 'Collapse'}
        </button>
        {!collapsed && user && (
          <div className="mt-1 px-3 text-[11px] text-ink-subtle">
            Signed in as <span className="font-medium text-ink-muted">{user.role.replace('_', ' ')}</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <aside
        className={cn(
          'hidden shrink-0 border-r border-border transition-all duration-200 md:block',
          collapsed ? 'w-[72px]' : 'w-64'
        )}
      >
        {body}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={onCloseMobile} />
          <aside className="relative h-full w-64 shadow-xl">{body}</aside>
        </div>
      )}
    </>
  );
}
