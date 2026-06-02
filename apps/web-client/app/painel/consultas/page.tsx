//@ts-nocheck
"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { listarConsultas, statsConsultas } from "../../../lib/consultas-api";
import type { ConsultaStats } from "../../../lib/consultas-api";

type ConsultaStatus = "agendada" | "pendente" | "a_confirmar" | "em_andamento" | "cancelada" | "concluida" | "ausente";
interface Consulta {
  id: string; horario: string; nome: string; especialidade: string;
  modalidade: "Presencial" | "Online"; dataISO: string; data: string;
  avatar: string; status: ConsultaStatus;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
// App é Brazil-only (America/Sao_Paulo = UTC-3, sem DST desde 2019).
// Todas as datas vêm da API como UTC ISO → precisam converter para exibição local.
const TZ = 'America/Sao_Paulo';

function isoToHorario(isoDate: string): string {
  return new Date(isoDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: TZ });
}

function isoToDataISO(isoDate: string): string {
  // Converte UTC → data local BRT: "2026-05-29T20:00:00Z" → "2026-05-29" (não "2026-05-30")
  const s = new Date(isoDate).toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: TZ });
  const [d, m, y] = s.split('/');
  return `${y}-${m}-${d}`;
}

function formatDataLabel(isoDate: string): string {
  const datePart = isoToDataISO(isoDate);
  const [, m, d] = datePart.split('-');
  const fmt = `${d}/${m}`;
  const now = new Date();
  const today    = isoToDataISO(now.toISOString());
  const tomorrow = isoToDataISO(new Date(now.getTime() + 86400000).toISOString());
  if (datePart === today)    return `Hoje, ${fmt}`;
  if (datePart === tomorrow) return `Amanhã, ${fmt}`;
  return fmt;
}

function mapStatusFluxo(statusFluxo: string): ConsultaStatus {
  const map: Record<string, ConsultaStatus> = {
    pagamento_pendente:  "pendente",
    consulta_confirmada: "agendada",
    consulta_cancelada:  "cancelada",
    consulta_concluida:  "concluida",
    consulta_ausente:    "ausente",   // cliente não compareceu
  };
  return map[statusFluxo] ?? "a_confirmar";
}

const C = { bg:"#111111", color2:"#1a1a1a", color3:"#222222", color11:"#a1a1aa", color12:"#fafafa", border:"#27272a" };

const statusConfig = {
  agendada:     { label:"AGENDADA",     bg:"rgba(16,185,129,0.12)",  color:"#10b981", dotColor:"#10b981" },
  pendente:     { label:"PENDENTE",     bg:"rgba(234,179,8,0.12)",   color:"#facc15", dotColor:"#facc15" },
  a_confirmar:  { label:"A CONFIRMAR",  bg:"rgba(161,161,170,0.1)",  color:"#a1a1aa", dotColor:"#a1a1aa" },
  em_andamento: { label:"EM ANDAMENTO", bg:"rgba(96,165,250,0.12)",  color:"#60a5fa", dotColor:"#60a5fa" },
  cancelada:    { label:"CANCELADA",    bg:"rgba(244,63,94,0.12)",   color:"#f43f5e", dotColor:"#f43f5e" },
  concluida:    { label:"CONCLUÍDA",    bg:"rgba(139,92,246,0.12)",  color:"#8b5cf6", dotColor:"#8b5cf6" },
  ausente:      { label:"AUSENTE",      bg:"rgba(251,146,60,0.12)",  color:"#fb923c", dotColor:"#fb923c" },
};

