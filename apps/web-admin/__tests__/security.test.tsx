import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from '../app/page';
import { Input } from '../components/ui/input';
import { api, tokenStore } from '../lib/api';
import { useAuth } from '../app/context/auth-context';
import { AxiosError } from 'axios';

// Mock do Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock do hook useAuth
vi.mock('../app/context/auth-context', () => ({
  useAuth: vi.fn(),
}));

describe('Front-End OWASP Security Test Suite', () => {
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
    
    render(<Input placeholder="User input" defaultValue={maliciousPayload} />);
    
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
    const loginMock = vi.fn();
    vi.mocked(useAuth).mockReturnValue({
      login: loginMock,
    } as any);

    // 1. Caso com Usuário Inexistente
    loginMock.mockRejectedValueOnce(new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', undefined, undefined, {
      status: 401,
      data: { error: 'User not found' },
    } as any));

    const { rerender } = render(<LoginPage />);
    
    fireEvent.change(screen.getByLabelText(/E-mail/i), { target: { value: 'unknown@fitmax.com' } });
    fireEvent.change(screen.getByLabelText(/^Senha$/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Entrar/i }));

    await waitFor(() => {
      expect(screen.getByText('Credenciais inválidas. Verifique e tente novamente.')).toBeInTheDocument();
    });

    // 2. Caso com Senha Incorreta
    loginMock.mockRejectedValueOnce(new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', undefined, undefined, {
      status: 401,
      data: { error: 'Incorrect password' },
    } as any));

    rerender(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/E-mail/i), { target: { value: 'admin@fitmax.com' } });
    fireEvent.change(screen.getByLabelText(/^Senha$/i), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /Entrar/i }));

    await waitFor(() => {
      // O banner DEVE ser o mesmo em ambos os casos para conter engenharia social e brute force
      expect(screen.getByText('Credenciais inválidas. Verifique e tente novamente.')).toBeInTheDocument();
    });
  });

  it('OWASP A07 (Rate Limiting handling): Properly alerts the user when API rate limit threshold is hit (HTTP 429)', async () => {
    const loginMock = vi.fn();
    vi.mocked(useAuth).mockReturnValue({
      login: loginMock,
    } as any);

    loginMock.mockRejectedValueOnce(new AxiosError('Too Many Requests', 'ERR_BAD_REQUEST', undefined, undefined, {
      status: 429,
      data: { error: 'Too many requests' },
    } as any));

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/E-mail/i), { target: { value: 'admin@fitmax.com' } });
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
