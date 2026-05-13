//@ts-nocheck
"use client";

import { useState, useMemo } from "react";

const C = { bg:"#111111", color2:"#1a1a1a", color3:"#222222", color10:"#71717a", color11:"#a1a1aa", color12:"#fafafa", border:"#27272a" };

const feedMock = [
  { id:1,  autor:"Dr. Roberto Alves",    role:"Médico do Esporte",       servico:"Medicina Esportiva",   location:"São Paulo, SP",       distKm:2,  avatar:"https://picsum.photos/200/200?random=21", image:"/sports_medicine_1776777873933.png",  aspectRatio:0.85, likes:"Lucas Mendes e 360 outros",      caption:"Protocolos de hipertrofia: Agenda aberta para Novembro! Consultoria médica esportiva presencial e online." },
  { id:2,  autor:"Camila Nery",          role:"Personal Trainer",        servico:"Personal Training",    location:"Rio de Janeiro, RJ",  distKm:15, avatar:"https://picsum.photos/200/200?random=22", image:"https://picsum.photos/600/400?random=32",  aspectRatio:1.2,  likes:"Você e 210 pessoas",             caption:"Vagas limitadas para o plano trimestral de mobilidade. Agende sua aula experimental!" },
  { id:3,  autor:"Dra. Ana Souza",       role:"Nutricionista Clínica",   servico:"Nutrição Clínica",     location:"Belo Horizonte, MG",  distKm:40, avatar:"https://picsum.photos/200/200?random=23", image:"/nutrition_food_1776777905763.png",         aspectRatio:1.0,  likes:"Gabriel e 450 outros",           caption:"Plano alimentar personalizado para atletas de rendimento. Agendamentos limitados." },
  { id:4,  autor:"Studio FitCore",       role:"Centro de Pilates",       servico:"Pilates Clínico",      location:"Online",              distKm:0,  avatar:"https://picsum.photos/200/200?random=24", image:"/fitness_yoga_1776776568182.png",           aspectRatio:0.9,  likes:"Dr. Roberto e 124 outros",       caption:"Fortalecimento do core e correção postural. Pacotes mensais imperdíveis." },
  { id:5,  autor:"Bruno Silva",          role:"Coach de Crossfit",       servico:"Crossfit",             location:"Curitiba, PR",        distKm:8,  avatar:"https://picsum.photos/200/200?random=25", image:"/crossfit_class_1776777890905.png",         aspectRatio:0.8,  likes:"Camila e 89 outros",             caption:"Aulas experimentais gratuitas sexta-feira! Venha conhecer nossos pacotes." },
  { id:6,  autor:"Lucas Mendes",         role:"Fisioterapeuta",          servico:"Fisioterapia",         location:"Florianópolis, SC",   distKm:3,  avatar:"https://picsum.photos/200/200?random=26", image:"/physiotherapy_1776777920485.png",          aspectRatio:1.25, likes:"Dra. Ana e 45 outros",           caption:"Sessões de liberação miofascial e recovery pós-treino intenso." },
  { id:7,  autor:"Dra. Letícia Marques", role:"Endocrinologista",        servico:"Endocrinologia",       location:"Campinas, SP",        distKm:25, avatar:"https://picsum.photos/200/200?random=50", image:"https://picsum.photos/500/600?random=51",  aspectRatio:0.83, likes:"Bruno Silva e 512 outros",       caption:"Avaliação individual com longo acompanhamento laboratorial. Agende já!" },
  { id:8,  autor:"Marcelo Strong",       role:"Fisiculturista PRO",      servico:"Assessoria Esportiva", location:"Goiânia, GO",         distKm:60, avatar:"https://picsum.photos/200/200?random=52", image:"https://picsum.photos/600/500?random=53",  aspectRatio:1.2,  likes:"Camila Nery e 1.2k outros",     caption:"Mentoria e planilhas exclusivas na preparação pro calendário de competições." },
  { id:9,  autor:"FitNutrition LTDA",    role:"Suplementação",           servico:"Suplementação",        location:"São Paulo, SP",       distKm:5,  avatar:"https://picsum.photos/200/200?random=54", image:"https://picsum.photos/400/400?random=55",  aspectRatio:1.0,  likes:"Dr. Roberto e 890 outros",       caption:"Mega Promoção: nova linha Premium Whey Isolado com coqueteleira e frete grátis!" },
  { id:10, autor:"Clínica OrtoFit",      role:"Ortopedia Esportiva",     servico:"Ortopedia",            location:"Rio de Janeiro, RJ",  distKm:18, avatar:"https://picsum.photos/200/200?random=56", image:"https://picsum.photos/500/700?random=57",  aspectRatio:0.71, likes:"Lucas Mendes e 340 outros",      caption:"Equipe especializada em fisioterapia ortopédica esportiva." },
  { id:11, autor:"Julia Runners",        role:"Coach de Corrida",        servico:"Corrida",              location:"Porto Alegre, RS",    distKm:50, avatar:"https://picsum.photos/200/200?random=58", image:"https://picsum.photos/500/400?random=59",  aspectRatio:1.25, likes:"Você e 180 outros",              caption:"Programa Do 5k à Maratona! Planilhas de corrida 100% online." },
  { id:12, autor:"Dr. Vinícius Almeida", role:"Nutrólogo",               servico:"Nutrologia",           location:"Brasília, DF",        distKm:35, avatar:"https://picsum.photos/200/200?random=60", image:"https://picsum.photos/400/400?random=61",  aspectRatio:1.0,  likes:"Dra. Ana Souza e 560 outros",    caption:"Descubra os protocolos para melhoria radical do sono e do rendimento!" },
];

