//@ts-nocheck
"use client";

import { useState } from "react";

const feedMock = [
  { id:1,  autor:"Dr. Roberto Alves",    role:"Médico do Esporte",       location:"São Paulo, SP",        avatar:"https://picsum.photos/200/200?random=21", image:"/feed_sports_medicine.png",              aspectRatio:0.85, likes:"Lucas Mendes e 360 outros",          caption:"Protocolos de hipertrofia: Agenda aberta para Novembro! Consultoria médica esportiva presencial e online. Link na bio! 🏋️‍♂️",        col:0 },
  { id:2,  autor:"Camila Nery",          role:"Personal Trainer",         location:"Rio de Janeiro, RJ",   avatar:"https://picsum.photos/200/200?random=22", image:"/personal_mobility_1777412707712.png",   aspectRatio:1.0,  likes:"Você e 210 pessoas",                 caption:"Personal Training: Vagas limitadas para o plano trimestral de mobilidade. Agende sua aula experimental! 🔥",                        col:1 },
  { id:3,  autor:"Dra. Ana Souza",       role:"Nutricionista Clínica",    location:"Belo Horizonte, MG",   avatar:"https://picsum.photos/200/200?random=23", image:"/feed_nutrition.png",                    aspectRatio:1.0,  likes:"Gabriel e 450 outros",               caption:"Atendimento Nutricional Clínico: Plano alimentar personalizado para atletas de rendimento. Agendamentos limitados 🥑",               col:2 },
  { id:4,  autor:"Studio FitCore",       role:"Centro de Pilates",        location:"Online",               avatar:"https://picsum.photos/200/200?random=24", image:"/feed_pilates.png",                      aspectRatio:0.9,  likes:"Dr. Roberto e 124 outros",           caption:"Aulas de Pilates Clínico: Fortalecimento do core e correção postural. Pacotes mensais imperdíveis. Reserve o seu ✨",                col:0 },
  { id:5,  autor:"Bruno Silva",          role:"Coach de Crossfit",        location:"Curitiba, PR",         avatar:"https://picsum.photos/200/200?random=25", image:"/feed_crossfit.png",                     aspectRatio:0.8,  likes:"Camila e 89 outros",                 caption:"Box Crossfit Elite: Aulas experimentais gratuitas sexta-feira! Venha conhecer nossos pacotes e coachs credenciados. 💧",             col:1 },
  { id:6,  autor:"Lucas Mendes",         role:"Fisioterapeuta",           location:"Florianópolis, SC",    avatar:"https://picsum.photos/200/200?random=26", image:"/feed_physiotherapy.png",                aspectRatio:1.25, likes:"Dra. Ana e 45 outros",               caption:"Fisioterapia Desportiva: Sessões de liberação miofascial e recovery pós-treino intenso da maratona. Marque a sua sessão! 🛠️",        col:2 },
  { id:7,  autor:"Dra. Letícia Marques", role:"Endocrinologista",         location:"Campinas, SP",         avatar:"https://picsum.photos/200/200?random=50", image:"/endocrinology_lab_1777412721693.png",   aspectRatio:1.0,  likes:"Bruno Silva e 512 outros",           caption:"Consultoria em Modulação Hormonal: Avaliação individual com longo acompanhamento laboratorial. Agende já! 🔬",                       col:0 },
  { id:8,  autor:"Marcelo Strong",       role:"Fisioculturista PRO",      location:"Goiânia, GO",          avatar:"https://picsum.photos/200/200?random=52", image:"/bodybuilder_gym_1777412737015.png",     aspectRatio:1.0,  likes:"Camila Nery e 1.2k outros",          caption:"Assessoria Esportiva PRO: Mentoria e planilhas exclusivas na preparação pro calendário de competições. Vagas abertas 💪",            col:1 },
  { id:9,  autor:"FitNutrition LTDA",    role:"Suplementação",            location:"São Paulo, SP",        avatar:"https://picsum.photos/200/200?random=54", image:"/whey_protein_1777412750568.png",        aspectRatio:1.0,  likes:"Dr. Roberto e 890 outros",           caption:"Mega Promoção: Compre a nova linha Premium Whey Isolado e ganhe coqueteleira e frete grátis! Peça pelo aplicativo. 🥤",             col:2 },
  { id:10, autor:"Clínica OrtoFit",      role:"Ortopedia Esportiva",      location:"Rio de Janeiro, RJ",   avatar:"https://picsum.photos/200/200?random=56", image:"/orthopedics_knee_1777412763031.png",    aspectRatio:1.0,  likes:"Lucas Mendes e 340 outros",          caption:"Tratamento Intensivo LCA: Equipe especializada em fisioterapia ortopédica esportiva para te trazer de volta ao jogo. Entre em contato! 🦴", col:0 },
  { id:11, autor:"Julia Runners",        role:"Coach de Corrida",         location:"Porto Alegre, RS",     avatar:"https://picsum.photos/200/200?random=58", image:"/running_coach_1777412779589.png",       aspectRatio:1.0,  likes:"Você e 180 outros",                  caption:"Programa Do 5k à Maratona! Planilhas de corrida 100% online com supervisão. Entre para o time e bata o seu RP! 🏃‍♀️🏅",             col:1 },
  { id:12, autor:"Dr. Vinícius Almeida", role:"Nutrólogo",                location:"Brasília, DF",         avatar:"https://picsum.photos/200/200?random=60", image:"/nutrology_sleep_1777412792399.png",     aspectRatio:1.0,  likes:"Dra. Ana Souza e 560 outros",        caption:"Avaliação Nutrológica: Descubra e inicie os protocolos para melhoria radical do sono e do rendimento! Sessões diárias limitadas 💤",  col:2 },
];

