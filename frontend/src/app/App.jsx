import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import { SettingsProvider } from '../context/SettingsContext';
import AppRouter from './router';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SettingsProvider>
          <AppRouter />
          <Toaster position="top-right" />
        </SettingsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
