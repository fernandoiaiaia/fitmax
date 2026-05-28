//@ts-nocheck
"use client";

import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { api } from "@/lib/api";

// Removed mock data

// ─── Icons ────────────────────────────────────────────────────────────────────

const CalIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
);
const TrendUpIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>
);
const MoneyIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
);
const CheckCircleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
);
const XCircleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
);
const ClockIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
);
const UserIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function useOutsideClick(ref: React.RefObject<HTMLElement>, cb: () => void) {
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) cb();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, cb]);
}

// Removed TODAY

function formatCurrency(val: number) {
  return `R$ ${val.toLocaleString("pt-BR")}`;
}

function formatDateBR(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

const C = { card:"#141414", card2:"#1a1a1a", border:"rgba(255,255,255,0.07)", bg:"#111111" };

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, accent = false }: { icon: React.ReactNode; label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className="stat-card" style={{ flex:1, minWidth:200, background:C.card, border:`1px solid ${accent ? "rgba(16,185,129,0.3)" : C.border}`, borderRadius:14, padding:16, cursor:"pointer", transition:"background .15s, border-color .15s" }}
      onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.background=C.card2; (e.currentTarget as HTMLElement).style.borderColor=accent ? "rgba(16,185,129,0.45)" : "rgba(16,185,129,0.3)"; }}
      onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.background=C.card;  (e.currentTarget as HTMLElement).style.borderColor=accent ? "rgba(16,185,129,0.3)" : C.border; }}
    >
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
        <div style={{ width:32, height:32, borderRadius:"50%", background:accent ? "rgba(16,185,129,0.15)" : C.card2, display:"flex", alignItems:"center", justifyContent:"center" }}>
          {icon}
        </div>
        <span style={{ color:"#a1a1aa", fontSize:12, fontWeight:"bold", textTransform:"uppercase" }}>{label}</span>
      </div>
      <span style={{ color:"#fafafa", fontSize:24, fontWeight:"bold", display:"block" }}>{value}</span>
      {sub && <span style={{ color:"#71717a", fontSize:11, marginTop:4, display:"block" }}>{sub}</span>}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const PRESETS = ["Hoje", "7 dias", "15 dias", "Mês", "Personalizado"];

