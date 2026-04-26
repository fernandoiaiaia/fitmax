"use client";

import { useState } from "react";

interface ConsultaHistorico {
  id: number;
  data: string;
  dataISO: string;
  horario: string;
  nome: string;
  especialidade: string;
  modalidade: string;
  avatar: string;
  avaliado: boolean;
  nota?: number;
}

const historicoMock: ConsultaHistorico[] = [
  { id: 1, data: "15/02/2026", dataISO: "2026-02", horario: "14:30", nome: "Carla Souza", especialidade: "Cardiologia", modalidade: "Consulta Online", avatar: "https://picsum.photos/200/200?random=70", avaliado: false },
  { id: 2, data: "14/02/2026", dataISO: "2026-02", horario: "09:00", nome: "Roberto Cardoso Silva Matos Santos", especialidade: "Cardiologia", modalidade: "Consulta Online", avatar: "https://picsum.photos/200/200?random=71", avaliado: false },
  { id: 3, data: "13/02/2026", dataISO: "2026-02", horario: "11:00", nome: "Dra. Ana Souza", especialidade: "Nutrição", modalidade: "Consulta Online", avatar: "https://picsum.photos/200/200?random=23", avaliado: true, nota: 5 },
  { id: 4, data: "12/02/2026", dataISO: "2026-02", horario: "16:00", nome: "Dr. Roberto Alves", especialidade: "Cardiologia", modalidade: "Consulta Online", avatar: "https://picsum.photos/200/200?random=21", avaliado: true, nota: 4 },
  { id: 5, data: "11/02/2026", dataISO: "2026-02", horario: "10:00", nome: "Dra. Letícia Marques", especialidade: "Cardiologia", modalidade: "Consulta Online", avatar: "https://picsum.photos/200/200?random=50", avaliado: false },
  { id: 6, data: "10/02/2026", dataISO: "2026-02", horario: "15:30", nome: "Dr. Vinícius Almeida", especialidade: "Cardiologia", modalidade: "Consulta Online", avatar: "https://picsum.photos/200/200?random=60", avaliado: true, nota: 5 },
  { id: 7, data: "29/01/2026", dataISO: "2026-01", horario: "09:00", nome: "Roberto Cardoso Silva Matos Santos", especialidade: "Cardiologia", modalidade: "Consulta Online", avatar: "https://picsum.photos/200/200?random=71", avaliado: false },
  { id: 8, data: "01/02/2026", dataISO: "2026-02", horario: "08:00", nome: "Carla Souza", especialidade: "Cardiologia", modalidade: "Consulta Online", avatar: "https://picsum.photos/200/200?random=70", avaliado: false },
  { id: 9, data: "20/01/2026", dataISO: "2026-01", horario: "14:00", nome: "Marcelo Strong", especialidade: "Fisioterapia", modalidade: "Presencial", avatar: "https://picsum.photos/200/200?random=52", avaliado: true, nota: 3 },
  { id: 10, data: "10/01/2026", dataISO: "2026-01", horario: "11:30", nome: "Bruno Silva", especialidade: "Medicina Esportiva", modalidade: "Presencial", avatar: "https://picsum.photos/200/200?random=25", avaliado: true, nota: 5 },
];

const timelineMock = [
  { data: "15/02/2026", descricao: "Cardiologia - Consulta Online" },
  { data: "14/02/2026", descricao: "Cardiologia - Consulta Online" },
  { data: "13/02/2026", descricao: "Nutrição - Consulta Online" },
  { data: "12/02/2026", descricao: "Cardiologia - Consulta Online" },
  { data: "11/02/2026", descricao: "Cardiologia - Consulta Online" },
  { data: "10/02/2026", descricao: "Cardiologia - Consulta Online" },
  { data: "01/02/2026", descricao: "Cardiologia - Consulta Online" },
  { data: "29/01/2026", descricao: "Cardiologia - Consulta Online" },
  { data: "20/01/2026", descricao: "Fisioterapia - Presencial" },
  { data: "10/01/2026", descricao: "Medicina Esportiva - Presencial" },
];

const mesLabels: Record<string, string> = {
  "2026-02": "Fevereiro 2026",
  "2026-01": "Janeiro 2026",
  "2025-12": "Dezembro 2025",
};

function agruparPorMes(items: ConsultaHistorico[]) {
  const grupos: Record<string, ConsultaHistorico[]> = {};
  for (const item of items) {
    if (!grupos[item.dataISO]) grupos[item.dataISO] = [];
    grupos[item.dataISO].push(item);
  }
  return grupos;
}

function StarRating({ nota }: { nota: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill={i <= nota ? "#facc15" : "none"} stroke={i <= nota ? "#facc15" : "#3f3f46"} strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

function IconCalendarSmall() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
}
function IconExternal() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>;
}
function IconChevronDown() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>;
}

