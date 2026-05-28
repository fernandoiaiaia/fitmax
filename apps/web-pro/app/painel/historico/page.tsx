//@ts-nocheck
"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

type StatusPagamento = "pago" | "pendente" | "reembolsado";

interface ConsultaHistorico {
  id: number; data: string; dataISO: string; horario: string;
  paciente: string; especialidade: string; modalidade: "Presencial" | "Online";
  avatar: string; valor: string; statusPagamento: StatusPagamento; nota?: number;
}

const PERIODOS = ["Semana", "Mês", "Ano", "Tudo"];

function getMesLabel(isoDate: string) {
  const [year, month] = isoDate.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 15);
  const m = date.toLocaleDateString('pt-BR', { month: 'long' });
  return m.charAt(0).toUpperCase() + m.slice(1) + ' ' + year;
}

function agruparPorMes(items: ConsultaHistorico[]) {
  const g: Record<string, ConsultaHistorico[]> = {};
  for (const i of items) { if (!g[i.dataISO]) g[i.dataISO]=[]; g[i.dataISO].push(i); }
  return g;
}

const pagConfig: Record<StatusPagamento, { label:string; bg:string; color:string; border:string }> = {
  pago:        { label:"PAGO",        bg:"rgba(16,185,129,0.12)",  color:"#10b981", border:"rgba(16,185,129,0.3)" },
  pendente:    { label:"PENDENTE",    bg:"rgba(234,179,8,0.12)",   color:"#facc15", border:"rgba(234,179,8,0.3)" },
  reembolsado: { label:"REEMBOLSADO", bg:"rgba(161,161,170,0.1)",  color:"#a1a1aa", border:"rgba(161,161,170,0.25)" },
};

function useOutsideClick(ref: React.RefObject<HTMLElement>, cb: () => void) {
  useEffect(() => {
    function handler(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) cb(); }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, cb]);
}

const CalendarIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>);
const ExternalLinkIcon = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>);
const ChevronDownIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>);
const StarIcon = ({ filled }: { filled:boolean }) => (<svg width="12" height="12" viewBox="0 0 24 24" fill={filled?"#facc15":"none"} stroke={filled?"#facc15":"#3f3f46"} strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>);

function StarRow({ nota }: { nota:number }) {
  return <div style={{ display:"flex", gap:2 }}>{[1,2,3,4,5].map(i=><StarIcon key={i} filled={i<=nota}/>)}</div>;
}

const C = { card:"#141414", card2:"#1a1a1a", border:"rgba(255,255,255,0.07)", bg:"#111111" };

function ConsultaCard({ c }: { c:ConsultaHistorico }) {
  const cfg = pagConfig[c.statusPagamento];
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, overflow:"hidden", cursor:"pointer", transition:"background .15s, border-color .15s" }}
      onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.background=C.card2; (e.currentTarget as HTMLElement).style.borderColor="rgba(16,185,129,0.45)"; }}
      onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.background=C.card;  (e.currentTarget as HTMLElement).style.borderColor=C.border; }}
    >
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", borderBottom:`1px solid ${C.border}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ color:"#71717a" }}><CalendarIcon /></span>
          <span style={{ color:"#a1a1aa", fontSize:12 }}>{c.data} · {c.horario}</span>
        </div>
        <span style={{ background:cfg.bg, border:`1px solid ${cfg.border}`, color:cfg.color, fontSize:10, fontWeight:"bold", padding:"2px 10px", borderRadius:999 }}>{cfg.label}</span>
      </div>
      {/* Body */}
      <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px" }}>
        <img src={c.avatar} alt={c.paciente} style={{ width:42, height:42, borderRadius:"50%", objectFit:"cover", flexShrink:0, border:`1px solid ${C.border}` }} />
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ color:"#fafafa", fontSize:14, fontWeight:"bold", margin:0 }}>{c.paciente}</p>
          <p style={{ color:"#a1a1aa", fontSize:12, margin:0 }}>{c.especialidade} · {c.modalidade}</p>
          {c.nota && (
            <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:4 }}>
              <StarRow nota={c.nota} />
              <span style={{ color:"#71717a", fontSize:11 }}>Sua avaliação</span>
            </div>
          )}
        </div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:3, flexShrink:0 }}>
          <span style={{ color:"#71717a", fontSize:11 }}>Valor</span>
          <span style={{ color:"#fafafa", fontSize:16, fontWeight:"bold" }}>{c.valor}</span>
        </div>
      </div>
      {/* Footer */}
      <div style={{ padding:"6px 14px", borderTop:`1px solid ${C.border}` }}>
        <button style={{ display:"flex", alignItems:"center", gap:5, background:"none", border:"none", cursor:"pointer", padding:"4px 8px", borderRadius:6, color:"#71717a", fontSize:12, fontFamily:"inherit", transition:"background .15s" }}
          onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.background=C.card2; }}
          onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.background="none"; }}
        >
          <ExternalLinkIcon /> Ver detalhes
        </button>
      </div>
    </div>
  );
}

