//@ts-nocheck
"use client";

import { useStatusMap } from "./consultasStore";
import type { StatusConsulta } from "./consultasStore";

// ─── Props ────────────────────────────────────────────────────────────────────

interface TimelineStatusProps {
  consultaId: string;
  defaultStatus?: StatusConsulta;
  justificativa?: string;
  compact?: boolean;
  role?: "paciente" | "profissional";
  onPagar?: () => void;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const STEPS = [
  {
    key: "consulta_solicitada" as StatusConsulta,
    label: "Solicitação Enviada",
    icon: "📋",
    color: "#60a5fa",
    colorRgb: "96,165,250",
    desc: {
      paciente: "Sua solicitação foi enviada ao profissional.",
      profissional: "O paciente solicitou este agendamento.",
    },
    ts: "Hoje às 09:30",
  },
  {
    key: "pagamento_pendente" as StatusConsulta,
    label: "Aguardando Pagamento",
    icon: "💳",
    color: "#fbbf24",
    colorRgb: "251,191,36",
    desc: {
      paciente: "Profissional confirmou. Realize o pagamento para garantir sua vaga.",
      profissional: "Consulta confirmada. Aguardando pagamento do paciente.",
    },
    ts: "Hoje às 10:15",
  },
  {
    key: "consulta_confirmada" as StatusConsulta,
    label: "Consulta Confirmada",
    icon: "✅",
    color: "#10b981",
    colorRgb: "16,185,129",
    desc: {
      paciente: "Pagamento realizado! Sua consulta está confirmada.",
      profissional: "Pagamento recebido. Consulta confirmada.",
    },
    ts: "—",
  },
];

const REFUSED = {
  key: "consulta_recusada" as StatusConsulta,
  label: "Consulta Recusada",
  icon: "✕",
  color: "#f43f5e",
  colorRgb: "244,63,94",
  desc: {
    paciente: "O profissional não pode atender neste horário.",
    profissional: "Você recusou este agendamento.",
  },
  ts: "Hoje às 10:45",
};

const ORDER: StatusConsulta[] = ["consulta_solicitada", "pagamento_pendente", "consulta_confirmada"];

// ─── CSS ─────────────────────────────────────────────────────────────────────

const TL_CSS = `
  @keyframes tl-pulse {
    0%,100% { box-shadow: 0 0 0 0 var(--tl-pulse, rgba(96,165,250,0.5)); }
    50%      { box-shadow: 0 0 0 8px transparent; }
  }
  @keyframes tl-in { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
  .tl-root { display:flex; flex-direction:column; }
  .tl-step { display:flex; gap:14px; animation:tl-in 0.3s ease; }
  .tl-step.tl-sm { gap:10px; }
  .tl-left { display:flex; flex-direction:column; align-items:center; flex-shrink:0; width:28px; }
  .tl-left.tl-sm { width:20px; }
  .tl-node {
    width:28px; height:28px; border-radius:50%;
    display:flex; align-items:center; justify-content:center;
    font-size:13px; flex-shrink:0; border:2px solid transparent; transition:all 0.3s;
  }
  .tl-node.tl-sm { width:20px; height:20px; font-size:10px; }
  .tl-node.done    { background:rgba(96,165,250,0.12); border-color:#60a5fa; color:#60a5fa; }
  .tl-node.current { background:rgba(var(--tl-rgb,96,165,250),0.12); border-color:var(--tl-color,#60a5fa); color:var(--tl-color,#60a5fa); --tl-pulse:var(--tl-color); animation:tl-pulse 2s ease-in-out infinite; }
  .tl-node.pending { background:rgba(255,255,255,0.03); border-color:rgba(255,255,255,0.12); color:#3f3f46; border-style:dashed; }
  .tl-node.refused { background:rgba(244,63,94,0.1); border-color:#f43f5e; color:#f43f5e; }
  .tl-line { flex:1; width:2px; min-height:20px; margin:4px 0; border-radius:1px; }
  .tl-line.tl-sm { min-height:12px; }
  .tl-line.done    { background:rgba(96,165,250,0.35); }
  .tl-line.pending { border-left:2px dashed rgba(255,255,255,0.1); width:0; margin-left:1px; }
  .tl-line.refused { border-left:2px dashed rgba(244,63,94,0.25); width:0; margin-left:1px; }
  .tl-body { flex:1; padding-bottom:20px; min-width:0; }
  .tl-body.tl-sm { padding-bottom:12px; }
  .tl-body.tl-last { padding-bottom:0; }
  .tl-label { font-size:14px; font-weight:700; color:#f4f4f5; margin-bottom:3px; display:flex; align-items:center; gap:8px; }
  .tl-label.tl-sm { font-size:12px; margin-bottom:2px; }
  .tl-label.pending { color:#3f3f46; }
  .tl-label.current { color:var(--tl-color,#f4f4f5); }
  .tl-label.refused { color:#f43f5e; }
  .tl-desc { font-size:13px; color:#71717a; line-height:1.5; margin-bottom:4px; }
  .tl-desc.tl-sm { font-size:11px; }
  .tl-desc.pending { color:#3f3f46; }
  .tl-time { font-size:11px; color:#52525b; }
  .tl-time.tl-sm { font-size:10px; }
  .tl-just {
    margin-top:8px;
    background:rgba(244,63,94,0.07);
    border-left:3px solid rgba(244,63,94,0.4);
    border-radius:0 8px 8px 0;
    padding:8px 12px; font-size:13px; color:#a1a1aa; font-style:italic; line-height:1.5;
  }
  .tl-just.tl-sm { font-size:11px; padding:6px 10px; margin-top:6px; }
  .tl-pay-btn {
    margin-top:10px; display:inline-flex; align-items:center; gap:6px;
    background:#fbbf24; border:none; border-radius:8px;
    padding:8px 16px; color:#000; font-size:12px; font-weight:700;
    cursor:pointer; font-family:inherit; transition:all 0.15s;
  }
  .tl-pay-btn:hover { background:#f59e0b; transform:translateY(-1px); }
`;

// ─── Component ────────────────────────────────────────────────────────────────

export default function TimelineStatus({
  consultaId,
  defaultStatus = "consulta_solicitada",
  justificativa,
  compact = false,
  role = "paciente",
  onPagar,
}: TimelineStatusProps) {
  const statusMap = useStatusMap();
  const status: StatusConsulta = (statusMap[consultaId] as StatusConsulta) ?? defaultStatus;
  const isRefused = status === "consulta_recusada";
  const currentIdx = ORDER.indexOf(status);
  const sm = compact ? " tl-sm" : "";

  const stepsToRender = isRefused
    ? [STEPS[0], REFUSED]
    : STEPS;

  function nodeState(idx: number): "done" | "current" | "pending" {
    if (idx < currentIdx) return "done";
    if (idx === currentIdx) return "current";
    return "pending";
  }

  return (
    <>
      <style>{TL_CSS}</style>
      <div className="tl-root">
        {stepsToRender.map((step, idx) => {
          const isLast = idx === stepsToRender.length - 1;
          const state = isRefused && idx === 1 ? "refused" : nodeState(idx);
          const isCurrentStep = state === "current";
          const cssVars = isCurrentStep
            ? { "--tl-color": step.color, "--tl-rgb": step.colorRgb } as React.CSSProperties
            : {};

          return (
            <div key={step.key} className={`tl-step${sm}`}>
              {/* Node + line */}
              <div className={`tl-left${sm}`}>
                <div className={`tl-node${sm} ${state}`} style={cssVars}>
                  {state === "done"    ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  : state === "refused" ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  : <span style={{ fontSize: compact ? 8 : 11 }}>{idx + 1}</span>}
                </div>
                {!isLast && (
                  <div className={`tl-line${sm} ${state === "done" ? "done" : isRefused && idx === 0 ? "refused" : "pending"}`} />
                )}
              </div>

              {/* Content */}
              <div className={`tl-body${sm}${isLast ? " tl-last" : ""}`} style={cssVars}>
                <div className={`tl-label${sm} ${state}`}>
                  {!compact && <span>{step.icon}</span>}
                  {step.label}
                </div>
                {!compact && (
                  <div className={`tl-desc ${state === "pending" ? "pending" : ""}`}>
                    {step.desc[role]}
                  </div>
                )}
                {compact && state !== "pending" && (
                  <div className={`tl-desc tl-sm ${state === "pending" ? "pending" : ""}`}>
                    {step.desc[role]}
                  </div>
                )}
                <div className={`tl-time${sm}`}>{step.ts}</div>

                {/* Justificativa na recusa */}
                {state === "refused" && justificativa && (
                  <div className={`tl-just${sm}`}>
                    "{justificativa}"
                  </div>
                )}

                {/* Botão pagar (só paciente, só no step pagamento_pendente atual) */}
                {role === "paciente" && step.key === "pagamento_pendente" && state === "current" && onPagar && (
                  <button className="tl-pay-btn" onClick={onPagar}>
                    💳 Ir para o Pagamento →
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
