"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchPublicacoes, fetchContadores, banirPublicacao, aprovarPublicacao,
  toRelativeTime,
  type PublicacaoItem, type Contadores,
} from "../../../lib/publicacoes-api";

// ── Paleta (web-client style) ─────────────────────────────────────────────────
const C = {
  bg: "#111111", card: "#1a1a1a", hover: "#222222",
  border: "#27272a", text: "#fafafa", muted: "#a1a1aa",
  dim: "#71717a", green: "#10b981",
};

// ── Status config ─────────────────────────────────────────────────────────────
const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
  ATIVA:      { label: "ATIVA",      bg: "rgba(16,185,129,0.12)",  color: "#10b981" },
  BANIDA:     { label: "BANIDA",     bg: "rgba(244,63,94,0.12)",   color: "#f43f5e" },
  DENUNCIADA: { label: "DENUNCIADA", bg: "rgba(250,204,21,0.12)",  color: "#facc15" },
};

const FILTERS = ["Todas", "Ativas", "Denunciadas", "Banidas"];

// ── CSS ───────────────────────────────────────────────────────────────────────
const PAGE_CSS = `
  @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  .pub-card { border-radius:14px; overflow:hidden; transition:border-color .2s, transform .2s, box-shadow .2s; animation:fadeUp 0.35s ease both; }
  .pub-card:hover { border-color:#10b981!important; transform:translateY(-2px); box-shadow:0 8px 24px rgba(0,0,0,0.35); }
  .pub-action-btn { display:flex; align-items:center; gap:6px; padding:6px 12px; border-radius:8px; font-size:11px; font-weight:700; cursor:pointer; font-family:inherit; transition:all .15s; border:none; }
  .pub-action-btn.approve { background:rgba(16,185,129,0.12); color:#10b981; }
  .pub-action-btn.approve:hover { background:rgba(16,185,129,0.25); }
  .pub-action-btn.ban { background:rgba(244,63,94,0.12); color:#f43f5e; }
  .pub-action-btn.ban:hover { background:rgba(244,63,94,0.25); }
  .pub-action-btn.restore { background:rgba(96,165,250,0.12); color:#60a5fa; }
  .pub-action-btn.restore:hover { background:rgba(96,165,250,0.25); }
  .pub-filter-pill { padding:6px 16px; border-radius:999px; font-size:13px; cursor:pointer; transition:all .15s; font-family:inherit; white-space:nowrap; }
  .pub-search-bar { display:flex; align-items:center; gap:10px; background:#1a1a1a; border:1px solid #27272a; border-radius:14px; padding:0 16px; min-height:50px; box-shadow:0 4px 24px rgba(0,0,0,0.3); transition:border-color .2s; }
  .pub-search-bar:focus-within { border-color:rgba(16,185,129,0.5); }
  @media(max-width:600px){ .pub-masonry{ flex-direction:column!important; } .pub-filter-desk{display:none!important} .pub-filter-mob{display:flex!important} }
  @media(min-width:601px){ .pub-filter-desk{display:flex!important} .pub-filter-mob{display:none!important} }
`;

