//@ts-nocheck
"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { api } from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Consulta {
  id: number; hora: string; duracao: number; paciente: string;
  avatar: string; especialidade: string;
  modalidade: "Presencial" | "Online";
  status: "confirmada" | "pendente" | "em_andamento" | "cancelada";
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const WDAYS = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
const DIAS_SEMANA_LABELS = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

const HORARIOS_DIA = [
  { hora:"08:00", disponivel:false },
  { hora:"09:00", disponivel:true  },
  { hora:"10:00", disponivel:true  },
  { hora:"11:00", disponivel:true  },
  { hora:"12:00", disponivel:false },
  { hora:"13:00", disponivel:false },
  { hora:"14:00", disponivel:true  },
  { hora:"15:00", disponivel:true  },
  { hora:"16:00", disponivel:true  },
  { hora:"17:00", disponivel:false },
  { hora:"18:00", disponivel:false },
];

// mock removido

const STATUS_CONFIG = {
  confirmada:   { label:"Confirmada",   bg:"rgba(16,185,129,0.12)", color:"#10b981", border:"rgba(16,185,129,0.3)", dot:"#10b981" },
  pendente:     { label:"Pendente",     bg:"rgba(234,179,8,0.12)",  color:"#facc15", border:"rgba(234,179,8,0.3)",  dot:"#facc15" },
  em_andamento: { label:"Em andamento", bg:"rgba(59,130,246,0.12)", color:"#60a5fa", border:"rgba(59,130,246,0.3)", dot:"#60a5fa" },
  cancelada:    { label:"Cancelada",    bg:"rgba(244,63,94,0.12)",  color:"#f43f5e", border:"rgba(244,63,94,0.3)",  dot:"#f43f5e" },
};

const TODAY = new Date();
function toISO(d:Date){ return d.toISOString().slice(0,10); }
function addDays(d:Date,n:number){ const r=new Date(d); r.setDate(r.getDate()+n); return r; }
function fmtLong(d:Date){ return d.toLocaleDateString("pt-BR",{day:"2-digit",month:"long",year:"numeric"}); }
function fmtWeekDay(d:Date){ return d.toLocaleDateString("pt-BR",{weekday:"long"}); }

function buildCal(y:number,m:number){
  const fd=new Date(y,m,1).getDay();
  const dm=new Date(y,m+1,0).getDate();
  const days:(number|null)[]=[];
  for(let i=0;i<fd;i++) days.push(null);
  for(let d=1;d<=dm;d++) days.push(d);
  return days;
}


// ─── CSS ─────────────────────────────────────────────────────────────────────

