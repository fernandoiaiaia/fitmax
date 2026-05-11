//@ts-nocheck
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ScrollView, YStack, XStack, Text, H2, Card } from "tamagui";

// ─── Types & Mock Data ────────────────────────────────────────────────────────

const especialidades = [
  { id: 1, nome: "Nutrição",          icon: "🥗", cor: "#10b981" },
  { id: 2, nome: "Ortopedia",         icon: "🦴", cor: "#60a5fa" },
  { id: 3, nome: "Personal Trainer",  icon: "🏋️", cor: "#f59e0b" },
  { id: 4, nome: "Fisioterapia",      icon: "💪", cor: "#a78bfa" },
  { id: 5, nome: "Endocrinologia",    icon: "🔬", cor: "#f43f5e" },
  { id: 6, nome: "Medicina Esportiva",icon: "⚕️", cor: "#34d399" },
  { id: 7, nome: "Psicologia",        icon: "🧠", cor: "#fb923c" },
  { id: 8, nome: "Nutrologia",        icon: "💊", cor: "#e879f9" },
];

// Configuração mock — convênio
const CONFIG_ACEITA_CONVENIO = true;

const convenios = [
  { id: 1, nome: "Unimed",         logo: "🏥" },
  { id: 2, nome: "Bradesco Saúde", logo: "🔵" },
  { id: 3, nome: "SulAmérica",     logo: "🟢" },
  { id: 4, nome: "Outros",         logo: "➕" },
];

const profissionais = [
  { id: 1, nome: "Dr. Roberto Alves",    especialidade: [1,2],   avatar: "https://picsum.photos/200/200?random=21", avaliacao: 4.9, modalidades: ["Presencial","Online"], clinica: { nome: "SportMed Clínica",      logradouro: "Av. Paulista",       numero: "1374", complemento: "10º andar", bairro: "Bela Vista",    cidade: "São Paulo",       uf: "SP" } },
  { id: 2, nome: "Dra. Ana Souza",       especialidade: [1,8],   avatar: "https://picsum.photos/200/200?random=23", avaliacao: 4.8, modalidades: ["Online"],              clinica: null },
  { id: 3, nome: "Dra. Letícia Marques", especialidade: [5],     avatar: "https://picsum.photos/200/200?random=50", avaliacao: 4.7, modalidades: ["Presencial","Online"], clinica: { nome: "Endoclínica Campinas",   logradouro: "Av. Brasil",         numero: "320",  complemento: "Sala 5",    bairro: "Centro",         cidade: "Campinas",        uf: "SP" } },
  { id: 4, nome: "Dr. Vinícius Almeida", especialidade: [8,1],   avatar: "https://picsum.photos/200/200?random=60", avaliacao: 4.9, modalidades: ["Online"],              clinica: null },
  { id: 5, nome: "Marcelo Strong",       especialidade: [3,4],   avatar: "https://picsum.photos/200/200?random=52", avaliacao: 5.0, modalidades: ["Presencial"],          clinica: { nome: "Studio Strong",         logradouro: "Rua da Saúde",       numero: "87",   complemento: "",          bairro: "Moema",          cidade: "São Paulo",       uf: "SP" } },
  { id: 6, nome: "Bruno Silva",          especialidade: [6],     avatar: "https://picsum.photos/200/200?random=25", avaliacao: 4.6, modalidades: ["Presencial","Online"], clinica: { nome: "Instituto Atlântica",    logradouro: "Av. Atlântica",      numero: "1500", complemento: "",          bairro: "Copacabana",     cidade: "Rio de Janeiro",  uf: "RJ" } },
  { id: 7, nome: "Dra. Camila Nery",    especialidade: [3,4,6], avatar: "https://picsum.photos/200/200?random=22", avaliacao: 4.8, modalidades: ["Presencial"],          clinica: { nome: "Centro Fitness Augusta", logradouro: "Rua Augusta",        numero: "44",   complemento: "Conj. 12",  bairro: "Consolação",     cidade: "São Paulo",       uf: "SP" } },
];

const horarios = ["08:00","09:00","10:00","11:00","13:00","14:00","15:00","16:00","17:00"];
const horariosOcupados = ["09:00","14:00"];

// ─── Styles ───────────────────────────────────────────────────────────────────

