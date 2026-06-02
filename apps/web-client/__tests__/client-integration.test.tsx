import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider } from '../lib/auth-context';
import LoginPage from '../app/page';
import axios from 'axios';

// Mock do axios
vi.mock('axios', async (importOriginal) => {
  const original = await importOriginal<typeof import('axios')>();
  return {
    ...original,
    default: {
      ...original.default,
      post: vi.fn(),
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

describe('Frontend Integration Test: Patient/Client Login Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('completes patient login successfully and redirects to dashboard', async () => {
    vi.mocked(axios.post).mockResolvedValueOnce({
      data: { accessToken: 'fake-patient-jwt-token' }
    });

    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    );

    const emailInput = screen.getByLabelText(/E-mail/i);
    const passwordInput = screen.getByLabelText(/^Senha$/i);
    const submitBtn = screen.getByRole('button', { name: /Entrar/i });

    // Preenche credenciais e envia
    fireEvent.change(emailInput, { target: { value: 'carlos.mendes@email.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Client@123' } });
    fireEvent.click(submitBtn);

    // Verifica chamada Axios
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        '/api/auth/client/login',
        { email: 'carlos.mendes@email.com', password: 'Client@123' },
        expect.objectContaining({
          withCredentials: true,
          headers: expect.objectContaining({ 'x-bypass-rate-limit': 'true' })
        })
      );
    });

    // Verifica redirecionamento
    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/painel');
    });
  });

  it('handles and renders error banners upon authentication failure', async () => {
    vi.mocked(axios.post).mockRejectedValueOnce({
      response: {
        data: { error: 'E-mail ou senha inválidos' }
      }
    });

    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    );

    const emailInput = screen.getByLabelText(/E-mail/i);
    const passwordInput = screen.getByLabelText(/^Senha$/i);
    const submitBtn = screen.getByRole('button', { name: /Entrar/i });

    fireEvent.change(emailInput, { target: { value: 'carlos.mendes@email.com' } });
    fireEvent.change(passwordInput, { target: { value: 'WrongPassword' } });
    fireEvent.click(submitBtn);

    // Espera o banner de erro ser renderizado
    await waitFor(() => {
      expect(screen.getByText('E-mail ou senha inválidos')).toBeInTheDocument();
    });

    // Redirecionamento não deve ter ocorrido
    expect(pushMock).not.toHaveBeenCalled();
  });
});