const STYLES = `
@keyframes agFadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
@keyframes agScaleIn { from{opacity:0;transform:scale(0.88)} to{opacity:1;transform:scale(1)} }

.ag-tab-bar { display:flex; gap:8px; }
.ag-tab {
  padding:9px 20px; border-radius:12px; font-size:13px; font-weight:700; cursor:pointer;
  background:rgba(255,255,255,0.04); border:1.5px solid rgba(255,255,255,0.1);
  color:#71717a; font-family:inherit; transition:all 0.18s;
}
.ag-tab.active { background:rgba(16,185,129,0.12); border-color:#10b981; color:#10b981; }
.ag-tab:hover:not(.active) { background:rgba(255,255,255,0.07); color:#e4e4e7; }

.ag-panel { animation:agFadeUp 0.28s ease; }

.ag-cal-wrap {
  background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08);
  border-radius:16px; padding:20px;
}
.ag-cal-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; }
.ag-cal-title { font-size:15px; font-weight:700; color:#f4f4f5; }
.ag-cal-nav {
  width:32px; height:32px; border-radius:8px; background:rgba(255,255,255,0.05);
  border:1px solid rgba(255,255,255,0.1); color:#a1a1aa; cursor:pointer;
  font-family:inherit; font-size:16px; display:flex; align-items:center; justify-content:center;
  transition:all 0.15s;
}
.ag-cal-nav:hover { border-color:#10b981; color:#10b981; }
.ag-cal-grid { display:grid; grid-template-columns:repeat(7,1fr); gap:4px; }
.ag-cal-wd { font-size:10px; font-weight:600; color:#52525b; text-align:center; padding:4px 0; text-transform:uppercase; }
.ag-cal-day {
  aspect-ratio:1; border-radius:8px; display:flex; align-items:center; justify-content:center;
  font-size:12px; cursor:pointer; color:#71717a; border:1.5px solid transparent; transition:all 0.15s; position:relative;
}
.ag-cal-day:hover:not(.empty):not(.disabled){ background:rgba(16,185,129,0.1); color:#10b981; }
.ag-cal-day.selected{ background:#10b981; color:#fff; font-weight:700; border-color:#10b981; }
.ag-cal-day.today{ border-color:rgba(16,185,129,0.45); color:#10b981; }
.ag-cal-day.has-disponivel:not(.selected){ background:rgba(16,185,129,0.1); }
.ag-cal-day.has-consulta:not(.selected){ background:rgba(96,165,250,0.12); color:#60a5fa; }
.ag-cal-day.blocked:not(.selected){ background:rgba(255,255,255,0.03); color:#3f3f46; }
.ag-cal-day.empty{ cursor:default; }

.ag-legend { display:flex; gap:12px; flex-wrap:wrap; margin-top:12px; }
.ag-legend-item { display:flex; align-items:center; gap:5px; font-size:11px; color:#71717a; }
.ag-legend-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; }

.ag-slots-wrap {
  background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08);
  border-radius:16px; padding:20px; display:flex; flex-direction:column; gap:8px;
}
.ag-slots-header { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px; margin-bottom:4px; }
.ag-slot-day-title { font-size:14px; font-weight:700; color:#f4f4f5; }
.ag-slot-actions { display:flex; gap:6px; flex-wrap:wrap; }

.ag-slot-btn {
  width:100%; display:flex; align-items:center; justify-content:space-between;
  padding:10px 14px; border-radius:10px; border:1.5px solid rgba(255,255,255,0.08);
  background:rgba(255,255,255,0.02); cursor:pointer; font-family:inherit; transition:all 0.15s;
}
.ag-slot-btn.disponivel{ border-color:rgba(16,185,129,0.3); background:rgba(16,185,129,0.07); }
.ag-slot-btn.disponivel:hover{ background:rgba(16,185,129,0.14); border-color:#10b981; }
.ag-slot-btn.bloqueado{ border-color:rgba(255,255,255,0.06); background:rgba(255,255,255,0.02); }
.ag-slot-btn.bloqueado:hover{ background:rgba(255,255,255,0.06); border-color:rgba(255,255,255,0.15); }
.ag-slot-btn.agendado{ border-color:rgba(96,165,250,0.3); background:rgba(96,165,250,0.08); cursor:not-allowed; }
.ag-slot-btn.highlight{ box-shadow:0 0 0 2.5px #10b981; }
.ag-slot-hora{ font-size:13px; font-weight:700; color:#a1a1aa; min-width:46px; }
.ag-slot-label-disp{ font-size:12px; color:#10b981; font-weight:600; }
.ag-slot-label-blq{ font-size:12px; color:#52525b; }
.ag-slot-label-ag{ font-size:12px; color:#60a5fa; font-weight:600; }
.ag-slot-icon{ font-size:14px; }

.ag-add-row{ display:flex; gap:8px; margin-top:4px; }
.ag-add-input{
  flex:1; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1);
  border-radius:10px; padding:9px 12px; color:#f4f4f5; font-size:13px; font-family:inherit;
  outline:none; transition:border-color 0.15s; min-width:0; color-scheme:dark;
}
.ag-add-input:focus{ border-color:#10b981; }

.ag-recorr-wrap{
  background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08);
  border-radius:16px; padding:20px;
}
.ag-recorr-title{ font-size:13px; font-weight:700; color:#f4f4f5; margin-bottom:14px; }
.ag-days-row{ display:flex; gap:6px; flex-wrap:wrap; margin-bottom:14px; }
.ag-day-pill{
  padding:6px 12px; border-radius:99px; font-size:12px; font-weight:700; cursor:pointer;
  border:1.5px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.04);
  color:#71717a; font-family:inherit; transition:all 0.15s;
}
.ag-day-pill.active{ background:rgba(16,185,129,0.15); border-color:#10b981; color:#10b981; }
.ag-recorr-row{ display:flex; gap:10px; flex-wrap:wrap; align-items:center; margin-bottom:14px; }
.ag-recorr-field-wrap{ display:flex; flex-direction:column; gap:4px; }
.ag-recorr-label{ font-size:10px; font-weight:600; color:#52525b; text-transform:uppercase; letter-spacing:0.04em; }
.ag-recorr-input{
  background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1);
  border-radius:9px; padding:8px 11px; color:#f4f4f5; font-size:13px; font-family:inherit;
  outline:none; width:100px; transition:border-color 0.15s; color-scheme:dark;
}
.ag-recorr-input:focus{ border-color:#10b981; }
.ag-dur-row{ display:flex; gap:6px; flex-wrap:wrap; margin-bottom:16px; }
.ag-dur-btn{
  padding:7px 14px; border-radius:8px; font-size:12px; font-weight:700; cursor:pointer;
  border:1.5px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.04);
  color:#71717a; font-family:inherit; transition:all 0.15s;
}
.ag-dur-btn.active{ background:rgba(16,185,129,0.15); border-color:#10b981; color:#10b981; }

.ag-btn-primary{
  display:inline-flex; align-items:center; justify-content:center; gap:6px;
  padding:10px 20px; border-radius:11px; font-size:13px; font-weight:700;
  background:linear-gradient(135deg,#10b981 0%,#059669 100%);
  border:none; color:#fff; cursor:pointer; font-family:inherit;
  transition:all 0.15s; box-shadow:0 4px 14px rgba(16,185,129,0.22);
}
.ag-btn-primary:hover{ transform:translateY(-1px); box-shadow:0 6px 20px rgba(16,185,129,0.32); }
.ag-btn-sm{
  display:inline-flex; align-items:center; gap:5px;
  padding:6px 13px; border-radius:9px; font-size:11px; font-weight:700;
  background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1);
  color:#a1a1aa; cursor:pointer; font-family:inherit; transition:all 0.15s;
}
.ag-btn-sm:hover{ background:rgba(255,255,255,0.09); color:#e4e4e7; }
.ag-btn-sm.danger{ color:#f43f5e; }
.ag-btn-sm.danger:hover{ background:rgba(244,63,94,0.1); border-color:rgba(244,63,94,0.3); }

.ag-success-flash{
  animation:agScaleIn 0.3s ease;
  background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.25);
  border-radius:10px; padding:10px 14px; text-align:center; font-size:13px;
  font-weight:700; color:#10b981;
}

.ag-detalhe-wrap{
  background:rgba(16,185,129,0.05); border:1.5px solid rgba(16,185,129,0.22);
  border-radius:16px; padding:20px; animation:agFadeUp 0.25s ease;
}
.ag-detalhe-actions{ display:flex; gap:8px; flex-wrap:wrap; margin-top:0; }
.ag-action-btn{
  flex:1; min-width:110px; padding:9px 12px; border-radius:10px; font-size:12px;
  font-weight:700; cursor:pointer; font-family:inherit; transition:all 0.15s;
  border:1.5px solid; display:flex; align-items:center; justify-content:center; gap:5px;
}
.ag-action-btn:disabled{ opacity:0.4; cursor:not-allowed; filter:grayscale(0.7); }
.ag-action-btn.confirmar{ background:rgba(16,185,129,0.1); border-color:rgba(16,185,129,0.3); color:#10b981; }
.ag-action-btn.confirmar:hover{ background:rgba(16,185,129,0.18); border-color:#10b981; }
.ag-action-btn.andamento{ background:rgba(96,165,250,0.1); border-color:rgba(96,165,250,0.3); color:#60a5fa; }
.ag-action-btn.andamento:hover{ background:rgba(96,165,250,0.18); border-color:#60a5fa; }
.ag-action-btn.pendente{ background:rgba(234,179,8,0.1); border-color:rgba(234,179,8,0.3); color:#facc15; }
.ag-action-btn.pendente:hover{ background:rgba(234,179,8,0.18); border-color:#facc15; }
.ag-action-btn.cancelar{ background:rgba(244,63,94,0.08); border-color:rgba(244,63,94,0.25); color:#f43f5e; }
.ag-action-btn.cancelar:hover{ background:rgba(244,63,94,0.15); border-color:#f43f5e; }
.ag-close-btn{
  width:28px; height:28px; border-radius:8px; background:rgba(255,255,255,0.06);
  border:1px solid rgba(255,255,255,0.1); color:#a1a1aa; cursor:pointer; font-family:inherit;
  font-size:14px; display:flex; align-items:center; justify-content:center; transition:all 0.15s;
}
.ag-close-btn:hover{ background:rgba(244,63,94,0.12); border-color:rgba(244,63,94,0.3); color:#f43f5e; }

@keyframes agCardFadeUp {
  from { opacity:0; transform:translateY(8px); }
  to   { opacity:1; transform:translateY(0); }
}
.pro-cons-card-wrap {
  cursor:pointer;
  animation:agCardFadeUp 0.28s ease both;
  transition:transform 0.15s;
}
.pro-cons-card-wrap:hover { transform:translateY(-1px); }
.pro-cons-arrow-icon {
  color:#3f3f46;
  transition:color 0.15s, transform 0.15s;
  flex-shrink:0;
}
.pro-cons-card-wrap:hover .pro-cons-arrow-icon {
  color:#10b981;
  transform:translateX(3px);
}

.c-card {
  background:#141414; border:1px solid rgba(255,255,255,0.07); border-radius:12px; padding:12px 16px;
  transition:background 0.15s, border-color 0.15s; display:flex; align-items:center; gap:12px; flex-wrap:wrap;
}
.c-card:hover { background:#1a1a1a; border-color:#10b981; }

.modal-overlay { position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.6); z-index:100; display:flex; align-items:flex-start; justify-content:center; padding-top:80px; }
.modal-content { background:#1a1a1a; border:1px solid rgba(255,255,255,0.08); border-radius:12px; width:400px; max-width:90vw; z-index:101; animation:agFadeUp 0.2s ease; box-shadow:0 10px 30px rgba(0,0,0,0.5); }
.modal-header { padding:16px; border-bottom:1px solid rgba(255,255,255,0.08); display:flex; justify-content:space-between; align-items:center; }
.modal-body { padding:16px; display:flex; flex-direction:column; gap:16px; }
.modal-footer { padding:16px; border-top:1px solid rgba(255,255,255,0.08); display:flex; justify-content:flex-end; gap:12px; }
.modal-input { background:#111; border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:10px 12px; color:#fafafa; font-family:inherit; outline:none; font-size:14px; width:100%; transition:border-color 0.15s; color-scheme:dark; }
.modal-input:focus { border-color:#10b981; }

.ag-seg { display:flex; border-radius:10px; overflow:hidden; border:1px solid rgba(255,255,255,0.12); flex-wrap:wrap; width: 100%; }
.ag-seg-btn {
  flex:1; padding:9px 0; font-size:13px; font-weight:600; background:transparent;
  border:none; color:#71717a; cursor:pointer; font-family:inherit; transition:all 0.15s; min-width:80px;
}
.ag-seg-btn.active { background:rgba(16,185,129,0.15); color:#10b981; }
`;


// ─── Icons ───────────────────────────────────────────────────────────────────

const ChevronLeft  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>;
const ChevronRight = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>;
const PlusIcon     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const ChevronDown  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>;
const ClockIcon    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;

// ─── ConsultaCard (Aba Agenda) ────────────────────────────────────────────────

