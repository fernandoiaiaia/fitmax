"use client";

import { useState, useEffect } from "react";
import {
  fetchAssinaturas,
  criarPlano,
  togglePlano,
  excluirPlano,
  type PlanoItem,
  type PlanoPeriodo,
} from "../../../lib/assinaturas-api";

// ── Paleta ─────────────────────────────────────────────────────────────────────
const C = {
  bg: "#111111", card: "#1a1a1a", hover: "#222222",
  border: "#27272a", text: "#fafafa", muted: "#a1a1aa", dim: "#71717a",
  green: "#10b981",
};

// ── Mapeamento API → UI ──────────────────────────────────────────────────────
// A API usa enum em MAIÚSCULO (MENSAL); a UI usa capitalizado (Mensal)
type Periodo = "Mensal" | "Trimestral" | "Semestral" | "Anual";
interface Plano {
  id: string; nome: string; tipo: Periodo;
  valor: number; consultas: number; taxa: number; ativo: boolean;
}

const API_PERIODO_MAP: Record<PlanoPeriodo, Periodo> = {
  MENSAL: "Mensal", TRIMESTRAL: "Trimestral",
  SEMESTRAL: "Semestral", ANUAL: "Anual",
};
const UI_PERIODO_MAP: Record<Periodo, PlanoPeriodo> = {
  Mensal: "MENSAL", Trimestral: "TRIMESTRAL",
  Semestral: "SEMESTRAL", Anual: "ANUAL",
};

function fromApi(p: PlanoItem): Plano {
  return {
    id: p.id,
    nome: p.nome,
    tipo: API_PERIODO_MAP[p.tipo],
    valor: p.valor,
    consultas: p.consultas,
    taxa: p.taxa,
    ativo: p.ativo,
  };
}

const periodoCor: Record<Periodo, string> = {
  Mensal:      "#10b981",
  Trimestral:  "#60a5fa",
  Semestral:   "#a78bfa",
  Anual:       "#facc15",
};

const planoFeatures: Record<Periodo, string[]> = {
  Mensal:     ["Renovação automática mensal", "Acesso básico à plataforma", "Suporte por e-mail"],
  Trimestral: ["Desconto de 10% no valor", "Relatórios trimestrais", "Suporte prioritário"],
  Semestral:  ["Desconto de 18% no valor", "Acesso antecipado a recursos", "Gerente de conta"],
  Anual:      ["Maior desconto disponível", "Dashboard avançado", "Suporte dedicado 24/7"],
};

// ── CSS ────────────────────────────────────────────────────────────────────────
const PAGE_CSS = `
  @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  @keyframes scaleIn { from{opacity:0;transform:scale(0.96)} to{opacity:1;transform:scale(1)} }
  @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  .asgn-card { border-radius:12px; transition:border-color .18s, background .18s, transform .18s, box-shadow .18s; animation:fadeUp .3s ease both; }
  .asgn-card:hover { border-color:#10b981!important; background:#1e1e1e!important; transform:translateY(-1px); box-shadow:0 4px 20px rgba(16,185,129,0.08); }
  .asgn-input { background:#141414; border:1px solid #262626; border-radius:10px; height:42px; padding:0 12px; color:#fafafa; font-size:14px; font-family:inherit; outline:none; width:100%; transition:border-color .2s; }
  .asgn-input:focus { border-color:rgba(16,185,129,0.5); }
  .asgn-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.7); z-index:200; display:flex; align-items:center; justify-content:center; padding:16px; animation:fadeIn .2s ease; }
  .asgn-modal { background:#1a1a1a; border:1px solid #27272a; border-radius:16px; padding:28px; width:100%; max-width:500px; animation:scaleIn .2s ease; }
  .asgn-btn-green { background:#10b981; border:none; border-radius:8px; color:white; font-size:13px; font-weight:700; cursor:pointer; padding:9px 20px; font-family:inherit; transition:background .15s; }
  .asgn-btn-green:hover { background:#0ea370; }
  .asgn-btn-outline { background:transparent; border:1px solid #27272a; border-radius:8px; color:#a1a1aa; font-size:13px; font-weight:600; cursor:pointer; padding:9px 20px; font-family:inherit; transition:all .15s; }
  .asgn-btn-outline:hover { border-color:#10b981; color:#fafafa; }
  .asgn-btn-danger { background:rgba(244,63,94,0.1); border:1px solid rgba(244,63,94,0.3); border-radius:8px; color:#f43f5e; font-size:12px; font-weight:700; cursor:pointer; padding:7px 14px; font-family:inherit; transition:all .15s; }
  .asgn-btn-danger:hover { background:rgba(244,63,94,0.2); }
  .asgn-periodo-btn { flex:1; min-width:80px; padding:8px 4px; border-radius:8px; font-size:12px; font-weight:600; cursor:pointer; font-family:inherit; transition:all .15s; text-align:center; }
  .asgn-toggle-action { display:flex; align-items:center; gap:6px; padding:6px 12px; border-radius:8px; border:none; background:transparent; font-size:12px; font-weight:700; cursor:pointer; font-family:inherit; transition:all .15s; }
  @media(max-width:680px){ .asgn-plano-row{flex-direction:column!important} .asgn-stat-grid{grid-template-columns:1fr 1fr!important} }
`;

