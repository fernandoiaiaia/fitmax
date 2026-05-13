//@ts-nocheck
"use client";

import Link from "next/link";

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

const consultasMock = [
  { id: 1, profissional: "Dra. Letícia Marques", especialidade: "Endocrinologista", data: "Hoje, 14:30",   avatar: "https://picsum.photos/200/200?random=50", tagBg: "rgba(59,130,246,0.15)",  tagColor: "#93c5fd" },
  { id: 2, profissional: "Marcelo Strong",        especialidade: "Treinador PRO",   data: "Amanhã, 09:00", avatar: "https://picsum.photos/200/200?random=52", tagBg: C.color4,                tagColor: C.color11  },
  { id: 3, profissional: "Dr. Vinícius Almeida",  especialidade: "Nutrólogo",       data: "Qua, 16:00",    avatar: "https://picsum.photos/200/200?random=60", tagBg: C.color4,                tagColor: C.color11  },
];

const agendaMock = [
  { id: 1, titulo: "Avaliação Nutrológica", horario: "14:30 - 15:30", color: "#a855f7", time: "Em breve" },
  { id: 2, titulo: "Liberação Miofascial",  horario: "18:00 - 19:00", color: "#3b82f6", time: "Hoje" },
];

const feedThumbnails = [
  "/sports_medicine_1776777873933.png",
  "/crossfit_class_1776777890905.png",
  "/fitness_yoga_1776776568182.png",
  "/nutrition_food_1776777905763.png",
];

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

export default function PainelPage() {
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
                <span style={{ color: C.color11, fontSize: 12 }}>As 4 novidades mais recentes</span>
              </div>
              <div style={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: "rgba(74,222,128,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
              </div>
            </div>
            {/* Mosaic */}
            <div style={{ padding: 12, paddingTop: 8, flex: 1, display: "flex", alignItems: "center", overflow: "hidden" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, width: "100%", height: "100%" }}>
                {feedThumbnails.map((src, idx) => (
                  <div key={idx} style={{ width: "calc(50% - 4px)", height: "calc(50% - 4px)", borderRadius: 8, overflow: "hidden", backgroundColor: C.color4, position: "relative" }}>
                    <img src={src} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                    {idx === 3 && (
                      <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ color: "white", fontWeight: "bold", fontSize: 20 }}>+8</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
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
                <span style={{ color: C.color11, fontSize: 12 }}>3 confirmadas esta semana</span>
              </div>
              <div style={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: "rgba(59,130,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
            </div>
            <div style={{ padding: 12, flex: 1, display: "flex", flexDirection: "column", gap: 8, justifyContent: "center", overflow: "hidden" }}>
              {consultasMock.map((c) => (
                <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, backgroundColor: C.bg, padding: 8, borderRadius: 8, border: `1px solid ${C.border}` }}>
                  <img src={c.avatar} style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} alt="" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: C.color12, fontWeight: "bold", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.profissional}</div>
                    <div style={{ color: C.color11, fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.especialidade}</div>
                  </div>
                  <div style={{ backgroundColor: c.tagBg, paddingLeft: 8, paddingRight: 8, paddingTop: 2, paddingBottom: 2, borderRadius: 999, flexShrink: 0 }}>
                    <span style={{ color: c.tagColor, fontSize: 10, fontWeight: "bold" }}>{c.data}</span>
                  </div>
                </div>
              ))}
            </div>
          </HoverCard>

          {/* Agenda Widget */}
          <HoverCard href="/painel/agenda" hoverBorder="#a855f7" style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 16, paddingBottom: 0 }}>
              <div>
                <h2 style={{ color: C.color12, fontSize: 16, fontWeight: "bold", margin: 0 }}>Sua Agenda</h2>
                <span style={{ color: C.color11, fontSize: 12 }}>Suas prioridades de hoje</span>
              </div>
              <div style={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: "rgba(168,85,247,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c084fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              </div>
            </div>
            <div style={{ padding: 12, paddingTop: 8, flex: 1, display: "flex", flexDirection: "column", gap: 8, justifyContent: "center", overflow: "hidden" }}>
              {agendaMock.map((a, idx) => (
                <div key={a.id} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 12 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: a.color, marginTop: 8, border: `2px solid ${C.bg}`, zIndex: 2 }} />
                    {idx < agendaMock.length - 1 && (
                      <div style={{ width: 2, height: 42, backgroundColor: C.border, marginTop: -4, zIndex: 1 }} />
                    )}
                  </div>
                  <div style={{ flex: 1, backgroundColor: C.bg, padding: 8, paddingLeft: 12, paddingRight: 12, borderRadius: 8, border: `1px solid ${C.border}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                      <span style={{ color: C.color12, fontWeight: "bold", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.titulo}</span>
                      <span style={{ color: a.color, fontSize: 10, fontWeight: "bold", flexShrink: 0 }}>{a.time}</span>
                    </div>
                    <span style={{ color: C.color11, fontSize: 12 }}>{a.horario}</span>
                  </div>
                </div>
              ))}
            </div>
          </HoverCard>

        </div>
      </div>
    </div>
  );
}
