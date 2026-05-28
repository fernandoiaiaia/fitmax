//@ts-nocheck
"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────

type ConsultaStatus = "agendada" | "pendente" | "a_confirmar" | "em_andamento";

interface Consulta {
  id: number; horario: string; nome: string; especialidade: string;
  modalidade: "Presencial" | "Online"; data: string; dataISO: string;
  avatar: string; status: ConsultaStatus;
}

// ─── Mock Fallbacks (usados enquanto API carrega) ────────────────────────────

const consultasFallback: Consulta[] = [
  { id: 1, horario:"09:00", nome:"Fernanda Lima",     especialidade:"Cardiologia", modalidade:"Presencial", data:"Hoje, 23/04",   dataISO:"2026-04-23", avatar:"https://picsum.photos/200/200?random=41", status:"agendada" },
  { id: 2, horario:"11:00", nome:"Guilherme Augusto", especialidade:"Cardiologia", modalidade:"Presencial", data:"Hoje, 23/04",   dataISO:"2026-04-23", avatar:"https://picsum.photos/200/200?random=30", status:"em_andamento" },
  { id: 3, horario:"13:00", nome:"Mariana Ferreira",  especialidade:"Cardiologia", modalidade:"Online",     data:"Hoje, 23/04",   dataISO:"2026-04-23", avatar:"https://picsum.photos/200/200?random=31", status:"pendente" },
  { id: 4, horario:"15:30", nome:"Ricardo Nunes",     especialidade:"Check-up",    modalidade:"Presencial", data:"Hoje, 23/04",   dataISO:"2026-04-23", avatar:"https://picsum.photos/200/200?random=45", status:"a_confirmar" },
  { id: 5, horario:"09:00", nome:"Lucas Mendes",      especialidade:"Check-up",    modalidade:"Presencial", data:"Amanhã, 24/04", dataISO:"2026-04-24", avatar:"https://picsum.photos/200/200?random=32", status:"agendada" },
];

const statusConfig: Record<ConsultaStatus, { label: string; bg: string; color: string }> = {
  agendada:     { label:"AGENDADA",     bg:"rgba(16,185,129,0.12)",  color:"#10b981" },
  pendente:     { label:"PENDENTE",     bg:"rgba(234,179,8,0.12)",   color:"#facc15" },
  a_confirmar:  { label:"A CONFIRMAR",  bg:"rgba(161,161,170,0.1)",  color:"#a1a1aa" },
  em_andamento: { label:"EM ANDAMENTO", bg:"rgba(96,165,250,0.12)",  color:"#60a5fa" },
};

// ─── Icons ────────────────────────────────────────────────────────────────────

const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
);
const ClockIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);
const TrendingIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
);
const MoneyIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
);
const ChevronDown = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
);

// ─── useOutsideClick ──────────────────────────────────────────────────────────

function useOutsideClick(ref: React.RefObject<HTMLElement>, cb: () => void) {
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) cb();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, cb]);
}

// ─── ConsultaRow ──────────────────────────────────────────────────────────────

const C = { bg:"#111111", card:"#141414", card2:"#1a1a1a", border:"rgba(255,255,255,0.07)" };

