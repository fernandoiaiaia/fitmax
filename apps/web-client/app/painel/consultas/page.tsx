"use client";

import { useState } from "react";
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

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Mock Data ────────────────────────────────────────────────────────────────

const consultaEmAndamento = {
  nome: "Dra. Letícia Marques",
  especialidade: "Endocrinologista",
  horario: "14:30 — 15:30",
  avatar: "https://picsum.photos/200/200?random=50",
};

const proximasConsultas: Consulta[] = [
  {
    id: 1,
    horario: "09:00",
    nome: "Dr. Roberto Alves",
    especialidade: "Ortopedia",
    modalidade: "Presencial",
    data: "Hoje, 22/04",
    avatar: "https://picsum.photos/200/200?random=21",
    status: "agendada",
  },
  {
    id: 2,
    horario: "11:00",
    nome: "Dra. Ana Souza",
    especialidade: "Nutrição",
    modalidade: "Online",
    data: "Hoje, 22/04",
    avatar: "https://picsum.photos/200/200?random=23",
    status: "pendente",
  },
  {
    id: 3,
    horario: "14:30",
    nome: "Dra. Letícia Marques",
    especialidade: "Endocrinologia",
    modalidade: "Presencial",
    data: "Hoje, 22/04",
    avatar: "https://picsum.photos/200/200?random=50",
    status: "em_andamento",
  },
  {
    id: 4,
    horario: "09:00",
    nome: "Dr. Vinícius Almeida",
    especialidade: "Nutrologia",
    modalidade: "Online",
    data: "Amanhã, 23/04",
    avatar: "https://picsum.photos/200/200?random=60",
    status: "a_confirmar",
  },
  {
    id: 5,
    horario: "16:00",
    nome: "Marcelo Strong",
    especialidade: "Fisioterapia",
    modalidade: "Presencial",
    data: "24/04",
    avatar: "https://picsum.photos/200/200?random=52",
    status: "agendada",
  },
  {
    id: 6,
    horario: "10:30",
    nome: "Bruno Silva",
    especialidade: "Medicina Esportiva",
    modalidade: "Online",
    data: "25/04",
    avatar: "https://picsum.photos/200/200?random=25",
    status: "pendente",
  },
];

// ─── Status Config ────────────────────────────────────────────────────────────

const statusConfig: Record<
  ConsultaStatus,
  {
    label: string;
    bg: string;
    color: string;
    border: string;
    borderWidth: number;
    actionLabel?: string;
    actionBg?: string;
    actionColor?: string;
  }
> = {
  a_confirmar: {
    label: "A CONFIRMAR",
    bg: "transparent",
    color: "#a1a1aa",
    border: "#3f3f46",
    borderWidth: 1,
  },
  pendente: {
    label: "PENDENTE",
    bg: "rgba(234,179,8,0.15)",
    color: "#facc15",
    border: "rgba(234,179,8,0.3)",
    borderWidth: 1,
    actionLabel: "Pagar",
    actionBg: "#facc15",
    actionColor: "#0a0a0a",
  },
  agendada: {
    label: "AGENDADA",
    bg: "rgba(16,185,129,0.15)",
    color: "#10b981",
    border: "rgba(16,185,129,0.3)",
    borderWidth: 1,
    actionLabel: "Reagendar",
    actionBg: "rgba(16,185,129,0.2)",
    actionColor: "#10b981",
  },
  em_andamento: {
    label: "EM ANDAMENTO",
    bg: "rgba(59,130,246,0.15)",
    color: "#60a5fa",
    border: "rgba(59,130,246,0.3)",
    borderWidth: 1,
  },
};

// ─── Icon Components ──────────────────────────────────────────────────────────

function IconCalendar() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconFilter() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="8" y1="12" x2="16" y2="12" />
      <line x1="12" y1="18" x2="12" y2="18" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconMoreVertical() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  );
}

function IconTrendingUp() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function IconDollar() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ConsultaStatus }) {
  const cfg = statusConfig[status];
  return (
    <YStack
      paddingHorizontal={10}
      paddingVertical={4}
      borderRadius={999}
      borderWidth={cfg.borderWidth}
      style={{
        backgroundColor: cfg.bg,
        borderColor: cfg.border,
      }}
    >
      <Text fontSize={10} fontWeight="700" letterSpacing={0.6} style={{ color: cfg.color }}>
        {cfg.label}
      </Text>
    </YStack>
  );
}

// ─── Consulta Card Row ────────────────────────────────────────────────────────

