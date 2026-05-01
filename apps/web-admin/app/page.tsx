"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.push("/painel");
    }, 1500);
  };

  return (
    <div className="login-wrapper">
      {/* ─── Left Panel ─── */}
      <div className="login-hero">
        <img src="/admin_bg.png" alt="" className="login-hero__img" />
        <div className="login-hero__overlay-green" />
        <div className="login-hero__overlay" />

        <div className="login-hero__content">
          <div className="login-hero__badge">
            <span className="login-hero__badge-pill">GESTÃO E CONTROLE</span>
          </div>
          <h2 className="login-hero__title">
            Administração centralizada <span>FitMax.</span>
          </h2>
          <p className="login-hero__subtitle">
            Gerencie profissionais, pacientes, publicações e assinaturas de forma rápida e segura.
          </p>
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
            <img src="/brand-logo.png" alt="FitMax Admin" />
          </div>

          <div className="login-heading">
            <h1>Painel Administrativo</h1>
            <p>Acesse com suas credenciais de administrador</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">E-mail</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Insira seu e-mail"
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
                  placeholder="Insira sua senha"
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



          <p className="login-footer">
            Problemas com o acesso? <a href="#">Contatar suporte</a>
          </p>
        </div>
      </div>
    </div>
  );
}
