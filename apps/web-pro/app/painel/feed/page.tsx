//@ts-nocheck
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "@/lib/api";

const C = { card:"#141414", card2:"#1a1a1a", border:"rgba(255,255,255,0.07)", bg:"#111111" };
const filters = ["Todos", "Serviços", "Próximos a mim"];

// ─── Debounce hook ────────────────────────────────────────────────────────────
function useDebounce(value: string, ms: number) {
  const [deb, setDeb] = useState(value);
  useEffect(() => { const t = setTimeout(() => setDeb(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return deb;
}

export default function FeedPage() {
  const [activeFilter, setActiveFilter]     = useState("Todos");
  const [searchInput,  setSearchInput]      = useState("");
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [posts, setPosts]                   = useState<any[]>([]);
  const [loading, setLoading]               = useState(true);

  // Criar post state
  const [postCaption, setPostCaption]   = useState("");
  const [postTopico,  setPostTopico]    = useState("");
  const [imageData,   setImageData]     = useState<string | null>(null);  // base64 data URL
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio]   = useState(1.0);
  const [publishing,  setPublishing]    = useState(false);
  const [publishErr,  setPublishErr]    = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Comentários state — { [postId]: { open, texto, list, loadingList, sending } }
  const [comentarios, setComentarios]   = useState<Record<string, any>>({});

  // Expandir caption — set de ids expandidos
  const [expanded, setExpanded]         = useState<Set<string | number>>(new Set());
  const [menuOpenId, setMenuOpenId]     = useState<string | null>(null);

  const searchDebounced = useDebounce(searchInput, 400);

  // ─── Fetch posts ────────────────────────────────────────────────────────────
  const fetchPosts = useCallback((search?: string) => {
    setLoading(true);
    const q = search ? `&search=${encodeURIComponent(search)}` : "";
    api.get(`/pro/feed?page=1&limit=20${q}`)
      .then(r => { if (r.data.data?.length > 0) setPosts(r.data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);
  useEffect(() => { fetchPosts(searchDebounced || undefined); }, [searchDebounced, fetchPosts]);

  // ─── Excluir Post ────────────────────────────────────────────────────────────
  async function handleDeletarPost(postId: string) {
    if (!window.confirm("Tem certeza que deseja excluir esta publicação?")) return;
    try {
      await api.delete(`/pro/feed/${postId}`);
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err) {
      alert("Erro ao excluir publicação");
    }
  }

  // ─── Curtir toggle ──────────────────────────────────────────────────────────
  function handleCurtir(postId: string) {
    // Optimistic update
    setPosts(prev => prev.map(p => p.id === postId
      ? { ...p, liked: !p.liked, likes: p.liked ? Math.max(0, p.likes - 1) : p.likes + 1 }
      : p
    ));
    api.post(`/pro/feed/${postId}/curtir`)
      .then(r => {
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, liked: r.data.liked, likes: r.data.likes } : p));
      })
      .catch(() => {
        // Reverte em caso de erro
        setPosts(prev => prev.map(p => p.id === postId
          ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
          : p
        ));
      });
  }

  // ─── Selecionar imagem do dispositivo ─────────────────────────────────────
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setPublishErr("Selecione um arquivo de imagem."); return; }
    if (file.size > 2 * 1024 * 1024) { setPublishErr("Arquivo muito grande. O tamanho máximo permitido é 2 MB."); return; }
    setPublishErr(null);
    const reader = new FileReader();
    reader.onload = ev => {
      const data = ev.target?.result as string;
      setImageData(data);
      setImagePreview(data);
      // Calcula aspect ratio real
      const img = new Image();
      img.onload = () => setAspectRatio(parseFloat((img.naturalWidth / img.naturalHeight).toFixed(2)));
      img.src = data;
    };
    reader.readAsDataURL(file);
  }

  // ─── Publicar post ──────────────────────────────────────────────────────────
  async function handlePublicar() {
    if (!postCaption.trim() || !imageData || !postTopico.trim()) {
      setPublishErr("Preencha o tópico, a descrição e selecione uma imagem.");
      return;
    }
    setPublishing(true);
    setPublishErr(null);
    try {
      const r = await api.post("/pro/feed", {
        topico:     postTopico.trim(),
        caption:    postCaption.trim(),
        imagemUrl:  imageData,
        aspectRatio,
      });
      setPosts(prev => [r.data, ...prev]);
      setIsCreatingPost(false);
      setPostCaption(""); setPostTopico("");
      setImageData(null); setImagePreview(null); setAspectRatio(1.0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      if (err.response?.status === 422 && err.response?.data?.details) {
        const details = err.response.data.details;
        const firstErrorKey = Object.keys(details)[0];
        if (firstErrorKey && details[firstErrorKey].length > 0) {
          setPublishErr(details[firstErrorKey][0]);
        } else {
          setPublishErr("Erro de validação nos dados enviados.");
        }
      } else if (err.response?.status === 413 || (err.response?.status === 500 && imageData && imageData.length > 2_800_000)) {
        setPublishErr("Arquivo muito grande. O tamanho máximo permitido é 2 MB.");
      } else {
        setPublishErr(err.response?.data?.error ?? "Erro ao publicar. Verifique o tamanho da imagem e tente novamente.");
      }
    } finally {
      setPublishing(false);
    }
  }

  // ─── Comentários ────────────────────────────────────────────────────────────
  function toggleComentarios(postId: string) {
    setComentarios(prev => {
      const cur = prev[postId] ?? { open: false, texto: "", list: [], loadingList: false, sending: false };
      if (!cur.open && cur.list.length === 0) {
        // Carrega comentários ao abrir
        setComentarios(p => ({ ...p, [postId]: { ...cur, open: true, loadingList: true } }));
        api.get(`/pro/feed/${postId}/comentarios?limit=20`)
          .then(r => setComentarios(p => ({ ...p, [postId]: { ...p[postId], list: r.data.data, loadingList: false } })))
          .catch(() => setComentarios(p => ({ ...p, [postId]: { ...p[postId], loadingList: false } })));
        return prev;
      }
      return { ...prev, [postId]: { ...cur, open: !cur.open } };
    });
  }

  async function handleEnviarComentario(postId: string) {
    const cur = comentarios[postId];
    if (!cur?.texto?.trim()) return;
    setComentarios(prev => ({ ...prev, [postId]: { ...prev[postId], sending: true } }));
    try {
      const r = await api.post(`/pro/feed/${postId}/comentar`, { texto: cur.texto.trim() });
      setComentarios(prev => ({
        ...prev,
        [postId]: { ...prev[postId], list: [...(prev[postId]?.list ?? []), r.data], texto: "", sending: false },
      }));
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, comentarios: (p.comentarios ?? 0) + 1 } : p));
    } catch {
      setComentarios(prev => ({ ...prev, [postId]: { ...prev[postId], sending: false } }));
    }
  }

  // ─── Expandir caption ───────────────────────────────────────────────────────
  function toggleExpanded(id: string | number) {
    setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  const columns = [0, 1, 2].map(i => posts.filter((_, idx) => idx % 3 === i));

  return (
    <>
      <style>{`
        .feed-card { background:${C.card}; border:1px solid ${C.border}; border-radius:16px; overflow:hidden; cursor:pointer; transition:background .15s,border-color .15s; }
        .feed-card:hover { background:${C.card2}; border-color:rgba(16,185,129,0.45); }
        .feed-icon-btn { background:none; border:none; cursor:pointer; color:#fafafa; padding:4px; display:flex; transition:color .15s; }
        .feed-icon-btn:hover { color:#10b981; }
        .feed-icon-btn.liked { color:#ef4444; }
        .feed-filter-pill { padding:6px 16px; border-radius:999px; border:1px solid; font-size:13px; cursor:pointer; white-space:nowrap; font-family:inherit; transition:all .15s; }
        .btn-novo-post { display:flex; align-items:center; gap:6px; background:#10b981; border:none; border-radius:999px; height:44px; padding:0 20px; color:white; font-size:14px; font-weight:600; cursor:pointer; font-family:inherit; white-space:nowrap; transition:background .15s; }
        .btn-novo-post:hover { background:#059669; }
        .feed-comment-input { background:#222; border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:#fafafa; padding:8px 12px; font-size:13px; flex:1; outline:none; font-family:inherit; }
        .feed-comment-send { background:#10b981; border:none; border-radius:8px; color:#fff; padding:8px 14px; font-size:13px; font-weight:600; cursor:pointer; font-family:inherit; white-space:nowrap; }
        .feed-comment-send:disabled { opacity:0.5; cursor:not-allowed; }
      `}</style>

      <div style={{ flex:1, overflowY:"auto" }}>
        <div style={{ padding:"1.5rem 2rem", maxWidth:1200, margin:"0 auto", display:"flex", flexDirection:"column", gap:24, width:"100%" }}>

          <h2 style={{ color:"#fafafa", fontSize:22, fontWeight:"bold", margin:0 }}>Explorar</h2>

          {/* Busca + Novo Post */}
          <div style={{ display:"flex", gap:12, alignItems:"center", flexWrap:"wrap" }}>
            <div style={{ flex:1, minWidth:250, background:C.card, border:`1px solid ${C.border}`, borderRadius:999, display:"flex", alignItems:"center", paddingInline:12, height:44, gap:8 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a0a0a0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Buscar serviço, descrição, profissional..."
                style={{ flex:1, background:"transparent", border:"none", outline:"none", color:"#fafafa", fontSize:14, fontFamily:"inherit" }}
              />
            </div>
            <button className="btn-novo-post" onClick={() => { setIsCreatingPost(!isCreatingPost); setPublishErr(null); }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Novo Post
            </button>
          </div>

          {/* Create Post Card */}
          {isCreatingPost && (
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:20, display:"flex", flexDirection:"column", gap:12 }}>
              <h2 style={{ color:"#fafafa", fontSize:18, fontWeight:"bold", margin:0 }}>Criar Nova Publicação</h2>
              <input
                value={postTopico}
                onChange={e => setPostTopico(e.target.value)}
                placeholder="Tópico (ex: Personal Training, Nutrição...)"
                style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:8, color:"#fafafa", padding:"8px 12px", fontSize:13, fontFamily:"inherit", outline:"none" }}
              />
              <textarea
                value={postCaption}
                onChange={e => setPostCaption(e.target.value)}
                placeholder="Descreva sua publicação..."
                style={{ minHeight:80, background:C.card2, border:`1px solid ${C.border}`, borderRadius:10, color:"#fafafa", padding:12, fontSize:14, fontFamily:"inherit", outline:"none", resize:"vertical", boxSizing:"border-box" }}
              />
              {/* File picker — hidden input + clickable area */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display:"none" }}
              />
              {imagePreview ? (
                <div style={{ position:"relative", borderRadius:10, overflow:"hidden", border:`1px solid ${C.border}` }}>
                  <img src={imagePreview} style={{ width:"100%", maxHeight:260, objectFit:"cover", display:"block" }} alt="preview" />
                  <button
                    onClick={() => { setImageData(null); setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                    style={{ position:"absolute", top:8, right:8, background:"rgba(0,0,0,0.7)", border:"none", borderRadius:"50%", width:28, height:28, color:"#fff", cursor:"pointer", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center" }}
                    title="Remover imagem"
                  >✕</button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{ border:`2px dashed ${C.border}`, borderRadius:10, padding:"24px 16px", display:"flex", flexDirection:"column", alignItems:"center", gap:8, cursor:"pointer", transition:"border-color .15s" }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "#10b981")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  <span style={{ color:"#a1a1aa", fontSize:13 }}>Clique para selecionar uma imagem do dispositivo</span>
                  <span style={{ color:"#52525b", fontSize:11 }}>JPG, PNG, WEBP · Máx. 2 MB</span>
                </div>
              )}

              {publishErr && <p style={{ color:"#f43f5e", fontSize:12, margin:0 }}>⚠️ {publishErr}</p>}
              <div style={{ display:"flex", justifyContent:"flex-end", gap:8 }}>
                <button onClick={() => { setIsCreatingPost(false); setPublishErr(null); }} style={{ padding:"6px 16px", borderRadius:8, background:"transparent", border:`1px solid ${C.border}`, color:"#a1a1aa", fontSize:14, cursor:"pointer", fontFamily:"inherit" }}>Cancelar</button>
                <button onClick={handlePublicar} disabled={publishing} style={{ padding:"6px 16px", borderRadius:8, background:"#10b981", border:"none", color:"white", fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"inherit", opacity: publishing ? 0.6 : 1 }}>
                  {publishing ? "Publicando…" : "Publicar"}
                </button>
              </div>
            </div>
          )}

          {/* Filtros */}
          <div style={{ display:"flex", gap:10, overflowX:"auto", paddingBottom:4 }}>
            {filters.map(f => {
              const isActive = activeFilter === f;
              const disabled = f === "Próximos a mim";
              return (
                <button
                  key={f}
                  className="feed-filter-pill"
                  onClick={() => !disabled && setActiveFilter(f)}
                  title={disabled ? "Em breve" : undefined}
                  style={{ borderColor: isActive ? "#10b981" : C.border, background: isActive ? "rgba(16,185,129,0.1)" : "transparent", color: disabled ? "#3f3f46" : isActive ? "#10b981" : "#a1a1aa", fontWeight: isActive ? "bold" : "normal", cursor: disabled ? "not-allowed" : "pointer" }}
                >{f}</button>
              );
            })}
          </div>

          <h2 style={{ color:"#fafafa", fontSize:22, fontWeight:"bold", margin:0 }}>
            {searchDebounced ? `Resultados para "${searchDebounced}"` : "Tendências"}
          </h2>

          {loading && <p style={{ color:"#a1a1aa", fontSize:14, textAlign:"center" }}>Carregando…</p>}

          {/* Masonry Feed */}
          {!loading && (
            <div style={{ display:"flex", gap:16, alignItems:"flex-start" }}>
              {columns.map((col, colIndex) => (
                <div key={colIndex} style={{ flex:1, minWidth:280, display:"flex", flexDirection:"column", gap:16 }}>
                  {col.map((post) => {
                    const isExpanded = expanded.has(post.id);
                    const cap = post.caption ?? post.topico ?? "";
                    const shortCap = cap.length > 100 ? cap.slice(0, 100) : cap;
                    const curCom = comentarios[post.id];

                    return (
                      <div key={post.id} className="feed-card">
                        {/* Header */}
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 12px" }}>
                          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                            <img src={post.autor?.avatarUrl || post.avatar || `https://picsum.photos/200/200?random=${post.id}`} alt={post.autor?.nome ?? post.autor} style={{ width:34, height:34, borderRadius:"50%", objectFit:"cover", flexShrink:0 }} />
                            <div>
                              <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                                <span style={{ color:"#fafafa", fontSize:14, fontWeight:"bold" }}>{post.autor?.nome ?? post.autor}</span>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="#10b981"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                              </div>
                              <span style={{ color:"#71717a", fontSize:11 }}>{post.autor?.especialidade ?? post.role} • {post.autor?.cidade ?? post.location}</span>
                            </div>
                          </div>
                          
                          {/* Menu de Ações do Post */}
                          <div style={{ position:"relative" }}>
                            <span 
                              onClick={() => setMenuOpenId(menuOpenId === post.id ? null : post.id)} 
                              style={{ color:"#71717a", fontSize:16, fontWeight:"bold", cursor:"pointer", padding:8 }}
                            >···</span>
                            
                            {menuOpenId === post.id && (
                              <div style={{ position:"absolute", top:30, right:0, background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:4, zIndex:10, minWidth:120, boxShadow:"0 4px 12px rgba(0,0,0,0.5)" }}>
                                {post.isOwner ? (
                                  <button
                                    onClick={() => { setMenuOpenId(null); handleDeletarPost(post.id); }}
                                    style={{ width:"100%", textAlign:"left", background:"transparent", border:"none", color:"#ef4444", padding:"8px 12px", fontSize:13, cursor:"pointer", borderRadius:4 }}
                                    onMouseEnter={e => e.currentTarget.style.background="rgba(239, 68, 68, 0.1)"}
                                    onMouseLeave={e => e.currentTarget.style.background="transparent"}
                                  >
                                    Excluir Publicação
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => { setMenuOpenId(null); alert("Funcionalidade em breve"); }}
                                    style={{ width:"100%", textAlign:"left", background:"transparent", border:"none", color:"#fafafa", padding:"8px 12px", fontSize:13, cursor:"pointer", borderRadius:4 }}
                                    onMouseEnter={e => e.currentTarget.style.background=C.card2}
                                    onMouseLeave={e => e.currentTarget.style.background="transparent"}
                                  >
                                    Denunciar
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Image */}
                        {(post.imagemUrl || post.image) && (
                          <div style={{ width:"100%", aspectRatio:String(post.aspectRatio ?? 1), background:C.card2, overflow:"hidden" }}>
                            <img src={post.imagemUrl || post.image} style={{ width:"100%", height:"100%", objectFit:"cover" }} alt="" />
                          </div>
                        )}

                        {/* Footer */}
                        <div style={{ padding:"10px 12px", display:"flex", flexDirection:"column", gap:8 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                            <div style={{ display:"flex", gap:14 }}>
                              {/* Curtir toggle */}
                              <button
                                className={`feed-icon-btn${post.liked ? " liked" : ""}`}
                                aria-label="Curtir"
                                onClick={() => handleCurtir(post.id)}
                              >
                                <svg width="22" height="22" viewBox="0 0 24 24" fill={post.liked ? "#ef4444" : "none"} stroke={post.liked ? "#ef4444" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                                </svg>
                              </button>
                              {/* Comentar */}
                              <button className="feed-icon-btn" aria-label="Comentar" onClick={() => toggleComentarios(post.id)}>
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                              </button>
                            </div>
                            <button className="feed-icon-btn" aria-label="Salvar">
                              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                            </button>
                          </div>

                          {/* Likes */}
                          <span style={{ color:"#fafafa", fontSize:12, fontWeight:"bold" }}>
                            {post.likes} curtida{post.likes !== 1 ? "s" : ""}
                            {post.comentarios > 0 && <span style={{ color:"#a1a1aa", fontWeight:"normal" }}> · {post.comentarios} comentário{post.comentarios !== 1 ? "s" : ""}</span>}
                          </span>

                          {/* Caption com "...mais" */}
                          <p style={{ color:"#a1a1aa", fontSize:13, margin:0, lineHeight:1.5 }}>
                            {isExpanded || cap.length <= 100 ? cap : shortCap}
                            {cap.length > 100 && (
                              <span
                                style={{ color:"#fafafa", fontWeight:"bold", cursor:"pointer", marginLeft:4 }}
                                onClick={() => toggleExpanded(post.id)}
                              >
                                {isExpanded ? " ...menos" : " ...mais"}
                              </span>
                            )}
                          </p>

                          {/* Seção de Comentários */}
                          {curCom?.open && (
                            <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:10, display:"flex", flexDirection:"column", gap:8 }}>
                              {curCom.loadingList && <p style={{ color:"#a1a1aa", fontSize:12, margin:0 }}>Carregando comentários…</p>}
                              {curCom.list?.map((c: any) => (
                                <div key={c.id} style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
                                  <img src={c.autor.avatarUrl || `https://picsum.photos/200/200?random=${c.id}`} style={{ width:26, height:26, borderRadius:"50%", objectFit:"cover", flexShrink:0 }} alt="" />
                                  <div style={{ background:C.card2, borderRadius:8, padding:"6px 10px", flex:1 }}>
                                    <span style={{ color:"#fafafa", fontSize:12, fontWeight:"bold" }}>{c.autor.nome}</span>
                                    <p style={{ color:"#a1a1aa", fontSize:12, margin:"2px 0 0" }}>{c.texto}</p>
                                  </div>
                                </div>
                              ))}
                              {curCom.list?.length === 0 && !curCom.loadingList && (
                                <p style={{ color:"#52525b", fontSize:12, margin:0 }}>Seja o primeiro a comentar.</p>
                              )}
                              <div style={{ display:"flex", gap:8, marginTop:4 }}>
                                <input
                                  className="feed-comment-input"
                                  placeholder="Adicionar comentário..."
                                  value={curCom.texto ?? ""}
                                  onChange={e => setComentarios(prev => ({ ...prev, [post.id]: { ...prev[post.id], texto: e.target.value } }))}
                                  onKeyDown={e => e.key === "Enter" && handleEnviarComentario(post.id)}
                                />
                                <button
                                  className="feed-comment-send"
                                  disabled={!curCom.texto?.trim() || curCom.sending}
                                  onClick={() => handleEnviarComentario(post.id)}
                                >
                                  {curCom.sending ? "…" : "Enviar"}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </>
  );
}
