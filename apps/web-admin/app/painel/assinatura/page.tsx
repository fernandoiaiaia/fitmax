"use client";
import { useState, useEffect } from "react";
import {
  fetchAssinaturas, criarPlano, togglePlano, excluirPlano,
  type PlanoItem, type PlanoPeriodo, type PlanoAudiencia,
} from "../../../lib/assinaturas-api";

const C = { bg:"#111111",card:"#1a1a1a",hover:"#222222",border:"#27272a",text:"#fafafa",muted:"#a1a1aa",dim:"#71717a",green:"#10b981" };

type Periodo = "Mensal"|"Trimestral"|"Semestral"|"Anual";
interface Plano { id:string;nome:string;tipo:Periodo;audiencia:PlanoAudiencia;valor:number;consultas:number;taxa:number;ativo:boolean; }

const API_P:Record<PlanoPeriodo,Periodo> = {MENSAL:"Mensal",TRIMESTRAL:"Trimestral",SEMESTRAL:"Semestral",ANUAL:"Anual"};
const UI_P:Record<Periodo,PlanoPeriodo>  = {Mensal:"MENSAL",Trimestral:"TRIMESTRAL",Semestral:"SEMESTRAL",Anual:"ANUAL"};
function fromApi(p:PlanoItem):Plano { return {id:p.id,nome:p.nome,tipo:API_P[p.tipo],audiencia:p.audiencia,valor:p.valor,consultas:p.consultas,taxa:p.taxa,ativo:p.ativo}; }

const pCor:Record<Periodo,string> = {Mensal:"#10b981",Trimestral:"#60a5fa",Semestral:"#a78bfa",Anual:"#facc15"};

const CSS=`
@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes scaleIn{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
.ac{border-radius:12px;transition:border-color .18s,background .18s,transform .18s,box-shadow .18s;animation:fadeUp .3s ease both}
.ac:hover{border-color:#10b981!important;background:#1e1e1e!important;transform:translateY(-1px);box-shadow:0 4px 20px rgba(16,185,129,0.08)}
.ai{background:#141414;border:1px solid #262626;border-radius:10px;height:42px;padding:0 12px;color:#fafafa;font-size:14px;font-family:inherit;outline:none;width:100%;transition:border-color .2s}
.ai:focus{border-color:rgba(16,185,129,0.5)}
.ao{position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:200;display:flex;align-items:center;justify-content:center;padding:16px;animation:fadeIn .2s ease}
.am{background:#1a1a1a;border:1px solid #27272a;border-radius:16px;padding:28px;width:100%;max-width:500px;animation:scaleIn .2s ease}
.bg{background:#10b981;border:none;border-radius:8px;color:white;font-size:13px;font-weight:700;cursor:pointer;padding:9px 20px;font-family:inherit;transition:background .15s}
.bg:hover{background:#0ea370}
.bo{background:transparent;border:1px solid #27272a;border-radius:8px;color:#a1a1aa;font-size:13px;font-weight:600;cursor:pointer;padding:9px 20px;font-family:inherit;transition:all .15s}
.bo:hover{border-color:#10b981;color:#fafafa}
.bd{background:rgba(244,63,94,0.1);border:1px solid rgba(244,63,94,0.3);border-radius:8px;color:#f43f5e;font-size:12px;font-weight:700;cursor:pointer;padding:7px 14px;font-family:inherit;transition:all .15s}
.bd:hover{background:rgba(244,63,94,0.2)}
.bp{flex:1;min-width:80px;padding:8px 4px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s;text-align:center}
.bt{display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:8px;border:none;background:transparent;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .15s}
@media(max-width:680px){.pr{flex-direction:column!important}.sg{grid-template-columns:1fr 1fr!important}}
`;

