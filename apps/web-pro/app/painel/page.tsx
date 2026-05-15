//@ts-nocheck
"use client";

import Link from "next/link";

const C = {
  bg:     "#111111",
  card:   "#141414",
  hover:  "#1a1a1a",
  border: "rgba(255,255,255,0.07)",
};

const consultasMock = [
  { id:1, paciente:"Guilherme Augusto", tipo:"Presencial",  data:"Hoje, 11:00",   avatar:"https://picsum.photos/200/200?random=30", badgeBg:"rgba(234,179,8,0.15)",   badgeColor:"#facc15" },
  { id:2, paciente:"Mariana Ferreira",  tipo:"Online",      data:"Hoje, 13:00",   avatar:"https://picsum.photos/200/200?random=31", badgeBg:"rgba(16,185,129,0.15)",  badgeColor:"#4ade80" },
  { id:3, paciente:"Lucas Mendes",      tipo:"Presencial",  data:"Amanhã, 09:00", avatar:"https://picsum.photos/200/200?random=32", badgeBg:"rgba(59,130,246,0.15)", badgeColor:"#60a5fa" },
];

const agendaMock = [
  { id:1, titulo:"Reunião de Equipe",      horario:"09:00 – 10:00", dotColor:"#a855f7", time:"Hoje"    },
  { id:2, titulo:"Avaliação Cardiológica", horario:"14:00 – 15:30", dotColor:"#10b981", time:"Em breve" },
];

const feedThumbnails = [
  "/feed_cardiology.png",
  "/feed_workout.png",
  "/feed_nutrition.png",
  "/feed_running.png",
];

export default function PainelPage() {
  return (
    <>
      <style>{`
        .w-card {
          background: ${C.card};
          border: 1px solid ${C.border};
          border-radius: 14px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          flex: 1;
          cursor: pointer;
          transition: background .15s, border-color .15s;
        }
        .w-card:hover                { background: ${C.hover}; }
        .w-card--green:hover         { border-color: rgba(16,185,129,0.55); }
        .w-card--blue:hover          { border-color: rgba(99,102,241,0.55); }
        .w-card--purple:hover        { border-color: rgba(168,85,247,0.55); }
        .w-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.25rem 0;
        }
        .w-body {
          padding: .75rem;
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .w-icon {
          width: 32px; height: 32px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .painel-cols {
          display: flex;
          flex-direction: row;
          gap: 16px;
          flex: 1;
        }
        @media (max-width: 768px) {
          .painel-cols { flex-direction: column !important; }
        }
      `}</style>

      <div style={{ display:"flex", flexDirection:"column", gap:16, flex:1 }}>

        <h2 style={{ color:"#fafafa", fontSize:20, fontWeight:"bold", margin:0 }}>
          Sua Visão Geral
        </h2>

        <div className="painel-cols">

          {/* ── LEFT: Feed ── */}
          <div style={{ flex:1.5, display:"flex" }}>
            <Link href="/painel/feed" style={{ display:"flex", flex:1, textDecoration:"none" }}>
              <div className="w-card w-card--green">
                <div className="w-header">
                  <div>
                    <h2 style={{ color:"#fafafa", fontSize:16, fontWeight:"bold", margin:0 }}>Destaques do Feed</h2>
                    <span style={{ color:"#71717a", fontSize:12 }}>Últimas publicações da plataforma</span>
                  </div>
                  <div className="w-icon" style={{ background:"rgba(16,185,129,0.15)" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                  </div>
                </div>
                <div className="w-body" style={{ justifyContent:"center" }}>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:8, width:"100%", height:"100%" }}>
                    {feedThumbnails.map((src, idx) => (
                      <div key={idx} style={{ width:"calc(50% - 4px)", minHeight:80, borderRadius:8, overflow:"hidden", background:"#1a1a1a", position:"relative", flexShrink:0 }}>
                        <img src={src} style={{ width:"100%", height:"100%", objectFit:"cover" }} alt="" />
                        {idx === 3 && (
                          <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.6)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                            <span style={{ color:"white", fontWeight:"bold", fontSize:20 }}>+8</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* ── RIGHT: Stacked widgets ── */}
          <div style={{ flex:1, display:"flex", flexDirection:"column", gap:16 }}>

            {/* Consultas */}
            <Link href="/painel/consultas" style={{ display:"flex", flex:1, textDecoration:"none" }}>
              <div className="w-card w-card--blue">
                <div className="w-header">
                  <div>
                    <h2 style={{ color:"#fafafa", fontSize:16, fontWeight:"bold", margin:0 }}>Consultas Pendentes</h2>
                    <span style={{ color:"#71717a", fontSize:12 }}>3 confirmadas esta semana</span>
                  </div>
                  <div className="w-icon" style={{ background:"rgba(59,130,246,0.15)" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  </div>
                </div>
                <div className="w-body" style={{ gap:8, justifyContent:"center" }}>
                  {consultasMock.map((c) => (
                    <div key={c.id} style={{ display:"flex", alignItems:"center", gap:8, background:C.bg, padding:8, borderRadius:8, border:`1px solid ${C.border}` }}>
                      <img src={c.avatar} style={{ width:32, height:32, borderRadius:"50%", objectFit:"cover", flexShrink:0 }} alt={c.paciente} />
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ color:"#fafafa", fontWeight:"bold", fontSize:13, margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.paciente}</p>
                        <p style={{ color:"#71717a", fontSize:11, margin:0 }}>{c.tipo}</p>
                      </div>
                      <span style={{ background:c.badgeBg, color:c.badgeColor, fontSize:10, fontWeight:"bold", padding:"2px 8px", borderRadius:999, flexShrink:0 }}>{c.data}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Link>

            {/* Agenda */}
            <Link href="/painel/agenda" style={{ display:"flex", flex:1, textDecoration:"none" }}>
              <div className="w-card w-card--purple">
                <div className="w-header">
                  <div>
                    <h2 style={{ color:"#fafafa", fontSize:16, fontWeight:"bold", margin:0 }}>Sua Agenda</h2>
                    <span style={{ color:"#71717a", fontSize:12 }}>Prioridades de hoje</span>
                  </div>
                  <div className="w-icon" style={{ background:"rgba(168,85,247,0.15)" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c084fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                  </div>
                </div>
                <div className="w-body" style={{ gap:8, justifyContent:"center" }}>
                  {agendaMock.map((a, idx) => (
                    <div key={a.id} style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
                      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", width:12, flexShrink:0, marginTop:4 }}>
                        <div style={{ width:10, height:10, borderRadius:"50%", background:a.dotColor, border:`2px solid ${C.bg}`, zIndex:2 }} />
                        {idx < agendaMock.length - 1 && (
                          <div style={{ width:2, height:42, background:C.border, marginTop:-2, zIndex:1 }} />
                        )}
                      </div>
                      <div style={{ flex:1, background:C.bg, padding:"8px 12px", borderRadius:8, border:`1px solid ${C.border}` }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:2 }}>
                          <p style={{ color:"#fafafa", fontWeight:"bold", fontSize:13, margin:0 }}>{a.titulo}</p>
                          <span style={{ color:a.dotColor, fontSize:10, fontWeight:"bold", flexShrink:0 }}>{a.time}</span>
                        </div>
                        <p style={{ color:"#71717a", fontSize:12, margin:0 }}>{a.horario}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Link>

          </div>
        </div>
      </div>
    </>
  );
}
