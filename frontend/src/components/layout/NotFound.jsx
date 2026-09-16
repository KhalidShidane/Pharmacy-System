import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import Button from '../ui/Button';

export default function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 bg-canvas text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-primary-soft text-primary-soft-text">
        <Compass className="size-6" />
      </div>
      <div>
        <p className="text-2xl font-semibold text-ink">Page not found</p>
        <p className="mt-1 text-sm text-ink-subtle">The page you're looking for doesn't exist or was moved.</p>
      </div>
      <Link to="/dashboard">
        <Button>Back to dashboard</Button>
      </Link>
    </div>
  );
}
