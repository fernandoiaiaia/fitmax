//@ts-nocheck
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const menuItems = [
  { label: "Painel",        href: "/painel",            icon: "grid" },
  { label: "Consultas",     href: "/painel/consultas",  icon: "users" },
  { label: "Feed",          href: "/painel/feed",       icon: "home" },
  { label: "Histórico",     href: "/painel/historico",  icon: "history" },
  { label: "Configurações", href: "/painel/config",     icon: "settings" },
];

function SidebarIcon({ name, color = "currentColor" }: { name: string; color?: string }) {
  const icons: Record<string, React.ReactNode> = {
    home: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>),
    grid: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>),
    history: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l4 2" /></svg>),
    users: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>),
    settings: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>),
    "arrow-left": (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>),
    "arrow-right": (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>),
    "log-out": (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>),
  };
  return <div style={{ color }}>{icons[name]}</div>;
}

export default function PainelLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const pathname = usePathname();
  const router   = useRouter();

  const handleLogout = () => {
    // Limpa qualquer dado de sessão armazenado localmente
    try { localStorage.clear(); } catch { /* noop */ }
    try { sessionStorage.clear(); } catch { /* noop */ }
    setSidebarOpen(false);
    // replace() remove o painel do histórico — o usuário não volta com o botão "voltar"
    router.replace('/');
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", backgroundColor: "#111" }}>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="sm:hidden"
          style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 40 }}
        />
      )}

      {/* Sidebar */}
      <div style={{
        width: desktopCollapsed ? 84 : 280,
        backgroundColor: "#1a1a1a",
        borderRight: "1px solid #27272a",
        zIndex: 50,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        transition: "all 0.2s ease-in-out",
        // Mobile: absolute positioning
      }}
        className={`absolute sm:relative top-0 bottom-0 ${sidebarOpen ? "left-0" : "-left-[280px]"} sm:left-0`}
      >
        <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
          <div style={{
            display: "flex", flexDirection: "column", flex: 1,
            paddingTop: 16, paddingBottom: 16,
            paddingLeft: desktopCollapsed ? 8 : 16,
            paddingRight: desktopCollapsed ? 8 : 16,
            alignItems: desktopCollapsed ? "center" : "stretch",
          }}>

            {/* Topbar Actions */}
            <div style={{ display: "flex", justifyContent: desktopCollapsed ? "center" : "flex-end", alignItems: "center", marginBottom: 16 }}>
              {/* Mobile Close — só aparece quando sidebar está aberta no mobile */}
              <button
                onClick={() => setSidebarOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "white", padding: 6, borderRadius: "50%", display: sidebarOpen ? "flex" : "none" }}
              >
                <SidebarIcon name="arrow-left" color="white" />
              </button>
              {/* Desktop Collapse — sempre visível no desktop */}
              <button
                onClick={() => setDesktopCollapsed(!desktopCollapsed)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "white", padding: 6, borderRadius: "50%", display: sidebarOpen ? "none" : "flex" }}
              >
                <SidebarIcon name={desktopCollapsed ? "arrow-right" : "arrow-left"} color="white" />
              </button>
            </div>

            {/* Logo */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: "100%", overflow: "hidden", height: desktopCollapsed ? 30 : 60, marginBottom: 16,
            }}>
              {!desktopCollapsed
                ? <img src="/brand-logo.png" style={{ width: 180, height: 60, objectFit: "contain" }} alt="FitMax" />
                : <SidebarIcon name="grid" color="white" />
              }
            </div>

            {/* Profile Block */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 8, marginBottom: 20 }}>
              <img
                src="https://picsum.photos/200/200?random=1"
                alt="Avatar"
                style={{
                  width: desktopCollapsed ? 40 : 64,
                  height: desktopCollapsed ? 40 : 64,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid #10b981",
                }}
              />
              {!desktopCollapsed && (
                <>
                  <p style={{ color: "#fafafa", fontSize: 16, fontWeight: "bold", marginTop: 12, marginBottom: 0 }}>Gabriel Silas</p>
                  <div style={{ display: "flex", gap: 16, marginTop: 16, alignSelf: "stretch", justifyContent: "center" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <span style={{ color: "#fafafa", fontSize: 14, fontWeight: "bold" }}>24</span>
                      <span style={{ color: "#a1a1aa", fontSize: 10 }}>Treinos</span>
                    </div>
                    <div style={{ width: 1, background: "#27272a" }} />
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <span style={{ color: "#fafafa", fontSize: 14, fontWeight: "bold" }}>3</span>
                      <span style={{ color: "#a1a1aa", fontSize: 10 }}>Consultas</span>
                    </div>
                  </div>
                  <div style={{ marginTop: 16, alignSelf: "flex-start", paddingLeft: 8, paddingRight: 8 }}>
                    <p style={{ color: "#a1a1aa", fontSize: 12, marginTop: 4, marginBottom: 0 }}>
                      Atleta amador | Foco em Hipertrofia 🏋️
                    </p>
                  </div>
                </>
              )}
            </div>

            <div style={{ height: 1, background: "#27272a", marginTop: 8, marginBottom: 8 }} />

            {/* Navigation */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, marginTop: 16, paddingBottom: 16, width: "100%" }}>
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)} style={{ textDecoration: "none", display: "flex" }}>
                    <div style={{
                      display: "flex", width: "100%",
                      justifyContent: desktopCollapsed ? "center" : "flex-start",
                      alignItems: "center",
                      gap: desktopCollapsed ? 0 : 12,
                      paddingTop: 12, paddingBottom: 12,
                      paddingLeft: desktopCollapsed ? 0 : 12,
                      paddingRight: desktopCollapsed ? 0 : 12,
                      borderRadius: 10,
                      backgroundColor: isActive ? "#2a2a2a" : "transparent",
                      cursor: "pointer",
                      transition: "background 0.15s",
                    }}
                      onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = "#222"; }}
                      onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
                    >
                      <SidebarIcon name={item.icon} color="white" />
                      {!desktopCollapsed && (
                        <span style={{ color: "white", fontSize: 14, fontWeight: isActive ? "bold" : "500" }}>
                          {item.label}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}

              {/* Logout */}
              <button
                onClick={handleLogout}
                style={{ textDecoration: "none", display: "flex", background: "none", border: "none", padding: 0, width: "100%", cursor: "pointer" }}
              >
                <div style={{
                  display: "flex", width: "100%",
                  justifyContent: desktopCollapsed ? "center" : "flex-start",
                  alignItems: "center",
                  gap: desktopCollapsed ? 0 : 12,
                  paddingTop: 12, paddingBottom: 12,
                  paddingLeft: desktopCollapsed ? 0 : 12,
                  paddingRight: desktopCollapsed ? 0 : 12,
                  borderRadius: 10,
                  cursor: "pointer",
                  marginTop: 16,
                  transition: "background 0.15s",
                }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(239,68,68,0.15)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"}
                >
                  <SidebarIcon name="log-out" color="white" />
                  {!desktopCollapsed && (
                    <span style={{ color: "white", fontSize: 14, fontWeight: "bold" }}>Sair</span>
                  )}
                </div>
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>

        {/* Global Topbar */}
        <div style={{
          display: "flex", alignItems: "center",
          paddingLeft: 16, paddingRight: 16, paddingTop: 16, paddingBottom: 16,
          borderBottom: "1px solid #27272a",
          backgroundColor: "#111",
          gap: 16,
        }}>
          {/* Mobile menu button */}
          <button
            className="sm:hidden"
            onClick={() => setSidebarOpen(true)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#a1a1aa", padding: 6, borderRadius: "50%", display: "flex" }}
          >
            <SidebarIcon name="grid" color="#a1a1aa" />
          </button>
          <div style={{ flex: 1 }} />
        </div>

        {/* Page Children */}
        {children}

      </div>
    </div>
  );
}