const CATEGORY_FILTERS = ["Todos","Profissionais","Serviços","Próximos a mim"];

export default function FeedPage() {
  const [activeFilter, setActiveFilter] = useState("Todos");
  const [search, setSearch] = useState("");

  const filtered = useMemo(()=>{
    return feedMock.filter(post=>{
      if (search) {
        const q=search.toLowerCase();
        if (![post.servico,post.role,post.autor,post.caption].some(s=>s.toLowerCase().includes(q))) return false;
      }
      if (activeFilter==="Próximos a mim") { if (post.location!=="Online"&&post.distKm>10) return false; }
      else if (activeFilter==="Profissionais") { if (["Suplementação"].includes(post.servico)) return false; }
      else if (activeFilter==="Serviços") { if (!["Suplementação","Pilates Clínico","Crossfit"].includes(post.servico)) return false; }
      return true;
    });
  }, [search, activeFilter]);

  const columns: (typeof filtered)[] = [[],[],[]];
  filtered.forEach((post,i)=>columns[i%3].push(post));

  return (
    <>
      <style>{`
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
              value={search} onChange={e=>setSearch(e.target.value)} />
            {search && (
              <button onClick={()=>setSearch("")} style={{ background:"none", border:"none", cursor:"pointer", color:C.color10, display:"flex", padding:2, flexShrink:0 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            )}
          </div>

          {/* Mobile filter */}
          <div className="feed-mob" style={{ display:"none" }}>
            <select value={activeFilter} onChange={e=>setActiveFilter(e.target.value)} style={{ width:"100%", background:C.color2, border:"1px solid rgba(16,185,129,0.4)", borderRadius:12, padding:"12px 16px", color:"#10b981", fontSize:14, fontWeight:"bold", fontFamily:"inherit", outline:"none", cursor:"pointer" }}>
              {CATEGORY_FILTERS.map(f=><option key={f} value={f} style={{ background:C.bg, color:"#fff" }}>{f}</option>)}
            </select>
          </div>

          {/* Desktop filter pills */}
          <div className="feed-desk" style={{ display:"flex", gap:12, overflowX:"auto", paddingBottom:4 }}>
            {CATEGORY_FILTERS.map(f=>{
              const isActive=activeFilter===f;
              return (
                <button key={f} onClick={()=>setActiveFilter(f)} style={{ padding:"6px 16px", borderRadius:999, border:`1px solid ${isActive?"#10b981":C.border}`, backgroundColor:isActive?"rgba(16,185,129,0.1)":"transparent", color:isActive?"#10b981":C.color11, fontSize:13, fontWeight:isActive?"bold":"400", cursor:"pointer", transition:"all .15s", fontFamily:"inherit", whiteSpace:"nowrap" }}
                  onMouseEnter={e=>{if(!isActive){(e.currentTarget as HTMLElement).style.backgroundColor=C.color3;(e.currentTarget as HTMLElement).style.borderColor="#10b981";}}}
                  onMouseLeave={e=>{if(!isActive){(e.currentTarget as HTMLElement).style.backgroundColor="transparent";(e.currentTarget as HTMLElement).style.borderColor=C.border;}}}>
                  {f}
                </button>
              );
            })}
          </div>

          <h2 style={{ color:C.color12, fontSize:20, fontWeight:"bold", margin:0 }}>
            {search ? `${filtered.length} resultado${filtered.length!==1?"s":""} encontrado${filtered.length!==1?"s":""}` : "Tendências"}
          </h2>

          {/* Masonry */}
          {filtered.length===0 ? (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", paddingTop:80, paddingBottom:80, gap:12 }}>
              <span style={{ fontSize:40 }}>🔍</span>
              <span style={{ color:C.color11, fontSize:15 }}>Nenhum resultado encontrado.</span>
              <span style={{ color:C.color10, fontSize:13 }}>Tente outros termos ou ajuste a distância.</span>
            </div>
          ) : (
            <div className="feed-masonry" style={{ display:"flex", gap:16, alignItems:"flex-start" }}>
              {columns.map((col,colIndex)=>(
                <div key={colIndex} style={{ flex:1, display:"flex", flexDirection:"column", gap:16, minWidth:280 }}>
                  {col.map(post=>(
                    <div key={post.id} style={{ border:`1px solid ${C.border}`, backgroundColor:C.color2, borderRadius:16, overflow:"hidden", cursor:"pointer", transition:"background .15s, border-color .15s" }}
                      onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.backgroundColor=C.color3;(e.currentTarget as HTMLElement).style.borderColor="#10b981";}}
                      onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.backgroundColor=C.color2;(e.currentTarget as HTMLElement).style.borderColor=C.border;}}>
                      {/* Header */}
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:12 }}>
                        <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                          <img src={post.avatar} style={{ width:36, height:36, borderRadius:"50%", objectFit:"cover" }} alt="" />
                          <div>
                            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                              <span style={{ color:C.color12, fontSize:14, fontWeight:"bold" }}>{post.autor}</span>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="#10b981"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                            </div>
                            <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                              <span style={{ color:C.color11, fontSize:11 }}>{post.role}</span>
                              <span style={{ color:C.color10, fontSize:11 }}> • </span>
                              <span style={{ color:post.location==="Online"?"#10b981":"#60a5fa", fontSize:11 }}>
                                {post.location==="Online"?"Online":`${post.distKm} km`}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span style={{ color:C.color11, fontSize:16, fontWeight:"bold", cursor:"pointer", padding:8 }}>···</span>
                      </div>
                      {/* Image */}
                      <div style={{ width:"100%", aspectRatio:post.aspectRatio, backgroundColor:C.color3 }}>
                        <img src={post.image} style={{ width:"100%", height:"100%", objectFit:"cover" }} alt="" />
                      </div>
                      {/* Body */}
                      <div style={{ padding:12, display:"flex", flexDirection:"column", gap:8 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                          <div style={{ display:"flex", gap:16 }}>
                            {["M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z","M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z","M3 11l19-9-9 19-2-8-8-2z"].map((d,i)=>(
                              <svg key={i} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.color12} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d}/></svg>
                            ))}
                          </div>
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.color12} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                        </div>
                        <span style={{ color:C.color12, fontSize:12, fontWeight:"bold" }}>Curtido por {post.likes}</span>
                        <div>
                          <span style={{ fontSize:10, fontWeight:700, color:"#10b981", background:"rgba(16,185,129,0.1)", border:"1px solid rgba(16,185,129,0.25)", borderRadius:20, padding:"2px 10px" }}>{post.servico}</span>
                        </div>
                        <p style={{ color:C.color11, fontSize:13, margin:0 }}>
                          {post.caption} <strong style={{ color:C.color12 }}>...mais</strong>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
