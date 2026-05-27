"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "./context/auth-context";
import { AxiosError } from "axios";

// ─── Validation schema (OWASP A03 — client-side input validation) ─────────────
const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(loginSchema as any),
    mode: "onBlur",
  });

  const onSubmit = async (data: LoginFormData) => {
    setApiError(null);
    try {
      await login({ email: data.email, password: data.password });
      router.push("/painel");
    } catch (err) {
      // OWASP A07 — generic error message; never reveal which field is wrong
      if (err instanceof AxiosError) {
        const status = err.response?.status;
        if (status === 429) {
          setApiError("Muitas tentativas. Tente novamente em 15 minutos.");
        } else {
          setApiError("Credenciais inválidas. Verifique e tente novamente.");
        }
      } else {
        setApiError("Erro ao conectar com o servidor. Tente novamente.");
      }
    }
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

          {/* ─── API Error Banner ─── */}
          {apiError && (
            <div className="login-error-banner" role="alert" aria-live="assertive">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{apiError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="login-form" noValidate>
            {/* ─── Email ─── */}
            <div className="form-group">
              <label htmlFor="email">E-mail</label>
              <Input
                id="email"
                type="email"
                placeholder="Insira seu e-mail"
                autoComplete="email"
                aria-describedby={errors.email ? "email-error" : undefined}
                aria-invalid={!!errors.email}
                className={`form-input${errors.email ? " form-input--error" : ""}`}
                {...register("email")}
              />
              {errors.email && (
                <span id="email-error" className="form-field-error" role="alert">
                  {errors.email.message}
                </span>
              )}
            </div>

            {/* ─── Password ─── */}
            <div className="form-group">
              <label htmlFor="password">Senha</label>
              <div className="form-input-wrapper">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Insira sua senha"
                  autoComplete="current-password"
                  aria-describedby={errors.password ? "password-error" : undefined}
                  aria-invalid={!!errors.password}
                  className={`form-input form-input--password${errors.password ? " form-input--error" : ""}`}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  tabIndex={-1}
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
              {errors.password && (
                <span id="password-error" className="form-field-error" role="alert">
                  {errors.password.message}
                </span>
              )}
            </div>

            {/* ─── Row: remember + forgot ─── */}
            <div className="form-row">
              <div className="form-checkbox-row">
                <input type="checkbox" id="remember" />
                <label htmlFor="remember">Manter conectado</label>
              </div>
              <a href="#" className="form-link">Esqueci a senha</a>
            </div>

            {/* ─── Submit ─── */}
            <Button
              type="submit"
              id="login-submit"
              disabled={isSubmitting}
              className="login-submit w-full"
            >
              {isSubmitting ? (
                <svg className="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle opacity="0.25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path opacity="0.75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          <p className="login-footer">
            Problemas com o acesso? <a href="#">Contatar suporte</a>
          </p>
        </div>
      </div>
    </div>
  );
}