function SL({children}:{children:string}) {
  return <p style={{color:C.muted,fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",margin:"0 0 8px"}}>{children}</p>;
}
function Toggle({value,onChange,color=C.green}:{value:boolean;onChange:()=>void;color?:string}) {
  return <button role="switch" aria-checked={value} onClick={onChange} style={{width:44,height:24,borderRadius:99,border:"none",cursor:"pointer",background:value?color:"#27272a",position:"relative",transition:"background 0.2s",flexShrink:0}}><span style={{position:"absolute",top:2,left:value?22:2,width:20,height:20,borderRadius:"50%",background:"#fff",transition:"left 0.2s"}}/></button>;
}

function ModalCadastro({audiencia,onClose,onSave}:{audiencia:PlanoAudiencia;onClose:()=>void;onSave:(p:Omit<Plano,"id">)=>Promise<void>}) {
  const [nome,setNome]=useState("");
  const [tipo,setTipo]=useState<Periodo>("Mensal");
  const [valor,setValor]=useState("");
  const [consultas,setConsultas]=useState("");
  const [taxa,setTaxa]=useState("6");
  const [saving,setSaving]=useState(false);
  const [err,setErr]=useState<string|null>(null);
  const save=async()=>{
    if(!nome||!valor)return;
    setSaving(true);setErr(null);
    try{await onSave({nome,tipo,audiencia,valor:Number(valor),consultas:0,taxa:Number(taxa),ativo:true});onClose();}
    catch(e:any){setErr(e?.response?.data?.error??"Erro ao criar plano.");}
    finally{setSaving(false);}
  };
  const label = audiencia==="CLIENTE"?"Clientes":"Profissionais";
  return (
    <div className="ao" onClick={onClose}>
      <div className="am" onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
          <div style={{width:40,height:40,borderRadius:10,background:`rgba(${audiencia==="PROFISSIONAL"?"168,85,247":"16,185,129"},0.12)`,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={audiencia==="PROFISSIONAL"?"#a855f7":"#10b981"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </div>
          <div>
            <h2 style={{color:C.text,fontSize:18,fontWeight:700,margin:0}}>Novo Plano — {label}</h2>
            <p style={{color:C.muted,fontSize:13,margin:"2px 0 0"}}>Será ativado imediatamente.</p>
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div><SL>Nome do plano</SL><input className="ai" value={nome} onChange={e=>setNome(e.target.value)} placeholder="Ex: Plano Ouro"/></div>
          <div>
            <SL>Período</SL>
            <div style={{display:"flex",gap:6}}>
              {(["Mensal","Trimestral","Semestral","Anual"] as Periodo[]).map(t=>{
                const a=tipo===t,c=pCor[t];
                return <button key={t} onClick={()=>setTipo(t)} className="bp" style={{border:`1px solid ${a?c:C.border}`,background:a?`${c}18`:"transparent",color:a?c:C.muted}}>{t}</button>;
              })}
            </div>
          </div>
          <div style={{display:"flex",gap:10}}>
            <div style={{flex:1}}><SL>Valor (R$)</SL><input className="ai" type="number" value={valor} onChange={e=>setValor(e.target.value)} placeholder="0"/></div>
            <div style={{flex:1}}><SL>Taxa (%)</SL><input className="ai" type="number" value={taxa} onChange={e=>setTaxa(e.target.value)} placeholder="6"/></div>
          </div>
          {err&&<div style={{background:"rgba(244,63,94,0.08)",border:"1px solid rgba(244,63,94,0.3)",borderRadius:8,padding:"8px 12px",color:"#f43f5e",fontSize:12}}>{err}</div>}
          <div style={{height:1,background:C.border}}/>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
            <button className="bo" onClick={onClose} disabled={saving}>Cancelar</button>
            <button className="bg" onClick={save} disabled={saving||!nome||!valor} style={{opacity:saving||!nome||!valor?0.6:1,display:"flex",alignItems:"center",gap:6}}>
              {saving&&<svg style={{animation:"spin 0.8s linear infinite"}} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>}
              {saving?"Salvando...":"Confirmar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModalDelete({plano,onClose,onConfirm}:{plano:Plano;onClose:()=>void;onConfirm:()=>void}) {
  return (
    <div className="ao" onClick={onClose}>
      <div className="am" style={{maxWidth:420}} onClick={e=>e.stopPropagation()}>
        <div style={{width:44,height:44,borderRadius:10,background:"rgba(244,63,94,0.12)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:16}}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
        </div>
        <h2 style={{color:C.text,fontSize:18,fontWeight:700,margin:"0 0 6px"}}>Excluir {plano.nome}</h2>
        <p style={{color:C.muted,fontSize:13,margin:"0 0 20px"}}>Esta ação não pode ser desfeita.</p>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
          <button className="bo" onClick={onClose}>Cancelar</button>
          <button onClick={onConfirm} style={{background:"#f43f5e",border:"none",borderRadius:8,color:"white",fontSize:13,fontWeight:700,cursor:"pointer",padding:"9px 20px",fontFamily:"inherit"}}>Excluir</button>
        </div>
      </div>
    </div>
  );
}

function PlanosTab({audiencia}:{audiencia:PlanoAudiencia}) {
  const [planos,setPlanos]=useState<Plano[]>([]);
  const [stats,setStats]=useState({total:0,ativos:0,inativos:0,receitaPotencial:0});
  const [loading,setLoading]=useState(true);
  const [err,setErr]=useState<string|null>(null);
  const [showModal,setShowModal]=useState(false);
  const [delTarget,setDelTarget]=useState<Plano|null>(null);
  const acColor = audiencia==="PROFISSIONAL"?"#a855f7":"#10b981";

  const reload=()=>{
    setLoading(true);
    fetchAssinaturas(audiencia)
      .then(r=>{setPlanos(r.planos.map(fromApi));setStats(r.stats);})
      .catch(()=>setErr("Erro ao carregar planos."))
      .finally(()=>setLoading(false));
  };
  useEffect(()=>{reload();},[audiencia]);

  const toggle=async(id:string)=>{
    try{
      const u=await togglePlano(id);
      setPlanos(p=>p.map(x=>x.id===id?fromApi(u):x));
      setStats(s=>{const was=planos.find(x=>x.id===id)?.ativo??false;const d=was?-1:1;return{...s,ativos:s.ativos+d,inativos:s.inativos-d,receitaPotencial:was?s.receitaPotencial-(planos.find(x=>x.id===id)?.valor??0):s.receitaPotencial+u.valor};});
    }catch{setErr("Erro ao alterar status.");}
  };

  const add=async(p:Omit<Plano,"id">)=>{
    const n=await criarPlano({nome:p.nome,tipo:UI_P[p.tipo],audiencia,valor:p.valor,consultas:p.consultas,taxa:p.taxa});
    setPlanos(prev=>[...prev,fromApi(n)]);
    setStats(s=>({...s,total:s.total+1,ativos:s.ativos+1,receitaPotencial:s.receitaPotencial+n.valor}));
  };

  const del=async(id:string)=>{
    try{
      await excluirPlano(id);
      const p=planos.find(x=>x.id===id);
      setPlanos(ps=>ps.filter(x=>x.id!==id));
      setStats(s=>({...s,total:s.total-1,ativos:p?.ativo?s.ativos-1:s.ativos,inativos:!p?.ativo?s.inativos-1:s.inativos,receitaPotencial:p?.ativo?s.receitaPotencial-(p.valor):s.receitaPotencial}));
      setDelTarget(null);
    }catch{setErr("Erro ao excluir.");}
  };

  return (
    <>
      {/* Stats */}
      <div className="sg" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
        {[
          {label:"Total",value:String(stats.total),color:C.text},
          {label:"Ativos",value:String(stats.ativos),color:acColor},
          {label:"Inativos",value:String(stats.inativos),color:C.muted},
          {label:"Receita Potencial",value:`R$ ${stats.receitaPotencial.toFixed(2).replace(".",",")}`,color:"#facc15"},
        ].map((s,i)=>(
          <div key={i} className="ac" style={{background:C.card,border:`1px solid ${C.border}`,borderTop:`3px solid ${s.color}`,padding:16,animationDelay:`${i*0.05}s`}}>
            <p style={{color:C.muted,fontSize:11,fontWeight:600,margin:"0 0 8px"}}>{s.label}</p>
            <p style={{color:s.color,fontSize:s.label==="Receita Potencial"?15:22,fontWeight:800,margin:0}}>{s.value}</p>
          </div>
        ))}
      </div>

      {err&&<div style={{background:"rgba(244,63,94,0.08)",border:"1px solid rgba(244,63,94,0.3)",borderRadius:10,padding:"10px 16px",color:"#f43f5e",fontSize:13,display:"flex",justifyContent:"space-between",alignItems:"center"}}><span>{err}</span><button onClick={()=>setErr(null)} style={{background:"none",border:"none",color:"#f43f5e",cursor:"pointer",fontSize:18}}>×</button></div>}

      {/* List */}
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {loading?Array.from({length:3}).map((_,i)=>(
          <div key={i} className="ac" style={{border:`1px solid ${C.border}`,background:C.card,padding:"16px 18px",display:"flex",gap:16,animationDelay:`${i*0.06}s`}}>
            <div style={{width:44,height:44,borderRadius:12,background:"#222"}}/>
            <div style={{flex:1,display:"flex",flexDirection:"column",gap:8}}><div style={{height:13,borderRadius:4,background:"#222",width:"35%"}}/><div style={{height:10,borderRadius:4,background:"#1e1e1e",width:"55%"}}/></div>
          </div>
        )):planos.length===0?(
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:40,display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
            <span style={{fontSize:32}}>{audiencia==="PROFISSIONAL"?"🏋️":"📋"}</span>
            <span style={{color:C.muted,fontSize:14}}>Nenhum plano cadastrado. Crie o primeiro acima.</span>
          </div>
        ):planos.map((plano,idx)=>{
          const cor=pCor[plano.tipo];
          return (
            <div key={plano.id} className="ac" style={{border:`1px solid ${plano.ativo?cor+"44":C.border}`,background:C.card,opacity:plano.ativo?1:0.7,animationDelay:`${0.2+idx*0.06}s`}}>
              <div className="pr" style={{display:"flex",alignItems:"center",gap:16,padding:"16px 18px"}}>
                <div style={{width:44,height:44,borderRadius:12,background:`${cor}18`,border:`1px solid ${cor}44`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={cor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                    <span style={{color:C.text,fontSize:14,fontWeight:700}}>{plano.nome}</span>
                    <span style={{color:cor,fontSize:10,fontWeight:700,background:`${cor}18`,borderRadius:999,padding:"2px 10px",border:`1px solid ${cor}33`}}>{plano.tipo.toUpperCase()}</span>
                    {!plano.ativo&&<span style={{color:C.muted,fontSize:10,fontWeight:600,background:"rgba(255,255,255,0.05)",borderRadius:999,padding:"2px 8px"}}>INATIVO</span>}
                  </div>
                  <p style={{color:C.dim,fontSize:12,margin:"4px 0 0"}}>{plano.consultas} consultas · Taxa {plano.taxa}%</p>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <p style={{color:cor,fontSize:18,fontWeight:800,margin:0}}>R$ {plano.valor}<span style={{color:C.muted,fontSize:11,fontWeight:400}}>/{plano.tipo==="Mensal"?"mês":plano.tipo==="Anual"?"ano":"per."}</span></p>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                  <button className="bt" onClick={()=>toggle(plano.id)} style={{color:plano.ativo?acColor:C.muted,background:plano.ativo?`rgba(${audiencia==="PROFISSIONAL"?"168,85,247":"16,185,129"},0.08)`:"rgba(255,255,255,0.04)",border:`1px solid ${plano.ativo?`rgba(${audiencia==="PROFISSIONAL"?"168,85,247":"16,185,129"},0.2)`:C.border}`}}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {plano.ativo?<><rect x="1" y="5" width="22" height="14" rx="7"/><circle cx="16" cy="12" r="3" fill="currentColor" stroke="none"/></>:<><rect x="1" y="5" width="22" height="14" rx="7"/><circle cx="8" cy="12" r="3" fill="currentColor" stroke="none"/></>}
                    </svg>
                    {plano.ativo?"Ativo":"Inativo"}
                  </button>
                  <button className="bd" onClick={()=>setDelTarget(plano)}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showModal&&<ModalCadastro audiencia={audiencia} onClose={()=>setShowModal(false)} onSave={add}/>}
      {delTarget&&<ModalDelete plano={delTarget} onClose={()=>setDelTarget(null)} onConfirm={()=>del(delTarget.id)}/>}

      {/* FAB / Add button inline */}
      <div style={{display:"flex",justifyContent:"flex-end",marginTop:4}}>
        <button className="bg" onClick={()=>setShowModal(true)} style={{background:acColor,display:"flex",alignItems:"center",gap:8}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Cadastrar Plano
        </button>
      </div>
    </>
  );
}

export default function AssinaturaPage() {
  const [aba,setAba]=useState<PlanoAudiencia>("CLIENTE");
  const abas:[PlanoAudiencia,string,string][]=[["CLIENTE","👤 Clientes","#10b981"],["PROFISSIONAL","🏋️ Profissionais","#a855f7"]];
  return (
    <>
      <style>{CSS}</style>
      <div style={{width:"100%",maxWidth:1200,margin:"0 auto",paddingBottom:32,display:"flex",flexDirection:"column",gap:20}}>

        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{width:44,height:44,borderRadius:12,background:"rgba(16,185,129,0.12)",border:"1px solid rgba(16,185,129,0.25)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
            </div>
            <div>
              <h2 style={{color:C.text,fontSize:22,fontWeight:700,margin:0,letterSpacing:"-0.02em"}}>Planos de Assinatura</h2>
              <p style={{color:C.muted,fontSize:13,margin:"3px 0 0"}}>Gerencie planos de clientes e profissionais</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{display:"flex",gap:4,borderBottom:`1px solid ${C.border}`,paddingBottom:0}}>
          {abas.map(([id,label,cor])=>{
            const active=aba===id;
            return (
              <button key={id} onClick={()=>setAba(id)} style={{padding:"10px 20px",background:"transparent",border:"none",borderBottom:`2px solid ${active?cor:"transparent"}`,color:active?cor:C.muted,fontSize:14,fontWeight:active?700:500,cursor:"pointer",fontFamily:"inherit",transition:"all .15s",marginBottom:-1}}>
                {label}
              </button>
            );
          })}
        </div>

        <PlanosTab key={aba} audiencia={aba}/>

        {/* Info card */}
        <div style={{border:"1px solid rgba(16,185,129,0.2)",background:"rgba(16,185,129,0.04)",borderRadius:12,padding:16,display:"flex",alignItems:"center",gap:16}}>
          <div style={{width:36,height:36,borderRadius:10,background:"rgba(16,185,129,0.12)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <div>
            <p style={{color:C.text,fontSize:13,fontWeight:600,margin:0}}>Taxa de serviço padrão: <span style={{color:C.green}}>6% por consulta realizada</span></p>
            <p style={{color:C.dim,fontSize:12,margin:"3px 0 0"}}>Aplicada sobre cada consulta ao calcular o repasse ao profissional.</p>
          </div>
        </div>

      </div>
    </>
  );
}
