import toastLib from 'react-hot-toast';

const baseStyle = {
  background: 'var(--color-surface)',
  color: 'var(--color-ink)',
  border: '1px solid var(--color-border)',
  borderRadius: '10px',
  fontSize: '13px',
  padding: '10px 14px',
  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
};

export const toast = {
  success: (msg) => toastLib.success(msg, { style: baseStyle, iconTheme: { primary: 'var(--color-success)', secondary: 'var(--color-surface)' } }),
  error: (msg) => toastLib.error(msg, { style: baseStyle, iconTheme: { primary: 'var(--color-danger)', secondary: 'var(--color-surface)' } }),
  info: (msg) => toastLib(msg, { style: baseStyle }),
};