export default function HistoricoPage() {
  const [periodo, setPeriodo] = useState("Mês");
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const headerMenuRef = useRef<HTMLDivElement>(null);
  useOutsideClick(headerMenuRef, useCallback(() => setHeaderMenuOpen(false), []));

  // Estado real da API
  const [consultasList, setConsultasList] = useState<ConsultaHistorico[]>([]);
  const [resumo, setResumo] = useState<any>(null);

  const periodoParam: Record<string, string> = {
    "Semana": "semana", "Mês": "mes", "Ano": "ano", "Tudo": "tudo",
  };

  useEffect(() => {
    const p = periodoParam[periodo] ?? "mes";
    api.get(`/pro/historico?periodo=${p}&page=1&limit=50`)
      .then(r => {
        setConsultasList(r.data.data.map((c: any) => ({
        id:              c.id,
        data:            new Date(c.dataHora).toLocaleDateString('pt-BR'),
        dataISO:         c.dataHora.slice(0, 7),
        horario:         new Date(c.dataHora).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' }),
        paciente:        c.paciente.nome,
        especialidade:   c.especialidade,
        modalidade:      c.modalidade === 'PRESENCIAL' ? 'Presencial' : 'Online',
        avatar:          c.paciente.avatarUrl || `https://picsum.photos/200/200?random=30`,
        valor:           `R$ ${Number(c.valorReais).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`,
        statusPagamento: c.statusPagamento,
        nota:            undefined,
      })));
      })
      .catch(() => setConsultasList([]));

    api.get(`/pro/historico/resumo?periodo=${p}`)
      .then(r => setResumo(r.data))
      .catch(() => {});
  }, [periodo]);

  const grupos = agruparPorMes(consultasList);
  const meses  = Object.keys(grupos).sort((a,b) => b.localeCompare(a));
  const totalPago = resumo ? Number(resumo.totalRecebidoReais) * 100 : consultasList.filter(c=>c.statusPagamento==="pago").reduce((acc,c)=>acc+parseInt(c.valor.replace(/\D/g,"")),0);
  const pendentes = resumo?.pendentesDePagamento ?? consultasList.filter(c=>c.statusPagamento==="pendente").length;
  const timeline  = consultasList.slice().sort((a,b)=>String(b.id).localeCompare(String(a.id))).map(c=>({ data:c.data, descricao:`${c.especialidade} · ${c.modalidade}`, paciente:c.paciente }));

  const resumoItems = [
    { label:"Total de atendimentos",  value: resumo ? String(resumo.totalAtendimentos) : String(consultasList.length), color:"#fafafa" },
    { label:"Total recebido",         value: resumo ? `R$ ${Number(resumo.totalRecebidoReais).toLocaleString("pt-BR")}` : `R$ ${Math.round(totalPago/100).toLocaleString("pt-BR")}`, color:"#10b981" },
    { label:"Pendentes de pagamento", value: String(pendentes), color:"#facc15" },
    { label:"Reembolsados",           value: resumo ? String(resumo.reembolsados) : String(consultasList.filter(c=>c.statusPagamento==="reembolsado").length), color:"#a1a1aa" },
  ];

  return (
    <>
      <style>{`
        .hist-cols { display:flex; gap:20px; align-items:flex-start; }
        .hist-col-left  { flex:2; min-width:280px; display:flex; flex-direction:column; gap:20px; }
        .hist-col-right { flex:1; min-width:240px; display:flex; flex-direction:column; gap:16px; }
        @media(max-width:768px){
          .hist-cols { flex-direction:column; }
          .hist-col-left,.hist-col-right { min-width:0; width:100%; }
        }
        .sidebar-card {
          background:${C.card}; border:1px solid ${C.border}; border-radius:14px;
          overflow:hidden; cursor:pointer; transition:background .15s,border-color .15s;
        }
        .sidebar-card--purple:hover { background:${C.card2}; border-color:rgba(167,139,250,0.45); }
        .sidebar-card--green:hover  { background:${C.card2}; border-color:rgba(16,185,129,0.45); }
        .period-pill {
          padding:6px 16px; border-radius:999px; border:1px solid;
          font-size:13px; cursor:pointer; font-family:inherit; transition:all .15s;
        }
        .hist-btn-full {
          display:flex; align-items:center; justify-content:center; gap:6px;
          width:100%; padding:10px 0; border-radius:8px; border:1px solid ${C.border};
          background:transparent; color:#a1a1aa; font-size:13px; cursor:pointer;
          font-family:inherit; transition:background .15s;
        }
        .hist-btn-full:hover { background:${C.card2}; }
      `}</style>

      <div style={{ flex:1, overflowY:"auto" }}>
        <div style={{ padding:"1.5rem 2rem", maxWidth:1100, margin:"0 auto", display:"flex", flexDirection:"column", gap:24, width:"100%" }}>

          {/* Cabeçalho */}
          <div className="pro-page-header" style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12 }}>
            <div>
              <h2 style={{ color:"#fafafa", fontSize:22, fontWeight:"bold", margin:0 }}>Histórico</h2>
              <p style={{ color:"#a1a1aa", fontSize:14, margin:"4px 0 0" }}>Consultas realizadas, pagamentos e linha do tempo de atendimentos.</p>
            </div>
            {/* Desktop pills */}
            <div className="pro-filter-desktop" style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {PERIODOS.map(p => {
                const isActive = periodo===p;
                return (
                  <button key={p} className="period-pill" onClick={()=>setPeriodo(p)} style={{ borderColor:isActive?"#10b981":C.border, background:isActive?"rgba(16,185,129,0.1)":"transparent", color:isActive?"#10b981":"#a1a1aa", fontWeight:isActive?"bold":"500" }}>{p}</button>
                );
              })}
            </div>
            {/* Mobile dropdown */}
            <div className="pro-filter-mobile" ref={headerMenuRef} style={{ position:"relative" }}>
              <button className="pro-filter-dropdown-btn" onClick={()=>setHeaderMenuOpen(v=>!v)}>
                Período: {periodo}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform:headerMenuOpen?"rotate(180deg)":"rotate(0deg)", transition:"transform .2s" }}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              {headerMenuOpen && (
                <div className="pro-filter-dropdown-menu" style={{ right:0, left:"auto", minWidth:160 }}>
                  {PERIODOS.map(p=>(
                    <div key={p} className={`pro-filter-dropdown-item${periodo===p?" active":""}`} onClick={()=>{setPeriodo(p);setHeaderMenuOpen(false);}}>
                      {periodo===p && <span style={{ marginRight:6 }}>✓</span>}{p}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Corpo */}
          <div className="hist-cols">

            {/* Coluna Esquerda */}
            <div className="hist-col-left">
              <h2 style={{ color:"#fafafa", fontSize:20, fontWeight:"bold", margin:0 }}>Consultas Realizadas</h2>
              {meses.map(mesKey => {
                const items = grupos[mesKey];
                const label = getMesLabel(mesKey);
                return (
                  <div key={mesKey} style={{ display:"flex", flexDirection:"column", gap:12 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                      <span style={{ color:"#a1a1aa", fontSize:12, fontWeight:"bold", textTransform:"uppercase", letterSpacing:1, flexShrink:0 }}>{label}</span>
                      <div style={{ flex:1, height:1, background:C.border }} />
                      <span style={{ color:"#71717a", fontSize:11, flexShrink:0 }}>{items.length} consultas</span>
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                      {items.map(c=><ConsultaCard key={c.id} c={c}/>)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Coluna Direita */}
            <div className="hist-col-right">

              {/* Linha do Tempo */}
              <div className="sidebar-card sidebar-card--purple">
                <div style={{ height:3, background:"#a78bfa" }} />
                <div style={{ padding:16, display:"flex", flexDirection:"column", gap:16 }}>
                  <span style={{ color:"#a1a1aa", fontSize:11, fontWeight:"bold", letterSpacing:1, textTransform:"uppercase" }}>Linha do tempo</span>
                  <div>
                    {timeline.slice(0,8).map((item,idx)=>{
                      const isLast = idx===timeline.length-1;
                      return (
                        <div key={idx} style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", width:14, flexShrink:0, marginTop:4 }}>
                            <div style={{ width:10, height:10, borderRadius:"50%", background:"#a78bfa", border:`2px solid ${C.bg}`, zIndex:2 }} />
                            {!isLast && <div style={{ width:2, height:38, background:C.border, marginTop:-2, zIndex:1 }} />}
                          </div>
                          <div style={{ flex:1, paddingBottom:isLast?0:12 }}>
                            <span style={{ color:"#71717a", fontSize:11, display:"block" }}>{item.data}</span>
                            <span style={{ color:"#fafafa", fontSize:13, fontWeight:500, display:"block" }}>{item.descricao}</span>
                            <span style={{ color:"#a1a1aa", fontSize:12, display:"block" }}>{item.paciente}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <button className="hist-btn-full">
                    Ver histórico completo <ChevronDownIcon />
                  </button>
                </div>
              </div>

              {/* Resumo Geral */}
              <div className="sidebar-card sidebar-card--green" style={{ padding:16 }}>
                <p style={{ color:"#a1a1aa", fontSize:11, fontWeight:"bold", letterSpacing:1, textTransform:"uppercase", margin:"0 0 12px" }}>Resumo Geral</p>
                {resumoItems.map((item,i)=>(
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:12, paddingBottom:12, borderBottom:i<resumoItems.length-1?`1px solid ${C.border}`:"none" }}>
                    <span style={{ color:"#a1a1aa", fontSize:13 }}>{item.label}</span>
                    <span style={{ fontSize:14, fontWeight:"bold", color:item.color }}>{item.value}</span>
                  </div>
                ))}
              </div>

            </div>
          </div>

        </div>
      </div>
    </>
  );
}
