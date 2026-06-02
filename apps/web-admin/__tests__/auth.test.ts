import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loginAdmin, logoutAdmin } from '../lib/auth';
import { api, tokenStore } from '../lib/api';

vi.mock('../lib/api', () => ({
  api: {
    post: vi.fn(),
  },
  tokenStore: {
    get: vi.fn(),
    set: vi.fn(),
    clear: vi.fn(),
  },
}));

const createFakeJwt = (payload: any) => {
  const base64Payload = btoa(JSON.stringify(payload));
  return `header.${base64Payload}.signature`;
};

describe('Auth logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loginAdmin calls api and sets token', async () => {
    const fakeToken = createFakeJwt({ sub: 'user-123', role: 'admin' });
    vi.mocked(api.post).mockResolvedValueOnce({ data: { accessToken: fakeToken } } as any);

    const user = await loginAdmin({ email: 'admin@fitmax.com', password: 'password123' });

    expect(api.post).toHaveBeenCalledWith('/auth/admin/login', { email: 'admin@fitmax.com', password: 'password123' });
    expect(tokenStore.set).toHaveBeenCalledWith(fakeToken);
    expect(user).toEqual({ id: 'user-123', email: 'admin@fitmax.com', role: 'admin' });
  });

  it('logoutAdmin calls api and clears token', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: {} } as any);

    await logoutAdmin();

    expect(api.post).toHaveBeenCalledWith('/auth/admin/logout');
    expect(tokenStore.clear).toHaveBeenCalled();
  });
});