const STYLES = `
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.85); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  .ag-page { animation: fadeUp 0.3s ease; }
  .ag-step-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 16px;
    padding: 28px;
  }

  /* ── TipoConsultaSelector ── */
  .ag-tipo-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-top: 4px;
  }
  .ag-tipo-card {
    position: relative;
    background: rgba(255,255,255,0.03);
    border: 2px solid rgba(255,255,255,0.08);
    border-radius: 20px;
    padding: 32px 24px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    transition: all 0.22s cubic-bezier(0.4,0,0.2,1);
    text-align: center;
    overflow: hidden;
  }
  .ag-tipo-card::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(16,185,129,0.06) 0%, rgba(96,165,250,0.04) 100%);
    opacity: 0;
    transition: opacity 0.22s;
    border-radius: inherit;
  }
  .ag-tipo-card:hover { transform: translateY(-3px); border-color: rgba(16,185,129,0.35); box-shadow: 0 8px 32px rgba(0,0,0,0.25); }
  .ag-tipo-card:hover::before { opacity: 1; }
  .ag-tipo-card.active {
    border-color: #10b981;
    background: rgba(16,185,129,0.08);
    box-shadow: 0 0 0 1px rgba(16,185,129,0.3), 0 8px 32px rgba(16,185,129,0.15);
    transform: translateY(-3px);
  }
  .ag-tipo-card.active::before { opacity: 1; }
  .ag-tipo-icon {
    font-size: 48px;
    line-height: 1;
    filter: drop-shadow(0 4px 12px rgba(0,0,0,0.4));
    transition: transform 0.22s;
  }
  .ag-tipo-card:hover .ag-tipo-icon,
  .ag-tipo-card.active .ag-tipo-icon { transform: scale(1.1); }
  .ag-tipo-title {
    font-size: 17px;
    font-weight: 800;
    color: #f4f4f5;
    letter-spacing: -0.02em;
    margin: 0;
  }
  .ag-tipo-card.active .ag-tipo-title { color: #10b981; }
  .ag-tipo-sub {
    font-size: 13px;
    color: #71717a;
    margin: 0;
    line-height: 1.5;
  }
  .ag-tipo-badge {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.05em;
    padding: 4px 12px;
    border-radius: 99px;
    border: 1px solid rgba(255,255,255,0.1);
    color: #a1a1aa;
    background: rgba(255,255,255,0.04);
    transition: all 0.22s;
    white-space: nowrap;
  }
  .ag-tipo-card.active .ag-tipo-badge {
    background: rgba(16,185,129,0.15);
    border-color: rgba(16,185,129,0.4);
    color: #10b981;
  }
  .ag-tipo-check {
    position: absolute;
    top: 14px;
    right: 14px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #10b981;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transform: scale(0.5);
    transition: opacity 0.2s, transform 0.25s cubic-bezier(0.34,1.56,0.64,1);
  }
  .ag-tipo-card.active .ag-tipo-check { opacity: 1; transform: scale(1); }
  @media (max-width: 520px) {
    .ag-tipo-grid { grid-template-columns: 1fr; }
    .ag-tipo-card { padding: 24px 20px; flex-direction: row; text-align: left; gap: 16px; }
    .ag-tipo-icon { font-size: 36px; flex-shrink: 0; }
  }
  .ag-esp-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;
  }
  .ag-esp-card {
    background: rgba(255,255,255,0.03);
    border: 1.5px solid rgba(255,255,255,0.08);
    border-radius: 14px;
    padding: 18px 12px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    transition: all 0.18s;
    text-align: center;
  }
  .ag-esp-card:hover { background: rgba(255,255,255,0.07); transform: translateY(-2px); }
  .ag-esp-card.active { border-color: var(--esp-cor); background: rgba(var(--esp-rgb), 0.1); }
  .ag-esp-icon { font-size: 28px; }
  .ag-esp-label { font-size: 13px; font-weight: 600; color: #e4e4e7; }

  .ag-pro-list { display: flex; flex-direction: column; gap: 10px; }
  .ag-pro-card {
    background: rgba(255,255,255,0.03);
    border: 1.5px solid rgba(255,255,255,0.08);
    border-radius: 14px;
    padding: 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 14px;
    transition: all 0.18s;
  }
  .ag-pro-card:hover { background: rgba(255,255,255,0.06); transform: translateX(2px); }
  .ag-pro-card.active { border-color: #10b981; background: rgba(16,185,129,0.08); }
  .ag-pro-avatar { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; flex-shrink: 0; border: 2px solid rgba(255,255,255,0.1); }
  .ag-pro-info { flex: 1; min-width: 0; }
  .ag-pro-nome { font-size: 14px; font-weight: 700; color: #f4f4f5; margin: 0 0 3px; }
  .ag-pro-rating { font-size: 12px; color: #facc15; font-weight: 600; }
  .ag-modal-pill {
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 20px;
    padding: 4px 12px;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    background: transparent;
    color: #a1a1aa;
    font-family: inherit;
    transition: all 0.15s;
  }
  .ag-modal-pill.active { background: rgba(16,185,129,0.15); border-color: #10b981; color: #10b981; }

  .ag-cal-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
    margin-top: 8px;
  }
  .ag-cal-day {
    aspect-ratio: 1;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    cursor: pointer;
    color: #a1a1aa;
    transition: all 0.15s;
    border: 1px solid transparent;
  }
  .ag-cal-day:hover:not(.disabled):not(.empty) { background: rgba(16,185,129,0.1); color: #10b981; }
  .ag-cal-day.active { background: #10b981; color: #fff; font-weight: 700; border-color: #10b981; }
  .ag-cal-day.today { border-color: rgba(16,185,129,0.4); color: #10b981; }
  .ag-cal-day.disabled { opacity: 0.3; cursor: not-allowed; }
  .ag-cal-day.empty { cursor: default; }
  .ag-cal-header { font-size: 11px; font-weight: 600; color: #71717a; text-align: center; padding: 4px 0; text-transform: uppercase; }

  .ag-hor-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: 8px;
    margin-top: 8px;
  }
  .ag-hor-btn {
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    padding: 10px 0;
    text-align: center;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    background: rgba(255,255,255,0.03);
    color: #e4e4e7;
    font-family: inherit;
    transition: all 0.15s;
  }
  .ag-hor-btn:hover:not(.occupied) { background: rgba(16,185,129,0.12); border-color: #10b981; color: #10b981; }
  .ag-hor-btn.active { background: #10b981; border-color: #10b981; color: #fff; }
  .ag-hor-btn.occupied { opacity: 0.3; cursor: not-allowed; text-decoration: line-through; }

  .ag-btn-primary {
    background: #10b981;
    border: none;
    border-radius: 12px;
    padding: 14px 32px;
    color: #fff;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    transition: background 0.2s, box-shadow 0.2s, transform 0.15s;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .ag-btn-primary:hover:not(:disabled) { background: #0ea370; box-shadow: 0 0 20px rgba(16,185,129,0.4); transform: translateY(-1px); }
  .ag-btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
  .ag-btn-ghost {
    background: transparent;
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 12px;
    padding: 14px 24px;
    color: #a1a1aa;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.15s;
  }
  .ag-btn-ghost:hover { border-color: rgba(255,255,255,0.3); color: #e4e4e7; }

  .ag-progress-bar {
    height: 3px;
    background: rgba(255,255,255,0.08);
    border-radius: 99px;
    overflow: hidden;
  }
  .ag-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #10b981, #34d399);
    border-radius: 99px;
    transition: width 0.4s ease;
  }
  .ag-success { animation: scaleIn 0.4s ease; text-align: center; padding: 48px 24px; }
  .ag-success-icon {
    width: 80px; height: 80px;
    border-radius: 50%;
    background: rgba(16,185,129,0.15);
    border: 2px solid #10b981;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 24px;
    font-size: 36px;
  }

  @media (max-width: 600px) {
    .ag-esp-grid { grid-template-columns: repeat(2, 1fr); }
    .ag-step-card { padding: 18px; }
  }

  /* ── Endereço ── */
  .ag-ender-grid { display: flex; gap: 10px; }
  .ag-field-wrap { display: flex; flex-direction: column; gap: 4px; flex: 1; }
  .ag-field-label { font-size: 11px; font-weight: 600; color: #71717a; letter-spacing: 0.04em; text-transform: uppercase; }
  .ag-field {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    padding: 10px 12px;
    color: #f4f4f5;
    font-size: 14px;
    font-family: inherit;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
    width: 100%;
    box-sizing: border-box;
  }
  .ag-field::placeholder { color: #52525b; }
  .ag-field:focus { border-color: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,0.12); }
  .ag-field.ag-field-has-error { border-color: #f43f5e; }
  .ag-field-error { font-size: 12px; color: #f43f5e; margin-top: 2px; }
  .ag-field-loading { font-size: 12px; color: #71717a; margin-top: 2px; }

  /* ── Convênio ── */
  .ag-conv-section { padding-top: 20px; }
  .ag-conv-bordered { border-top: 1px solid rgba(255,255,255,0.07); margin-top: 0; }
  .ag-conv-toggle { display: flex; border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; overflow: hidden; }
  .ag-conv-btn {
    padding: 7px 20px; font-size: 13px; font-weight: 600;
    background: transparent; border: none; cursor: pointer;
    color: #71717a; font-family: inherit; transition: all 0.15s;
  }
  .ag-conv-btn.active-no  { background: rgba(244,63,94,0.15);  color: #f43f5e; }
  .ag-conv-btn.active-yes { background: rgba(16,185,129,0.15); color: #10b981; }
  .ag-conv-list { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
  @media (max-width: 520px) { .ag-conv-list { grid-template-columns: repeat(2,1fr); } }
  .ag-conv-card {
    background: rgba(255,255,255,0.03);
    border: 1.5px solid rgba(255,255,255,0.08);
    border-radius: 12px; padding: 14px 8px;
    cursor: pointer; display: flex; flex-direction: column;
    align-items: center; gap: 6px; text-align: center;
    transition: all 0.18s;
  }
  .ag-conv-card:hover { background: rgba(255,255,255,0.06); transform: translateY(-2px); }
  .ag-conv-card.active { border-color: #10b981; background: rgba(16,185,129,0.1); }
  .ag-conv-nome { font-size: 12px; font-weight: 600; color: #e4e4e7; }
  .ag-conv-disabled {
    display: flex; align-items: center; gap: 14px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px; padding: 16px;
  }
  .ag-expand { animation: fadeUp 0.22s ease; }
  @media (max-width: 520px) { .ag-ender-grid { flex-direction: column; } }

  /* ── Módulo 3 ── */
  @keyframes spin { to { transform: rotate(360deg); } }
  .ag-spinner { animation: spin 0.7s linear infinite; display: inline-block; }
  .ag-textarea {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    padding: 12px 14px;
    color: #f4f4f5;
    font-size: 14px;
    font-family: inherit;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
    width: 100%;
    box-sizing: border-box;
    min-height: 100px;
    resize: vertical;
    line-height: 1.6;
  }
  .ag-textarea::placeholder { color: #52525b; }
  .ag-textarea:focus { border-color: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,0.12); }
  .ag-char-count { font-size: 12px; color: #52525b; text-align: right; margin-top: 4px; }
  .ag-char-count.over { color: #f43f5e; }
  .ag-review-card {
    background: rgba(16,185,129,0.05);
    border: 1px solid rgba(16,185,129,0.2);
    border-radius: 14px;
    padding: 16px 18px;
    display: flex;
    flex-direction: column;
    gap: 7px;
    margin-bottom: 24px;
  }
  .ag-review-row { font-size: 13px; color: #a1a1aa; display: flex; align-items: flex-start; gap: 8px; }
  .ag-review-row strong { color: #f4f4f5; }
  .ag-submit-error {
    animation: fadeUp 0.2s ease;
    background: rgba(244,63,94,0.1);
    border: 1px solid rgba(244,63,94,0.3);
    border-radius: 10px;
    padding: 10px 14px;
    font-size: 13px;
    color: #f43f5e;
    margin-top: 12px;
    text-align: center;
  }
  .ag-status-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(251,191,36,0.12);
    border: 1px solid rgba(251,191,36,0.35);
    border-radius: 99px;
    padding: 4px 14px;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.08em;
    color: #fbbf24;
    text-transform: uppercase;
    margin-bottom: 16px;
  }
`;

