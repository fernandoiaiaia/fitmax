"use client";

import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type StatusPagamento = "pago" | "pendente" | "reembolsado";

interface ConsultaHistorico {
  id: number;
  data: string;       // "15/02/2026"
  dataISO: string;    // "2026-04"  (para agrupamento)
  horario: string;
  paciente: string;
  especialidade: string;
  modalidade: "Presencial" | "Online";
  avatar: string;
  valor: string;
  statusPagamento: StatusPagamento;
  nota?: number;      // anotação do profissional 1-5
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const historico: ConsultaHistorico[] = [
  {
    id: 1,
    data: "23/04/2026", dataISO: "2026-04",
    horario: "11:00",
    paciente: "Guilherme Augusto",
    especialidade: "Cardiologia", modalidade: "Presencial",
    avatar: "https://picsum.photos/200/200?random=30",
    valor: "R$ 350", statusPagamento: "pago", nota: 5,
  },
  {
    id: 2,
    data: "23/04/2026", dataISO: "2026-04",
    horario: "13:00",
    paciente: "Mariana Ferreira",
    especialidade: "Cardiologia", modalidade: "Online",
    avatar: "https://picsum.photos/200/200?random=31",
    valor: "R$ 280", statusPagamento: "pendente",
  },
  {
    id: 3,
    data: "22/04/2026", dataISO: "2026-04",
    horario: "09:00",
    paciente: "Fernanda Lima",
    especialidade: "Cardiologia", modalidade: "Presencial",
    avatar: "https://picsum.photos/200/200?random=41",
    valor: "R$ 350", statusPagamento: "pago", nota: 4,
  },
  {
    id: 4,
    data: "20/04/2026", dataISO: "2026-04",
    horario: "15:30",
    paciente: "Ricardo Nunes",
    especialidade: "Check-up Cardíaco", modalidade: "Presencial",
    avatar: "https://picsum.photos/200/200?random=45",
    valor: "R$ 420", statusPagamento: "pago",
  },
  {
    id: 5,
    data: "15/04/2026", dataISO: "2026-04",
    horario: "10:00",
    paciente: "Beatriz Santos",
    especialidade: "Cardiologia", modalidade: "Online",
    avatar: "https://picsum.photos/200/200?random=46",
    valor: "R$ 280", statusPagamento: "reembolsado",
  },
  {
    id: 6,
    data: "30/03/2026", dataISO: "2026-03",
    horario: "14:00",
    paciente: "Carlos Eduardo",
    especialidade: "Avaliação Cardíaca", modalidade: "Presencial",
    avatar: "https://picsum.photos/200/200?random=47",
    valor: "R$ 500", statusPagamento: "pago", nota: 5,
  },
  {
    id: 7,
    data: "25/03/2026", dataISO: "2026-03",
    horario: "11:30",
    paciente: "Lucas Mendes",
    especialidade: "Check-up", modalidade: "Presencial",
    avatar: "https://picsum.photos/200/200?random=32",
    valor: "R$ 420", statusPagamento: "pago", nota: 4,
  },
  {
    id: 8,
    data: "18/03/2026", dataISO: "2026-03",
    horario: "08:30",
    paciente: "Ana Paula Ramos",
    especialidade: "Cardiologia", modalidade: "Online",
    avatar: "https://picsum.photos/200/200?random=48",
    valor: "R$ 280", statusPagamento: "pendente",
  },
  {
    id: 9,
    data: "10/03/2026", dataISO: "2026-03",
    horario: "16:00",
    paciente: "Thiago Oliveira",
    especialidade: "Cardiologia", modalidade: "Presencial",
    avatar: "https://picsum.photos/200/200?random=49",
    valor: "R$ 350", statusPagamento: "pago",
  },
  {
    id: 10,
    data: "28/02/2026", dataISO: "2026-02",
    horario: "10:30",
    paciente: "Camila Torres",
    especialidade: "Avaliação Cardíaca", modalidade: "Presencial",
    avatar: "https://picsum.photos/200/200?random=33",
    valor: "R$ 500", statusPagamento: "pago", nota: 5,
  },
];

const timeline = historico
  .slice()
  .sort((a, b) => b.id - a.id)
  .map((c) => ({
    data: c.data,
    descricao: `${c.especialidade} · ${c.modalidade}`,
    paciente: c.paciente,
    statusPagamento: c.statusPagamento,
  }));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mesLabels: Record<string, string> = {
  "2026-04": "Abril 2026",
  "2026-03": "Março 2026",
  "2026-02": "Fevereiro 2026",
  "2026-01": "Janeiro 2026",
};

function agruparPorMes(items: ConsultaHistorico[]) {
  const grupos: Record<string, ConsultaHistorico[]> = {};
  for (const item of items) {
    if (!grupos[item.dataISO]) grupos[item.dataISO] = [];
    grupos[item.dataISO].push(item);
  }
  return grupos;
}

const pagConfig: Record<StatusPagamento, { label: string; bg: string; color: string; border: string }> = {
  pago:        { label: "PAGO",        bg: "rgba(16,185,129,0.12)",  color: "#10b981", border: "rgba(16,185,129,0.3)" },
  pendente:    { label: "PENDENTE",    bg: "rgba(234,179,8,0.12)",   color: "#facc15", border: "rgba(234,179,8,0.3)" },
  reembolsado: { label: "REEMBOLSADO", bg: "rgba(161,161,170,0.1)", color: "#a1a1aa", border: "rgba(161,161,170,0.25)" },
};

// ─── Icons ────────────────────────────────────────────────────────────────────

const CalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill={filled ? "#facc15" : "none"} stroke={filled ? "#facc15" : "#3f3f46"} strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

function StarRating({ nota }: { nota: number }) {
  return (
    <div className="hist-stars">
      {[1, 2, 3, 4, 5].map((i) => <StarIcon key={i} filled={i <= nota} />)}
    </div>
  );
}

// ─── Consulta Card ────────────────────────────────────────────────────────────

function ConsultaCard({ c }: { c: ConsultaHistorico }) {
  const pay = pagConfig[c.statusPagamento];
  return (
    <div className="hist-card">
      {/* Header: data + horário */}
      <div className="hist-card__header">
        <div className="hist-card__date">
          <CalendarIcon />
          <span>{c.data}</span>
          <span className="hist-card__date-sep">·</span>
          <span>{c.horario}</span>
        </div>
        <span
          className="hist-pay-badge"
          style={{ background: pay.bg, color: pay.color, borderColor: pay.border }}
        >
          {pay.label}
        </span>
      </div>

      {/* Body: paciente + info */}
      <div className="hist-card__body">
        <img src={c.avatar} alt={c.paciente} className="hist-card__avatar" />
        <div className="hist-card__info">
          <p className="hist-card__name">{c.paciente}</p>
          <p className="hist-card__meta">{c.especialidade} · {c.modalidade}</p>
          {c.nota && (
            <div className="hist-card__nota">
              <StarRating nota={c.nota} />
              <span>Nota do atendimento</span>
            </div>
          )}
        </div>
        <div className="hist-card__valor">
          <p className="hist-card__valor-label">Valor</p>
          <p className="hist-card__valor-num">{c.valor}</p>
        </div>
      </div>

      {/* Footer: Ver detalhes */}
      <div className="hist-card__footer">
        <button className="hist-details-btn" id={`btn-detalhes-${c.id}`}>
          <ExternalLinkIcon />
          Ver detalhes
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const PERIODOS = ["Semana", "Mês", "Ano", "Tudo"];

export default function HistoricoPage() {
  const [periodo, setPeriodo] = useState("Mês");

  const grupos = agruparPorMes(historico);
  const meses = Object.keys(grupos).sort((a, b) => b.localeCompare(a));

  const totalPago = historico
    .filter((c) => c.statusPagamento === "pago")
    .reduce((acc, c) => acc + parseInt(c.valor.replace(/\D/g, "")), 0);

  const pendentes = historico.filter((c) => c.statusPagamento === "pendente").length;

  return (
    <div className="hist-page">

      {/* ── Cabeçalho ── */}
      <div className="hist-header">
        <div>
          <h1 className="hist-header__title">Histórico</h1>
          <p className="hist-header__sub">Consultas realizadas, pagamentos e linha do tempo de atendimentos.</p>
        </div>
        <div className="hist-period-filters">
          {PERIODOS.map((p) => (
            <button
              key={p}
              id={`filter-periodo-${p.toLowerCase()}`}
              className={`hist-period-btn${periodo === p ? " hist-period-btn--active" : ""}`}
              onClick={() => setPeriodo(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* ── Corpo: lista + sidebar ── */}
      <div className="hist-body">

        {/* Coluna esquerda: consultas agrupadas */}
        <div className="hist-list">
          <h2 className="hist-list__title">Consultas Realizadas</h2>

          {meses.map((mesKey) => {
            const items = grupos[mesKey];
            const label = mesLabels[mesKey] ?? mesKey;
            return (
              <div key={mesKey} className="hist-mes-group">
                <div className="hist-mes-label">
                  <span className="hist-mes-label__text">{label}</span>
                  <div className="hist-mes-label__line" />
                  <span className="hist-mes-label__count">{items.length} consultas</span>
                </div>
                <div className="hist-mes-cards">
                  {items.map((c) => <ConsultaCard key={c.id} c={c} />)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Coluna direita: timeline + resumo */}
        <aside className="hist-sidebar">

          {/* Linha do tempo */}
          <div className="hist-tl-card">
            <div className="hist-tl-card__bar" />
            <div className="hist-tl-card__inner">
              <h3 className="hist-sidebar__title">Linha do tempo</h3>
              <div className="hist-timeline">
                {timeline.slice(0, 8).map((item, idx) => {
                  const isLast = idx === Math.min(timeline.length, 8) - 1;
                  return (
                    <div key={idx} className="hist-tl-item">
                      <div className="hist-tl-track">
                        <div className="hist-tl-dot" />
                        {!isLast && <div className="hist-tl-line" />}
                      </div>
                      <div className={`hist-tl-content${isLast ? "" : " hist-tl-content--spaced"}`}>
                        <p className="hist-tl-content__date">{item.data}</p>
                        <p className="hist-tl-content__desc">{item.descricao}</p>
                        <p className="hist-tl-content__paciente">{item.paciente}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button className="hist-tl-more" id="btn-ver-historico-completo">
                Ver histórico completo <ChevronDownIcon />
              </button>
            </div>
          </div>

          {/* Resumo Geral */}
          <div className="hist-summary">
            <p className="hist-sidebar__title">Resumo Geral</p>
            <div className="hist-summary__list">
              {[
                { label: "Total de atendimentos",    value: String(historico.length),  color: "#fafafa" },
                { label: "Total recebido",           value: `R$ ${totalPago.toLocaleString("pt-BR")}`, color: "#10b981" },
                { label: "Pendentes de pagamento",   value: String(pendentes),          color: "#facc15" },
                { label: "Reembolsados",             value: String(historico.filter((c) => c.statusPagamento === "reembolsado").length), color: "#a1a1aa" },
              ].map((item, i, arr) => (
                <div
                  key={i}
                  className={`hist-summary__row${i < arr.length - 1 ? " hist-summary__row--border" : ""}`}
                >
                  <span className="hist-summary__label">{item.label}</span>
                  <span className="hist-summary__value" style={{ color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

        </aside>
      </div>
    </div>
  );
}
