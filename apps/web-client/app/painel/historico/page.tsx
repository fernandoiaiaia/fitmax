//@ts-nocheck
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  listarHistorico, resumoHistorico, timelineHistorico, avaliarConsulta,
} from "../../../lib/historico-api";
import type {
  ConsultaHistoricoResumo, HistoricoResumo, TimelineItem, PeriodoHistorico,
} from "../../../lib/historico-api";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isoToData(iso: string): string {
  const d = iso.substring(0, 10);
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}
function isoToHorario(iso: string): string { return iso.substring(11, 16); }
function isoToMesISO(iso: string): string  { return iso.substring(0, 7); }

const mesLabels: Record<string, string> = {
  "2026-02": "Fevereiro 2026", "2026-01": "Janeiro 2026",
  "2026-03": "Março 2026",     "2026-04": "Abril 2026",
  "2026-05": "Maio 2026",      "2025-12": "Dezembro 2025",
};
function getMesLabel(mesISO: string): string {
  if (mesLabels[mesISO]) return mesLabels[mesISO];
  const [y, m] = mesISO.split("-");
  const nomes = ["","Janeiro","Fevereiro","Março","Abril","Maio","Junho",
                    "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  return `${nomes[parseInt(m)]} ${y}`;
}

function agruparPorMes(items: ConsultaHistoricoResumo[]): Record<string, ConsultaHistoricoResumo[]> {
  const g: Record<string, ConsultaHistoricoResumo[]> = {};
  for (const i of items) {
    const k = isoToMesISO(i.dataHora);
    if (!g[k]) g[k] = [];
    g[k].push(i);
  }
  return g;
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const C = {
  bg:"#111111", color2:"#1a1a1a", color3:"#222222",
  color10:"#71717a", color11:"#a1a1aa", color12:"#fafafa", border:"#27272a",
};
const avalCfg = {
  avaliado:      { label:"AVALIADO", bg:"rgba(16,185,129,0.12)",  color:"#10b981" },
  pendente:      { label:"PENDENTE", bg:"rgba(167,139,250,0.12)", color:"#a78bfa" },
  nao_avaliavel: { label:"N/A",      bg:"rgba(161,161,170,0.1)",  color:"#71717a" },
};
const PERIODOS: { label: string; value: PeriodoHistorico }[] = [
  { label: "Tudo",   value: "tudo"   },
  { label: "Semana", value: "semana" },
  { label: "Mês",    value: "mes"    },
  { label: "Ano",    value: "ano"    },
];

// ─── Componentes ─────────────────────────────────────────────────────────────

function StarRow({ nota }: { nota: number }) {
  return (
    <div style={{ display:"flex", gap:2 }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="12" height="12" viewBox="0 0 24 24"
          fill={i<=nota?"#facc15":"none"} stroke={i<=nota?"#facc15":"#3f3f46"} strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

function HoverCard({ children, hoverBorder, style }: {
  children: React.ReactNode; hoverBorder: string; style?: React.CSSProperties;
}) {
  return (
    <div style={{ border:`1px solid ${C.border}`, backgroundColor:C.color2, borderRadius:12, overflow:"hidden", cursor:"pointer", transition:"background .15s, border-color .15s", ...style }}
      onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.backgroundColor=C.color3;(e.currentTarget as HTMLElement).style.borderColor=hoverBorder;}}
      onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.backgroundColor=C.color2;(e.currentTarget as HTMLElement).style.borderColor=C.border;}}>
      {children}
    </div>
  );
}

function ConsultaCard({ c, onAvaliar }: { c: ConsultaHistoricoResumo; onAvaliar: (id: string) => void }) {
  const aval = avalCfg[c.statusAvaliacao];
  return (
    <HoverCard hoverBorder="#10b981">
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 16px", borderBottom:`1px solid ${C.border}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ color:C.color10 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </span>
          <span style={{ color:C.color11, fontSize:12 }}>{isoToData(c.dataHora)}</span>
          <div style={{ width:3, height:3, borderRadius:"50%", backgroundColor:"#52525b" }} />
          <span style={{ color:C.color11, fontSize:12 }}>{isoToHorario(c.dataHora)}</span>
        </div>
        <div style={{ background:aval.bg, borderRadius:999, paddingLeft:12, paddingRight:12, paddingTop:3, paddingBottom:3 }}>
          <span style={{ color:aval.color, fontSize:10, fontWeight:"bold" }}>{aval.label}</span>
        </div>
      </div>
      {/* Body */}
      <div style={{ display:"flex", alignItems:"center", gap:12, padding:16 }}>
        <img
          src={c.profissional.avatarUrl ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(c.profissional.nome)}&background=27272a&color=a1a1aa`}
          style={{ width:48, height:48, borderRadius:"50%", objectFit:"cover", flexShrink:0 }} alt="" />
        <div style={{ flex:1, display:"flex", flexDirection:"column", gap:4, minWidth:0 }}>
          <span style={{ color:C.color12, fontSize:14, fontWeight:"bold", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {c.profissional.nome}
          </span>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ color:C.color11, fontSize:12 }}>{c.especialidade}</span>
            <div style={{ width:3, height:3, borderRadius:"50%", backgroundColor:"#52525b" }} />
            <span style={{ color:C.color11, fontSize:12 }}>{c.modalidade === "PRESENCIAL" ? "Presencial" : "Online"}</span>
          </div>
          {c.nota && (
            <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:4 }}>
              <StarRow nota={c.nota} />
              <span style={{ color:C.color10, fontSize:11 }}>Sua avaliação</span>
            </div>
          )}
        </div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4, flexShrink:0 }}>
          <span style={{ color:C.color10, fontSize:11 }}>Valor</span>
          <span style={{ color:C.color12, fontSize:16, fontWeight:"bold" }}>R$ {parseFloat(c.valorReais).toFixed(0)}</span>
        </div>
      </div>
      {/* Footer */}
      <div style={{ display:"flex", padding:"8px 16px", borderTop:`1px solid ${C.border}` }}>
        <button id={`btn-detalhes-${c.id}`}
          style={{ display:"flex", alignItems:"center", gap:4, background:"none", border:"none", cursor:"pointer", padding:"4px 8px", borderRadius:6 }}
          onClick={() => c.statusAvaliacao === "pendente" && onAvaliar(c.id)}
          onMouseEnter={e=>(e.currentTarget as HTMLElement).style.backgroundColor=C.color3}
          onMouseLeave={e=>(e.currentTarget as HTMLElement).style.backgroundColor="transparent"}>
          <span style={{ color:C.color10 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </span>
          <span style={{ color: c.statusAvaliacao === "pendente" ? "#a78bfa" : C.color11, fontSize:12 }}>
            {c.statusAvaliacao === "pendente" ? "Avaliar consulta" : "Ver detalhes"}
          </span>
        </button>
      </div>
    </HoverCard>
  );
}

// ─── Modal de Avaliação ───────────────────────────────────────────────────────

function AvaliacaoModal({ consultaId, onClose, onSuccess }: {
  consultaId: string; onClose: () => void; onSuccess: () => void;
}) {
  const [nota,       setNota]       = useState(0);
  const [comentario, setComentario] = useState("");
  const [loading,    setLoading]    = useState(false);
  const [erro,       setErro]       = useState<string | null>(null);

  async function handleSubmit() {
    if (nota === 0) { setErro("Selecione uma nota de 1 a 5."); return; }
    setLoading(true); setErro(null);
    try {
      await avaliarConsulta(consultaId, nota, comentario || undefined);
      onSuccess();
    } catch {
      setErro("Erro ao salvar avaliação. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", backgroundColor:"rgba(0,0,0,0.7)", padding:16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background:C.color2, border:`1px solid ${C.border}`, borderRadius:16, padding:24, width:"100%", maxWidth:400 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <span style={{ color:C.color12, fontSize:16, fontWeight:"bold" }}>Avaliar Consulta</span>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:C.color11, fontSize:20, lineHeight:1 }}>×</button>
        </div>
        {/* Estrelas */}
        <div style={{ display:"flex", gap:8, justifyContent:"center", marginBottom:20 }}>
          {[1,2,3,4,5].map(i => (
            <button key={i} onClick={() => setNota(i)}
              style={{ background:"none", border:"none", cursor:"pointer", padding:4, transition:"transform .1s" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform="scale(1.2)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform="scale(1)"}>
              <svg width="32" height="32" viewBox="0 0 24 24"
                fill={i<=nota?"#facc15":"none"} stroke={i<=nota?"#facc15":"#52525b"} strokeWidth="1.5">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </button>
          ))}
        </div>
        {/* Comentário */}
        <textarea
          value={comentario} onChange={e => setComentario(e.target.value)}
          maxLength={500}
          placeholder="Comentário opcional (máx. 500 caracteres)…"
          style={{ width:"100%", minHeight:90, background:C.color3, border:`1px solid ${C.border}`, borderRadius:8, color:C.color12, fontSize:13, padding:"10px 12px", resize:"vertical", outline:"none", fontFamily:"inherit", boxSizing:"border-box" }}
        />
        {erro && <p style={{ color:"#f43f5e", fontSize:12, margin:"8px 0 0" }}>{erro}</p>}
        <div style={{ display:"flex", gap:8, marginTop:16 }}>
          <button onClick={onClose}
            style={{ flex:1, padding:"10px 0", borderRadius:8, background:"transparent", border:`1px solid ${C.border}`, color:C.color11, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={loading}
            style={{ flex:1, padding:"10px 0", borderRadius:8, background:loading?"#52525b":"#a78bfa", border:"none", color:"#fff", fontSize:13, fontWeight:"bold", cursor:loading?"not-allowed":"pointer", fontFamily:"inherit", transition:"background .15s" }}>
            {loading ? "Salvando…" : "Enviar Avaliação"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────────────

export default function HistoricoPage() {
  const [periodo,   setPeriodo]   = useState<PeriodoHistorico>("tudo");
  const [historico, setHistorico] = useState<ConsultaHistoricoResumo[]>([]);
  const [resumo,    setResumo]    = useState<HistoricoResumo | null>(null);
  const [timeline,  setTimeline]  = useState<TimelineItem[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [erro,      setErro]      = useState<string | null>(null);
  const [avalId,    setAvalId]    = useState<string | null>(null);

  const fetchDados = useCallback(async () => {
    setLoading(true); setErro(null);
    try {
      const [lista, res, tl] = await Promise.all([
        listarHistorico({ periodo }),
        resumoHistorico(),
        timelineHistorico(),
      ]);
      setHistorico(lista.data);
      setResumo(res);
      setTimeline(tl);
    } catch {
      setErro("Não foi possível carregar o histórico. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [periodo]);

  useEffect(() => { fetchDados(); }, [fetchDados]);

  const grupos = agruparPorMes(historico);
  const meses  = Object.keys(grupos).sort((a,b) => b.localeCompare(a));

  return (
    <>
      <style>{`
        @media(max-width:640px){.hist-mob{display:block!important}.hist-desk{display:none!important}}
        @media(min-width:641px){.hist-mob{display:none!important}.hist-desk{display:flex!important}}
        @media(max-width:640px){.hist-body{flex-direction:column!important}}
        @media(max-width:640px){.hist-lista{min-width:0!important;width:100%!important}}
        @media(max-width:640px){.hist-sidebar{min-width:0!important;width:100%!important}}
        *{box-sizing:border-box}
      `}</style>

      {/* Modal de Avaliação */}
      {avalId && (
        <AvaliacaoModal
          consultaId={avalId}
          onClose={() => setAvalId(null)}
          onSuccess={() => { setAvalId(null); fetchDados(); }}
        />
      )}

      <div style={{ flex:1, overflowY:"auto", backgroundColor:C.bg }}>
        <div style={{ padding:16, maxWidth:1100, margin:"0 auto", display:"flex", flexDirection:"column", gap:20, width:"100%" }} className="sm:p-6">

          {/* Cabeçalho */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12 }}>
            <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
              <h2 style={{ color:C.color12, fontSize:24, fontWeight:"bold", margin:0 }}>Histórico</h2>
              <span style={{ color:C.color11, fontSize:14 }}>Consultas realizadas, avaliações e linha do tempo.</span>
            </div>
            {/* Mobile dropdown */}
            <div className="hist-mob" style={{ display:"none", width:"100%" }}>
              <select value={periodo} onChange={e => setPeriodo(e.target.value as PeriodoHistorico)}
                style={{ width:"100%", background:C.color2, border:"1px solid rgba(16,185,129,0.4)", borderRadius:12, padding:"12px 16px", color:"#10b981", fontSize:14, fontWeight:"bold", fontFamily:"inherit", outline:"none", cursor:"pointer" }}>
                {PERIODOS.map(p => <option key={p.value} value={p.value} style={{ background:C.bg, color:"#fff" }}>{p.label}</option>)}
              </select>
            </div>
            {/* Desktop pills */}
            <div className="hist-desk" style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {PERIODOS.map(p => {
                const isActive = periodo === p.value;
                return (
                  <button key={p.value} id={`filter-periodo-${p.value}`} onClick={() => setPeriodo(p.value)}
                    style={{ padding:"6px 16px", borderRadius:999, border:`1px solid ${isActive?"#10b981":C.border}`, backgroundColor:isActive?"rgba(16,185,129,0.1)":"transparent", color:isActive?"#10b981":C.color11, fontSize:13, fontWeight:isActive?"bold":"400", cursor:"pointer", transition:"all .15s", fontFamily:"inherit" }}
                    onMouseEnter={e=>{if(!isActive){(e.currentTarget as HTMLElement).style.backgroundColor=C.color3;(e.currentTarget as HTMLElement).style.borderColor="#10b981";}}}
                    onMouseLeave={e=>{if(!isActive){(e.currentTarget as HTMLElement).style.backgroundColor="transparent";(e.currentTarget as HTMLElement).style.borderColor=C.border;}}}>
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Corpo */}
          <div className="hist-body" style={{ display:"flex", gap:20, alignItems:"flex-start" }}>

            {/* Lista */}
            <div className="hist-lista" style={{ flex:2, display:"flex", flexDirection:"column", gap:20, minWidth:280 }}>
              <h2 style={{ color:C.color12, fontSize:20, fontWeight:"bold", margin:0 }}>Consultas Realizadas</h2>

              {erro ? (
                <div style={{ border:"1px solid rgba(244,63,94,0.3)", backgroundColor:"rgba(244,63,94,0.06)", borderRadius:12, padding:32, display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
                  <span style={{ fontSize:32 }}>⚠️</span>
                  <span style={{ color:"#f43f5e", fontSize:14 }}>{erro}</span>
                  <button onClick={fetchDados} style={{ background:"#f43f5e", border:"none", borderRadius:8, color:"#fff", padding:"8px 20px", fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>
                    Tentar novamente
                  </button>
                </div>
              ) : loading ? (
                <div style={{ border:`1px solid ${C.border}`, backgroundColor:C.color2, borderRadius:12, padding:40, display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:32 }}>⏳</span>
                  <span style={{ color:C.color11, fontSize:14 }}>Carregando histórico…</span>
                </div>
              ) : historico.length === 0 ? (
                <div style={{ border:`1px solid ${C.border}`, backgroundColor:C.color2, borderRadius:12, padding:40, display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:32 }}>📭</span>
                  <span style={{ color:C.color11, fontSize:14 }}>Nenhuma consulta encontrada para este período.</span>
                </div>
              ) : (
                meses.map(mk => {
                  const items = grupos[mk];
                  return (
                    <div key={mk} style={{ display:"flex", flexDirection:"column", gap:12 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                        <span style={{ color:C.color11, fontSize:12, fontWeight:"bold", textTransform:"uppercase", letterSpacing:1, flexShrink:0 }}>{getMesLabel(mk)}</span>
                        <div style={{ flex:1, height:1, backgroundColor:C.border }} />
                        <span style={{ color:C.color10, fontSize:11, flexShrink:0 }}>{items.length} consulta{items.length !== 1 ? "s" : ""}</span>
                      </div>
                      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                        {items.map(c => <ConsultaCard key={c.id} c={c} onAvaliar={setAvalId} />)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Sidebar */}
            <div className="hist-sidebar" style={{ flex:1, display:"flex", flexDirection:"column", gap:16, minWidth:240 }}>

              {/* Linha do Tempo */}
              <HoverCard hoverBorder="#a78bfa">
                <div style={{ height:3, backgroundColor:"#a78bfa" }} />
                <div style={{ padding:16, display:"flex", flexDirection:"column", gap:16 }}>
                  <span style={{ color:C.color11, fontSize:11, fontWeight:"bold", letterSpacing:1, textTransform:"uppercase" }}>Linha do tempo</span>
                  <div>
                    {loading ? (
                      <span style={{ color:C.color10, fontSize:12 }}>Carregando…</span>
                    ) : timeline.length === 0 ? (
                      <span style={{ color:C.color10, fontSize:12 }}>Nenhum registro.</span>
                    ) : (
                      timeline.map((item, idx) => {
                        const isLast = idx === timeline.length - 1;
                        return (
                          <div key={item.id} style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", width:14, flexShrink:0, marginTop:4 }}>
                              <div style={{ width:10, height:10, borderRadius:"50%", border:`2px solid ${C.color2}`, backgroundColor:"#a78bfa", zIndex:2 }} />
                              {!isLast && <div style={{ width:2, height:38, backgroundColor:C.border, marginTop:-2, zIndex:1 }} />}
                            </div>
                            <div style={{ flex:1, paddingBottom:isLast?0:12 }}>
                              <span style={{ color:C.color10, fontSize:11, display:"block" }}>{isoToData(item.dataHora)}</span>
                              <span style={{ color:C.color12, fontSize:13, fontWeight:"500", display:"block" }}>
                                {item.especialidade} · {item.modalidade === "PRESENCIAL" ? "Presencial" : "Online"}
                              </span>
                              <span style={{ color:C.color11, fontSize:12, display:"block" }}>{item.profissionalNome}</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  <button id="btn-ver-historico-completo"
                    style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:4, width:"100%", padding:"10px 0", borderRadius:8, border:`1px solid ${C.border}`, background:"transparent", color:C.color11, fontSize:13, cursor:"pointer", fontFamily:"inherit", transition:"background .15s" }}
                    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                    onMouseEnter={e=>(e.currentTarget as HTMLElement).style.backgroundColor=C.color3}
                    onMouseLeave={e=>(e.currentTarget as HTMLElement).style.backgroundColor="transparent"}>
                    Ver histórico completo
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>
                </div>
              </HoverCard>

              {/* Resumo Geral */}
              <HoverCard hoverBorder="#10b981" style={{ padding:16 }}>
                <span style={{ color:C.color11, fontSize:11, fontWeight:"bold", letterSpacing:1, textTransform:"uppercase", display:"block", marginBottom:12 }}>Resumo Geral</span>
                {[
                  { label:"Total de consultas",    value: loading ? "—" : String(resumo?.totalConsultas ?? 0),                                     color:C.color12 },
                  { label:"Total investido",        value: loading ? "—" : `R$ ${parseFloat(resumo?.totalInvestidoReais ?? "0").toLocaleString("pt-BR")}`, color:"#10b981" },
                  { label:"Avaliações feitas",      value: loading ? "—" : String(resumo?.avaliacoesFeitasCount ?? 0),                              color:"#a78bfa" },
                  { label:"Pendentes de avaliação", value: loading ? "—" : String(resumo?.pendentesAvaliacao ?? 0),                                 color:"#facc15" },
                ].map((item, i, arr) => (
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:12, paddingBottom:12, borderBottom:i<arr.length-1?`1px solid ${C.border}`:"none" }}>
                    <span style={{ color:C.color11, fontSize:13 }}>{item.label}</span>
                    <span style={{ color:item.color, fontSize:14, fontWeight:"bold" }}>{item.value}</span>
                  </div>
                ))}
              </HoverCard>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
