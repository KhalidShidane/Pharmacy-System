import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const client = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Normalizes every failure into an Error whose `message` is already the
// user-facing string, so callers (and toasts) never have to reach into
// err.response.data themselves.
client.interceptors.response.use(
  (res) => res,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Something went wrong';

    const details = error.response?.data?.details;

    const normalized = new Error(message);
    normalized.status = error.response?.status;
    normalized.details = details;

    return Promise.reject(normalized);
  }
);