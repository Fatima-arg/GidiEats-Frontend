import axios, { AxiosError } from 'axios';
import { useAuth } from '../store/auth';
import { clearAuth } from '../store/storage';
import type { ApiErrorBody } from './types';

const metaEnv = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};
const envApiUrl = String(metaEnv.VITE_API_URL || metaEnv.VITE_BACKEND_URL || '').trim();

// Format base URL:
// In production or when hosted, if VITE_API_URL is provided, route directly to that backend.
// In local development when VITE_API_URL is unset, default to '/api' to use Vite's dev proxy.
export const API_BASE_URL = envApiUrl
  ? (envApiUrl.endsWith('/api') ? envApiUrl : `${envApiUrl.replace(/\/+$/, '')}/api`)
  : '/api';

export const BACKEND_ROOT_URL = envApiUrl
  ? envApiUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '')
  : '';

export function resolveImageUrl(src?: string | null): string {
  if (!src) return '';
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
    return src;
  }
  return `${BACKEND_ROOT_URL}${src.startsWith('/') ? '' : '/'}${src}`;
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = useAuth.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(undefined, (error: AxiosError<ApiErrorBody>) => {
  if (error.response?.status === 401) {
    clearAuth();
    useAuth.getState().logout();
  }
  return Promise.reject(error);
});

export function apiMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const data = error.response?.data;
    if (data?.message) return data.message;
    if (data?.details?.length) return data.details.map((e) => `${e.field}: ${e.message}`).join('; ');
    if (data?.errors?.length) return data.errors.map((e) => e.message).join('; ');
    if (error.response?.status && !error.response.data) {
      if (error.response.status === 401) return 'Your session has expired. Please log in again.';
      if (error.response.status >= 500) return 'Something went wrong on the server. Please try again.';
    }
  }
  return 'Network error. Please check your connection and try again.';
}

export function unwrap<T>(res: { data: { data: T } }): T {
  return res.data.data;
}