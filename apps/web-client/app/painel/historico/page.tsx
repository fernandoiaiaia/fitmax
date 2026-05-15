//@ts-nocheck
"use client";

import { useState } from "react";

const C = { bg:"#111111", color2:"#1a1a1a", color3:"#222222", color10:"#71717a", color11:"#a1a1aa", color12:"#fafafa", border:"#27272a" };

type StatusAvaliacao = "avaliado" | "pendente" | "nao_avaliavel";
interface ConsultaHistorico {
  id: number; data: string; dataISO: string; horario: string;
  nome: string; especialidade: string; modalidade: "Presencial" | "Online";
  avatar: string; valor: string; statusAvaliacao: StatusAvaliacao; nota?: number;
}

const historico: ConsultaHistorico[] = [
  { id:1, data:"15/02/2026", dataISO:"2026-02", horario:"14:30", nome:"Dra. Letícia Marques",  especialidade:"Endocrinologia",     modalidade:"Presencial", avatar:"https://picsum.photos/200/200?random=50", valor:"R$ 320", statusAvaliacao:"pendente" },
  { id:2, data:"14/02/2026", dataISO:"2026-02", horario:"09:00", nome:"Dr. Roberto Alves",     especialidade:"Ortopedia",          modalidade:"Presencial", avatar:"https://picsum.photos/200/200?random=21", valor:"R$ 280", statusAvaliacao:"avaliado", nota:5 },
  { id:3, data:"13/02/2026", dataISO:"2026-02", horario:"11:00", nome:"Dra. Ana Souza",        especialidade:"Nutrição",           modalidade:"Online",     avatar:"https://picsum.photos/200/200?random=23", valor:"R$ 180", statusAvaliacao:"avaliado", nota:5 },
  { id:4, data:"12/02/2026", dataISO:"2026-02", horario:"16:00", nome:"Bruno Silva",           especialidade:"Medicina Esportiva", modalidade:"Online",     avatar:"https://picsum.photos/200/200?random=25", valor:"R$ 220", statusAvaliacao:"avaliado", nota:4 },
  { id:5, data:"01/02/2026", dataISO:"2026-02", horario:"08:00", nome:"Dr. Vinícius Almeida",  especialidade:"Nutrologia",         modalidade:"Online",     avatar:"https://picsum.photos/200/200?random=60", valor:"R$ 250", statusAvaliacao:"pendente" },
  { id:6, data:"29/01/2026", dataISO:"2026-01", horario:"09:00", nome:"Marcelo Strong",        especialidade:"Fisioterapia",       modalidade:"Presencial", avatar:"https://picsum.photos/200/200?random=52", valor:"R$ 150", statusAvaliacao:"avaliado", nota:3 },
  { id:7, data:"20/01/2026", dataISO:"2026-01", horario:"14:00", nome:"Dra. Camila Nery",      especialidade:"Personal Trainer",   modalidade:"Presencial", avatar:"https://picsum.photos/200/200?random=22", valor:"R$ 120", statusAvaliacao:"nao_avaliavel" },
  { id:8, data:"10/01/2026", dataISO:"2026-01", horario:"11:30", nome:"Dr. Roberto Alves",     especialidade:"Ortopedia",          modalidade:"Presencial", avatar:"https://picsum.photos/200/200?random=21", valor:"R$ 280", statusAvaliacao:"avaliado", nota:5 },
];

const mesLabels: Record<string,string> = { "2026-02":"Fevereiro 2026", "2026-01":"Janeiro 2026" };
function agruparPorMes(items: ConsultaHistorico[]) {
  const g: Record<string,ConsultaHistorico[]> = {};
  for (const i of items) { if (!g[i.dataISO]) g[i.dataISO]=[]; g[i.dataISO].push(i); }
  return g;
}
const avalCfg = {
  avaliado:      { label:"AVALIADO", bg:"rgba(16,185,129,0.12)",  color:"#10b981" },
  pendente:      { label:"PENDENTE", bg:"rgba(167,139,250,0.12)", color:"#a78bfa" },
  nao_avaliavel: { label:"N/A",      bg:"rgba(161,161,170,0.1)",  color:"#71717a" },
};
const PERIODOS = ["Tudo","Semana","Mês","Ano"];