function ConsultaCard({ consulta }: { consulta: ConsultaHistorico }) {
  return (
    <div className="rounded-xl border border-[#262626] bg-[#141414] overflow-hidden hover:border-emerald-600 transition-colors">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#262626] text-[#a1a1aa]">
        <IconCalendarSmall />
        <span className="text-[#71717a] text-sm font-semibold">{consulta.data}</span>
        <span className="text-[#71717a] text-xs">· {consulta.horario}</span>
      </div>
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-[#262626] flex-shrink-0">
              <img src={consulta.avatar} className="w-full h-full object-cover" alt={consulta.nome} />
            </div>
            <div className="flex-1 min-w-0 flex flex-col gap-0.5">
              <p className="text-white text-sm font-bold truncate">{consulta.nome}</p>
              <p className="text-[#71717a] text-xs truncate">{consulta.especialidade} - {consulta.modalidade}</p>
              {consulta.avaliado && consulta.nota && (
                <div className="flex items-center gap-2 mt-0.5">
                  <StarRating nota={consulta.nota} />
                  <span className="text-[#71717a] text-[11px]">Avaliado</span>
                </div>
              )}
            </div>
          </div>
          {!consulta.avaliado && (
            <button className="px-4 py-1.5 rounded-full text-[#a78bfa] text-sm font-bold bg-purple-500/15 border border-purple-500/30 hover:bg-purple-500/25 transition-colors flex-shrink-0">
              Avaliar
            </button>
          )}
        </div>
        <button className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-emerald-500/35 text-emerald-500 text-sm font-semibold hover:bg-emerald-500/7 transition-colors">
          <IconExternal /> Ver detalhes
        </button>
      </div>
    </div>
  );
}

const periodos = ["Semana", "Mês", "Ano", "Tudo"];

export default function HistoricoPage() {
  const [periodo, setPeriodo] = useState("Mês");

  const grupos = agruparPorMes(historicoMock);
  const meses = Object.keys(grupos).sort((a, b) => b.localeCompare(a));

  return (
    <div className="flex-1 overflow-auto bg-[#0f0f0f]">
      <div className="px-4 py-6 flex flex-col gap-5 max-w-[1100px] mx-auto w-full pb-16">

        {/* Header */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-white font-extrabold text-3xl tracking-tight">Histórico</h2>
              <p className="text-[#71717a] text-sm mt-1">Gerencie suas consultas de forma simples e organizada.</p>
            </div>
            <div className="flex gap-2">
              {periodos.map((p) => {
                const isActive = periodo === p;
                return (
                  <button
                    key={p}
                    onClick={() => setPeriodo(p)}
                    className={[
                      "px-3 py-2 rounded-full text-sm border transition-colors",
                      isActive
                        ? "bg-emerald-500 text-white border-transparent font-bold"
                        : "bg-transparent text-[#71717a] border-[#262626] hover:border-emerald-600 hover:bg-emerald-500/5",
                    ].join(" ")}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="border-t border-[#262626]" />
        </div>

        {/* Content: list + timeline */}
        <div className="flex flex-wrap md:flex-nowrap gap-6 items-start">

          {/* Left: Consultas grouped */}
          <div className="flex-1 flex flex-col gap-6 min-w-[300px]">
            <p className="text-white text-base font-bold">Consultas</p>
            {meses.map((mesKey) => {
              const consultas = grupos[mesKey];
              const label = mesLabels[mesKey] ?? mesKey;
              return (
                <div key={mesKey} className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-[#71717a] text-xs font-bold uppercase tracking-wide">{label}</span>
                    <div className="flex-1 h-px bg-[#262626]" />
                    <span className="text-[#71717a] text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#1c1c1c] border border-[#262626]">{consultas.length} consultas</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    {consultas.map((c) => <ConsultaCard key={c.id} consulta={c} />)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Timeline (hidden on mobile) */}
          <div className="hidden sm:flex flex-col gap-3 w-[280px]" style={{ position: "sticky", top: 24 }}>
            <p className="text-white text-base font-bold">Linha do tempo</p>

            <div className="rounded-xl border border-[#262626] bg-[#141414] p-4 overflow-hidden">
              <div className="h-0.5 mb-4 rounded-full" style={{ background: "linear-gradient(to right, #10b981, transparent)" }} />
              <div className="flex flex-col gap-0">
                {timelineMock.map((item, idx) => {
                  const isLast = idx === timelineMock.length - 1;
                  return (
                    <div key={idx} className="flex gap-3 items-start">
                      <div className="flex flex-col items-center w-4 pt-0.5">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 border-2 border-[#0d9068]" style={{ backgroundColor: "#10b981", boxShadow: "0 0 6px rgba(16,185,129,0.5)" }} />
                        {!isLast && <div className="w-0.5 flex-1 min-h-[32px] mt-0.5" style={{ background: "linear-gradient(to bottom, #10b981, rgba(16,185,129,0.1))" }} />}
                      </div>
                      <div className={`flex flex-col flex-1 ${!isLast ? "pb-3" : ""}`}>
                        <p className="text-white text-sm font-bold">{item.data}</p>
                        <p className="text-[#71717a] text-xs">{item.descricao}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-[#262626] cursor-pointer hover:opacity-80 text-emerald-500">
                <span className="text-sm font-semibold">Ver histórico completo</span>
                <IconChevronDown />
              </div>
            </div>

            <div className="rounded-xl border border-[#262626] bg-[#141414] p-4">
              <p className="text-[#71717a] text-[11px] font-semibold uppercase tracking-wide mb-3">Resumo Geral</p>
              <div className="flex flex-col gap-2">
                {[
                  { label: "Total de consultas", value: String(historicoMock.length), color: "#fafafa" },
                  { label: "Avaliadas", value: String(historicoMock.filter((c) => c.avaliado).length), color: "#a78bfa" },
                  { label: "Pendentes de avaliação", value: String(historicoMock.filter((c) => !c.avaliado).length), color: "#facc15" },
                ].map((item, i) => (
                  <div key={i} className={`flex justify-between items-center py-2 ${i < 2 ? "border-b border-[#262626]" : ""}`}>
                    <span className="text-[#71717a] text-sm">{item.label}</span>
                    <span className="font-extrabold text-base" style={{ color: item.color }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
