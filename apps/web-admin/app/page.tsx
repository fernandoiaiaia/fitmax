"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
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
    setTimeout(() => router.push("/dashboard"), 800);
  };

  return (
    <div className="login-page">
      {/* Ambient orbs */}
      <div className="login-page__orb login-page__orb--1" />
      <div className="login-page__orb login-page__orb--2" />
      <div className="login-page__orb login-page__orb--3" />

      {/* Split Card */}
      <div className="login-split">

        {/* ── LEFT: Form ── */}
        <div className="login-split__form">

          {/* Logo */}
          <div className="ls-logo">
            <div className="ls-logo-text">
              <div className="ls-logo-icon">
                {/* Shield / Admin icon */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <span className="ls-logo-label">
                FitMax <em>Admin</em>
              </span>
              <span className="ls-logo-badge">v2.0</span>
            </div>
          </div>

          <div className="ls-heading">
            <h1>Painel Administrativo</h1>
            <p>Acesso restrito. Apenas administradores autorizados.</p>
          </div>


          <form onSubmit={handleSubmit} className="ls-form" id="form-login-admin">

            {/* E-mail */}
            <div className="ls-field">
              <label htmlFor="adm-email" className="ls-field__label">E-mail corporativo</label>
              <input
                id="adm-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@fitmax.com.br"
                required
                className="ls-field__input"
              />
            </div>

            {/* Senha */}
            <div className="ls-field">
              <div className="ls-field__label-row">
                <label htmlFor="adm-password" className="ls-field__label">Senha</label>
                <a href="#" className="ls-forgot">Esqueci a senha</a>
              </div>
              <div className="ls-field__wrap">
                <input
                  id="adm-password"
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
                  id="btn-toggle-password"
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
                id="adm-remember"
              />
              <span className="ls-check__box" />
              <span className="ls-check__label">Manter sessão ativa por 8 horas</span>
            </label>

            {/* Submit */}
            <button type="submit" disabled={isLoading} className="ls-submit" id="btn-submit-login">
              {isLoading ? (
                <>
                  <svg className="ls-spinner" viewBox="0 0 24 24" fill="none">
                    <circle opacity="0.25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path opacity="0.75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Autenticando...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                    <polyline points="10 17 15 12 10 7" />
                    <line x1="15" y1="12" x2="3" y2="12" />
                  </svg>
                  Acessar Painel Admin
                </>
              )}
            </button>
          </form>
        </div>

        {/* ── RIGHT: CTA ── */}
        <div className="login-split__cta">
          {/* Background */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/admin_bg.png" alt="FitMax Admin" className="login-split__cta-img" />
          <div className="login-split__cta-dark" />
          <div className="login-split__cta-gradient" />

          <div className="login-split__cta-content">
            <div className="ls-cta-badge">
              <span className="ls-cta-badge__dot" />
              ACESSO ADMINISTRATIVO
            </div>

            <h2 className="ls-cta-title">
              Controle total<br />
              <span>da plataforma.</span>
            </h2>
            <p className="ls-cta-sub">
              Gerencie usuários, profissionais, planos, métricas e configurações globais do ecossistema FitMax.
            </p>

            {/* Stats */}
            <div className="ls-cta-stats">
              <div className="ls-cta-stat">
                <span className="ls-cta-stat__val">+12k</span>
                <span className="ls-cta-stat__lbl">Usuários</span>
              </div>
              <div className="ls-cta-stat__sep" />
              <div className="ls-cta-stat">
                <span className="ls-cta-stat__val">+2.4k</span>
                <span className="ls-cta-stat__lbl">Profissionais</span>
              </div>
              <div className="ls-cta-stat__sep" />
              <div className="ls-cta-stat">
                <span className="ls-cta-stat__val">99.9%</span>
                <span className="ls-cta-stat__lbl">Uptime</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
