import { createContext, useContext, useEffect, useState } from 'react';
import { settingsApi } from '../api/misc.api';
import { useAuth } from './AuthContext';

const SettingsContext = createContext(null);

const DEFAULTS = { pharmacyName: 'Pharmacy', currency: 'USD', taxRate: 0, address: '', phone: '', receiptFooter: '' };

export function SettingsProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [settings, setSettings] = useState(DEFAULTS);

  useEffect(() => {
    if (!isAuthenticated) return;
    settingsApi.get().then(setSettings).catch(() => {});
  }, [isAuthenticated]);

  return <SettingsContext.Provider value={{ settings, setSettings }}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx.settings;
}

export function useSettingsUpdater() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettingsUpdater must be used within SettingsProvider');
  return ctx.setSettings;
}
