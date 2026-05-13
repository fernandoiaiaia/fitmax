//@ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { updateStatus, useStatusMap } from "../consultasStore";
import TimelineStatus from "../TimelineStatus";

// ─── Types & Mock Data ────────────────────────────────────────────────────────

type StatusConsulta =
  | "consulta_solicitada"
  | "pagamento_pendente"
  | "consulta_confirmada"
  | "consulta_recusada";

interface Consulta {
  id: string;
  paciente: { nome: string; avatar: string };
  tipo: "Presencial" | "Online";
  especialidade: { nome: string; icon: string };
  data: string;
  horario: string;
  clinica: { nome: string; logradouro: string; numero: string; bairro: string; cidade: string; uf: string } | null;
  convenio: { nome: string } | null;
  observacao: string;
  status: StatusConsulta;
  justificativa?: string;
}

const consultasMock: Consulta[] = [
  {
    id: "c001",
    paciente: { nome: "Carlos Mendes",    avatar: "https://picsum.photos/200/200?random=10" },
    tipo: "Presencial",
    especialidade: { nome: "Nutrição",    icon: "🥗" },
    data: "2026-05-20", horario: "10:00",
    clinica: { nome: "SportMed Clínica", logradouro: "Av. Paulista", numero: "1374", bairro: "Bela Vista", cidade: "São Paulo", uf: "SP" },
    convenio: { nome: "Unimed" },
    observacao: "Tenho dificuldade para ganhar peso e quero orientação nutricional detalhada.",
    status: "consulta_solicitada",
  },
  {
    id: "c002",
    paciente: { nome: "Fernanda Lima",    avatar: "https://picsum.photos/200/200?random=11" },
    tipo: "Online",
    especialidade: { nome: "Nutrologia",  icon: "💊" },
    data: "2026-05-21", horario: "14:00",
    clinica: null, convenio: null, observacao: "",
    status: "consulta_solicitada",
  },
  {
    id: "c003",
    paciente: { nome: "Rafael Oliveira", avatar: "https://picsum.photos/200/200?random=12" },
    tipo: "Presencial",
    especialidade: { nome: "Fisioterapia", icon: "💪" },
    data: "2026-05-22", horario: "09:00",
    clinica: { nome: "SportMed Clínica", logradouro: "Av. Paulista", numero: "1374", bairro: "Bela Vista", cidade: "São Paulo", uf: "SP" },
    convenio: { nome: "Bradesco Saúde" },
    observacao: "Dor no joelho direito após corrida de 10km. Piora ao subir escadas.",
    status: "consulta_solicitada",
  },
];

// ─── Styles ───────────────────────────────────────────────────────────────────

