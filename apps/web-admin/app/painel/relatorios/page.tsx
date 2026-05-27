"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  fetchKpis, fetchGrafico, fetchOperacional, exportarPdf,
  fmtCentavos, centavosParaGrafico,
  type KpisData, type GraficoData, type OperacionalData,
} from "../../../lib/relatorios-api";


// ── Paleta ─────────────────────────────────────────────────────────────────────
const C = {
  bg: "#111111", card: "#1a1a1a", hover: "#222222",
  border: "#27272a", text: "#fafafa", muted: "#a1a1aa", dim: "#71717a",
  green: "#10b981",
};

// ── Dados ──────────────────────────────────────────────────────────────────────
const meses = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const mesesCompletos = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const ANOS_DISP = ["2026","2025","2024"];

// (mock data removido — dados vêm da API)

// ── CSS ────────────────────────────────────────────────────────────────────────
const PAGE_CSS = `
  @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes growBar { from{transform:scaleX(0)} to{transform:scaleX(1)} }
  .rlt-card { border-radius:14px; transition:border-color .18s, background .18s, transform .18s, box-shadow .18s; animation:fadeUp .35s ease both; }
  .rlt-card:hover { border-color:#10b981!important; transform:translateY(-2px); box-shadow:0 8px 24px rgba(0,0,0,0.3); }
  .rlt-pill { padding:6px 16px; border-radius:999px; font-size:13px; cursor:pointer; transition:all .15s; font-family:inherit; white-space:nowrap; border:1px solid #27272a; background:transparent; color:#a1a1aa; }
  .rlt-pill.active { border-color:#10b981; background:rgba(16,185,129,0.1); color:#10b981; font-weight:700; }
  .rlt-bar-fill { transform-origin:left; animation:growBar .6s ease both; border-radius:999px; }
  .rlt-export { display:flex;align-items:center;gap:6px;padding:0 14px;height:36px;border-radius:8px;border:1px solid #27272a;background:#1a1a1a;cursor:pointer;color:#a1a1aa;font-size:13px;font-family:inherit;transition:all .15s; }
  .rlt-export:hover { border-color:#10b981; color:#fafafa; }
  @media(max-width:900px){ .rlt-main-grid{flex-direction:column!important} }
  @media(max-width:600px){ .rlt-fin-grid{grid-template-columns:1fr 1fr!important} .rlt-header-actions{flex-direction:column!important;align-items:stretch!important} .rlt-export{justify-content:center;} .rlt-periodo-desk{display:none!important} .rlt-periodo-mob{display:block!important} }
  @media(min-width:601px){ .rlt-periodo-desk{display:block!important} .rlt-periodo-mob{display:none!important} }
`;

