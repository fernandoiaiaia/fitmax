"use client";

import { useState } from "react";

type ConsultaStatus = "a_confirmar" | "pendente" | "agendada" | "em_andamento";

interface Consulta {
  id: number;
  horario: string;
  nome: string;
  especialidade: string;
  modalidade: string;
  data: string;
  avatar: string;
  status: ConsultaStatus;
}

const consultaEmAndamento = {
  nome: "Dra. Letícia Marques",
  especialidade: "Endocrinologista",
  horario: "14:30 — 15:30",
  avatar: "https://picsum.photos/200/200?random=50",
};

const proximasConsultas: Consulta[] = [
  { id: 1, horario: "09:00", nome: "Dr. Roberto Alves", especialidade: "Ortopedia", modalidade: "Presencial", data: "Hoje, 22/04", avatar: "https://picsum.photos/200/200?random=21", status: "agendada" },
  { id: 2, horario: "11:00", nome: "Dra. Ana Souza", especialidade: "Nutrição", modalidade: "Online", data: "Hoje, 22/04", avatar: "https://picsum.photos/200/200?random=23", status: "pendente" },
  { id: 3, horario: "14:30", nome: "Dra. Letícia Marques", especialidade: "Endocrinologia", modalidade: "Presencial", data: "Hoje, 22/04", avatar: "https://picsum.photos/200/200?random=50", status: "em_andamento" },
  { id: 4, horario: "09:00", nome: "Dr. Vinícius Almeida", especialidade: "Nutrologia", modalidade: "Online", data: "Amanhã, 23/04", avatar: "https://picsum.photos/200/200?random=60", status: "a_confirmar" },
  { id: 5, horario: "16:00", nome: "Marcelo Strong", especialidade: "Fisioterapia", modalidade: "Presencial", data: "24/04", avatar: "https://picsum.photos/200/200?random=52", status: "agendada" },
  { id: 6, horario: "10:30", nome: "Bruno Silva", especialidade: "Medicina Esportiva", modalidade: "Online", data: "25/04", avatar: "https://picsum.photos/200/200?random=25", status: "pendente" },
];

const statusConfig: Record<ConsultaStatus, { label: string; bg: string; color: string; border: string; actionLabel?: string; actionStyle?: string; actionColor?: string }> = {
  a_confirmar: { label: "A CONFIRMAR", bg: "transparent", color: "#a1a1aa", border: "#3f3f46" },
  pendente: { label: "PENDENTE", bg: "rgba(234,179,8,0.15)", color: "#facc15", border: "rgba(234,179,8,0.3)", actionLabel: "Pagar", actionStyle: "bg-[#facc15]", actionColor: "text-[#0a0a0a]" },
  agendada: { label: "AGENDADA", bg: "rgba(16,185,129,0.15)", color: "#10b981", border: "rgba(16,185,129,0.3)", actionLabel: "Reagendar", actionStyle: "bg-emerald-500/20", actionColor: "text-[#10b981]" },
  em_andamento: { label: "EM ANDAMENTO", bg: "rgba(59,130,246,0.15)", color: "#60a5fa", border: "rgba(59,130,246,0.3)" },
};

const statusFilters = ["Todas", "Agendadas", "Pendentes", "A Confirmar", "Em Andamento"];

function IconClock() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
}
function IconCalendar() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
}
function IconFilter() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="12" y1="18" x2="12" y2="18"/></svg>;
}
function IconTrendingUp() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>;
}
function IconDollar() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
}

function StatusBadge({ status }: { status: ConsultaStatus }) {
  const cfg = statusConfig[status];
  return (
    <span
      className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide border"
      style={{ backgroundColor: cfg.bg, color: cfg.color, borderColor: cfg.border }}
    >
      {cfg.label}
    </span>
  );
}

