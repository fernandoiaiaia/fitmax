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

const profissionais = [
  { id: 1, nome: "Dr. Roberto Alves",    especialidade: [1,2],   avatar: "https://picsum.photos/200/200?random=21", avaliacao: 4.9, modalidades: ["Presencial","Online"] },
  { id: 2, nome: "Dra. Ana Souza",       especialidade: [1,8],   avatar: "https://picsum.photos/200/200?random=23", avaliacao: 4.8, modalidades: ["Online"] },
  { id: 3, nome: "Dra. Letícia Marques", especialidade: [5],     avatar: "https://picsum.photos/200/200?random=50", avaliacao: 4.7, modalidades: ["Presencial","Online"] },
  { id: 4, nome: "Dr. Vinícius Almeida", especialidade: [8,1],   avatar: "https://picsum.photos/200/200?random=60", avaliacao: 4.9, modalidades: ["Online"] },
  { id: 5, nome: "Marcelo Strong",       especialidade: [3,4],   avatar: "https://picsum.photos/200/200?random=52", avaliacao: 5.0, modalidades: ["Presencial"] },
  { id: 6, nome: "Bruno Silva",          especialidade: [6],     avatar: "https://picsum.photos/200/200?random=25", avaliacao: 4.6, modalidades: ["Presencial","Online"] },
  { id: 7, nome: "Dra. Camila Nery",    especialidade: [3,4,6], avatar: "https://picsum.photos/200/200?random=22", avaliacao: 4.8, modalidades: ["Presencial"] },
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
  .ag-page { animation: fadeUp 0.3s ease; }
  .ag-step-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 16px;
    padding: 28px;
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
  const [step, setStep] = useState(1); // 1 | 2 | 3 | 4(success)

  // Step 1
  const [espSel, setEspSel] = useState<number | null>(null);

  // Step 2
  const [proSel, setProSel] = useState<number | null>(null);
  const [modalidade, setModalidade] = useState<"Presencial" | "Online">("Presencial");

  // Step 3
  const today = new Date();
  const [calYear,  setCalYear]  = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [daysSel, setDaySel]   = useState<number | null>(null);
  const [horSel, setHorSel]    = useState<string | null>(null);

  const profFiltrados = espSel
    ? profissionais.filter(p => p.especialidade.includes(espSel))
    : profissionais;

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

  const progress = step === 4 ? 100 : Math.round(((step - 1) / 3) * 100);

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
              {step < 4 && <Text color="$color11" fontSize={13}>Etapa {step} de 3</Text>}
            </YStack>
          </XStack>

          {/* ── Progress Bar ── */}
          {step < 4 && (
            <YStack gap="$2">
              <div className="ag-progress-bar">
                <div className="ag-progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <XStack justifyContent="space-between">
                {["Especialidade", "Profissional", "Data e Horário"].map((label, i) => (
                  <Text
                    key={label}
                    fontSize={11}
                    fontWeight={step === i + 1 ? "bold" : "400"}
                    color={step > i + 1 ? "#10b981" : step === i + 1 ? "$color12" : "$color10"}
                  >
                    {step > i + 1 ? "✓ " : ""}{label}
                  </Text>
                ))}
              </XStack>
            </YStack>
          )}

          {/* ═══ ETAPA 1 — Especialidade ═══ */}
          {step === 1 && (
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
              <XStack justifyContent="flex-end" marginTop="$5">
                <button
                  className="ag-btn-primary"
                  disabled={!espSel}
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

          {/* ═══ ETAPA 2 — Profissional ═══ */}
          {step === 2 && (
            <div className="ag-step-card">
              <XStack justifyContent="space-between" alignItems="center" marginBottom="$4">
                <Text color="$color12" fontSize={16} fontWeight="bold">Escolha o profissional</Text>
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
                      {isActive && (
                        <span style={{ color: "#10b981", fontSize: 18, flexShrink: 0 }}>✓</span>
                      )}
                    </div>
                  );
                })}
              </div>

              <XStack justifyContent="space-between" marginTop="$5">
                <button className="ag-btn-ghost" onClick={() => setStep(1)}>← Voltar</button>
                <button className="ag-btn-primary" disabled={!proSel} onClick={() => setStep(3)}>
                  Próximo
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              </XStack>
            </div>
          )}

          {/* ═══ ETAPA 3 — Data e Horário ═══ */}
          {step === 3 && (
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
                  <Text color="$color11" fontSize={13} display="block">{modalidade === "Online" ? "🌐" : "📍"} {modalidade}</Text>
                </div>
              )}

              <XStack justifyContent="space-between" marginTop="$5">
                <button className="ag-btn-ghost" onClick={() => setStep(2)}>← Voltar</button>
                <button
                  className="ag-btn-primary"
                  disabled={!daysSel || !horSel}
                  onClick={() => setStep(4)}
                >
                  Confirmar Agendamento ✓
                </button>
              </XStack>
            </div>
          )}

          {/* ═══ ETAPA 4 — Sucesso ═══ */}
          {step === 4 && (
            <div className="ag-step-card ag-success">
              <div className="ag-success-icon">✅</div>
              <Text color="$color12" fontSize={22} fontWeight="bold" display="block" marginBottom="$2">
                Consulta Agendada!
              </Text>
              <Text color="$color11" fontSize={14} display="block" marginBottom="$2">
                Sua consulta com <strong style={{ color: "#f4f4f5" }}>{proAtual?.nome}</strong> foi confirmada.
              </Text>
              <Text color="$color11" fontSize={13} display="block" marginBottom="$6">
                📅 {String(daysSel).padStart(2,"0")}/{String(calMonth+1).padStart(2,"0")}/{calYear} às {horSel} · {modalidade}
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
