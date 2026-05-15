"use client";

import React, { useState, useRef, useEffect } from "react";

// ── Paleta (alinhada ao web-client) ─────────────────────────────────────────
const C = {
  bg: "#111111", card: "#1a1a1a", hover: "#222222",
  border: "#27272a", text: "#fafafa", muted: "#a1a1aa",
  dim: "#52525b", green: "#10b981", greenHover: "#0ea370",
};

// ── Status ────────────────────────────────────────────────────────────────────
const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
  pago:     { label: "PAGO",     bg: "rgba(16,185,129,0.12)",  color: "#10b981" },
  pendente: { label: "PENDENTE", bg: "rgba(234,179,8,0.12)",   color: "#facc15" },
  estorno:  { label: "ESTORNO",  bg: "rgba(244,63,94,0.12)",   color: "#f43f5e" },
};

// ── Mock data ─────────────────────────────────────────────────────────────────
const consultas = [
  { id:1, prof:"Dr. Rafael Costa",    paciente:"Amanda Silva",   tipo:"Presencial", especialidade:"Cardiologia", valor:"R$ 350,00", repasse:"R$ 315,00", status:"pago",     dataISO:"2026-04-22", data:"Hoje, 22/04",   horario:"09:00", avatar:"https://picsum.photos/200/200?random=21" },
  { id:2, prof:"Dra. Juliana Mendes", paciente:"Marcos Nogueira",tipo:"Online",     especialidade:"Psicologia",  valor:"R$ 200,00", repasse:"R$ 180,00", status:"pendente",  dataISO:"2026-04-22", data:"Hoje, 22/04",   horario:"11:00", avatar:"https://picsum.photos/200/200?random=23" },
  { id:3, prof:"Dr. Carlos Eduardo",  paciente:"Renata Faria",   tipo:"Presencial", especialidade:"Ortopedia",   valor:"R$ 400,00", repasse:"R$ 360,00", status:"estorno",   dataISO:"2026-04-23", data:"Amanhã, 23/04", horario:"14:30", avatar:"https://picsum.photos/200/200?random=50" },
  { id:4, prof:"Dra. Simone Alves",   paciente:"Tiago Gomes",    tipo:"Online",     especialidade:"Nutrição",    valor:"R$ 250,00", repasse:"R$ 225,00", status:"pago",      dataISO:"2026-04-24", data:"24/04",         horario:"09:00", avatar:"https://picsum.photos/200/200?random=60" },
  { id:5, prof:"Dr. Rafael Costa",    paciente:"Luiza Moreira",  tipo:"Presencial", especialidade:"Cardiologia", valor:"R$ 350,00", repasse:"R$ 315,00", status:"pendente",  dataISO:"2026-05-10", data:"10/05",         horario:"16:00", avatar:"https://picsum.photos/200/200?random=52" },
];

// ── CSS inline ────────────────────────────────────────────────────────────────
const PAGE_CSS = `
  @keyframes calPulse {
    0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,0.5)}
    50%{box-shadow:0 0 0 10px rgba(16,185,129,0)}
  }
  @keyframes dotPulse {
    0%,100%{opacity:1} 50%{opacity:0.4}
  }
  .adm-banner{position:relative;overflow:hidden;border-radius:14px;border:1px solid rgba(16,185,129,0.35);background:linear-gradient(135deg,rgba(16,185,129,0.12),rgba(96,165,250,0.06));padding:18px 22px;display:flex;align-items:center;gap:18px;cursor:pointer;transition:border-color .2s,transform .15s}
  .adm-banner::before{content:'';position:absolute;inset:0;background:linear-gradient(90deg,rgba(16,185,129,0.06),transparent 60%);pointer-events:none}
  .adm-banner:hover{border-color:rgba(16,185,129,0.65);transform:translateY(-1px)}
  .adm-banner-icon{width:48px;height:48px;border-radius:12px;background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.3);display:flex;align-items:center;justify-content:center;flex-shrink:0;animation:calPulse 2.4s ease-in-out infinite}
  .adm-banner-btn{flex-shrink:0;display:flex;align-items:center;gap:8px;background:#10b981;border:none;border-radius:40px;padding:9px 18px;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;transition:background .2s,transform .15s}
  .adm-banner-btn:hover{background:#0ea370;transform:scale(1.03)}
  .adm-cons-row{cursor:pointer;transition:box-shadow .18s,transform .15s}
  .adm-cons-row:hover{transform:translateY(-1px);box-shadow:0 4px 20px rgba(16,185,129,0.1)}
  .adm-cons-inner{border-radius:10px;padding:12px;transition:background .15s,border-color .15s}
  .adm-cons-row:hover .adm-cons-inner{background:#222!important;border-color:#10b981!important}
  .adm-cons-row.selected .adm-cons-inner{background:rgba(16,185,129,0.07)!important;border-color:#10b981!important}
  .adm-arrow{color:#52525b;transition:color .15s,transform .15s;flex-shrink:0}
  .adm-cons-row:hover .adm-arrow{color:#10b981;transform:translateX(3px)}
  .adm-stat-card{border-radius:12px;padding:16px;transition:background .15s,border-color .15s;cursor:pointer}
  .adm-stat-card:hover{background:#222!important;border-color:#10b981!important}
  @media(max-width:640px){
    .adm-banner{flex-wrap:wrap;gap:12px}
    .adm-banner-btn{width:100%;justify-content:center}
    .adm-stats-grid{grid-template-columns:1fr 1fr!important}
    .adm-cons-meta{display:none!important}
  }
  @media print{
    body { background:#fff!important; color:#000!important; font-family:Arial,sans-serif; }
    .adm-print-hide { display:none!important; }
    .adm-print-area { display:block!important; }
    @page { size:A4; margin:20mm 16mm; }
  }
`;

