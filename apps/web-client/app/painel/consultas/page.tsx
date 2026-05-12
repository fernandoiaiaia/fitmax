//@ts-nocheck
"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  Avatar,
  Text,
  H2,
  XStack,
  YStack,
  ScrollView,
  Button,
  Circle,
  Separator,
} from "tamagui";

// ─── Types ───────────────────────────────────────────────────────────────────

type ConsultaStatus = "agendada" | "pendente" | "a_confirmar" | "em_andamento";

interface Consulta {
  id: number;
  horario: string;
  nome: string;
  especialidade: string;
  modalidade: "Presencial" | "Online";
  /** ISO date string yyyy-mm-dd */
  dataISO: string;
  /** display label */
  data: string;
  avatar: string;
  status: ConsultaStatus;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const consultas: Consulta[] = [
  { id: 1, horario: "09:00", nome: "Dr. Roberto Alves",    especialidade: "Ortopedia",         modalidade: "Presencial", dataISO: "2026-04-22", data: "Hoje, 22/04",   avatar: "https://picsum.photos/200/200?random=21", status: "agendada" },
  { id: 2, horario: "11:00", nome: "Dra. Ana Souza",       especialidade: "Nutrição",           modalidade: "Online",     dataISO: "2026-04-22", data: "Hoje, 22/04",   avatar: "https://picsum.photos/200/200?random=23", status: "pendente" },
  { id: 3, horario: "14:30", nome: "Dra. Letícia Marques", especialidade: "Endocrinologia",     modalidade: "Presencial", dataISO: "2026-04-22", data: "Hoje, 22/04",   avatar: "https://picsum.photos/200/200?random=50", status: "em_andamento" },
  { id: 4, horario: "09:00", nome: "Dr. Vinícius Almeida", especialidade: "Nutrologia",         modalidade: "Online",     dataISO: "2026-04-23", data: "Amanhã, 23/04", avatar: "https://picsum.photos/200/200?random=60", status: "a_confirmar" },
  { id: 5, horario: "16:00", nome: "Marcelo Strong",       especialidade: "Fisioterapia",       modalidade: "Presencial", dataISO: "2026-04-24", data: "24/04",         avatar: "https://picsum.photos/200/200?random=52", status: "agendada" },
  { id: 6, horario: "10:30", nome: "Bruno Silva",          especialidade: "Medicina Esportiva", modalidade: "Online",     dataISO: "2026-05-10", data: "10/05",         avatar: "https://picsum.photos/200/200?random=25", status: "pendente" },
  { id: 7, horario: "13:00", nome: "Dra. Camila Nery",    especialidade: "Personal Trainer",   modalidade: "Presencial", dataISO: "2026-05-20", data: "20/05",         avatar: "https://picsum.photos/200/200?random=22", status: "agendada" },
];

// ─── Status Config ────────────────────────────────────────────────────────────

const statusConfig: Record<
  ConsultaStatus,
  { label: string; bg: string; color: string; dotColor: string }
> = {
  agendada:     { label: "AGENDADA",     bg: "rgba(16,185,129,0.12)",  color: "#10b981", dotColor: "#10b981" },
  pendente:     { label: "PENDENTE",     bg: "rgba(234,179,8,0.12)",   color: "#facc15", dotColor: "#facc15" },
  a_confirmar:  { label: "A CONFIRMAR",  bg: "rgba(161,161,170,0.1)",  color: "#a1a1aa", dotColor: "#a1a1aa" },
  em_andamento: { label: "EM ANDAMENTO", bg: "rgba(96,165,250,0.12)",  color: "#60a5fa", dotColor: "#60a5fa" },
};



// ─── Icons ────────────────────────────────────────────────────────────────────

const CalendarIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const ClockIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);

const TrendingIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
  </svg>
);

const MoneyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);



const ChevronDown = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

// ─── Dropdown helper ──────────────────────────────────────────────────────────

function useOutsideClick(ref: React.RefObject<HTMLElement>, cb: () => void) {
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) cb();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, cb]);
}

// ─── Consulta Row Card ────────────────────────────────────────────────────────

// ─── Banner Hero CTA Styles ──────────────────────────────────────────────────

