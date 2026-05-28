//@ts-nocheck
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

// ── tokens exatos do tema dark do Tamagui
const C = {
  bg:       "#111111",
  color2:   "#1a1a1a",
  color3:   "#222222",
  color4:   "#2a2a2a",
  color11:  "#a1a1aa",
  color12:  "#fafafa",
  border:   "#27272a",
};

// Card base style
const cardStyle = (hover?: Partial<React.CSSProperties>): React.CSSProperties => ({
  display: "flex", flexDirection: "column", flex: 1,
  border: `1px solid ${C.border}`, backgroundColor: C.color2,
  borderRadius: 12, overflow: "hidden", cursor: "pointer",
  transition: "background 0.15s, border-color 0.15s",
  width: "100%",
});

function HoverCard({ href, hoverBorder, children, style }: {
  href: string; hoverBorder: string; children: React.ReactNode; style?: React.CSSProperties;
}) {
  return (
    <Link href={href} style={{ textDecoration: "none", display: "flex", flex: 1 }}>
      <div
        style={{ ...cardStyle(), ...style }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.backgroundColor = C.color3;
          (e.currentTarget as HTMLElement).style.borderColor = hoverBorder;
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.backgroundColor = C.color2;
          (e.currentTarget as HTMLElement).style.borderColor = C.border;
        }}
      >
        {children}
      </div>
    </Link>
  );
}

function formatDayTime(dateStr: string) {
  const dt = new Date(dateStr);
  const hoje = new Date();
  const amanha = new Date();
  amanha.setDate(hoje.getDate() + 1);

  const timeStr = dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  if (dt.toDateString() === hoje.toDateString()) return `Hoje, ${timeStr}`;
  if (dt.toDateString() === amanha.toDateString()) return `Amanhã, ${timeStr}`;

  return `${dt.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" })}, ${timeStr}`;
}

function getEventTimeStatus(dateStr: string) {
  const dt = new Date(dateStr);
  const diffHours = (dt.getTime() - Date.now()) / (1000 * 60 * 60);

  if (diffHours < 0) return { label: "Passado", color: C.color11 };
  if (diffHours < 2) return { label: "Em breve", color: "#a855f7" }; // roxo
  return { label: "Hoje", color: "#3b82f6" }; // azul
}

