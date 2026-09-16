import { format, formatDistanceToNow, isValid } from 'date-fns';

export function formatDate(value, pattern = 'MMM d, yyyy') {
  const date = value instanceof Date ? value : new Date(value);
  if (!isValid(date)) return '—';
  return format(date, pattern);
}

export function formatDateTime(value) {
  return formatDate(value, 'MMM d, yyyy · h:mm a');
}

export function formatRelative(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (!isValid(date)) return '—';
  return formatDistanceToNow(date, { addSuffix: true });
}
