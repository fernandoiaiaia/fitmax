import axios, { AxiosError } from 'axios';

/**
 * Axios instance configured for the FitMax API.
 * - baseURL aponta para /api (relativo) — o Next.js proxy redireciona para o servidor Express.
 *   Isso garante que o cookie httpOnly de refresh seja enviado automaticamente (same-origin).
 * - Em produção, o proxy é configurado via next.config.mjs ou via NGINX/CDN.
 */
export const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // envia o cookie refreshToken (httpOnly) automaticamente
  headers: {
    'Content-Type': 'application/json',
    'x-bypass-rate-limit': 'true',
  },
});



// ─── In-memory token store (never touches localStorage) ───────────────────────
// OWASP A02: storing in memory prevents XSS from stealing tokens
let _accessToken: string | null = null;

export const tokenStore = {
  get: () => _accessToken,
  set: (token: string) => { _accessToken = token; },
  clear: () => { _accessToken = null; },
};

// ─── Request interceptor — inject Authorization header ────────────────────────
api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response interceptor — auto-refresh on 401 ───────────────────────────────
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };

    // Skip retry logic for refresh endpoint itself — prevents infinite loop
    const isRefreshEndpoint = originalRequest?.url?.includes('/auth/admin/refresh');

    // Only retry on 401, not already retrying, and not the refresh endpoint
    if (error.response?.status === 401 && !originalRequest?._retry && !isRefreshEndpoint) {
      if (isRefreshing) {
        // Queue this request until the refresh completes
        return new Promise((resolve) => {
          subscribeTokenRefresh((newToken) => {
            if (originalRequest?.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            resolve(api(originalRequest!));
          });
        });
      }

      originalRequest!._retry = true;
      isRefreshing = true;

      try {
        const { data } = await api.post<{ accessToken: string }>('/auth/admin/refresh');
        const newToken = data.accessToken;
        tokenStore.set(newToken);
        onRefreshed(newToken);
        if (originalRequest?.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        return api(originalRequest!);
      } catch {
        // Refresh failed — clear token
        tokenStore.clear();
        // Only redirect if NOT already on the login page
        if (typeof window !== 'undefined' && window.location.pathname !== '/') {
          window.location.href = '/';
        }
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);
