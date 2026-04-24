"use client";

import Link from "next/link";

// ─── Mock Data ─────────────────────────────────────────────────────────────

const consultasMock = [
  {
    id: 1,
    name: "Guilherme Augusto",
    specialty: "Cardiologia · Presencial",
    time: "Hoje, 11:00",
    avatar: "https://picsum.photos/200/200?random=30",
    badgeColor: "#eab308",
    badgeBg: "rgba(234,179,8,0.12)",
    status: "Pendente",
  },
  {
    id: 2,
    name: "Mariana Ferreira",
    specialty: "Cardiologia · Online",
    time: "Hoje, 13:00",
    avatar: "https://picsum.photos/200/200?random=31",
    badgeColor: "#10b981",
    badgeBg: "rgba(16,185,129,0.12)",
    status: "Confirmada",
  },
  {
    id: 3,
    name: "Lucas Mendes",
    specialty: "Check-up · Presencial",
    time: "Amanhã, 09:00",
    avatar: "https://picsum.photos/200/200?random=32",
    badgeColor: "#60a5fa",
    badgeBg: "rgba(96,165,250,0.12)",
    status: "Agendada",
  },
];

const agendaMock = [
  {
    id: 1,
    title: "Reunião de Equipe",
    time: "09:00 – 10:00",
    label: "Hoje",
    dotColor: "#a78bfa",
  },
  {
    id: 2,
    title: "Avaliação Cardiológica",
    time: "14:00 – 15:30",
    label: "Em breve",
    dotColor: "#10b981",
  },
  {
    id: 3,
    title: "Congresso de Saúde",
    time: "18:00 – 21:00",
    label: "Hoje",
    dotColor: "#f97316",
  },
];

const statsMock = [
  { label: "Consultas hoje",   value: "8",    sub: "+2 vs ontem",   color: "#10b981" },
  { label: "Pacientes ativos", value: "124",  sub: "+5 esta semana", color: "#60a5fa" },
  { label: "Avaliação média",  value: "4.9★", sub: "Últimas 30",     color: "#a78bfa" },
  { label: "Taxa confirmação", value: "92%",  sub: "Último mês",     color: "#f97316" },
];

const feedThumbnails = [
  { src: "/feed_cardiology.png",  label: "Consulta Cardiológica" },
  { src: "/feed_workout.png",     label: "Treino de Força" },
  { src: "/feed_nutrition.png",   label: "Nutrição Esportiva" },
  { src: "/feed_running.png",     label: "Corrida ao Ar Livre" },
];

// ─── Icon helpers ───────────────────────────────────────────────────────────

const UsersIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const HomeIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const ClockIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);

const ArrowIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);

// ─── Page ───────────────────────────────────────────────────────────────────

export default function PainelPage() {
  return (
    <div className="painel-root">

      {/* Page heading */}
      <div className="painel-heading">
        <div>
          <h1 className="painel-heading__title">Sua Visão Geral</h1>
          <p className="painel-heading__sub">Quarta-feira, 23 de abril de 2026</p>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="painel-stats">
        {statsMock.map((s, i) => (
          <div key={i} className="painel-stat-card" id={`stat-${i}`}>
            <span className="painel-stat-card__val" style={{ color: s.color }}>{s.value}</span>
            <span className="painel-stat-card__label">{s.label}</span>
            <span className="painel-stat-card__sub">{s.sub}</span>
            <div className="painel-stat-card__bar" style={{ background: s.color }} />
          </div>
        ))}
      </div>

      {/* ── Main grid (2 columns) ── */}
      <div className="painel-grid">

        {/* LEFT: Feed widget */}
        <Link href="/painel/feed" className="painel-card painel-card--feed" id="card-feed">
          <div className="painel-card__header">
            <div>
              <h2 className="painel-card__title">Destaques do Feed</h2>
              <p className="painel-card__sub">Últimas publicações da plataforma</p>
            </div>
            <div className="painel-card__icon-circle" style={{ background: "rgba(16,185,129,0.12)" }}>
              <HomeIcon />
            </div>
          </div>

          <div className="painel-feed-mosaic">
            {feedThumbnails.map((item, idx) => (
              <div key={idx} className="painel-feed-mosaic__cell">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.src} alt={item.label} className="painel-feed-mosaic__img" />
                {idx === 3 && (
                  <div className="painel-feed-mosaic__overlay">
                    <span>+8</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="painel-card__footer-link">
            Ver feed completo <ArrowIcon />
          </div>
        </Link>

        {/* RIGHT column */}
        <div className="painel-right-col">

          {/* Consultas widget */}
          <Link href="/painel/consultas" className="painel-card" id="card-consultas">
            <div className="painel-card__header">
              <div>
                <h2 className="painel-card__title">Consultas Pendentes</h2>
                <p className="painel-card__sub">3 confirmadas esta semana</p>
              </div>
              <div className="painel-card__icon-circle" style={{ background: "rgba(96,165,250,0.12)" }}>
                <UsersIcon />
              </div>
            </div>

            <div className="painel-consult-list">
              {consultasMock.map((c) => (
                <div key={c.id} className="painel-consult-item">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.avatar} alt={c.name} className="painel-consult-item__avatar" />
                  <div className="painel-consult-item__info">
                    <p className="painel-consult-item__name">{c.name}</p>
                    <p className="painel-consult-item__meta">{c.specialty}</p>
                  </div>
                  <span
                    className="painel-consult-item__badge"
                    style={{ color: c.badgeColor, background: c.badgeBg, border: `1px solid ${c.badgeColor}40` }}
                  >
                    {c.time}
                  </span>
                </div>
              ))}
            </div>

            <div className="painel-card__footer-link">
              Ver todas as consultas <ArrowIcon />
            </div>
          </Link>

          {/* Agenda widget */}
          <Link href="/painel/agenda" className="painel-card" id="card-agenda">
            <div className="painel-card__header">
              <div>
                <h2 className="painel-card__title">Sua Agenda</h2>
                <p className="painel-card__sub">Prioridades de hoje</p>
              </div>
              <div className="painel-card__icon-circle" style={{ background: "rgba(167,139,250,0.12)" }}>
                <ClockIcon />
              </div>
            </div>

            <div className="painel-timeline">
              {agendaMock.map((a, idx) => (
                <div key={a.id} className="painel-timeline__item">
                  <div className="painel-timeline__track">
                    <div
                      className="painel-timeline__dot"
                      style={{ background: a.dotColor, boxShadow: `0 0 6px ${a.dotColor}` }}
                    />
                    {idx < agendaMock.length - 1 && (
                      <div className="painel-timeline__line" />
                    )}
                  </div>
                  <div className="painel-timeline__body">
                    <div className="painel-timeline__body-top">
                      <span className="painel-timeline__body-title">{a.title}</span>
                      <span
                        className="painel-timeline__body-label"
                        style={{ color: a.dotColor }}
                      >
                        {a.label}
                      </span>
                    </div>
                    <p className="painel-timeline__body-time">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="painel-card__footer-link">
              Ver agenda completa <ArrowIcon />
            </div>
          </Link>

        </div>
      </div>
    </div>
  );
}
