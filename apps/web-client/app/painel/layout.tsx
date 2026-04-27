"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  { label: "Painel",        href: "/painel",              icon: "grid" },
  { label: "Consultas",     href: "/painel/consultas",    icon: "users" },
  { label: "Feed",          href: "/painel/feed",         icon: "home" },
  { label: "Histórico",     href: "/painel/historico",    icon: "history" },
  { label: "Configurações", href: "/painel/config",       icon: "settings" },
];

function Icon({ name }: { name: string }) {
  const icons: Record<string, React.ReactNode> = {
    grid: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
    home: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    users: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    history: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>,
    settings: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
    "chevron-left": <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
    "chevron-right": <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
    menu: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
    "log-out": <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    search: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    bell: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    pulse: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  };
  return <>{icons[name] ?? null}</>;
}

export default function PainelLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="pro-layout">

      {mobileOpen && (
        <div className="pro-sidebar-overlay" onClick={() => setMobileOpen(false)} />
      )}

      {/* ═══ SIDEBAR ═══ */}
      <aside className={`pro-sidebar ${collapsed ? "pro-sidebar--collapsed" : ""} ${mobileOpen ? "pro-sidebar--open" : ""}`}>

        <button
          id="btn-sidebar-toggle"
          className="pro-sidebar__toggle"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
        >
          <Icon name={collapsed ? "chevron-right" : "chevron-left"} />
        </button>

        {/* Logo */}
        <div className="pro-sidebar__logo">
          <div className="pro-sidebar__logo-icon">
            <Icon name="pulse" />
          </div>
          {!collapsed && (
            <span className="pro-sidebar__logo-text">
              Fit<span>Max</span> <em>Client</em>
            </span>
          )}
        </div>

        {/* Profile */}
        <div className={`pro-profile ${collapsed ? "pro-profile--collapsed" : ""}`}>
          <img
            src="https://picsum.photos/200/200?random=1"
            alt="Gabriel Silas"
            className="pro-profile__avatar"
          />
          {!collapsed && (
            <>
              <p className="pro-profile__name">Gabriel Silas</p>
              <p className="pro-profile__role">Atleta amador · Hipertrofia 🏋️</p>
              <div className="pro-profile__stats">
                <div className="pro-profile__stat">
                  <span className="pro-profile__stat-val">24</span>
                  <span className="pro-profile__stat-lbl">Treinos</span>
                </div>
                <div className="pro-profile__stat-sep" />
                <div className="pro-profile__stat">
                  <span className="pro-profile__stat-val">3</span>
                  <span className="pro-profile__stat-lbl">Consultas</span>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="pro-sidebar__divider" />

        {/* Nav */}
        <nav className="pro-sidebar__nav">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                id={`nav-${item.label.toLowerCase().replace(/\s/g, "-")}`}
                className={`pro-nav-item${isActive ? " pro-nav-item--active" : ""} ${collapsed ? "pro-nav-item--icon-only" : ""}`}
              >
                <span className="pro-nav-item__icon"><Icon name={item.icon} /></span>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="pro-sidebar__footer">
          <Link href="/" id="nav-sair" className={`pro-nav-item pro-nav-item--signout ${collapsed ? "pro-nav-item--icon-only" : ""}`}>
            <span className="pro-nav-item__icon"><Icon name="log-out" /></span>
            {!collapsed && <span>Sair</span>}
          </Link>
        </div>
      </aside>

      {/* ═══ RIGHT SIDE ═══ */}
      <div className="pro-right">

        {/* Topbar */}
        <header className="pro-topbar">
          <button
            id="btn-mobile-menu"
            className="pro-topbar__menu-btn"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menu"
          >
            <Icon name="menu" />
          </button>

          <div className="pro-topbar__search">
            <span className="pro-topbar__search-icon"><Icon name="search" /></span>
            <input
              id="topbar-search"
              type="text"
              placeholder="Pesquisar consultas, profissionais..."
              className="pro-topbar__search-input"
            />
          </div>

          <div className="pro-topbar__actions">
            <button id="btn-notificacoes" className="pro-topbar__icon-btn" aria-label="Notificações">
              <Icon name="bell" />
              <span className="pro-topbar__notif-dot" />
            </button>
            <img
              src="https://picsum.photos/200/200?random=1"
              alt="Gabriel Silas"
              className="pro-topbar__avatar"
            />
          </div>
        </header>

        {/* Page content */}
        <main className="pro-content">
          {children}
        </main>
      </div>
    </div>
  );
}
