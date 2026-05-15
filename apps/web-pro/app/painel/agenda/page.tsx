//@ts-nocheck
"use client";

import { useState, useMemo } from "react";

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

const consultasPorDia: Record<string, Consulta[]> = {
  "2026-04-23": [
    { id:1, hora:"09:00", duracao:1, paciente:"Fernanda Lima",    avatar:"https://picsum.photos/200/200?random=41", especialidade:"Cardiologia",        modalidade:"Presencial", status:"confirmada"   },
    { id:2, hora:"11:00", duracao:1, paciente:"Guilherme Augusto",avatar:"https://picsum.photos/200/200?random=30", especialidade:"Check-up",           modalidade:"Presencial", status:"em_andamento" },
    { id:3, hora:"14:00", duracao:1, paciente:"Ricardo Nunes",    avatar:"https://picsum.photos/200/200?random=45", especialidade:"Avaliação Cardíaca", modalidade:"Presencial", status:"pendente"     },
    { id:4, hora:"16:00", duracao:1, paciente:"Beatriz Santos",   avatar:"https://picsum.photos/200/200?random=46", especialidade:"Cardiologia",        modalidade:"Online",     status:"confirmada"   },
  ],
  "2026-04-24": [
    { id:5, hora:"09:00", duracao:1, paciente:"Lucas Mendes",    avatar:"https://picsum.photos/200/200?random=32", especialidade:"Check-up",  modalidade:"Presencial", status:"confirmada" },
    { id:6, hora:"10:00", duracao:1, paciente:"Ana Paula Ramos", avatar:"https://picsum.photos/200/200?random=48", especialidade:"Cardiologia",modalidade:"Online",     status:"confirmada" },
    { id:7, hora:"15:00", duracao:1, paciente:"Thiago Oliveira", avatar:"https://picsum.photos/200/200?random=49", especialidade:"Cardiologia",modalidade:"Presencial", status:"pendente"   },
  ],
};

const STATUS_CONFIG = {
  confirmada:   { label:"Confirmada",   bg:"rgba(16,185,129,0.12)", color:"#10b981", border:"rgba(16,185,129,0.3)", dot:"#10b981" },
  pendente:     { label:"Pendente",     bg:"rgba(234,179,8,0.12)",  color:"#facc15", border:"rgba(234,179,8,0.3)",  dot:"#facc15" },
  em_andamento: { label:"Em andamento", bg:"rgba(59,130,246,0.12)", color:"#60a5fa", border:"rgba(59,130,246,0.3)", dot:"#60a5fa" },
  cancelada:    { label:"Cancelada",    bg:"rgba(244,63,94,0.12)",  color:"#f43f5e", border:"rgba(244,63,94,0.3)",  dot:"#f43f5e" },
};

const TODAY = new Date("2026-04-23T12:00:00-03:00");
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

function PainelSlots({ iso, slots, setSlots, highlightHora, consultasDia }: {
  iso:string; slots:SlotState[]; setSlots:(s:SlotState[])=>void; highlightHora?:string; consultasDia?: Consulta[];
}) {
  const [novoHor, setNovoHor] = useState("");
  const [saved, setSaved]     = useState(false);

  const d = new Date(iso+"T12:00:00");
  const label = d.toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"long",year:"numeric"});

  function toggle(i:number){
    const s = slots[i];
    if(s.estado==="agendado") return;
    const next = s.estado==="disponivel" ? "bloqueado" : "disponivel";
    setSlots(slots.map((x,idx)=>idx===i ? {...x,estado:next} : x));
    setSaved(false);
  }
  function bloquearTudo(){ setSlots(slots.map(s=>s.estado==="agendado" ? s : {...s,estado:"bloqueado"})); setSaved(false); }
  function liberarTudo(){  setSlots(slots.map(s=>s.estado==="agendado" ? s : {...s,estado:"disponivel"})); setSaved(false); }
  function aplicarPadrao(){ setSlots(HORARIOS_DIA.map(h=>{ const c=consultasPorDia[iso]?.find(x=>x.hora===h.hora); return { hora:h.hora, estado:c?"agendado":h.disponivel?"disponivel":"bloqueado", paciente:c?.paciente }; })); setSaved(false); }
  function addHor(){
    if(!novoHor||slots.find(s=>s.hora===novoHor)) return;
    setSlots([...slots,{hora:novoHor,estado:"disponivel"}].sort((a,b)=>a.hora.localeCompare(b.hora)));
    setNovoHor(""); setSaved(false);
  }
  function salvar(){ setSaved(true); setTimeout(()=>setSaved(false),2500); }

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
        <button key={s.hora} className={`ag-slot-btn ${s.estado}${highlightHora===s.hora?" highlight":""}`} onClick={()=>toggle(i)}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span className="ag-slot-hora">{s.hora}</span>
            {s.estado==="agendado"  && <span className="ag-slot-label-ag">👤 {s.paciente}</span>}
            {s.estado==="disponivel"&& <span className="ag-slot-label-disp">✓ Disponível</span>}
            {s.estado==="bloqueado" && <span className="ag-slot-label-blq">Bloqueado</span>}
          </div>
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
        </button>
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
    </div>
  );
}


