import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider } from '../app/context/auth-context';
import LoginPage from '../app/page';
import { api } from '../lib/api';
import { AxiosError } from 'axios';

// 1. Mock the API
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

// 2. Mock next/navigation
const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

const createFakeJwt = (payload: any) => {
  const base64Payload = btoa(JSON.stringify(payload));
  return `header.${base64Payload}.signature`;
};

describe('Frontend Integration Test: Login Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('completes the full login flow successfully', async () => {
    const fakeToken = createFakeJwt({ sub: 'user-123', role: 'admin' });
    
    vi.mocked(api.post).mockImplementation(async (url) => {
      if (url === '/auth/admin/refresh') {
        const err = new AxiosError('Unauthorized');
        err.response = { status: 401, data: {} } as any;
        throw err;
      }
      if (url === '/auth/admin/logout') {
        return { data: {} };
      }
      if (url === '/auth/admin/login') {
        return { data: { accessToken: fakeToken } };
      }
      return { data: {} };
    });

    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    );

    const emailInput = screen.getByLabelText(/E-mail/i);
    const passwordInput = screen.getByLabelText(/^Senha$/i);
    const submitBtn = screen.getByRole('button', { name: /Entrar/i });

    fireEvent.change(emailInput, { target: { value: 'admin@fitmax.com' } });
    fireEvent.change(passwordInput, { target: { value: 'senha123' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/admin/login', {
        email: 'admin@fitmax.com',
        password: 'senha123',
      });
    });

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/painel');
    });
  });

  it('shows error banner when login fails with 401', async () => {
    vi.mocked(api.post).mockImplementation(async (url) => {
      if (url === '/auth/admin/refresh') {
        const err = new AxiosError('Unauthorized');
        err.response = { status: 401, data: {} } as any;
        throw err;
      }
      if (url === '/auth/admin/logout') {
        return { data: {} };
      }
      if (url === '/auth/admin/login') {
        const err = new AxiosError('Unauthorized');
        err.response = { status: 401, data: {} } as any;
        throw err;
      }
      return { data: {} };
    });

    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    );

    fireEvent.change(screen.getByLabelText(/E-mail/i), { target: { value: 'admin@fitmax.com' } });
    fireEvent.change(screen.getByLabelText(/^Senha$/i), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /Entrar/i }));

    await waitFor(() => {
      expect(screen.getByText('Credenciais inválidas. Verifique e tente novamente.')).toBeInTheDocument();
    });
    
    expect(pushMock).not.toHaveBeenCalled();
  });
});
