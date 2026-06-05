//@ts-nocheck
"use client";

import React, { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../context/auth-context";
import { fetchPerfil } from "../../lib/configuracoes-api";

const menuItems = [
  { label: "Consultas",     href: "/painel/consultas",    icon: "heart-pulse" },
  { label: "Publicações",   href: "/painel/publicacoes",  icon: "megaphone" },
  { label: "Usuários",      href: "/painel/usuarios",     icon: "users" },
  { label: "Relatórios",    href: "/painel/relatorios",   icon: "clipboard" },
  { label: "Assinatura",    href: "/painel/assinatura",   icon: "coin" },
  { label: "Configurações", href: "/painel/configuracoes", icon: "settings" },
  { label: "Agora.io",      href: "/painel/agora",        icon: "video" },
];

function SidebarIcon({ name, color = "#71717a" }: { name: string; color?: string }) {
  const icons: Record<string, React.ReactNode> = {
    home: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    grid: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
    "heart-pulse": (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        <path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27" />
      </svg>
    ),
    megaphone: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 11 18-5v12L3 14v-3z" />
        <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
      </svg>
    ),
    users: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    clipboard: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      </svg>
    ),
    coin: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
        <line x1="12" y1="18" x2="12" y2="6" />
      </svg>
    ),
    settings: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
    "arrow-left": (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
      </svg>
    ),
    "arrow-right": (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
      </svg>
    ),
    "log-out": (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
      </svg>
    ),
    bell: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
    x: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    ),
    video: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m22 8-6 4 6 4V8Z" />
        <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
      </svg>
    ),
  };
  return <div style={{ color }}>{icons[name]}</div>;
}

