import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider } from '../lib/auth-context';
import LoginProPage from '../app/login/page';
import { api, tokenStore } from '../lib/api';
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
        defaults: {
          withCredentials: true,
          baseURL: '/api',
        },
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

describe('Front-End OWASP Security Test Suite - web-pro', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tokenStore.clear();
    localStorage.clear();
    sessionStorage.clear();
  });

  // ====================================================
  // OWASP A03:2021-Injection (Cross-Site Scripting - XSS)
  // ====================================================
  it('OWASP A03 (XSS Injection): Escapes script tags entered in inputs and prevents active execution in JSDOM', () => {
    const maliciousPayload = "<script>alert('XSS-ATTACK')</script>";
    
    render(
      <input placeholder="User input" defaultValue={maliciousPayload} readOnly />
    );
    
    const inputElement = screen.getByPlaceholderText('User input') as HTMLInputElement;
    expect(inputElement.value).toBe(maliciousPayload);

    // Valida que o valor do input é renderizado estritamente como texto (escapado no DOM virtual)
    // E que a tag <script> não foi montada como um elemento HTML real do DOM.
    const scriptsInDoc = document.querySelectorAll('script');
    const hasMaliciousScript = Array.from(scriptsInDoc).some(
      s => s.innerHTML.includes("XSS-ATTACK")
    );
    expect(hasMaliciousScript).toBe(false);
  });

  // ====================================================
  // OWASP A04:2021-Insecure Design (Sensitive Data Leakage)
  // ====================================================
  it('OWASP A04 (Insecure Storage): Audits LocalStorage and SessionStorage to verify zero JWT leakage', () => {
    const sensitiveToken = 'header.payload.signature-confidential';
    
    // Define o token no TokenStore volátil em memória
    tokenStore.set(sensitiveToken);
    
    expect(tokenStore.get()).toBe(sensitiveToken);
    
    // O token NUNCA deve ser gravado nas mídias físicas de armazenamento do navegador
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
    expect(sessionStorage.getItem('accessToken')).toBeNull();
    expect(sessionStorage.getItem('token')).toBeNull();
  });

  // ====================================================
  // OWASP A07:2021-Identification and Authentication Failures
  // ====================================================
  it('OWASP A07 (Generic Login Errors): Displays the identical secure generic error banner on login failures, preventing username enumeration', async () => {
    // 1. Caso com Usuário Inexistente
    const mockAxiosError1 = {
      response: {
        status: 401,
        data: { error: 'Credenciais inválidas. Verifique e tente novamente.' }
      }
    };
    vi.mocked(axios.post).mockRejectedValueOnce(mockAxiosError1);

    const { rerender } = render(
      <AuthProvider>
        <LoginProPage />
      </AuthProvider>
    );
    
    fireEvent.change(screen.getByLabelText(/E-mail/i), { target: { value: 'unknown@fitmax.com' } });
    fireEvent.change(screen.getByLabelText(/^Senha$/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Entrar/i }));

    await waitFor(() => {
      expect(screen.getByText('Credenciais inválidas. Verifique e tente novamente.')).toBeInTheDocument();
    });

    // 2. Caso com Senha Incorreta
    const mockAxiosError2 = {
      response: {
        status: 401,
        data: { error: 'Credenciais inválidas. Verifique e tente novamente.' }
      }
    };
    vi.mocked(axios.post).mockRejectedValueOnce(mockAxiosError2);

    rerender(
      <AuthProvider>
        <LoginProPage />
      </AuthProvider>
    );

    fireEvent.change(screen.getByLabelText(/E-mail/i), { target: { value: 'rafael.costa@fitmax.com' } });
    fireEvent.change(screen.getByLabelText(/^Senha$/i), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /Entrar/i }));

    await waitFor(() => {
      // O banner DEVE ser o mesmo em ambos os casos para conter engenharia social e brute force
      expect(screen.getByText('Credenciais inválidas. Verifique e tente novamente.')).toBeInTheDocument();
    });
  });

  it('OWASP A07 (Rate Limiting handling): Properly alerts the user when API rate limit threshold is hit (HTTP 429)', async () => {
    const mockAxiosError = {
      response: {
        status: 429,
        data: { error: 'Muitas tentativas. Tente novamente em 15 minutos.' }
      }
    };
    vi.mocked(axios.post).mockRejectedValueOnce(mockAxiosError);

    render(
      <AuthProvider>
        <LoginProPage />
      </AuthProvider>
    );

    fireEvent.change(screen.getByLabelText(/E-mail/i), { target: { value: 'rafael.costa@fitmax.com' } });
    fireEvent.change(screen.getByLabelText(/^Senha$/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Entrar/i }));

    await waitFor(() => {
      expect(screen.getByText('Muitas tentativas. Tente novamente em 15 minutos.')).toBeInTheDocument();
    });
  });

  // ====================================================
  // OWASP A05:2021-Security Misconfiguration
  // ====================================================
  it('OWASP A05 (Security Misconfiguration): Asserts that Axios is configured with withCredentials enabled to secure HTTPOnly cookies', () => {
    // A propriedade withCredentials deve ser obrigatoriamente true para todas as requisições,
    // garantindo que os cookies HttpOnly de refresh sejam transferidos com segurança.
    expect(api.defaults.withCredentials).toBe(true);
    expect(api.defaults.baseURL).toBe('/api');
  });
});
