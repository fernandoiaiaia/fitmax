//@ts-nocheck
"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";

const S = `
@keyframes gfadeUp {
  from { opacity:0; transform:translateY(14px); }
  to   { opacity:1; transform:translateY(0); }
}
.g-page { animation: gfadeUp 0.3s ease; }
.g-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px;
  padding: 24px;
}
.g-tabs { display:flex; gap:8px; margin-bottom:0; flex-wrap:wrap; }
.g-tab {
  padding: 8px 18px; border-radius: 10px; font-size:13px; font-weight:700;
  background:rgba(255,255,255,0.04); border:1.5px solid rgba(255,255,255,0.1);
  color:#a1a1aa; cursor:pointer; font-family:inherit; transition:all 0.15s;
}
.g-tab.active { background:rgba(16,185,129,0.15); border-color:#10b981; color:#10b981; }
.g-tab:hover:not(.active) { background:rgba(255,255,255,0.08); color:#e4e4e7; }
.g-cal-grid { display:grid; grid-template-columns:repeat(7,1fr); gap:4px; margin-top:8px; }
.g-cal-head { font-size:11px; font-weight:600; color:#71717a; text-align:center; padding:4px 0; }
.g-cal-day {
  aspect-ratio:1; border-radius:8px; display:flex; align-items:center; justify-content:center;
  font-size:13px; cursor:pointer; color:#a1a1aa; transition:all 0.15s;
  border:1px solid transparent;
}
.g-cal-day:hover:not(.empty):not(.disabled) { background:rgba(16,185,129,0.1); color:#10b981; }
.g-cal-day.active { background:#10b981; color:#fff; font-weight:700; }
.g-cal-day.today { border-color:rgba(16,185,129,0.4); color:#10b981; }
.g-cal-day.empty { cursor:default; }
.g-slot {
  display:flex; align-items:center; justify-content:space-between;
  padding:10px 14px; border-radius:10px;
  border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.02);
  margin-bottom:8px;
}
.g-toggle {
  width:40px; height:22px; border-radius:99px; position:relative; cursor:pointer;
  border:none; transition:background 0.2s; flex-shrink:0;
}
.g-toggle-knob {
  position:absolute; top:3px; width:16px; height:16px; border-radius:50%;
  background:#fff; transition:left 0.2s;
}
.g-btn-primary {
  display:inline-flex; align-items:center; justify-content:center; gap:6px;
  padding:11px 22px; border-radius:11px; font-size:14px; font-weight:700;
  background:linear-gradient(135deg,#10b981 0%,#059669 100%);
  border:none; color:#fff; cursor:pointer; font-family:inherit; transition:all 0.15s;
  box-shadow:0 4px 14px rgba(16,185,129,0.25);
}
.g-btn-primary:hover { transform:translateY(-1px); box-shadow:0 6px 20px rgba(16,185,129,0.35); }
.g-btn-ghost {
  display:inline-flex; align-items:center; justify-content:center; gap:6px;
  padding:11px 18px; border-radius:11px; font-size:14px; font-weight:600;
  background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1);
  color:#a1a1aa; cursor:pointer; font-family:inherit; transition:all 0.15s;
}
.g-btn-ghost:hover { background:rgba(255,255,255,0.08); color:#e4e4e7; }
.g-field {
  background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1);
  border-radius:10px; padding:10px 12px; color:#f4f4f5; font-size:14px;
  font-family:inherit; outline:none; width:100%; box-sizing:border-box;
  transition:border-color 0.15s;
}
.g-field:focus { border-color:#10b981; }
.g-field::placeholder { color:#52525b; }
.g-label { font-size:11px; font-weight:600; color:#71717a; letter-spacing:0.04em; text-transform:uppercase; margin-bottom:4px; display:block; }
.g-blq-row {
  display:flex; align-items:center; justify-content:space-between;
  padding:12px 16px; border-radius:12px;
  border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.02);
  margin-bottom:8px; flex-wrap:wrap; gap:12px;
}
.g-rm-btn {
  width:28px; height:28px; border-radius:8px; background:rgba(244,63,94,0.1);
  border:1px solid rgba(244,63,94,0.25); color:#f43f5e; cursor:pointer;
  display:flex; align-items:center; justify-content:center; font-size:16px;
  font-family:inherit; transition:all 0.15s; flex-shrink:0;
}
.g-rm-btn:hover { background:rgba(244,63,94,0.2); }
.g-seg { display:flex; border-radius:10px; overflow:hidden; border:1px solid rgba(255,255,255,0.12); flex-wrap:wrap; }
.g-seg-btn {
  flex:1; padding:9px 0; font-size:13px; font-weight:600; background:transparent;
  border:none; color:#71717a; cursor:pointer; font-family:inherit; transition:all 0.15s; min-width:80px;
}
.g-seg-btn.active { background:rgba(16,185,129,0.15); color:#10b981; }
.g-success-box {
  background:rgba(16,185,129,0.07); border:1px solid rgba(16,185,129,0.25);
  border-radius:12px; padding:14px 16px; text-align:center;
  animation: gfadeUp 0.3s ease;
}
`;