export default function PainelLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen]           = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const pathname = usePathname();
  const router   = useRouter();
  const { logout, isAuthenticated, isLoading, error } = useAuth();
  const [profile, setProfile] = useState<{ name: string; avatarUrl: string | null } | null>(null);

  const loadProfile = useCallback(() => {
    if (isAuthenticated) {
      fetchPerfil()
        .then(p => {
          const url = p.avatarUrl ? `${p.avatarUrl}?t=${Date.now()}` : null;
          setProfile({ name: p.name ?? "Admin FitMax", avatarUrl: url });
        })
        .catch(() => {});
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadProfile();
    window.addEventListener("perfil-atualizado", loadProfile);
    return () => {
      window.removeEventListener("perfil-atualizado", loadProfile);
    };
  }, [loadProfile]);

  const handleLogout = useCallback(async () => {
    setSidebarOpen(false);
    await logout();
    router.push('/');
  }, [logout, router]);

  // Guard client-side: se o silentRefresh falhar, redireciona para login
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/');
    }
  }, [isLoading, isAuthenticated, router]);

  // Enquanto verifica a sessão, mostra loading para evitar flash de conteúdo
  if (isLoading) {
    return (
      <div style={{ display:'flex', height:'100vh', alignItems:'center', justifyContent:'center', backgroundColor:'#111' }}>
        <div style={{ color:'#10b981', fontSize:13, fontFamily:'system-ui' }}>Carregando...</div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <>
      <style>{`
        button, [role="button"] {
          transition: border-color 0.15s ease, box-shadow 0.15s ease !important;
        }
        button:hover, [role="button"]:hover {
          border-color: rgba(16, 185, 129, 0.65) !important;
          box-shadow: 0 0 0 1px rgba(16, 185, 129, 0.3) !important;
          outline: none !important;
        }
        button[data-bg-green]:hover {
          box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.5) !important;
        }
        .sidebar-inner {
          flex: 1; overflow-y: auto;
          display: flex; flex-direction: column;
        }
        .sidebar-mobile-close {
          display: none; align-items: center;
          justify-content: flex-end; padding: 0 0.75rem 0.5rem;
        }
        @media (max-width: 768px) {
          .sidebar-mobile-close { display: flex; }
        }
        .sidebar-mobile-close-btn {
          width: 32px; height: 32px; border-radius: 8px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: #a1a1aa;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
        }
      `}</style>

      <div className="pro-layout">

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="pro-sidebar-overlay"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── Sidebar ── */}
        <aside
          className={[
            "pro-sidebar",
            desktopCollapsed ? "pro-sidebar--collapsed" : "",
            sidebarOpen      ? "pro-sidebar--open"      : "",
          ].join(" ")}
        >
          {/* Desktop collapse toggle */}
          <button
            className="pro-sidebar__toggle"
            onClick={() => setDesktopCollapsed(!desktopCollapsed)}
            aria-label={desktopCollapsed ? "Expandir sidebar" : "Recolher sidebar"}
          >
            <SidebarIcon name={desktopCollapsed ? "arrow-right" : "arrow-left"} color="#a1a1aa" />
          </button>

          <div className="sidebar-inner">

            {/* Mobile close button */}
            <div className="sidebar-mobile-close">
              <button
                className="sidebar-mobile-close-btn"
                onClick={() => setSidebarOpen(false)}
                aria-label="Fechar menu"
              >
                <SidebarIcon name="x" color="#a1a1aa" />
              </button>
            </div>

            {/* Logo */}
            <div className="pro-sidebar__logo">
              <div className="pro-sidebar__logo-icon">
                <SidebarIcon name="grid" color="#10b981" />
              </div>
              {!desktopCollapsed && (
                <span className="pro-sidebar__logo-text">
                  Fit<span>Max</span> <em>ADMIN</em>
                </span>
              )}
            </div>

            {/* Profile Block */}
            <div className={`pro-profile${desktopCollapsed ? " pro-profile--collapsed" : ""}`}>
              <img
                src={profile?.avatarUrl || "https://picsum.photos/200/200?random=40"}
                alt="Admin FitMax"
                className="pro-profile__avatar"
              />
              {!desktopCollapsed && (
                <>
                  <p className="pro-profile__name">{profile?.name || "Admin FitMax"}</p>
                  <p className="pro-profile__role">Acesso total · Nível 5 🔐</p>
                  <div className="pro-profile__stats">
                    <div className="pro-profile__stat">
                      <span className="pro-profile__stat-val">12k</span>
                      <span className="pro-profile__stat-lbl">Usuários</span>
                    </div>
                    <div className="pro-profile__stat-sep" />
                    <div className="pro-profile__stat">
                      <span className="pro-profile__stat-val">450</span>
                      <span className="pro-profile__stat-lbl">Pro</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="pro-sidebar__divider" />

            {/* Navigation */}
            <nav className="pro-sidebar__nav">
              {menuItems.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={[
                      "pro-nav-item",
                      isActive         ? "pro-nav-item--active"    : "",
                      desktopCollapsed ? "pro-nav-item--icon-only" : "",
                    ].join(" ")}
                  >
                    <span className="pro-nav-item__icon">
                      <SidebarIcon
                        name={item.icon}
                        color={isActive ? "#10b981" : "#71717a"}
                      />
                    </span>
                    {!desktopCollapsed && item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Logout */}
            <div className="pro-sidebar__footer">
              <button
                onClick={handleLogout}
                className={[
                  "pro-nav-item",
                  "pro-nav-item--signout",
                  desktopCollapsed ? "pro-nav-item--icon-only" : "",
                ].join(" ")}
                style={{ width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
              >
                <span className="pro-nav-item__icon">
                  <SidebarIcon name="log-out" color="#52525b" />
                </span>
                {!desktopCollapsed && "Sair"}
              </button>
            </div>

          </div>
        </aside>

        {/* ── Right Side ── */}
        <div className="pro-right">

          {/* Topbar */}
          <header className="pro-topbar">
            <button
              className="pro-topbar__menu-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menu"
            >
              <SidebarIcon name="grid" color="#a1a1aa" />
            </button>

            <div style={{ flex: 1 }} />

            <div className="pro-topbar__actions">
              <button className="pro-topbar__icon-btn" aria-label="Notificações">
                <SidebarIcon name="bell" color="#71717a" />
                <span className="pro-topbar__notif-dot" />
              </button>
              <img
                src={profile?.avatarUrl || "https://picsum.photos/200/200?random=40"}
                alt="Admin FitMax"
                className="pro-topbar__avatar"
              />
            </div>
          </header>

          {/* Page Content */}
          <main className="pro-content">
            {children}
          </main>

        </div>

      </div>
    </>
  );
}
