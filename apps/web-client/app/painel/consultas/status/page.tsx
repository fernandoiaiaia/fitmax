//@ts-nocheck
"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { detalheConsulta } from "../../../../lib/consultas-api";
import TimelineStatus from "../TimelineStatus";
import { useStatusMap } from "../consultasStore";
import dynamic from "next/dynamic";
const VideoRoomModal = dynamic(() => import("@/components/VideoRoomModal"), { ssr: false });

function formatDate(iso: string) {
  const [y,m,d] = iso.split("T")[0].split("-"); return `${d}/${m}/${y}`;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const STYLES = `
  @keyframes st-fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  .st-page  { animation: st-fadeUp 0.3s ease; }
  .st-card  { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:18px; padding:22px; }
  .st-row   { display:flex; align-items:flex-start; gap:10px; font-size:13px; color:#a1a1aa; margin-bottom:7px; }
  .st-row:last-child { margin-bottom:0; }
  .st-txt   { color:#d4d4d8; line-height:1.5; }
  .st-txt strong { color:#f4f4f5; }
  .st-badge {
    display:inline-flex; align-items:center; gap:5px;
    padding:4px 14px; border-radius:99px; font-size:11px; font-weight:700;
    letter-spacing:0.06em; text-transform:uppercase;
  }
  .st-badge.solicitada  { background:rgba(251,191,36,0.12); border:1px solid rgba(251,191,36,0.35); color:#fbbf24; }
  .st-badge.pendente    { background:rgba(96,165,250,0.12);  border:1px solid rgba(96,165,250,0.35); color:#60a5fa; }
  .st-badge.confirmada  { background:rgba(16,185,129,0.12);  border:1px solid rgba(16,185,129,0.35); color:#10b981; }
  .st-badge.recusada    { background:rgba(244,63,94,0.12);   border:1px solid rgba(244,63,94,0.3);   color:#f43f5e; }
  .st-action-bar {
    background:rgba(251,191,36,0.06); border:1px solid rgba(251,191,36,0.25);
    border-radius:14px; padding:16px 20px;
    display:flex; align-items:center; justify-content:space-between; gap:14px;
  }
  .st-pay-btn {
    background:#fbbf24; border:none; border-radius:10px;
    padding:10px 22px; color:#000; font-size:13px; font-weight:800;
    cursor:pointer; font-family:inherit; transition:all 0.15s; white-space:nowrap;
    display:flex; align-items:center; gap:7px;
  }
  .st-pay-btn:hover { background:#f59e0b; box-shadow:0 0 16px rgba(251,191,36,0.4); }
  .st-confirm-banner {
    background:rgba(16,185,129,0.07); border:1px solid rgba(16,185,129,0.25);
    border-radius:14px; padding:16px 20px; text-align:center;
  }
  @media (max-width:480px) { .st-action-bar { flex-direction:column; } .st-pay-btn { width:100%; justify-content:center; } }
`;

function BadgeStatus({ status }: { status: string }) {
  const m: Record<string,{cls:string;dot:string;label:string}> = {
    consulta_solicitada: { cls:"solicitada", dot:"🟡", label:"Solicitada"     },
    pagamento_pendente:  { cls:"pendente",   dot:"🔵", label:"Aguard. Pgto"  },
    consulta_confirmada: { cls:"confirmada", dot:"🟢", label:"Confirmada"     },
    consulta_recusada:   { cls:"recusada",   dot:"🔴", label:"Recusada"       },
  };
  const v = m[status] ?? m["consulta_solicitada"];
  return <span className={`st-badge ${v.cls}`}>{v.dot} {v.label}</span>;
}

// ─── Inner (needs searchParams) ───────────────────────────────────────────────

function StatusInner() {
  const router = useRouter();
  const params  = useSearchParams();
  const id      = params.get("id") ?? "";

  // ─ Dados reais da API ───────────────────────────────────────────────────────
  const [consulta, setConsulta] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    detalheConsulta(id)
      .then(c => setConsulta(c))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  // Mapeia statusFluxo da API para o tipo StatusConsulta do timeline
  function mapStatus(statusFluxo) {
    const m = {
      pagamento_pendente:  "pagamento_pendente",
      consulta_confirmada: "consulta_confirmada",
      consulta_cancelada:  "consulta_recusada",
    };
    return m[statusFluxo] ?? "consulta_solicitada";
  }

  const status = consulta ? mapStatus(consulta.statusFluxo) : "consulta_solicitada";

  function irPagar() { router.push(`/painel/consultas/pagamento?id=${id}`); }

  if (loading || !consulta) {
    return (
      <div style={{ textAlign: "center", padding: 48, color: "#a1a1aa" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
        <span>{loading ? "Carregando consulta…" : "Consulta não encontrada."}</span>
      </div>
    );
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      {/* Resumo */}
      <div className="st-card">
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12, flexWrap:"wrap", gap:8 }}>
          <span style={{ color:"#a1a1aa", fontSize:11, fontWeight:"700", textTransform:"uppercase", letterSpacing:"0.06em" }}>Detalhes da Consulta</span>
          <BadgeStatus status={status} />
        </div>

        <div className="st-row">
          <span>👨‍⚕️</span>
          <span className="st-txt"><strong>{consulta.profissional.name}</strong></span>
        </div>
        <div className="st-row">
          <span>🏥</span>
          <span className="st-txt">{consulta.especialidade}</span>
        </div>
        <div className="st-row">
          <span>📅</span>
          <span className="st-txt"><strong>{formatDate(consulta.dataHora)}</strong> às {consulta.dataHora.substring(11,16)} · Videoconferência</span>
        </div>

        <div className="st-row">
          <span>💳</span>
          <span className="st-txt">Particular</span>
        </div>
      </div>

      {/* Ação de pagamento */}
      {status === "pagamento_pendente" && (
        <div className="st-action-bar">
          <div>
            <span style={{ color:"#fbbf24", fontSize:13, fontWeight:"700", display:"block", marginBottom:4 }}>💳 Pagamento Pendente</span>
            <span style={{ color:"#a1a1aa", fontSize:12 }}>Realize o pagamento para confirmar sua consulta.</span>
          </div>
          <button className="st-pay-btn" id="st-btn-pagar" onClick={irPagar}>
            Pagar Agora →
          </button>
        </div>
      )}

      {/* Banner confirmada / em andamento */}
      {(status === "consulta_confirmada" || status === "em_andamento") && (
        <div className="st-confirm-banner" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <span style={{ fontSize:28, display:"block", marginBottom:8 }}>🎉</span>
            <span style={{ color:"#10b981", fontSize:15, fontWeight:"700", display:"block", marginBottom:4 }}>Consulta Confirmada!</span>
            <span style={{ color:"#a1a1aa", fontSize:13 }}>Até {formatDate(consulta.dataHora)} às {consulta.dataHora.substring(11,16)}!</span>
          </div>

          {/* Botão sempre exibido se a consulta estiver em andamento ou confirmada */}
          <button
            onClick={() => setIsVideoModalOpen(true)}
            style={{
              background: "#10b981",
              border: "none",
              borderRadius: "10px",
              padding: "12px 24px",
              color: "#fff",
              fontSize: "14px",
              fontWeight: "bold",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              margin: "0 auto",
              transition: "all 0.15s",
              boxShadow: "0 0 16px rgba(16,185,129,0.3)"
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
            Entrar na Sala de Vídeo
          </button>
        </div>
      )}

      {/* Timeline */}
      <div className="st-card">
        <span style={{ color:"#a1a1aa", fontSize:11, fontWeight:"700", display:"block", marginBottom:16, textTransform:"uppercase", letterSpacing:"0.06em" }}>Histórico do Agendamento</span>
        <TimelineStatus
          consultaId={id}
          defaultStatus={status}
          justificativa={consulta.estornoMotivo || undefined}
          role="paciente"
          onPagar={status === "pagamento_pendente" ? irPagar : undefined}
        />
      </div>

      <VideoRoomModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        channelName={`consulta_${consulta.id}`}
        userName="Paciente"
      />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ConsultaStatusPage() {
  const router = useRouter();
  return (
    <>
      <style>{STYLES}</style>
      <div style={{ flex:1, overflowY:"auto", backgroundColor:"#111" }}>
        <div style={{ padding:16, maxWidth:640, margin:"0 auto", width:"100%", display:"flex", flexDirection:"column", gap:20 }} className="st-page sm:p-6">
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <button onClick={()=>router.push("/painel/consultas")} style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, width:38, height:38, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#a1a1aa", flexShrink:0, transition:"all 0.15s" }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor="#10b981";e.currentTarget.style.color="#10b981";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.1)";e.currentTarget.style.color="#a1a1aa";}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            </button>
            <div style={{ flex:1 }}>
              <h2 style={{ color:"#fafafa", fontSize:24, fontWeight:"bold", margin:0 }}>Status da Consulta</h2>
              <span style={{ color:"#a1a1aa", fontSize:13 }}>Acompanhe o progresso do seu agendamento</span>
            </div>
          </div>
          <Suspense fallback={<span style={{ color:"#a1a1aa" }}>Carregando...</span>}>
            <StatusInner />
          </Suspense>
        </div>
      </div>
    </>
  );
}