const BANNER_CTA_STYLES = `
  @keyframes calPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.5); }
    50%       { box-shadow: 0 0 0 10px rgba(16,185,129,0); }
  }
  .agendar-banner {
    position: relative;
    overflow: hidden;
    border-radius: 16px;
    border: 1px solid rgba(16,185,129,0.35);
    background: linear-gradient(135deg, rgba(16,185,129,0.13) 0%, rgba(96,165,250,0.07) 100%);
    padding: 20px 24px;
    display: flex;
    align-items: center;
    gap: 20px;
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s, transform 0.15s;
    text-decoration: none;
  }
  .agendar-banner::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, rgba(16,185,129,0.06) 0%, transparent 60%);
    pointer-events: none;
  }
  .agendar-banner:hover {
    border-color: rgba(16,185,129,0.65);
    background: linear-gradient(135deg, rgba(16,185,129,0.18) 0%, rgba(96,165,250,0.10) 100%);
    transform: translateY(-1px);
  }
  .agendar-banner-icon {
    width: 52px;
    height: 52px;
    border-radius: 14px;
    background: rgba(16,185,129,0.15);
    border: 1px solid rgba(16,185,129,0.35);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    animation: calPulse 2.4s ease-in-out infinite;
  }
  .agendar-banner-text { flex: 1; min-width: 0; }
  .agendar-banner-title {
    font-size: 16px;
    font-weight: 700;
    color: #f4f4f5;
    margin: 0 0 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .agendar-banner-sub {
    font-size: 13px;
    color: #71717a;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .agendar-banner-btn {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    background: #10b981;
    border: none;
    border-radius: 40px;
    padding: 10px 20px;
    color: #fff;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    transition: background 0.2s, box-shadow 0.2s, transform 0.15s;
    white-space: nowrap;
  }
  .agendar-banner-btn:hover {
    background: #0ea370;
    box-shadow: 0 0 18px rgba(16,185,129,0.45);
    transform: scale(1.03);
  }
  @media (max-width: 600px) {
    .agendar-banner { flex-wrap: wrap; gap: 14px; }
    .agendar-banner-btn { width: 100%; justify-content: center; }
    .agendar-banner-title, .agendar-banner-sub { white-space: normal; }
  }
`;

const CONS_CARD_STYLES = `
  .cons-badge { transition: border-color 0.15s; }
  .cons-card-clickable {
    cursor: pointer;
    transition: box-shadow 0.18s, transform 0.15s;
  }
  .cons-card-clickable:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 24px rgba(16,185,129,0.1);
  }
  .cons-arrow-icon {
    color: #52525b;
    transition: color 0.15s, transform 0.15s;
    flex-shrink: 0;
  }
  .cons-card-clickable:hover .cons-arrow-icon {
    color: #10b981;
    transform: translateX(3px);
  }

  @media (max-width: 642px) {
    .cons-row { flex-wrap: wrap !important; gap: 12px !important; }
    .cons-row-info { min-width: 160px !important; flex: 1 1 auto !important; }
    .cons-row-actions { width: 100% !important; justify-content: flex-end !important; padding-top: 8px !important; border-top: 1px dashed rgba(255,255,255,0.1) !important; }
    .cons-row-separator { display: none !important; }
    .cons-filter-mobile { display: block !important; }
    .cons-filter-desktop { display: none !important; }
    .cons-resumo-inner { flex-direction: column !important; flex-wrap: nowrap !important; gap: 16px !important; }
    .cons-resumo-inner > * { flex: none !important; }
    .cons-resumo-sep { display: none !important; }
    .cons-stat-grid { flex-direction: column !important; }
    .cons-stat-grid > * { min-width: unset !important; width: 100% !important; flex: none !important; }
  }
`;