// ─── Calendar Helper ──────────────────────────────────────────────────────────

function buildCalendar(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  return days;
}

const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const WEEK_DAYS = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AgendarConsultaPage() {
  const router = useRouter();
  const [step, setStep] = useState(0); // 0(tipo)|1(end+conv)|2(esp)|3(pro)|4(data)|5(obs+solicitar)|6(sucesso)

  // Step 0 — Tipo de consulta
  const [tipoConsulta, setTipoConsulta] = useState<"Online" | "Presencial" | null>(null);

  // Step 1 — (endereço vem do profissional selecionado, sem input do paciente)

  // Step 1 — Convênio
  const [usaConvenio,    setUsaConvenio]    = useState<boolean | null>(null);
  const [convenioSel,    setConvenioSel]    = useState<number | null>(null);
  const [convenioOutros, setConvenioOutros] = useState("");

  // Step 2
  const [espSel, setEspSel] = useState<number | null>(null);

  // Step 3
  const [proSel, setProSel] = useState<number | null>(null);
  const [modalidade, setModalidade] = useState<"Presencial" | "Online">("Presencial");

  // Step 4
  const today = new Date();
  const [calYear,  setCalYear]  = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [daysSel, setDaySel]   = useState<number | null>(null);
  const [horSel, setHorSel]    = useState<string | null>(null);

  // Step 5 — Observação + Submissão
  const [observacao,    setObservacao]    = useState("");
  const [isSubmitting,  setIsSubmitting]  = useState(false);
  const [submitError,   setSubmitError]   = useState("");
  const [consultaStatus, setConsultaStatus] = useState<string | null>(null);

  const profFiltrados = profissionais.filter(p => {
    const matchEsp  = espSel ? p.especialidade.includes(espSel) : true;
    const matchTipo = tipoConsulta ? p.modalidades.includes(tipoConsulta) : true;
    return matchEsp && matchTipo;
  });

  const proAtual = profissionais.find(p => p.id === proSel);
  const espAtual = especialidades.find(e => e.id === espSel);

  const calDays = buildCalendar(calYear, calMonth);

  function prevMonth() {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
    setDaySel(null); setHorSel(null);
  }
  function nextMonth() {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
    setDaySel(null); setHorSel(null);
  }

  function isPast(d: number) {
    const sel = new Date(calYear, calMonth, d);
    const t = new Date(); t.setHours(0,0,0,0);
    return sel < t;
  }

  const convenioOk = !CONFIG_ACEITA_CONVENIO ||
    (usaConvenio !== null && (usaConvenio === false || convenioSel !== null));
  const canProceedStep1 = convenioOk;

  const canSubmit =
    !!tipoConsulta && convenioOk &&
    !!espSel && !!proSel && !!daysSel && !!horSel;

  async function submeterAgendamento() {
    if (!canSubmit || isSubmitting) return;
    setIsSubmitting(true); setSubmitError("");
    try {
      await new Promise(r => setTimeout(r, 800)); // simula latência de API
      const convenioNome = convenioSel === 4
        ? (convenioOutros || "Outros")
        : convenios.find(c => c.id === convenioSel)?.nome ?? null;
      const payload = {
        tipo: tipoConsulta,
        endereco: tipoConsulta === "Presencial" ? (proAtual?.clinica ?? null) : null,
        convenio: usaConvenio ? { id: convenioSel, nome: convenioNome } : null,
        especialidadeId: espSel,
        profissionalId: proSel,
        modalidade,
        data: `${calYear}-${String(calMonth+1).padStart(2,"0")}-${String(daysSel).padStart(2,"0")}`,
        horario: horSel,
        observacao: observacao.trim() || null,
        status: "consulta_solicitada",
      };
      console.log("[FitMax] Agendamento solicitado:", payload);
      setConsultaStatus("consulta_solicitada");
      setStep(6);
    } catch {
      setSubmitError("Erro ao solicitar agendamento. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // 5 etapas de seleção (0−4) + review (5) + sucesso (6)
  const progress = step >= 5 ? 100 : Math.round((step / 5) * 100);

  return (
    <>
      <style>{STYLES}</style>
      <ScrollView flex={1} backgroundColor="$background" showsVerticalScrollIndicator={false}>
        <YStack
          padding="$4"
          $gtSm={{ padding: "$6" }}
          maxWidth={760}
          marginHorizontal="auto"
          width="100%"
          gap="$5"
          className="ag-page"
        >

          {/* ── Voltar + Título ── */}
          <XStack alignItems="center" gap="$3">
            <button
              onClick={() => router.push("/painel/consultas")}
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10,
                width: 38, height: 38,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "#a1a1aa", flexShrink: 0,
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#10b981"; (e.currentTarget as HTMLButtonElement).style.color = "#10b981"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.1)"; (e.currentTarget as HTMLButtonElement).style.color = "#a1a1aa"; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
              </svg>
            </button>
            <YStack flex={1}>
              <H2 color="$color12" size="$6" fontWeight="bold">Agendar Consulta</H2>
              {step < 5 && step > 0 && <Text color="$color11" fontSize={13}>Etapa {step} de 5</Text>}
            </YStack>
          </XStack>

          {/* ── Progress Bar ── */}
          {step < 5 && (
            <YStack gap="$2">
              <div className="ag-progress-bar">
                <div className="ag-progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <XStack justifyContent="space-between">
                {["Tipo", "Convênio", "Especialidade", "Profissional", "Data"].map((label, i) => (
                  <Text
                    key={label}
                    fontSize={11}
                    fontWeight={step === i ? "bold" : "400"}
                    color={step > i ? "#10b981" : step === i ? "$color12" : "$color10"}
                  >
                    {step > i ? "✓ " : ""}{label}
                  </Text>
                ))}
              </XStack>
            </YStack>
          )}

          {/* ═══ ETAPA 0 — Tipo de Consulta ═══ */}
          {step === 0 && (
            <div className="ag-step-card">
              <Text color="$color12" fontSize={18} fontWeight="bold" display="block" marginBottom="$2">
                Como prefere sua consulta?
              </Text>
              <Text color="$color11" fontSize={13} display="block" marginBottom="$5">
                Escolha a modalidade antes de prosseguir com o agendamento.
              </Text>

              <div className="ag-tipo-grid">
                {/* Card Online */}
                <div
                  id="card-tipo-online"
                  className={`ag-tipo-card${tipoConsulta === "Online" ? " active" : ""}`}
                  onClick={() => setTipoConsulta("Online")}
                >
                  <div className="ag-tipo-check">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <span className="ag-tipo-icon">🌐</span>
                  <p className="ag-tipo-title">Online</p>
                  <p className="ag-tipo-sub">Consulta por vídeo no conforto da sua casa</p>
                  <span className="ag-tipo-badge">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                    Qualquer horário
                  </span>
                </div>

                {/* Card Presencial */}
                <div
                  id="card-tipo-presencial"
                  className={`ag-tipo-card${tipoConsulta === "Presencial" ? " active" : ""}`}
                  onClick={() => setTipoConsulta("Presencial")}
                >
                  <div className="ag-tipo-check">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <span className="ag-tipo-icon">📍</span>
                  <p className="ag-tipo-title">Presencial</p>
                  <p className="ag-tipo-sub">Atendimento direto na clínica ou consultório</p>
                  <span className="ag-tipo-badge">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                    Na sua cidade
                  </span>
                </div>
              </div>

              <XStack justifyContent="flex-end" marginTop="$5">
                <button
                  id="btn-tipo-proximo"
                  className="ag-btn-primary"
                  disabled={!tipoConsulta}
                  onClick={() => setStep(1)}
                >
                  Próximo
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              </XStack>
            </div>
          )}

          {/* ═══ ETAPA 1 — Endereço & Convênio ═══ */}
          {step === 1 && (
            <div className="ag-step-card">
              <Text color="$color12" fontSize={16} fontWeight="bold" display="block" marginBottom="$4">
                Convênio
              </Text>

              {/* ConvenioToggle */}
              <div className="ag-conv-section">
                <Text color="$color11" fontSize={13} fontWeight="700" display="block" marginBottom="$3">
                  💳 Convênio
                </Text>
                {!CONFIG_ACEITA_CONVENIO ? (
                  <div className="ag-conv-disabled">
                    <span style={{ fontSize: 22 }}>🚫</span>
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, color: "#f4f4f5", fontSize: 14 }}>Não aceito convênios</p>
                      <p style={{ margin: "4px 0 0", color: "#71717a", fontSize: 13 }}>Atendimento somente particular.</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: usaConvenio ? 16 : 0 }}>
                      <Text color="$color11" fontSize={13}>Você possui convênio?</Text>
                      <div className="ag-conv-toggle">
                        <button
                          className={`ag-conv-btn${usaConvenio === false ? " active-no" : ""}`}
                          onClick={() => { setUsaConvenio(false); setConvenioSel(null); setConvenioOutros(""); }}
                        >Não</button>
                        <button
                          className={`ag-conv-btn${usaConvenio === true ? " active-yes" : ""}`}
                          onClick={() => setUsaConvenio(true)}
                        >Sim</button>
                      </div>
                    </div>
                    {usaConvenio === true && (
                      <div className="ag-expand">
                        <div className="ag-conv-list">
                          {convenios.map(c => (
                            <div
                              key={c.id}
                              className={`ag-conv-card${convenioSel === c.id ? " active" : ""}`}
                              onClick={() => setConvenioSel(c.id)}
                            >
                              <span style={{ fontSize: 22 }}>{c.logo}</span>
                              <span className="ag-conv-nome">{c.nome}</span>
                            </div>
                          ))}
                        </div>
                        {convenioSel === 4 && (
                          <div style={{ marginTop: 12 }}>
                            <label className="ag-field-label">Qual convênio?</label>
                            <input
                              className="ag-field"
                              placeholder="Nome do convênio…"
                              value={convenioOutros}
                              onChange={e => setConvenioOutros(e.target.value)}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              <XStack justifyContent="space-between" marginTop="$5">
                <button className="ag-btn-ghost" onClick={() => setStep(0)}>← Voltar</button>
                <button
                  className="ag-btn-primary"
                  disabled={!canProceedStep1}
                  onClick={() => setStep(2)}
                >
                  Próximo
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              </XStack>
            </div>
          )}

          {/* ═══ ETAPA 2 — Especialidade ═══ */}
          {step === 2 && (
            <div className="ag-step-card">
              <Text color="$color12" fontSize={16} fontWeight="bold" display="block" marginBottom="$4">
                Qual especialidade você procura?
              </Text>
              <div className="ag-esp-grid">
                {especialidades.map(esp => {
                  const isActive = espSel === esp.id;
                  return (
                    <div
                      key={esp.id}
                      className={`ag-esp-card${isActive ? " active" : ""}`}
                      style={{ "--esp-cor": esp.cor, "--esp-rgb": esp.cor.replace("#","").match(/../g)?.map(x=>parseInt(x,16)).join(",") } as React.CSSProperties}
                      onClick={() => setEspSel(esp.id)}
                    >
                      <span className="ag-esp-icon">{esp.icon}</span>
                      <span className="ag-esp-label" style={isActive ? { color: esp.cor } : {}}>{esp.nome}</span>
                    </div>
                  );
                })}
              </div>
              <XStack justifyContent="space-between" marginTop="$5">
                <button className="ag-btn-ghost" onClick={() => setStep(1)}>← Voltar</button>
                <button
                  className="ag-btn-primary"
                  disabled={!espSel}
                  onClick={() => setStep(3)}
                >
                  Próximo
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              </XStack>
            </div>
          )}

          {/* ═══ ETAPA 3 — Profissional ═══ */}
          {step === 3 && (
            <div className="ag-step-card">
              <XStack justifyContent="space-between" alignItems="center" marginBottom="$4" flexWrap="wrap" gap="$2">
                <Text color="$color12" fontSize={16} fontWeight="bold">Escolha o profissional</Text>
                {tipoConsulta && (
                  <span style={{ fontSize: 12, color: tipoConsulta === "Online" ? "#60a5fa" : "#10b981", fontWeight: 700, background: tipoConsulta === "Online" ? "rgba(96,165,250,0.12)" : "rgba(16,185,129,0.12)", border: `1px solid ${tipoConsulta === "Online" ? "rgba(96,165,250,0.3)" : "rgba(16,185,129,0.3)"}`, borderRadius: 20, padding: "3px 10px" }}>
                    {tipoConsulta === "Online" ? "🌐" : "📍"} {tipoConsulta}
                  </span>
                )}
                {espAtual && (
                  <span style={{ fontSize: 12, color: espAtual.cor, fontWeight: 700, background: `${espAtual.cor}20`, border: `1px solid ${espAtual.cor}44`, borderRadius: 20, padding: "3px 10px" }}>
                    {espAtual.icon} {espAtual.nome}
                  </span>
                )}
              </XStack>

              <div className="ag-pro-list">
                {profFiltrados.map(pro => {
                  const isActive = proSel === pro.id;
                  const stars = "★".repeat(Math.round(pro.avaliacao)) + "☆".repeat(5 - Math.round(pro.avaliacao));
                  return (
                    <div
                      key={pro.id}
                      className={`ag-pro-card${isActive ? " active" : ""}`}
                      onClick={() => { setProSel(pro.id); setModalidade(pro.modalidades[0] as "Presencial" | "Online"); }}
                    >
                      <img src={pro.avatar} alt={pro.nome} className="ag-pro-avatar" />
                      <div className="ag-pro-info">
                        <p className="ag-pro-nome">{pro.nome}</p>
                        <span className="ag-pro-rating">{stars} <span style={{ color: "#a1a1aa", fontWeight: 400 }}>{pro.avaliacao}</span></span>
                      </div>
                      <XStack gap="$2">
                        {pro.modalidades.map(m => (
                          <button
                            key={m}
                            className={`ag-modal-pill${isActive && modalidade === m ? " active" : ""}`}
                            onClick={e => { e.stopPropagation(); setProSel(pro.id); setModalidade(m as "Presencial" | "Online"); }}
                          >
                            {m === "Online" ? "🌐" : "📍"} {m}
                          </button>
                        ))}
                      </XStack>
                      {isActive && proAtual?.clinica && tipoConsulta === "Presencial" && (
                        <div style={{
                          marginTop: 10, padding: "10px 12px",
                          background: "rgba(16,185,129,0.06)",
                          border: "1px solid rgba(16,185,129,0.2)",
                          borderRadius: 10, fontSize: 12, color: "#a1a1aa", lineHeight: 1.6,
                        }}>
                          <span style={{ color: "#10b981", fontWeight: 700, display: "block", marginBottom: 2 }}>
                            📍 {proAtual.clinica.nome}
                          </span>
                          {proAtual.clinica.logradouro}, {proAtual.clinica.numero}
                          {proAtual.clinica.complemento ? ` — ${proAtual.clinica.complemento}` : ""}
                          {" · "}{proAtual.clinica.bairro} · {proAtual.clinica.cidade}/{proAtual.clinica.uf}
                        </div>
                      )}
                      {isActive && (
                        <span style={{ color: "#10b981", fontSize: 18, flexShrink: 0 }}>✓</span>
                      )}
                    </div>
                  );
                })}
              </div>

              <XStack justifyContent="space-between" marginTop="$5">
                <button className="ag-btn-ghost" onClick={() => setStep(2)}>← Voltar</button>
                <button className="ag-btn-primary" disabled={!proSel} onClick={() => setStep(4)}>
                  Próximo
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              </XStack>
            </div>
          )}

          {/* ═══ ETAPA 4 — Data e Horário ═══ */}
          {step === 4 && (
            <div className="ag-step-card">
              <Text color="$color12" fontSize={16} fontWeight="bold" display="block" marginBottom="$4">
                Escolha a data e horário
              </Text>

              {/* Calendário */}
              <div style={{ marginBottom: 24 }}>
                <XStack justifyContent="space-between" alignItems="center" marginBottom="$3">
                  <button onClick={prevMonth} style={{ background: "none", border: "none", color: "#a1a1aa", cursor: "pointer", fontSize: 18, padding: "4px 8px" }}>‹</button>
                  <Text color="$color12" fontSize={15} fontWeight="bold">{MONTHS[calMonth]} {calYear}</Text>
                  <button onClick={nextMonth} style={{ background: "none", border: "none", color: "#a1a1aa", cursor: "pointer", fontSize: 18, padding: "4px 8px" }}>›</button>
                </XStack>
                <div className="ag-cal-grid">
                  {WEEK_DAYS.map(d => <div key={d} className="ag-cal-header">{d}</div>)}
                  {calDays.map((day, idx) => {
                    if (!day) return <div key={`e${idx}`} className="ag-cal-day empty" />;
                    const past = isPast(day);
                    const isToday = day === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();
                    const isActive = daysSel === day;
                    return (
                      <div
                        key={day}
                        className={`ag-cal-day${past ? " disabled" : ""}${isToday && !isActive ? " today" : ""}${isActive ? " active" : ""}`}
                        onClick={() => { if (!past) { setDaySel(day); setHorSel(null); } }}
                      >
                        {day}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Horários */}
              {daysSel && (
                <div>
                  <Text color="$color11" fontSize={13} fontWeight="bold" display="block" marginBottom="$2">
                    Horários disponíveis — {String(daysSel).padStart(2,"0")}/{String(calMonth+1).padStart(2,"0")}/{calYear}
                  </Text>
                  <div className="ag-hor-grid">
                    {horarios.map(h => {
                      const occupied = horariosOcupados.includes(h);
                      const isActive = horSel === h;
                      return (
                        <button
                          key={h}
                          className={`ag-hor-btn${occupied ? " occupied" : ""}${isActive ? " active" : ""}`}
                          onClick={() => { if (!occupied) setHorSel(h); }}
                        >
                          {h}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Resumo */}
              {proAtual && daysSel && horSel && (
                <div style={{ marginTop: 20, background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 12, padding: "14px 16px" }}>
                  <Text color="#10b981" fontSize={12} fontWeight="bold" display="block" marginBottom="$2">RESUMO DO AGENDAMENTO</Text>
                  <Text color="$color12" fontSize={13} display="block">👨‍⚕️ {proAtual.nome}</Text>
                  <Text color="$color11" fontSize={13} display="block">📅 {String(daysSel).padStart(2,"0")}/{String(calMonth+1).padStart(2,"0")}/{calYear} às {horSel}</Text>
                  <Text color="$color11" fontSize={13} display="block">{tipoConsulta === "Online" ? "🌐" : "📍"} {tipoConsulta}</Text>
                  {espAtual && <Text color="$color11" fontSize={13} display="block">🏥 {espAtual.icon} {espAtual.nome}</Text>}
                  {tipoConsulta === "Presencial" && proAtual?.clinica && (
                    <Text color="$color11" fontSize={13} display="block">
                      📍 {proAtual.clinica.nome} — {proAtual.clinica.logradouro}, {proAtual.clinica.numero} · {proAtual.clinica.cidade}/{proAtual.clinica.uf}
                    </Text>
                  )}
                  {CONFIG_ACEITA_CONVENIO && usaConvenio === true && convenioSel && (
                    <Text color="$color11" fontSize={13} display="block">💳 {convenioSel === 4 ? convenioOutros || "Outros" : convenios.find(c => c.id === convenioSel)?.nome}</Text>
                  )}
                  {CONFIG_ACEITA_CONVENIO && usaConvenio === false && (
                    <Text color="$color11" fontSize={13} display="block">💵 Particular</Text>
                  )}
                </div>
              )}

              <XStack justifyContent="space-between" marginTop="$5">
                <button className="ag-btn-ghost" onClick={() => setStep(3)}>← Voltar</button>
                <button
                  className="ag-btn-primary"
                  disabled={!daysSel || !horSel}
                  onClick={() => setStep(5)}
                >
                  Confirmar Agendamento ✓
                </button>
              </XStack>
            </div>
          )}

          {/* ═══ ETAPA 5 — Revisão + Observação ═══ */}
          {step === 5 && (
            <div className="ag-step-card" style={{ animation: "fadeUp 0.3s ease" }}>
              <Text color="$color12" fontSize={16} fontWeight="bold" display="block" marginBottom="$4">
                Revisão Final
              </Text>

              {/* Resumo completo */}
              <div className="ag-review-card">
                <Text color="#10b981" fontSize={11} fontWeight="800" display="block"
                  style={{ letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}
                >Resumo do Agendamento</Text>
                <div className="ag-review-row"><span>👨‍⚕️</span><span><strong>{proAtual?.nome}</strong></span></div>
                {espAtual && <div className="ag-review-row"><span>🏥</span><span>{espAtual.icon} {espAtual.nome}</span></div>}
                <div className="ag-review-row">
                  <span>📅</span>
                  <span>{String(daysSel).padStart(2,"0")}/{String(calMonth+1).padStart(2,"0")}/{calYear} às {horSel}</span>
                </div>
                <div className="ag-review-row">
                  <span>{tipoConsulta === "Online" ? "🌐" : "📍"}</span>
                  <span>{tipoConsulta}</span>
                </div>
                {tipoConsulta === "Presencial" && proAtual?.clinica && (
                  <div className="ag-review-row">
                    <span>📍</span>
                    <span>
                      <strong>{proAtual.clinica.nome}</strong> — {proAtual.clinica.logradouro}, {proAtual.clinica.numero}
                      {proAtual.clinica.complemento ? ` — ${proAtual.clinica.complemento}` : ""}
                      {" · "}{proAtual.clinica.bairro} · {proAtual.clinica.cidade}/{proAtual.clinica.uf}
                    </span>
                  </div>
                )}
                {CONFIG_ACEITA_CONVENIO && usaConvenio === true && convenioSel && (
                  <div className="ag-review-row">
                    <span>💳</span>
                    <span>{convenioSel === 4 ? (convenioOutros || "Outros") : convenios.find(c => c.id === convenioSel)?.nome}</span>
                  </div>
                )}
                {CONFIG_ACEITA_CONVENIO && usaConvenio === false && (
                  <div className="ag-review-row"><span>💵</span><span>Particular</span></div>
                )}
              </div>

              {/* ObservacaoField */}
              <div style={{ marginBottom: 8 }}>
                <Text color="$color11" fontSize={13} fontWeight="700" display="block" marginBottom="$2">
                  Observações <span style={{ fontWeight: 400, color: "#52525b" }}>(opcional)</span>
                </Text>
                <textarea
                  id="textarea-observacao"
                  className="ag-textarea"
                  placeholder="Descreva sintomas, preferências ou qualquer informação relevante para o profissional…"
                  maxLength={500}
                  value={observacao}
                  onChange={e => setObservacao(e.target.value)}
                />
                <div className={`ag-char-count${observacao.length >= 500 ? " over" : ""}`}>
                  {observacao.length} / 500
                </div>
              </div>

              {submitError && <div className="ag-submit-error">{submitError}</div>}

              <XStack justifyContent="space-between" marginTop="$5" alignItems="center">
                <button className="ag-btn-ghost" onClick={() => setStep(4)} disabled={isSubmitting}>
                  ← Voltar
                </button>
                <button
                  id="btn-solicitar-agendamento"
                  className="ag-btn-primary"
                  disabled={!canSubmit || isSubmitting}
                  onClick={submeterAgendamento}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="ag-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M12 2a10 10 0 0 1 10 10" />
                      </svg>
                      Enviando…
                    </>
                  ) : (
                    <>
                      Solicitar Agendamento
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                      </svg>
                    </>
                  )}
                </button>
              </XStack>
            </div>
          )}

          {/* ═══ ETAPA 6 — Sucesso ═══ */}
          {step === 6 && (
            <div className="ag-step-card ag-success">
              <div style={{ textAlign: "center", marginBottom: 4 }}>
                <span className="ag-status-badge">
                  🟡 consulta_solicitada
                </span>
              </div>
              <div className="ag-success-icon">✅</div>
              <Text color="$color12" fontSize={22} fontWeight="bold" display="block" marginBottom="$2">
                Consulta Solicitada!
              </Text>
              <Text color="$color11" fontSize={14} display="block" marginBottom="$2">
                Sua solicitação com <strong style={{ color: "#f4f4f5" }}>{proAtual?.nome}</strong> foi enviada e aguarda confirmação.
              </Text>
              <Text color="$color11" fontSize={13} display="block" marginBottom="$2">
                📅 {String(daysSel).padStart(2,"0")}/{String(calMonth+1).padStart(2,"0")}/{calYear} às {horSel}
              </Text>
              <Text color="$color11" fontSize={13} display="block" marginBottom="$6">
                {tipoConsulta === "Online" ? "🌐 Consulta Online" : "📍 Consulta Presencial"}
              </Text>
              <button
                className="ag-btn-primary"
                style={{ margin: "0 auto" }}
                onClick={() => router.push("/painel/consultas")}
              >
                Ver Minhas Consultas →
              </button>
            </div>
          )}

        </YStack>
      </ScrollView>
    </>
  );
}
