import axios, { AxiosError } from 'axios';

/**
 * Cliente Axios do web-pro.
 * - baseURL /api é proxiada pelo Next.js para http://localhost:3001/api
 * - withCredentials garante envio do cookie httpOnly (fitmax_pro_refresh)
 */
export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// ─── In-memory token store ─────────────────────────────────────────────────────
// OWASP A02: mantido em memória — nunca em localStorage
let _accessToken: string | null = null;

export const tokenStore = {
  get: () => _accessToken,
  set: (token: string) => { _accessToken = token; },
  clear: () => { _accessToken = null; },
};

// ─── Request interceptor — injeta Authorization header ────────────────────────
api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Response interceptor — auto-refresh silencioso em 401 ───────────────────
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}
function onRefreshed(token: string) {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
}

api.interceptors.response.use(
  res => res,
  async (error: AxiosError) => {
    const original = error.config as typeof error.config & { _retry?: boolean };
    const isRefreshEndpoint = original?.url?.includes('/auth/client/refresh');

    if (error.response?.status === 401 && !original?._retry && !isRefreshEndpoint) {
      if (isRefreshing) {
        return new Promise(resolve => {
          subscribeTokenRefresh(newToken => {
            if (original?.headers) original.headers.Authorization = `Bearer ${newToken}`;
            resolve(api(original!));
          });
        });
      }

      original!._retry = true;
      isRefreshing = true;

      try {
        const { data } = await api.post<{ accessToken: string }>('/auth/client/refresh');
        tokenStore.set(data.accessToken);
        onRefreshed(data.accessToken);
        if (original?.headers) original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original!);
      } catch {
        tokenStore.clear();
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
