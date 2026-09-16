import { useEffect, useState } from 'react';
import { notificationsApi } from '../api/misc.api';

export function useAlerts(pollMs = 60000) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      notificationsApi
        .alerts()
        .then((data) => !cancelled && setAlerts(data))
        .catch(() => {})
        .finally(() => !cancelled && setLoading(false));
    };
    load();
    const interval = setInterval(load, pollMs);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [pollMs]);

  return { alerts, loading };
}
