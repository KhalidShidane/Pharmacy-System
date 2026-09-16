import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, ShieldAlert } from 'lucide-react';

export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-canvas">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export function RequirePermission({ permission, children }) {
  const { can } = useAuth();
  if (!can(permission)) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <div className="flex size-11 items-center justify-center rounded-full bg-danger-soft text-danger">
          <ShieldAlert className="size-5" />
        </div>
        <div>
          <p className="text-sm font-medium text-ink">You don't have access to this page</p>
          <p className="mt-1 text-[13px] text-ink-subtle">Ask an administrator to grant you the required permission.</p>
        </div>
      </div>
    );
  }
  return children;
}