// ── SVG Line + Area Chart ─────────────────────────────────────────────────────
function LineChart({ fat, rep, ano, mesFiltro }: { fat:number[]; rep:number[]; ano:string; mesFiltro:string }) {
  const [tip, setTip] = useState<{x:number;y:number;val:number;rep:number;mes:string}|null>(null);
  const ativos = fat.map((v,i) => mesFiltro === "Todos" || parseInt(mesFiltro)-1 === i ? v : 0);
  const rAtivos = rep.map((v,i) => mesFiltro === "Todos" || parseInt(mesFiltro)-1 === i ? v : 0);
  const allVals = [...fat, ...rep].filter(v=>v>0);
  const maxVal = allVals.length ? Math.ceil(Math.max(...allVals) / 1000) * 1000 : 20000;
  const W=800, H=240, PAD={top:20,right:20,bottom:36,left:56};
  const cW=W-PAD.left-PAD.right, cH=H-PAD.top-PAD.bottom;
  const visLen = fat.filter(v=>v>0).length || 1;
  const visMeses = meses.slice(0, fat.filter((_,i)=> mesFiltro==="Todos" ? fat[i]>0 : true).length);
  const sx=(i:number)=>PAD.left+(i/Math.max(fat.filter(v=>v>0).length-1,1))*cW;
  const sy=(v:number)=>PAD.top+cH-(v/maxVal)*cH;
  const yTicks=[0, Math.round(maxVal*0.25), Math.round(maxVal*0.5), Math.round(maxVal*0.75), maxVal];
  const pts = fat.map((v,i)=>`${sx(i)},${sy(v)}`).filter((_,i)=>fat[i]>0).join(" ");
  const rPts= rep.map((v,i)=>`${sx(i)},${sy(v)}`).filter((_,i)=>rep[i]>0).join(" ");
  const line=(s:string)=>s?`M ${s.split(" ").join(" L ")}`:`M 0 0`;
  const area=(s:string,arr:number[])=>{
    const nonZero=arr.filter(v=>v>0); if(!nonZero.length) return `M 0 0`;
    const last=arr.reduce((a,v,i)=>v>0?i:a,0);
    return `M ${sx(arr.findIndex(v=>v>0))},${sy(0)} L ${s.split(" ").join(" L ")} L ${sx(last)},${sy(0)} Z`;
  };

  return (
    <div style={{ width:"100%", overflowX:"auto" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ display:"block", width:"100%", minWidth:520 }}>
        <defs>
          <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.2"/>
            <stop offset="100%" stopColor="#10b981" stopOpacity="0"/>
          </linearGradient>
          <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.15"/>
            <stop offset="100%" stopColor="#60a5fa" stopOpacity="0"/>
          </linearGradient>
          <filter id="glow"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        {yTicks.map(t=>(
          <g key={t}>
            <line x1={PAD.left} y1={sy(t)} x2={W-PAD.right} y2={sy(t)} stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray={t===0?"0":"4 4"}/>
            <text x={PAD.left-8} y={sy(t)+4} textAnchor="end" fontSize="10" fill="#52525b">{t===0?"R$0":`R$${(t/1000).toFixed(0)}K`}</text>
          </g>
        ))}
        {fat.map((v,i)=> v>0 ? <text key={i} x={sx(i)} y={H-PAD.bottom+16} textAnchor="middle" fontSize="10" fill={mesFiltro!=="Todos"&&parseInt(mesFiltro)-1===i?"#10b981":"#52525b"}>{meses[i]}</text> : null)}
        <path d={area(rPts,rep)} fill="url(#g2)"/>
        <path d={area(pts,fat)}  fill="url(#g1)"/>
        <path d={line(rPts)} fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d={line(pts)}  fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)"/>
        {fat.map((v,i)=> v>0 ? (
          <g key={i}>
            <circle cx={sx(i)} cy={sy(v)} r={mesFiltro!=="Todos"&&parseInt(mesFiltro)-1===i?6:4} fill="#141414" stroke="#10b981" strokeWidth="2.5" style={{cursor:"crosshair"}}
              onMouseEnter={()=>setTip({x:sx(i),y:sy(v),val:v,rep:rep[i],mes:meses[i]})}
              onMouseLeave={()=>setTip(null)}/>
            <circle cx={sx(i)} cy={sy(v)} r="16" fill="transparent" style={{cursor:"crosshair"}}
              onMouseEnter={()=>setTip({x:sx(i),y:sy(v),val:v,rep:rep[i],mes:meses[i]})}
              onMouseLeave={()=>setTip(null)}/>
          </g>
        ) : null)}
        {tip&&(()=>{
          const tx=tip.x>W*0.75?tip.x-140:tip.x+12;
          const ty=tip.y<PAD.top+30?tip.y+10:tip.y-62;
          return (
            <g>
              <line x1={tip.x} y1={PAD.top} x2={tip.x} y2={H-PAD.bottom} stroke="rgba(16,185,129,0.3)" strokeWidth="1" strokeDasharray="4 4"/>
              <rect x={tx} y={ty} width="136" height="54" rx="8" fill="#1e1e1e" stroke="rgba(16,185,129,0.3)" strokeWidth="1"/>
              <text x={tx+10} y={ty+16} fontSize="11" fill="#71717a">{tip.mes} {ano}</text>
              <text x={tx+10} y={ty+31} fontSize="13" fontWeight="700" fill="#fafafa">R$ {tip.val.toLocaleString("pt-BR")}</text>
              <text x={tx+10} y={ty+46} fontSize="11" fill="#60a5fa">↩ R$ {tip.rep.toLocaleString("pt-BR")}</text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}

function useOutsideClick(ref: React.RefObject<HTMLElement | null>, cb:()=>void) {
  useEffect(()=>{
    const h=(e:MouseEvent)=>{if(ref.current&&!ref.current.contains(e.target as Node))cb();};
    document.addEventListener("mousedown",h);
    return()=>document.removeEventListener("mousedown",h);
  },[ref,cb]);
}

export default function RelatoriosPage() {
  const nowD  = new Date();
  const [ano, setAno] = useState(String(nowD.getFullYear()));
  const [mes, setMes] = useState("Todos");

  const [kpis,    setKpis]    = useState<KpisData | null>(null);
  const [grafico, setGrafico] = useState<GraficoData | null>(null);
  const [ops,     setOps]     = useState<OperacionalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const mesNum = mes === "Todos" ? undefined : parseInt(mes);
  const periodoLabel = kpis?.periodoLabel ?? (mes === "Todos" ? `Ano ${ano}` : `${mesesCompletos[parseInt(mes)-1]} ${ano}`);

  const loadData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [k, g, o] = await Promise.all([
        fetchKpis(parseInt(ano), mesNum),
        fetchGrafico(parseInt(ano), mesNum),
        fetchOperacional(),
      ]);
      setKpis(k); setGrafico(g); setOps(o);
    } catch { setError('Erro ao carregar dados.'); }
    finally { setLoading(false); }
  }, [ano, mesNum]);

  useEffect(() => { loadData(); }, [loadData]);

  const fatAtivo     = (grafico?.faturamento ?? []).map(centavosParaGrafico);
  const repAtivo     = (grafico?.repasses    ?? []).map(centavosParaGrafico);
  const graficoMeses = grafico?.meses ?? [];

  const repPct = kpis && kpis.faturamentoBruto > 0 ? Math.round(kpis.totalRepassado / kpis.faturamentoBruto * 100) : 0;
  const estPct = kpis && kpis.faturamentoBruto > 0 ? ((kpis.estornos / kpis.faturamentoBruto)*100).toFixed(1) : '0';

  const finCards = [
    { label:"Faturamento Bruto",   value: kpis ? fmtCentavos(kpis.faturamentoBruto) : '—', delta: kpis?.deltaFatPct != null ? `↑ ${kpis.deltaFatPct}% vs. ano anterior` : '—', color:"#10b981",
      icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> },
    { label:"Total Repassado",     value: kpis ? fmtCentavos(kpis.totalRepassado) : '—',   delta: `${repPct}% do faturamento`, color:"#60a5fa",
      icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg> },
    { label:"Pendente de Repasse", value: kpis ? fmtCentavos(kpis.pendente) : '—',         delta:"~30% do faturamento", color:"#facc15",
      icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
    { label:"Estornos",            value: kpis ? fmtCentavos(kpis.estornos) : '—',         delta:`~${estPct}% do faturamento`, color:"#f43f5e",
      icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg> },
    { label:"Receita FitMax",      value: kpis ? fmtCentavos(kpis.receitaFitMax) : '—',   delta:`Taxa média: ${kpis?.taxaMediaPct ?? 0}%`, color:"#8b5cf6",
      icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg> },
  ];

  const opsCards = [
    { label:"Usuários Ativos", accent:"#38bdf8", items:[
        { sub:"Clientes",      val: ops?.usuarios.clientes      ?? 0, total: ops?.usuarios.total ?? 1, color:"#38bdf8" },
        { sub:"Profissionais", val: ops?.usuarios.profissionais ?? 0, total: ops?.usuarios.total ?? 1, color:"#818cf8" },
    ]},
    { label:"Consultas (Total)", accent:"#10b981", items:[
        { sub:"Realizadas", val: ops?.consultas.realizadas ?? 0, total: ops?.consultas.total ?? 1, color:"#10b981" },
        { sub:"Pendentes",  val: ops?.consultas.pendentes  ?? 0, total: ops?.consultas.total ?? 1, color:"#fbbf24" },
        { sub:"Canceladas", val: ops?.consultas.canceladas ?? 0, total: ops?.consultas.total ?? 1, color:"#f87171" },
    ]},
    { label:"Publicações", accent:"#a78bfa", items:[
        { sub:"Ativas",      val: ops?.publicacoes.ativas      ?? 0, total: ops?.publicacoes.total ?? 1, color:"#a78bfa" },
        { sub:"Denunciadas", val: ops?.publicacoes.denunciadas ?? 0, total: ops?.publicacoes.total ?? 1, color:"#fbbf24" },
        { sub:"Banidas",     val: ops?.publicacoes.banidas     ?? 0, total: ops?.publicacoes.total ?? 1, color:"#f43f5e" },
    ]},
  ];

  const dropRef = useRef<HTMLDivElement>(null);
  void dropRef;

  const exportPDF = () => exportarPdf(parseInt(ano), mesNum);

  const topMeses = graficoMeses.map((m,i) => ({ m, v: fatAtivo[i] ?? 0 })).filter(x=>x.v>0).sort((a,b)=>b.v-a.v).slice(0,4);
  const topMax   = topMeses[0]?.v ?? 1;


  return (
    <>
      <style>{PAGE_CSS}</style>
      <div style={{ width:"100%", maxWidth:1200, margin:"0 auto", paddingBottom:32, display:"flex", flexDirection:"column", gap:20 }}>

        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", flexWrap:"wrap", gap:12 }}>
          <div>
            <h2 style={{ color:C.text, fontSize:22, fontWeight:700, margin:0, letterSpacing:"-0.02em" }}>Relatórios &amp; Analytics</h2>
            <p style={{ color:C.muted, fontSize:13, margin:"4px 0 0" }}>Business intelligence e visão gerencial completa da plataforma</p>
          </div>
          <div className="rlt-header-actions" style={{ display:"flex", gap:10, alignItems:"center" }}>
            {/* Export PDF */}
            <button className="rlt-export" onClick={exportPDF}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Exportar PDF
            </button>
          </div>
        </div>

        {/* Filtro de Período — estilo web-pro */}
        <div style={{ display:"flex", flexWrap:"wrap", gap:16, alignItems:"center", background:C.card, padding:12, borderRadius:14, border:`1px solid ${C.border}` }}>

          {/* Pills de ano — desktop */}
          <div className="rlt-periodo-desk" style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {ANOS_DISP.map(a=>(
              <button key={a} onClick={()=>{setAno(a);setMes("Todos");}} style={{
                padding:"6px 16px", borderRadius:999, border:`1px solid ${ano===a?C.green:C.border}`,
                background:ano===a?"rgba(16,185,129,0.1)":"transparent",
                color:ano===a?C.green:C.muted, fontSize:13, fontWeight:ano===a?700:500,
                cursor:"pointer", fontFamily:"inherit", transition:"all .15s", whiteSpace:"nowrap"
              }}>{a}</button>
            ))}
          </div>

          {/* Separador */}
          <div className="rlt-periodo-desk" style={{ width:1, height:30, background:C.border, flexShrink:0 }} />

          {/* Select de mês */}
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <div style={{ position:"relative" }}>
              <select value={mes} onChange={e=>setMes(e.target.value)}
                style={{ height:34, paddingLeft:10, paddingRight:26, background:"#1a1a1a", border:`1px solid ${C.border}`, borderRadius:8, color:mes==="Todos"?C.muted:C.green, fontSize:13, fontFamily:"inherit", outline:"none", cursor:"pointer", appearance:"none", transition:"border-color .15s", colorScheme:"dark" }}>
                <option value="Todos" style={{ background:"#111" }}>Todos os meses</option>
                {mesesCompletos.map((m,i)=><option key={i} value={String(i+1).padStart(2,"00")} style={{ background:"#111" }}>{m}</option>)}
              </select>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2.5" style={{ position:"absolute", right:8, top:13, pointerEvents:"none" }}><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </div>

          {/* Badge período */}
          <span style={{ marginLeft:"auto", color:C.green, fontSize:12, fontWeight:700, background:"rgba(16,185,129,0.1)", border:"1px solid rgba(16,185,129,0.2)", borderRadius:999, padding:"4px 12px", whiteSpace:"nowrap" }}>
            {periodoLabel}
          </span>

          {/* Mobile: selects empilhados */}
          <div className="rlt-periodo-mob" style={{ display:"flex", gap:8, width:"100%" }}>
            <select value={ano} onChange={e=>{setAno(e.target.value);setMes("Todos");}}
              style={{ flex:1, background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"10px 12px", color:C.green, fontSize:13, fontWeight:700, fontFamily:"inherit", outline:"none", cursor:"pointer", appearance:"none" }}>
              {ANOS_DISP.map(a=><option key={a} value={a} style={{ background:"#111" }}>{a}</option>)}
            </select>
            <select value={mes} onChange={e=>setMes(e.target.value)}
              style={{ flex:2, background:C.card, border:`1px solid ${mes==="Todos"?C.border:C.green}`, borderRadius:10, padding:"10px 12px", color:mes==="Todos"?C.muted:C.green, fontSize:13, fontWeight:700, fontFamily:"inherit", outline:"none", cursor:"pointer", appearance:"none" }}>
              <option value="Todos" style={{ background:"#111" }}>Todos os meses</option>
              {mesesCompletos.map((m,i)=><option key={i} value={String(i+1).padStart(2,"00")} style={{ background:"#111" }}>{m}</option>)}
            </select>
          </div>

        </div>


        {/* Financial KPI cards */}
        <div className="rlt-fin-grid" style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:12 }}>
          {finCards.map((fc,i)=>(
            <div key={i} className="rlt-card" style={{ background:C.card, border:`1px solid ${C.border}`, borderTop:`3px solid ${fc.color}`, padding:16, animationDelay:`${i*0.05}s` }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                <div style={{ width:30, height:30, borderRadius:8, background:`${fc.color}1a`, display:"flex", alignItems:"center", justifyContent:"center", color:fc.color }}>
                  {fc.icon}
                </div>
                <span style={{ color:C.muted, fontSize:11, fontWeight:600, lineHeight:1.3 }}>{fc.label}</span>
              </div>
              <p style={{ color:fc.color, fontSize:18, fontWeight:800, margin:0, letterSpacing:"-0.02em" }}>{fc.value}</p>
              <p style={{ color:C.dim, fontSize:11, margin:"4px 0 0" }}>{fc.delta}</p>
            </div>
          ))}
        </div>

        {/* Main grid: chart + ops */}
        <div className="rlt-main-grid" style={{ display:"flex", gap:14, alignItems:"flex-start" }}>

          {/* Chart */}
          <div className="rlt-card" style={{ flex:2, background:C.card, border:`1px solid ${C.border}`, padding:20, minWidth:0, animationDelay:"0.2s" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16, flexWrap:"wrap", gap:8 }}>
              <div>
                <p style={{ color:C.text, fontSize:15, fontWeight:700, margin:0 }}>Faturamento — {periodoLabel}</p>
                <p style={{ color:C.dim, fontSize:12, margin:"4px 0 0" }}>Evolução ao longo de {ano}</p>
              </div>
              <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
                {[{color:C.green,label:"Faturamento"},{color:"#60a5fa",label:"Repasses"}].map((l,i)=>(
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:5 }}>
                    <div style={{ width:8, height:8, borderRadius:"50%", background:l.color }} />
                    <span style={{ color:C.muted, fontSize:11 }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <LineChart fat={fatAtivo} rep={repAtivo} ano={ano} mesFiltro={mes} />
          </div>

          {/* Right column: ops cards */}
          <div style={{ width:280, flexShrink:0, display:"flex", flexDirection:"column", gap:12 }}>
            {opsCards.map((op, ci) => (
              <div key={ci} className="rlt-card" style={{ background:C.card, border:`1px solid ${C.border}`, padding:16, animationDelay:`${0.25+ci*0.08}s` }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:op.accent }} />
                  <span style={{ color:C.text, fontSize:13, fontWeight:700 }}>{op.label}</span>
                  <span style={{ color:C.dim, fontSize:12, marginLeft:"auto" }}>{op.items.reduce((a,i)=>a+i.val,0)} total</span>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {op.items.map((item, ii) => (
                    <div key={ii}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                        <span style={{ color:C.muted, fontSize:12 }}>{item.sub}</span>
                        <span style={{ color:C.text, fontSize:12, fontWeight:700 }}>{item.val}</span>
                      </div>
                      <div style={{ height:5, background:"rgba(255,255,255,0.05)", borderRadius:999, overflow:"hidden" }}>
                        <div className="rlt-bar-fill" style={{ height:"100%", width:`${(item.val/item.total)*100}%`, background:item.color, animationDelay:`${0.3+ii*0.1}s` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Top meses */}
            <div className="rlt-card" style={{ background:C.card, border:`1px solid ${C.border}`, padding:16, animationDelay:"0.5s" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:"#facc15" }} />
                <span style={{ color:C.text, fontSize:13, fontWeight:700 }}>Top Meses</span>
              </div>
              {loading ? (
                <span style={{ color:C.dim, fontSize:12 }}>Carregando...</span>
              ) : topMeses.length === 0 ? (
                <span style={{ color:C.dim, fontSize:12 }}>Sem dados no período</span>
              ) : topMeses.map((item,i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:10, marginBottom: i<3 ? 10 : 0 }}>
                  <span style={{ color:C.dim, fontSize:11, width:18, textAlign:"center", fontWeight:700 }}>#{i+1}</span>
                  <span style={{ color:C.muted, fontSize:12, width:28 }}>{item.m}</span>
                  <div style={{ flex:1, height:5, background:"rgba(255,255,255,0.05)", borderRadius:999, overflow:"hidden" }}>
                    <div className="rlt-bar-fill" style={{ height:"100%", width:`${(item.v/topMax)*100}%`, background:`hsl(${160-i*15},70%,${50+i*3}%)`, animationDelay:`${0.5+i*0.1}s` }} />
                  </div>
                  <span style={{ color:C.text, fontSize:11, fontWeight:700, flexShrink:0 }}>R${(item.v/1000).toFixed(1)}K</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