function useOutsideClick(ref: React.RefObject<HTMLElement>, cb: ()=>void) {
  useEffect(()=>{
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) cb(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [ref, cb]);
}

const BANNER_CSS = `
  @keyframes calPulse { 0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,0.5)}50%{box-shadow:0 0 0 10px rgba(16,185,129,0)} }
  .agendar-banner{position:relative;overflow:hidden;border-radius:16px;border:1px solid rgba(16,185,129,0.35);background:linear-gradient(135deg,rgba(16,185,129,0.13),rgba(96,165,250,0.07));padding:20px 24px;display:flex;align-items:center;gap:20px;cursor:pointer;transition:border-color .2s,background .2s,transform .15s}
  .agendar-banner::before{content:'';position:absolute;inset:0;background:linear-gradient(90deg,rgba(16,185,129,0.06),transparent 60%);pointer-events:none}
  .agendar-banner:hover{border-color:rgba(16,185,129,0.65);transform:translateY(-1px)}
  .agendar-banner-icon{width:52px;height:52px;border-radius:14px;background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.35);display:flex;align-items:center;justify-content:center;flex-shrink:0;animation:calPulse 2.4s ease-in-out infinite}
  .agendar-banner-btn{flex-shrink:0;display:flex;align-items:center;gap:8px;background:#10b981;border:none;border-radius:40px;padding:10px 20px;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;transition:background .2s,transform .15s;white-space:nowrap}
  .agendar-banner-btn:hover{background:#0ea370;transform:scale(1.03)}
  .cons-card{cursor:pointer;transition:box-shadow .18s,transform .15s}
  .cons-card:hover{transform:translateY(-1px);box-shadow:0 4px 24px rgba(16,185,129,0.1)}
  .cons-card:hover .cons-card-inner{background-color:#222;border-color:#10b981}
  .cons-arrow{color:#52525b;transition:color .15s,transform .15s;flex-shrink:0}
  .cons-card:hover .cons-arrow{color:#10b981;transform:translateX(3px)}
  @media(max-width:600px){
    .agendar-banner{flex-wrap:wrap;gap:14px}
    .agendar-banner-btn{width:100%;justify-content:center}
    .cons-row{flex-wrap:wrap!important;gap:10px!important}
    .cons-row-actions{width:100%!important;justify-content:flex-end!important;padding-top:8px!important;border-top:1px dashed rgba(255,255,255,0.08)!important}
    .cons-sep{display:none!important}
    .resumo-cols{flex-direction:column!important;gap:12px!important}
    .resumo-sep{display:none!important}
  }
`;

function ConsultaRow({ c }: { c: Consulta }) {
  const cfg = statusConfig[c.status];
  const isAndamento = c.status === "em_andamento";
  const router = useRouter();

  return (
    <div className="cons-card" id={`row-${c.id}`} onClick={()=>{
      const p = new URLSearchParams({ id:String(c.id), nome:c.nome, especialidade:c.especialidade, data:c.data, horario:c.horario, modalidade:c.modalidade, status:c.status, avatar:c.avatar });
      router.push(`/painel/consultas/agendar?${p}`);
    }}>
      <div className="cons-card-inner" style={{
        border:`1px solid ${isAndamento?"rgba(96,165,250,0.25)":C.border}`,
        backgroundColor:isAndamento?"rgba(96,165,250,0.05)":C.color2,
        borderRadius:10, paddingLeft:12, paddingRight:12, paddingTop:12, paddingBottom:12,
        transition:"background .15s, border-color .15s",
      }}>
        <div className="cons-row" style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"nowrap" }}>
          {/* Horário */}
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", width:44, flexShrink:0 }}>
            <span style={{ color:isAndamento?"#60a5fa":C.color11, fontSize:12, fontWeight:"bold" }}>{c.horario}</span>
            {isAndamento && <div style={{ width:6, height:6, borderRadius:"50%", backgroundColor:"#60a5fa", marginTop:4, boxShadow:"0 0 6px #60a5fa" }} />}
          </div>
          {/* Sep */}
          <div className="cons-sep" style={{ width:1, height:36, backgroundColor:C.border, flexShrink:0 }} />
          {/* Avatar */}
          <img src={c.avatar} style={{ width:36, height:36, borderRadius:"50%", objectFit:"cover", flexShrink:0 }} alt="" />
          {/* Info */}
          <div style={{ flex:1, display:"flex", flexDirection:"column", gap:4, minWidth:0 }}>
            <span style={{ color:C.color12, fontSize:13, fontWeight:"bold", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.nome}</span>
            <div style={{ display:"flex", alignItems:"center", gap:4, flexWrap:"wrap" }}>
              <span style={{ color:C.color11, fontSize:11 }}>{c.especialidade}</span>
              <div style={{ width:3, height:3, borderRadius:"50%", backgroundColor:"#52525b" }} />
              <span style={{ color:C.color11, fontSize:11 }}>{c.modalidade}</span>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:4 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span style={{ color:"#71717a", fontSize:10 }}>{c.data}</span>
            </div>
          </div>
          {/* Actions */}
          <div className="cons-row-actions" style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
            <div style={{ background:cfg.bg, borderRadius:999, paddingLeft:10, paddingRight:10, paddingTop:3, paddingBottom:3, border:`1px solid ${cfg.color}44` }}>
              <span style={{ color:cfg.color, fontSize:9, fontWeight:"bold" }}>{cfg.label}</span>
            </div>
            <span className="cons-arrow">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConsultasPage() {
  const router = useRouter();
  
  // Datas padrão: hoje até hoje + 30 dias
  const [dateFrom, setDateFrom] = useState(() => new Date().toISOString().substring(0, 10));
  const [dateTo,   setDateTo]   = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().substring(0, 10);
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const dateRef = useRef(null);
  useOutsideClick(dateRef, () => setShowDatePicker(false));

  // ── Estado da API ────────────────────────────────────────────────────────────
  const [consultas, setConsultas]   = useState([]);
  const [stats, setStats]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [erro, setErro]             = useState(null);
  const [search, setSearch]         = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce para busca
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchDados = useCallback(async () => {
    setLoading(true); setErro(null);
    try {
      const [listaRes, statsRes] = await Promise.all([
        listarConsultas({ dateFrom, dateTo, search: debouncedSearch }),
        statsConsultas({ dateFrom, dateTo }),
      ]);
      // Mapeia dados da API para o formato da UI
      const mapped = listaRes.data
        .map(c => ({
          id:          c.id,
          horario:     isoToHorario(c.dataHora),
          nome:        c.profissional.name,
          especialidade: c.especialidade,
          modalidade:  c.tipo === "PRESENCIAL" ? "Presencial" : "Online",
          dataISO:     isoToDataISO(c.dataHora),
          data:        formatDataLabel(c.dataHora),
          avatar:      c.profissional.avatarUrl ?? `https://picsum.photos/200/200?random=${c.id.charCodeAt(0)}`,
          status:      mapStatusFluxo(c.statusFluxo),
        }));
      setConsultas(mapped);
      setStats(statsRes);
    } catch (e) {
      setErro("Não foi possível carregar as consultas. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, debouncedSearch]);

  useEffect(() => { fetchDados(); }, [fetchDados]);

  // Não filtra localmente — a API já filtra por período
  const filtered = consultas;

  const fmtDate = (iso) => { const [y,m,d] = iso.split("-"); return `${d}/${m}/${y}`; };

  return (
    <>
      <style>{BANNER_CSS}</style>
      <div style={{ flex:1, overflowY:"auto", backgroundColor:C.bg }}>
        <div style={{ padding:"12px", maxWidth:1100, margin:"0 auto", display:"flex", flexDirection:"column", gap:20, width:"100%" }}
          className="sm:p-5 md:p-6">

          {/* Banner CTA */}
          <div id="banner-agendar-consulta" className="agendar-banner" onClick={()=>router.push("/painel/consultas/agendar")}>
            <div className="agendar-banner-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="m9 16 2 2 4-4"/>
              </svg>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontSize:16, fontWeight:700, color:C.color12, margin:"0 0 4px", overflow:"hidden", textOverflow:"ellipsis" }}>Agendar Nova Consulta</p>
              <p style={{ fontSize:13, color:"#71717a", margin:0 }}>Encontre o profissional ideal e escolha o horário que preferir</p>
            </div>
            <button className="agendar-banner-btn" onClick={e=>{e.stopPropagation();router.push("/painel/consultas/agendar");}}>
              Agendar Agora
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
          </div>

          {/* Cabeçalho */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12 }}>
            <div style={{ display:"flex", flexDirection:"column", gap:4, flex:1, minWidth:0 }}>
              <h2 style={{ color:C.color12, fontSize:20, fontWeight:"bold", margin:0 }}>Consultas</h2>
              <span style={{ color:C.color11, fontSize:14 }}>Gerencie seus agendamentos e acompanhe o status de cada consulta</span>
            </div>
            
            <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
              {/* Input de Busca */}
              <div style={{ position:"relative", display:"flex", alignItems:"center" }}>
                <input
                  id="search-consultas"
                  type="text"
                  placeholder="Buscar por profissional..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{
                    background: C.color2,
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    color: "#fff",
                    padding: "6px 12px 6px 32px",
                    fontSize: 12,
                    width: 200,
                    outline: "none",
                    transition: "border-color .15s"
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = "#10b981"}
                  onBlur={e => e.currentTarget.style.borderColor = C.border}
                />
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={C.color11}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ position: "absolute", left: 10, pointerEvents: "none" }}
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>

              <div ref={dateRef} style={{ position:"relative" }}>
                <button id="btn-filtro-periodo" onClick={()=>setShowDatePicker(v=>!v)} style={{
                  display:"flex", alignItems:"center", gap:8, padding:"6px 12px", borderRadius:8,
                  border:`1px solid ${showDatePicker?"#10b981":C.border}`, backgroundColor:C.color2,
                  cursor:"pointer", transition:"border-color .15s", color:C.color11, fontSize:12,
                }}
                onMouseEnter={e=>(e.currentTarget as HTMLElement).style.backgroundColor=C.color3}
                onMouseLeave={e=>(e.currentTarget as HTMLElement).style.backgroundColor=C.color2}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <span>{fmtDate(dateFrom)} — {fmtDate(dateTo)}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              {showDatePicker && (
                <div style={{ position:"absolute", top:"calc(100% + 8px)", right:0, zIndex:100, background:"#1a1a1a", border:`1px solid ${C.border}`, borderRadius:12, padding:16, minWidth:240, boxShadow:"0 8px 32px rgba(0,0,0,0.4)" }}>
                  <div style={{ marginBottom:12 }}>
                    <label style={{ color:C.color11, fontSize:11, fontWeight:600, letterSpacing:0.5, textTransform:"uppercase", marginBottom:4, display:"block" }}>Data inicial</label>
                    <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} style={{ background:"#222", border:`1px solid ${C.border}`, borderRadius:8, color:"#fff", padding:"6px 10px", fontSize:13, width:"100%", outline:"none", colorScheme:"dark" }} />
                  </div>
                  <div style={{ marginBottom:16 }}>
                    <label style={{ color:C.color11, fontSize:11, fontWeight:600, letterSpacing:0.5, textTransform:"uppercase", marginBottom:4, display:"block" }}>Data final</label>
                    <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} style={{ background:"#222", border:`1px solid ${C.border}`, borderRadius:8, color:"#fff", padding:"6px 10px", fontSize:13, width:"100%", outline:"none", colorScheme:"dark" }} />
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={()=>{setDateFrom("2026-04-22");setDateTo("2026-05-22");}} style={{ flex:1, padding:"6px 0", borderRadius:8, fontSize:12, fontWeight:600, background:"transparent", border:`1px solid ${C.border}`, color:C.color11, cursor:"pointer" }}>Resetar</button>
                    <button onClick={()=>setShowDatePicker(false)} style={{ flex:1, padding:"6px 0", borderRadius:8, fontSize:12, fontWeight:600, background:"#10b981", border:"none", color:"#fff", cursor:"pointer" }}>Aplicar</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

          {/* Cards de Resumo */}
          <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
            {/* Resumo do Período */}
            <div style={{ flex:1, minWidth:0, border:`1px solid ${C.border}`, backgroundColor:C.color2, borderRadius:12, padding:16, cursor:"pointer", transition:"background .15s, border-color .15s" }}
              onMouseEnter={e=>{(e.currentTarget).style.backgroundColor=C.color3;(e.currentTarget).style.borderColor="#10b981";}}
              onMouseLeave={e=>{(e.currentTarget).style.backgroundColor=C.color2;(e.currentTarget).style.borderColor=C.border;}}>
              <p style={{ color:C.color11, fontSize:11, fontWeight:700, letterSpacing:1, textTransform:"uppercase", margin:"0 0 12px" }}>Resumo do Período</p>
              <div className="resumo-cols" style={{ display:"flex", gap:16 }}>
                <div style={{ flex:1, display:"flex", flexDirection:"column", gap:8 }}>
                  <div style={{ width:32, height:32, borderRadius:"50%", backgroundColor:"rgba(16,185,129,0.12)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                  </div>
                  <span style={{ color:C.color11, fontSize:12 }}>Consultas</span>
                  <span style={{ color:C.color12, fontSize:22, fontWeight:"bold" }}>{loading ? "—" : (stats?.totalConsultas ?? filtered.length)}</span>
                  <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                    <div style={{ width:6, height:6, borderRadius:"50%", backgroundColor:"#10b981" }} />
                    <span style={{ color:"#10b981", fontSize:11 }}>no período selecionado</span>
                  </div>
                </div>
                <div className="resumo-sep" style={{ width:1, backgroundColor:C.border }} />
                <div style={{ flex:1, display:"flex", flexDirection:"column", gap:8 }}>
                  <div style={{ width:32, height:32, borderRadius:"50%", backgroundColor:"rgba(16,185,129,0.12)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  </div>
                  <span style={{ color:C.color11, fontSize:12 }}>Valor Investido</span>
                  <span style={{ color:C.color12, fontSize:22, fontWeight:"bold" }}>{loading ? "—" : `R$${stats?.totalInvestidoReais ?? "0.00"}`}</span>
                  <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                    <div style={{ width:6, height:6, borderRadius:"50%", backgroundColor:"#10b981" }} />
                    <span style={{ color:"#10b981", fontSize:11 }}>no período selecionado</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Visão Geral do Dia */}
            <div style={{ flex:1, minWidth:0, border:`1px solid ${C.border}`, backgroundColor:C.color2, borderRadius:12, padding:16, cursor:"pointer", transition:"background .15s, border-color .15s" }}
              onMouseEnter={e=>{(e.currentTarget).style.backgroundColor=C.color3;(e.currentTarget).style.borderColor="#10b981";}}
              onMouseLeave={e=>{(e.currentTarget).style.backgroundColor=C.color2;(e.currentTarget).style.borderColor=C.border;}}>
              <p style={{ color:C.color11, fontSize:11, fontWeight:700, letterSpacing:1, textTransform:"uppercase", margin:"0 0 12px" }}>Visão Geral do Dia</p>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {[
                  { icon:"📅", label:"Consultas",  value: loading ? "—" : String(stats?.consultasHoje ?? 0),  color:C.color12 },
                  { icon:"✅", label:"Confirmadas", value: loading ? "—" : String(stats?.confirmadas ?? 0),   color:"#10b981" },
                  { icon:"⏳", label:"Pendentes",   value: loading ? "—" : String(stats?.pendentes ?? 0),     color:"#facc15" },
                  { icon:"⏱",  label:"Próxima em",  value: loading ? "—" : (stats?.proximaEm ?? "—"),         color:"#60a5fa" },
                ].map((item,i)=>(
                  <div key={i} id={`day-item-${i}`} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:6, paddingBottom:6, paddingLeft:8, paddingRight:8, borderRadius:8, backgroundColor:C.bg, border:`1px solid ${C.border}` }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <span style={{ fontSize:14 }}>{item.icon}</span>
                      <span style={{ color:C.color11, fontSize:13 }}>{item.label}</span>
                    </div>
                    <span style={{ color:item.color, fontSize:14, fontWeight:"bold" }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Lista de Consultas */}
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <h2 style={{ color:C.color12, fontSize:20, fontWeight:"bold", margin:0 }}>Próximas Consultas</h2>
                <span style={{ color:C.color11, fontSize:12 }}>{loading ? "Carregando…" : `${filtered.length} consultas encontradas`}</span>
              </div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {erro ? (
                <div style={{ border:`1px solid rgba(244,63,94,0.3)`, backgroundColor:"rgba(244,63,94,0.06)", borderRadius:12, padding:32, display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:32 }}>⚠️</span>
                  <span style={{ color:"#f43f5e", fontSize:14 }}>{erro}</span>
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ border:`1px solid ${C.border}`, backgroundColor:C.color2, borderRadius:12, padding:32, display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:32 }}>{loading ? "⏳" : "📭"}</span>
                  <span style={{ color:C.color11, fontSize:14 }}>{loading ? "Carregando consultas…" : "Nenhuma consulta encontrada para este filtro."}</span>
                </div>
              ) : (
                filtered.map(c => <ConsultaRow key={c.id} c={c} />)
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