const STYLES = `
  @keyframes pf-fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes pf-expand {
    from { opacity: 0; transform: scaleY(0.92); }
    to   { opacity: 1; transform: scaleY(1); }
  }
  @keyframes pf-spin { to { transform: rotate(360deg); } }

  .pf-page { animation: pf-fadeUp 0.3s ease; }

  /* ── Tabs ── */
  .pf-tabs {
    display: flex;
    gap: 4px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px;
    padding: 4px;
  }
  .pf-tab {
    flex: 1;
    padding: 8px 12px;
    border-radius: 9px;
    border: none;
    background: transparent;
    color: #71717a;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.18s;
    white-space: nowrap;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }
  .pf-tab:hover:not(.active) { color: #e4e4e7; background: rgba(255,255,255,0.04); }
  .pf-tab.active { background: rgba(255,255,255,0.08); color: #f4f4f5; }
  .pf-tab-count {
    font-size: 11px;
    font-weight: 800;
    padding: 1px 7px;
    border-radius: 99px;
    background: rgba(255,255,255,0.1);
  }
  .pf-tab.active .pf-tab-count { background: #10b981; color: #fff; }

  /* ── Card ── */
  .pf-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 18px;
    overflow: hidden;
    transition: border-color 0.2s;
    animation: pf-fadeUp 0.3s ease;
  }
  .pf-card.confirmed { border-color: rgba(96,165,250,0.3); }
  .pf-card.refused   { border-color: rgba(244,63,94,0.25); opacity: 0.7; }

  .pf-card-header {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 18px 20px 14px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .pf-avatar {
    width: 48px; height: 48px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
    border: 2px solid rgba(255,255,255,0.1);
  }
  .pf-paciente-nome {
    font-size: 15px;
    font-weight: 700;
    color: #f4f4f5;
    margin: 0 0 4px;
  }

  /* ── Badge ── */
  .pf-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 10px;
    border-radius: 99px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .pf-badge.solicitada  { background: rgba(251,191,36,0.12);  border: 1px solid rgba(251,191,36,0.35);  color: #fbbf24; }
  .pf-badge.confirmada  { background: rgba(96,165,250,0.12);  border: 1px solid rgba(96,165,250,0.35);  color: #60a5fa; }
  .pf-badge.recusada  { background: rgba(244,63,94,0.12);  border: 1px solid rgba(244,63,94,0.3);   color: #f43f5e; }
  .pf-badge.paga      { background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.35); color: #10b981; }

  /* ── Body ── */
  .pf-card-body {
    padding: 16px 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .pf-field-row {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    font-size: 13px;
    color: #a1a1aa;
  }
  .pf-field-icon { flex-shrink: 0; font-size: 15px; line-height: 1.4; }
  .pf-field-text { color: #d4d4d8; line-height: 1.5; }
  .pf-field-text strong { color: #f4f4f5; }

  .pf-observacao {
    margin-top: 4px;
    background: rgba(255,255,255,0.03);
    border-left: 3px solid rgba(16,185,129,0.4);
    border-radius: 0 8px 8px 0;
    padding: 10px 14px;
    font-size: 13px;
    color: #a1a1aa;
    font-style: italic;
    line-height: 1.6;
  }

  /* ── Footer ── */
  .pf-card-footer {
    padding: 14px 20px;
    border-top: 1px solid rgba(255,255,255,0.06);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }
  .pf-btn-refuse {
    background: transparent;
    border: 1px solid rgba(244,63,94,0.35);
    border-radius: 10px;
    padding: 10px 20px;
    color: #f43f5e;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.15s;
    display: flex;
    align-items: center;
    gap: 7px;
  }
  .pf-btn-refuse:hover:not(:disabled) { background: rgba(244,63,94,0.1); border-color: #f43f5e; }
  .pf-btn-refuse:disabled { opacity: 0.35; cursor: not-allowed; }
  .pf-btn-confirm {
    background: #10b981;
    border: none;
    border-radius: 10px;
    padding: 10px 22px;
    color: #fff;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.18s;
    display: flex;
    align-items: center;
    gap: 7px;
  }
  .pf-btn-confirm:hover:not(:disabled) { background: #0ea370; box-shadow: 0 0 16px rgba(16,185,129,0.35); }
  .pf-btn-confirm:disabled { opacity: 0.35; cursor: not-allowed; }
  .pf-spinner { animation: pf-spin 0.7s linear infinite; display: inline-block; }

  /* ── Justificativa ── */
  .pf-just-area {
    padding: 14px 20px 16px;
    border-top: 1px solid rgba(244,63,94,0.15);
    background: rgba(244,63,94,0.04);
    animation: pf-expand 0.2s ease;
    transform-origin: top;
  }
  .pf-just-label {
    font-size: 12px;
    font-weight: 700;
    color: #f43f5e;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    margin-bottom: 8px;
    display: block;
  }
  .pf-just-textarea {
    width: 100%;
    box-sizing: border-box;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(244,63,94,0.25);
    border-radius: 10px;
    padding: 10px 12px;
    color: #f4f4f5;
    font-size: 13px;
    font-family: inherit;
    outline: none;
    resize: vertical;
    min-height: 72px;
    transition: border-color 0.15s;
    line-height: 1.5;
  }
  .pf-just-textarea::placeholder { color: #52525b; }
  .pf-just-textarea:focus { border-color: #f43f5e; box-shadow: 0 0 0 3px rgba(244,63,94,0.1); }
  .pf-just-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 10px;
    gap: 10px;
  }
  .pf-btn-cancel {
    background: transparent;
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 10px;
    padding: 8px 16px;
    color: #71717a;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.15s;
  }
  .pf-btn-cancel:hover { color: #e4e4e7; border-color: rgba(255,255,255,0.25); }
  .pf-btn-refuse-confirm {
    background: #f43f5e;
    border: none;
    border-radius: 10px;
    padding: 8px 18px;
    color: #fff;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.18s;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .pf-btn-refuse-confirm:hover:not(:disabled) { background: #e11d48; }
  .pf-btn-refuse-confirm:disabled { opacity: 0.4; cursor: not-allowed; }

  /* ── Empty state ── */
  .pf-empty {
    text-align: center;
    padding: 56px 24px;
    color: #52525b;
  }
  .pf-empty-icon { font-size: 48px; margin-bottom: 16px; }

  @media (max-width: 520px) {
    .pf-tabs { flex-wrap: wrap; }
    .pf-tab  { flex: unset; font-size: 12px; }
    .pf-card-footer { flex-direction: column; }
    .pf-btn-refuse, .pf-btn-confirm { width: 100%; justify-content: center; }
  }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function StatusBadge({ status }: { status: StatusConsulta }) {
  const map: Record<StatusConsulta, { cls: string; label: string; dot: string }> = {
    consulta_solicitada: { cls: "solicitada", label: "Solicitada",  dot: "🟡" },
    pagamento_pendente:  { cls: "confirmada", label: "Aguard. Pgto",dot: "🔵" },
    consulta_confirmada: { cls: "paga",       label: "Paga",        dot: "🟢" },
    consulta_recusada:   { cls: "recusada",   label: "Recusada",    dot: "🔴" },
  };
  const { cls, label, dot } = map[status];
  return <span className={`pf-badge ${cls}`}>{dot} {label}</span>;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PainelProfissionalPage() {
  const router = useRouter();
  const [consultas,    setConsultas]    = useState<Consulta[]>(consultasMock);
  const [loadingId,    setLoadingId]    = useState<string | null>(null);
  const [recusandoId,  setRecusandoId]  = useState<string | null>(null);
  const [justMap,      setJustMap]      = useState<Record<string, string>>({});
  const [filtroStatus, setFiltroStatus] = useState<StatusConsulta | "todos">("consulta_solicitada");

  // Escuta mudanças do store (pagamento do paciente em tempo real)
  const statusMap = useStatusMap();

  // Mescla status local com o store (store tem prioridade)
  const consultasComStatus = consultas.map(c => ({
    ...c,
    status: (statusMap[c.id] as StatusConsulta) ?? c.status,
  }));

  async function confirmar(id: string) {
    setLoadingId(id);
    await new Promise(r => setTimeout(r, 700));
    updateStatus(id, "pagamento_pendente");
    setConsultas(prev => prev.map(c => c.id === id ? { ...c, status: "pagamento_pendente" } : c));
    setLoadingId(null);
  }

  async function recusar(id: string) {
    setLoadingId(id);
    await new Promise(r => setTimeout(r, 700));
    updateStatus(id, "consulta_recusada");
    setConsultas(prev => prev.map(c =>
      c.id === id ? { ...c, status: "consulta_recusada", justificativa: justMap[id] ?? "" } : c
    ));
    setLoadingId(null);
    setRecusandoId(null);
  }

  const filtered = filtroStatus === "todos"
    ? consultasComStatus
    : consultasComStatus.filter(c => c.status === filtroStatus);

  const countByStatus = (s: StatusConsulta) => consultasComStatus.filter(c => c.status === s).length;

  const tabs: { key: StatusConsulta | "todos"; label: string; dot: string }[] = [
    { key: "consulta_solicitada", label: "Pendentes",   dot: "🟡" },
    { key: "pagamento_pendente",  label: "Aguard. Pgto",dot: "🔵" },
    { key: "consulta_confirmada", label: "Pagas",       dot: "🟢" },
    { key: "consulta_recusada",   label: "Recusadas",   dot: "🔴" },
    { key: "todos",               label: "Todas",       dot: "📋" },
  ];

  return (
    <>
      <style>{STYLES}</style>
      <div style={{ flex:1, overflowY:"auto", backgroundColor:"#111" }}>
        <div style={{ padding:16, maxWidth:760, margin:"0 auto", width:"100%", display:"flex", flexDirection:"column", gap:20 }} className="pf-page sm:p-6">
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <button onClick={()=>router.push("/painel/consultas")} style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, width:38, height:38, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#a1a1aa", flexShrink:0, transition:"all 0.15s" }}
              onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor="#10b981";(e.currentTarget as HTMLButtonElement).style.color="#10b981";}}
              onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor="rgba(255,255,255,0.1)";(e.currentTarget as HTMLButtonElement).style.color="#a1a1aa";}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            </button>
            <div style={{ flex:1 }}>
              <h2 style={{ color:"#fafafa", fontSize:24, fontWeight:"bold", margin:0 }}>Solicitações de Consulta</h2>
              <span style={{ color:"#a1a1aa", fontSize:13 }}>Painel do Profissional</span>
            </div>
          </div>

          {/* ── Tabs / Filtro ── */}
          <div className="pf-tabs">
            {tabs.map(t => {
              const count = t.key === "todos" ? consultas.length : countByStatus(t.key as StatusConsulta);
              return (
                <button
                  key={t.key}
                  className={`pf-tab${filtroStatus === t.key ? " active" : ""}`}
                  onClick={() => setFiltroStatus(t.key)}
                >
                  {t.dot} {t.label}
                  {count > 0 && <span className="pf-tab-count">{count}</span>}
                </button>
              );
            })}
          </div>

          {/* ── Lista de Consultas ── */}
          {filtered.length === 0 ? (
            <div style={{ textAlign:"center", padding:"56px 24px", color:"#52525b" }}>
              <div style={{ fontSize:48, marginBottom:16 }}>📭</div>
              <span style={{ color:"#71717a", fontSize:14 }}>Nenhuma consulta nesta categoria.</span>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              {filtered.map(c => {
                const isLoading   = loadingId === c.id;
                const isRecusando = recusandoId === c.id;
                const isPending   = c.status === "consulta_solicitada";
                const cardCls     = c.status === "pagamento_pendente" ? " confirmed"
                                  : c.status === "consulta_recusada"  ? " refused" : "";

                return (
                  <div key={c.id} className={`pf-card${cardCls}`} id={`consulta-card-${c.id}`}>

                    {/* Header */}
                    <div className="pf-card-header">
                      <img src={c.paciente.avatar} alt={c.paciente.nome} className="pf-avatar" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p className="pf-paciente-nome">{c.paciente.nome}</p>
                        <StatusBadge status={c.status} />
                      </div>
                      {c.tipo === "Online"
                        ? <span style={{ fontSize: 20 }}>🌐</span>
                        : <span style={{ fontSize: 20 }}>📍</span>
                      }
                    </div>

                    {/* Body — somente leitura */}
                    <div className="pf-card-body">
                      <div className="pf-field-row">
                        <span className="pf-field-icon">📅</span>
                        <span className="pf-field-text">
                          <strong>{formatDate(c.data)}</strong> às {c.horario}
                          {" · "}{c.tipo}
                        </span>
                      </div>
                      <div className="pf-field-row">
                        <span className="pf-field-icon">{c.especialidade.icon}</span>
                        <span className="pf-field-text">{c.especialidade.nome}</span>
                      </div>
                      {c.tipo === "Presencial" && c.clinica && (
                        <div className="pf-field-row">
                          <span className="pf-field-icon">🏥</span>
                          <span className="pf-field-text">
                            <strong>{c.clinica.nome}</strong> — {c.clinica.logradouro}, {c.clinica.numero} · {c.clinica.bairro} · {c.clinica.cidade}/{c.clinica.uf}
                          </span>
                        </div>
                      )}
                      <div className="pf-field-row">
                        <span className="pf-field-icon">💳</span>
                        <span className="pf-field-text">
                          {c.convenio ? c.convenio.nome : <span style={{ color: "#52525b" }}>Particular</span>}
                        </span>
                      </div>
                      {c.observacao && (
                        <div className="pf-observacao">
                          💬 "{c.observacao}"
                        </div>
                      )}
                      {c.status === "consulta_recusada" && c.justificativa && (
                        <div style={{ marginTop: 4, padding: "8px 12px", background: "rgba(244,63,94,0.06)", borderLeft: "3px solid rgba(244,63,94,0.4)", borderRadius: "0 8px 8px 0", fontSize: 13, color: "#a1a1aa" }}>
                          🚫 Justificativa: "{c.justificativa}"
                        </div>
                      )}

                      {/* ── Histórico / Timeline ── */}
                      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: 14, paddingTop: 14 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 12 }}>
                          Histórico
                        </span>
                        <TimelineStatus
                          consultaId={c.id}
                          defaultStatus={c.status}
                          justificativa={c.justificativa}
                          compact
                          role="profissional"
                        />
                      </div>
                    </div>

                    {/* Área de justificativa (expansão ao recusar) */}
                    {isRecusando && (
                      <div className="pf-just-area">
                        <span className="pf-just-label">Justificativa da recusa (opcional)</span>
                        <textarea
                          id={`textarea-just-${c.id}`}
                          className="pf-just-textarea"
                          placeholder="Descreva o motivo da recusa para o paciente..."
                          value={justMap[c.id] ?? ""}
                          onChange={e => setJustMap(prev => ({ ...prev, [c.id]: e.target.value }))}
                          autoFocus
                        />
                        <div className="pf-just-actions">
                          <button
                            className="pf-btn-cancel"
                            onClick={() => setRecusandoId(null)}
                            disabled={isLoading}
                          >
                            ← Cancelar
                          </button>
                          <button
                            id={`btn-confirmar-recusa-${c.id}`}
                            className="pf-btn-refuse-confirm"
                            disabled={isLoading}
                            onClick={() => recusar(c.id)}
                          >
                            {isLoading ? (
                              <>
                                <svg className="pf-spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                  <path d="M12 2a10 10 0 0 1 10 10" />
                                </svg>
                                Recusando…
                              </>
                            ) : (
                              <>Confirmar Recusa ✗</>
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Footer de ações */}
                    {!isRecusando && (
                      <div className="pf-card-footer">
                        <button
                          id={`btn-recusar-${c.id}`}
                          className="pf-btn-refuse"
                          disabled={!isPending || isLoading}
                          onClick={() => setRecusandoId(c.id)}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                          Recusar
                        </button>
                        <button
                          id={`btn-confirmar-${c.id}`}
                          className="pf-btn-confirm"
                          disabled={!isPending || isLoading}
                          onClick={() => confirmar(c.id)}
                        >
                          {isLoading ? (
                            <>
                              <svg className="pf-spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <path d="M12 2a10 10 0 0 1 10 10" />
                              </svg>
                              Confirmando…
                            </>
                          ) : (
                            <>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                              Confirmar Consulta
                            </>
                          )}
                        </button>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </>
  );
}
