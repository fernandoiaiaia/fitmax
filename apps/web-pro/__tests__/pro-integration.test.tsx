import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider } from '../lib/auth-context';
import LoginProPage from '../app/login/page';
import axios from 'axios';

// Mock do axios.post
vi.mock('axios', async (importOriginal) => {
  const original = await importOriginal<typeof import('axios')>();
  return {
    ...original,
    default: {
      ...original.default,
      post: vi.fn(),
      create: vi.fn().mockReturnValue({
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() },
        },
      }),
    },
  };
});

// Mock do next/navigation
const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

describe('Frontend Integration Test: Professional Login Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('completes the full professional login flow successfully and redirects', async () => {
    // Mock response do login bem-sucedido
    vi.mocked(axios.post).mockResolvedValueOnce({
      data: { accessToken: 'fake-pro-jwt-token' }
    });

    render(
      <AuthProvider>
        <LoginProPage />
      </AuthProvider>
    );

    const emailInput = screen.getByLabelText(/E-mail/i);
    const passwordInput = screen.getByLabelText(/^Senha$/i);
    const submitBtn = screen.getByRole('button', { name: /Entrar/i });

    // Preenche credenciais e submete
    fireEvent.change(emailInput, { target: { value: 'pro@fitmax.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitBtn);

    // Verifica que o POST correto foi enviado
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        '/api/auth/pro/login',
        { email: 'pro@fitmax.com', password: 'password123' },
        { withCredentials: true }
      );
    });

    // Verifica redirecionamento
    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/painel');
    });
  });

  it('displays API error message upon login failure', async () => {
    // Mock response de erro de autenticação (ex: 401)
    const mockAxiosError = {
      response: {
        status: 401,
        data: { error: 'E-mail ou senha inválidos' }
      }
    };
    vi.mocked(axios.post).mockRejectedValueOnce(mockAxiosError);

    render(
      <AuthProvider>
        <LoginProPage />
      </AuthProvider>
    );

    const emailInput = screen.getByLabelText(/E-mail/i);
    const passwordInput = screen.getByLabelText(/^Senha$/i);
    const submitBtn = screen.getByRole('button', { name: /Entrar/i });

    // Preenche credenciais incorretas e submete
    fireEvent.change(emailInput, { target: { value: 'pro@fitmax.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitBtn);

    // Confirma exibição da mensagem de erro retornada pela API
    await waitFor(() => {
      expect(screen.getByText('E-mail ou senha inválidos')).toBeInTheDocument();
    });

    // Não deve redirecionar
    expect(pushMock).not.toHaveBeenCalled();
  });
});
