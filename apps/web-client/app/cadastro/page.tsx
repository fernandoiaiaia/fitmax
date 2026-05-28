"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { useAuth } from "@/lib/auth-context";

export default function RegisterClientPage() {
  const router = useRouter();
  const { setAccessToken } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data } = await axios.post('/api/auth/client/register', { name, email, password }, { withCredentials: true });
      if (data.accessToken) setAccessToken(data.accessToken);
      router.push("/painel");
    } catch (err: any) {
      setError(
        err.response?.data?.error || "Erro ao conectar com o servidor. Tente novamente."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      {/* ─── Left Panel ─── */}
      <div className="login-hero">
        <img src="/scott-webb-5IsdIqwwNP4-unsplash.jpg" alt="" className="login-hero__img" />
        <div className="login-hero__overlay-green" />
        <div className="login-hero__overlay" />

        <div className="login-hero__content">
          <div className="login-hero__badge">
            <span className="login-hero__badge-pill">ATENDIMENTO 100% ONLINE</span>
          </div>
          <h2 className="login-hero__title">
            Inicie sua jornada<br />
            <span>de saúde e performance.</span>
          </h2>
          <p className="login-hero__subtitle">
            Crie sua conta e tenha acesso aos melhores especialistas para acompanhar a sua evolução.
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
            <img src="/logo.png" alt="FitMax" />
          </div>

          <div className="login-heading">
            <h1>Crie sua conta</h1>
            <p>Preencha os dados abaixo para começar</p>
          </div>

          {error && (
            <div style={{ marginBottom: 16, padding: "12px 16px", backgroundColor: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.3)", borderRadius: 8, color: "#f43f5e", fontSize: 13, textAlign: "center" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="name">Nome completo</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Ana Souza"
                required
                minLength={3}
                className="form-input"
              />
            </div>

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
                  placeholder="Mínimo de 8 caracteres"
                  required
                  minLength={8}
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

            <button type="submit" disabled={isLoading} className="login-submit" style={{ marginTop: 8 }}>
              {isLoading ? (
                <svg className="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle opacity="0.25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path opacity="0.75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                "Criar conta"
              )}
            </button>
          </form>

          <p className="login-footer">
            Já tem uma conta? <Link href="/">Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
