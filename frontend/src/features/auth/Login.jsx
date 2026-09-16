import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Pill, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-primary text-white">
            <Pill className="size-5" />
          </div>
          <h1 className="text-lg font-semibold text-ink">Kalsan Pharmacy</h1>
          <p className="mt-1 text-sm text-ink-subtle">Sign in to the management system</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm shadow-black/5">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@pharmacy.com"
            />
            <Input
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
            {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-[13px] text-danger-soft-text">{error}</p>}
            <Button type="submit" size="lg" loading={loading} icon={LogIn} className="mt-1 w-full">
              Sign in
            </Button>
          </form>
        </div>

      
      </div>
    </div>
  );
}