function ConsultaRow({ consulta }: { consulta: Consulta }) {
  const cfg = statusConfig[consulta.status];
  const isAndamento = consulta.status === "em_andamento";
  return (
    <div
      className="flex items-center gap-3 py-3 px-4 rounded-xl border transition-colors"
      style={{
        borderColor: isAndamento ? "rgba(59,130,246,0.25)" : "#262626",
        backgroundColor: isAndamento ? "rgba(59,130,246,0.05)" : "#141414",
      }}
    >
      {/* Hora */}
      <div className="flex flex-col items-center min-w-[44px]">
        <span className="text-[#71717a] text-[11px] font-semibold">{consulta.horario}</span>
        {isAndamento && <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1" />}
      </div>

      <div className="w-px bg-[#262626] h-9 flex-shrink-0" />

      {/* Avatar */}
      <div className="w-10 h-10 rounded-full overflow-hidden bg-[#262626] flex-shrink-0">
        <img src={consulta.avatar} className="w-full h-full object-cover" alt={consulta.nome} />
      </div>

      {/* Info */}
      <div className="flex-1 flex flex-col gap-0.5 min-w-0">
        <p className="text-white text-sm font-bold truncate">{consulta.nome}</p>
        <p className="text-[#71717a] text-xs truncate">{consulta.especialidade} · {consulta.modalidade}</p>
        <div className="flex items-center gap-1 mt-0.5 text-[#71717a]">
          <IconClock />
          <span className="text-[11px]">{consulta.data}</span>
        </div>
      </div>

      {/* Status + Action */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <StatusBadge status={consulta.status} />
        {cfg.actionLabel && (
          <button className={`${cfg.actionStyle} ${cfg.actionColor} text-xs font-bold px-3 py-1 rounded-full`}>
            {cfg.actionLabel}
          </button>
        )}
        <button className="p-1 rounded-full hover:bg-[#262626] text-[#71717a]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
        </button>
      </div>
    </div>
  );
}

export default function ConsultasPage() {
  const [statusFilter, setStatusFilter] = useState("Todas");
  const [dateRange] = useState("22/04/2026 — 22/05/2026");

  const filteredConsultas = proximasConsultas.filter((c) => {
    if (statusFilter === "Todas") return true;
    if (statusFilter === "Agendadas") return c.status === "agendada";
    if (statusFilter === "Pendentes") return c.status === "pendente";
    if (statusFilter === "A Confirmar") return c.status === "a_confirmar";
    if (statusFilter === "Em Andamento") return c.status === "em_andamento";
    return true;
  });

  return (
    <div className="flex-1 overflow-auto bg-[#0f0f0f]">
      <div className="px-4 py-6 flex flex-col gap-5 max-w-[1100px] mx-auto w-full pb-16">

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-white font-extrabold text-3xl tracking-tight">Consultas</h2>
            <p className="text-[#71717a] text-sm mt-1">Gerencie seus agendamentos e acompanhe o status de cada consulta</p>
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#262626] bg-[#141414] cursor-pointer hover:border-emerald-600 transition-colors text-[#a1a1aa]">
              <IconCalendar /><span className="text-[#71717a] text-sm">{dateRange}</span><IconFilter />
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#262626] bg-[#141414] cursor-pointer hover:border-emerald-600 transition-colors text-[#a1a1aa]">
              <span className="text-[#71717a] text-sm">Todas</span><IconFilter />
            </div>
          </div>
        </div>

        {/* Cards row */}
        <div className="flex flex-wrap md:flex-nowrap gap-4">

          {/* Left: Resumo + Em Andamento */}
          <div className="flex flex-col gap-4 flex-1 min-w-[280px]">

            {/* Resumo */}
            <div className="rounded-2xl border border-[#262626] bg-[#141414] p-4 flex flex-col gap-4">
              <p className="text-[#71717a] text-xs font-semibold uppercase tracking-wide">Resumo do Período</p>
              <div className="flex gap-4">
                <div className="flex-1 flex flex-col gap-2 p-3 rounded-xl bg-[#0f0f0f] border border-[#262626]">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0"><IconTrendingUp /></div>
                    <span className="text-[#71717a] text-xs">Agendamentos</span>
                  </div>
                  <p className="text-white font-extrabold text-3xl leading-none">142</p>
                  <p className="text-emerald-500 text-xs font-semibold">+12% vs mês anterior</p>
                </div>
                <div className="flex-1 flex flex-col gap-2 p-3 rounded-xl bg-[#0f0f0f] border border-[#262626]">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0"><IconDollar /></div>
                    <span className="text-[#71717a] text-xs">Valor Gerado</span>
                  </div>
                  <p className="text-white font-extrabold text-2xl leading-none">R$1.000</p>
                  <p className="text-emerald-500 text-xs font-semibold">+8% vs mês anterior</p>
                </div>
              </div>
            </div>

            {/* Em Andamento */}
            <div className="rounded-2xl border border-emerald-500/30 overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.04))", backgroundColor: "#141414" }}>
              <div className="h-0.5" style={{ background: "linear-gradient(to right, #10b981, transparent)" }} />
              <div className="p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[#71717a] text-xs font-semibold uppercase tracking-wide">Em Andamento</span>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/15">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" style={{ boxShadow: "0 0 6px #10b981" }} />
                    <span className="text-emerald-500 text-xs font-bold">Ao vivo</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-emerald-500 flex-shrink-0 bg-[#262626]">
                    <img src={consultaEmAndamento.avatar} className="w-full h-full object-cover" alt={consultaEmAndamento.nome} />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-white font-extrabold text-base">{consultaEmAndamento.nome}</p>
                    <p className="text-[#71717a] text-sm">{consultaEmAndamento.especialidade}</p>
                    <div className="flex items-center gap-1 text-emerald-500 mt-0.5">
                      <IconClock />
                      <span className="text-xs font-semibold">{consultaEmAndamento.horario}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Visão geral do dia */}
          <div className="rounded-2xl border border-[#262626] bg-[#141414] p-4 flex-1 min-w-[220px] md:max-w-[260px]">
            <p className="text-[#71717a] text-xs font-semibold uppercase tracking-wide mb-4">Visão Geral do Dia</p>
            <div className="flex flex-col gap-3">
              {[
                { label: "Total de Consultas", value: "8", color: "#fafafa", icon: "📅" },
                { label: "Confirmadas", value: "5", color: "#10b981", icon: "✅" },
                { label: "Pendentes", value: "2", color: "#facc15", icon: "⏳" },
                { label: "Tempo Médio", value: "52min", color: "#60a5fa", icon: "⏱" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-3 px-3 rounded-xl bg-[#0f0f0f] border border-[#262626]">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{item.icon}</span>
                    <span className="text-[#71717a] text-sm">{item.label}</span>
                  </div>
                  <span className="font-extrabold text-lg" style={{ color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Próximas Consultas */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-white font-extrabold text-xl">Próximas Consultas</h2>
              <p className="text-[#71717a] text-sm">{filteredConsultas.length} consultas encontradas</p>
            </div>
          </div>

          {/* Status filters */}
          <div className="overflow-x-auto">
            <div className="flex gap-2 pb-1">
              {statusFilters.map((filter) => {
                const isActive = statusFilter === filter;
                return (
                  <button
                    key={filter}
                    onClick={() => setStatusFilter(filter)}
                    className={[
                      "px-4 py-2 rounded-full text-sm border transition-colors whitespace-nowrap",
                      isActive
                        ? "bg-emerald-500 text-white border-transparent font-bold"
                        : "bg-transparent text-[#71717a] border-[#262626] hover:border-emerald-600 hover:bg-emerald-500/5",
                    ].join(" ")}
                  >
                    {filter}
                  </button>
                );
              })}
            </div>
          </div>

          {/* List */}
          <div className="flex flex-col gap-2">
            {filteredConsultas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-xl border border-[#262626] bg-[#141414]">
                <span className="text-4xl">📭</span>
                <p className="text-[#71717a] text-sm text-center">Nenhuma consulta encontrada para este filtro.</p>
              </div>
            ) : (
              filteredConsultas.map((consulta) => (
                <ConsultaRow key={consulta.id} consulta={consulta} />
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
