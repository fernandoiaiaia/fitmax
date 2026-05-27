"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchUsuarios, fetchResumo, fetchRecentes,
  toggleStatus, banirUsuario, restaurarUsuario,
  formatDate,
  type UsuarioItem, type Resumo, type RecenteItem, type UserTipo,
} from "../../../lib/usuarios-api";


// ── Paleta ────────────────────────────────────────────────────────────────────
const C = {
  bg: "#111111", card: "#1a1a1a", hover: "#222222",
  border: "#27272a", text: "#fafafa", muted: "#a1a1aa",
  dim: "#71717a", green: "#10b981",
};

// ── Tipos ─────────────────────────────────────────────────────────────────────
type UserStatus = 'ATIVO' | 'INATIVO' | 'BANIDO';

// ── Config ────────────────────────────────────────────────────────────────────
const statusCfg: Record<UserStatus, { label: string; bg: string; color: string }> = {
  ATIVO:   { label:"ATIVO",   bg:"rgba(16,185,129,0.12)",  color:"#10b981" },
  INATIVO: { label:"INATIVO", bg:"rgba(161,161,170,0.1)",  color:"#a1a1aa" },
  BANIDO:  { label:"BANIDO",  bg:"rgba(244,63,94,0.12)",   color:"#f43f5e" },
};
const FILTERS = ["Todos", "Ativos", "Inativos", "Banidos"];
const TIPOS   = ["Todos os tipos", "Clientes", "Profissionais"];

function initials(n: string) { return n.split(" ").slice(0,2).map(p=>p[0]).join("").toUpperCase(); }

// ── CSS ───────────────────────────────────────────────────────────────────────
const PAGE_CSS = `
  @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  .usr-card { border-radius:12px; overflow:hidden; transition:border-color .18s, background .18s, transform .18s, box-shadow .18s; animation:fadeUp 0.3s ease both; cursor:pointer; }
  .usr-card:hover { border-color:#10b981!important; background:#1e1e1e!important; transform:translateY(-1px); box-shadow:0 4px 20px rgba(16,185,129,0.08); }
  .usr-action { display:flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:8px;border:1px solid #27272a;background:transparent;cursor:pointer;transition:all .15s; }
  .usr-search { display:flex;align-items:center;gap:10px;background:#1a1a1a;border:1px solid #27272a;border-radius:14px;padding:0 16px;min-height:50px;box-shadow:0 4px 24px rgba(0,0,0,0.3);transition:border-color .2s; }
  .usr-search:focus-within { border-color:rgba(16,185,129,0.5); }
  .usr-pill { padding:6px 16px;border-radius:999px;font-size:13px;cursor:pointer;transition:all .15s;font-family:inherit;white-space:nowrap; }
  .usr-sidebar-card { border:1px solid #27272a;background:#1a1a1a;border-radius:12px;overflow:hidden;transition:border-color .18s; }
  .usr-sidebar-card:hover { border-color:#10b981; }
  .usr-toggle { display:flex;align-items:center;gap:6px;padding:5px 10px;border-radius:8px;border:1px solid #27272a;background:transparent;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .15s; }
  @media(max-width:900px){ .usr-body{flex-direction:column!important} .usr-sidebar{width:100%!important;min-width:0!important} }
  @media(max-width:600px){ .usr-meta{display:none!important} .usr-filter-desk{display:none!important} .usr-filter-mob{display:flex!important} }
  @media(min-width:601px){ .usr-filter-desk{display:flex!important} .usr-filter-mob{display:none!important} }
`;