function ConsultaRow({ c }: { c: Consulta }) {
  const router = useRouter();
  const cfg = statusConfig[c.status];

  function handleClick() {
    const params = new URLSearchParams({
      id: String(c.id), nome: c.nome, especialidade: c.especialidade,
      data: c.data, horario: c.horario, modalidade: c.modalidade,
      status: c.status, avatar: c.avatar,
    });
    router.push(`/painel/consultas/agendar?${params.toString()}`);
  }

  return (
    <div className="pro-cons-card-wrap" onClick={handleClick}>
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"12px 16px", transition:"background .15s, border-color .15s" }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.card2; (e.currentTarget as HTMLElement).style.borderColor = "rgba(16,185,129,0.45)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = C.card;  (e.currentTarget as HTMLElement).style.borderColor = C.border; }}
      >
        <div className="pro-cons-row" style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
          {/* Horário */}
          <div style={{ width:52, flexShrink:0, textAlign:"center" }}>
            <span style={{ color:"#a1a1aa", fontSize:13, fontWeight:"bold" }}>{c.horario}</span>
          </div>
          {/* Divisor */}
          <div className="pro-cons-row-separator" style={{ width:1, height:36, background:C.border, flexShrink:0 }} />
          {/* Avatar */}
          <img src={c.avatar} alt={c.nome} style={{ width:40, height:40, borderRadius:"50%", objectFit:"cover", flexShrink:0 }} />
          {/* Info */}
          <div className="pro-cons-row-info" style={{ flex:1, display:"flex", flexDirection:"column", gap:3, minWidth:140 }}>
            <span style={{ color:"#fafafa", fontSize:14, fontWeight:"bold", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.nome}</span>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ color:"#a1a1aa", fontSize:12 }}>{c.especialidade}</span>
              <span style={{ width:3, height:3, borderRadius:"50%", background:"#52525b", flexShrink:0 }} />
              <span style={{ color:"#a1a1aa", fontSize:12 }}>{c.modalidade}</span>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:2 }}>
              <span style={{ color:"#71717a" }}><ClockIcon /></span>
              <span style={{ color:"#71717a", fontSize:11 }}>{c.data}</span>
            </div>
          </div>
          {/* Badge + seta */}
          <div className="pro-cons-card-actions" style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
            <span style={{ background:cfg.bg, border:`1px solid ${cfg.color}44`, color:cfg.color, fontSize:10, fontWeight:"bold", padding:"3px 10px", borderRadius:999 }}>{cfg.label}</span>
            <span className="pro-cons-arrow-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ConsultasPage() {
  const router = useRouter();
  const today  = new Date().toISOString().slice(0, 10);
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo,   setDateTo]   = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const dateRef = useRef<HTMLDivElement>(null);
  useOutsideClick(dateRef, useCallback(() => setShowDatePicker(false), []));

  // ── Estado real da API ────────────────────────────────────────────────────
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [summary,   setSummary]   = useState({ total: 0, agendada: 0, cancelada: 0 });
  const [resumo,    setResumo]    = useState<any>(null);

  useEffect(() => {
    api.get(`/pro/consultas?dateFrom=${dateFrom}&dateTo=${dateTo}&page=1&limit=50`)
      .then(r => {
        const mapped = r.data.data.map((c: any) => ({
          id:           c.id,
          horario:      new Date(c.dataHora).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' }),
          nome:         c.paciente.nome,
          especialidade: c.especialidade,
          modalidade:   c.modalidade === 'PRESENCIAL' ? 'Presencial' : 'Online',
          data:         new Date(c.dataHora).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' }),
          dataISO:      c.dataHora.slice(0, 10),
          avatar:       c.paciente.avatarUrl || `https://picsum.photos/200/200?random=${Math.floor(Math.random()*90)+10}`,
          status:       (c.status === 'agendada' ? 'agendada' : c.status === 'em_andamento' ? 'em_andamento' : c.status === 'concluida' ? 'agendada' : 'pendente') as ConsultaStatus,
        }));
        setConsultas(mapped);
      }).catch(() => {
        setConsultas([]);
      });

    api.get(`/pro/consultas/summary?dateFrom=${dateFrom}&dateTo=${dateTo}`)
      .then(r => setSummary(r.data))
      .catch(() => {});

    api.get(`/pro/consultas/resumo-periodo?dateFrom=${dateFrom}&dateTo=${dateTo}`)
      .then(r => setResumo(r.data))
      .catch(() => {});
  }, [dateFrom, dateTo]);

  const consultaEmAndamento = consultas.find(c => c.status === 'em_andamento') ?? null;
  const filtered = consultas.filter(c => c.status !== "em_andamento");

  const fmtDate = (iso: string) => { const [y,m,d] = iso.split("-"); return `${d}/${m}/${y}`; };

  const inputStyle: React.CSSProperties = {
    background:"#222", border:`1px solid ${C.border}`, borderRadius:8,
    color:"#fafafa", padding:"6px 10px", fontSize:13, width:"100%",
    outline:"none", colorScheme:"dark",
  };
  const labelStyle: React.CSSProperties = {
    color:"#a1a1aa", fontSize:11, fontWeight:600, letterSpacing:0.5,
    textTransform:"uppercase", marginBottom:4, display:"block",
  };

  const dayItems = [
    { icon:"📅", label:"Total de Consultas", value: String(summary.total),    color:"#fafafa" },
    { icon:"✅", label:"Confirmadas",         value: String(summary.agendada), color:"#10b981" },
    { icon:"⏳", label:"Pendentes",           value: String((summary as any).cancelada ?? 0), color:"#facc15" },
    { icon:"⏱",  label:"Tempo Médio",         value: resumo?.tempoMedioMinutos ? `${resumo.tempoMedioMinutos}m` : "—", color:"#60a5fa" },
  ];

  return (
    <>
      <style>{`
        @keyframes proFadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .pro-cons-card-wrap { cursor:pointer; animation:proFadeUp .28s ease both; transition:transform .15s; }
        .pro-cons-card-wrap:hover { transform:translateY(-1px); }
        .pro-cons-arrow-icon { color:#3f3f46; transition:color .15s,transform .15s; flex-shrink:0; }
        .pro-cons-card-wrap:hover .pro-cons-arrow-icon { color:#10b981; transform:translateX(3px); }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
        .live-dot { animation:pulse 2s infinite; }
        .btn-date {
          display:flex; align-items:center; gap:8px;
          background:#141414; border:1px solid rgba(255,255,255,0.07);
          border-radius:8px; padding:8px 14px; color:#a1a1aa;
          font-size:12px; cursor:pointer; transition:all .15s; font-family:inherit;
        }
        .btn-date:hover { background:#1a1a1a; border-color:rgba(16,185,129,0.5); }
        .btn-nova {
          display:flex; align-items:center; gap:6px;
          background:#10b981; border:none; border-radius:8px;
          padding:8px 18px; color:#fff; font-size:13px;
          font-weight:bold; cursor:pointer; transition:background .15s; font-family:inherit;
        }
        .btn-nova:hover { background:#059669; }
        .summary-card { background:#141414; border:1px solid rgba(255,255,255,0.07); border-radius:14px; padding:1rem 1.25rem; }
        .summary-card--blue { background:rgba(96,165,250,0.05); border-color:rgba(96,165,250,0.25); overflow:hidden; cursor:pointer; transition:background .15s, border-color .15s; }
        .summary-card--blue:hover { background:rgba(96,165,250,0.08); border-color:#60a5fa; }
        .summary-card--day { cursor:pointer; transition:background .15s, border-color .15s; }
        .summary-card--day:hover { background:#1a1a1a; border-color:rgba(16,185,129,0.4); }
        @media (max-width: 600px) {
          .pro-page-header-actions, .pro-page-header-actions > div { width: 100%; }
          .btn-date { width: 100%; justify-content: center; }
          .date-popup { left: 0 !important; right: 0 !important; width: 100% !important; min-width: 0 !important; box-sizing: border-box; }
        }
      `}</style>

      <div style={{ flex:1, overflowY:"auto" }}>
        <div style={{ padding:"1.5rem 2rem", maxWidth:1200, margin:"0 auto", display:"flex", flexDirection:"column", gap:24, width:"100%" }}>

          {/* ── Cabeçalho ── */}
          <div className="pro-page-header" style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:16 }}>
            <div>
              <h1 style={{ color:"#fafafa", fontSize:28, fontWeight:"bold", margin:0 }}>Consultas</h1>
              <p style={{ color:"#a1a1aa", fontSize:14, margin:0, marginTop:4 }}>Gerencie seus agendamentos e acompanhe o status de cada consulta.</p>
            </div>
            <div className="pro-page-header-actions" style={{ display:"flex", gap:12, flexWrap:"wrap", alignItems:"center" }}>
              {/* Filtro de data */}
              <div ref={dateRef} style={{ position:"relative" }}>
                <button className="btn-date" onClick={() => setShowDatePicker(v => !v)}>
                  <span style={{ color:"#a1a1aa" }}><CalendarIcon /></span>
                  <span>{fmtDate(dateFrom)} — {fmtDate(dateTo)}</span>
                  <span style={{ color:"#a1a1aa" }}><ChevronDown /></span>
                </button>
                {showDatePicker && (
                  <div className="date-popup" style={{ position:"absolute", top:"calc(100% + 8px)", right:0, zIndex:100, background:"#1a1a1a", border:`1px solid ${C.border}`, borderRadius:12, padding:16, minWidth:240, boxShadow:"0 8px 32px rgba(0,0,0,0.4)" }}>
                    <div style={{ marginBottom:12 }}>
                      <label style={labelStyle}>Data inicial</label>
                      <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={inputStyle} />
                    </div>
                    <div style={{ marginBottom:16 }}>
                      <label style={labelStyle}>Data final</label>
                      <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={inputStyle} />
                    </div>
                    <div style={{ display:"flex", gap:8 }}>
                      <button onClick={() => { setDateFrom("2026-04-22"); setDateTo("2026-05-22"); }} style={{ flex:1, padding:"6px 0", borderRadius:8, fontSize:12, fontWeight:600, background:"transparent", border:`1px solid ${C.border}`, color:"#a1a1aa", cursor:"pointer" }}>Resetar</button>
                      <button onClick={() => setShowDatePicker(false)} style={{ flex:1, padding:"6px 0", borderRadius:8, fontSize:12, fontWeight:600, background:"#10b981", border:"none", color:"#fff", cursor:"pointer" }}>Aplicar</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Cards de Resumo ── */}
          <div className="pro-stat-grid" style={{ display:"flex", flexWrap:"wrap", gap:16 }}>

            <div style={{ flex:1, minWidth:280, display:"flex", flexDirection:"column", gap:16 }}>
              {/* Resumo do Período */}
              <div className="summary-card">
                <p style={{ color:"#71717a", fontSize:11, fontWeight:"bold", letterSpacing:1, textTransform:"uppercase", margin:"0 0 12px" }}>Resumo do Período</p>
                <div className="pro-resumo-inner" style={{ display:"flex", gap:16 }}>
                  <div style={{ flex:1, display:"flex", flexDirection:"column", gap:8 }}>
                    <div style={{ width:36, height:36, borderRadius:"50%", background:"rgba(16,185,129,0.12)", display:"flex", alignItems:"center", justifyContent:"center" }}><TrendingIcon /></div>
                    <span style={{ color:"#a1a1aa", fontSize:12 }}>Agendamentos</span>
                    <span style={{ color:"#fafafa", fontSize:22, fontWeight:"bold" }}>{resumo ? resumo.agendamentos : '—'}</span>
                    <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                      <span style={{ width:6, height:6, borderRadius:"50%", background: resumo?.variacaoPctAgendamentos >= 0 ? "#10b981" : "#ef4444", flexShrink:0 }} />
                      <span style={{ color: resumo?.variacaoPctAgendamentos >= 0 ? "#10b981" : "#ef4444", fontSize:11 }}>
                        {resumo ? `${resumo.variacaoPctAgendamentos > 0 ? '+' : ''}${resumo.variacaoPctAgendamentos ?? 0}% vs mês anterior` : '— vs mês anterior'}
                      </span>
                    </div>
                  </div>
                  <div className="pro-resumo-sep" style={{ width:1, background:C.border, alignSelf:"stretch" }} />
                  <div style={{ flex:1, display:"flex", flexDirection:"column", gap:8 }}>
                    <div style={{ width:36, height:36, borderRadius:"50%", background:"rgba(16,185,129,0.12)", display:"flex", alignItems:"center", justifyContent:"center" }}><MoneyIcon /></div>
                    <span style={{ color:"#a1a1aa", fontSize:12 }}>Valor Gerado</span>
                    <span style={{ color:"#fafafa", fontSize:22, fontWeight:"bold" }}>
                      {resumo ? `R$${Number(resumo.valorGeradoReais).toLocaleString('pt-BR', { minimumFractionDigits:0, maximumFractionDigits:0 })}` : '—'}
                    </span>
                    <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                      <span style={{ width:6, height:6, borderRadius:"50%", background: resumo?.variacaoPctValor >= 0 ? "#10b981" : "#ef4444", flexShrink:0 }} />
                      <span style={{ color: resumo?.variacaoPctValor >= 0 ? "#10b981" : "#ef4444", fontSize:11 }}>
                        {resumo ? `${resumo.variacaoPctValor > 0 ? '+' : ''}${resumo.variacaoPctValor ?? 0}% vs mês anterior` : '— vs mês anterior'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Em Andamento */}
              <div className="summary-card summary-card--blue" style={{ padding:0 }}>
                <div style={{ height:3, background:"#60a5fa" }} />
                <div style={{ padding:"1rem 1.25rem", display:"flex", flexDirection:"column", gap:12 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ color:"#71717a", fontSize:11, fontWeight:"bold", letterSpacing:1, textTransform:"uppercase" }}>Em Andamento</span>
                    <div style={{ display:"flex", alignItems:"center", gap:4, padding:"3px 10px", borderRadius:999, background:"rgba(96,165,250,0.15)" }}>
                      <span className="live-dot" style={{ width:6, height:6, borderRadius:"50%", background:"#60a5fa", boxShadow:"0 0 6px #60a5fa", display:"inline-block" }} />
                      <span style={{ color:"#60a5fa", fontSize:10, fontWeight:"bold" }}>Ao vivo</span>
                    </div>
                  </div>
                  {consultaEmAndamento ? (
                    <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                      <img src={consultaEmAndamento.avatar} alt={consultaEmAndamento.nome} style={{ width:44, height:44, borderRadius:"50%", objectFit:"cover", border:"2px solid rgba(96,165,250,0.4)", flexShrink:0 }} />
                      <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
                        <span style={{ color:"#fafafa", fontSize:14, fontWeight:"bold" }}>{consultaEmAndamento.nome}</span>
                        <span style={{ color:"#a1a1aa", fontSize:12 }}>{consultaEmAndamento.especialidade}</span>
                        <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                          <span style={{ color:"#60a5fa" }}><ClockIcon /></span>
                          <span style={{ color:"#60a5fa", fontSize:12 }}>{consultaEmAndamento.horario}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0" }}>
                      <div style={{ width:44, height:44, borderRadius:"50%", background:"rgba(96,165,250,0.08)", border:"2px solid rgba(96,165,250,0.2)", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <ClockIcon />
                      </div>
                      <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
                        <span style={{ color:"#a1a1aa", fontSize:13 }}>Nenhuma consulta em andamento</span>
                        <span style={{ color:"#52525b", fontSize:11 }}>Aguardando início do atendimento</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Visão Geral do Dia */}
            <div className="summary-card summary-card--day" style={{ flex:1, minWidth:280 }}>
              <p style={{ color:"#71717a", fontSize:11, fontWeight:"bold", letterSpacing:1, textTransform:"uppercase", margin:"0 0 12px" }}>Visão Geral do Dia</p>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {dayItems.map((item, i) => (
                  <div key={i} id={`day-item-${i}`} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 12px", borderRadius:8, background:C.bg, border:`1px solid ${C.border}` }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:16 }}>{item.icon}</span>
                      <span style={{ color:"#a1a1aa", fontSize:13 }}>{item.label}</span>
                    </div>
                    <span style={{ fontSize:16, fontWeight:"bold", color:item.color }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Lista de Consultas ── */}
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div>
              <h2 style={{ color:"#fafafa", fontSize:20, fontWeight:"bold", margin:0 }}>Próximas Consultas</h2>
              <p style={{ color:"#a1a1aa", fontSize:12, margin:"4px 0 0" }}>{filtered.length} consultas encontradas</p>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {filtered.length === 0 ? (
                <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:32, display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:32 }}>📭</span>
                  <span style={{ color:"#a1a1aa", fontSize:14 }}>Nenhuma consulta encontrada no período.</span>
                </div>
              ) : (
                filtered.map((c) => <ConsultaRow key={c.id} c={c} />)
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