function useOutsideClick(ref: React.RefObject<HTMLElement | null>, cb: () => void) {
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) cb(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [ref, cb]);
}

export default function ConsultasAdminPage() {
  const [selected, setSelected] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("2026-04-22");
  const [dateTo,   setDateTo]   = useState("2026-05-22");
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  useOutsideClick(pickerRef, () => setShowPicker(false));

  const filtered = consultas.filter(c => {
    if (dateFrom && c.dataISO < dateFrom) return false;
    if (dateTo   && c.dataISO > dateTo)   return false;
    const q = search.toLowerCase();
    return !q || c.prof.toLowerCase().includes(q) || c.paciente.toLowerCase().includes(q) || c.especialidade.toLowerCase().includes(q);
  });

  const toggle = (id: number) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const fmtDate = (iso: string) => { const [y,m,d] = iso.split("-"); return `${d}/${m}/${y}`; };

  const totalRepassado  = consultas.filter(c => c.status === "pago").reduce((a, c) => a + parseFloat(c.repasse.replace(/[^\d,]/g,"").replace(",",".")), 0);
  const totalPendente   = consultas.filter(c => c.status === "pendente").reduce((a, c) => a + parseFloat(c.repasse.replace(/[^\d,]/g,"").replace(",",".")), 0);
  const totalEstorno    = consultas.filter(c => c.status === "estorno").reduce((a, c) => a + parseFloat(c.valor.replace(/[^\d,]/g,"").replace(",",".")), 0);
  const totalGeral      = consultas.reduce((a, c) => a + parseFloat(c.valor.replace(/[^\d,]/g,"").replace(",",".")), 0);

  const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  // ── PDF export ────────────────────────────────────────────────────────────
  const exportPDF = () => {
    const now = new Date().toLocaleDateString("pt-BR", { day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" });
    const rows = filtered.map(c => {
      const sc = statusConfig[c.status];
      return `
        <tr style="border-bottom:1px solid #e5e7eb">
          <td style="padding:8px 10px;font-size:12px;color:#111">${c.data} · ${c.horario}</td>
          <td style="padding:8px 10px;font-size:12px;font-weight:600;color:#111">${c.prof}</td>
          <td style="padding:8px 10px;font-size:12px;color:#374151">${c.paciente}</td>
          <td style="padding:8px 10px;font-size:12px;color:#374151">${c.especialidade}</td>
          <td style="padding:8px 10px;font-size:11px">
            <span style="background:${c.tipo==="Online"?"#eff6ff":"#fffbeb"};color:${c.tipo==="Online"?"#2563eb":"#d97706"};padding:2px 8px;border-radius:99px;font-weight:700">${c.tipo}</span>
          </td>
          <td style="padding:8px 10px;font-size:12px;font-weight:700;color:#111;text-align:right">${c.valor}</td>
          <td style="padding:8px 10px;font-size:12px;font-weight:700;color:#059669;text-align:right">${c.repasse}</td>
          <td style="padding:8px 10px;font-size:11px;text-align:center">
            <span style="background:${sc.bg};color:${sc.color};padding:2px 10px;border-radius:99px;font-weight:700;font-size:10px">${sc.label}</span>
          </td>
        </tr>`;
    }).join("");

    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
      <title>FitMax – Relatório de Consultas</title>
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:Arial,sans-serif;background:#fff;color:#111;padding:24px 32px}
        .header{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #10b981}
        .logo{font-size:22px;font-weight:800;color:#111}.logo span{color:#10b981}
        .meta{font-size:11px;color:#6b7280;text-align:right}
        h2{font-size:16px;font-weight:700;color:#111;margin-bottom:4px}
        .subtitle{font-size:12px;color:#6b7280;margin-bottom:20px}
        table{width:100%;border-collapse:collapse;margin-bottom:24px}
        thead tr{background:#f9fafb;border-bottom:2px solid #e5e7eb}
        thead th{padding:10px 10px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#6b7280;text-align:left}
        thead th:last-child,thead th:nth-last-child(2){text-align:right}
        thead th:nth-last-child(3){text-align:center}
        tbody tr:nth-child(even){background:#f9fafb}
        .totals{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:8px}
        .tot{background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px 14px}
        .tot-label{font-size:10px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px}
        .tot-val{font-size:15px;font-weight:800}
        .footer{margin-top:24px;padding-top:12px;border-top:1px solid #e5e7eb;font-size:10px;color:#9ca3af;display:flex;justify-content:space-between}
        @media print{@page{size:A4;margin:15mm 14mm}}
      </style></head><body>
      <div class="header">
        <div class="logo">Fit<span>Max</span> <span style="color:#6b7280;font-size:13px;font-weight:400">ADMIN</span></div>
        <div class="meta"><strong>Relatório de Consultas</strong><br>Período: ${fmtDate(dateFrom)} a ${fmtDate(dateTo)}<br>Gerado em: ${now}</div>
      </div>
      <h2>Gestão de Consultas</h2>
      <p class="subtitle">${filtered.length} consulta${filtered.length!==1?"s":""} no período selecionado</p>
      <table>
        <thead><tr>
          <th>Data / Hora</th><th>Profissional</th><th>Paciente</th>
          <th>Especialidade</th><th>Tipo</th><th>Valor</th><th>Repasse</th><th>Status</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="totals">
        <div class="tot"><div class="tot-label">Total Repassado</div><div class="tot-val" style="color:#10b981">${fmt(totalRepassado)}</div></div>
        <div class="tot"><div class="tot-label">Pendentes</div><div class="tot-val" style="color:#d97706">${fmt(totalPendente)}</div></div>
        <div class="tot"><div class="tot-label">Estornos</div><div class="tot-val" style="color:#ef4444">${fmt(totalEstorno)}</div></div>
        <div class="tot"><div class="tot-label">Total Movimentado</div><div class="tot-val" style="color:#111">${fmt(totalGeral)}</div></div>
      </div>
      <div class="footer"><span>FitMax Admin © ${new Date().getFullYear()}</span><span>${filtered.length} registro${filtered.length!==1?"s":""} exportados</span></div>
      </body></html>`;

    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); }, 400);
  };

  const stats = [
    { label: "Total Repassado",       value: fmt(totalRepassado), color: "#10b981", accent: "rgba(16,185,129,0.35)",  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg> },
    { label: "Repasses Pendentes",    value: fmt(totalPendente),  color: "#facc15", accent: "rgba(250,204,21,0.35)",  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#facc15" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
    { label: "Estornos Solicitados",  value: fmt(totalEstorno),   color: "#f43f5e", accent: "rgba(244,63,94,0.35)",   icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg> },
    { label: "Total Movimentado",     value: fmt(totalGeral),     color: "#a1a1aa", accent: "rgba(161,161,170,0.25)", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
  ];

  return (
    <>
      <style>{PAGE_CSS}</style>
      <div style={{ width:"100%", maxWidth:1200, margin:"0 auto", padding:"0 0 32px", display:"flex", flexDirection:"column", gap:20 }}>

        {/* Banner CTA */}
        <div className="adm-banner">
          <div className="adm-banner-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontSize:15, fontWeight:700, color:C.text, margin:"0 0 3px" }}>Gestão de Repasses</p>
            <p style={{ fontSize:13, color:C.muted, margin:0 }}>Selecione consultas pagas para processar o repasse aos profissionais</p>
          </div>
          <button
            className="adm-banner-btn"
            disabled={selected.length === 0}
            style={{ opacity: selected.length === 0 ? 0.5 : 1, cursor: selected.length === 0 ? "not-allowed" : "pointer" }}
          >
            Repassar {selected.length > 0 ? `(${selected.length})` : "Selecionados"}
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </button>
        </div>

        {/* Header + Filtros */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", flexWrap:"wrap", gap:12 }}>
          <div>
            <h2 style={{ color:C.text, fontSize:22, fontWeight:700, margin:0, letterSpacing:"-0.02em" }}>Gestão de Consultas</h2>
            <p style={{ color:C.muted, fontSize:13, margin:"4px 0 0" }}>Acompanhe e gerencie repasses financeiros</p>
          </div>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
            {/* Search */}
            <div style={{ display:"flex", alignItems:"center", gap:8, background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:"0 12px", height:36, minWidth:220 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar consulta..." style={{ background:"transparent", border:"none", outline:"none", color:C.text, fontSize:13, fontFamily:"inherit", flex:1 }} />
            </div>
            {/* Date picker */}
            <div ref={pickerRef} style={{ position:"relative" }}>
              <button onClick={() => setShowPicker(v => !v)} style={{ display:"flex", alignItems:"center", gap:8, padding:"0 12px", height:36, borderRadius:8, border:`1px solid ${showPicker ? C.green : C.border}`, background:C.card, cursor:"pointer", color:C.muted, fontSize:12, fontFamily:"inherit", transition:"border-color .15s" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <span>{fmtDate(dateFrom)} — {fmtDate(dateTo)}</span>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              {showPicker && (
                <div style={{ position:"absolute", top:"calc(100% + 8px)", right:0, zIndex:100, background:"#1a1a1a", border:`1px solid ${C.border}`, borderRadius:12, padding:16, minWidth:240, boxShadow:"0 8px 32px rgba(0,0,0,0.4)" }}>
                  <div style={{ marginBottom:12 }}>
                    <label style={{ color:C.muted, fontSize:11, fontWeight:600, letterSpacing:0.5, textTransform:"uppercase", marginBottom:4, display:"block" }}>Data inicial</label>
                    <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ background:"#222", border:`1px solid ${C.border}`, borderRadius:8, color:"#fff", padding:"6px 10px", fontSize:13, width:"100%", outline:"none", colorScheme:"dark", fontFamily:"inherit" }} />
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <label style={{ color:C.muted, fontSize:11, fontWeight:600, letterSpacing:0.5, textTransform:"uppercase", marginBottom:4, display:"block" }}>Data final</label>
                    <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ background:"#222", border:`1px solid ${C.border}`, borderRadius:8, color:"#fff", padding:"6px 10px", fontSize:13, width:"100%", outline:"none", colorScheme:"dark", fontFamily:"inherit" }} />
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={() => { setDateFrom("2026-04-22"); setDateTo("2026-05-22"); }} style={{ flex:1, padding:"6px 0", borderRadius:8, fontSize:12, fontWeight:600, background:"transparent", border:`1px solid ${C.border}`, color:C.muted, cursor:"pointer", fontFamily:"inherit" }}>Resetar</button>
                    <button onClick={() => setShowPicker(false)} style={{ flex:1, padding:"6px 0", borderRadius:8, fontSize:12, fontWeight:600, background:C.green, border:"none", color:"#fff", cursor:"pointer", fontFamily:"inherit" }}>Aplicar</button>
                  </div>
                </div>
              )}
            </div>
            {/* Export PDF */}
            <button onClick={exportPDF} style={{ display:"flex", alignItems:"center", gap:6, padding:"0 14px", height:36, borderRadius:8, border:`1px solid ${C.border}`, background:C.card, cursor:"pointer", color:C.muted, fontSize:13, fontFamily:"inherit", transition:"all .15s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.green; (e.currentTarget as HTMLElement).style.color = C.text; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.color = C.muted; }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Exportar PDF
            </button>
          </div>
        </div>

        {/* Stats cards */}
        <div className="adm-stats-grid" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
          {stats.map((s, i) => (
            <div key={i} className="adm-stat-card" style={{ background:C.card, border:`1px solid ${C.border}`, borderTop:`3px solid ${s.color}` }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                <div style={{ width:30, height:30, borderRadius:8, background:`rgba(${s.color === "#10b981" ? "16,185,129" : s.color === "#facc15" ? "250,204,21" : s.color === "#f43f5e" ? "244,63,94" : "161,161,170"},0.12)`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {s.icon}
                </div>
                <span style={{ color:C.muted, fontSize:11, fontWeight:600 }}>{s.label}</span>
              </div>
              <p style={{ color:s.color, fontSize:20, fontWeight:800, margin:0, letterSpacing:"-0.02em" }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Lista */}
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <div>
              <h3 style={{ color:C.text, fontSize:16, fontWeight:700, margin:0 }}>Lista de Consultas</h3>
              <span style={{ color:C.muted, fontSize:12 }}>{filtered.length} consulta{filtered.length !== 1 ? "s" : ""} encontrada{filtered.length !== 1 ? "s" : ""}</span>
            </div>
            {selected.length > 0 && (
              <span style={{ color:C.green, fontSize:12, fontWeight:600 }}>{selected.length} selecionada{selected.length !== 1 ? "s" : ""}</span>
            )}
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {filtered.length === 0 ? (
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:40, display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:32 }}>📭</span>
                <span style={{ color:C.muted, fontSize:14 }}>Nenhuma consulta encontrada para este filtro.</span>
              </div>
            ) : filtered.map(c => {
              const sc  = statusConfig[c.status];
              const sel = selected.includes(c.id);
              return (
                <div key={c.id} className={`adm-cons-row${sel ? " selected" : ""}`} onClick={() => toggle(c.id)}>
                  <div className="adm-cons-inner" style={{ border:`1px solid ${sel ? C.green : C.border}`, background: sel ? "rgba(16,185,129,0.07)" : C.card, display:"flex", alignItems:"center", gap:12 }}>

                    {/* Checkbox */}
                    <div style={{ width:18, height:18, borderRadius:"50%", border:`1.5px solid ${sel ? C.green : C.dim}`, background: sel ? C.green : "transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all .15s" }}>
                      {sel && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                    </div>

                    {/* Horário */}
                    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", width:42, flexShrink:0 }}>
                      <span style={{ color:C.muted, fontSize:11, fontWeight:700 }}>{c.horario}</span>
                      <span style={{ color:C.dim, fontSize:10 }}>{c.data.split(",")[0] || c.data}</span>
                    </div>

                    <div style={{ width:1, height:32, background:C.border, flexShrink:0 }} />

                    {/* Avatar */}
                    <img src={c.avatar} alt="" style={{ width:36, height:36, borderRadius:"50%", objectFit:"cover", flexShrink:0, border:`2px solid ${sel ? C.green : "transparent"}`, transition:"border-color .15s" }} />

                    {/* Info */}
                    <div style={{ flex:2, minWidth:0 }}>
                      <p style={{ color:C.text, fontSize:13, fontWeight:700, margin:0, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{c.prof}</p>
                      <p style={{ color:C.muted, fontSize:11, margin:"2px 0 0" }}>Paciente: {c.paciente}</p>
                      <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:3 }}>
                        <span style={{ color: c.tipo === "Online" ? "#60a5fa" : "#f59e0b", fontSize:10, fontWeight:600 }}>{c.tipo}</span>
                        <span style={{ color:C.dim, fontSize:10 }}>·</span>
                        <span style={{ color:C.dim, fontSize:10 }}>{c.especialidade}</span>
                      </div>
                    </div>

                    {/* Valor */}
                    <div className="adm-cons-meta" style={{ flex:1, minWidth:100 }}>
                      <p style={{ color:C.muted, fontSize:10, margin:0 }}>Consulta</p>
                      <p style={{ color:C.text, fontSize:14, fontWeight:700, margin:"2px 0 0" }}>{c.valor}</p>
                    </div>

                    {/* Repasse */}
                    <div className="adm-cons-meta" style={{ flex:1, minWidth:100 }}>
                      <p style={{ color:C.muted, fontSize:10, margin:0 }}>Repasse (−10%)</p>
                      <p style={{ color:C.green, fontSize:14, fontWeight:700, margin:"2px 0 0" }}>{c.repasse}</p>
                    </div>

                    {/* Badge */}
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <div style={{ background:sc.bg, borderRadius:999, padding:"3px 10px", border:`1px solid ${sc.color}44`, display:"flex", alignItems:"center", gap:5 }}>
                        <div style={{ width:5, height:5, borderRadius:"50%", background:sc.color, animation: c.status === "pendente" ? "dotPulse 1.5s ease-in-out infinite" : "none" }} />
                        <span style={{ color:sc.color, fontSize:9, fontWeight:700, letterSpacing:1 }}>{sc.label}</span>
                      </div>
                    </div>

                    <span className="adm-arrow">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </>
  );
}