const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const WDAYS = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
const MOTIVOS = ["Férias","Feriado","Evento","Outro"];
const DURACOES = ["30min","45min","60min","90min"];
const INTERVALOS = ["0min","10min","15min","20min"];
const MODALIDADES = ["Presencial","Online","Ambas"];

function buildCal(y:number, m:number) {
  const fd = new Date(y,m,1).getDay();
  const dm = new Date(y,m+1,0).getDate();
  const days:(number|null)[] = [];
  for(let i=0;i<fd;i++) days.push(null);
  for(let d=1;d<=dm;d++) days.push(d);
  return days;
}

const DEFAULT_SLOTS = [
  {hora:"08:00",on:false,consulta:null},
  {hora:"09:00",on:true, consulta:"Fernanda Lima"},
  {hora:"10:00",on:true, consulta:null},
  {hora:"11:00",on:true, consulta:"Guilherme Augusto"},
  {hora:"12:00",on:false,consulta:null},
  {hora:"13:00",on:false,consulta:null},
  {hora:"14:00",on:true, consulta:null},
  {hora:"15:00",on:true, consulta:null},
  {hora:"16:00",on:true, consulta:null},
  {hora:"17:00",on:false,consulta:null},
  {hora:"18:00",on:false,consulta:null},
];

function Toggle({on, disabled, onToggle}:{on:boolean; disabled:boolean; onToggle:()=>void}) {
  return (
    <button
      className="g-toggle"
      onClick={disabled ? undefined : onToggle}
      style={{background: on ? "#10b981" : "rgba(255,255,255,0.1)", cursor: disabled ? "not-allowed" : "pointer"}}
    >
      <div className="g-toggle-knob" style={{left: on ? "21px" : "3px"}} />
    </button>
  );
}

