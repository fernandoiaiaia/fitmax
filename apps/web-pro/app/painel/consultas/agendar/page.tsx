//@ts-nocheck
"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// ─── Styles ───────────────────────────────────────────────────────────────────

const STYLES = `
  @keyframes fadeUpPro {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .pro-mg-page { animation: fadeUpPro 0.32s ease; }

  .pro-mg-hero {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 20px;
    padding: 28px;
    display: flex;
    align-items: center;
    gap: 20px;
  }
  .pro-mg-avatar {
    width: 72px; height: 72px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid rgba(255,255,255,0.12);
    flex-shrink: 0;
  }
  .pro-mg-avatar-fallback {
    width: 72px; height: 72px;
    border-radius: 50%;
    background: rgba(96,165,250,0.12);
    border: 2px solid rgba(96,165,250,0.3);
    display: flex; align-items: center; justify-content: center;
    font-size: 28px; font-weight: 800; color: #60a5fa;
    flex-shrink: 0;
  }
  .pro-mg-info { flex: 1; min-width: 0; }
  .pro-mg-nome { font-size: 18px; font-weight: 800; color: #f4f4f5; margin: 0 0 4px; }
  .pro-mg-esp  { font-size: 13px; color: #71717a; margin: 0 0 10px; }
  .pro-mg-meta { display: flex; gap: 8px; flex-wrap: wrap; }
  .pro-mg-pill {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 11px; font-weight: 700; letter-spacing: 0.04em;
    padding: 4px 10px; border-radius: 99px;
    border: 1px solid; white-space: nowrap;
  }

  .pro-mg-actions-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }
  @media (max-width: 520px) { .pro-mg-actions-grid { grid-template-columns: 1fr; } }

  .pro-mg-action-card {
    background: rgba(255,255,255,0.03);
    border: 1.5px solid rgba(255,255,255,0.08);
    border-radius: 16px;
    padding: 24px 20px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
    position: relative;
    overflow: hidden;
  }
  .pro-mg-action-card::before {
    content: '';
    position: absolute; inset: 0;
    opacity: 0; transition: opacity 0.2s;
    border-radius: inherit;
  }
  .pro-mg-action-card:hover { transform: translateY(-2px); }
  .pro-mg-action-card:hover::before { opacity: 1; }

  .pro-mg-action-card.confirmar::before { background: linear-gradient(135deg, rgba(16,185,129,0.08) 0%, transparent 100%); }
  .pro-mg-action-card.confirmar:hover { border-color: rgba(16,185,129,0.4); box-shadow: 0 6px 28px rgba(16,185,129,0.12); }

  .pro-mg-action-card.reagendar::before { background: linear-gradient(135deg, rgba(96,165,250,0.07) 0%, transparent 100%); }
  .pro-mg-action-card.reagendar:hover { border-color: rgba(96,165,250,0.4); box-shadow: 0 6px 28px rgba(96,165,250,0.12); }

  .pro-mg-action-card.cancelar::before { background: linear-gradient(135deg, rgba(244,63,94,0.07) 0%, transparent 100%); }
  .pro-mg-action-card.cancelar:hover { border-color: rgba(244,63,94,0.35); box-shadow: 0 6px 28px rgba(244,63,94,0.1); }

  .pro-mg-action-icon {
    width: 44px; height: 44px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-size: 22px; flex-shrink: 0;
  }
  .pro-mg-action-title { font-size: 15px; font-weight: 700; margin: 0; }
  .pro-mg-action-sub   { font-size: 12px; color: #71717a; margin: 0; line-height: 1.5; }

  .pro-mg-confirm-box {
    animation: fadeUpPro 0.25s ease;
    border-radius: 16px;
    padding: 24px;
  }
  .pro-mg-success {
    animation: fadeUpPro 0.35s ease;
    text-align: center;
    padding: 40px 24px;
  }
  .pro-mg-success-icon {
    width: 72px; height: 72px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 20px; font-size: 32px;
  }

  .pro-btn-primary {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    padding: 14px 24px; border-radius: 12px; font-size: 14px; font-weight: 700;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    border: none; color: #fff; cursor: pointer; font-family: inherit;
    transition: all 0.15s; box-shadow: 0 4px 16px rgba(16,185,129,0.25);
  }
  .pro-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(16,185,129,0.35); }
  .pro-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

  .pro-btn-ghost {
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    padding: 14px 20px; border-radius: 12px; font-size: 14px; font-weight: 600;
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1);
    color: #a1a1aa; cursor: pointer; font-family: inherit; transition: all 0.15s;
  }
  .pro-btn-ghost:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.2); color: #e4e4e7; }
`;

