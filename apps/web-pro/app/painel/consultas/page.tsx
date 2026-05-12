//@ts-nocheck
"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  Avatar,
  Text,
  H1,
  H2,
  XStack,
  YStack,
  Circle,
  Button,
  Separator,
  ScrollView,
} from "tamagui";

// ─── Types ───────────────────────────────────────────────────────────────────

type ConsultaStatus = "agendada" | "pendente" | "a_confirmar" | "em_andamento";

interface Consulta {
  id: number;
  horario: string;
  nome: string;
  especialidade: string;
  modalidade: "Presencial" | "Online";
  data: string;
  dataISO: string;
  avatar: string;
  status: ConsultaStatus;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const consultaEmAndamento = {
  nome: "Guilherme Augusto",
  especialidade: "Cardiologia",
  horario: "11:00 — 11:50",
  avatar: "https://picsum.photos/200/200?random=30",
};

const consultas: Consulta[] = [
  { id: 1, horario: "09:00", nome: "Fernanda Lima",      especialidade: "Cardiologia", modalidade: "Presencial", data: "Hoje, 23/04",    dataISO: "2026-04-23", avatar: "https://picsum.photos/200/200?random=41", status: "agendada" },
  { id: 2, horario: "11:00", nome: "Guilherme Augusto",  especialidade: "Cardiologia", modalidade: "Presencial", data: "Hoje, 23/04",    dataISO: "2026-04-23", avatar: "https://picsum.photos/200/200?random=30", status: "em_andamento" },
  { id: 3, horario: "13:00", nome: "Mariana Ferreira",   especialidade: "Cardiologia", modalidade: "Online",     data: "Hoje, 23/04",    dataISO: "2026-04-23", avatar: "https://picsum.photos/200/200?random=31", status: "pendente" },
  { id: 4, horario: "15:30", nome: "Ricardo Nunes",      especialidade: "Check-up",    modalidade: "Presencial", data: "Hoje, 23/04",    dataISO: "2026-04-23", avatar: "https://picsum.photos/200/200?random=45", status: "a_confirmar" },
  { id: 5, horario: "09:00", nome: "Lucas Mendes",       especialidade: "Check-up",    modalidade: "Presencial", data: "Amanhã, 24/04",  dataISO: "2026-04-24", avatar: "https://picsum.photos/200/200?random=32", status: "agendada" },
];

// ─── Status Config ─────────────────────────────────────────────────────────

const statusConfig: Record<ConsultaStatus, { label: string; bg: string; color: string; dotColor: string }> = {
  agendada:     { label: "AGENDADA",     bg: "rgba(16,185,129,0.12)",  color: "#10b981", dotColor: "#10b981" },
  pendente:     { label: "PENDENTE",     bg: "rgba(234,179,8,0.12)",   color: "#facc15", dotColor: "#facc15" },
  a_confirmar:  { label: "A CONFIRMAR",  bg: "rgba(161,161,170,0.1)",  color: "#a1a1aa", dotColor: "#a1a1aa" },
  em_andamento: { label: "EM ANDAMENTO", bg: "rgba(96,165,250,0.12)",  color: "#60a5fa", dotColor: "#60a5fa" },
};

// ─── Icons ────────────────────────────────────────────────────────────────────

const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
);
const ClockIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
);
const TrendingIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>
);
const MoneyIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
);
const FilterIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="12" y1="18" x2="12" y2="18" /></svg>
);
const ChevronDown = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
);

// ─── useOutsideClick helper ───────────────────────────────────────────────────

function useOutsideClick(ref: React.RefObject<HTMLElement>, cb: () => void) {
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) cb();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, cb]);
}

// ─── CSS ─────────────────────────────────────────────────────────────────────

const PRO_CARD_STYLES = `
  @keyframes proFadeUp {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .pro-cons-card-wrap {
    cursor: pointer;
    animation: proFadeUp 0.28s ease both;
    transition: transform 0.15s;
  }
  .pro-cons-card-wrap:hover { transform: translateY(-1px); }
  .pro-cons-arrow-icon {
    color: #3f3f46;
    transition: color 0.15s, transform 0.15s;
    flex-shrink: 0;
  }
  .pro-cons-card-wrap:hover .pro-cons-arrow-icon {
    color: #10b981;
    transform: translateX(3px);
  }
`;

