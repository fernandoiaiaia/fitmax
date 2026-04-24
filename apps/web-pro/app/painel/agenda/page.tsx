"use client";

import { useState, useMemo } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Consulta {
  id: number;
  hora: string;     // "09:00"
  duracao: number;  // em horas (1 = 1h, 0.5 = 30min)
  paciente: string;
  avatar: string;
  especialidade: string;
  modalidade: "Presencial" | "Online";
  status: "confirmada" | "pendente" | "em_andamento";
}

interface HorarioConfig {
  hora: string;
  disponivel: boolean;
}

// ─── Dados de exemplo ─────────────────────────────────────────────────────────

const HORARIOS_DIA: HorarioConfig[] = [
  { hora: "08:00", disponivel: false },
  { hora: "09:00", disponivel: true  },
  { hora: "10:00", disponivel: true  },
  { hora: "11:00", disponivel: true  },
  { hora: "12:00", disponivel: false },
  { hora: "13:00", disponivel: false },
  { hora: "14:00", disponivel: true  },
  { hora: "15:00", disponivel: true  },
  { hora: "16:00", disponivel: true  },
  { hora: "17:00", disponivel: false },
  { hora: "18:00", disponivel: false },
];

// Consultas por data (chave: YYYY-MM-DD)
const consultasPorDia: Record<string, Consulta[]> = {
  "2026-04-23": [
    { id: 1,  hora: "09:00", duracao: 1,   paciente: "Fernanda Lima",    avatar: "https://picsum.photos/200/200?random=41", especialidade: "Cardiologia",        modalidade: "Presencial", status: "confirmada"  },
    { id: 2,  hora: "11:00", duracao: 1,   paciente: "Guilherme Augusto",avatar: "https://picsum.photos/200/200?random=30", especialidade: "Check-up",           modalidade: "Presencial", status: "em_andamento"},
    { id: 3,  hora: "14:00", duracao: 1,   paciente: "Ricardo Nunes",    avatar: "https://picsum.photos/200/200?random=45", especialidade: "Avaliação Cardíaca", modalidade: "Presencial", status: "pendente"    },
    { id: 4,  hora: "16:00", duracao: 1,   paciente: "Beatriz Santos",   avatar: "https://picsum.photos/200/200?random=46", especialidade: "Cardiologia",        modalidade: "Online",     status: "confirmada"  },
  ],
  "2026-04-24": [
    { id: 5,  hora: "09:00", duracao: 1,   paciente: "Lucas Mendes",     avatar: "https://picsum.photos/200/200?random=32", especialidade: "Check-up",           modalidade: "Presencial", status: "confirmada"  },
    { id: 6,  hora: "10:00", duracao: 1,   paciente: "Ana Paula Ramos",  avatar: "https://picsum.photos/200/200?random=48", especialidade: "Cardiologia",        modalidade: "Online",     status: "confirmada"  },
    { id: 7,  hora: "15:00", duracao: 1,   paciente: "Thiago Oliveira",  avatar: "https://picsum.photos/200/200?random=49", especialidade: "Cardiologia",        modalidade: "Presencial", status: "pendente"    },
  ],
  "2026-04-25": [
    { id: 8,  hora: "09:00", duracao: 1,   paciente: "Camila Torres",    avatar: "https://picsum.photos/200/200?random=33", especialidade: "Avaliação Cardíaca", modalidade: "Presencial", status: "confirmada"  },
    { id: 9,  hora: "14:00", duracao: 1,   paciente: "Paulo Ramos",      avatar: "https://picsum.photos/200/200?random=34", especialidade: "Cardiologia",        modalidade: "Online",     status: "confirmada"  },
    { id: 10, hora: "16:00", duracao: 1,   paciente: "Sofia Mendes",     avatar: "https://picsum.photos/200/200?random=35", especialidade: "Cardiologia",        modalidade: "Online",     status: "pendente"    },
  ],
};

const MESES = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];