export default function PainelPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/client-portal/dashboard")
      .then(res => {
        setData(res.data);
      })
      .catch(err => {
        console.error("Erro ao carregar dashboard:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ flex: 1, backgroundColor: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: C.color11 }}>Carregando sua visão geral...</p>
      </div>
    );
  }

  const { feed = [], consultas = [], agenda = [] } = data || {};

  return (
    <div style={{ flex: 1, backgroundColor: C.bg, padding: 12, display: "flex", flexDirection: "column", gap: 12, width: "100%", overflow: "hidden" }}
      className="sm:p-4">

      <h2 style={{ color: C.color12, fontSize: 20, fontWeight: "bold", margin: 0 }}>Sua Visão Geral</h2>

      {/* Container Pai */}
      <div style={{ flex: 1, display: "flex", gap: 12, width: "100%", overflow: "hidden" }}
        className="flex-col md:flex-row">

        {/* LEFT COLUMN: Feed Widget */}
        <div style={{ flex: 1, display: "flex" }} className="md:flex-[1.5]">
          <HoverCard href="/painel/feed" hoverBorder="#10b981">
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 16, paddingBottom: 0 }}>
              <div>
                <h2 style={{ color: C.color12, fontSize: 16, fontWeight: "bold", margin: 0 }}>Destaques do Feed</h2>
                <span style={{ color: C.color11, fontSize: 12 }}>As novidades mais recentes</span>
              </div>
              <div style={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: "rgba(74,222,128,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
              </div>
            </div>
            {/* Mosaic */}
            <div style={{ padding: 12, paddingTop: 8, flex: 1, display: "flex", alignItems: "center", overflow: "hidden" }}>
              {feed.length === 0 ? (
                <div style={{ display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center", color: C.color11, fontSize: 13, backgroundColor: C.color4, borderRadius: 8 }}>
                  Nenhum post no feed ainda.
                </div>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, width: "100%", height: "100%" }}>
                  {feed.slice(0, 4).map((pub: any, idx: number) => (
                    <div key={pub.id} style={{ width: feed.length === 1 ? "100%" : feed.length === 2 ? "calc(50% - 4px)" : "calc(50% - 4px)", height: feed.length <= 2 ? "100%" : "calc(50% - 4px)", borderRadius: 8, overflow: "hidden", backgroundColor: C.color4, position: "relative" }}>
                      <img src={pub.imagemUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                      {idx === 3 && feed.length > 4 && (
                        <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ color: "white", fontWeight: "bold", fontSize: 20 }}>+</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </HoverCard>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Consultas Widget */}
          <HoverCard href="/painel/consultas" hoverBorder="#3b82f6" style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 16, paddingBottom: 0 }}>
              <div>
                <h2 style={{ color: C.color12, fontSize: 16, fontWeight: "bold", margin: 0 }}>Consultas Pendentes</h2>
                <span style={{ color: C.color11, fontSize: 12 }}>{consultas.length} marcadas</span>
              </div>
              <div style={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: "rgba(59,130,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
            </div>
            <div style={{ padding: 12, flex: 1, display: "flex", flexDirection: "column", gap: 8, justifyContent: "center", overflow: "hidden" }}>
              {consultas.length === 0 ? (
                <div style={{ textAlign: "center", color: C.color11, fontSize: 13, marginTop: 12 }}>Nenhuma consulta pendente.</div>
              ) : (
                consultas.map((c: any) => (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, backgroundColor: C.bg, padding: 8, borderRadius: 8, border: `1px solid ${C.border}` }}>
                    <img src={c.profissional.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.profissional.name)}&background=27272a&color=fafafa`} style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} alt="" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: C.color12, fontWeight: "bold", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.profissional.name}</div>
                      <div style={{ color: C.color11, fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.profissional.especialidade}</div>
                    </div>
                    <div style={{ backgroundColor: "rgba(59,130,246,0.15)", paddingLeft: 8, paddingRight: 8, paddingTop: 2, paddingBottom: 2, borderRadius: 999, flexShrink: 0 }}>
                      <span style={{ color: "#93c5fd", fontSize: 10, fontWeight: "bold" }}>{formatDayTime(c.dataHora)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </HoverCard>

          {/* Agenda Widget */}
          <HoverCard href="/painel/agenda" hoverBorder="#a855f7" style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 16, paddingBottom: 0 }}>
              <div>
                <h2 style={{ color: C.color12, fontSize: 16, fontWeight: "bold", margin: 0 }}>Sua Agenda</h2>
                <span style={{ color: C.color11, fontSize: 12 }}>Eventos de hoje</span>
              </div>
              <div style={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: "rgba(168,85,247,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c084fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              </div>
            </div>
            <div style={{ padding: 12, paddingTop: 8, flex: 1, display: "flex", flexDirection: "column", gap: 8, justifyContent: "center", overflow: "hidden" }}>
              {agenda.length === 0 ? (
                <div style={{ textAlign: "center", color: C.color11, fontSize: 13, marginTop: 12 }}>Nenhum evento para hoje.</div>
              ) : (
                agenda.map((a: any, idx: number) => {
                  const status = getEventTimeStatus(a.dataHora);
                  const dt = new Date(a.dataHora);
                  const endTime = new Date(dt.getTime() + 60 * 60 * 1000); // assume 1h duration

                  return (
                    <div key={a.id} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 12 }}>
                        <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: status.color, marginTop: 8, border: `2px solid ${C.bg}`, zIndex: 2 }} />
                        {idx < agenda.length - 1 && (
                          <div style={{ width: 2, height: 42, backgroundColor: C.border, marginTop: -4, zIndex: 1 }} />
                        )}
                      </div>
                      <div style={{ flex: 1, backgroundColor: C.bg, padding: 8, paddingLeft: 12, paddingRight: 12, borderRadius: 8, border: `1px solid ${C.border}` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                          <span style={{ color: C.color12, fontWeight: "bold", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {a.profissional.especialidade}
                          </span>
                          <span style={{ color: status.color, fontSize: 10, fontWeight: "bold", flexShrink: 0 }}>{status.label}</span>
                        </div>
                        <span style={{ color: C.color11, fontSize: 12 }}>
                          {dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} - {endTime.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </HoverCard>

        </div>
      </div>
    </div>
  );
}