// ─── Row de consulta ─────────────────────────────────────────────────────────

function ConsultaRow({ c }: { c: Consulta }) {
  const router = useRouter();
  const cfg = statusConfig[c.status];

  function handleClick() {
    const params = new URLSearchParams({
      id:           String(c.id),
      nome:         c.nome,
      especialidade: c.especialidade,
      data:         c.data,
      horario:      c.horario,
      modalidade:   c.modalidade,
      status:       c.status,
      avatar:       c.avatar,
    });
    router.push(`/painel/consultas/agendar?${params.toString()}`);
  }

  return (
    <div className="pro-cons-card-wrap" onClick={handleClick}>
      <Card
        borderWidth={1}
        animation="quick"
        backgroundColor="$color2"
        borderColor="$borderColor"
        borderRadius="$4"
        paddingHorizontal="$4"
        paddingVertical="$3"
        hoverStyle={{ backgroundColor: "$color3", borderColor: "$green8" }}
      >
        <XStack alignItems="center" gap="$3" flexWrap="wrap">
          {/* Horário */}
          <YStack alignItems="center" width={52} flexShrink={0}>
            <Text color="$color11" fontSize={13} fontWeight="bold">{c.horario}</Text>
          </YStack>
          <Separator vertical height={36} borderColor="$borderColor" />
          {/* Avatar */}
          <Avatar circular size="$4" backgroundColor="$color4" flexShrink={0}>
            <Avatar.Image src={c.avatar} />
            <Avatar.Fallback alignItems="center" justifyContent="center">
              <Text color="$color12" fontSize={14} fontWeight="bold">{c.nome[0]}</Text>
            </Avatar.Fallback>
          </Avatar>
          {/* Info */}
          <YStack flex={1} gap="$1" minWidth={140}>
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

          {/* Badge status + seta */}
          <XStack alignItems="center" gap="$2" flexShrink={0}>
            <XStack
              paddingHorizontal="$3"
              paddingVertical="$1"
              borderRadius="$10"
              borderWidth={1}
              alignItems="center"
              justifyContent="center"
              style={{ background: cfg.bg, borderColor: cfg.color + "44" }}
            >
              <Text fontSize={10} fontWeight="bold" style={{ color: cfg.color }}>{cfg.label}</Text>
            </XStack>
            <span className="pro-cons-arrow-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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

  // ── Date range filter
  const [dateFrom, setDateFrom] = useState("2026-04-22");
  const [dateTo,   setDateTo]   = useState("2026-05-22");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const dateRef = useRef<HTMLDivElement>(null);
  useOutsideClick(dateRef, useCallback(() => setShowDatePicker(false), []));

  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const headerMenuRef = useRef<HTMLDivElement>(null);
  useOutsideClick(headerMenuRef, useCallback(() => setHeaderMenuOpen(false), []));

  // ── Apply filters (sem filtro de status)
  const filtered = consultas.filter((c) => {
    if (c.status === "em_andamento") return false;
    if (dateFrom && c.dataISO < dateFrom) return false;
    if (dateTo   && c.dataISO > dateTo)   return false;
    return true;
  });

  // ── Date label helper
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
      <style>{PRO_CARD_STYLES}</style>
      <ScrollView flex={1} backgroundColor="$background" showsVerticalScrollIndicator={false}>
      <YStack padding="$4" $gtSm={{ padding: "$6" }} gap="$5" maxWidth={1200} margin="auto" width="100%">

        {/* ── Cabeçalho ── */}
        <XStack className="pro-page-header" flexWrap="wrap" justifyContent="space-between" alignItems="center" gap="$4">
          <YStack>
            <H1 color="$color12" size="$7" fontWeight="bold">Consultas</H1>
            <Text color="$color11" fontSize={14}>Gerencie seus agendamentos e acompanhe o status de cada consulta.</Text>
          </YStack>

          {/* Filtro de período + botão Nova Consulta */}
          <XStack gap="$3" flexWrap="wrap" alignItems="center">
            <div ref={dateRef} style={{ position: "relative" }}>
              <Button
                size="$3"
                backgroundColor="$color2"
                borderWidth={1}
                borderColor={showDatePicker ? "$green8" : "$borderColor"}
                hoverStyle={{ backgroundColor: "$color3", borderColor: "$green8" }}
                paddingHorizontal="$3"
                gap="$2"
                onPress={() => setShowDatePicker(v => !v)}
              >
                <span style={{ color: "#a1a1aa" }}><CalendarIcon /></span>
                <Text color="$color11" fontSize={12}>{fmtDate(dateFrom)} — {fmtDate(dateTo)}</Text>
                <span style={{ color: "#a1a1aa" }}><ChevronDown /></span>
              </Button>

              {showDatePicker && (
                <div style={dropdownStyle}>
                  <div style={{ marginBottom: 12 }}>
                    <label style={labelStyle}>Data inicial</label>
                    <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={inputStyle} />
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={labelStyle}>Data final</label>
                    <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={inputStyle} />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => { setDateFrom("2026-04-22"); setDateTo("2026-05-22"); }}
                      style={{ flex: 1, padding: "6px 0", borderRadius: 8, fontSize: 12, fontWeight: 600,
                        background: "transparent", border: "1px solid var(--borderColor, #333)",
                        color: "var(--color11, #a1a1aa)", cursor: "pointer" }}
                    >Resetar</button>
                    <button
                      onClick={() => setShowDatePicker(false)}
                      style={{ flex: 1, padding: "6px 0", borderRadius: 8, fontSize: 12, fontWeight: 600,
                        background: "#10b981", border: "none", color: "#fff", cursor: "pointer" }}
                    >Aplicar</button>
                  </div>
                </div>
              )}
            </div>

            <Button
              size="$3"
              backgroundColor="$green9"
              color="white"
              hoverStyle={{ backgroundColor: "$green10" }}
              fontWeight="bold"
              onPress={() => router.push("/painel/consultas/agendar")}
            >
              + Nova Consulta
            </Button>
          </XStack>
        </XStack>

        {/* ── Cards de Resumo ── */}
        <XStack className="pro-stat-grid" flexWrap="wrap" gap="$4">

          <YStack flex={1} minWidth={280} gap="$4">
            {/* Resumo do Período */}
            <Card borderWidth={1} backgroundColor="$color2" borderColor="$borderColor" borderRadius="$5" padding="$4">
              <Text color="$color11" fontSize={11} fontWeight="bold" letterSpacing={1} textTransform="uppercase" marginBottom="$3">
                Resumo do Período
              </Text>
              <XStack gap="$4" className="pro-resumo-inner">
                <YStack flex={1} gap="$2">
                  <Circle size="$3" backgroundColor="rgba(16,185,129,0.12)"><TrendingIcon /></Circle>
                  <Text color="$color11" fontSize={12}>Agendamentos</Text>
                  <Text color="$color12" fontSize={22} fontWeight="bold">142</Text>
                  <XStack alignItems="center" gap="$1">
                    <Circle size={6} backgroundColor="#10b981" />
                    <Text color="#10b981" fontSize={11}>+12% vs mês anterior</Text>
                  </XStack>
                </YStack>
                <Separator vertical borderColor="$borderColor" className="pro-resumo-sep" />
                <YStack flex={1} gap="$2">
                  <Circle size="$3" backgroundColor="rgba(16,185,129,0.12)"><MoneyIcon /></Circle>
                  <Text color="$color11" fontSize={12}>Valor Gerado</Text>
                  <Text color="$color12" fontSize={22} fontWeight="bold">R$8.400</Text>
                  <XStack alignItems="center" gap="$1">
                    <Circle size={6} backgroundColor="#10b981" />
                    <Text color="#10b981" fontSize={11}>+8% vs mês anterior</Text>
                  </XStack>
                </YStack>
              </XStack>
            </Card>

            {/* Em Andamento */}
            <Card borderWidth={1}
              backgroundColor="rgba(96,165,250,0.05)"
              borderColor="rgba(96,165,250,0.25)"
              borderRadius="$5"
              overflow="hidden"
              hoverStyle={{ backgroundColor: "rgba(96,165,250,0.08)", borderColor: "#60a5fa" }}
              cursor="pointer"
            >
              <YStack height={3} backgroundColor="#60a5fa" />
              <YStack padding="$4" gap="$3">
                <XStack justifyContent="space-between" alignItems="center">
                  <Text color="$color11" fontSize={11} fontWeight="bold" letterSpacing={1} textTransform="uppercase">Em Andamento</Text>
                  <XStack alignItems="center" gap="$1" paddingHorizontal="$2" paddingVertical="$1" borderRadius="$10" backgroundColor="rgba(96,165,250,0.15)">
                    <Circle size={6} backgroundColor="#60a5fa" style={{ boxShadow: "0 0 6px #60a5fa", animation: "pulse 2s infinite" }} />
                    <Text color="#60a5fa" fontSize={10} fontWeight="bold">Ao vivo</Text>
                  </XStack>
                </XStack>
                <XStack gap="$3" alignItems="center">
                  <Avatar circular size="$5" backgroundColor="$color4" borderWidth={2} borderColor="rgba(96,165,250,0.4)">
                    <Avatar.Image src={consultaEmAndamento.avatar} />
                  </Avatar>
                  <YStack gap="$1">
                    <Text color="$color12" fontSize={14} fontWeight="bold">{consultaEmAndamento.nome}</Text>
                    <Text color="$color11" fontSize={12}>{consultaEmAndamento.especialidade}</Text>
                    <XStack alignItems="center" gap="$1" marginTop={2}>
                      <span style={{ color: "#60a5fa" }}><ClockIcon /></span>
                      <Text color="#60a5fa" fontSize={12}>{consultaEmAndamento.horario}</Text>
                    </XStack>
                  </YStack>
                </XStack>
              </YStack>
            </Card>
          </YStack>

          {/* Visão Geral do Dia */}
          <Card cursor="pointer" animation="quick" flex={1}
            minWidth={280} borderWidth={1} backgroundColor="$color2" borderColor="$borderColor"
            borderRadius="$5" padding="$4" hoverStyle={{ backgroundColor: "$color3", borderColor: "$green8" }}
          >
            <Text color="$color11" fontSize={11} fontWeight="bold" letterSpacing={1} textTransform="uppercase" marginBottom="$3">
              Visão Geral do Dia
            </Text>
            <YStack gap="$3">
              {[
                { icon: "📅", label: "Total de Consultas", value: "12",  color: "$color12" },
                { icon: "✅", label: "Confirmadas",         value: "9",   color: "#10b981" },
                { icon: "⏳", label: "Pendentes",           value: "3",   color: "#facc15" },
                { icon: "⏱",  label: "Tempo Médio",         value: "48m", color: "#60a5fa" },
              ].map((item, i) => (
                <XStack key={i} justifyContent="space-between" alignItems="center"
                  paddingVertical="$2" paddingHorizontal="$3" borderRadius="$3"
                  backgroundColor="$background" borderWidth={1} borderColor="$borderColor" id={`day-item-${i}`}
                >
                  <XStack alignItems="center" gap="$2">
                    <Text fontSize={16}>{item.icon}</Text>
                    <Text color="$color11" fontSize={13}>{item.label}</Text>
                  </XStack>
                  <Text fontSize={16} fontWeight="bold" style={{ color: item.color as string }}>{item.value}</Text>
                </XStack>
              ))}
            </YStack>
          </Card>
        </XStack>

        {/* ── Lista de Consultas ── */}
        <YStack gap="$4">
          <XStack justifyContent="space-between" alignItems="center">
            <YStack gap="$1">
              <H2 color="$color12" size="$5" fontWeight="bold">Próximas Consultas</H2>
              <Text color="$color11" fontSize={12}>{filtered.length} consultas encontradas</Text>
            </YStack>
          </XStack>

          {/* Rows */}
          <YStack gap="$2">
            {filtered.length === 0 ? (
              <Card borderWidth={1} backgroundColor="$color2" borderColor="$borderColor"
                borderRadius="$5" padding="$8" alignItems="center"
              >
                <Text fontSize={32} marginBottom="$2">📭</Text>
                <Text color="$color11" fontSize={14}>Nenhuma consulta encontrada no período.</Text>
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