function ConsultaRow({ consulta }: { consulta: Consulta }) {
  const cfg = statusConfig[consulta.status];
  const isAndamento = consulta.status === "em_andamento";

  return (
    <XStack
      alignItems="center"
      gap="$3"
      paddingVertical="$3"
      paddingHorizontal="$4"
      borderRadius="$5"
      borderWidth={1}
      borderColor={isAndamento ? "rgba(59,130,246,0.25)" : "$borderColor"}
      backgroundColor={isAndamento ? "rgba(59,130,246,0.05)" : "$color2"}
      style={{ transition: "background 0.15s" }}
    >
      {/* Horário */}
      <YStack alignItems="center" minWidth={44}>
        <Text color="$color11" fontSize={11} fontWeight="600">
          {consulta.horario}
        </Text>
        {isAndamento && (
          <Circle size={6} backgroundColor="#60a5fa" marginTop={3} />
        )}
      </YStack>

      <Separator vertical borderColor="$borderColor" height={36} />

      {/* Avatar */}
      <Avatar circular size="$4" backgroundColor="$color4">
        <Avatar.Image src={consulta.avatar} />
        <Avatar.Fallback alignItems="center" justifyContent="center">
          <Text color="$color12" fontSize={14} fontWeight="bold">
            {consulta.nome[0]}
          </Text>
        </Avatar.Fallback>
      </Avatar>

      {/* Info */}
      <YStack flex={1} gap={2}>
        <Text color="$color12" fontSize={14} fontWeight="700" numberOfLines={1}>
          {consulta.nome}
        </Text>
        <Text color="$color11" fontSize={12} numberOfLines={1}>
          {consulta.especialidade} · {consulta.modalidade}
        </Text>
        <XStack alignItems="center" gap="$1" marginTop={2}>
          <YStack style={{ color: "#71717a" }}>
            <IconClock />
          </YStack>
          <Text color="$color11" fontSize={11}>
            {consulta.data}
          </Text>
        </XStack>
      </YStack>

      {/* Status + Action */}
      <XStack alignItems="center" gap="$2" flexShrink={0}>
        <StatusBadge status={consulta.status} />

        {cfg.actionLabel && (
          <Button
            size="$2"
            borderRadius="$10"
            paddingHorizontal="$3"
            style={{
              backgroundColor: cfg.actionBg,
              borderWidth: 0,
            }}
            hoverStyle={{ opacity: 0.85 }}
            pressStyle={{ opacity: 0.7 }}
          >
            <Text fontSize={12} fontWeight="700" style={{ color: cfg.actionColor }}>
              {cfg.actionLabel}
            </Text>
          </Button>
        )}

        <Button
          size="$2"
          circular
          chromeless
          paddingHorizontal="$1"
          style={{ color: "#71717a" }}
          hoverStyle={{ backgroundColor: "$color3" }}
        >
          <IconMoreVertical />
        </Button>
      </XStack>
    </XStack>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const statusFilters = ["Todas", "Agendadas", "Pendentes", "A Confirmar", "Em Andamento"];

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
    <ScrollView flex={1} backgroundColor="$background">
      <YStack
        padding="$4"
        gap="$5"
        maxWidth={1100}
        marginHorizontal="auto"
        width="100%"
        paddingBottom="$8"
      >
        {/* ── Cabeçalho ───────────────────────────────────────────────── */}
        <YStack gap="$4">
          <XStack justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap="$3">
            <YStack gap="$1">
              <H2 color="$color12" size="$7" fontWeight="800" letterSpacing={-0.5}>
                Consultas
              </H2>
              <Text color="$color11" fontSize={14}>
                Gerencie seus agendamentos e acompanhe o status de cada consulta
              </Text>
            </YStack>

            {/* Filtro de Período */}
            <XStack gap="$2">
              <XStack
                alignItems="center"
                gap="$2"
                paddingHorizontal="$3"
                paddingVertical="$2"
                borderRadius="$4"
                borderWidth={1}
                borderColor="$borderColor"
                backgroundColor="$color2"
                cursor="pointer"
                hoverStyle={{ borderColor: "$green8" }}
              >
                <YStack style={{ color: "#a1a1aa" }}>
                  <IconCalendar />
                </YStack>
                <Text color="$color11" fontSize={13}>
                  {dateRange}
                </Text>
                <YStack style={{ color: "#a1a1aa" }}>
                  <IconFilter />
                </YStack>
              </XStack>

              {/* Filtro de status dropdown */}
              <XStack
                alignItems="center"
                gap="$2"
                paddingHorizontal="$3"
                paddingVertical="$2"
                borderRadius="$4"
                borderWidth={1}
                borderColor="$borderColor"
                backgroundColor="$color2"
                cursor="pointer"
                hoverStyle={{ borderColor: "$green8" }}
              >
                <Text color="$color11" fontSize={13}>
                  Todas
                </Text>
                <YStack style={{ color: "#a1a1aa" }}>
                  <IconFilter />
                </YStack>
              </XStack>
            </XStack>
          </XStack>
        </YStack>

        {/* ── Cards de Resumo + Em Andamento + Visão Geral ────────────── */}
        <XStack gap="$4" flexWrap="wrap" $gtMd={{ flexWrap: "nowrap" }}>

          {/* Bloco esquerdo: Resumo + Em Andamento empilhados */}
          <YStack gap="$4" flex={1} minWidth={280}>

            {/* Card: Resumo */}
            <Card
              borderWidth={1}
              borderColor="$borderColor"
              backgroundColor="$color2"
              borderRadius="$6"
              padding="$4"
              gap="$4"
            >
              <XStack justifyContent="space-between" alignItems="center" marginBottom="$1">
                <Text color="$color11" fontSize={13} fontWeight="600" textTransform="uppercase" letterSpacing={0.5}>
                  Resumo do Período
                </Text>
              </XStack>

              <XStack gap="$4">
                {/* Agendamentos por mês */}
                <YStack flex={1} gap="$2" padding="$3" borderRadius="$4" backgroundColor="$background" borderWidth={1} borderColor="$borderColor">
                  <XStack gap="$2" alignItems="center">
                    <Circle size={32} backgroundColor="rgba(16,185,129,0.12)">
                      <YStack style={{ color: "#10b981" }}>
                        <IconTrendingUp />
                      </YStack>
                    </Circle>
                    <Text color="$color11" fontSize={12}>Agendamentos</Text>
                  </XStack>
                  <Text color="$color12" fontSize={32} fontWeight="800" lineHeight={36}>
                    142
                  </Text>
                  <Text color="$green9" fontSize={11} fontWeight="600">
                    +12% vs mês anterior
                  </Text>
                </YStack>

                {/* Valor total */}
                <YStack flex={1} gap="$2" padding="$3" borderRadius="$4" backgroundColor="$background" borderWidth={1} borderColor="$borderColor">
                  <XStack gap="$2" alignItems="center">
                    <Circle size={32} backgroundColor="rgba(16,185,129,0.12)">
                      <YStack style={{ color: "#10b981" }}>
                        <IconDollar />
                      </YStack>
                    </Circle>
                    <Text color="$color11" fontSize={12}>Valor Gerado</Text>
                  </XStack>
                  <Text color="$color12" fontSize={28} fontWeight="800" lineHeight={32}>
                    R$1.000
                  </Text>
                  <Text color="$green9" fontSize={11} fontWeight="600">
                    +8% vs mês anterior
                  </Text>
                </YStack>
              </XStack>
            </Card>

            {/* Card: Em andamento */}
            <Card
              borderWidth={1}
              borderColor="rgba(16,185,129,0.3)"
              borderRadius="$6"
              overflow="hidden"
              style={{
                background: "linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(16,185,129,0.04) 100%)",
                backgroundColor: "#141414",
              }}
            >
              {/* Subtle glow bar top */}
              <YStack height={2} style={{ background: "linear-gradient(to right, #10b981, transparent)" }} />

              <YStack padding="$4" gap="$3">
                <XStack justifyContent="space-between" alignItems="center">
                  <Text color="$color11" fontSize={12} fontWeight="600" textTransform="uppercase" letterSpacing={0.5}>
                    Em Andamento
                  </Text>
                  <XStack alignItems="center" gap="$2" paddingHorizontal="$2" paddingVertical={4} borderRadius={999} backgroundColor="rgba(16,185,129,0.15)">
                    <Circle size={7} backgroundColor="#10b981" style={{ boxShadow: "0 0 6px #10b981" }} />
                    <Text color="#10b981" fontSize={11} fontWeight="700">
                      Ao vivo
                    </Text>
                  </XStack>
                </XStack>

                <XStack alignItems="center" gap="$3">
                  <Avatar circular size="$6" borderWidth={2} borderColor="#10b981">
                    <Avatar.Image src={consultaEmAndamento.avatar} />
                    <Avatar.Fallback alignItems="center" justifyContent="center" backgroundColor="$color4">
                      <Text color="$color12" fontWeight="bold" fontSize={20}>L</Text>
                    </Avatar.Fallback>
                  </Avatar>

                  <YStack flex={1} gap={3}>
                    <Text color="$color12" fontSize={16} fontWeight="800">
                      {consultaEmAndamento.nome}
                    </Text>
                    <Text color="$color11" fontSize={13}>
                      {consultaEmAndamento.especialidade}
                    </Text>
                    <XStack alignItems="center" gap="$1" marginTop={2}>
                      <YStack style={{ color: "#10b981" }}>
                        <IconClock />
                      </YStack>
                      <Text color="#10b981" fontSize={12} fontWeight="600">
                        {consultaEmAndamento.horario}
                      </Text>
                    </XStack>
                  </YStack>
                </XStack>
              </YStack>
            </Card>
          </YStack>

          {/* Card: Visão Geral do Dia */}
          <Card
            flex={1}
            minWidth={220}
            $gtMd={{ maxWidth: 260 }}
            borderWidth={1}
            borderColor="$borderColor"
            backgroundColor="$color2"
            borderRadius="$6"
            padding="$4"
          >
            <Text color="$color11" fontSize={12} fontWeight="600" textTransform="uppercase" letterSpacing={0.5} marginBottom="$4">
              Visão Geral do Dia
            </Text>

            <YStack gap="$3">
              {[
                { label: "Total de Consultas", value: "8", color: "#fafafa", icon: "📅" },
                { label: "Confirmadas", value: "5", color: "#10b981", icon: "✅" },
                { label: "Pendentes", value: "2", color: "#facc15", icon: "⏳" },
                { label: "Tempo Médio", value: "52min", color: "#60a5fa", icon: "⏱" },
              ].map((item, i) => (
                <XStack
                  key={i}
                  alignItems="center"
                  justifyContent="space-between"
                  paddingVertical="$3"
                  paddingHorizontal="$3"
                  borderRadius="$4"
                  backgroundColor="$background"
                  borderWidth={1}
                  borderColor="$borderColor"
                >
                  <XStack alignItems="center" gap="$2">
                    <Text fontSize={16}>{item.icon}</Text>
                    <Text color="$color11" fontSize={13}>
                      {item.label}
                    </Text>
                  </XStack>
                  <Text fontWeight="800" fontSize={18} style={{ color: item.color }}>
                    {item.value}
                  </Text>
                </XStack>
              ))}
            </YStack>
          </Card>
        </XStack>

        {/* ── Seção: Próximas Consultas ────────────────────────────────── */}
        <YStack gap="$4">
          <XStack justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="$3">
            <YStack gap={2}>
              <H2 color="$color12" size="$5" fontWeight="800">
                Próximas Consultas
              </H2>
              <Text color="$color11" fontSize={13}>
                {filteredConsultas.length} consultas encontradas
              </Text>
            </YStack>
          </XStack>

          {/* Filtros de Status */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <XStack gap="$2" paddingBottom="$1">
              {statusFilters.map((filter) => {
                const isActive = statusFilter === filter;
                return (
                  <Button
                    key={filter}
                    size="$3"
                    borderRadius="$10"
                    borderWidth={1}
                    borderColor={isActive ? "transparent" : "$borderColor"}
                    backgroundColor={isActive ? "#10b981" : "transparent"}
                    onPress={() => setStatusFilter(filter)}
                    hoverStyle={!isActive ? { borderColor: "$green8", backgroundColor: "rgba(16,185,129,0.06)" } : { opacity: 0.9 }}
                    pressStyle={{ opacity: 0.75 }}
                    paddingHorizontal="$4"
                  >
                    <Text fontWeight={isActive ? "700" : "500"} fontSize={13} color={isActive ? "white" : "$color11"}>
                      {filter}
                    </Text>
                  </Button>
                );
              })}
            </XStack>
          </ScrollView>

          {/* Lista */}
          <YStack gap="$2">
            {filteredConsultas.length === 0 ? (
              <YStack
                alignItems="center"
                justifyContent="center"
                paddingVertical="$10"
                gap="$3"
                borderRadius="$5"
                borderWidth={1}
                borderColor="$borderColor"
                backgroundColor="$color2"
              >
                <Text fontSize={32}>📭</Text>
                <Text color="$color11" fontSize={14} textAlign="center">
                  Nenhuma consulta encontrada para este filtro.
                </Text>
              </YStack>
            ) : (
              filteredConsultas.map((consulta) => (
                <ConsultaRow key={consulta.id} consulta={consulta} />
              ))
            )}
          </YStack>
        </YStack>
      </YStack>
    </ScrollView>
  );
}