const filters = ["Todos", "Serviços", "Próximos a mim"];

const C = { card:"#141414", card2:"#1a1a1a", border:"rgba(255,255,255,0.07)", bg:"#111111" };

export default function FeedPage() {
  const [activeFilter, setActiveFilter]   = useState("Todos");
  const [isCreatingPost, setIsCreatingPost] = useState(false);

  const columns = [0, 1, 2].map(i => feedMock.filter(f => f.col === i));

  return (
    <>
      <style>{`
        .feed-card {
          background: ${C.card};
          border: 1px solid ${C.border};
          border-radius: 16px;
          overflow: hidden;
          cursor: pointer;
          transition: background .15s, border-color .15s;
        }
        .feed-card:hover { background: ${C.card2}; border-color: rgba(16,185,129,0.45); }
        .feed-icon-btn {
          background: none; border: none; cursor: pointer;
          color: #fafafa; padding: 4px; display: flex;
          transition: color .15s;
        }
        .feed-icon-btn:hover { color: #10b981; }
        .feed-filter-pill {
          padding: 6px 16px; border-radius: 999px; border: 1px solid;
          font-size: 13px; cursor: pointer; white-space: nowrap;
          font-family: inherit; transition: all .15s;
        }
        .btn-novo-post {
          display: flex; align-items: center; gap: 6px;
          background: #10b981; border: none; border-radius: 999px;
          height: 44px; padding: 0 20px; color: white;
          font-size: 14px; font-weight: 600; cursor: pointer;
          font-family: inherit; white-space: nowrap; transition: background .15s;
        }
        .btn-novo-post:hover { background: #059669; }
      `}</style>

      <div style={{ flex:1, overflowY:"auto" }}>
        <div style={{ padding:"1.5rem 2rem", maxWidth:1200, margin:"0 auto", display:"flex", flexDirection:"column", gap:24, width:"100%" }}>

          <h2 style={{ color:"#fafafa", fontSize:22, fontWeight:"bold", margin:0 }}>Explorar</h2>

          {/* Busca + Novo Post */}
          <div style={{ display:"flex", gap:12, alignItems:"center", flexWrap:"wrap" }}>
            <div style={{ flex:1, minWidth:250, background:C.card, border:`1px solid ${C.border}`, borderRadius:999, display:"flex", alignItems:"center", paddingInline:12, height:44, gap:8 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a0a0a0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input placeholder="Buscar serviço, descrição, proximidade..." style={{ flex:1, background:"transparent", border:"none", outline:"none", color:"#fafafa", fontSize:14, fontFamily:"inherit" }} />
            </div>
            <button className="btn-novo-post" onClick={() => setIsCreatingPost(!isCreatingPost)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Novo Post
            </button>
          </div>

          {/* Create Post Card */}
          {isCreatingPost && (
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:20 }}>
              <h2 style={{ color:"#fafafa", fontSize:18, fontWeight:"bold", margin:"0 0 12px" }}>Criar Nova Publicação</h2>
              <textarea
                placeholder="No que você está pensando?"
                style={{ width:"100%", minHeight:80, background:C.card2, border:`1px solid ${C.border}`, borderRadius:10, color:"#fafafa", padding:12, fontSize:14, fontFamily:"inherit", outline:"none", resize:"vertical", boxSizing:"border-box" }}
              />
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12, marginTop:12 }}>
                <button style={{ display:"flex", alignItems:"center", gap:6, background:C.card2, border:`1px solid ${C.border}`, borderRadius:8, padding:"6px 12px", color:"#a1a1aa", fontSize:14, cursor:"pointer", fontFamily:"inherit" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a0a0a0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  Foto/Vídeo
                </button>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={() => setIsCreatingPost(false)} style={{ padding:"6px 16px", borderRadius:8, background:"transparent", border:`1px solid ${C.border}`, color:"#a1a1aa", fontSize:14, cursor:"pointer", fontFamily:"inherit" }}>Cancelar</button>
                  <button onClick={() => setIsCreatingPost(false)} style={{ padding:"6px 16px", borderRadius:8, background:"#10b981", border:"none", color:"white", fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Publicar</button>
                </div>
              </div>
            </div>
          )}

          {/* Filtros */}
          <div style={{ display:"flex", gap:10, overflowX:"auto", paddingBottom:4 }}>
            {filters.map(f => {
              const isActive = activeFilter === f;
              return (
                <button
                  key={f}
                  className="feed-filter-pill"
                  onClick={() => setActiveFilter(f)}
                  style={{
                    borderColor: isActive ? "#10b981" : C.border,
                    background:  isActive ? "rgba(16,185,129,0.1)" : "transparent",
                    color:       isActive ? "#10b981" : "#a1a1aa",
                    fontWeight:  isActive ? "bold" : "normal",
                  }}
                >{f}</button>
              );
            })}
          </div>

          <h2 style={{ color:"#fafafa", fontSize:22, fontWeight:"bold", margin:0 }}>Tendências</h2>

          {/* Masonry Feed */}
          <div className="pro-masonry" style={{ display:"flex", gap:16, alignItems:"flex-start" }}>
            {columns.map((col, colIndex) => (
              <div key={colIndex} style={{ flex:1, minWidth:280, display:"flex", flexDirection:"column", gap:16 }}>
                {col.map((post) => (
                  <div key={post.id} className="feed-card">
                    {/* Header */}
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 12px" }}>
                      <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                        <img src={post.avatar} alt={post.autor} style={{ width:34, height:34, borderRadius:"50%", objectFit:"cover", flexShrink:0 }} />
                        <div>
                          <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                            <span style={{ color:"#fafafa", fontSize:14, fontWeight:"bold" }}>{post.autor}</span>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="#10b981"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                          </div>
                          <span style={{ color:"#71717a", fontSize:11 }}>{post.role} • {post.location}</span>
                        </div>
                      </div>
                      <span style={{ color:"#71717a", fontSize:16, fontWeight:"bold", cursor:"pointer", padding:8 }}>···</span>
                    </div>

                    {/* Image */}
                    <div style={{ width:"100%", aspectRatio:String(post.aspectRatio), background:C.card2, overflow:"hidden" }}>
                      <img src={post.image} style={{ width:"100%", height:"100%", objectFit:"cover" }} alt="" />
                    </div>

                    {/* Footer */}
                    <div style={{ padding:"10px 12px", display:"flex", flexDirection:"column", gap:8 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <div style={{ display:"flex", gap:14 }}>
                          <button className="feed-icon-btn" aria-label="Curtir">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                          </button>
                          <button className="feed-icon-btn" aria-label="Comentar">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                          </button>
                          <button className="feed-icon-btn" aria-label="Compartilhar">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
                          </button>
                        </div>
                        <button className="feed-icon-btn" aria-label="Salvar">
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                        </button>
                      </div>

                      {/* Mini avatars + likes */}
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <div style={{ display:"flex", marginLeft:5 }}>
                          {["41","42","43"].map((r, i) => (
                            <img key={r} src={`https://picsum.photos/200/200?random=${r}`} style={{ width:20, height:20, borderRadius:"50%", objectFit:"cover", border:`1px solid ${C.bg}`, marginLeft: i===0 ? 0 : -8, zIndex:3-i }} alt="" />
                          ))}
                        </div>
                        <span style={{ color:"#fafafa", fontSize:12, fontWeight:"bold" }}>Curtido por {post.likes}</span>
                      </div>

                      <p style={{ color:"#a1a1aa", fontSize:13, margin:0, lineHeight:1.5 }}>
                        {post.caption} <span style={{ color:"#fafafa", fontWeight:"bold" }}>...mais</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

        </div>
      </div>
    </>
  );
}