function AbaDisponibilidade() {
  const today = new Date();
  const [cy, setCy] = useState(today.getFullYear());
  const [cm, setCm] = useState(today.getMonth());
  const [selDay, setSelDay] = useState<number|null>(today.getDate());
  const [slots, setSlots] = useState(DEFAULT_SLOTS.map(s=>({...s})));
  const [novoHor, setNovoHor] = useState("");
  const [saved, setSaved] = useState(false);

  const days = buildCal(cy, cm);

  function toggleSlot(i:number) {
    setSlots(prev => prev.map((s,idx) => idx===i ? {...s,on:!s.on} : s));
    setSaved(false);
  }
  function addHorario() {
    if(!novoHor) return;
    if(slots.find(s=>s.hora===novoHor)) return;
    setSlots(prev => [...prev, {hora:novoHor,on:true,consulta:null}].sort((a,b)=>a.hora.localeCompare(b.hora)));
    setNovoHor("");
    setSaved(false);
  }
  function applyPadrao() {
    setSlots(DEFAULT_SLOTS.map(s=>({...s})));
    setSaved(false);
  }
  function save() { setSaved(true); setTimeout(()=>setSaved(false),2500); }

  return (
    <div>
      {/* Calendário */}
      <div className="g-card" style={{marginBottom:16}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
          <button className="g-btn-ghost" style={{padding:"6px 12px",fontSize:13}} onClick={()=>{
            let nm=cm-1, ny=cy;
            if(nm<0){nm=11;ny--;}
            setCm(nm); setCy(ny);
          }}>‹</button>
          <span style={{color:"#f4f4f5",fontWeight:700,fontSize:15}}>{MONTHS[cm]} {cy}</span>
          <button className="g-btn-ghost" style={{padding:"6px 12px",fontSize:13}} onClick={()=>{
            let nm=cm+1, ny=cy;
            if(nm>11){nm=0;ny++;}
            setCm(nm); setCy(ny);
          }}>›</button>
        </div>
        <div className="g-cal-grid">
          {WDAYS.map(d=><div key={d} className="g-cal-head">{d}</div>)}
          {days.map((d,i)=>{
            const isToday = d!==null && d===today.getDate() && cm===today.getMonth() && cy===today.getFullYear();
            const active = d!==null && d===selDay;
            return (
              <div key={i}
                className={`g-cal-day${d===null?" empty":""}${isToday?" today":""}${active?" active":""}`}
                onClick={()=>d!==null && setSelDay(d)}
              >{d}</div>
            );
          })}
        </div>
      </div>

      {/* Painel de horários do dia selecionado */}
      {selDay && (
        <div className="g-card">
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:8}}>
            <span style={{color:"#f4f4f5",fontWeight:700,fontSize:15}}>
              Horários — {String(selDay).padStart(2,"0")}/{String(cm+1).padStart(2,"0")}/{cy}
            </span>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <button className="g-btn-ghost" style={{padding:"7px 14px",fontSize:12}} onClick={applyPadrao}>
                Aplicar Padrão
              </button>
              <button className="g-btn-primary" style={{padding:"7px 16px",fontSize:12}} onClick={save}>
                💾 Salvar
              </button>
            </div>
          </div>

          {saved && (
            <div className="g-success-box" style={{marginBottom:12}}>
              <span style={{color:"#10b981",fontWeight:700}}>✓ Disponibilidade salva com sucesso!</span>
            </div>
          )}

          {slots.map((s,i)=>(
            <div key={s.hora} className="g-slot">
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{color:"#a1a1aa",fontSize:13,fontWeight:600,minWidth:50}}>{s.hora}</span>
                {s.consulta ? (
                  <span style={{
                    background:"rgba(96,165,250,0.12)",border:"1px solid rgba(96,165,250,0.3)",
                    borderRadius:99,padding:"2px 10px",fontSize:11,fontWeight:700,color:"#60a5fa"
                  }}>👤 {s.consulta}</span>
                ) : s.on ? (
                  <span style={{color:"#10b981",fontSize:12,fontWeight:600}}>Disponível</span>
                ) : (
                  <span style={{color:"#52525b",fontSize:12}}>Bloqueado</span>
                )}
              </div>
              <Toggle on={s.on} disabled={!!s.consulta} onToggle={()=>toggleSlot(i)} />
            </div>
          ))}

          <div style={{display:"flex",gap:8,marginTop:12}}>
            <input
              type="time" value={novoHor} onChange={e=>setNovoHor(e.target.value)}
              className="g-field" style={{flex:1,colorScheme:"dark"}}
            />
            <button className="g-btn-primary" style={{padding:"10px 16px",fontSize:13,flexShrink:0}} onClick={addHorario}>
              + Adicionar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AbaBloqueios() {
  const [bloqueios, setBloqueios] = useState([
    {id:1, tipo:"Período", de:"2026-06-01", ate:"2026-06-07", motivo:"Férias"},
    {id:2, tipo:"Dia",     de:"2026-05-30", ate:"2026-05-30", motivo:"Feriado"},
  ]);
  const [form, setForm] = useState(false);
  const [tipo, setTipo] = useState<"Dia"|"Período">("Dia");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [motivo, setMotivo] = useState("Férias");

  function add() {
    if(!de) return;
    setBloqueios(prev=>[...prev,{
      id: Date.now(), tipo, de, ate: tipo==="Dia" ? de : ate, motivo
    }]);
    setDe(""); setAte(""); setForm(false);
  }

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <span style={{color:"#f4f4f5",fontWeight:700,fontSize:15}}>Dias e Períodos Bloqueados</span>
        <button className="g-btn-primary" style={{padding:"8px 16px",fontSize:13}} onClick={()=>setForm(v=>!v)}>
          {form ? "✕ Cancelar" : "+ Novo Bloqueio"}
        </button>
      </div>

      {form && (
        <div className="g-card" style={{marginBottom:16}}>
          <div style={{marginBottom:12}}>
            <label className="g-label">Tipo</label>
            <div className="g-seg">
              {(["Dia","Período"] as const).map(t=>(
                <button key={t} className={`g-seg-btn${tipo===t?" active":""}`} onClick={()=>setTipo(t)}>{t}</button>
              ))}
            </div>
          </div>
          <div style={{display:"flex",gap:10,marginBottom:12,flexWrap:"wrap"}}>
            <div style={{flex:1,minWidth:120}}>
              <label className="g-label">{tipo==="Dia" ? "Data" : "De"}</label>
              <input type="date" value={de} onChange={e=>setDe(e.target.value)} className="g-field" style={{colorScheme:"dark"}} />
            </div>
            {tipo==="Período" && (
              <div style={{flex:1,minWidth:120}}>
                <label className="g-label">Até</label>
                <input type="date" value={ate} onChange={e=>setAte(e.target.value)} className="g-field" style={{colorScheme:"dark"}} />
              </div>
            )}
          </div>
          <div style={{marginBottom:16}}>
            <label className="g-label">Motivo</label>
            <select value={motivo} onChange={e=>setMotivo(e.target.value)} className="g-field" style={{colorScheme:"dark"}}>
              {MOTIVOS.map(m=><option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <button className="g-btn-primary" onClick={add} style={{width:"100%"}}>Confirmar Bloqueio</button>
        </div>
      )}

      {bloqueios.length === 0 ? (
        <div className="g-card" style={{textAlign:"center",padding:"40px 24px"}}>
          <div style={{fontSize:32,marginBottom:8}}>📭</div>
          <span style={{color:"#71717a",fontSize:14}}>Nenhum bloqueio cadastrado.</span>
        </div>
      ) : bloqueios.map(b=>(
        <div key={b.id} className="g-blq-row">
          <div>
            <div style={{color:"#f4f4f5",fontWeight:700,fontSize:14}}>
              {b.motivo}
              <span style={{
                marginLeft:8,background:"rgba(244,63,94,0.1)",border:"1px solid rgba(244,63,94,0.25)",
                borderRadius:99,padding:"2px 9px",fontSize:11,color:"#f43f5e",fontWeight:700
              }}>{b.tipo}</span>
            </div>
            <div style={{color:"#71717a",fontSize:12,marginTop:3}}>
              {b.de === b.ate ? b.de : `${b.de} → ${b.ate}`}
            </div>
          </div>
          <button className="g-rm-btn" onClick={()=>setBloqueios(prev=>prev.filter(x=>x.id!==b.id))}>✕</button>
        </div>
      ))}
    </div>
  );
}

function AbaConfiguracoes() {
  const [duracao, setDuracao] = useState("60min");
  const [intervalo, setIntervalo] = useState("10min");
  const [modal, setModal] = useState("Ambas");
  const [inicio, setInicio] = useState("08:00");
  const [fim, setFim] = useState("18:00");
  const [saved, setSaved] = useState(false);

  function save() {
    setSaved(true);
    setTimeout(()=>setSaved(false), 2500);
  }

  return (
    <div className="g-card">
      <div style={{marginBottom:20}}>
        <label className="g-label">Duração Padrão da Consulta</label>
        <div className="g-seg">
          {DURACOES.map(d=>(
            <button key={d} className={`g-seg-btn${duracao===d?" active":""}`} onClick={()=>setDuracao(d)}>{d}</button>
          ))}
        </div>
      </div>

      <div style={{marginBottom:20}}>
        <label className="g-label">Intervalo Entre Consultas</label>
        <div className="g-seg">
          {INTERVALOS.map(v=>(
            <button key={v} className={`g-seg-btn${intervalo===v?" active":""}`} onClick={()=>setIntervalo(v)}>{v}</button>
          ))}
        </div>
      </div>

      <div style={{marginBottom:20}}>
        <label className="g-label">Modalidade Padrão</label>
        <div className="g-seg">
          {MODALIDADES.map(m=>(
            <button key={m} className={`g-seg-btn${modal===m?" active":""}`} onClick={()=>setModal(m)}>{m}</button>
          ))}
        </div>
      </div>

      <div style={{display:"flex",gap:12,marginBottom:24,flexWrap:"wrap"}}>
        <div style={{flex:1,minWidth:120}}>
          <label className="g-label">Início da Agenda</label>
          <input type="time" value={inicio} onChange={e=>setInicio(e.target.value)} className="g-field" style={{colorScheme:"dark"}} />
        </div>
        <div style={{flex:1,minWidth:120}}>
          <label className="g-label">Fim da Agenda</label>
          <input type="time" value={fim} onChange={e=>setFim(e.target.value)} className="g-field" style={{colorScheme:"dark"}} />
        </div>
      </div>

      {saved && (
        <div className="g-success-box" style={{marginBottom:16}}>
          <span style={{color:"#10b981",fontWeight:700}}>✓ Configurações salvas com sucesso!</span>
        </div>
      )}

      <button className="g-btn-primary" style={{width:"100%"}} onClick={save}>
        💾 Salvar Configurações
      </button>
    </div>
  );
}

type Tab = "disponibilidade" | "bloqueios" | "configuracoes";

function GerenciarInner() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("disponibilidade");

  return (
    <>
      <style>{S}</style>
      <div style={{ flex: 1, overflowY: "auto", backgroundColor: "#09090b" }}>
        <div
          className="g-page"
          style={{
            padding: "1.5rem 2rem",
            maxWidth: 800,
            margin: "0 auto",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 20
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => router.push("/painel/agenda")}
              style={{
                background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)",
                borderRadius:10, width:38, height:38, display:"flex", alignItems:"center",
                justifyContent:"center", cursor:"pointer", color:"#a1a1aa", flexShrink:0,
                transition:"all 0.15s",
              }}
              onMouseEnter={e=>{ e.currentTarget.style.borderColor="#10b981"; e.currentTarget.style.color="#10b981"; }}
              onMouseLeave={e=>{ e.currentTarget.style.borderColor="rgba(255,255,255,0.1)"; e.currentTarget.style.color="#a1a1aa"; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
              </svg>
            </button>
            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <h2 style={{ color: "#fafafa", fontSize: 24, fontWeight: "bold", margin: 0 }}>Gerenciar Disponibilidade</h2>
              <span style={{ color: "#a1a1aa", fontSize: 13 }}>Dr. Rafael Costa · Cardiologista</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="g-tabs">
            <button className={`g-tab${tab==="disponibilidade"?" active":""}`} onClick={()=>setTab("disponibilidade")}>🗓 Disponibilidade</button>
            <button className={`g-tab${tab==="bloqueios"?" active":""}`} onClick={()=>setTab("bloqueios")}>🚫 Bloqueios</button>
            <button className={`g-tab${tab==="configuracoes"?" active":""}`} onClick={()=>setTab("configuracoes")}>⚙️ Configurações</button>
          </div>

          {/* Content */}
          {tab === "disponibilidade" && <AbaDisponibilidade />}
          {tab === "bloqueios"       && <AbaBloqueios />}
          {tab === "configuracoes"   && <AbaConfiguracoes />}

        </div>
      </div>
    </>
  );
}

export default function GerenciarPage() {
  return (
    <Suspense fallback={null}>
      <GerenciarInner />
    </Suspense>
  );
}