function StarRow({ nota }: { nota:number }) {
  return (
    <div style={{ display:"flex", gap:2 }}>
      {[1,2,3,4,5].map(i=>(
        <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill={i<=nota?"#facc15":"none"} stroke={i<=nota?"#facc15":"#3f3f46"} strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

function HoverCard({ children, hoverBorder, style }: { children: React.ReactNode; hoverBorder: string; style?: React.CSSProperties }) {
  return (
    <div style={{ border:`1px solid ${C.border}`, backgroundColor:C.color2, borderRadius:12, overflow:"hidden", cursor:"pointer", transition:"background .15s, border-color .15s", ...style }}
      onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.backgroundColor=C.color3;(e.currentTarget as HTMLElement).style.borderColor=hoverBorder;}}
      onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.backgroundColor=C.color2;(e.currentTarget as HTMLElement).style.borderColor=C.border;}}>
      {children}
    </div>
  );
}

function ConsultaCard({ c }: { c:ConsultaHistorico }) {
  const aval = avalCfg[c.statusAvaliacao];
  return (
    <HoverCard hoverBorder="#10b981">
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 16px", borderBottom:`1px solid ${C.border}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ color:C.color10 }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></span>
          <span style={{ color:C.color11, fontSize:12 }}>{c.data}</span>
          <div style={{ width:3, height:3, borderRadius:"50%", backgroundColor:"#52525b" }} />
          <span style={{ color:C.color11, fontSize:12 }}>{c.horario}</span>
        </div>
        <div style={{ background:aval.bg, borderRadius:999, paddingLeft:12, paddingRight:12, paddingTop:3, paddingBottom:3 }}>
          <span style={{ color:aval.color, fontSize:10, fontWeight:"bold" }}>{aval.label}</span>
        </div>
      </div>
      {/* Body */}
      <div style={{ display:"flex", alignItems:"center", gap:12, padding:16 }}>
        <img src={c.avatar} style={{ width:48, height:48, borderRadius:"50%", objectFit:"cover", flexShrink:0 }} alt="" />
        <div style={{ flex:1, display:"flex", flexDirection:"column", gap:4, minWidth:0 }}>
          <span style={{ color:C.color12, fontSize:14, fontWeight:"bold", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.nome}</span>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ color:C.color11, fontSize:12 }}>{c.especialidade}</span>
            <div style={{ width:3, height:3, borderRadius:"50%", backgroundColor:"#52525b" }} />
            <span style={{ color:C.color11, fontSize:12 }}>{c.modalidade}</span>
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
          <span style={{ color:C.color12, fontSize:16, fontWeight:"bold" }}>{c.valor}</span>
        </div>
      </div>
      {/* Footer */}
      <div style={{ display:"flex", padding:"8px 16px", borderTop:`1px solid ${C.border}` }}>
        <button id={`btn-detalhes-${c.id}`} style={{ display:"flex", alignItems:"center", gap:4, background:"none", border:"none", cursor:"pointer", padding:"4px 8px", borderRadius:6 }}
          onMouseEnter={e=>(e.currentTarget as HTMLElement).style.backgroundColor=C.color3}
          onMouseLeave={e=>(e.currentTarget as HTMLElement).style.backgroundColor="transparent"}>
          <span style={{ color:C.color10 }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></span>
          <span style={{ color:C.color11, fontSize:12 }}>Ver detalhes</span>
        </button>
      </div>
    </HoverCard>
  );
}

export default function HistoricoPage() {
  const [periodo, setPeriodo] = useState("Tudo");
  const grupos = agruparPorMes(historico);
  const meses = Object.keys(grupos).sort((a,b)=>b.localeCompare(a));
  const totalGasto = historico.reduce((acc,c)=>acc+parseInt(c.valor.replace(/\D/g,"")),0);
  const avaliados = historico.filter(c=>c.statusAvaliacao==="avaliado").length;
  const pendentes = historico.filter(c=>c.statusAvaliacao==="pendente").length;
  const timeline  = historico.slice().sort((a,b)=>b.id-a.id).slice(0,8);

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
      <div style={{ flex:1, overflowY:"auto", backgroundColor:C.bg }}>
        <div style={{ padding:16, maxWidth:1100, margin:"0 auto", display:"flex", flexDirection:"column", gap:20, width:"100%" }}
          className="sm:p-6">

          {/* Cabeçalho */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12 }}>
            <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
              <h2 style={{ color:C.color12, fontSize:24, fontWeight:"bold", margin:0 }}>Histórico</h2>
              <span style={{ color:C.color11, fontSize:14 }}>Consultas realizadas, avaliações e linha do tempo.</span>
            </div>
            {/* Mobile dropdown */}
            <div className="hist-mob" style={{ display:"none", width:"100%" }}>
              <select value={periodo} onChange={e=>setPeriodo(e.target.value)} style={{ width:"100%", background:C.color2, border:"1px solid rgba(16,185,129,0.4)", borderRadius:12, padding:"12px 16px", color:"#10b981", fontSize:14, fontWeight:"bold", fontFamily:"inherit", outline:"none", cursor:"pointer" }}>
                {PERIODOS.map(p=><option key={p} value={p} style={{ background:C.bg, color:"#fff" }}>{p}</option>)}
              </select>
            </div>
            {/* Desktop pills */}
            <div className="hist-desk" style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {PERIODOS.map(p=>{
                const isActive=periodo===p;
                return (
                  <button key={p} id={`filter-periodo-${p.toLowerCase()}`} onClick={()=>setPeriodo(p)} style={{
                    padding:"6px 16px", borderRadius:999, border:`1px solid ${isActive?"#10b981":C.border}`,
                    backgroundColor:isActive?"rgba(16,185,129,0.1)":"transparent",
                    color:isActive?"#10b981":C.color11, fontSize:13, fontWeight:isActive?"bold":"400",
                    cursor:"pointer", transition:"all .15s", fontFamily:"inherit",
                  }}
                    onMouseEnter={e=>{if(!isActive){(e.currentTarget as HTMLElement).style.backgroundColor=C.color3;(e.currentTarget as HTMLElement).style.borderColor="#10b981";}}}
                    onMouseLeave={e=>{if(!isActive){(e.currentTarget as HTMLElement).style.backgroundColor="transparent";(e.currentTarget as HTMLElement).style.borderColor=C.border;}}}
                  >{p}</button>
                );
              })}
            </div>
          </div>

          {/* Corpo */}
          <div className="hist-body" style={{ display:"flex", gap:20, alignItems:"flex-start" }}>

            {/* Lista */}
            <div className="hist-lista" style={{ flex:2, display:"flex", flexDirection:"column", gap:20, minWidth:280 }}>
              <h2 style={{ color:C.color12, fontSize:20, fontWeight:"bold", margin:0 }}>Consultas Realizadas</h2>
              {meses.map(mk=>{
                const items=grupos[mk]; const label=mesLabels[mk]??mk;
                return (
                  <div key={mk} style={{ display:"flex", flexDirection:"column", gap:12 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                      <span style={{ color:C.color11, fontSize:12, fontWeight:"bold", textTransform:"uppercase", letterSpacing:1, flexShrink:0 }}>{label}</span>
                      <div style={{ flex:1, height:1, backgroundColor:C.border }} />
                      <span style={{ color:C.color10, fontSize:11, flexShrink:0 }}>{items.length} consultas</span>
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                      {items.map(c=><ConsultaCard key={c.id} c={c}/>)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sidebar */}
            <div className="hist-sidebar" style={{ flex:1, display:"flex", flexDirection:"column", gap:16, minWidth:240 }}>

              {/* Linha do Tempo */}
              <HoverCard hoverBorder="#a78bfa">
                <div style={{ height:3, backgroundColor:"#a78bfa" }} />
                <div style={{ padding:16, display:"flex", flexDirection:"column", gap:16 }}>
                  <span style={{ color:C.color11, fontSize:11, fontWeight:"bold", letterSpacing:1, textTransform:"uppercase" }}>Linha do tempo</span>
                  <div>
                    {timeline.map((item,idx)=>{
                      const isLast=idx===timeline.length-1;
                      return (
                        <div key={idx} style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", width:14, flexShrink:0, marginTop:4 }}>
                            <div style={{ width:10, height:10, borderRadius:"50%", border:`2px solid ${C.color2}`, backgroundColor:"#a78bfa", zIndex:2 }} />
                            {!isLast && <div style={{ width:2, height:38, backgroundColor:C.border, marginTop:-2, zIndex:1 }} />}
                          </div>
                          <div style={{ flex:1, paddingBottom:isLast?0:12 }}>
                            <span style={{ color:C.color10, fontSize:11, display:"block" }}>{item.data}</span>
                            <span style={{ color:C.color12, fontSize:13, fontWeight:"500", display:"block" }}>{item.especialidade} · {item.modalidade}</span>
                            <span style={{ color:C.color11, fontSize:12, display:"block" }}>{item.nome}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <button id="btn-ver-historico-completo" style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:4, width:"100%", padding:"10px 0", borderRadius:8, border:`1px solid ${C.border}`, background:"transparent", color:C.color11, fontSize:13, cursor:"pointer", fontFamily:"inherit", transition:"background .15s" }}
                    onMouseEnter={e=>(e.currentTarget as HTMLElement).style.backgroundColor=C.color3}
                    onMouseLeave={e=>(e.currentTarget as HTMLElement).style.backgroundColor="transparent"}>
                    Ver histórico completo
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                  </button>
                </div>
              </HoverCard>

              {/* Resumo Geral */}
              <HoverCard hoverBorder="#10b981" style={{ padding:16 }}>
                <span style={{ color:C.color11, fontSize:11, fontWeight:"bold", letterSpacing:1, textTransform:"uppercase", display:"block", marginBottom:12 }}>Resumo Geral</span>
                {[
                  { label:"Total de consultas",    value:String(historico.length),                   color:C.color12 },
                  { label:"Total investido",        value:`R$ ${totalGasto.toLocaleString("pt-BR")}`, color:"#10b981" },
                  { label:"Avaliações feitas",      value:String(avaliados),                          color:"#a78bfa" },
                  { label:"Pendentes de avaliação", value:String(pendentes),                          color:"#facc15" },
                ].map((item,i,arr)=>(
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