// ─── Calendário Gerenciar ─────────────────────────────────────────────────────

function buildSlotsForDay(iso:string): SlotState[]{
  const consultas = consultasPorDia[iso] ?? [];
  return HORARIOS_DIA.map(h=>{
    const c = consultas.find(x=>x.hora===h.hora);
    return { hora:h.hora, estado:c?"agendado":h.disponivel?"disponivel":"bloqueado", paciente:c?.paciente };
  });
}

function getDayClass(iso:string): string {
  const c = consultasPorDia[iso];
  if(c && c.length>0) return "has-consulta";
  if(HORARIOS_DIA.some(h=>h.disponivel)) return "has-disponivel";
  return "blocked";
}

// ─── Recorrência Semanal ──────────────────────────────────────────────────────

function RecorrenciaSemanal(){
  const [dias,    setDias]    = useState<number[]>([1,2,3,4,5]);
  const [inicio,  setInicio]  = useState("08:00");
  const [fim,     setFim]     = useState("17:00");
  const [duracao, setDuracao] = useState("60min");
  const [saved,   setSaved]   = useState(false);

  function toggleDia(d:number){ setDias(prev=>prev.includes(d)?prev.filter(x=>x!==d):[...prev,d].sort()); setSaved(false); }
  function aplicar(){ setSaved(true); setTimeout(()=>setSaved(false),2500); }

  return (
    <div className="ag-recorr-wrap">
      <p className="ag-recorr-title">🔁 Configurar Horário Semanal Padrão</p>

      <div className="ag-days-row">
        {DIAS_SEMANA_LABELS.map((lb,i)=>(
          <button key={i} className={`ag-day-pill${dias.includes(i)?" active":""}`} onClick={()=>toggleDia(i)}>
            {lb}
          </button>
        ))}
      </div>

      <div className="ag-recorr-row">
        <div className="ag-recorr-field-wrap">
          <span className="ag-recorr-label">Início</span>
          <input type="time" value={inicio} onChange={e=>setInicio(e.target.value)} className="ag-recorr-input" />
        </div>
        <div className="ag-recorr-field-wrap">
          <span className="ag-recorr-label">Fim</span>
          <input type="time" value={fim} onChange={e=>setFim(e.target.value)} className="ag-recorr-input" />
        </div>
      </div>

      <div style={{marginBottom:6}}>
        <span className="ag-recorr-label" style={{display:"block",marginBottom:8}}>Duração da consulta</span>
        <div className="ag-dur-row">
          {["30min","45min","60min","90min"].map(d=>(
            <button key={d} className={`ag-dur-btn${duracao===d?" active":""}`} onClick={()=>setDuracao(d)}>{d}</button>
          ))}
        </div>
      </div>

      {saved && <div className="ag-success-flash" style={{marginBottom:10}}>✓ Padrão aplicado ao mês!</div>}

      <button className="ag-btn-primary" style={{width:"100%"}} onClick={aplicar}>
        Aplicar para o Mês →
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
}

function AbaGerenciar({ sel, setSel, cy, setCy, cm, setCm, consulta, setConsulta, onStatusChange, consultasDia }: AbaGerenciarProps){
  const today = new Date();
  const [slotsMap, setSlotsMap] = useState<Record<string,SlotState[]>>({});

  const days = buildCal(cy, cm);
  const todayISO = toISO(today);

  function getSlots(iso:string): SlotState[]{
    return slotsMap[iso] ?? buildSlotsForDay(iso);
  }
  function setSlots(iso:string, s:SlotState[]){
    setSlotsMap(prev=>({...prev,[iso]:s}));
  }

  function prevMes(){ if(cm===0){setCm(11);setCy(y=>y-1);}else{setCm(m=>m-1);} }
  function nextMes(){ if(cm===11){setCm(0);setCy(y=>y+1);}else{setCm(m=>m+1);} }

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
          <PainelSlots iso={sel} slots={getSlots(sel)} setSlots={(s)=>setSlots(sel,s)} highlightHora={consulta?.hora} consultasDia={consultasDia}/>
        </div>
      </div>

      {/* Recorrência */}
      <RecorrenciaSemanal/>
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

  const iso = toISO(currentDate);
  const consultasHoje = (consultasPorDia[iso] ?? []).map(c=>
    statusOverrides[c.id] ? {...c, status: statusOverrides[c.id]} : c
  );
  
  const consultasSel = (consultasPorDia[gerSel] ?? []).map(c=>
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
                  <img src="https://picsum.photos/200/200?random=30" style={{width:36,height:36,borderRadius:"50%",background:"#27272a",objectFit:"cover"}} alt="Doctor" />
                  <div className="dr-info" style={{display:"flex",flexDirection:"column"}}>
                    <span style={{color:"#fafafa",fontSize:14,fontWeight:"bold"}}>Dr. Rafael Costa</span>
                    <span style={{color:"#a1a1aa",fontSize:12}}>Cardiologista · CRM 54321</span>
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
                  {HORARIOS_DIA.map((h,i)=>{
                    const c=consultasPorHora[h.hora];
                    return (
                      <div key={h.hora} style={{display:"flex",borderBottom:i<HORARIOS_DIA.length-1?"1px solid rgba(255,255,255,0.08)":"none"}}>
                        <div style={{width:80,display:"flex",alignItems:"center",justifyContent:"center",padding:"16px 0",borderRight:"1px solid rgba(255,255,255,0.08)",background:"#09090b"}}>
                          <span style={{color:"#a1a1aa",fontSize:14,fontWeight:"bold"}}>{h.hora}</span>
                        </div>
                        <div style={{flex:1,padding:8,display:"flex",flexDirection:"column",justifyContent:"center",minHeight:80}}>
                          {c ? <ConsultaCard c={c} onPress={()=>handleCardClick(iso,c)}/> : h.disponivel ? (
                            <button onClick={()=>setShowNova(true)} style={{width:"100%",padding:"16px",display:"flex",alignItems:"center",justifyContent:"center",gap:8,background:"transparent",border:"1px dashed rgba(255,255,255,0.15)",borderRadius:12,color:"#71717a",fontSize:13,cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s"}}
                              onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.03)";e.currentTarget.style.borderColor="rgba(255,255,255,0.25)";}}
                              onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor="rgba(255,255,255,0.15)";}}>
                              <div style={{width:6,height:6,borderRadius:"50%",background:"#52525b"}} />
                              Horário disponível
                            </button>
                          ) : (
                            <div style={{flex:1,background:"rgba(255,255,255,0.02)",borderRadius:8,minHeight:40}}/>
                          )}
                        </div>
                      </div>
                    );
                  })}
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
                        {label:"Disponíveis",  value:HORARIOS_DIA.filter(h=>h.disponivel&&!consultasPorHora[h.hora]).length, color:"#a1a1aa"},
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
              onStatusChange={(id, status)=>{
                setStatusOverrides(prev=>({...prev,[id]:status}));
                setGerConsulta(prev=>prev ? {...prev,status} : prev);
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
