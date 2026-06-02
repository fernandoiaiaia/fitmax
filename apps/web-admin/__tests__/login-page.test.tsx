import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from '../app/page';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock auth-context
vi.mock('../app/context/auth-context', () => ({
  useAuth: () => ({
    login: vi.fn(),
  }),
}));

describe('LoginPage', () => {
  it('renders login form correctly', () => {
    render(<LoginPage />);
    expect(screen.getByRole('heading', { name: /Painel Administrativo/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/E-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Senha$/i)).toBeInTheDocument();
  });

  it('shows validation errors on empty submit', async () => {
    render(<LoginPage />);
    const submitButton = screen.getByRole('button', { name: /Entrar/i });
    
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('E-mail inválido')).toBeInTheDocument();
    });
  });
});
