"use client";

import { useState, useMemo } from "react";

// ── Paleta (web-client style) ─────────────────────────────────────────────────
const C = {
  bg: "#111111", card: "#1a1a1a", hover: "#222222",
  border: "#27272a", text: "#fafafa", muted: "#a1a1aa",
  dim: "#71717a", green: "#10b981",
};

// ── Status config ─────────────────────────────────────────────────────────────
const statusConfig = {
  ativa:      { label: "ATIVA",      bg: "rgba(16,185,129,0.12)",  color: "#10b981" },
  banida:     { label: "BANIDA",     bg: "rgba(244,63,94,0.12)",   color: "#f43f5e" },
  denunciada: { label: "DENUNCIADA", bg: "rgba(250,204,21,0.12)",  color: "#facc15" },
};

// ── Dados mock ────────────────────────────────────────────────────────────────
const publicacoes = [
  { id:1,  prof:"Dra. Beatriz Oliveira",  crm:"CRM 84.521 · SP",  role:"Dermatologista",         topico:"Dermatologia",         avatar:"https://picsum.photos/id/64/200/200",    imagem:"https://picsum.photos/600/520?random=110", aspectRatio:0.87, likes:312, comentarios:24, status:"ativa",      data:"Há 2 horas",  caption:"Cuidar da pele no verão é essencial. Aplique protetor solar FPS 50+ a cada 2 horas, evite exposição direta entre 10h e 16h e mantenha-se hidratada." },
  { id:2,  prof:"Dr. Rafael Costa",       crm:"CRM 54.321 · SP",  role:"Cardiologista",          topico:"Cardiologia",          avatar:"https://picsum.photos/200/200?random=21", imagem:"https://picsum.photos/600/400?random=210", aspectRatio:1.5,  likes:198, comentarios:11, status:"ativa",      data:"Há 5 horas",  caption:"A saúde cardiovascular começa na alimentação. Reduza o sódio, aumente o potássio e pratique exercícios aeróbicos regularmente." },
  { id:3,  prof:"Personal Studio FitCore",crm:"CREF 28.450 · RJ", role:"Personal Trainer",       topico:"Fitness",              avatar:"https://picsum.photos/200/200?random=24", imagem:"https://picsum.photos/600/700?random=310", aspectRatio:0.86, likes:534, comentarios:47, status:"denunciada", data:"Há 8 horas",  caption:"Fortalecimento do core e correção postural. Pacotes mensais com desconto especial para novos alunos!" },
  { id:4,  prof:"Dra. Ana Souza",         crm:"CRN 12.344 · MG",  role:"Nutricionista",          topico:"Nutrição",             avatar:"https://picsum.photos/200/200?random=23", imagem:"https://picsum.photos/600/450?random=410", aspectRatio:1.33, likes:87,  comentarios:8,  status:"ativa",      data:"Ontem",       caption:"Plano alimentar personalizado para atletas de alto rendimento. Agendamentos disponíveis para o mês de maio." },
  { id:5,  prof:"Marcelo Strong",         crm:"CREF 77.001 · GO", role:"Fisiculturista PRO",     topico:"Musculação",           avatar:"https://picsum.photos/200/200?random=52", imagem:"https://picsum.photos/600/600?random=510", aspectRatio:1.0,  likes:1240,comentarios:89, status:"banida",     data:"Há 2 dias",   caption:"Desconto ABSURDO de 60% na minha mentoria anual! Não perca! Oferta por tempo limitado." },
  { id:6,  prof:"Dra. Juliana Mendes",    crm:"CRP 45.678 · SP",  role:"Psicóloga",              topico:"Saúde Mental",         avatar:"https://picsum.photos/200/200?random=23", imagem:"https://picsum.photos/600/800?random=610", aspectRatio:0.75, likes:420, comentarios:36, status:"ativa",      data:"Há 3 dias",   caption:"Saúde mental é prioridade. Agende sua sessão e dê o primeiro passo para o seu equilíbrio emocional." },
];

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
  const [search, setSearch] = useState("");
  const [statuses, setStatuses] = useState<Record<number, string>>(
    Object.fromEntries(publicacoes.map(p => [p.id, p.status]))
  );

  const filtered = useMemo(() => {
    return publicacoes.filter(p => {
      const st = statuses[p.id];
      if (activeFilter === "Ativas"      && st !== "ativa")      return false;
      if (activeFilter === "Denunciadas" && st !== "denunciada") return false;
      if (activeFilter === "Banidas"     && st !== "banida")     return false;
      if (search) {
        const q = search.toLowerCase();
        if (![p.prof, p.crm, p.topico, p.caption].some(s => s.toLowerCase().includes(q))) return false;
      }
      return true;
    });
  }, [search, activeFilter, statuses]);

  // Masonry: 3 colunas
  const columns: (typeof filtered)[] = [[], [], []];
  filtered.forEach((p, i) => columns[i % 3].push(p));

  const ban     = (id: number) => setStatuses(s => ({ ...s, [id]: "banida" }));
  const approve = (id: number) => setStatuses(s => ({ ...s, [id]: "ativa" }));

  const countAtiva      = publicacoes.filter(p => statuses[p.id] === "ativa").length;
  const countDenunciada = publicacoes.filter(p => statuses[p.id] === "denunciada").length;
  const countBanida     = publicacoes.filter(p => statuses[p.id] === "banida").length;

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
              { label:`${countAtiva} ativas`,       color:"#10b981", bg:"rgba(16,185,129,0.1)"  },
              { label:`${countDenunciada} denunciadas`, color:"#facc15", bg:"rgba(250,204,21,0.1)"  },
              { label:`${countBanida} banidas`,      color:"#f43f5e", bg:"rgba(244,63,94,0.1)"   },
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
            {filtered.length} publicaç{filtered.length !== 1 ? "ões" : "ão"}
          </span>
        </div>

        {/* Filter select — mobile */}
        <div className="pub-filter-mob" style={{ gap:10, alignItems:"center" }}>
          <select value={activeFilter} onChange={e => setActiveFilter(e.target.value)}
            style={{ flex:1, background:"#1a1a1a", border:`1px solid ${C.green}`, borderRadius:10, padding:"10px 16px", color:C.green, fontSize:14, fontWeight:700, fontFamily:"inherit", outline:"none", cursor:"pointer", appearance:"none" }}>
            {FILTERS.map(f => <option key={f} value={f} style={{ background:"#111" }}>{f}</option>)}
          </select>
          <span style={{ color:C.muted, fontSize:13, whiteSpace:"nowrap", flexShrink:0 }}>
            {filtered.length} publicaç{filtered.length !== 1 ? "ões" : "ão"}
          </span>
        </div>

        {/* Masonry */}
        {filtered.length === 0 ? (
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
                  const sc = statusConfig[statuses[pub.id] as keyof typeof statusConfig] || statusConfig.ativa;
                  const isBanida = statuses[pub.id] === "banida";
                  const isDenunciada = statuses[pub.id] === "denunciada";
                  return (
                    <div key={pub.id} className="pub-card" style={{ border:`1px solid ${isDenunciada ? "rgba(250,204,21,0.3)" : isBanida ? "rgba(244,63,94,0.25)" : C.border}`, background: isBanida ? "rgba(244,63,94,0.03)" : C.card, opacity: isBanida ? 0.7 : 1 }}>

                      {/* Card header */}
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 12px 8px" }}>
                        <div style={{ display:"flex", gap:10, alignItems:"center", flex:1, minWidth:0 }}>
                          <div style={{ position:"relative", flexShrink:0 }}>
                            <img src={pub.avatar} alt="" style={{ width:38, height:38, borderRadius:"50%", objectFit:"cover", border:`2px solid ${sc.color}44` }} />
                            {isDenunciada && (
                              <div style={{ position:"absolute", bottom:-2, right:-2, width:14, height:14, borderRadius:"50%", background:"#facc15", border:`2px solid ${C.card}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                                <span style={{ fontSize:7, lineHeight:1 }}>!</span>
                              </div>
                            )}
                          </div>
                          <div style={{ minWidth:0 }}>
                            <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                              <span style={{ color:C.text, fontSize:13, fontWeight:700, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{pub.prof}</span>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="#10b981"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                            </div>
                            <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                              <span style={{ color:C.muted, fontSize:10 }}>{pub.role}</span>
                              <span style={{ color:C.dim, fontSize:10 }}>·</span>
                              <span style={{ color:C.dim, fontSize:10 }}>{pub.data}</span>
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
                        <img src={pub.imagem} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", filter: isBanida ? "grayscale(60%)" : "none", transition:"transform .3s" }}
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
                          <strong style={{ color:C.text }}>{pub.prof.split(" ")[0]} </strong>
                          {pub.caption.length > 90 ? pub.caption.slice(0, 90) + "..." : pub.caption}
                        </p>

                        {/* Divider */}
                        <div style={{ height:1, background:C.border }} />

                        {/* Admin actions */}
                        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                          {(isBanida || isDenunciada) && (
                            <button onClick={() => approve(pub.id)} className="pub-action-btn approve">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                              {isBanida ? "Restaurar" : "Aprovar"}
                            </button>
                          )}
                          {!isBanida && (
                            <button onClick={() => ban(pub.id)} className="pub-action-btn ban">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                              Banir
                            </button>
                          )}
                          <div style={{ display:"flex", alignItems:"center", gap:4, marginLeft:"auto", color:C.dim, fontSize:11 }}>
                            <span>{pub.crm}</span>
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
