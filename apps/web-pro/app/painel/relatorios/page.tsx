//@ts-nocheck
"use client";

import { useRef, useState, useEffect, useCallback, useMemo } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ConsultaDia {
  id: number;
  data: string;       // "YYYY-MM-DD"
  horario: string;
  paciente: string;
  especialidade: string;
  modalidade: "Presencial" | "Online";
  valor: number;
  status: "realizada" | "cancelada";
}

// ─── Mock Data — consultas do mês ────────────────────────────────────────────

const consultasMock: ConsultaDia[] = [
  { id: 1,  data: "2026-04-23", horario: "09:00", paciente: "Fernanda Lima",     especialidade: "Cardiologia",        modalidade: "Presencial", valor: 350, status: "realizada" },
  { id: 2,  data: "2026-04-23", horario: "11:00", paciente: "Guilherme Augusto", especialidade: "Cardiologia",        modalidade: "Presencial", valor: 350, status: "realizada" },
  { id: 3,  data: "2026-04-23", horario: "13:00", paciente: "Mariana Ferreira",  especialidade: "Cardiologia",        modalidade: "Online",     valor: 280, status: "cancelada" },
  { id: 4,  data: "2026-04-23", horario: "15:30", paciente: "Ricardo Nunes",     especialidade: "Check-up Cardíaco",  modalidade: "Presencial", valor: 420, status: "realizada" },
  { id: 5,  data: "2026-04-22", horario: "09:00", paciente: "Beatriz Santos",    especialidade: "Cardiologia",        modalidade: "Online",     valor: 280, status: "realizada" },
  { id: 6,  data: "2026-04-22", horario: "11:30", paciente: "Carlos Eduardo",    especialidade: "Avaliação Cardíaca", modalidade: "Presencial", valor: 500, status: "realizada" },
  { id: 7,  data: "2026-04-21", horario: "10:00", paciente: "Lucas Mendes",      especialidade: "Check-up",           modalidade: "Presencial", valor: 420, status: "cancelada" },
  { id: 8,  data: "2026-04-20", horario: "14:00", paciente: "Ana Paula Ramos",   especialidade: "Cardiologia",        modalidade: "Online",     valor: 280, status: "realizada" },
  { id: 9,  data: "2026-04-19", horario: "09:30", paciente: "Thiago Oliveira",   especialidade: "Cardiologia",        modalidade: "Presencial", valor: 350, status: "realizada" },
  { id: 10, data: "2026-04-18", horario: "16:00", paciente: "Camila Torres",     especialidade: "Avaliação Cardíaca", modalidade: "Presencial", valor: 500, status: "realizada" },
  { id: 11, data: "2026-04-17", horario: "08:30", paciente: "Paulo Ramos",       especialidade: "Cardiologia",        modalidade: "Presencial", valor: 350, status: "realizada" },
  { id: 12, data: "2026-04-16", horario: "10:00", paciente: "Sofia Mendes",      especialidade: "Cardiologia",        modalidade: "Online",     valor: 280, status: "cancelada" },
  { id: 13, data: "2026-04-15", horario: "14:30", paciente: "Roberto Lima",      especialidade: "Check-up Cardíaco",  modalidade: "Presencial", valor: 420, status: "realizada" },
  { id: 14, data: "2026-04-14", horario: "11:00", paciente: "Lara Cardoso",      especialidade: "Cardiologia",        modalidade: "Online",     valor: 280, status: "realizada" },
  { id: 15, data: "2026-04-10", horario: "09:00", paciente: "Diego Souza",       especialidade: "Avaliação Cardíaca", modalidade: "Presencial", valor: 500, status: "realizada" },
];

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

