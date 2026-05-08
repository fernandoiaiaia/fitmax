"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginProPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // 🚧 DEV MODE — bypassa autenticação
    setTimeout(() => {
      setIsLoading(false);
      router.push("/painel");
    }, 1500);
  };

  return (
    <div className="login-wrapper">
      {/* ─── Left Panel ─── */}
      <div className="login-hero">
        <img src="/login_gym_bg.png" alt="FitMax Pro" className="login-hero__img" />
        <div className="login-hero__overlay-green" />
        <div className="login-hero__overlay" />

        <div className="login-hero__content">
          <div className="login-hero__badge">
            <span className="login-hero__badge-pill">PORTAL DO PROFISSIONAL</span>
          </div>
          <h2 className="login-hero__title">
            Tudo que você precisa<br />
            <span>em um só lugar.</span>
          </h2>
          <p className="login-hero__subtitle">
            Gerencie agenda, consultas, pacientes e relatórios de performance. Foco total no que importa: seus resultados.
          </p>
          
          <div style={{ marginTop: 24, padding: "12px 16px", backgroundColor: "rgba(16,185,129,0.1)", borderRadius: 8, borderLeft: "4px solid #10b981" }}>
            <p style={{ color: "#e4e4e7", fontSize: 13, margin: 0, fontWeight: 500, lineHeight: 1.5 }}>
              Acesso exclusivo para profissionais de saúde com registro ativo:
              <br/>
              <span style={{ color: "#10b981", fontWeight: "bold" }}>CRM, CRP, CRN, CREF e CREFITO.</span>
            </p>
          </div>
        </div>
      </div>

      {/* ─── Right Panel ─── */}
      <div className="login-form-panel">
        {/* Blurred bokeh orbs */}
        <div className="orb orb--1" />
        <div className="orb orb--2" />
        <div className="orb orb--3" />
        <div className="orb orb--4" />

        <div className="login-form-container">
          <div className="login-logo">
            <img src="/brand-logo.png" alt="FitMax Pro" />
          </div>

          <div className="login-heading">
            <h1>Acesse o FitMax Pro</h1>
            <p>Gerencie sua agenda, consultas e pacientes.</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">E-mail</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Senha</label>
              <div className="form-input-wrapper">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="form-input form-input--password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="form-row">
              <div className="form-checkbox-row">
                <input type="checkbox" id="remember" />
                <label htmlFor="remember">Manter conectado</label>
              </div>
              <a href="#" className="form-link">Esqueci a senha</a>
            </div>

            <button type="submit" disabled={isLoading} className="login-submit">
              {isLoading ? (
                <svg className="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle opacity="0.25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path opacity="0.75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                "Entrar"
              )}
            </button>
          </form>

          <div className="login-divider">
            <div className="login-divider__line" />
            <span className="login-divider__text">ou</span>
            <div className="login-divider__line" />
          </div>

          <button type="button" className="login-google">
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continuar com o Google
          </button>

          <p className="login-footer">
            Problemas com o acesso? <a href="#">Contatar suporte</a>
          </p>
        </div>
      </div>
    </div>
  );
}