function ConsultaCard({ c, onPress }: { c: Consulta; onPress?: () => void }) {
  const st = STATUS_CONFIG[c.status];
  return (
    <div className="pro-cons-card-wrap" style={{width:"100%"}} onClick={onPress}>
      <div className="c-card">
        <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap",width:"100%"}}>
          {/* Hora */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",width:52,flexShrink:0}}>
            <span style={{color:"#a1a1aa",fontSize:13,fontWeight:"bold"}}>{c.hora}</span>
          </div>

          <div style={{width:1,height:36,background:"rgba(255,255,255,0.08)"}} />

          {/* Avatar com fallback */}
          <img src={c.avatar} alt={c.paciente} style={{width:40,height:40,borderRadius:"50%",objectFit:"cover",background:"#27272a",flexShrink:0}} />

          {/* Info */}
          <div style={{flex:1,display:"flex",flexDirection:"column",gap:4,minWidth:140}}>
            <span style={{color:"#fafafa",fontSize:14,fontWeight:"bold",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.paciente}</span>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{color:"#a1a1aa",fontSize:12}}>{c.especialidade}</span>
              <div style={{width:3,height:3,borderRadius:"50%",background:"#52525b"}} />
              <span style={{color:"#a1a1aa",fontSize:12}}>{c.modalidade}</span>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:4,marginTop:2}}>
              <span style={{color:"#71717a"}}><ClockIcon/></span>
              <span style={{color:"#71717a",fontSize:11}}>{c.hora} · {c.duracao}h</span>
            </div>
          </div>

          {/* Badge + Seta */}
          <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
            <div style={{padding:"4px 12px",borderRadius:999,border:`1px solid ${st.color}44`,background:st.bg,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <span style={{color:st.color,fontSize:10,fontWeight:"bold"}}>{st.label}</span>
            </div>
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

// ─── ConsultaDetalhePanel ─────────────────────────────────────────────────────

function ConsultaDetalhePanel({ consulta, onClose, onStatusChange }: {
  consulta: Consulta;
  onClose: () => void;
  onStatusChange: (status: Consulta["status"]) => void;
}) {
  const [localStatus, setLocalStatus] = useState<Consulta["status"]>(consulta.status);
  const st = STATUS_CONFIG[localStatus];

  function handleChange(s: Consulta["status"]) {
    setLocalStatus(s);
    onStatusChange(s);
    setTimeout(onClose, 200);
  }

  return (
    <div className="ag-detalhe-wrap">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <span style={{color:"#a1a1aa",fontSize:11,fontWeight:"bold",letterSpacing:1,textTransform:"uppercase"}}>Consulta Selecionada</span>
        <button className="ag-close-btn" onClick={onClose}>✕</button>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16,flexWrap:"wrap"}}>
        <img src={consulta.avatar} alt={consulta.paciente}
          style={{width:48,height:48,borderRadius:"50%",objectFit:"cover",flexShrink:0,border:`2px solid ${st.color}44`}}/>
        <div style={{flex:1,minWidth:160}}>
          <div style={{color:"#f4f4f5",fontWeight:"bold",fontSize:15,marginBottom:2}}>{consulta.paciente}</div>
          <div style={{color:"#a1a1aa",fontSize:12,marginBottom:4}}>{consulta.especialidade} · {consulta.modalidade}</div>
          <div style={{color:"#71717a",fontSize:11,display:"flex",alignItems:"center",gap:5}}>
            <ClockIcon/> {consulta.hora} · {consulta.duracao}h
          </div>
        </div>
        <div style={{padding:"4px 12px",borderRadius:99,fontSize:10,fontWeight:"bold",flexShrink:0,
          background:st.bg,border:`1px solid ${st.color}66`,color:st.color}}>
          {st.label}
        </div>
      </div>
      <div className="ag-detalhe-actions">
        <button
          className="ag-action-btn confirmar"
          onClick={()=>handleChange("confirmada")}
          style={localStatus==="confirmada"?{background:"rgba(16,185,129,0.25)",borderColor:"#10b981"}:{}}
          disabled={consulta.status==="em_andamento"}
        >✅ Confirmar</button>
        <button
          className="ag-action-btn andamento"
          onClick={()=>handleChange("em_andamento")}
          style={localStatus==="em_andamento"?{background:"rgba(96,165,250,0.25)",borderColor:"#60a5fa"}:{}}
          disabled={consulta.status==="em_andamento"}
        >🔵 Em andamento</button>
        <button
          className="ag-action-btn pendente"
          onClick={()=>handleChange("pendente")}
          style={localStatus==="pendente"?{background:"rgba(234,179,8,0.25)",borderColor:"#facc15"}:{}}
          disabled={consulta.status==="em_andamento"}
        >⏳ Pendente</button>
        <button
          className="ag-action-btn cancelar"
          onClick={()=>handleChange("cancelada")}
          style={localStatus==="cancelada"?{background:"rgba(244,63,94,0.25)",borderColor:"#f43f5e"}:{}}
          disabled={consulta.status==="em_andamento"}
        >❌ Cancelada</button>
      </div>
    </div>
  );
}

// ─── PainelSlots ─────────────────────────────────────────────────────────────

interface SlotState { hora:string; estado:"disponivel"|"bloqueado"|"agendado"; paciente?:string; }

function PainelSlots({ iso, slots, setSlots, highlightHora, consultasDia, onSaveDia }: {
  iso:string; slots:SlotState[]; setSlots:(s:SlotState[])=>void; highlightHora?:string; consultasDia?: Consulta[];
  onSaveDia?: (iso: string, slots: SlotState[]) => Promise<void>;
}) {
  const [novoHor, setNovoHor] = useState("");
  const [saved, setSaved]     = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeSlotIdx, setActiveSlotIdx] = useState<number | null>(null);
  const [tempModal, setTempModal] = useState<"Online" | "Presencial">("Online");
  const [tempCep, setTempCep] = useState("");
  const [tempLog, setTempLog] = useState("");
  const [tempNum, setTempNum] = useState("");
  const [tempComp, setTempComp] = useState("");
  const [tempBairro, setTempBairro] = useState("");
  const [tempCid, setTempCid] = useState("");
  const [tempUf, setTempUf] = useState("");
  const [tempLoadingCep, setTempLoadingCep] = useState(false);

  const d = new Date(iso+"T12:00:00");
  const label = d.toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"long",year:"numeric"});

  function getDetail(hora: string) {
    if (typeof window === "undefined") return { modalidade: "Online", endereco: "" };
    const data = localStorage.getItem(`slot_detail_${iso}_${hora}`);
    if (data) {
      try {
        return JSON.parse(data);
      } catch(e) {
        return { modalidade: "Online", endereco: "" };
      }
    }
    return { modalidade: "Online", endereco: "" };
  }

  function handleToggle(i: number) {
    openConfig(i);
  }

  function openConfig(i: number) {
    const s = slots[i];
    setActiveSlotIdx(i);
    const detail = getDetail(s.hora);
    setTempModal(detail.modalidade || "Online");
    
    const details = detail.addressDetails || {};
    setTempCep(details.cep || "");
    setTempLog(details.logradouro || "");
    setTempNum(details.numero || "");
    setTempComp(details.complemento || "");
    setTempBairro(details.bairro || "");
    setTempCid(details.cidade || "");
    setTempUf(details.uf || "");
    
    setIsModalOpen(true);
  }

  async function handleTempCepChange(val: string) {
    setTempCep(val);
    const cleanCep = val.replace(/\D/g, "");
    if (cleanCep.length === 8) {
      setTempLoadingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setTempLog(data.logradouro || "");
          setTempBairro(data.bairro || "");
          setTempCid(data.localidade || "");
          setTempUf(data.uf || "");
        }
      } catch (err) {
        console.error("Erro ao buscar CEP no modal:", err);
      } finally {
        setTempLoadingCep(false);
      }
    }
  }

  function saveSlotConfig() {
    if (activeSlotIdx === null) return;
    const s = slots[activeSlotIdx];
    
    const detail = {
      modalidade: tempModal,
      endereco: tempModal === "Presencial" 
        ? `${tempLog}, ${tempNum}${tempComp ? ` - ${tempComp}` : ""}, ${tempBairro}, ${tempCid} - ${tempUf.toUpperCase()}`
        : "",
      addressDetails: tempModal === "Presencial" ? {
        cep: tempCep,
        logradouro: tempLog,
        numero: tempNum,
        complemento: tempComp,
        bairro: tempBairro,
        cidade: tempCid,
        uf: tempUf
      } : null
    };
    
    if (typeof window !== "undefined") {
      localStorage.setItem(`slot_detail_${iso}_${s.hora}`, JSON.stringify(detail));
    }
    
    setSlots(slots.map((x, idx) => idx === activeSlotIdx ? { ...x, estado: "disponivel" } : x));
    setIsModalOpen(false);
    setActiveSlotIdx(null);
    setSaved(false);
  }

  function toggle(i:number){
    const s = slots[i];
    if(s.estado==="agendado") return;
    setSlots(slots.map((x,idx)=>idx===i ? {...x,estado:"bloqueado"} : x));
    if (typeof window !== "undefined") {
      localStorage.removeItem(`slot_detail_${iso}_${s.hora}`);
    }
    setSaved(false);
  }
  function bloquearTudo(){ 
    setSlots(slots.map(s=>{
      if (s.estado === "disponivel" && typeof window !== "undefined") {
        localStorage.removeItem(`slot_detail_${iso}_${s.hora}`);
      }
      return s.estado==="agendado" ? s : {...s,estado:"bloqueado"};
    })); 
    setSaved(false); 
  }
  function liberarTudo(){  setSlots(slots.map(s=>s.estado==="agendado" ? s : {...s,estado:"disponivel"})); setSaved(false); }
  function aplicarPadrao(){ setSlots(HORARIOS_DIA.map(h=>{ const c=consultasDia?.find(x=>x.hora===h.hora); return { hora:h.hora, estado:c?"agendado":h.disponivel?"disponivel":"bloqueado", paciente:c?.paciente }; })); setSaved(false); }
  function addHor(){
    if(!novoHor||slots.find(s=>s.hora===novoHor)) return;
    const newSlots = [...slots,{hora:novoHor,estado:"bloqueado"}].sort((a,b)=>a.hora.localeCompare(b.hora));
    setSlots(newSlots);
    setNovoHor(""); setSaved(false);
    
    const newIdx = newSlots.findIndex(s=>s.hora===novoHor);
    setTimeout(() => {
      openConfig(newIdx);
    }, 0);
  }
  async function salvar(){ 
    if(onSaveDia){
      try { await onSaveDia(iso, slots); setSaved(true); setTimeout(()=>setSaved(false),2500); }
      catch(e) { alert("Erro ao salvar disponibilidade"); }
    } else {
      setSaved(true); setTimeout(()=>setSaved(false),2500); 
    }
  }

  return (
    <div className="ag-slots-wrap">
      <div className="ag-slots-header">
        <span className="ag-slot-day-title" style={{textTransform:"capitalize"}}>{label}</span>
        <div className="ag-slot-actions">
          <button className="ag-btn-sm" onClick={aplicarPadrao}>🔄 Padrão</button>
          <button className="ag-btn-sm danger" onClick={bloquearTudo}>⛔ Bloquear Tudo</button>
          <button className="ag-btn-sm" onClick={liberarTudo}>✅ Liberar Tudo</button>
        </div>
      </div>

      {saved && <div className="ag-success-flash">✓ Disponibilidade salva!</div>}

      {slots.map((s,i)=>(
        <div key={s.hora} className={`ag-slot-btn ${s.estado}${highlightHora===s.hora?" highlight":""}`} style={{ flexDirection: "column", alignItems: "stretch", gap: 6, padding: "12px 14px", cursor: s.estado === "agendado" ? "not-allowed" : "pointer" }} onClick={()=>{ if(s.estado==="bloqueado") handleToggle(i); else if(s.estado==="disponivel") toggle(i); }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <span className="ag-slot-hora">{s.hora}</span>
              {s.estado==="agendado"  && <span className="ag-slot-label-ag">👤 {s.paciente}</span>}
              {s.estado==="disponivel"&& (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span className="ag-slot-label-disp">✓ Disponível</span>
                  <span style={{
                    background: getDetail(s.hora).modalidade === "Presencial" ? "rgba(16,185,129,0.15)" : "rgba(96,165,250,0.15)",
                    color: getDetail(s.hora).modalidade === "Presencial" ? "#10b981" : "#60a5fa",
                    fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99
                  }}>
                    {getDetail(s.hora).modalidade === "Presencial" ? "📍 Presencial" : "💻 Online"}
                  </span>
                </div>
              )}
              {s.estado==="bloqueado" && <span className="ag-slot-label-blq">Bloqueado</span>}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {s.estado === "disponivel" && (
                <span
                  onClick={(e) => { e.stopPropagation(); openConfig(i); }}
                  style={{
                    cursor: "pointer", fontSize: 11, display: "inline-flex",
                    alignItems: "center", justifyContent: "center", padding: "4px 8px",
                    background: "rgba(255,255,255,0.06)", borderRadius: 6, color: "#a1a1aa", border: "1px solid rgba(255,255,255,0.08)"
                  }}
                >
                  ✏ Editar
                </span>
              )}
              {s.estado!=="agendado" && (
                <span className="ag-slot-icon" style={{color:s.estado==="disponivel"?"#10b981":"#3f3f46"}}>
                  {s.estado==="disponivel"?"🔒":"🔓"}
                </span>
              )}
              {s.estado==="agendado" && (() => {
                const c = consultasDia?.find(x => x.hora === s.hora);
                const st = c ? STATUS_CONFIG[c.status] : null;
                return <div style={{width:10, height:10, borderRadius:5, backgroundColor: st?.dot || "#60a5fa", flexShrink:0, marginLeft:4}}/>;
              })()}
            </div>
          </div>
          {s.estado === "disponivel" && getDetail(s.hora).modalidade === "Presencial" && getDetail(s.hora).endereco && (
            <div style={{ color: "#71717a", fontSize: 11, display: "flex", alignItems: "center", gap: 4, paddingLeft: 56, marginTop: -2, width: "100%", textAlign: "left" }}>
              <span>📍</span>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{getDetail(s.hora).endereco}</span>
            </div>
          )}
        </div>
      ))}

      <div className="ag-add-row">
        <input type="time" value={novoHor} onChange={e=>setNovoHor(e.target.value)}
          className="ag-add-input" />
        <button className="ag-btn-primary" style={{padding:"9px 16px",fontSize:12}} onClick={addHor}>
          <PlusIcon/> Adicionar
        </button>
      </div>
      <button className="ag-btn-primary" style={{width:"100%",marginTop:4}} onClick={salvar}>
        💾 Salvar Dia
      </button>

      {/* Floating Configuration Modal */}
      {isModalOpen && activeSlotIdx !== null && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: "450px" }}>
            <div className="modal-header">
              <h3 style={{ color: "#fafafa", fontSize: 15, fontWeight: 700, margin: 0 }}>
                Configurar Horário — {slots[activeSlotIdx]?.hora}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                style={{ background: "transparent", border: "none", color: "#a1a1aa", fontSize: 16, cursor: "pointer" }}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div>
                <label className="g-label" style={{ display: "block", marginBottom: 8, fontSize: 11, color: "#71717a", textTransform: "uppercase", fontWeight: 600 }}>Modalidade de Atendimento</label>
                <div className="ag-seg">
                  <button 
                    className={`ag-seg-btn${tempModal === "Online" ? " active" : ""}`}
                    onClick={() => setTempModal("Online")}
                  >
                    💻 Online
                  </button>
                  <button 
                    className={`ag-seg-btn${tempModal === "Presencial" ? " active" : ""}`}
                    onClick={() => setTempModal("Presencial")}
                  >
                    📍 Presencial
                  </button>
                </div>
              </div>

              {tempModal === "Presencial" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12, animation: "agFadeUp 0.2s ease" }}>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ flex: "1 1 110px", position: "relative" }}>
                      <label className="g-label" style={{ display: "block", marginBottom: 4, fontSize: 10, color: "#71717a", textTransform: "uppercase", fontWeight: 600 }}>CEP</label>
                      <input
                        type="text"
                        value={tempCep}
                        onChange={e=>handleTempCepChange(e.target.value)}
                        placeholder={tempLoadingCep ? "..." : "00000-000"}
                        className="ag-add-input"
                        style={{ width: "100%" }}
                        disabled={tempLoadingCep}
                      />
                      {tempLoadingCep && (
                        <div style={{ position: "absolute", right: 10, bottom: 10, width: 14, height: 14, border: "2px solid #10b981", borderTopColor: "transparent", borderRadius: "50%", animation: "agFadeUp 0.6s linear infinite" }} />
                      )}
                    </div>
                    <div style={{ flex: "3 1 180px" }}>
                      <label className="g-label" style={{ display: "block", marginBottom: 4, fontSize: 10, color: "#71717a", textTransform: "uppercase", fontWeight: 600 }}>Logradouro (Rua, Av.)</label>
                      <input
                        type="text"
                        value={tempLog}
                        onChange={e=>setTempLog(e.target.value)}
                        placeholder="Av. Paulista"
                        className="ag-add-input"
                        style={{ width: "100%" }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ flex: "1 1 100px" }}>
                      <label className="g-label" style={{ display: "block", marginBottom: 4, fontSize: 10, color: "#71717a", textTransform: "uppercase", fontWeight: 600 }}>Número</label>
                      <input
                        type="text"
                        value={tempNum}
                        onChange={e=>setTempNum(e.target.value)}
                        placeholder="1500"
                        className="ag-add-input"
                        style={{ width: "100%" }}
                      />
                    </div>
                    <div style={{ flex: "2 1 160px" }}>
                      <label className="g-label" style={{ display: "block", marginBottom: 4, fontSize: 10, color: "#71717a", textTransform: "uppercase", fontWeight: 600 }}>Complemento</label>
                      <input
                        type="text"
                        value={tempComp}
                        onChange={e=>setTempComp(e.target.value)}
                        placeholder="Sala 42"
                        className="ag-add-input"
                        style={{ width: "100%" }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <div style={{ flex: "2 1 120px" }}>
                      <label className="g-label" style={{ display: "block", marginBottom: 4, fontSize: 10, color: "#71717a", textTransform: "uppercase", fontWeight: 600 }}>Bairro</label>
                      <input
                        type="text"
                        value={tempBairro}
                        onChange={e=>setTempBairro(e.target.value)}
                        placeholder="Bela Vista"
                        className="ag-add-input"
                        style={{ width: "100%" }}
                      />
                    </div>
                    <div style={{ flex: "2 1 120px" }}>
                      <label className="g-label" style={{ display: "block", marginBottom: 4, fontSize: 10, color: "#71717a", textTransform: "uppercase", fontWeight: 600 }}>Cidade</label>
                      <input
                        type="text"
                        value={tempCid}
                        onChange={e=>setTempCid(e.target.value)}
                        placeholder="São Paulo"
                        className="ag-add-input"
                        style={{ width: "100%" }}
                      />
                    </div>
                    <div style={{ flex: "1 1 50px" }}>
                      <label className="g-label" style={{ display: "block", marginBottom: 4, fontSize: 10, color: "#71717a", textTransform: "uppercase", fontWeight: 600 }}>UF</label>
                      <input
                        type="text"
                        value={tempUf}
                        onChange={e=>setTempUf(e.target.value)}
                        placeholder="SP"
                        maxLength={2}
                        className="ag-add-input"
                        style={{ width: "100%", textTransform: "uppercase" }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                className="ag-btn-sm" 
                onClick={() => setIsModalOpen(false)}
              >
                Cancelar
              </button>
              <button 
                className="ag-btn-primary" 
                style={{ padding: "8px 16px", fontSize: 12 }}
                onClick={saveSlotConfig}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ─── Calendário Gerenciar ─────────────────────────────────────────────────────

// ─── Recorrência Semanal ──────────────────────────────────────────────────────

const DUR_OPTS = ["30min","45min","60min","90min"];

function RecorrenciaSemanal({ onApply }: { onApply?: (data: any) => Promise<void> }){
  const [inicio,  setInicio]  = useState("08:00");
  const [fim,     setFim]     = useState("17:00");
  const [saved,   setSaved]   = useState(false);
  const [loading, setLoading] = useState(false);
  // null = ambas modalidades, 'Presencial' ou 'Online' = exclusiva
  const [modalidadePad, setModalidadePad] = useState<'Presencial'|'Online'|null>(null);

  // duração por dia: { 0: "60min", 1: "30min", ... }
  const [duracaoPorDia, setDuracaoPorDia] = useState<Record<number,string>>({
    0:"60min", 1:"30min", 2:"30min", 3:"30min", 4:"30min", 5:"30min", 6:"60min"
  });
  const [diasAtivos, setDiasAtivos] = useState<number[]>([1,2,3,4,5]);


  function toggleDia(d:number){
    setDiasAtivos(prev=>prev.includes(d)?prev.filter(x=>x!==d):[...prev,d].sort());
    setSaved(false);
  }
  function setDur(dia:number, dur:string){
    setDuracaoPorDia(prev=>({...prev,[dia]:dur}));
    setSaved(false);
  }

  async function aplicar(){
    if(!onApply || diasAtivos.length===0) return;
    setLoading(true);
    try {
      const grupos: Record<string, number[]> = {};
      for(const d of diasAtivos){
        const dur = duracaoPorDia[d] ?? "60min";
        if(!grupos[dur]) grupos[dur] = [];
        grupos[dur].push(d);
      }
      for(const [dur, dias] of Object.entries(grupos)){
        await onApply({ diasSemana: dias, horaInicio: inicio, horaFim: fim, duracaoMin: parseInt(dur), modalidade: modalidadePad });
      }
      setSaved(true); setTimeout(()=>setSaved(false),3000);
    } catch(e) { alert("Erro ao aplicar recorrência"); }
    finally { setLoading(false); }
  }

  return (
    <div className="ag-recorr-wrap">
      <p className="ag-recorr-title">🔁 Configurar Horário Semanal Padrão</p>

      {/* Modalidade padrão dos slots */}
      <div className="ag-recorr-row" style={{marginBottom:16,flexDirection:'column',gap:8}}>
        <span className="ag-recorr-label">Modalidade padrão dos slots</span>
        <div style={{display:'flex',gap:6}}>
          {(['Presencial','Online',null] as const).map((m)=>{
            const label = m === null ? '🌐 Ambas' : m === 'Presencial' ? '🏥 Presencial' : '💻 Online';
            const active = modalidadePad === m;
            return (
              <button key={String(m)} onClick={()=>{setModalidadePad(m);setSaved(false);}} style={{
                flex:1,padding:'6px 8px',borderRadius:8,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit',transition:'all 0.15s',
                background:active?'rgba(16,185,129,0.2)':'rgba(255,255,255,0.04)',
                border:`1.5px solid ${active?'#10b981':'rgba(255,255,255,0.1)'}`,
                color:active?'#10b981':'#71717a',
              }}>{label}</button>
            );
          })}
        </div>
        {modalidadePad !== null && (
          <span style={{fontSize:11,color:'#a1a1aa',marginTop:2}}>
            Slots criarão exclusivamente para <strong style={{color:'#10b981'}}>{modalidadePad}</strong> — clientes de outro tipo não verão esses horários.
          </span>
        )}
      </div>

      {/* Hora início / fim — globais */}
      <div className="ag-recorr-row" style={{marginBottom:16}}>
        <div className="ag-recorr-field-wrap">
          <span className="ag-recorr-label">Início</span>
          <input type="time" value={inicio} onChange={e=>setInicio(e.target.value)} className="ag-recorr-input" />
        </div>
        <div className="ag-recorr-field-wrap">
          <span className="ag-recorr-label">Fim</span>
          <input type="time" value={fim} onChange={e=>setFim(e.target.value)} className="ag-recorr-input" />
        </div>
      </div>

      {/* Dias + duração individual */}
      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
        <span className="ag-recorr-label">Dias e duração da consulta</span>
        {DIAS_SEMANA_LABELS.map((lb,i)=>(
          <div key={i} style={{
            display:"flex",alignItems:"center",gap:10,padding:"8px 12px",
            borderRadius:10,border:`1.5px solid ${diasAtivos.includes(i)?"#10b981":"rgba(255,255,255,0.08)"}`,
            background:diasAtivos.includes(i)?"rgba(16,185,129,0.06)":"rgba(255,255,255,0.02)",
            transition:"all 0.15s",
          }}>
            {/* Toggle dia */}
            <button
              onClick={()=>toggleDia(i)}
              style={{
                width:56,flexShrink:0,padding:"5px 0",borderRadius:8,fontSize:12,fontWeight:700,
                cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s",
                background:diasAtivos.includes(i)?"rgba(16,185,129,0.2)":"rgba(255,255,255,0.05)",
                border:`1.5px solid ${diasAtivos.includes(i)?"#10b981":"rgba(255,255,255,0.12)"}`,
                color:diasAtivos.includes(i)?"#10b981":"#52525b",
              }}
            >{lb}</button>

            {/* Seletor de duração por dia (visível apenas se ativo) */}
            {diasAtivos.includes(i) ? (
              <div style={{display:"flex",gap:4,flex:1,flexWrap:"wrap"}}>
                {DUR_OPTS.map(d=>(
                  <button key={d}
                    onClick={()=>setDur(i,d)}
                    style={{
                      padding:"4px 10px",borderRadius:6,fontSize:11,fontWeight:700,cursor:"pointer",
                      fontFamily:"inherit",transition:"all 0.15s",
                      background:(duracaoPorDia[i]??"60min")===d?"rgba(16,185,129,0.2)":"rgba(255,255,255,0.04)",
                      border:`1.5px solid ${(duracaoPorDia[i]??"60min")===d?"#10b981":"rgba(255,255,255,0.1)"}`,
                      color:(duracaoPorDia[i]??"60min")===d?"#10b981":"#71717a",
                    }}
                  >{d}</button>
                ))}
              </div>
            ) : (
              <span style={{color:"#3f3f46",fontSize:12,fontStyle:"italic"}}> Inativo</span>
            )}
          </div>
        ))}
      </div>

      {saved && <div className="ag-success-flash" style={{marginBottom:10}}>✓ Padrão semanal aplicado ao mês!</div>}

      <button
        className="ag-btn-primary" style={{width:"100%",opacity:loading?0.7:1}}
        onClick={aplicar} disabled={loading||diasAtivos.length===0}
      >
        {loading ? "Aplicando..." : `Aplicar para o Mês (${diasAtivos.length} dias) →`}
      </button>
    </div>
  );
}

// ─── Aba Gerenciar ────────────────────────────────────────────────────────────

interface AbaGerenciarProps {
  sel: string; setSel: (s:string)=>void;
  cy: number;  setCy: React.Dispatch<React.SetStateAction<number>>;
  cm: number;  setCm: React.Dispatch<React.SetStateAction<number>>;
  consulta: Consulta | null;
  setConsulta: (c: Consulta | null) => void;
  onStatusChange: (id: number, status: Consulta["status"]) => void;
  consultasDia: Consulta[];
  mesData: any;
  gerDiaData: any;
  onSaveDia: (iso: string, slots: SlotState[]) => Promise<void>;
  onApplyRecorrencia: (data: any) => Promise<void>;
}

function AbaGerenciar({ sel, setSel, cy, setCy, cm, setCm, consulta, setConsulta, onStatusChange, consultasDia, mesData, gerDiaData, onSaveDia, onApplyRecorrencia }: AbaGerenciarProps){
  const today = new Date();
  const [slotsMap, setSlotsMap] = useState<Record<string,SlotState[]>>({});

  const days = buildCal(cy, cm);
  const todayISO = toISO(today);

  function getSlots(iso:string): SlotState[]{
    if (slotsMap[iso]) return slotsMap[iso];
    if (gerDiaData && gerDiaData.dia === iso && gerDiaData.slots?.length > 0) {
      if (typeof window !== "undefined") {
        for (const s of gerDiaData.slots) {
          if (s.modalidade) {
            const key = `slot_detail_${iso}_${s.hora}`;
            localStorage.setItem(key, JSON.stringify({ modalidade: s.modalidade, endereco: s.endereco ?? "" }));
          }
        }
      }
      return (gerDiaData.slots as any[]).map(s => ({
        hora: s.hora as string,
        estado: s.estado as SlotState["estado"],
        paciente: s.consulta?.paciente?.nome as string | undefined,
      }));
    }
    return HORARIOS_DIA.map(h=>({ hora: h.hora, estado: "bloqueado" as const }));
  }
  function setSlots(iso:string, s:SlotState[]){
    setSlotsMap(prev=>({...prev,[iso]:s}));
  }

  function prevMes(){ if(cm===0){setCm(11);setCy(y=>y-1);}else{setCm(m=>m-1);} }
  function nextMes(){ if(cm===11){setCm(0);setCy(y=>y+1);}else{setCm(m=>m+1);} }

  function getDayClass(iso:string): string {
    if (!mesData) return "blocked";
    const d = mesData.dias?.find((x:any)=>x.dia===iso);
    if (d?.temConsulta) return "has-consulta";
    if (d?.temDisponibilidade) return "has-disponivel";
    return "blocked";
  }

  return (
    <div className="ag-panel" style={{display:"flex",flexDirection:"column",gap:16}}>
      {/* Painel detalhe consulta selecionada */}
      {consulta && (
        <ConsultaDetalhePanel
          consulta={consulta}
          onClose={()=>setConsulta(null)}
          onStatusChange={(status)=>{ setConsulta({...consulta,status}); onStatusChange(consulta.id, status); }}
        />
      )}
      {/* Dois painéis */}
      <div style={{display:"flex",gap:16,flexWrap:"wrap",alignItems:"flex-start"}}>

        {/* Calendário */}
        <div className="ag-cal-wrap" style={{flex:"1 1 280px",minWidth:280}}>
          <div className="ag-cal-header">
            <button className="ag-cal-nav" onClick={prevMes}>‹</button>
            <span className="ag-cal-title">{MESES[cm]} {cy}</span>
            <button className="ag-cal-nav" onClick={nextMes}>›</button>
          </div>
          <div className="ag-cal-grid">
            {WDAYS.map(w=><div key={w} className="ag-cal-wd">{w}</div>)}
            {days.map((d,i)=>{
              if(!d) return <div key={i} className="ag-cal-day empty"/>;
              const iso = `${cy}-${String(cm+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
              const isToday  = iso===todayISO;
              const isSelected = iso===sel;
              const dayClass = getDayClass(iso);
              return (
                <div key={i}
                  className={`ag-cal-day${isSelected?" selected":""}${isToday&&!isSelected?" today":""}${!isSelected?" "+dayClass:""}`}
                  onClick={()=>setSel(iso)}
                >{d}</div>
              );
            })}
          </div>
          <div className="ag-legend">
            <div className="ag-legend-item"><div className="ag-legend-dot" style={{background:"rgba(16,185,129,0.4)"}}/> Disponível</div>
            <div className="ag-legend-item"><div className="ag-legend-dot" style={{background:"rgba(96,165,250,0.5)"}}/> Com consulta</div>
            <div className="ag-legend-item"><div className="ag-legend-dot" style={{background:"rgba(255,255,255,0.12)"}}/> Bloqueado</div>
          </div>
        </div>

        {/* Painel de slots */}
        <div style={{flex:"2 1 320px",minWidth:300}}>
          <PainelSlots iso={sel} slots={getSlots(sel)} setSlots={(s)=>setSlots(sel,s)} highlightHora={consulta?.hora} consultasDia={consultasDia} onSaveDia={onSaveDia}/>
        </div>
      </div>

      {/* Recorrência — limpa cache local de slots após aplicar */}
      <RecorrenciaSemanal onApply={async (data) => {
        await onApplyRecorrencia(data);
        setSlotsMap({}); // força recarregar slots da API
      }}/>
    </div>
  );
}


// ─── Page Principal ───────────────────────────────────────────────────────────

type Tab = "agenda" | "gerenciar";

export default function AgendaPage() {
  const [tab,          setTab]        = useState<Tab>("agenda");
  const [currentDate,  setCurrentDate]= useState(TODAY);
  const [mesDropdown,  setMesDropdown]= useState(false);
  const [showNova,     setShowNova]   = useState(false);

  // ── Estado da aba Gerenciar (elevado para permitir controle externo)
  const [gerSel,        setGerSel]        = useState<string>(toISO(TODAY));
  const [gerCy,         setGerCy]         = useState(TODAY.getFullYear());
  const [gerCm,         setGerCm]         = useState(TODAY.getMonth());
  const [gerConsulta,   setGerConsulta]   = useState<Consulta | null>(null);
  const [statusOverrides, setStatusOverrides] = useState<Record<number, Consulta["status"]>>({}); 

  // ── SWR Data Fetching ──
  const { data: me } = useSWR('/pro/me', async (url) => (await api.get(url)).data);
  const iso = toISO(currentDate);
  const { data: agendaDia, mutate: mutAgendaDia } = useSWR(`/pro/agenda/dia?data=${iso}`, async (url) => (await api.get(url)).data);
  const { data: gerMes, mutate: mutGerMes } = useSWR(`/pro/agenda/mes?ano=${gerCy}&mes=${gerCm+1}`, async (url) => (await api.get(url)).data);
  const { data: gerDia, mutate: mutGerDia } = useSWR(`/pro/agenda/dia?data=${gerSel}`, async (url) => (await api.get(url)).data);

  function mapConsultas(slots: any[]) {
    if (!slots) return [];
    return slots.filter((s:any) => s.consulta).map((s:any) => ({
      id: s.consulta.id,
      hora: s.hora,
      duracao: 1,
      paciente: s.consulta.paciente.nome,
      avatar: s.consulta.paciente.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.consulta.paciente.nome)}&background=random`,
      especialidade: s.consulta.especialidade,
      modalidade: s.consulta.modalidade === 'PRESENCIAL' ? 'Presencial' : 'Online',
      status: s.consulta.status
    }));
  }

  const consultasHoje = mapConsultas(agendaDia?.slots).map(c=>
    statusOverrides[c.id] ? {...c, status: statusOverrides[c.id]} : c
  );
  
  const slotsHoje = agendaDia?.slots || [];

  const consultasSel = mapConsultas(gerDia?.slots).map(c=>
    statusOverrides[c.id] ? {...c, status: statusOverrides[c.id]} : c
  );
  const consultasPorHora = useMemo(()=>{
    const m: Record<string,Consulta>={};
    for(const c of consultasHoje) m[c.hora]=c;
    return m;
  },[consultasHoje]);

  function prevDay(){ setCurrentDate(d=>addDays(d,-1)); }
  function nextDay(){ setCurrentDate(d=>addDays(d, 1)); }
  const isToday = iso===toISO(TODAY);

  // ── Clique no card → vai para Gerenciar no dia/mês certo
  function handleCardClick(cardIso: string, consulta: Consulta) {
    const d = new Date(cardIso + "T12:00:00");
    setGerSel(cardIso);
    setGerCy(d.getFullYear());
    setGerCm(d.getMonth());
    setGerConsulta(consulta);
    setTab("gerenciar");
  }

  return (
    <>
      <style>{STYLES}</style>
      <div style={{ flex:1, overflowY:"auto", background:"#09090b" }}>
        <div style={{ padding:"1.5rem 2rem", maxWidth:1200, margin:"0 auto", width:"100%", position:"relative", display:"flex", flexDirection:"column", gap:20 }}>

          {/* Toolbar */}
          <div className="pro-page-header" style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:16}}>
            <div>
              <h2 style={{color:"#fafafa",fontSize:22,fontWeight:"bold",margin:0}}>Agenda</h2>
              <p style={{color:"#a1a1aa",fontSize:14,margin:"4px 0 0",textTransform:"capitalize"}}>{fmtWeekDay(currentDate)}</p>
            </div>
            {/* Tab switcher */}
            <div className="ag-tab-bar">
              <button className={`ag-tab${tab==="agenda"?" active":""}`}    onClick={()=>setTab("agenda")}>📅 Agenda</button>
              <button className={`ag-tab${tab==="gerenciar"?" active":""}`} onClick={()=>setTab("gerenciar")}>🗓 Gerenciar Disponibilidade</button>
            </div>
          </div>

          {/* ── Aba Agenda ── */}
          {tab==="agenda" && (
            <div className="ag-panel">
              {/* Nav Bar */}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:"#141414",padding:12,borderRadius:14,border:"1px solid rgba(255,255,255,0.08)",flexWrap:"wrap",gap:12,marginBottom:20}}>
                <div style={{display:"flex",gap:12,alignItems:"center"}}>
                  <img src={me?.avatarUrl || "https://picsum.photos/200/200?random=30"} style={{width:36,height:36,borderRadius:"50%",background:"#27272a",objectFit:"cover"}} alt="Doctor" />
                  <div className="dr-info" style={{display:"flex",flexDirection:"column"}}>
                    <span style={{color:"#fafafa",fontSize:14,fontWeight:"bold"}}>{me ? me.name : "Carregando..."}</span>
                    <span style={{color:"#a1a1aa",fontSize:12}}>{me ? `${me.especialidade} · ${me.registroProfissional}` : ""}</span>
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:16}}>
                  <button onClick={prevDay} style={{width:32,height:32,borderRadius:999,background:"transparent",border:"none",color:"#fafafa",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><ChevronLeft/></button>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
                    {isToday && <span style={{background:"rgba(16,185,129,0.15)",color:"#10b981",padding:"2px 8px",borderRadius:999,fontSize:10,fontWeight:"bold",marginBottom:2}}>Hoje</span>}
                    <span style={{color:"#fafafa",fontSize:15,fontWeight:"bold"}}>{fmtLong(currentDate)}</span>
                  </div>
                  <button onClick={nextDay} style={{width:32,height:32,borderRadius:999,background:"transparent",border:"none",color:"#fafafa",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><ChevronRight/></button>
                </div>
                <div style={{position:"relative"}}>
                  <button onClick={()=>setMesDropdown(v=>!v)} style={{display:"flex",alignItems:"center",gap:8,background:"#1a1a1a",border:"1px solid rgba(255,255,255,0.08)",borderRadius:8,padding:"8px 12px",color:"#fafafa",fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>
                    {MESES[currentDate.getMonth()]} {currentDate.getFullYear()} <ChevronDown/>
                  </button>
                  {mesDropdown && (
                    <div style={{position:"absolute",top:45,right:0,zIndex:50,width:200,background:"#141414",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:8,boxShadow:"0 10px 30px rgba(0,0,0,0.5)",display:"flex",flexDirection:"column"}}>
                      {MESES.map((mes,idx)=>(
                        <button key={mes} onClick={()=>{ const d=new Date(currentDate); d.setMonth(idx); setCurrentDate(d); setMesDropdown(false); }}
                          style={{textAlign:"left",padding:"8px 12px",background:"transparent",border:"none",borderRadius:6,cursor:"pointer",fontFamily:"inherit",color:currentDate.getMonth()===idx?"#10b981":"#fafafa",fontWeight:currentDate.getMonth()===idx?"bold":"normal",transition:"background 0.15s"}}
                          onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,0.05)")}
                          onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
                          {mes}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Corpo */}
              <div style={{display:"flex",gap:20,alignItems:"flex-start",flexWrap:"wrap"}} className="ag-corpo-grid">
                {/* Timeline */}
                <div style={{flex:2,minWidth:300,background:"#141414",borderRadius:14,border:"1px solid rgba(255,255,255,0.08)",overflow:"hidden"}}>
                  {/* Timeline — usa slots reais da API; fallback para HORARIOS_DIA */}
                {(() => {
                  // Constrói a lista de horas a exibir: prioriza slots da API, fallback mock
                  const horasAPI = slotsHoje.map((s:any) => s.hora);
                  const horasBase: string[] = horasAPI.length > 0
                    ? horasAPI
                    : HORARIOS_DIA.map(h => h.hora);
                  // Inclui horas de consultas mesmo que não haja slot (segurança)
                  const horasConsultas = Object.keys(consultasPorHora).filter(h => !horasBase.includes(h));
                  const todasHoras = [...new Set([...horasBase, ...horasConsultas])].sort();

                  return todasHoras.map((hora, i) => {
                    const c = consultasPorHora[hora];
                    const slotInfo = slotsHoje.find((s:any) => s.hora === hora);
                    const isDisponivel = slotInfo?.estado === 'disponivel';
                    return (
                      <div key={hora} style={{display:"flex",borderBottom:i<todasHoras.length-1?"1px solid rgba(255,255,255,0.08)":"none"}} >
                        <div style={{width:80,display:"flex",alignItems:"center",justifyContent:"center",padding:"16px 0",borderRight:"1px solid rgba(255,255,255,0.08)",background:"#09090b"}}>
                          <span style={{color:"#a1a1aa",fontSize:14,fontWeight:"bold"}}>{hora}</span>
                        </div>
                        <div style={{flex:1,padding:8,display:"flex",flexDirection:"column",justifyContent:"center",minHeight:64}}>
                          {c ? <ConsultaCard c={c} onPress={()=>handleCardClick(iso,c)}/> : isDisponivel ? (
                            <button onClick={()=>setShowNova(true)} style={{width:"100%",padding:"14px",display:"flex",alignItems:"center",justifyContent:"center",gap:8,background:"transparent",border:"1px dashed rgba(255,255,255,0.15)",borderRadius:12,color:"#71717a",fontSize:13,cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s"}}
                              onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.03)";e.currentTarget.style.borderColor="rgba(255,255,255,0.25)";}}
                              onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor="rgba(255,255,255,0.15)";}} >
                              <div style={{width:6,height:6,borderRadius:"50%",background:"#52525b"}} />
                              Horário disponível
                            </button>
                          ) : (
                            <div style={{flex:1,background:"rgba(255,255,255,0.02)",borderRadius:8,minHeight:32}}/>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}

                </div>

                {/* Sidebar */}
                <div style={{flex:1,minWidth:260,display:"flex",flexDirection:"column",gap:16}}>
                  <div style={{background:"#141414",border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,padding:16}}>
                    <span style={{display:"block",color:"#a1a1aa",fontSize:11,fontWeight:"bold",letterSpacing:1,textTransform:"uppercase",marginBottom:12}}>Resumo do Dia</span>
                    <div style={{display:"flex",flexDirection:"column",gap:8}}>
                      {[
                        {label:"Confirmadas",  value:consultasHoje.filter(c=>c.status==="confirmada").length,   color:"#10b981"},
                        {label:"Pendentes",    value:consultasHoje.filter(c=>c.status==="pendente").length,     color:"#facc15"},
                        {label:"Em andamento", value:consultasHoje.filter(c=>c.status==="em_andamento").length, color:"#60a5fa"},
                        {label:"Disponíveis",  value:slotsHoje.filter((s:any)=>s.estado==="disponivel").length, color:"#a1a1aa"},
                      ].map((s,i)=>(
                        <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",borderRadius:8,background:"#09090b",border:"1px solid rgba(255,255,255,0.05)"}}>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            <div style={{width:8,height:8,borderRadius:"50%",background:s.color}} />
                            <span style={{color:"#a1a1aa",fontSize:13}}>{s.label}</span>
                          </div>
                          <span style={{color:s.color,fontSize:14,fontWeight:"bold"}}>{s.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {consultasHoje.length>0&&(
                    <div style={{background:"#141414",border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,padding:16}}>
                      <span style={{display:"block",color:"#71717a",fontSize:11,fontWeight:"bold",letterSpacing:1,textTransform:"uppercase",marginBottom:12}}>Consultas do Dia</span>
                      <div style={{display:"flex",flexDirection:"column",gap:8}}>
                        {consultasHoje.map(c=>(
                          <ConsultaCard key={c.id} c={c} onPress={()=>handleCardClick(iso,c)}/>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Aba Gerenciar ── */}
          {tab==="gerenciar" && (
            <AbaGerenciar
              sel={gerSel} setSel={setGerSel}
              cy={gerCy}   setCy={setGerCy}
              cm={gerCm}   setCm={setGerCm}
              consulta={gerConsulta}
              setConsulta={setGerConsulta}
              consultasDia={consultasSel}
              mesData={gerMes}
              gerDiaData={gerDia}
              onSaveDia={async (isoDia, slots) => {
                await api.put('/pro/agenda/disponibilidade', {
                  dia: isoDia,
                  slots: slots.map(s => {
                    const key = `slot_detail_${isoDia}_${s.hora}`;
                    let detail = { modalidade: "Online", endereco: "" };
                    try {
                      const data = localStorage.getItem(key);
                      if (data) detail = JSON.parse(data);
                    } catch (e) {}
                    return {
                      hora: s.hora,
                      estado: s.estado === 'agendado' ? 'DISPONIVEL' : s.estado.toUpperCase(),
                      modalidade: s.estado === 'disponivel' ? detail.modalidade : null,
                      endereco: s.estado === 'disponivel' ? detail.endereco : null,
                    };
                  })
                });
                mutGerMes(); mutAgendaDia(); mutGerDia();
              }}
              onApplyRecorrencia={async (data) => {
                await api.patch('/pro/agenda/recorrencia', data);
                mutGerMes(); mutAgendaDia(); mutGerDia();
              }}
              onStatusChange={async (id, status)=>{
                try {
                  await api.patch(`/pro/agenda/consulta/${id}/status`, { status });
                  setStatusOverrides(prev=>({...prev,[id]:status}));
                  setGerConsulta(prev=>prev ? {...prev,status} : prev);
                  mutAgendaDia(); mutGerDia();
                } catch (err) {
                  alert("Erro ao alterar o status da consulta.");
                }
              }}
            />
          )}

        </div>

        {/* Modal Nova Consulta */}
        {showNova&&(
          <div className="modal-overlay" onClick={()=>setShowNova(false)}>
            <div className="modal-content" onClick={e=>e.stopPropagation()}>
              <div className="modal-header">
                <h2 style={{color:"#fafafa",fontSize:20,fontWeight:"bold",margin:0}}>Nova Consulta</h2>
                <button onClick={()=>setShowNova(false)} style={{background:"transparent",border:"none",color:"#a1a1aa",fontSize:18,cursor:"pointer"}}>✕</button>
              </div>
              <div className="modal-body">
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  <span style={{color:"#a1a1aa",fontSize:13}}>Paciente</span>
                  <input type="text" placeholder="Buscar paciente..." className="modal-input"/>
                </div>
                <div style={{display:"flex",gap:12}}>
                  <div style={{flex:1,display:"flex",flexDirection:"column",gap:8}}>
                    <span style={{color:"#a1a1aa",fontSize:13}}>Data</span>
                    <input type="date" defaultValue={iso} className="modal-input"/>
                  </div>
                  <div style={{flex:1,display:"flex",flexDirection:"column",gap:8}}>
                    <span style={{color:"#a1a1aa",fontSize:13}}>Horário</span>
                    <input type="time" placeholder="Ex: 09:00" className="modal-input"/>
                  </div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  <span style={{color:"#a1a1aa",fontSize:13}}>Especialidade</span>
                  <input type="text" placeholder="Ex: Cardiologia" className="modal-input"/>
                </div>
              </div>
              <div className="modal-footer">
                <button onClick={()=>setShowNova(false)} style={{padding:"10px 16px",background:"transparent",border:"none",color:"#a1a1aa",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Cancelar</button>
                <button onClick={()=>setShowNova(false)} style={{padding:"10px 20px",background:"#10b981",border:"none",borderRadius:8,color:"#fff",fontSize:13,fontWeight:"bold",cursor:"pointer",fontFamily:"inherit"}}>Agendar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

