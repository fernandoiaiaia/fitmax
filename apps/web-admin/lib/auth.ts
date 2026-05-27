import { api, tokenStore } from './api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: 'admin';
}

export interface LoginResponse {
  accessToken: string;
  expiresIn: number;
  tokenType: string;
}

/**
 * Calls POST /api/auth/admin/login.
 * On success: stores access token in memory and returns the decoded user.
 */
export async function loginAdmin(credentials: LoginCredentials): Promise<AuthUser> {
  const { data } = await api.post<LoginResponse>('/auth/admin/login', credentials);

  // Store access token in memory (OWASP A02)
  tokenStore.set(data.accessToken);

  // Decode user from token payload (without verifying — server already did that)
  const payload = parseJwtPayload(data.accessToken);
  return { id: payload.sub, email: credentials.email, role: 'admin' };
}

/**
 * Calls POST /api/auth/admin/logout.
 * Clears in-memory token; server revokes the httpOnly refresh cookie.
 */
export async function logoutAdmin(): Promise<void> {
  try {
    await api.post('/auth/admin/logout');
  } finally {
    tokenStore.clear();
  }
}

/**
 * Silently refresh the access token on app load.
 * Returns the user if a valid refresh cookie exists, otherwise null.
 */
export async function silentRefresh(): Promise<AuthUser | null> {
  try {
    const { data } = await api.post<LoginResponse>('/auth/admin/refresh');
    tokenStore.set(data.accessToken);
    const payload = parseJwtPayload(data.accessToken);
    return { id: payload.sub, email: '', role: 'admin' };
  } catch {
    return null;
  }
}

function parseJwtPayload(token: string): { sub: string; role: string } {
  const [, base64Payload] = token.split('.');
  const json = atob(base64Payload.replace(/-/g, '+').replace(/_/g, '/'));
  return JSON.parse(json);
}