const STATUS_CONFIG = {
  confirmada:   { label: "Confirmada",   bg: "rgba(16,185,129,0.12)",  color: "#10b981", border: "rgba(16,185,129,0.3)",  dot: "#10b981" },
  pendente:     { label: "Pendente",     bg: "rgba(234,179,8,0.12)",   color: "#facc15", border: "rgba(234,179,8,0.3)",   dot: "#facc15" },
  em_andamento: { label: "Em andamento", bg: "rgba(59,130,246,0.12)",  color: "#60a5fa", border: "rgba(59,130,246,0.3)",  dot: "#60a5fa" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TODAY = new Date("2026-04-23");

function toISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function formatDiaSemana(d: Date) {
  return d.toLocaleDateString("pt-BR", { weekday: "long" });
}

function formatDataCompleta(d: Date) {
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const ChevronLeft = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const ChevronRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const SettingsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const VideoIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" />
  </svg>
);

const MapPinIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
);

const ChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

// ─── Consulta Card ────────────────────────────────────────────────────────────

function ConsultaCard({ c }: { c: Consulta }) {
  const st = STATUS_CONFIG[c.status];
  return (
    <div className="ag-event" style={{ borderLeftColor: st.dot }} id={`event-${c.id}`}>
      <div className="ag-event__top">
        <img src={c.avatar} alt={c.paciente} className="ag-event__avatar" />
        <div className="ag-event__info">
          <p className="ag-event__name">{c.paciente}</p>
          <p className="ag-event__spec">{c.especialidade}</p>
        </div>
        <span className="ag-event__badge" style={{ background: st.bg, color: st.color, borderColor: st.border }}>
          {st.label}
        </span>
      </div>
      <div className="ag-event__footer">
        <span className="ag-event__mod">
          {c.modalidade === "Online" ? <VideoIcon /> : <MapPinIcon />}
          {c.modalidade}
        </span>
        <span className="ag-event__duration">{c.hora} · {c.duracao}h</span>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AgendaPage() {
  const [currentDate, setCurrentDate]     = useState(TODAY);
  const [mesDropdown, setMesDropdown]     = useState(false);
  const [showNovaConsulta, setShowNova]   = useState(false);

  const iso = toISO(currentDate);
  const consultasHoje = consultasPorDia[iso] ?? [];

  // Mapa hora -> consulta para lookup rápido
  const consultasPorHora = useMemo(() => {
    const m: Record<string, Consulta> = {};
    for (const c of consultasHoje) m[c.hora] = c;
    return m;
  }, [consultasHoje]);

  function prevDay() { setCurrentDate((d) => addDays(d, -1)); }
  function nextDay() { setCurrentDate((d) => addDays(d, 1));  }

  const isToday = toISO(currentDate) === toISO(TODAY);

  return (
    <div className="ag-page">

      {/* ── Toolbar ── */}
      <div className="ag-toolbar">
        <div className="ag-toolbar__left">
          <h1 className="ag-toolbar__title">Agenda</h1>
          <span className="ag-toolbar__weekday">{formatDiaSemana(currentDate)}</span>
        </div>

        <div className="ag-toolbar__right">
          {/* Settings */}
          <button className="ag-btn-settings" id="btn-configuracoes-agenda">
            <SettingsIcon /> Configurações
          </button>

          {/* Nova consulta */}
          <button
            className="ag-btn-nova"
            id="btn-nova-consulta"
            onClick={() => setShowNova(true)}
          >
            <PlusIcon /> Nova Consulta
          </button>
        </div>
      </div>

      {/* ── Nav de data + profissional ── */}
      <div className="ag-nav-bar">

        {/* Profissional ativo */}
        <div className="ag-professional">
          <img
            src="https://picsum.photos/200/200?random=30"
            alt="Dr. Rafael Costa"
            className="ag-professional__avatar"
          />
          <div className="ag-professional__info">
            <p className="ag-professional__name">Dr. Rafael Costa</p>
            <p className="ag-professional__role">Cardiologista · CRM 54321</p>
          </div>
        </div>

        {/* Navegação de dia */}
        <div className="ag-day-nav">
          <button className="ag-day-nav__arrow" onClick={prevDay} id="btn-dia-anterior">
            <ChevronLeft />
          </button>

          <div className="ag-day-nav__center">
            {isToday && <span className="ag-day-nav__today-badge">Hoje</span>}
            <p className="ag-day-nav__date">{formatDataCompleta(currentDate)}</p>
          </div>

          <button className="ag-day-nav__arrow" onClick={nextDay} id="btn-dia-seguinte">
            <ChevronRight />
          </button>
        </div>

        {/* Filtro por mês */}
        <div className="ag-month-filter" id="filtro-mes">
          <button
            className="ag-month-btn"
            onClick={() => setMesDropdown((v) => !v)}
            id="btn-filtro-mes"
          >
            {MESES[currentDate.getMonth()]} {currentDate.getFullYear()}
            <ChevronDown />
          </button>

          {mesDropdown && (
            <div className="ag-month-dropdown">
              {MESES.map((mes, idx) => (
                <button
                  key={mes}
                  id={`mes-${mes.toLowerCase()}`}
                  className={`ag-month-option${currentDate.getMonth() === idx ? " ag-month-option--active" : ""}`}
                  onClick={() => {
                    const d = new Date(currentDate);
                    d.setMonth(idx);
                    setCurrentDate(d);
                    setMesDropdown(false);
                  }}
                >
                  {mes}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Corpo: timeline + sidebar ── */}
      <div className="ag-body">

        {/* Timeline */}
        <div className="ag-timeline">
          {HORARIOS_DIA.map((h) => {
            const consulta = consultasPorHora[h.hora];
            return (
              <div key={h.hora} className="ag-slot">

                {/* Label de hora */}
                <div className="ag-slot__hour">{h.hora}</div>

                {/* Conteúdo do slot */}
                <div className="ag-slot__content">
                  {consulta ? (
                    <ConsultaCard c={consulta} />
                  ) : h.disponivel ? (
                    <button
                      className="ag-slot__available"
                      id={`slot-disponivel-${h.hora.replace(":", "")}`}
                      onClick={() => setShowNova(true)}
                    >
                      <div className="ag-slot__available-dot" />
                      <span>Horário disponível</span>
                    </button>
                  ) : (
                    <div className="ag-slot__empty" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Sidebar: resumo do dia */}
        <aside className="ag-sidebar">

          {/* Stats do dia */}
          <div className="ag-sidebar-card">
            <p className="ag-sidebar-card__title">Resumo do Dia</p>
            <div className="ag-day-stats">
              {[
                { label: "Confirmadas",   value: consultasHoje.filter((c) => c.status === "confirmada").length,   color: "#10b981" },
                { label: "Pendentes",     value: consultasHoje.filter((c) => c.status === "pendente").length,     color: "#facc15" },
                { label: "Em andamento",  value: consultasHoje.filter((c) => c.status === "em_andamento").length, color: "#60a5fa" },
                { label: "Disponíveis",   value: HORARIOS_DIA.filter((h) => h.disponivel && !consultasPorHora[h.hora]).length, color: "#52525b" },
              ].map((s, i) => (
                <div key={i} className="ag-day-stat">
                  <div className="ag-day-stat__dot" style={{ background: s.color }} />
                  <span className="ag-day-stat__label">{s.label}</span>
                  <span className="ag-day-stat__val" style={{ color: s.color }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Próximas consultas */}
          {consultasHoje.length > 0 && (
            <div className="ag-sidebar-card">
              <p className="ag-sidebar-card__title">Consultas do Dia</p>
              <div className="ag-upcoming">
                {consultasHoje.map((c) => {
                  const st = STATUS_CONFIG[c.status];
                  return (
                    <div key={c.id} className="ag-upcoming-item">
                      <div className="ag-upcoming-item__dot" style={{ background: st.dot }} />
                      <div className="ag-upcoming-item__info">
                        <p className="ag-upcoming-item__hour">{c.hora}</p>
                        <p className="ag-upcoming-item__name">{c.paciente}</p>
                        <p className="ag-upcoming-item__spec">{c.especialidade}</p>
                      </div>
                      <img src={c.avatar} alt={c.paciente} className="ag-upcoming-item__avatar" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Legenda */}
          <div className="ag-sidebar-card">
            <p className="ag-sidebar-card__title">Legenda</p>
            <div className="ag-legend">
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <div key={key} className="ag-legend-item">
                  <div className="ag-legend-item__dot" style={{ background: cfg.dot }} />
                  <span>{cfg.label}</span>
                </div>
              ))}
              <div className="ag-legend-item">
                <div className="ag-legend-item__dot ag-legend-item__dot--available" />
                <span>Horário disponível</span>
              </div>
            </div>
          </div>

        </aside>
      </div>

      {/* ── Modal Nova Consulta ── */}
      {showNovaConsulta && (
        <div className="ag-modal-backdrop" onClick={() => setShowNova(false)}>
          <div className="ag-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ag-modal__header">
              <h2 className="ag-modal__title">Nova Consulta</h2>
              <button className="ag-modal__close" onClick={() => setShowNova(false)} id="btn-fechar-modal">✕</button>
            </div>
            <div className="ag-modal__body">
              <div className="ag-form-field">
                <label className="ag-form-label">Paciente</label>
                <input type="text" className="ag-form-input" id="input-paciente" placeholder="Buscar paciente..." />
              </div>
              <div className="ag-form-row">
                <div className="ag-form-field">
                  <label className="ag-form-label">Data</label>
                  <input type="date" className="ag-form-input" id="input-data-consulta" defaultValue={iso} />
                </div>
                <div className="ag-form-field">
                  <label className="ag-form-label">Horário</label>
                  <select className="ag-form-input" id="input-horario-consulta">
                    {HORARIOS_DIA.filter((h) => h.disponivel).map((h) => (
                      <option key={h.hora}>{h.hora}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="ag-form-field">
                <label className="ag-form-label">Especialidade</label>
                <input type="text" className="ag-form-input" id="input-especialidade" placeholder="Ex: Cardiologia" />
              </div>
              <div className="ag-form-field">
                <label className="ag-form-label">Modalidade</label>
                <div className="ag-form-toggle">
                  <button className="ag-toggle-btn ag-toggle-btn--active" id="toggle-presencial">Presencial</button>
                  <button className="ag-toggle-btn" id="toggle-online">Online</button>
                </div>
              </div>
            </div>
            <div className="ag-modal__footer">
              <button className="ag-modal__cancel" onClick={() => setShowNova(false)} id="btn-cancelar-modal">Cancelar</button>
              <button className="ag-modal__confirm" id="btn-confirmar-nova-consulta">Agendar Consulta</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
