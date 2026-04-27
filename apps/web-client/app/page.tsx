"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // 🚧 DEV MODE — bypassa autenticação
    setTimeout(() => router.push("/painel"), 800);
  };

  return (
    <div className="login-page">
      {/* Ambient background orbs */}
      <div className="login-page__orb login-page__orb--1" />
      <div className="login-page__orb login-page__orb--2" />

      {/* ── Split Card ── */}
      <div className="login-split">

        {/* ── LEFT: Form panel ── */}
        <div className="login-split__form">
          {/* Logo */}
          <div className="ls-logo">
            <div className="ls-logo-brand">
              <div className="ls-logo-brand__icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <div className="ls-logo-brand__text">
                <span className="ls-logo-brand__name">Fit<span>Max</span></span>
                <span className="ls-logo-brand__badge">Client</span>
              </div>
            </div>
          </div>

          <div className="ls-heading">
            <h1>Já faz parte do FitMax?</h1>
            <p>Entre na sua conta e continue sua jornada.</p>
          </div>

          {/* Google */}
          <button type="button" className="ls-google">
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Entrar com Google
          </button>

          {/* Divider */}
          <div className="ls-divider">
            <span className="ls-divider__line" />
            <span className="ls-divider__text">ou entre com e-mail</span>
            <span className="ls-divider__line" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="ls-form">
            {/* E-mail */}
            <div className="ls-field">
              <label htmlFor="email" className="ls-field__label">E-mail</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="ls-field__input"
              />
            </div>

            {/* Senha */}
            <div className="ls-field">
              <div className="ls-field__label-row">
                <label htmlFor="password" className="ls-field__label">Senha</label>
                <a href="#" className="ls-forgot">Esqueci a senha</a>
              </div>
              <div className="ls-field__wrap">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="ls-field__input ls-field__input--pwd"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="ls-eye"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember */}
            <label className="ls-check">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="ls-check__native"
              />
              <span className="ls-check__box" />
              <span className="ls-check__label">Manter conectado</span>
            </label>

            {/* Submit */}
            <button type="submit" disabled={isLoading} className="ls-submit">
              {isLoading ? (
                <>
                  <svg className="ls-spinner" viewBox="0 0 24 24" fill="none">
                    <circle opacity="0.25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path opacity="0.75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Entrando...
                </>
              ) : "Entrar"}
            </button>
          </form>
        </div>

        {/* ── RIGHT: CTA panel ── */}
        <div className="login-split__cta">
          {/* Background photo */}
          <img
            src="/login_gym_bg_1776717134186.png"
            alt="Academia FitMax"
            className="login-split__cta-img"
          />
          {/* Overlays */}
          <div className="login-split__cta-dark" />
          <div className="login-split__cta-gradient" />

          {/* Content */}
          <div className="login-split__cta-content">
            <div className="ls-cta-badge">
              <span className="ls-cta-badge__dot" />
              PLATAFORMA 100% DIGITAL
            </div>

            <h2 className="ls-cta-title">
              Ainda não faz parte<br />
              <span>do FitMax?</span>
            </h2>
            <p className="ls-cta-sub">
              Conecte-se com especialistas certificados em saúde e performance. Consultas, treinos e acompanhamento em um só lugar.
            </p>

            <a href="#" className="ls-cta-btn">
              Criar conta grátis
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </a>

            {/* Stats */}
            <div className="ls-cta-stats">
              <div className="ls-cta-stat">
                <span className="ls-cta-stat__val">+2.4k</span>
                <span className="ls-cta-stat__lbl">Especialistas</span>
              </div>
              <div className="ls-cta-stat__sep" />
              <div className="ls-cta-stat">
                <span className="ls-cta-stat__val">98%</span>
                <span className="ls-cta-stat__lbl">Satisfação</span>
              </div>
              <div className="ls-cta-stat__sep" />
              <div className="ls-cta-stat">
                <span className="ls-cta-stat__val">+50k</span>
                <span className="ls-cta-stat__lbl">Consultas/mês</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