export default function RelatoriosPage() {
  const today = new Date().toISOString().slice(0, 10);
  const firstOfMonth = `${today.slice(0,7)}-01`;

  const [preset, setPreset] = useState("Mês");
  const [dataInicio, setDataInicio] = useState(firstOfMonth);
  const [dataFim, setDataFim] = useState(today);

  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const headerMenuRef = useRef<HTMLDivElement>(null);
  useOutsideClick(headerMenuRef, useCallback(() => setHeaderMenuOpen(false), []));

  // Estado real da API
  const [kpis,         setKpis]         = useState<any>(null);
  const [diaData,      setDiaData]      = useState<any>(null);
  const [modalidadeData, setModalidadeData] = useState<any>(null);
  const [especialidadeData, setEspecialidadeData] = useState<any[]>([]);

  useEffect(() => {
    api.get(`/pro/relatorios/kpis?from=${dataInicio}&to=${dataFim}`).then(r => setKpis(r.data)).catch(() => {});
    api.get(`/pro/relatorios/dia`).then(r => setDiaData(r.data)).catch(() => {});
    api.get(`/pro/relatorios/modalidade?from=${dataInicio}&to=${dataFim}`).then(r => setModalidadeData(r.data)).catch(() => {});
    api.get(`/pro/relatorios/especialidade?from=${dataInicio}&to=${dataFim}`).then(r => setEspecialidadeData(r.data)).catch(() => {});
  }, [dataInicio, dataFim]);

  function applyPreset(p: string) {
    setPreset(p);
    const d = new Date();
    if (p === "Hoje") {
      setDataInicio(today); setDataFim(today);
    } else if (p === "7 dias") {
      const s = new Date(d); s.setDate(d.getDate() - 6);
      setDataInicio(s.toISOString().slice(0, 10)); setDataFim(today);
    } else if (p === "15 dias") {
      const s = new Date(d); s.setDate(d.getDate() - 14);
      setDataInicio(s.toISOString().slice(0, 10)); setDataFim(today);
    } else if (p === "Mês") {
      setDataInicio(firstOfMonth); setDataFim(today);
    }
  }

  // Valores derivados estritamente da API
  const faturamento      = kpis ? Number(kpis.faturamentoReais) : 0;
  const lucroLiquido     = kpis ? Number(kpis.lucroLiquidoReais) : 0;
  const ticketMedio      = kpis ? Number(kpis.ticketMedioReais) : 0;
  const taxaCancelamento = kpis ? kpis.taxaCancelamentoPct : 0;
  const totalRealizadas  = kpis ? kpis.totalRealizadas : 0;
  const totalCanceladas  = kpis ? kpis.totalCanceladas : 0;
  const totalPeriodo     = totalRealizadas + totalCanceladas;

  const hojeFeit  = diaData ? diaData.realizadas : 0;
  const hojeCanc  = diaData ? diaData.canceladas : 0;
  const hojeTotal = diaData ? diaData.total : 0;
  const hojeList = diaData?.consultas?.map((c: any) => ({
    id: c.id,
    horario: new Date(c.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    paciente: c.paciente?.nome || 'Desconhecido',
    especialidade: c.especialidade,
    modalidade: c.modalidade === 'PRESENCIAL' ? 'Presencial' : 'Online',
    valor: Number(c.valorReais),
    status: c.status
  })) ?? [];

  // Especialidade: API
  const porEspecialidadeAPI = especialidadeData.length > 0
    ? Object.fromEntries(especialidadeData.map((e: any) => [e.especialidade, Number(e.faturamento)]))
    : {};
  const maxEsp = Object.values(porEspecialidadeAPI).length > 0 ? Math.max(...Object.values(porEspecialidadeAPI) as number[]) : 1;

  // Modalidade: API
  const presencial = modalidadeData ? modalidadeData.presencial.total : 0;
  const online     = modalidadeData ? modalidadeData.online.total : 0;
  const totalMod   = presencial + online;

  return (
    <>
      <style>{`
        .rel-cols { display:flex; gap:20px; align-items:flex-start; flex-wrap:wrap; }
        .rel-col-left  { flex:2; min-width:280px; display:flex; flex-direction:column; gap:24px; }
        .rel-col-right { flex:1; min-width:260px; display:flex; flex-direction:column; gap:16px; }
        .period-pill {
          padding:6px 16px; border-radius:999px; border:1px solid;
          font-size:13px; cursor:pointer; font-family:inherit; transition:all .15s;
        }
        .rel-input-date {
          background:#111; border:1px solid ${C.border}; border-radius:8px;
          color:#fafafa; text-align:center; padding:6px 10px; font-size:14px;
          font-family:inherit; color-scheme:dark;
        }
        .sidebar-card {
          background:${C.card}; border:1px solid ${C.border}; border-radius:14px;
          padding:16px; cursor:pointer; transition:background .15s,border-color .15s;
        }
        .sidebar-card:hover { background:${C.card2}; border-color:rgba(16,185,129,0.45); }
      `}</style>
      <div style={{ flex:1, overflowY:"auto" }}>
        <div style={{ padding:"1.5rem 2rem", maxWidth:1200, margin:"0 auto", display:"flex", flexDirection:"column", gap:20, width:"100%" }}>
          
          {/* Cabeçalho */}
          <div className="pro-page-header" style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12 }}>
            <div>
              <h2 style={{ color:"#fafafa", fontSize:22, fontWeight:"bold", margin:0 }}>Relatórios</h2>
              <p style={{ color:"#a1a1aa", fontSize:14, margin:"4px 0 0" }}>Acompanhe o desempenho financeiro e operacional do período.</p>
            </div>
          </div>

          {/* Filtro de Período */}
          <div style={{ display:"flex", flexWrap:"wrap", gap:16, alignItems:"center", background:C.card, padding:12, borderRadius:14, border:`1px solid ${C.border}` }}>
            {/* Desktop Presets */}
            <div className="pro-filter-desktop" style={{ display:"flex", gap:8, flexWrap:"wrap", overflowX:"auto" }}>
              {PRESETS.map((p) => {
                const isActive = preset === p;
                return (
                  <button key={p} className="period-pill" onClick={()=>applyPreset(p)} style={{ borderColor:isActive?"#10b981":C.border, background:isActive?"rgba(16,185,129,0.1)":"transparent", color:isActive?"#10b981":"#a1a1aa", fontWeight:isActive?"bold":"500", whiteSpace:"nowrap" }}>{p}</button>
                );
              })}
            </div>

            {/* Mobile dropdown */}
            <div className="pro-filter-mobile" ref={headerMenuRef} style={{ position:"relative" }}>
              <button className="pro-filter-dropdown-btn" onClick={()=>setHeaderMenuOpen(v=>!v)}>
                Período: {preset}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform:headerMenuOpen?"rotate(180deg)":"rotate(0deg)", transition:"transform .2s" }}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              {headerMenuOpen && (
                <div className="pro-filter-dropdown-menu" style={{ left:0, right:"auto", minWidth:160 }}>
                  {PRESETS.map((p)=>(
                    <div key={p} className={`pro-filter-dropdown-item${preset===p?" active":""}`} onClick={()=>{applyPreset(p);setHeaderMenuOpen(false);}}>
                      {preset===p && <span style={{ marginRight:6 }}>✓</span>}{p}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pro-filter-sep" style={{ width:1, height:30, background:C.border }} />

            <div style={{ display:"flex", gap:12, alignItems:"center", flexWrap:"wrap" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ color:"#a1a1aa" }}><CalIcon /></span>
                <span style={{ color:"#a1a1aa", fontSize:12 }}>De</span>
                <input className="rel-input-date" type="date" value={dataInicio} max={dataFim} onChange={(e) => { setDataInicio(e.target.value); setPreset("Personalizado"); }} />
              </div>
              <span style={{ color:"#71717a" }}>—</span>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ color:"#a1a1aa" }}><CalIcon /></span>
                <span style={{ color:"#a1a1aa", fontSize:12 }}>Até</span>
                <input className="rel-input-date" type="date" value={dataFim} min={dataInicio} max={today} onChange={(e) => { setDataFim(e.target.value); setPreset("Personalizado"); }} />
              </div>
            </div>
          </div>

          {/* Grid principal */}
          <div className="rel-cols">
            
            {/* Coluna Esquerda */}
            <div className="rel-col-left">
              
              {/* Resumo Financeiro */}
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                <div>
                  <h2 style={{ color:"#fafafa", fontSize:20, fontWeight:"bold", margin:0 }}>Resumo Financeiro</h2>
                  <p style={{ color:"#a1a1aa", fontSize:12, margin:"4px 0 0" }}>{formatDateBR(dataInicio)} — {formatDateBR(dataFim)}</p>
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:12 }}>
                  <StatCard icon={<TrendUpIcon />} label="Faturamento Total" value={formatCurrency(faturamento)} sub={`${totalRealizadas} consultas realizadas`} accent />
                  <StatCard icon={<MoneyIcon />} label="Lucro Líquido" value={formatCurrency(lucroLiquido)} sub="72% do faturamento bruto" accent />
                  <StatCard icon={<CheckCircleIcon />} label="Ticket Médio" value={formatCurrency(ticketMedio)} sub="por consulta realizada" />
                  <StatCard icon={<XCircleIcon />} label="Taxa Cancelamento" value={`${taxaCancelamento}%`} sub={`${totalCanceladas} consultas canceladas`} />
                </div>
              </div>

              {/* Operação do Dia */}
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                <div>
                  <h2 style={{ color:"#fafafa", fontSize:20, fontWeight:"bold", margin:0 }}>Operação do Dia</h2>
                  <p style={{ color:"#a1a1aa", fontSize:12, margin:"4px 0 0" }}>Hoje, {formatDateBR(today)}</p>
                </div>

                <div style={{ display:"flex", flexWrap:"wrap", gap:12 }}>
                  <div style={{ flex:1, minWidth:200, background:"rgba(16,185,129,0.05)", border:"1px solid rgba(16,185,129,0.3)", borderRadius:14, padding:16, cursor:"pointer", transition:"all .15s" }}
                    onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.background="rgba(16,185,129,0.1)"; (e.currentTarget as HTMLElement).style.borderColor="#10b981"; }}
                    onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.background="rgba(16,185,129,0.05)"; (e.currentTarget as HTMLElement).style.borderColor="rgba(16,185,129,0.3)"; }}
                  >
                    <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
                      <div style={{ width:32, height:32, borderRadius:"50%", background:"rgba(16,185,129,0.15)", display:"flex", alignItems:"center", justifyContent:"center" }}><CheckCircleIcon /></div>
                      <span style={{ color:"#10b981", fontSize:13, fontWeight:"bold" }}>Realizadas</span>
                    </div>
                    <span style={{ color:"#10b981", fontSize:24, fontWeight:"bold", display:"block" }}>{hojeFeit}</span>
                    <span style={{ color:"rgba(16,185,129,0.8)", fontSize:11 }}>de {hojeTotal} agendadas</span>
                  </div>

                  <div style={{ flex:1, minWidth:200, background:"rgba(239,68,68,0.05)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:14, padding:16, cursor:"pointer", transition:"all .15s" }}
                    onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.background="rgba(239,68,68,0.1)"; (e.currentTarget as HTMLElement).style.borderColor="#ef4444"; }}
                    onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.background="rgba(239,68,68,0.05)"; (e.currentTarget as HTMLElement).style.borderColor="rgba(239,68,68,0.3)"; }}
                  >
                    <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
                      <div style={{ width:32, height:32, borderRadius:"50%", background:"rgba(239,68,68,0.15)", display:"flex", alignItems:"center", justifyContent:"center" }}><XCircleIcon /></div>
                      <span style={{ color:"#ef4444", fontSize:13, fontWeight:"bold" }}>Canceladas</span>
                    </div>
                    <span style={{ color:"#ef4444", fontSize:24, fontWeight:"bold", display:"block" }}>{hojeCanc}</span>
                    <span style={{ color:"rgba(239,68,68,0.8)", fontSize:11 }}>taxa: {hojeTotal > 0 ? Math.round((hojeCanc / hojeTotal) * 100) : 0}%</span>
                  </div>
                </div>

                {/* Lista do Dia */}
                {hojeTotal > 0 && (
                  <div className="sidebar-card" style={{ marginTop:8, padding:0, display:"flex", flexDirection:"column" }}>
                    {hojeList.map((c: any, i: number) => (
                      <div key={c.id} style={{ display:"flex", alignItems:"center", flexWrap:"wrap", gap:12, padding:12, borderBottom:i<hojeList.length-1?`1px solid ${C.border}`:"none" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, width:80 }}>
                           <span style={{ color:"#a1a1aa" }}><ClockIcon /></span>
                           <span style={{ color:"#fafafa", fontSize:13 }}>{c.horario}</span>
                        </div>
                        <div style={{ flex:1, minWidth:150, display:"flex", flexDirection:"column" }}>
                           <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                             <span style={{ color:"#a1a1aa" }}><UserIcon /></span>
                             <span style={{ color:"#fafafa", fontSize:14, fontWeight:"bold" }}>{c.paciente}</span>
                           </div>
                           <span style={{ color:"#a1a1aa", fontSize:12, marginLeft:21 }}>{c.especialidade} · {c.modalidade}</span>
                        </div>
                        <div style={{ display:"flex", alignItems:"center", gap:12, minWidth:120, justifyContent:"flex-end" }}>
                           <span style={{ color:"#fafafa", fontSize:14, fontWeight:"bold" }}>{formatCurrency(c.valor)}</span>
                           <span style={{ background:c.status==="realizada"?"rgba(16,185,129,0.12)":"rgba(239,68,68,0.12)", color:c.status==="realizada"?"#10b981":"#ef4444", fontSize:10, fontWeight:"bold", padding:"2px 8px", borderRadius:999 }}>
                             {c.status === "realizada" ? "Realizada" : "Cancelada"}
                           </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Coluna Direita (Sidebar) */}
            <div className="rel-col-right">
              
              {/* Especialidade */}
              <div className="sidebar-card">
                 <p style={{ color:"#a1a1aa", fontSize:11, fontWeight:"bold", letterSpacing:1, textTransform:"uppercase", margin:"0 0 16px" }}>Faturamento por Especialidade</p>
                 <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                   {Object.entries(porEspecialidadeAPI).sort(([, a], [, b]) => (b as number) - (a as number)).map(([esp, val]) => (
                     <div key={esp} style={{ display:"flex", flexDirection:"column", gap:4 }}>
                       <div style={{ display:"flex", justifyContent:"space-between" }}>
                         <span style={{ color:"#fafafa", fontSize:13 }}>{esp}</span>
                         <span style={{ color:"#fafafa", fontSize:13, fontWeight:"bold" }}>{formatCurrency(val)}</span>
                       </div>
                       <div style={{ height:6, background:C.card2, borderRadius:999, overflow:"hidden" }}>
                         <div style={{ height:"100%", background:"#10b981", width:`${Math.min((val / maxEsp) * 100, 100)}%` }} />
                       </div>
                     </div>
                   ))}
                 </div>
              </div>

              {/* Modalidade */}
              <div className="sidebar-card">
                 <p style={{ color:"#a1a1aa", fontSize:11, fontWeight:"bold", letterSpacing:1, textTransform:"uppercase", margin:"0 0 16px" }}>Modalidade de Atendimento</p>
                 <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
                    <div style={{ display:"flex", flexDirection:"column" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}><span style={{ width:8, height:8, borderRadius:"50%", background:"#10b981" }} /><span style={{ color:"#a1a1aa", fontSize:12 }}>Presencial</span></div>
                      <span style={{ color:"#fafafa", fontSize:18, fontWeight:"bold" }}>{presencial}</span>
                      <span style={{ color:"#71717a", fontSize:11 }}>{totalMod > 0 ? Math.round((presencial / totalMod) * 100) : 0}%</span>
                    </div>
                    <div style={{ display:"flex", flexDirection:"column" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}><span style={{ width:8, height:8, borderRadius:"50%", background:"#60a5fa" }} /><span style={{ color:"#a1a1aa", fontSize:12 }}>Online</span></div>
                      <span style={{ color:"#fafafa", fontSize:18, fontWeight:"bold" }}>{online}</span>
                      <span style={{ color:"#71717a", fontSize:11 }}>{totalMod > 0 ? Math.round((online / totalMod) * 100) : 0}%</span>
                    </div>
                 </div>
                 <div style={{ display:"flex", height:8, borderRadius:999, overflow:"hidden", width:"100%" }}>
                   <div style={{ height:"100%", background:"#10b981", width:`${totalMod > 0 ? (presencial / totalMod) * 100 : 50}%` }} />
                   <div style={{ height:"100%", background:"#60a5fa", width:`${totalMod > 0 ? (online / totalMod) * 100 : 50}%` }} />
                 </div>
              </div>

              {/* Resumo */}
              <div className="sidebar-card">
                 <p style={{ color:"#a1a1aa", fontSize:11, fontWeight:"bold", letterSpacing:1, textTransform:"uppercase", margin:"0 0 12px" }}>Período Selecionado</p>
                 <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                   {[
                     { label: "Consultas no período", value: String(totalPeriodo), color: "#fafafa" },
                     { label: "Realizadas", value: String(totalRealizadas), color: "#10b981" },
                     { label: "Canceladas", value: String(totalCanceladas), color: "#f87171" },
                     { label: "Faturamento bruto", value: formatCurrency(faturamento), color: "#10b981" },
                     { label: "Lucro líquido", value: formatCurrency(lucroLiquido), color: "#10b981" },
                   ].map((item, i) => (
                     <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:i<4?`1px solid ${C.border}`:"none" }}>
                       <span style={{ color:"#a1a1aa", fontSize:13 }}>{item.label}</span>
                       <span style={{ color:item.color, fontSize:13, fontWeight:"bold" }}>{item.value}</span>
                     </div>
                   ))}
                 </div>
              </div>

            </div>

          </div>
        </div>
      </div>
    </>
  );
}
