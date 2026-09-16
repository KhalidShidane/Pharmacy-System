import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Settings as SettingsIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PERMISSIONS } from '../../lib/permissions';
import Avatar from '../ui/Avatar';

export default function UserMenu() {
  const { user, can, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onClickOutside = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  if (!user) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Account menu"
        className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 transition-colors hover:bg-surface-alt"
      >
        <Avatar name={user.name} src={user.avatarUrl} size="sm" />
        <span className="hidden text-left sm:block">
          <span className="block text-[13px] font-medium leading-tight text-ink">{user.name}</span>
          <span className="block text-[11px] capitalize leading-tight text-ink-subtle">{user.role.replace('_', ' ')}</span>
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-52 rounded-lg border border-border bg-surface py-1.5 shadow-lg shadow-black/10">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
            <Avatar name={user.name} src={user.avatarUrl} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-ink">{user.name}</p>
              <p className="truncate text-[11px] text-ink-subtle">{user.email}</p>
            </div>
          </div>
          {can(PERMISSIONS.PROFILE_MANAGE) && (
            <Link
              to="/profile"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-ink-muted hover:bg-surface-alt hover:text-ink"
            >
              <SettingsIcon className="size-4" />
              My Profile
            </Link>
          )}
          <button
            onClick={async () => {
              await logout();
              navigate('/login');
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-danger hover:bg-danger-soft"
          >
            <LogOut className="size-4" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
