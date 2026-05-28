//@ts-nocheck
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import "./responsive.css";

const menuItems = [
  { label: "Painel",        href: "/painel",               icon: "grid" },
  { label: "Consultas",     href: "/painel/consultas",     icon: "users" },
  { label: "Feed",          href: "/painel/feed",          icon: "home" },
  { label: "Histórico",     href: "/painel/historico",     icon: "history" },
  { label: "Relatórios",    href: "/painel/relatorios",    icon: "bar-chart" },
  { label: "Agenda",        href: "/painel/agenda",        icon: "calendar-check" },
  { label: "Configurações", href: "/painel/configuracoes", icon: "settings" },
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
    "calendar-check": (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><path d="m9 16 2 2 4-4" />
      </svg>
    ),
    history: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l4 2" />
      </svg>
    ),
    users: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    "bar-chart": (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" />
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
    "x": (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    ),
  };
  return <div style={{ color }}>{icons[name]}</div>;
}

export default function PainelLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen]         = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const nomeExibido    = user?.nome ?? 'Profissional';
  const roleExibida    = [user?.especialidade, user?.registroProfissional].filter(Boolean).join(' · ');
  const avatarUrl      = user?.avatarUrl ?? `https://picsum.photos/200/200?random=10`;
  const totalConsultas = user?.totalConsultas ?? 0;

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
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }
        .sidebar-mobile-close {
          display: none;
          align-items: center;
          justify-content: flex-end;
          padding: 0 0.75rem 0.5rem;
        }
        @media (max-width: 768px) {
          .sidebar-mobile-close { display: flex; }
        }
        .sidebar-mobile-close-btn {
          width: 32px; height: 32px;
          border-radius: 8px;
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
                  Fit<span>Max</span> <em>PRO</em>
                </span>
              )}
            </div>

            {/* Profile Block */}
            <div className={`pro-profile${desktopCollapsed ? " pro-profile--collapsed" : ""}`}>
              <img
                src={avatarUrl}
                alt={nomeExibido}
                className="pro-profile__avatar"
              />
              {!desktopCollapsed && (
                <>
                  <p className="pro-profile__name">{nomeExibido}</p>
                  <p className="pro-profile__role">{roleExibida || 'Profissional FitMax'}</p>
                  <div className="pro-profile__stats">
                    <div className="pro-profile__stat">
                      <span className="pro-profile__stat-val">—</span>
                      <span className="pro-profile__stat-lbl">Pacientes</span>
                    </div>
                    <div className="pro-profile__stat-sep" />
                    <div className="pro-profile__stat">
                      <span className="pro-profile__stat-val">{totalConsultas}</span>
                      <span className="pro-profile__stat-lbl">Consultas</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="pro-sidebar__divider" />

            {/* Navigation */}
            <nav className="pro-sidebar__nav">
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={[
                      "pro-nav-item",
                      isActive          ? "pro-nav-item--active"    : "",
                      desktopCollapsed  ? "pro-nav-item--icon-only" : "",
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
                onClick={logout}
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
            {/* Mobile menu button */}
            <button
              className="pro-topbar__menu-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menu"
            >
              <SidebarIcon name="grid" color="#a1a1aa" />
            </button>

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* Right actions */}
            <div className="pro-topbar__actions">
              <button className="pro-topbar__icon-btn" aria-label="Notificações">
                <SidebarIcon name="bell" color="#71717a" />
                <span className="pro-topbar__notif-dot" />
              </button>
              <img
                src={avatarUrl}
                alt={nomeExibido}
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
