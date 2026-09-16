import axios from 'axios';

export const client = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

// Normalizes every failure into an Error whose `message` is already the
// user-facing string, so callers (and toasts) never have to reach into
// err.response.data themselves.
client.interceptors.response.use(
  (res) => res,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Something went wrong';
    const details = error.response?.data?.details;
    const normalized = new Error(message);
    normalized.status = error.response?.status;
    normalized.details = details;
    return Promise.reject(normalized);
  }
);
