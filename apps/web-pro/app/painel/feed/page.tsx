"use client";

import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Post {
  id: number;
  autor: string;
  role: string;
  location: string;
  avatar: string;
  image: string;
  aspectRatio: number;
  likes: string;
  likeCount: number;
  caption: string;
  col: 0 | 1 | 2;
  comments: number;
  verified?: boolean;
}

interface Suggestion {
  id: number;
  nome: string;
  role: string;
  avatar: string;
  mutual: number;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const posts: Post[] = [
  {
    id: 1,
    autor: "Dr. Roberto Alves",
    role: "Médico do Esporte",
    location: "São Paulo, SP",
    avatar: "https://picsum.photos/200/200?random=21",
    image: "/feed_sports_medicine.png",
    aspectRatio: 0.9,
    likes: "Lucas Mendes e 360 outros",
    likeCount: 361,
    caption: "Diagnóstico precoce salva atletas! Avaliação completa com imagem e biomecânica. Agenda aberta para novembro! 🔬",
    col: 0,
    verified: true,
    comments: 24,
  },
  {
    id: 2,
    autor: "Studio FitCore",
    role: "Centro de Pilates",
    location: "Online",
    avatar: "https://picsum.photos/200/200?random=24",
    image: "/feed_pilates.png",
    aspectRatio: 1.0,
    likes: "Dr. Roberto e 124 outros",
    likeCount: 125,
    caption: "Pilates Clínico: fortalecimento do core e correção postural com equipamentos profissionais. Pacotes mensais imperdíveis. Reserve o seu ✨",
    col: 1,
    comments: 18,
  },
  {
    id: 3,
    autor: "Dra. Ana Souza",
    role: "Nutricionista Clínica",
    location: "Belo Horizonte, MG",
    avatar: "https://picsum.photos/200/200?random=23",
    image: "/feed_nutrition.png",
    aspectRatio: 1.05,
    likes: "Gabriel e 450 outros",
    likeCount: 451,
    caption: "Plano alimentar personalizado para atletas de rendimento. Acompanhamento mensal com bioimpedância. Agendamentos limitados 🥑",
    col: 2,
    verified: true,
    comments: 42,
  },
  {
    id: 4,
    autor: "Bruno Silva",
    role: "Coach de Crossfit",
    location: "Curitiba, PR",
    avatar: "https://picsum.photos/200/200?random=25",
    image: "/feed_crossfit.png",
    aspectRatio: 0.8,
    likes: "Camila e 89 outros",
    likeCount: 90,
    caption: "Box Crossfit Elite: aulas experimentais gratuitas toda sexta-feira! Venha conhecer nossos coaches credenciados. 💪 #crossfit",
    col: 0,
    comments: 31,
  },
  {
    id: 5,
    autor: "Julia Santos",
    role: "Coach de Bem-estar",
    location: "Porto Alegre, RS",
    avatar: "https://picsum.photos/200/200?random=58",
    image: "/feed_yoga.png",
    aspectRatio: 1.0,
    likes: "Você e 180 outros",
    likeCount: 181,
    caption: "Mindfulness e yoga para profissionais da saúde. Cuide de quem cuida. Programa online com 4 semanas de duração 🧘‍♀️",
    col: 1,
    verified: true,
    comments: 56,
  },
  {
    id: 6,
    autor: "Lucas Mendes",
    role: "Fisioterapeuta",
    location: "Florianópolis, SC",
    avatar: "https://picsum.photos/200/200?random=26",
    image: "/feed_physiotherapy.png",
    aspectRatio: 1.0,
    likes: "Dra. Ana e 45 outros",
    likeCount: 46,
    caption: "Fisioterapia Desportiva: liberação miofascial e recovery pós-treino intenso. Sessões presenciais e online disponíveis. 🛠️",
    col: 2,
    comments: 12,
  },
  {
    id: 7,
    autor: "Dr. Rafael Costa",
    role: "Cardiologista",
    location: "São Paulo, SP",
    avatar: "https://picsum.photos/200/200?random=30",
    image: "/feed_cardiology.png",
    aspectRatio: 0.85,
    likes: "Bruno Silva e 512 outros",
    likeCount: 513,
    caption: "Saúde cardíaca é prioridade! Avaliação de risco cardiovascular antes de iniciar atividade física. Proteja seu coração 🫀",
    col: 0,
    verified: true,
    comments: 67,
  },
  {
    id: 8,
    autor: "Ana Paula Fitness",
    role: "Personal Trainer",
    location: "Rio de Janeiro, RJ",
    avatar: "https://picsum.photos/200/200?random=22",
    image: "/feed_running.png",
    aspectRatio: 1.25,
    likes: "Camila Nery e 210 outros",
    likeCount: 211,
    caption: "Do 5k à Maratona! Planilhas de corrida 100% personalizadas com acompanhamento semanal. Entre para o time e bata seu RP! 🏃‍♀️🏅",
    col: 1,
    comments: 38,
  },
  {
    id: 9,
    autor: "Marcelo Strong",
    role: "Preparador Físico PRO",
    location: "Goiânia, GO",
    avatar: "https://picsum.photos/200/200?random=52",
    image: "/feed_workout.png",
    aspectRatio: 0.9,
    likes: "Dr. Roberto e 1.2k outros",
    likeCount: 1201,
    caption: "Assessoria esportiva PRO: planilhas exclusivas para preparação de competições. Vagas abertas para o ciclo de novembro 💪 #bodybuilding",
    col: 2,
    verified: true,
    comments: 94,
  },
];

const suggestions: Suggestion[] = [
  { id: 1, nome: "Dra. Letícia Marques", role: "Endocrinologista",   avatar: "https://picsum.photos/200/200?random=50", mutual: 5 },
  { id: 2, nome: "Carlos Viana",         role: "Nutrólogo",            avatar: "https://picsum.photos/200/200?random=60", mutual: 3 },
  { id: 3, nome: "Bianca Moraes",        role: "Personal Trainer",     avatar: "https://picsum.photos/200/200?random=46", mutual: 8 },
  { id: 4, nome: "Dr. Paulo Ramos",      role: "Ortopedia Esportiva",  avatar: "https://picsum.photos/200/200?random=56", mutual: 2 },
];

const FILTERS = ["Todos", "Seguindo", "Para você", "Tendências"];

// ─── Icons ────────────────────────────────────────────────────────────────────

const HeartIcon = ({ filled }: { filled?: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? "#ef4444" : "none"} stroke={filled ? "#ef4444" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const CommentIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

const ShareIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="3 11 22 2 13 21 11 13 3 11" />
  </svg>
);

const BookmarkIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

const VerifiedIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="#10b981">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
  </svg>
);

const ImageIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

const VideoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" />
  </svg>
);

const LinkIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

const DotsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="5" r="1" fill="currentColor" />
    <circle cx="12" cy="12" r="1" fill="currentColor" />
    <circle cx="12" cy="19" r="1" fill="currentColor" />
  </svg>
);

// ─── Post Card ────────────────────────────────────────────────────────────────

function PostCard({ post }: { post: Post }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likes, setLikes] = useState(post.likeCount);

  function handleLike() {
    setLiked(!liked);
    setLikes(liked ? likes - 1 : likes + 1);
  }

  return (
    <div className="feed-card">
      {/* Header */}
      <div className="feed-card__header">
        <div className="feed-card__author">
          <img src={post.avatar} alt={post.autor} className="feed-card__avatar" />
          <div className="feed-card__author-info">
            <div className="feed-card__author-name">
              <span>{post.autor}</span>
              {post.verified && <VerifiedIcon />}
            </div>
            <p className="feed-card__author-meta">{post.role} · {post.location}</p>
          </div>
        </div>
        <button className="feed-card__dots" aria-label="Mais opções">
          <DotsIcon />
        </button>
      </div>

      {/* Image */}
      <div className="feed-card__image-wrap" style={{ aspectRatio: post.aspectRatio }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={post.image} alt={post.caption} className="feed-card__image" />
      </div>

      {/* Footer */}
      <div className="feed-card__footer">
        {/* Actions */}
        <div className="feed-card__actions">
          <div className="feed-card__actions-left">
            <button
              className={`feed-action-btn${liked ? " feed-action-btn--liked" : ""}`}
              onClick={handleLike}
              aria-label="Curtir"
              id={`btn-like-${post.id}`}
            >
              <HeartIcon filled={liked} />
            </button>
            <button className="feed-action-btn" aria-label="Comentar" id={`btn-comment-${post.id}`}>
              <CommentIcon />
            </button>
            <button className="feed-action-btn" aria-label="Compartilhar" id={`btn-share-${post.id}`}>
              <ShareIcon />
            </button>
          </div>
          <button
            className={`feed-action-btn${saved ? " feed-action-btn--saved" : ""}`}
            onClick={() => setSaved(!saved)}
            aria-label="Salvar"
            id={`btn-save-${post.id}`}
          >
            <BookmarkIcon />
          </button>
        </div>

        {/* Likes row */}
        <div className="feed-card__likes-row">
          <div className="feed-card__mini-avatars">
            {[41, 42, 43].map((n, i) => (
              <img
                key={i}
                src={`https://picsum.photos/200/200?random=${n}`}
                alt=""
                className="feed-card__mini-avatar"
                style={{ zIndex: 3 - i }}
              />
            ))}
          </div>
          <span className="feed-card__likes-text">
            {likes.toLocaleString("pt-BR")} curtidas
          </span>
        </div>

        {/* Caption */}
        <p className="feed-card__caption">
          <strong>{post.autor}</strong>{" "}
          <span>{post.caption}</span>
        </p>

        {/* Comments count */}
        <button className="feed-card__comments-btn" id={`btn-view-comments-${post.id}`}>
          Ver todos os {post.comments} comentários
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FeedPage() {
  const [filter, setFilter] = useState("Todos");

  const col0 = posts.filter((p) => p.col === 0);
  const col1 = posts.filter((p) => p.col === 1);
  const col2 = posts.filter((p) => p.col === 2);

  return (
    <div className="feed-page">

      {/* ── Main ── */}
      <div className="feed-main">

        {/* Header */}
        <div className="feed-header">
          <div>
            <h1 className="feed-header__title">Feed</h1>
            <p className="feed-header__sub">Explore publicações da comunidade FitMax</p>
          </div>
        </div>

        {/* Compose Box */}
        <div className="feed-compose" id="feed-compose">
          <img
            src="https://picsum.photos/200/200?random=30"
            alt="Meu avatar"
            className="feed-compose__avatar"
          />
          <div className="feed-compose__input-wrap">
            <input
              type="text"
              placeholder="Compartilhe algo com a comunidade..."
              className="feed-compose__input"
              id="input-nova-publicacao"
            />
            <div className="feed-compose__actions">
              <button className="feed-compose__btn" id="btn-post-image" title="Imagem">
                <ImageIcon /> Foto
              </button>
              <button className="feed-compose__btn" id="btn-post-video" title="Vídeo">
                <VideoIcon /> Vídeo
              </button>
              <button className="feed-compose__btn" id="btn-post-link" title="Link">
                <LinkIcon /> Link
              </button>
              <button className="feed-compose__submit" id="btn-publicar">
                Publicar
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="feed-filters">
          {FILTERS.map((f) => (
            <button
              key={f}
              id={`filter-feed-${f.toLowerCase().replace(/\s/g, "-")}`}
              className={`feed-filter-btn${filter === f ? " feed-filter-btn--active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Masonry 3 colunas */}
        <div className="feed-masonry">
          {[col0, col1, col2].map((col, ci) => (
            <div key={ci} className="feed-col">
              {col.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── Sidebar ── */}
      <aside className="feed-sidebar">

        {/* Profile mini */}
        <div className="feed-sidebar__profile">
          <img src="https://picsum.photos/200/200?random=30" alt="Dr. Rafael Costa" className="feed-sidebar__profile-avatar" />
          <div>
            <p className="feed-sidebar__profile-name">Dr. Rafael Costa</p>
            <p className="feed-sidebar__profile-role">Cardiologista · CRM 54321</p>
          </div>
        </div>

        <div className="feed-sidebar__divider" />

        {/* Stats */}
        <div className="feed-sidebar__stats">
          {[
            { label: "Publicações", value: "34" },
            { label: "Seguidores",  value: "1.2k" },
            { label: "Seguindo",    value: "89" },
          ].map((s, i) => (
            <div key={i} className="feed-sidebar__stat">
              <span className="feed-sidebar__stat-value">{s.value}</span>
              <span className="feed-sidebar__stat-label">{s.label}</span>
            </div>
          ))}
        </div>

        <div className="feed-sidebar__divider" />

        {/* Sugestões */}
        <div className="feed-sidebar__section">
          <p className="feed-sidebar__section-title">Sugestões para você</p>
          <div className="feed-suggest-list">
            {suggestions.map((s) => (
              <div key={s.id} className="feed-suggest">
                <img src={s.avatar} alt={s.nome} className="feed-suggest__avatar" />
                <div className="feed-suggest__info">
                  <p className="feed-suggest__name">{s.nome}</p>
                  <p className="feed-suggest__meta">{s.role} · {s.mutual} em comum</p>
                </div>
                <button
                  className="feed-suggest__follow"
                  id={`btn-follow-${s.id}`}
                >
                  Seguir
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="feed-sidebar__divider" />

        {/* Trending tags */}
        <div className="feed-sidebar__section">
          <p className="feed-sidebar__section-title">Tendências</p>
          <div className="feed-tags">
            {["#cardiologia", "#treino", "#nutrição", "#fisioterapia", "#pilates", "#crossfit"].map((tag) => (
              <span key={tag} className="feed-tag">{tag}</span>
            ))}
          </div>
        </div>

      </aside>
    </div>
  );
}