export default function PublicacoesAdminPage() {
  const [activeFilter, setActiveFilter] = useState("Todas");
  const [search,         setSearch]         = useState("");
  const [debouncedSearch,setDebouncedSearch] = useState("");
  const [publicacoes,    setPublicacoes]    = useState<PublicacaoItem[]>([]);
  const [contadores,     setContadores]     = useState<Contadores>({ ATIVA: 0, DENUNCIADA: 0, BANIDA: 0, total: 0 });
  const [loading,        setLoading]        = useState(true);
  const [loadingAcao,    setLoadingAcao]    = useState<string | null>(null); // id da pub sendo moderada
  const [error,          setError]          = useState<string | null>(null);
  // ref para cancelar debounce
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce busca: 300ms
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  // Mapa de aba → status da API
  const filterToStatus: Record<string, 'ATIVA' | 'DENUNCIADA' | 'BANIDA' | undefined> = {
    Todas: undefined, Ativas: 'ATIVA', Denunciadas: 'DENUNCIADA', Banidas: 'BANIDA',
  };

  const loadData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const status = filterToStatus[activeFilter];
      const [res, cnt] = await Promise.all([
        fetchPublicacoes({ search: debouncedSearch, status, limit: 50 }),
        fetchContadores(),
      ]);
      setPublicacoes(res.data);
      setContadores(cnt);
    } catch {
      setError("Não foi possível carregar as publicações. Verifique sua conexão.");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, activeFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleBanir = async (id: string) => {
    setLoadingAcao(id);
    try {
      // Optimistic Update
      setPublicacoes(prev => {
        if (activeFilter === "Ativas" || activeFilter === "Denunciadas") return prev.filter(p => p.id !== id);
        return prev.map(p => p.id === id ? { ...p, status: 'BANIDA' } : p);
      });
      setContadores(prev => {
        const pub = publicacoes.find(p => p.id === id);
        if (!pub || pub.status === 'BANIDA') return prev;
        return {
          ...prev,
          BANIDA: prev.BANIDA + 1,
          [pub.status]: prev[pub.status as keyof typeof prev] - 1
        };
      });
      await banirPublicacao(id);
      await loadData();
    }
    catch { setError("Erro ao banir publicação."); await loadData(); }
    finally { setLoadingAcao(null); }
  };

  const handleAprovar = async (id: string) => {
    setLoadingAcao(id);
    try {
      // Optimistic Update
      setPublicacoes(prev => {
        if (activeFilter === "Banidas" || activeFilter === "Denunciadas") return prev.filter(p => p.id !== id);
        return prev.map(p => p.id === id ? { ...p, status: 'ATIVA' } : p);
      });
      setContadores(prev => {
        const pub = publicacoes.find(p => p.id === id);
        if (!pub || pub.status === 'ATIVA') return prev;
        return {
          ...prev,
          ATIVA: prev.ATIVA + 1,
          [pub.status]: prev[pub.status as keyof typeof prev] - 1
        };
      });
      await aprovarPublicacao(id);
      await loadData();
    }
    catch { setError("Erro ao aprovar publicação."); await loadData(); }
    finally { setLoadingAcao(null); }
  };

  const filtered = publicacoes; // filtro é server-side

  // Masonry: 3 colunas
  const columns: PublicacaoItem[][] = [[], [], []];
  filtered.forEach((p, i) => columns[i % 3].push(p));

  return (
    <>
      <style>{PAGE_CSS}</style>
      <div style={{ width:"100%", maxWidth:1200, margin:"0 auto", paddingBottom:32, display:"flex", flexDirection:"column", gap:20 }}>

        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", flexWrap:"wrap", gap:12 }}>
          <div>
            <h2 style={{ color:C.text, fontSize:22, fontWeight:700, margin:0, letterSpacing:"-0.02em" }}>Publicações</h2>
            <p style={{ color:C.muted, fontSize:13, margin:"4px 0 0" }}>Modere e gerencie o conteúdo publicado pelos profissionais</p>
          </div>
          {/* Summary pills */}
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {[
              { label:`${contadores.ATIVA} ativas`,       color:"#10b981", bg:"rgba(16,185,129,0.1)"  },
              { label:`${contadores.DENUNCIADA} denunciadas`, color:"#facc15", bg:"rgba(250,204,21,0.1)"  },
              { label:`${contadores.BANIDA} banidas`,      color:"#f43f5e", bg:"rgba(244,63,94,0.1)"   },
            ].map((item, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:6, background:item.bg, borderRadius:999, padding:"4px 12px" }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background:item.color }} />
                <span style={{ color:item.color, fontSize:11, fontWeight:700 }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="pub-search-bar">
          <span style={{ color:C.green, flexShrink:0, display:"flex" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </span>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por profissional, especialidade ou conteúdo..."
            style={{ background:"transparent", border:"none", outline:"none", color:C.text, fontSize:14, flex:1, minWidth:0, fontFamily:"inherit" }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ background:"none", border:"none", cursor:"pointer", color:C.dim, display:"flex", padding:2, flexShrink:0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          )}
        </div>

        {/* Filter pills — desktop */}
        <div className="pub-filter-desk" style={{ gap:10, flexWrap:"wrap", alignItems:"center" }}>
          {FILTERS.map(f => {
            const isActive = activeFilter === f;
            return (
              <button key={f} onClick={() => setActiveFilter(f)} className="pub-filter-pill"
                style={{ border:`1px solid ${isActive ? C.green : C.border}`, background: isActive ? "rgba(16,185,129,0.1)" : "transparent", color: isActive ? C.green : C.muted, fontWeight: isActive ? 700 : 400 }}>
                {f}
              </button>
            );
          })}
          <span style={{ color:C.muted, fontSize:13, alignSelf:"center", marginLeft:"auto" }}>
            {loading ? "Carregando..." : `${contadores.total} publicaç${contadores.total !== 1 ? "ões" : "ão"}`}
          </span>
        </div>

        {/* Filter select — mobile */}
        <div className="pub-filter-mob" style={{ gap:10, alignItems:"center" }}>
          <select value={activeFilter} onChange={e => setActiveFilter(e.target.value)}
            style={{ flex:1, background:"#1a1a1a", border:`1px solid ${C.green}`, borderRadius:10, padding:"10px 16px", color:C.green, fontSize:14, fontWeight:700, fontFamily:"inherit", outline:"none", cursor:"pointer", appearance:"none" }}>
            {FILTERS.map(f => <option key={f} value={f} style={{ background:"#111" }}>{f}</option>)}
          </select>
          <span style={{ color:C.muted, fontSize:13, whiteSpace:"nowrap", flexShrink:0 }}>
            {loading ? "..." : `${contadores.total} publicaç${contadores.total !== 1 ? "ões" : "ão"}`}
          </span>
        </div>

        {/* Masonry */}
        {error ? (
          <div style={{ background:"rgba(244,63,94,0.08)", border:"1px solid rgba(244,63,94,0.3)", borderRadius:12, padding:20, color:"#f43f5e", fontSize:13, textAlign:"center" }}>
            {error}
          </div>
        ) : loading ? (
          <div className="pub-masonry" style={{ display:"flex", gap:14, alignItems:"flex-start" }}>
            {[0,1,2].map(col => (
              <div key={col} style={{ flex:1, display:"flex", flexDirection:"column", gap:14, minWidth:260 }}>
                {[0,1].map(i => (
                  <div key={i} style={{ background:"#1a1a1a", border:"1px solid #27272a", borderRadius:14, overflow:"hidden" }}>
                    <div style={{ padding:"12px 12px 8px", display:"flex", gap:10, alignItems:"center" }}>
                      <div style={{ width:38, height:38, borderRadius:"50%", background:"#222" }} />
                      <div style={{ flex:1, display:"flex", flexDirection:"column", gap:6 }}>
                        <div style={{ height:12, borderRadius:4, background:"#222", width:"60%" }} />
                        <div style={{ height:10, borderRadius:4, background:"#1e1e1e", width:"40%" }} />
                      </div>
                    </div>
                    <div style={{ width:"100%", height: col === 1 ? 200 : 160, background:"#222" }} />
                    <div style={{ padding:12, display:"flex", flexDirection:"column", gap:8 }}>
                      <div style={{ height:10, borderRadius:4, background:"#222", width:"80%" }} />
                      <div style={{ height:10, borderRadius:4, background:"#1e1e1e", width:"60%" }} />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"80px 0", gap:12 }}>
            <span style={{ fontSize:40 }}>🔍</span>
            <span style={{ color:C.muted, fontSize:15 }}>Nenhuma publicação encontrada.</span>
            <span style={{ color:C.dim, fontSize:13 }}>Tente outros termos ou altere o filtro.</span>
          </div>
        ) : (
          <div className="pub-masonry" style={{ display:"flex", gap:14, alignItems:"flex-start" }}>
            {columns.map((col, colIdx) => (
              <div key={colIdx} style={{ flex:1, display:"flex", flexDirection:"column", gap:14, minWidth:260 }}>
                {col.map(pub => {
                  const sc = statusConfig[pub.status] ?? statusConfig['ATIVA'];
                  const isBanida     = pub.status === "BANIDA";
                  const isDenunciada = pub.status === "DENUNCIADA";
                  const isActing     = loadingAcao === pub.id;
                  return (
                    <div key={pub.id} className="pub-card" style={{ border:`1px solid ${isDenunciada ? "rgba(250,204,21,0.3)" : isBanida ? "rgba(244,63,94,0.25)" : C.border}`, background: isBanida ? "rgba(244,63,94,0.03)" : C.card, opacity: isBanida ? 0.7 : 1 }}>

                      {/* Card header */}
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 12px 8px" }}>
                        <div style={{ display:"flex", gap:10, alignItems:"center", flex:1, minWidth:0 }}>
                          <div style={{ position:"relative", flexShrink:0 }}>
                            <img src={pub.profissional.avatarUrl ?? `https://picsum.photos/200/200?random=${pub.id}`} alt="" style={{ width:38, height:38, borderRadius:"50%", objectFit:"cover", border:`2px solid ${sc.color}44` }} />
                            {isDenunciada && (
                              <div style={{ position:"absolute", bottom:-2, right:-2, width:14, height:14, borderRadius:"50%", background:"#facc15", border:`2px solid ${C.card}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                                <span style={{ fontSize:7, lineHeight:1 }}>!</span>
                              </div>
                            )}
                          </div>
                          <div style={{ minWidth:0 }}>
                            <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                              <span style={{ color:C.text, fontSize:13, fontWeight:700, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{pub.profissional.name}</span>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="#10b981"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                            </div>
                            <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                              <span style={{ color:C.muted, fontSize:10 }}>{pub.profissional.especialidade}</span>
                              <span style={{ color:C.dim, fontSize:10 }}>·</span>
                              <span style={{ color:C.dim, fontSize:10 }}>{toRelativeTime(pub.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                        {/* Status badge */}
                        <div style={{ background:sc.bg, borderRadius:999, padding:"3px 10px", flexShrink:0 }}>
                          <span style={{ color:sc.color, fontSize:9, fontWeight:700, letterSpacing:1 }}>{sc.label}</span>
                        </div>
                      </div>

                      {/* Image */}
                      <div style={{ width:"100%", aspectRatio:pub.aspectRatio, background:C.hover, overflow:"hidden" }}>
                        <img src={pub.imagemUrl} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", filter: isBanida ? "grayscale(60%)" : "none", transition:"transform .3s" }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = "scale(1.03)"}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = "scale(1)"}
                        />
                      </div>

                      {/* Body */}
                      <div style={{ padding:12, display:"flex", flexDirection:"column", gap:8 }}>
                        {/* Stats */}
                        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:5, color:C.muted }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                            <span style={{ fontSize:12 }}>{pub.likes.toLocaleString("pt-BR")}</span>
                          </div>
                          <div style={{ display:"flex", alignItems:"center", gap:5, color:C.muted }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                            <span style={{ fontSize:12 }}>{pub.comentarios}</span>
                          </div>
                          <div style={{ marginLeft:"auto" }}>
                            <span style={{ fontSize:10, fontWeight:700, color:C.green, background:"rgba(16,185,129,0.1)", border:"1px solid rgba(16,185,129,0.2)", borderRadius:20, padding:"2px 10px" }}>{pub.topico}</span>
                          </div>
                        </div>

                        {/* Caption */}
                        <p style={{ color:C.muted, fontSize:12, margin:0, lineHeight:1.5 }}>
                          <strong style={{ color:C.text }}>{pub.profissional.name.split(" ")[0]} </strong>
                          {pub.caption.length > 90 ? pub.caption.slice(0, 90) + "..." : pub.caption}
                        </p>

                        {/* Divider */}
                        <div style={{ height:1, background:C.border }} />

                        {/* Admin actions */}
                        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                          {(isBanida || isDenunciada) && (
                            <button onClick={() => handleAprovar(pub.id)} className="pub-action-btn approve" disabled={isActing}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                              {isActing ? "..." : isBanida ? "Restaurar" : "Aprovar"}
                            </button>
                          )}
                          {!isBanida && (
                            <button onClick={() => handleBanir(pub.id)} className="pub-action-btn ban" disabled={isActing}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                              {isActing ? "..." : "Banir"}
                            </button>
                          )}
                          <div style={{ display:"flex", alignItems:"center", gap:4, marginLeft:"auto", color:C.dim, fontSize:11 }}>
                            <span>{pub.profissional.registroProfissional}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