// ── Helpers ────────────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: string }) {
  return <p style={{ color:C.muted, fontSize:11, fontWeight:700, letterSpacing:1, textTransform:"uppercase", margin:"0 0 8px" }}>{children}</p>;
}

function Toggle({ value, onChange, color = C.green }: { value: boolean; onChange: () => void; color?: string }) {
  return (
    <button role="switch" aria-checked={value} onClick={onChange} style={{ width:44, height:24, borderRadius:99, border:"none", cursor:"pointer", background: value ? color : "#27272a", position:"relative", transition:"background 0.2s", flexShrink:0 }}>
      <span style={{ position:"absolute", top:2, left: value ? 22 : 2, width:20, height:20, borderRadius:"50%", background:"#fff", transition:"left 0.2s" }} />
    </button>
  );
}

// ── Modal: Cadastrar Plano ────────────────────────────────────────────────────
function ModalCadastro({ onClose, onSave }: { onClose: () => void; onSave: (p: Omit<Plano,"id">) => Promise<void> }) {
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<Periodo>("Mensal");
  const [valor, setValor] = useState("");
  const [consultas, setConsultas] = useState("");
  const [taxa, setTaxa] = useState("6");
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const save = async () => {
    if (!nome || !valor || !consultas) return;
    setSaving(true);
    setModalError(null);
    try {
      await onSave({ nome, tipo, valor:Number(valor), consultas:Number(consultas), taxa:Number(taxa), ativo:true });
      onClose(); // só fecha se tiver sucesso
    } catch (err: any) { // eslint-disable-line
      const msg = err?.response?.data?.error ?? "Erro ao criar plano. Tente novamente.";
      setModalError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="asgn-overlay" onClick={onClose}>
      <div className="asgn-modal" onClick={e => e.stopPropagation()}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
          <div style={{ width:40, height:40, borderRadius:10, background:"rgba(16,185,129,0.12)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </div>
          <div>
            <h2 style={{ color:C.text, fontSize:18, fontWeight:700, margin:0 }}>Cadastrar Plano</h2>
            <p style={{ color:C.muted, fontSize:13, margin:"2px 0 0" }}>Novo plano será ativado imediatamente.</p>
          </div>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div>
            <SectionLabel>Nome do plano</SectionLabel>
            <input className="asgn-input" value={nome} onChange={e=>setNome(e.target.value)} placeholder="Ex: Plano Ouro" />
          </div>

          <div>
            <SectionLabel>Período</SectionLabel>
            <div style={{ display:"flex", gap:6 }}>
              {(["Mensal","Trimestral","Semestral","Anual"] as Periodo[]).map(t => {
                const isActive = tipo === t;
                const cor = periodoCor[t];
                return (
                  <button key={t} onClick={() => setTipo(t)} className="asgn-periodo-btn"
                    style={{ border:`1px solid ${isActive ? cor : C.border}`, background: isActive ? `${cor}18` : "transparent", color: isActive ? cor : C.muted }}>
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display:"flex", gap:10 }}>
            <div style={{ flex:1 }}>
              <SectionLabel>Valor (R$)</SectionLabel>
              <input className="asgn-input" type="number" value={valor} onChange={e=>setValor(e.target.value)} placeholder="0" />
            </div>
            <div style={{ flex:1 }}>
              <SectionLabel>Qtd. Consultas</SectionLabel>
              <input className="asgn-input" type="number" value={consultas} onChange={e=>setConsultas(e.target.value)} placeholder="10" />
            </div>
            <div style={{ flex:1 }}>
              <SectionLabel>Taxa (%)</SectionLabel>
              <input className="asgn-input" type="number" value={taxa} onChange={e=>setTaxa(e.target.value)} placeholder="6" />
            </div>
          </div>

          {modalError && (
            <div style={{ background:"rgba(244,63,94,0.08)", border:"1px solid rgba(244,63,94,0.3)", borderRadius:8, padding:"8px 12px", color:"#f43f5e", fontSize:12, display:"flex", alignItems:"center", gap:8 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {modalError}
            </div>
          )}
          <div style={{ height:1, background:C.border, margin:"4px 0" }} />
          <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
            <button className="asgn-btn-outline" onClick={onClose} disabled={saving}>Cancelar</button>
            <button className="asgn-btn-green" onClick={save}
              disabled={saving || !nome || !valor || !consultas}
              style={{ opacity: saving || !nome||!valor||!consultas ? 0.6 : 1, display:"flex", alignItems:"center", gap:6 }}>
              {saving && <svg style={{ animation:"spin 0.8s linear infinite" }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>}
              {saving ? "Salvando..." : "Confirmar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Modal: Excluir ─────────────────────────────────────────────────────────────
function ModalDelete({ plano, onClose, onConfirm }: { plano: Plano; onClose: () => void; onConfirm: () => void }) {
  return (
    <div className="asgn-overlay" onClick={onClose}>
      <div className="asgn-modal" style={{ maxWidth:420 }} onClick={e => e.stopPropagation()}>
        <div style={{ width:44, height:44, borderRadius:10, background:"rgba(244,63,94,0.12)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:16 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
        </div>
        <h2 style={{ color:C.text, fontSize:18, fontWeight:700, margin:"0 0 6px" }}>Excluir {plano.nome}</h2>
        <p style={{ color:C.muted, fontSize:13, margin:"0 0 20px" }}>Esta ação não pode ser desfeita. O plano será removido permanentemente.</p>
        <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
          <button className="asgn-btn-outline" onClick={onClose}>Cancelar</button>
          <button onClick={onConfirm} style={{ background:"#f43f5e", border:"none", borderRadius:8, color:"white", fontSize:13, fontWeight:700, cursor:"pointer", padding:"9px 20px", fontFamily:"inherit" }}>Excluir</button>
        </div>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function AssinaturaPage() {
  const [planos,      setPlanos]      = useState<Plano[]>([]);
  const [stats,       setStats]       = useState({ total: 0, ativos: 0, inativos: 0, receitaPotencial: 0 });
  const [loading,     setLoading]     = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showModal,   setShowModal]   = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Plano | null>(null);

  // ── Carrega dados da API ────────────────────────────────────────────────────
  const reload = () => {
    setLoading(true);
    fetchAssinaturas()
      .then(r => { setPlanos(r.planos.map(fromApi)); setStats(r.stats); })
      .catch(() => setActionError("Erro ao carregar planos. Verifique a API."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { reload(); }, []);

  // ── Ações com persistência real ─────────────────────────────────────────────
  const toggle = async (id: string) => {
    try {
      const updated = await togglePlano(id);
      setPlanos(p => p.map(x => x.id === id ? fromApi(updated) : x));
      setStats(s => {
        const wasAtivo = planos.find(x => x.id === id)?.ativo ?? false;
        const delta = wasAtivo ? -1 : 1;
        return {
          ...s,
          ativos:            s.ativos + delta,
          inativos:          s.inativos - delta,
          receitaPotencial:  wasAtivo
            ? s.receitaPotencial - (planos.find(x => x.id === id)?.valor ?? 0)
            : s.receitaPotencial + (updated.valor),
        };
      });
    } catch { setActionError("Erro ao alterar status do plano."); }
  };

  const addPlano = async (p: Omit<Plano, "id">) => {
    setActionError(null);
    // Lança o erro para o modal tratar inline (não usa try/catch aqui)
    const novo = await criarPlano({
      nome:      p.nome,
      tipo:      UI_PERIODO_MAP[p.tipo],
      valor:     p.valor,
      consultas: p.consultas,
      taxa:      p.taxa,
    });
    setPlanos(prev => [...prev, fromApi(novo)]);
    setStats(s => ({
      ...s,
      total:            s.total + 1,
      ativos:           s.ativos + 1,
      receitaPotencial: s.receitaPotencial + novo.valor,
    }));
  };

  const delPlano = async (id: string) => {
    try {
      await excluirPlano(id);
      const plano = planos.find(x => x.id === id);
      setPlanos(p => p.filter(x => x.id !== id));
      setStats(s => ({
        ...s,
        total:            s.total - 1,
        ativos:           plano?.ativo ? s.ativos - 1 : s.ativos,
        inativos:         !plano?.ativo ? s.inativos - 1 : s.inativos,
        receitaPotencial: plano?.ativo ? s.receitaPotencial - (plano.valor) : s.receitaPotencial,
      }));
      setDeleteTarget(null);
    } catch { setActionError("Erro ao excluir plano."); }
  };

  // Stats vêm da API — aliases para o template abaixo
  const ativos        = stats.ativos;
  const inativos      = stats.inativos;
  const receitaMensal = stats.receitaPotencial;

  return (
    <>
      <style>{PAGE_CSS}</style>
      <div style={{ width:"100%", maxWidth:1200, margin:"0 auto", paddingBottom:32, display:"flex", flexDirection:"column", gap:20 }}>

        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ width:44, height:44, borderRadius:12, background:"rgba(16,185,129,0.12)", border:"1px solid rgba(16,185,129,0.25)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
            </div>
            <div>
              <h2 style={{ color:C.text, fontSize:22, fontWeight:700, margin:0, letterSpacing:"-0.02em" }}>Planos de Assinatura</h2>
              <p style={{ color:C.muted, fontSize:13, margin:"3px 0 0" }}>Gerencie e configure os planos da plataforma</p>
            </div>
          </div>
          <button className="asgn-btn-green" onClick={() => setShowModal(true)} style={{ display:"flex", alignItems:"center", gap:8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Cadastrar Plano
          </button>
        </div>

        {/* Stats */}
        <div className="asgn-stat-grid" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
          {[
            { label:"Total de Planos",  value:String(stats.total),         color:C.text,    icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> },
            { label:"Planos Ativos",    value:String(ativos),               color:"#10b981", icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg> },
            { label:"Planos Inativos",  value:String(inativos),             color:"#a1a1aa", icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg> },
            { label:"Receita Potencial",value:`R$ ${receitaMensal.toFixed(2).replace('.',',')}/mês`,color:"#facc15", icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
          ].map((s,i) => (
            <div key={i} className="asgn-card" style={{ background:C.card, border:`1px solid ${C.border}`, borderTop:`3px solid ${s.color}`, padding:16, animationDelay:`${i*0.05}s` }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                <div style={{ width:28, height:28, borderRadius:8, background:`rgba(${s.color==="#10b981"?"16,185,129":s.color==="#facc15"?"250,204,21":"161,161,170"},0.12)`, display:"flex", alignItems:"center", justifyContent:"center", color:s.color }}>
                  {s.icon}
                </div>
                <span style={{ color:C.muted, fontSize:11, fontWeight:600 }}>{s.label}</span>
              </div>
              <p style={{ color:s.color, fontSize:s.label==="Receita Potencial"?16:22, fontWeight:800, margin:0, letterSpacing:"-0.02em" }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Error banner */}
        {actionError && (
          <div style={{ background:"rgba(244,63,94,0.08)", border:"1px solid rgba(244,63,94,0.3)", borderRadius:10, padding:"10px 16px", color:"#f43f5e", fontSize:13, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span>{actionError}</span>
            <button onClick={() => setActionError(null)} style={{ background:"none", border:"none", color:"#f43f5e", cursor:"pointer", fontSize:18, lineHeight:1 }}>×</button>
          </div>
        )}

        {/* Planos list */}
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="asgn-card" style={{ border:`1px solid ${C.border}`, background:C.card, padding:"16px 18px", display:"flex", alignItems:"center", gap:16, animationDelay:`${i*0.06}s` }}>
                <div style={{ width:44, height:44, borderRadius:12, background:"#222" }} />
                <div style={{ flex:1, display:"flex", flexDirection:"column", gap:8 }}>
                  <div style={{ height:13, borderRadius:4, background:"#222", width:"35%" }} />
                  <div style={{ height:10, borderRadius:4, background:"#1e1e1e", width:"55%" }} />
                </div>
                <div style={{ width:80, height:36, borderRadius:8, background:"#222" }} />
              </div>
            ))
          ) : planos.length === 0 ? (
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:40, display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:32 }}>📋</span>
              <span style={{ color:C.muted, fontSize:14 }}>Nenhum plano cadastrado. Crie o primeiro plano acima.</span>
            </div>
          ) : planos.map((plano, idx) => {
            const cor = periodoCor[plano.tipo];
            const features = planoFeatures[plano.tipo];
            return (
              <div key={plano.id} className="asgn-card" style={{ border:`1px solid ${plano.ativo ? cor+"44" : C.border}`, background: C.card, opacity: plano.ativo ? 1 : 0.7, animationDelay:`${0.2+idx*0.06}s` }}>
                <div className="asgn-plano-row" style={{ display:"flex", alignItems:"center", gap:16, padding:"16px 18px" }}>

                  {/* Icon */}
                  <div style={{ width:44, height:44, borderRadius:12, background:`${cor}18`, border:`1px solid ${cor}44`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={cor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                  </div>

                  {/* Info */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                      <span style={{ color:C.text, fontSize:14, fontWeight:700 }}>{plano.nome}</span>
                      <span style={{ color:cor, fontSize:10, fontWeight:700, background:`${cor}18`, borderRadius:999, padding:"2px 10px", border:`1px solid ${cor}33` }}>{plano.tipo.toUpperCase()}</span>
                      {!plano.ativo && <span style={{ color:C.muted, fontSize:10, fontWeight:600, background:"rgba(255,255,255,0.05)", borderRadius:999, padding:"2px 8px" }}>INATIVO</span>}
                    </div>
                    {/* Features */}
                    <div style={{ display:"flex", gap:14, flexWrap:"wrap", marginTop:6 }}>
                      {features.slice(0,2).map((f,i) => (
                        <div key={i} style={{ display:"flex", alignItems:"center", gap:4 }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          <span style={{ color:C.dim, fontSize:11 }}>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Valor e consultas */}
                  <div style={{ textAlign:"right", flexShrink:0 }}>
                    <p style={{ color:cor, fontSize:18, fontWeight:800, margin:0, letterSpacing:"-0.02em" }}>R$ {plano.valor}<span style={{ color:C.muted, fontSize:11, fontWeight:400 }}>/{plano.tipo === "Mensal" ? "mês" : plano.tipo === "Anual" ? "ano" : "per."}</span></p>
                    <p style={{ color:C.dim, fontSize:11, margin:"3px 0 0" }}>{plano.consultas} consultas · Taxa {plano.taxa}%</p>
                  </div>

                  {/* Actions */}
                  <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
                    <button className="asgn-toggle-action" onClick={() => toggle(plano.id)}
                      style={{ color: plano.ativo ? C.green : C.muted, background: plano.ativo ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.04)", border:`1px solid ${plano.ativo ? "rgba(16,185,129,0.2)" : C.border}` }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {plano.ativo
                          ? <><rect x="1" y="5" width="22" height="14" rx="7"/><circle cx="16" cy="12" r="3" fill="currentColor" stroke="none"/></>
                          : <><rect x="1" y="5" width="22" height="14" rx="7"/><circle cx="8" cy="12" r="3" fill="currentColor" stroke="none"/></>
                        }
                      </svg>
                      {plano.ativo ? "Ativo" : "Inativo"}
                    </button>
                    <button className="asgn-btn-danger" onClick={() => setDeleteTarget(plano)}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Taxa info card */}
        <div style={{ border:`1px solid rgba(16,185,129,0.2)`, background:"rgba(16,185,129,0.04)", borderRadius:12, padding:16, display:"flex", alignItems:"center", gap:16 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:"rgba(16,185,129,0.12)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <div>
            <p style={{ color:C.text, fontSize:13, fontWeight:600, margin:0 }}>Taxa de serviço padrão: <span style={{ color:C.green }}>6% por consulta realizada</span></p>
            <p style={{ color:C.dim, fontSize:12, margin:"3px 0 0" }}>Esta taxa é aplicada automaticamente sobre cada consulta ao calcular o repasse ao profissional.</p>
          </div>
        </div>

      </div>

      {showModal && <ModalCadastro onClose={() => setShowModal(false)} onSave={addPlano} />}
      {deleteTarget && <ModalDelete plano={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={() => delPlano(deleteTarget.id)} />}
    </>
  );
}