export default function UsuariosAdminPage() {
  const [search,        setSearch]        = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterStatus,  setFilterStatus]  = useState("Todos");
  const [filterTipo,    setFilterTipo]    = useState("Todos os tipos");
  const [usuarios,      setUsuarios]      = useState<UsuarioItem[]>([]);
  const [resumo,        setResumo]        = useState<Resumo>({ total: 0, ativos: 0, inativos: 0, banidos: 0, profissionaisPro: 0 });
  const [recentes,      setRecentes]      = useState<RecenteItem[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [loadingAcao,   setLoadingAcao]   = useState<string | null>(null);
  const [error,         setError]         = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce 300ms
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  // Mapa de aba → valor da API
  const filterToStatus: Record<string, 'ATIVO' | 'INATIVO' | 'BANIDO' | undefined> = {
    Todos: undefined, Ativos: 'ATIVO', Inativos: 'INATIVO', Banidos: 'BANIDO',
  };
  const filterToTipo: Record<string, UserTipo | undefined> = {
    'Todos os tipos': undefined, 'Clientes': 'cliente', 'Profissionais': 'profissional',
  };

  const loadData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const status = filterToStatus[filterStatus];
      const tipo   = filterToTipo[filterTipo];
      const [res, res2, res3] = await Promise.all([
        fetchUsuarios({ search: debouncedSearch, status, tipo, limit: 50 }),
        fetchResumo(),
        fetchRecentes(6),
      ]);
      setUsuarios(res.data);
      setResumo(res2);
      setRecentes(res3);
    } catch {
      setError("Não foi possível carregar os usuários. Verifique sua conexão.");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, filterStatus, filterTipo]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleToggle = async (u: UsuarioItem) => {
    setLoadingAcao(u.id);
    const novoStatus = u.status === 'ATIVO' ? 'INATIVO' : 'ATIVO';
    try { await toggleStatus(u.id, u.tipo, novoStatus); await loadData(); }
    catch { setError("Erro ao alterar status."); }
    finally { setLoadingAcao(null); }
  };

  const handleBanir = async (u: UsuarioItem) => {
    setLoadingAcao(u.id);
    try { await banirUsuario(u.id, u.tipo); await loadData(); }
    catch { setError("Erro ao banir usuário."); }
    finally { setLoadingAcao(null); }
  };

  const handleRestaurar = async (u: UsuarioItem) => {
    setLoadingAcao(u.id);
    try { await restaurarUsuario(u.id, u.tipo); await loadData(); }
    catch { setError("Erro ao restaurar usuário."); }
    finally { setLoadingAcao(null); }
  };

  const filtered = usuarios; // filtro é server-side
  const total    = resumo.total;

  return (
    <>
      <style>{PAGE_CSS}</style>
      <div style={{ width:"100%", maxWidth:1200, margin:"0 auto", paddingBottom:32, display:"flex", flexDirection:"column", gap:20 }}>

        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", flexWrap:"wrap", gap:12 }}>
          <div>
            <h2 style={{ color:C.text, fontSize:22, fontWeight:700, margin:0, letterSpacing:"-0.02em" }}>Gestão de Usuários</h2>
            <p style={{ color:C.muted, fontSize:13, margin:"4px 0 0" }}>Gerencie contas, status e acessos dos usuários da plataforma</p>
          </div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {[
              { v:resumo.ativos,   color:"#10b981", label:"ativos" },
              { v:resumo.inativos, color:"#a1a1aa", label:"inativos" },
              { v:resumo.banidos,  color:"#f43f5e", label:"banidos" },
            ].map((item, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:6, background:`rgba(${item.color === "#10b981" ? "16,185,129" : item.color === "#f43f5e" ? "244,63,94" : "161,161,170"},0.1)`, borderRadius:999, padding:"4px 12px" }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background:item.color }} />
                <span style={{ color:item.color, fontSize:11, fontWeight:700 }}>{item.v} {item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="usr-search">
          <span style={{ color:C.green, flexShrink:0, display:"flex" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome, CPF ou e-mail..." style={{ background:"transparent", border:"none", outline:"none", color:C.text, fontSize:14, flex:1, minWidth:0, fontFamily:"inherit" }} />
          {search && (
            <button onClick={() => setSearch("")} style={{ background:"none", border:"none", cursor:"pointer", color:C.dim, display:"flex", padding:2, flexShrink:0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          )}
        </div>

        {/* Filters — desktop */}
        <div className="usr-filter-desk" style={{ gap:8, flexWrap:"wrap", alignItems:"center" }}>
          {FILTERS.map(f => {
            const isActive = filterStatus === f;
            return (
              <button key={f} onClick={() => setFilterStatus(f)} className="usr-pill"
                style={{ border:`1px solid ${isActive ? C.green : C.border}`, background: isActive ? "rgba(16,185,129,0.1)" : "transparent", color: isActive ? C.green : C.muted, fontWeight: isActive ? 700 : 400 }}>
                {f}
              </button>
            );
          })}
          <div style={{ width:1, height:20, background:C.border, margin:"0 4px" }} />
          {TIPOS.map(t => {
            const isActive = filterTipo === t;
            return (
              <button key={t} onClick={() => setFilterTipo(t)} className="usr-pill"
                style={{ border:`1px solid ${isActive ? "#a78bfa" : C.border}`, background: isActive ? "rgba(167,139,250,0.1)" : "transparent", color: isActive ? "#a78bfa" : C.muted, fontWeight: isActive ? 700 : 400 }}>
                {t}
              </button>
            );
          })}
          <span style={{ color:C.dim, fontSize:13, marginLeft:"auto" }}>
            <strong style={{ color:C.text }}>{loading ? "..." : filtered.length}</strong> de {total} usuários
          </span>
        </div>

        {/* Filters — mobile */}
        <div className="usr-filter-mob" style={{ gap:8, flexDirection:"column" }}>
          <div style={{ display:"flex", gap:8 }}>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              style={{ flex:1, background:"#1a1a1a", border:`1px solid ${C.green}`, borderRadius:10, padding:"10px 14px", color:C.green, fontSize:13, fontWeight:700, fontFamily:"inherit", outline:"none", cursor:"pointer", appearance:"none" }}>
              {FILTERS.map(f => <option key={f} value={f} style={{ background:"#111" }}>{f}</option>)}
            </select>
            <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)}
              style={{ flex:1, background:"#1a1a1a", border:`1px solid #a78bfa`, borderRadius:10, padding:"10px 14px", color:"#a78bfa", fontSize:13, fontWeight:700, fontFamily:"inherit", outline:"none", cursor:"pointer", appearance:"none" }}>
              {TIPOS.map(t => <option key={t} value={t} style={{ background:"#111" }}>{t}</option>)}
            </select>
          </div>
          <span style={{ color:C.dim, fontSize:13 }}>
            <strong style={{ color:C.text }}>{loading ? "..." : filtered.length}</strong> de {total} usuários
          </span>
        </div>

        {/* Body: lista + sidebar */}
        <div className="usr-body" style={{ display:"flex", gap:20, alignItems:"flex-start" }}>

          {/* Lista */}
          <div style={{ flex:2, display:"flex", flexDirection:"column", gap:10, minWidth:0 }}>
            {error ? (
              <div style={{ background:"rgba(244,63,94,0.08)", border:"1px solid rgba(244,63,94,0.3)", borderRadius:12, padding:20, color:"#f43f5e", fontSize:13, textAlign:"center" }}>{error}</div>
            ) : loading ? (
              [0,1,2,3].map(i => (
                <div key={i} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"12px 14px", display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ width:42, height:42, borderRadius:"50%", background:"#222", flexShrink:0 }} />
                  <div style={{ flex:1, display:"flex", flexDirection:"column", gap:6 }}>
                    <div style={{ height:12, borderRadius:4, background:"#222", width:"40%" }} />
                    <div style={{ height:10, borderRadius:4, background:"#1a1a1a", width:"60%" }} />
                  </div>
                  <div style={{ width:60, height:20, borderRadius:999, background:"#222" }} />
                </div>
              ))
            ) : filtered.length === 0 ? (
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:48, display:"flex", flexDirection:"column", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:36 }}>👥</span>
                <span style={{ color:C.muted, fontSize:14 }}>Nenhum usuário encontrado.</span>
              </div>
            ) : filtered.map((u, idx) => {
              const sc = statusCfg[u.status] ?? statusCfg['ATIVO'];
              const isPro     = u.tipo === 'profissional';
              const isBanido  = u.status === 'BANIDO';
              const isActing  = loadingAcao === u.id;
              const tipoLabel = isPro ? (u.especialidade ?? 'Profissional') : 'Cliente';
              const tipoColor = isPro ? '#10b981' : '#a1a1aa';
              return (
                <div key={u.id} className="usr-card" style={{ border:`1px solid ${isBanido ? "rgba(244,63,94,0.25)" : C.border}`, background:C.card, animationDelay:`${idx * 0.04}s`, opacity: isBanido ? 0.75 : 1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px" }}>

                    {/* Avatar */}
                    <div style={{ position:"relative", flexShrink:0 }}>
                      {u.avatarUrl ? (
                        <img src={u.avatarUrl} alt="" style={{ width:42, height:42, borderRadius:"50%", objectFit:"cover", border:`2px solid ${tipoColor}44` }} />
                      ) : (
                        <div style={{ width:42, height:42, borderRadius:"50%", background:"#2a2a2a", display:"flex", alignItems:"center", justifyContent:"center", border:`2px solid ${C.border}` }}>
                          <span style={{ color:C.text, fontSize:14, fontWeight:700 }}>{initials(u.nome)}</span>
                        </div>
                      )}
                      <div style={{ position:"absolute", bottom:-1, right:-1, width:10, height:10, borderRadius:"50%", background:sc.color, border:`2px solid ${C.card}` }} />
                    </div>

                    {/* Info principal */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                        <span style={{ color:C.text, fontSize:13, fontWeight:700, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{u.nome}</span>
                        {isPro && (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill={tipoColor}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                        )}
                      </div>
                      <p style={{ color:C.dim, fontSize:11, margin:"2px 0 0", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{u.email}</p>
                      <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:3 }}>
                        <span style={{ color:tipoColor, fontSize:10, fontWeight:700, background:`${tipoColor}18`, borderRadius:999, padding:"1px 8px" }}>
                          {isPro ? `Pro · ${tipoLabel}` : tipoLabel}
                        </span>
                        {u.plano && <span style={{ color:C.dim, fontSize:10 }}>· {u.plano}</span>}
                      </div>
                    </div>

                    {/* CPF */}
                    <div className="usr-meta" style={{ minWidth:130 }}>
                      <p style={{ color:C.dim, fontSize:10, margin:0 }}>CPF</p>
                      <p style={{ color:C.muted, fontSize:12, fontFamily:"monospace", margin:"2px 0 0" }}>{u.cpf ?? '–'}</p>
                      <p style={{ color:C.dim, fontSize:10, margin:"2px 0 0" }}>Cadastro: {formatDate(u.createdAt)}</p>
                    </div>

                    {/* Status badge */}
                    <div style={{ background:sc.bg, borderRadius:999, padding:"3px 10px", flexShrink:0 }}>
                      <span style={{ color:sc.color, fontSize:9, fontWeight:700, letterSpacing:1 }}>{sc.label}</span>
                    </div>

                    {/* Ações */}
                    <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                      {!isBanido && (
                        <button title={u.status === 'ATIVO' ? 'Desativar' : 'Ativar'} disabled={isActing} onClick={e => { e.stopPropagation(); handleToggle(u); }} className="usr-action"
                          style={{ color: u.status === 'ATIVO' ? C.green : C.dim }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.green; (e.currentTarget as HTMLElement).style.color = C.green; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.color = u.status === 'ATIVO' ? C.green : C.dim; }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            {u.status === 'ATIVO'
                              ? <><rect x="1" y="5" width="22" height="14" rx="7"/><circle cx="16" cy="12" r="3" fill="currentColor" stroke="none"/></>
                              : <><rect x="1" y="5" width="22" height="14" rx="7"/><circle cx="8" cy="12" r="3" fill="currentColor" stroke="none"/></>
                            }
                          </svg>
                        </button>
                      )}
                      <button title="Ver documentos" onClick={e => e.stopPropagation()} className="usr-action" style={{ color:C.dim }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#60a5fa"; (e.currentTarget as HTMLElement).style.color = "#60a5fa"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.color = C.dim; }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                      </button>
                      {isBanido ? (
                        <button title="Restaurar acesso" disabled={isActing} onClick={e => { e.stopPropagation(); handleRestaurar(u); }} className="usr-action" style={{ color:C.green }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.green; (e.currentTarget as HTMLElement).style.background = "rgba(16,185,129,0.1)"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </button>
                      ) : (
                        <button title="Banir usuário" disabled={isActing} onClick={e => { e.stopPropagation(); handleBanir(u); }} className="usr-action" style={{ color:C.dim }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#f43f5e"; (e.currentTarget as HTMLElement).style.color = "#f43f5e"; (e.currentTarget as HTMLElement).style.background = "rgba(244,63,94,0.08)"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.color = C.dim; (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sidebar */}
          <div className="usr-sidebar" style={{ width:280, display:"flex", flexDirection:"column", gap:14, flexShrink:0 }}>

            {/* Resumo */}
            <div className="usr-sidebar-card">
              <div style={{ height:3, background:"linear-gradient(90deg,#10b981,#34d399)" }} />
              <div style={{ padding:16, display:"flex", flexDirection:"column", gap:0 }}>
                <span style={{ color:C.muted, fontSize:11, fontWeight:700, letterSpacing:1, textTransform:"uppercase", display:"block", marginBottom:12 }}>Resumo Geral</span>
                {[
                  { label:"Total de usuários",  value:String(resumo.total),            color:C.text },
                  { label:"Usuários ativos",     value:String(resumo.ativos),           color:C.green },
                  { label:"Profissionais PRO",   value:String(resumo.profissionaisPro), color:"#a78bfa" },
                  { label:"Usuários banidos",    value:String(resumo.banidos),          color:"#f43f5e" },
                ].map((item, i, arr) => (
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:12, paddingBottom:12, borderBottom: i < arr.length-1 ? `1px solid ${C.border}` : "none" }}>
                    <span style={{ color:C.muted, fontSize:13 }}>{item.label}</span>
                    <span style={{ color:item.color, fontSize:14, fontWeight:700 }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Últimos cadastros (timeline) */}
            <div className="usr-sidebar-card">
              <div style={{ height:3, background:"linear-gradient(90deg,#a78bfa,#c4b5fd)" }} />
              <div style={{ padding:16, display:"flex", flexDirection:"column", gap:14 }}>
                <span style={{ color:C.muted, fontSize:11, fontWeight:700, letterSpacing:1, textTransform:"uppercase" }}>Últimos Cadastros</span>
                <div>
                  {recentes.map((u, idx) => {
                    const rColor = u.tipo === 'profissional' ? '#10b981' : '#a1a1aa';
                    const rLabel = u.tipo === 'profissional' ? (u.especialidade ?? 'Profissional') : 'Cliente';
                    const isLast = idx === recentes.length - 1;
                    return (
                      <div key={u.id} style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", width:16, flexShrink:0, marginTop:3 }}>
                          <div style={{ width:10, height:10, borderRadius:"50%", border:`2px solid ${C.card}`, background:"#a78bfa", zIndex:2, flexShrink:0 }} />
                          {!isLast && <div style={{ width:2, flex:1, minHeight:28, background:C.border, marginTop:-1 }} />}
                        </div>
                        <div style={{ flex:1, paddingBottom: isLast ? 0 : 12 }}>
                          <span style={{ color:C.dim, fontSize:10, display:"block" }}>{formatDate(u.createdAt)}</span>
                          <span style={{ color:C.text, fontSize:12, fontWeight:600, display:"block" }}>{u.nome}</span>
                          <span style={{ color:rColor, fontSize:10 }}>{rLabel}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:4, width:"100%", padding:"9px 0", borderRadius:8, border:`1px solid ${C.border}`, background:"transparent", color:C.muted, fontSize:12, cursor:"pointer", fontFamily:"inherit", transition:"background .15s" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.hover}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                  Ver todos
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