// ─── Inner Component ──────────────────────────────────────────────────────────

function ConsultaDetalheInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const consultaId     = searchParams.get("id");
  const consultaNome   = searchParams.get("nome") ?? "";
  const consultaEsp    = searchParams.get("especialidade") ?? "";
  const consultaData   = searchParams.get("data") ?? "";
  const consultaHor    = searchParams.get("horario") ?? "";
  const consultaMod    = searchParams.get("modalidade") ?? "";
  const consultaStatus = searchParams.get("status") ?? "";
  const consultaAvatar = searchParams.get("avatar") ?? "";

  const [view, setView]               = useState<string>("menu");
  const [cancelDone, setCancelDone]   = useState(false);
  const [confirmDone, setConfirmDone] = useState(false);

  const statusLabels: Record<string, { label: string; bg: string; color: string }> = {
    agendada:     { label:"AGENDADA",     bg:"rgba(16,185,129,0.12)",  color:"#10b981" },
    pendente:     { label:"PENDENTE",     bg:"rgba(234,179,8,0.12)",   color:"#facc15" },
    a_confirmar:  { label:"A CONFIRMAR",  bg:"rgba(161,161,170,0.1)",  color:"#a1a1aa" },
    em_andamento: { label:"EM ANDAMENTO", bg:"rgba(96,165,250,0.12)",  color:"#60a5fa" },
  };
  const statusCfg = statusLabels[consultaStatus] ?? { label: consultaStatus.toUpperCase(), bg:"rgba(255,255,255,0.08)", color:"#a1a1aa" };

  if (!consultaId) {
    router.push("/painel/consultas");
    return null;
  }

  return (
    <>
      <style>{STYLES}</style>
      <div style={{ flex:1, overflowY:"auto" }}>
        <div
          className="pro-mg-page"
          style={{ padding:"1.5rem 2rem", maxWidth:680, margin:"0 auto", width:"100%", display:"flex", flexDirection:"column", gap:24 }}
        >
          {/* Voltar */}
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <button
              onClick={() => router.push("/painel/consultas")}
              style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, width:38, height:38, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#a1a1aa", flexShrink:0, transition:"all 0.15s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor="#60a5fa"; (e.currentTarget as HTMLButtonElement).style.color="#60a5fa"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor="rgba(255,255,255,0.1)"; (e.currentTarget as HTMLButtonElement).style.color="#a1a1aa"; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
              </svg>
            </button>
            <div style={{ flex:1 }}>
              <h2 style={{ color:"#fafafa", fontSize:22, fontWeight:"bold", margin:0 }}>Detalhes da Consulta</h2>
              <span style={{ color:"#a1a1aa", fontSize:13 }}>Consulta #{consultaId}</span>
            </div>
          </div>

          {/* Hero card */}
          <div className="pro-mg-hero">
            {consultaAvatar ? (
              <img src={consultaAvatar} alt={consultaNome} className="pro-mg-avatar" />
            ) : (
              <div className="pro-mg-avatar-fallback">{consultaNome[0] ?? "?"}</div>
            )}
            <div className="pro-mg-info">
              <p className="pro-mg-nome">{consultaNome}</p>
              <p className="pro-mg-esp">{consultaEsp}</p>
              <div className="pro-mg-meta">
                <span className="pro-mg-pill" style={{ background:statusCfg.bg, borderColor:statusCfg.color+"55", color:statusCfg.color }}>{statusCfg.label}</span>
                <span className="pro-mg-pill" style={{ background:"rgba(255,255,255,0.04)", borderColor:"rgba(255,255,255,0.1)", color:"#a1a1aa" }}>📅 {consultaData}</span>
                <span className="pro-mg-pill" style={{ background:"rgba(255,255,255,0.04)", borderColor:"rgba(255,255,255,0.1)", color:"#a1a1aa" }}>🕐 {consultaHor}</span>
                <span className="pro-mg-pill" style={{ background:"rgba(255,255,255,0.04)", borderColor:"rgba(255,255,255,0.1)", color:"#a1a1aa" }}>{consultaMod === "Online" ? "🌐" : "📍"} {consultaMod}</span>
              </div>
            </div>
          </div>

          {/* ── MENU ── */}
          {view === "menu" && !cancelDone && !confirmDone && (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <span style={{ color:"#a1a1aa", fontSize:13, fontWeight:600 }}>O que você deseja fazer?</span>
              <div className="pro-mg-actions-grid">
                {(consultaStatus === "a_confirmar" || consultaStatus === "pendente") && (
                  <div id="btn-pro-confirmar" className="pro-mg-action-card confirmar" onClick={() => setView("confirmar")}>
                    <div className="pro-mg-action-icon" style={{ background:"rgba(16,185,129,0.12)" }}>✅</div>
                    <p className="pro-mg-action-title" style={{ color:"#10b981" }}>Confirmar</p>
                    <p className="pro-mg-action-sub">Confirme a presença do paciente nesta consulta</p>
                  </div>
                )}
                <div
                  id="btn-pro-reagendar"
                  className="pro-mg-action-card reagendar"
                  onClick={() => setView("reagendar")}
                  style={{ gridColumn: (consultaStatus !== "a_confirmar" && consultaStatus !== "pendente") ? "1 / -1" : "auto" }}
                >
                  <div className="pro-mg-action-icon" style={{ background:"rgba(96,165,250,0.12)" }}>📅</div>
                  <p className="pro-mg-action-title" style={{ color:"#60a5fa" }}>Reagendar</p>
                  <p className="pro-mg-action-sub">Proponha uma nova data e horário para esta consulta</p>
                </div>
                <div id="btn-pro-cancelar" className="pro-mg-action-card cancelar" onClick={() => setView("cancelar")} style={{ gridColumn:"1 / -1" }}>
                  <div className="pro-mg-action-icon" style={{ background:"rgba(244,63,94,0.1)" }}>🗑️</div>
                  <p className="pro-mg-action-title" style={{ color:"#f43f5e" }}>Cancelar Consulta</p>
                  <p className="pro-mg-action-sub">Cancele esta consulta e notifique o paciente</p>
                </div>
              </div>
            </div>
          )}

          {/* ── CONFIRMAR ── */}
          {view === "confirmar" && !confirmDone && (
            <div className="pro-mg-confirm-box" style={{ background:"rgba(16,185,129,0.06)", border:"1px solid rgba(16,185,129,0.2)" }}>
              <span style={{ color:"#10b981", fontSize:12, fontWeight:800, display:"block", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:12 }}>✅ Confirmar Consulta</span>
              <p style={{ color:"#a1a1aa", fontSize:14, margin:"0 0 8px" }}>Confirmar a consulta de <strong style={{ color:"#f4f4f5" }}>{consultaNome}</strong>?</p>
              <p style={{ color:"#71717a", fontSize:13, margin:"0 0 20px" }}>📅 {consultaData} às {consultaHor} · {consultaMod}</p>
              <div style={{ display:"flex", gap:12 }}>
                <button className="pro-btn-ghost" onClick={() => setView("menu")} style={{ flex:1 }}>← Voltar</button>
                <button id="btn-pro-confirmar-ok" className="pro-btn-primary" onClick={() => setConfirmDone(true)} style={{ flex:2 }}>Confirmar ✅</button>
              </div>
            </div>
          )}

          {/* ── CONFIRMADO ── */}
          {confirmDone && (
            <div className="pro-mg-success">
              <div className="pro-mg-success-icon" style={{ background:"rgba(16,185,129,0.15)", border:"2px solid #10b981" }}>✅</div>
              <p style={{ color:"#fafafa", fontSize:20, fontWeight:"bold", margin:"0 0 8px" }}>Consulta Confirmada!</p>
              <p style={{ color:"#a1a1aa", fontSize:13, margin:"0 0 20px" }}>A consulta com <strong style={{ color:"#f4f4f5" }}>{consultaNome}</strong> foi confirmada com sucesso.</p>
              <button className="pro-btn-primary" style={{ margin:"0 auto" }} onClick={() => router.push("/painel/consultas")}>Ver Consultas →</button>
            </div>
          )}

          {/* ── REAGENDAR ── */}
          {view === "reagendar" && (
            <div className="pro-mg-confirm-box" style={{ background:"rgba(96,165,250,0.06)", border:"1px solid rgba(96,165,250,0.2)" }}>
              <span style={{ color:"#60a5fa", fontSize:12, fontWeight:800, display:"block", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:12 }}>📅 Reagendar Consulta</span>
              <p style={{ color:"#a1a1aa", fontSize:14, margin:"0 0 8px" }}>Propor novo horário para <strong style={{ color:"#f4f4f5" }}>{consultaNome}</strong>.</p>
              <p style={{ color:"#71717a", fontSize:12, margin:"0 0 20px", background:"rgba(96,165,250,0.06)", borderRadius:8, padding:"10px 12px", border:"1px solid rgba(96,165,250,0.15)" }}>
                O paciente será notificado e precisará aceitar o novo horário proposto.
              </p>
              <div style={{ display:"flex", gap:12 }}>
                <button className="pro-btn-ghost" onClick={() => setView("menu")} style={{ flex:1 }}>← Voltar</button>
                <button className="pro-btn-primary" style={{ flex:2, background:"linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)", boxShadow:"0 4px 16px rgba(96,165,250,0.25)" }} onClick={() => router.push("/painel/consultas")}>
                  Ir para Agenda 📅
                </button>
              </div>
            </div>
          )}

          {/* ── CANCELAR ── */}
          {view === "cancelar" && !cancelDone && (
            <div className="pro-mg-confirm-box" style={{ background:"rgba(244,63,94,0.06)", border:"1px solid rgba(244,63,94,0.2)" }}>
              <span style={{ color:"#f43f5e", fontSize:12, fontWeight:800, display:"block", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:12 }}>⚠️ Confirmar Cancelamento</span>
              <p style={{ color:"#a1a1aa", fontSize:14, margin:"0 0 8px" }}>Tem certeza que deseja cancelar a consulta de <strong style={{ color:"#f4f4f5" }}>{consultaNome}</strong>?</p>
              <p style={{ color:"#71717a", fontSize:13, margin:"0 0 12px" }}>📅 {consultaData} às {consultaHor} · {consultaMod}</p>
              <p style={{ color:"#71717a", fontSize:12, margin:"0 0 20px", background:"rgba(244,63,94,0.06)", borderRadius:8, padding:"10px 12px", border:"1px solid rgba(244,63,94,0.15)" }}>
                O paciente será notificado automaticamente sobre o cancelamento.
              </p>
              <div style={{ display:"flex", gap:12 }}>
                <button className="pro-btn-ghost" onClick={() => setView("menu")} style={{ flex:1 }}>← Voltar</button>
                <button id="btn-pro-confirmar-cancelamento" onClick={() => setCancelDone(true)} style={{ flex:2, padding:"14px 0", borderRadius:12, fontSize:14, fontWeight:700, background:"#f43f5e", border:"none", color:"#fff", cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s" }}>
                  Cancelar Consulta
                </button>
              </div>
            </div>
          )}

          {/* ── CANCELADO ── */}
          {cancelDone && (
            <div className="pro-mg-success">
              <div className="pro-mg-success-icon" style={{ background:"rgba(244,63,94,0.1)", border:"2px solid #f43f5e" }}>🗑️</div>
              <p style={{ color:"#fafafa", fontSize:20, fontWeight:"bold", margin:"0 0 8px" }}>Consulta Cancelada</p>
              <p style={{ color:"#a1a1aa", fontSize:13, margin:"0 0 20px" }}>A consulta de <strong style={{ color:"#f4f4f5" }}>{consultaNome}</strong> foi cancelada e o paciente foi notificado.</p>
              <button className="pro-btn-primary" style={{ margin:"0 auto" }} onClick={() => router.push("/painel/consultas")}>Ver Consultas →</button>
            </div>
          )}

        </div>
      </div>
    </>
  );
}

// ─── Página exportada com Suspense ────────────────────────────────────────────

export default function ConsultaDetalhePage() {
  return (
    <Suspense fallback={null}>
      <ConsultaDetalheInner />
    </Suspense>
  );
}