function ConsultaRow({ c }: { c: Consulta }) {
  const cfg = statusConfig[c.status];
  const isAndamento = c.status === "em_andamento";
  const router = useRouter();
  const rowId = `row-${c.id}`;

  function handleCardClick() {
    const params = new URLSearchParams({
      id: String(c.id),
      nome: c.nome,
      especialidade: c.especialidade,
      data: c.data,
      horario: c.horario,
      modalidade: c.modalidade,
      status: c.status,
      avatar: c.avatar,
    });
    router.push(`/painel/consultas/agendar?${params.toString()}`);
  }

  return (
    <div id={rowId} className="cons-card-clickable" onClick={handleCardClick}>
      <Card borderWidth={1} animation="quick"
        backgroundColor={isAndamento ? "rgba(96,165,250,0.05)" : "$color2"}
        borderColor={isAndamento ? "rgba(96,165,250,0.25)" : "$borderColor"}
        borderRadius="$4" paddingHorizontal="$4" paddingVertical="$3"
        hoverStyle={{ backgroundColor: "$color3", borderColor: isAndamento ? "#60a5fa" : "$green8" }}>
        <XStack className="cons-row" alignItems="center" gap="$3" flexWrap="wrap">
          <YStack alignItems="center" width={52} flexShrink={0}>
            <Text color={isAndamento ? "#60a5fa" : "$color11"} fontSize={13} fontWeight="bold">{c.horario}</Text>
            {isAndamento && <Circle size={6} backgroundColor="#60a5fa" marginTop={4} style={{ boxShadow: "0 0 6px #60a5fa" }} />}
          </YStack>
          <Separator className="cons-row-separator" vertical height={36} borderColor="$borderColor" />
          <Avatar circular size="$4" backgroundColor="$color4" flexShrink={0}>
            <Avatar.Image src={c.avatar} />
            <Avatar.Fallback alignItems="center" justifyContent="center">
              <Text color="$color12" fontSize={14} fontWeight="bold">{c.nome[0]}</Text>
            </Avatar.Fallback>
          </Avatar>
          <YStack className="cons-row-info" flex={1} gap="$1" minWidth={140}>
            <Text color="$color12" fontSize={14} fontWeight="bold" numberOfLines={1}>{c.nome}</Text>
            <XStack alignItems="center" gap="$2">
              <Text color="$color11" fontSize={12}>{c.especialidade}</Text>
              <Circle size={3} backgroundColor="$color9" />
              <Text color="$color11" fontSize={12}>{c.modalidade}</Text>
            </XStack>
            <XStack alignItems="center" gap="$1" marginTop={2}>
              <span style={{ color: "#71717a" }}><ClockIcon /></span>
              <Text color="$color10" fontSize={11}>{c.data}</Text>
            </XStack>
          </YStack>

          <XStack className="cons-row-actions" alignItems="center" gap="$2" flexShrink={0}>
            <XStack paddingHorizontal="$3" paddingVertical="$1" borderRadius="$10" borderWidth={1}
              alignItems="center" justifyContent="center" className="cons-badge"
              style={{ background: cfg.bg, borderColor: cfg.color + "44" }}>
              <Text fontSize={10} fontWeight="bold" style={{ color: cfg.color }}>{cfg.label}</Text>
            </XStack>
            <span className="cons-arrow-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </span>
          </XStack>
        </XStack>
      </Card>
    </div>
  );
}


// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ConsultasPage() {
  const router = useRouter();
  const [cancelados, setCancelados] = useState<number[]>([]);

  // ── Date range filter
  const [dateFrom, setDateFrom] = useState("2026-04-22");
  const [dateTo,   setDateTo]   = useState("2026-05-22");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const dateRef = useRef<HTMLDivElement>(null);
  useOutsideClick(dateRef, () => setShowDatePicker(false));

  // ── Apply filters (sem filtro de status)
  const filtered = consultas.filter((c) => {
    if (cancelados.includes(c.id)) return false;
    if (c.status === "em_andamento") return false;
    if (dateFrom && c.dataISO < dateFrom) return false;
    if (dateTo   && c.dataISO > dateTo)   return false;
    return true;
  });

  // ── Date label for button
  const fmtDate = (iso: string) => {
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  };

  const dropdownStyle: React.CSSProperties = {
    position: "absolute",
    top: "calc(100% + 8px)",
    right: 0,
    zIndex: 100,
    background: "var(--color2, #1a1a1a)",
    border: "1px solid var(--borderColor, #333)",
    borderRadius: 12,
    padding: 16,
    minWidth: 240,
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
  };

  const inputStyle: React.CSSProperties = {
    background: "var(--color3, #222)",
    border: "1px solid var(--borderColor, #333)",
    borderRadius: 8,
    color: "var(--color12, #fff)",
    padding: "6px 10px",
    fontSize: 13,
    width: "100%",
    outline: "none",
    colorScheme: "dark",
  };

  const labelStyle: React.CSSProperties = {
    color: "var(--color11, #a1a1aa)",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 4,
    display: "block",
  };

  return (
    <>
      <style>{BANNER_CTA_STYLES}</style>
      <style>{CONS_CARD_STYLES}</style>
      <ScrollView flex={1} backgroundColor="$background" showsVerticalScrollIndicator={false}>
      <YStack
        padding="$4"
        $gtSm={{ padding: "$6" }}
        gap="$5"
        maxWidth={1100}
        marginHorizontal="auto"
        width="100%"
      >

        {/* ── Banner Hero CTA ── */}
        <div
          id="banner-agendar-consulta"
          className="agendar-banner"
          onClick={() => router.push("/painel/consultas/agendar")}
        >
          <div className="agendar-banner-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
              <path d="m9 16 2 2 4-4" />
            </svg>
          </div>
          <div className="agendar-banner-text">
            <p className="agendar-banner-title">Agendar Nova Consulta</p>
            <p className="agendar-banner-sub">Encontre o profissional ideal e escolha o horário que preferir</p>
          </div>
          <button
            className="agendar-banner-btn"
            onClick={e => { e.stopPropagation(); router.push("/painel/consultas/agendar"); }}
          >
            Agendar Agora
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>

        {/* ── Cabeçalho ── */}
        <XStack justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap="$3">
          <YStack gap="$1">
            <H2 color="$color12" size="$6" fontWeight="bold">Consultas</H2>
            <Text color="$color11" fontSize={14}>
              Gerencie seus agendamentos e acompanhe o status de cada consulta
            </Text>
          </YStack>

          <XStack gap="$2" flexWrap="wrap" alignItems="center">

            {/* ── Filtro período ── */}
            <div ref={dateRef} style={{ position: "relative" }}>
              <Button
                size="$3"
                borderRadius="$4"
                borderWidth={1}
                borderColor={showDatePicker ? "$green8" : "$borderColor"}
                backgroundColor="$color2"
                hoverStyle={{ backgroundColor: "$color3" }}
                paddingHorizontal="$3"
                gap="$2"
                id="btn-filtro-periodo"
                onPress={() => setShowDatePicker(v => !v)}
              >
                <span style={{ color: "#a1a1aa" }}><CalendarIcon /></span>
                <Text color="$color11" fontSize={12}>
                  {fmtDate(dateFrom)} — {fmtDate(dateTo)}
                </Text>
                <span style={{ color: "#a1a1aa" }}><ChevronDown /></span>
              </Button>

              {showDatePicker && (
                <div style={dropdownStyle}>
                  <div style={{ marginBottom: 12 }}>
                    <label style={labelStyle}>Data inicial</label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={e => setDateFrom(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={labelStyle}>Data final</label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={e => setDateTo(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => { setDateFrom("2026-04-22"); setDateTo("2026-05-22"); }}
                      style={{
                        flex: 1, padding: "6px 0", borderRadius: 8, fontSize: 12, fontWeight: 600,
                        background: "transparent", border: "1px solid var(--borderColor, #333)",
                        color: "var(--color11, #a1a1aa)", cursor: "pointer",
                      }}
                    >
                      Resetar
                    </button>
                    <button
                      onClick={() => setShowDatePicker(false)}
                      style={{
                        flex: 1, padding: "6px 0", borderRadius: 8, fontSize: 12, fontWeight: 600,
                        background: "#10b981", border: "none",
                        color: "#fff", cursor: "pointer",
                      }}
                    >
                      Aplicar
                    </button>
                  </div>
                </div>
              )}
            </div>

          </XStack>
        </XStack>

        {/* ── Cards de Resumo ── */}
        <XStack className="cons-stat-grid" gap="$4" flexWrap="wrap">

          {/* Resumo do Período */}
          <Card borderWidth={1} flex={1} minWidth={240}
            backgroundColor="$color2"
            borderColor="$borderColor"
            borderRadius="$5"
            padding="$4"
            hoverStyle={{ backgroundColor: "$color3", borderColor: "$green8" }}
            cursor="pointer"
          >
            <Text color="$color11" fontSize={11} fontWeight="bold" letterSpacing={1} textTransform="uppercase" marginBottom="$3">
              Resumo do Período
            </Text>
            <XStack gap="$4" className="cons-resumo-inner">
              <YStack flex={1} gap="$2">
                <Circle size="$3" backgroundColor="rgba(16,185,129,0.12)">
                  <TrendingIcon />
                </Circle>
                <Text color="$color11" fontSize={12}>Consultas</Text>
                <Text color="$color12" fontSize={22} fontWeight="bold">{filtered.length}</Text>
                <XStack alignItems="center" gap="$1">
                  <Circle size={6} backgroundColor="#10b981" />
                  <Text color="#10b981" fontSize={11}>no período selecionado</Text>
                </XStack>
              </YStack>

              <Separator vertical borderColor="$borderColor" className="cons-resumo-sep" />

              <YStack flex={1} gap="$2">
                <Circle size="$3" backgroundColor="rgba(16,185,129,0.12)">
                  <MoneyIcon />
                </Circle>
                <Text color="$color11" fontSize={12}>Valor Investido</Text>
                <Text color="$color12" fontSize={22} fontWeight="bold">R$970</Text>
                <XStack alignItems="center" gap="$1">
                  <Circle size={6} backgroundColor="#10b981" />
                  <Text color="#10b981" fontSize={11}>+8% vs mês anterior</Text>
                </XStack>
              </YStack>
            </XStack>
          </Card>

          {/* Visão Geral do Dia */}
          <Card flex={1}
            minWidth={240}
            borderWidth={1}
            backgroundColor="$color2"
            borderColor="$borderColor"
            borderRadius="$5"
            padding="$4"
            hoverStyle={{ backgroundColor: "$color3", borderColor: "$green8" }}
            cursor="pointer"
          >
            <Text color="$color11" fontSize={11} fontWeight="bold" letterSpacing={1} textTransform="uppercase" marginBottom="$3">
              Visão Geral do Dia
            </Text>
            <YStack gap="$3">
              {[
                { icon: "📅", label: "Total de Consultas", value: "3",  color: "$color12" },
                { icon: "✅", label: "Confirmadas",         value: "1",  color: "#10b981" },
                { icon: "⏳", label: "Pendentes",           value: "1",  color: "#facc15" },
                { icon: "⏱",  label: "Próxima em",          value: "2h", color: "#60a5fa" },
              ].map((item, i) => (
                <XStack
                  key={i}
                  justifyContent="space-between"
                  alignItems="center"
                  paddingVertical="$2"
                  paddingHorizontal="$3"
                  borderRadius="$3"
                  backgroundColor="$background"
                  borderWidth={1}
                  borderColor="$borderColor"
                  id={`day-item-${i}`}
                >
                  <XStack alignItems="center" gap="$2">
                    <Text fontSize={16}>{item.icon}</Text>
                    <Text color="$color11" fontSize={13}>{item.label}</Text>
                  </XStack>
                  <Text fontSize={16} fontWeight="bold" style={{ color: item.color as string }}>
                    {item.value}
                  </Text>
                </XStack>
              ))}
            </YStack>
          </Card>
        </XStack>

        {/* ── Lista de Consultas ── */}
        <YStack gap="$4">

          {/* Header da lista */}
          <XStack justifyContent="space-between" alignItems="center">
            <YStack gap="$1">
              <H2 color="$color12" size="$5" fontWeight="bold">Próximas Consultas</H2>
              <Text color="$color11" fontSize={12}>{filtered.length} consultas encontradas</Text>
            </YStack>
          </XStack>



          {/* Rows */}
          <YStack gap="$2">
            {filtered.length === 0 ? (
              <Card borderWidth={1}
                backgroundColor="$color2"
                borderColor="$borderColor"
                borderRadius="$5"
                padding="$8"
                alignItems="center"
              >
                <Text fontSize={32} marginBottom="$2">📭</Text>
                <Text color="$color11" fontSize={14}>Nenhuma consulta encontrada para este filtro.</Text>
              </Card>
            ) : (
              filtered.map((c) => <ConsultaRow key={c.id} c={c} />)
            )}
          </YStack>
        </YStack>

      </YStack>
    </ScrollView>
    </>
  );
}