const TODAY = "2026-04-23";

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
  const [preset, setPreset] = useState("Mês");
  const [dataInicio, setDataInicio] = useState("2026-04-01");
  const [dataFim, setDataFim] = useState(TODAY);

  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const headerMenuRef = useRef<HTMLDivElement>(null);
  useOutsideClick(headerMenuRef, useCallback(() => setHeaderMenuOpen(false), []));

  function applyPreset(p: string) {
    setPreset(p);
    const today = new Date(TODAY);
    if (p === "Hoje") {
      setDataInicio(TODAY); setDataFim(TODAY);
    } else if (p === "7 dias") {
      const d = new Date(today); d.setDate(d.getDate() - 6);
      setDataInicio(d.toISOString().slice(0, 10)); setDataFim(TODAY);
    } else if (p === "15 dias") {
      const d = new Date(today); d.setDate(d.getDate() - 14);
      setDataInicio(d.toISOString().slice(0, 10)); setDataFim(TODAY);
    } else if (p === "Mês") {
      setDataInicio("2026-04-01"); setDataFim(TODAY);
    }
  }

  const filtered = useMemo(() =>
    consultasMock.filter((c) => c.data >= dataInicio && c.data <= dataFim),
    [dataInicio, dataFim]
  );

  const realizadas   = filtered.filter((c) => c.status === "realizada");
  const canceladas   = filtered.filter((c) => c.status === "cancelada");
  const faturamento  = realizadas.reduce((s, c) => s + c.valor, 0);
  const lucroLiquido = Math.round(faturamento * 0.72);
  const ticketMedio  = realizadas.length > 0 ? Math.round(faturamento / realizadas.length) : 0;
  const taxaCancelamento = filtered.length > 0 ? Math.round((canceladas.length / filtered.length) * 100) : 0;

  const hoje         = consultasMock.filter((c) => c.data === TODAY);
  const hojeFeit     = hoje.filter((c) => c.status === "realizada");
  const hojeCanc     = hoje.filter((c) => c.status === "cancelada");

  const porEspecialidade = realizadas.reduce<Record<string, number>>((acc, c) => {
    acc[c.especialidade] = (acc[c.especialidade] ?? 0) + c.valor;
    return acc;
  }, {});
  const maxEsp = Math.max(...Object.values(porEspecialidade), 1);

  const presencial = realizadas.filter((c) => c.modalidade === "Presencial").length;
  const online     = realizadas.filter((c) => c.modalidade === "Online").length;
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
                <input className="rel-input-date" type="date" value={dataFim} min={dataInicio} max={TODAY} onChange={(e) => { setDataFim(e.target.value); setPreset("Personalizado"); }} />
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
                  <StatCard icon={<TrendUpIcon />} label="Faturamento Total" value={formatCurrency(faturamento)} sub={`${realizadas.length} consultas realizadas`} accent />
                  <StatCard icon={<MoneyIcon />} label="Lucro Líquido" value={formatCurrency(lucroLiquido)} sub="72% do faturamento bruto" accent />
                  <StatCard icon={<CheckCircleIcon />} label="Ticket Médio" value={formatCurrency(ticketMedio)} sub="por consulta realizada" />
                  <StatCard icon={<XCircleIcon />} label="Taxa Cancelamento" value={`${taxaCancelamento}%`} sub={`${canceladas.length} consultas canceladas`} />
                </div>
              </div>

              {/* Operação do Dia */}
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                <div>
                  <h2 style={{ color:"#fafafa", fontSize:20, fontWeight:"bold", margin:0 }}>Operação do Dia</h2>
                  <p style={{ color:"#a1a1aa", fontSize:12, margin:"4px 0 0" }}>Hoje, {formatDateBR(TODAY)}</p>
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
                    <span style={{ color:"#10b981", fontSize:24, fontWeight:"bold", display:"block" }}>{hojeFeit.length}</span>
                    <span style={{ color:"rgba(16,185,129,0.8)", fontSize:11 }}>de {hoje.length} agendadas</span>
                  </div>

                  <div style={{ flex:1, minWidth:200, background:"rgba(239,68,68,0.05)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:14, padding:16, cursor:"pointer", transition:"all .15s" }}
                    onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.background="rgba(239,68,68,0.1)"; (e.currentTarget as HTMLElement).style.borderColor="#ef4444"; }}
                    onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.background="rgba(239,68,68,0.05)"; (e.currentTarget as HTMLElement).style.borderColor="rgba(239,68,68,0.3)"; }}
                  >
                    <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
                      <div style={{ width:32, height:32, borderRadius:"50%", background:"rgba(239,68,68,0.15)", display:"flex", alignItems:"center", justifyContent:"center" }}><XCircleIcon /></div>
                      <span style={{ color:"#ef4444", fontSize:13, fontWeight:"bold" }}>Canceladas</span>
                    </div>
                    <span style={{ color:"#ef4444", fontSize:24, fontWeight:"bold", display:"block" }}>{hojeCanc.length}</span>
                    <span style={{ color:"rgba(239,68,68,0.8)", fontSize:11 }}>taxa: {hoje.length > 0 ? Math.round((hojeCanc.length / hoje.length) * 100) : 0}%</span>
                  </div>
                </div>

                {/* Lista do Dia */}
                {hoje.length > 0 && (
                  <div className="sidebar-card" style={{ marginTop:8, padding:0, display:"flex", flexDirection:"column" }}>
                    {hoje.map((c, i) => (
                      <div key={c.id} style={{ display:"flex", alignItems:"center", flexWrap:"wrap", gap:12, padding:12, borderBottom:i<hoje.length-1?`1px solid ${C.border}`:"none" }}>
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
                   {Object.entries(porEspecialidade).sort(([, a], [, b]) => b - a).map(([esp, val]) => (
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
                     { label: "Consultas no período", value: String(filtered.length), color: "#fafafa" },
                     { label: "Realizadas", value: String(realizadas.length), color: "#10b981" },
                     { label: "Canceladas", value: String(canceladas.length), color: "#f87171" },
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
