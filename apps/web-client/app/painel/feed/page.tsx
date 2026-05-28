//@ts-nocheck
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  listarFeed, curtirPost, comentarPost, listarComentarios, denunciarPost,
  type PostFeed, type ComentarioFeed, type CategoriaFeed,
} from "../../../lib/feed-api";

const C = { bg:"#111111", color2:"#1a1a1a", color3:"#222222", color10:"#71717a", color11:"#a1a1aa", color12:"#fafafa", border:"#27272a" };
const CATEGORY_FILTERS: CategoriaFeed[] = ["Todos","Profissionais","Serviços","Próximos a mim"];

// ─── Avatar fallback ──────────────────────────────────────────────────────────
function avatarSrc(url: string | null, nome: string) {
  if (url) return url;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(nome)}&background=10b981&color=fff&size=64`;
}

// ─── Skeleton card ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{ border:`1px solid ${C.border}`, backgroundColor:C.color2, borderRadius:16, overflow:"hidden" }}>
      <div style={{ display:"flex", gap:10, padding:12, alignItems:"center" }}>
        <div style={{ width:36, height:36, borderRadius:"50%", background:C.color3 }} />
        <div style={{ flex:1, display:"flex", flexDirection:"column", gap:6 }}>
          <div style={{ height:12, width:"60%", background:C.color3, borderRadius:6 }} />
          <div style={{ height:10, width:"40%", background:C.color3, borderRadius:6 }} />
        </div>
      </div>
      <div style={{ width:"100%", height:180, background:C.color3 }} />
      <div style={{ padding:12, display:"flex", flexDirection:"column", gap:8 }}>
        <div style={{ height:10, width:"80%", background:C.color3, borderRadius:6 }} />
        <div style={{ height:10, width:"60%", background:C.color3, borderRadius:6 }} />
      </div>
    </div>
  );
}

// ─── Motivos de denúncia ───────────────────────────────────────────────────────
const MOTIVOS = [
  { value:"spam",              label:"Spam" },
  { value:"conteudo_improprio",label:"Conteúdo impróprio" },
  { value:"desinformacao",     label:"Desinformação" },
  { value:"assedio",           label:"Assédio" },
  { value:"outro",             label:"Outro" },
];

// ─── Seção de comentários ──────────────────────────────────────────────────────
function ComentariosSection({ postId, initialCount }: { postId: string; initialCount: number }) {
  const [lista, setLista]     = useState<ComentarioFeed[]>([]);
  const [texto, setTexto]     = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    listarComentarios(postId).then(r => { setLista(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, [postId]);

  async function enviar() {
    if (!texto.trim() || sending) return;
    setSending(true);
    try {
      const novo = await comentarPost(postId, texto.trim());
      setLista(prev => [...prev, novo]);
      setTexto("");
    } catch { /* silencioso */ } finally { setSending(false); }
  }

  return (
    <div style={{ borderTop:`1px solid ${C.border}`, padding:"10px 12px", display:"flex", flexDirection:"column", gap:8 }}>
      {loading ? (
        <span style={{ color:C.color10, fontSize:12 }}>Carregando comentários…</span>
      ) : lista.length === 0 ? (
        <span style={{ color:C.color10, fontSize:12 }}>Nenhum comentário ainda. Seja o primeiro!</span>
      ) : (
        lista.map(c => (
          <div key={c.id} style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
            <img src={avatarSrc(c.autor.avatarUrl, c.autor.nome)} style={{ width:26, height:26, borderRadius:"50%", objectFit:"cover", flexShrink:0 }} alt="" />
            <div style={{ background:C.color3, borderRadius:10, padding:"6px 10px", flex:1 }}>
              <span style={{ color:C.color12, fontSize:12, fontWeight:"bold" }}>{c.autor.nome} </span>
              <span style={{ color:C.color11, fontSize:12 }}>{c.texto}</span>
            </div>
          </div>
        ))
      )}
      <div style={{ display:"flex", gap:8, marginTop:4 }}>
        <input
          value={texto} onChange={e => setTexto(e.target.value)}
          onKeyDown={e => e.key === "Enter" && enviar()}
          placeholder="Escreva um comentário…"
          style={{ flex:1, background:C.color3, border:`1px solid ${C.border}`, borderRadius:10, padding:"7px 12px", color:C.color12, fontSize:13, outline:"none", fontFamily:"inherit" }}
        />
        <button onClick={enviar} disabled={sending || !texto.trim()}
          style={{ background:"#10b981", border:"none", borderRadius:10, padding:"7px 14px", color:"#fff", fontSize:13, fontWeight:"bold", cursor:"pointer", opacity: sending || !texto.trim() ? 0.5 : 1 }}>
          {sending ? "…" : "Enviar"}
        </button>
      </div>
    </div>
  );
}

// ─── Card do post ──────────────────────────────────────────────────────────────
function PostCard({ post, onLike }: { post: PostFeed; onLike: (id: string) => void }) {
  const [comentando,    setComentando]    = useState(false);
  const [menuAberto,    setMenuAberto]    = useState(false);
  const [denunciando,   setDenunciando]   = useState(false);
  const [motivoDen,     setMotivoDen]     = useState("spam");
  const [denMsg,        setDenMsg]        = useState("");
  const [denSending,    setDenSending]    = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fecha menu ao clicar fora
  useEffect(() => {
    if (!menuAberto) return;
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuAberto(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [menuAberto]);

  async function handleDenunciar() {
    setDenSending(true);
    try {
      const r = await denunciarPost(post.id, motivoDen as any);
      setDenMsg(r.message);
    } catch (e: any) {
      setDenMsg(e?.response?.data?.error ?? "Erro ao denunciar.");
    } finally { setDenSending(false); }
  }

  const localizacao = post.autor.localizacao;

  return (
    <div style={{ border:`1px solid ${C.border}`, backgroundColor:C.color2, borderRadius:16, overflow:"hidden", cursor:"pointer", transition:"background .15s, border-color .15s" }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor=C.color3; (e.currentTarget as HTMLElement).style.borderColor="#10b981"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor=C.color2; (e.currentTarget as HTMLElement).style.borderColor=C.border; }}>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:12 }}>
        <div style={{ display:"flex", gap:12, alignItems:"center" }}>
          <img src={avatarSrc(post.autor.avatarUrl, post.autor.nome)} style={{ width:36, height:36, borderRadius:"50%", objectFit:"cover" }} alt="" />
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ color:C.color12, fontSize:14, fontWeight:"bold" }}>{post.autor.nome}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#10b981"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:4 }}>
              <span style={{ color:C.color11, fontSize:11 }}>{post.autor.especialidade ?? "Profissional"}</span>
              {localizacao && <><span style={{ color:C.color10, fontSize:11 }}> • </span><span style={{ color:"#60a5fa", fontSize:11 }}>{localizacao}</span></>}
            </div>
          </div>
        </div>

        {/* Menu ··· */}
        <div ref={menuRef} style={{ position:"relative" }}>
          <span onClick={() => setMenuAberto(v => !v)} style={{ color:C.color11, fontSize:16, fontWeight:"bold", cursor:"pointer", padding:8 }}>···</span>
          {menuAberto && (
            <div style={{ position:"absolute", right:0, top:"100%", background:C.color2, border:`1px solid ${C.border}`, borderRadius:10, zIndex:10, minWidth:150, boxShadow:"0 8px 24px rgba(0,0,0,0.4)" }}>
              <button onClick={() => { setMenuAberto(false); setDenunciando(true); }}
                style={{ display:"block", width:"100%", textAlign:"left", background:"none", border:"none", color:"#f87171", fontSize:13, padding:"10px 14px", cursor:"pointer", borderRadius:10, fontFamily:"inherit" }}>
                🚩 Denunciar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Image */}
      <div style={{ width:"100%", aspectRatio:post.aspectRatio, backgroundColor:C.color3 }}>
        <img src={post.imagemUrl} style={{ width:"100%", height:"100%", objectFit:"cover" }} alt="" />
      </div>

      {/* Body */}
      <div style={{ padding:12, display:"flex", flexDirection:"column", gap:8 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ display:"flex", gap:16 }}>
            {/* Curtir */}
            <button onClick={() => onLike(post.id)} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:5, padding:0 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill={post.liked ? "#f43f5e" : "none"} stroke={post.liked ? "#f43f5e" : C.color12} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </button>
            {/* Comentar */}
            <button onClick={() => setComentando(v => !v)} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:5, padding:0 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={comentando ? "#10b981" : C.color12} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
              </svg>
            </button>
            {/* Compartilhar (visual) */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.color12} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>
          </div>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.color12} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
        </div>

        <span style={{ color:C.color12, fontSize:12, fontWeight:"bold" }}>
          {post.likes > 0 ? `${post.likes.toLocaleString("pt-BR")} curtida${post.likes !== 1 ? "s" : ""}` : "Seja o primeiro a curtir"}
        </span>

        <div>
          <span style={{ fontSize:10, fontWeight:700, color:"#10b981", background:"rgba(16,185,129,0.1)", border:"1px solid rgba(16,185,129,0.25)", borderRadius:20, padding:"2px 10px" }}>{post.topico}</span>
        </div>
        <p style={{ color:C.color11, fontSize:13, margin:0 }}>
          {post.caption} <strong style={{ color:C.color12 }}>...mais</strong>
        </p>
        {post.comentarios > 0 && !comentando && (
          <button onClick={() => setComentando(true)} style={{ background:"none", border:"none", color:C.color10, fontSize:12, cursor:"pointer", textAlign:"left", padding:0, fontFamily:"inherit" }}>
            Ver {post.comentarios} comentário{post.comentarios !== 1 ? "s" : ""}
          </button>
        )}
      </div>

      {/* Seção de comentários expansível */}
      {comentando && <ComentariosSection postId={post.id} initialCount={post.comentarios} />}

      {/* Modal de denúncia */}
      {denunciando && (
        <div style={{ borderTop:`1px solid ${C.border}`, padding:"12px 14px", background:C.color3, display:"flex", flexDirection:"column", gap:10 }}>
          {denMsg ? (
            <span style={{ color:"#10b981", fontSize:13, textAlign:"center" }}>{denMsg}</span>
          ) : (
            <>
              <span style={{ color:C.color12, fontSize:13, fontWeight:"bold" }}>Qual o motivo da denúncia?</span>
              <select value={motivoDen} onChange={e => setMotivoDen(e.target.value)}
                style={{ background:C.color2, border:`1px solid ${C.border}`, borderRadius:8, padding:"8px 10px", color:C.color12, fontSize:13, fontFamily:"inherit", outline:"none" }}>
                {MOTIVOS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={() => setDenunciando(false)}
                  style={{ flex:1, background:"transparent", border:`1px solid ${C.border}`, borderRadius:8, padding:"8px 0", color:C.color11, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>
                  Cancelar
                </button>
                <button onClick={handleDenunciar} disabled={denSending}
                  style={{ flex:1, background:"#f43f5e", border:"none", borderRadius:8, padding:"8px 0", color:"#fff", fontSize:13, fontWeight:"bold", cursor:"pointer", opacity:denSending ? 0.6 : 1 }}>
                  {denSending ? "Enviando…" : "Denunciar"}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function FeedPage() {
  const [posts,        setPosts]        = useState<PostFeed[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [loadingMore,  setLoadingMore]  = useState(false);
  const [error,        setError]        = useState("");
  const [activeFilter, setActiveFilter] = useState<CategoriaFeed>("Todos");
  const [search,       setSearch]       = useState("");
  const [page,         setPage]         = useState(1);
  const [totalPages,   setTotalPages]   = useState(1);
  const [total,        setTotal]        = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Busca inicial e ao mudar filtro ──────────────────────────────────────────
  const fetchFeed = useCallback(async (q: string, cat: CategoriaFeed, pg: number, append = false) => {
    if (!append) setLoading(true);
    else setLoadingMore(true);
    setError("");
    try {
      const res = await listarFeed({ page: pg, limit: 12, search: q || undefined, categoria: cat });
      setPosts(prev => append ? [...prev, ...res.data] : res.data);
      setTotalPages(res.meta.totalPages);
      setTotal(res.meta.total);
      setPage(pg);
    } catch {
      setError("Não foi possível carregar o feed. Verifique sua conexão.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Carga inicial
  useEffect(() => { fetchFeed("", "Todos", 1); }, [fetchFeed]);

  // Re-busca ao mudar filtro de categoria
  useEffect(() => { fetchFeed(search, activeFilter, 1); }, [activeFilter]);

  // Debounce da busca por texto
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { fetchFeed(search, activeFilter, 1); }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  // ── Toggle curtida com optimistic update ─────────────────────────────────────
  async function handleLike(id: string) {
    // Optimistic: atualiza local antes do response
    setPosts(prev => prev.map(p =>
      p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
    ));
    try {
      const res = await curtirPost(id);
      // Confirma com valor real do servidor
      setPosts(prev => prev.map(p => p.id === id ? { ...p, liked: res.liked, likes: res.likes } : p));
    } catch {
      // Rollback em caso de erro
      setPosts(prev => prev.map(p =>
        p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
      ));
    }
  }

  // ── Distribuição masonry (3 colunas) ─────────────────────────────────────────
  const columns: PostFeed[][] = [[], [], []];
  posts.forEach((post, i) => columns[i % 3].push(post));

  return (
    <>
      <style>{`
        @keyframes shimmer { 0%{opacity:.4} 50%{opacity:.8} 100%{opacity:.4} }
        .sk-pulse { animation: shimmer 1.4s ease-in-out infinite; }
        @media(max-width:640px){.feed-mob{display:block!important}.feed-desk{display:none!important}.feed-masonry{flex-direction:column!important}}
        @media(min-width:641px){.feed-mob{display:none!important}.feed-desk{display:flex!important}}
      `}</style>
      <div style={{ flex:1, overflowY:"auto", backgroundColor:C.bg }}>
        <div style={{ padding:16, maxWidth:1200, margin:"0 auto", display:"flex", flexDirection:"column", gap:20, width:"100%" }} className="sm:p-6">

          <h2 style={{ color:C.color12, fontSize:24, fontWeight:"bold", margin:0 }}>Explorar</h2>

          {/* Search */}
          <div style={{ display:"flex", alignItems:"center", gap:10, background:C.color2, border:`1px solid ${C.border}`, borderRadius:14, padding:"0 16px", boxShadow:"0 4px 24px rgba(0,0,0,0.3)", minHeight:52 }}>
            <span style={{ color:"#10b981", flexShrink:0, display:"flex" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </span>
            <input style={{ background:"transparent", border:"none", outline:"none", color:C.color12, fontSize:15, flex:1, minWidth:0, padding:0 }}
              placeholder="Buscar por serviço, profissional ou palavra-chave..."
              value={search} onChange={e => setSearch(e.target.value)} />
            {search && (
              <button onClick={() => setSearch("")} style={{ background:"none", border:"none", cursor:"pointer", color:C.color10, display:"flex", padding:2, flexShrink:0 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            )}
          </div>

          {/* Mobile filter */}
          <div className="feed-mob" style={{ display:"none" }}>
            <select value={activeFilter} onChange={e => setActiveFilter(e.target.value as CategoriaFeed)} style={{ width:"100%", background:C.color2, border:"1px solid rgba(16,185,129,0.4)", borderRadius:12, padding:"12px 16px", color:"#10b981", fontSize:14, fontWeight:"bold", fontFamily:"inherit", outline:"none", cursor:"pointer" }}>
              {CATEGORY_FILTERS.map(f => <option key={f} value={f} style={{ background:C.bg, color:"#fff" }}>{f}</option>)}
            </select>
          </div>

          {/* Desktop filter pills */}
          <div className="feed-desk" style={{ display:"flex", gap:12, overflowX:"auto", paddingBottom:4 }}>
            {CATEGORY_FILTERS.map(f => {
              const isActive = activeFilter === f;
              return (
                <button key={f} onClick={() => setActiveFilter(f as CategoriaFeed)}
                  style={{ padding:"6px 16px", borderRadius:999, border:`1px solid ${isActive?"#10b981":C.border}`, backgroundColor:isActive?"rgba(16,185,129,0.1)":"transparent", color:isActive?"#10b981":C.color11, fontSize:13, fontWeight:isActive?"bold":"400", cursor:"pointer", transition:"all .15s", fontFamily:"inherit", whiteSpace:"nowrap" }}
                  onMouseEnter={e => { if(!isActive){(e.currentTarget as HTMLElement).style.backgroundColor=C.color3;(e.currentTarget as HTMLElement).style.borderColor="#10b981";} }}
                  onMouseLeave={e => { if(!isActive){(e.currentTarget as HTMLElement).style.backgroundColor="transparent";(e.currentTarget as HTMLElement).style.borderColor=C.border;} }}>
                  {f}
                </button>
              );
            })}
          </div>

          {/* Título dinâmico */}
          <h2 style={{ color:C.color12, fontSize:20, fontWeight:"bold", margin:0 }}>
            {loading ? "Carregando…" : search ? `${total} resultado${total!==1?"s":""} encontrado${total!==1?"s":""}` : "Tendências"}
          </h2>

          {/* Erro */}
          {error && <div style={{ textAlign:"center", color:"#f87171", fontSize:14, padding:20 }}>{error}</div>}

          {/* Skeleton */}
          {loading && (
            <div className="feed-masonry" style={{ display:"flex", gap:16, alignItems:"flex-start" }}>
              {[0,1,2].map(col => (
                <div key={col} style={{ flex:1, display:"flex", flexDirection:"column", gap:16, minWidth:280 }}>
                  {[0,1,2].map(i => <div key={i} className="sk-pulse"><SkeletonCard /></div>)}
                </div>
              ))}
            </div>
          )}

          {/* Posts */}
          {!loading && posts.length === 0 && !error && (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", paddingTop:80, paddingBottom:80, gap:12 }}>
              <span style={{ fontSize:40 }}>🔍</span>
              <span style={{ color:C.color11, fontSize:15 }}>Nenhum resultado encontrado.</span>
              <span style={{ color:C.color10, fontSize:13 }}>Tente outros termos ou ajuste o filtro.</span>
            </div>
          )}

          {!loading && posts.length > 0 && (
            <div className="feed-masonry" style={{ display:"flex", gap:16, alignItems:"flex-start" }}>
              {columns.map((col, colIndex) => (
                <div key={colIndex} style={{ flex:1, display:"flex", flexDirection:"column", gap:16, minWidth:280 }}>
                  {col.map(post => <PostCard key={post.id} post={post} onLike={handleLike} />)}
                </div>
              ))}
            </div>
          )}

          {/* Carregar mais */}
          {!loading && page < totalPages && (
            <div style={{ display:"flex", justifyContent:"center", paddingTop:8, paddingBottom:16 }}>
              <button onClick={() => fetchFeed(search, activeFilter, page + 1, true)} disabled={loadingMore}
                style={{ background:"rgba(16,185,129,0.1)", border:"1px solid rgba(16,185,129,0.3)", borderRadius:12, padding:"12px 32px", color:"#10b981", fontSize:14, fontWeight:"bold", cursor:"pointer", fontFamily:"inherit", opacity:loadingMore ? 0.6 : 1 }}>
                {loadingMore ? "Carregando…" : "Carregar mais"}
              </button>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
