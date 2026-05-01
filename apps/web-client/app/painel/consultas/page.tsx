//@ts-nocheck
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

// ─── Types ───────────────────────────────────────────────────────────────────

type ConsultaStatus = "agendada" | "pendente" | "a_confirmar" | "em_andamento";

interface Consulta {
  id: number;
  horario: string;
  nome: string;
  especialidade: string;
  modalidade: "Presencial" | "Online";
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

const consultas: Consulta[] = [
  { id: 1, horario: "09:00", nome: "Dr. Roberto Alves",     especialidade: "Ortopedia",         modalidade: "Presencial", data: "Hoje, 22/04",   avatar: "https://picsum.photos/200/200?random=21", status: "agendada" },
  { id: 2, horario: "11:00", nome: "Dra. Ana Souza",        especialidade: "Nutrição",           modalidade: "Online",     data: "Hoje, 22/04",   avatar: "https://picsum.photos/200/200?random=23", status: "pendente" },
  { id: 3, horario: "14:30", nome: "Dra. Letícia Marques",  especialidade: "Endocrinologia",     modalidade: "Presencial", data: "Hoje, 22/04",   avatar: "https://picsum.photos/200/200?random=50", status: "em_andamento" },
  { id: 4, horario: "09:00", nome: "Dr. Vinícius Almeida",  especialidade: "Nutrologia",         modalidade: "Online",     data: "Amanhã, 23/04", avatar: "https://picsum.photos/200/200?random=60", status: "a_confirmar" },
  { id: 5, horario: "16:00", nome: "Marcelo Strong",        especialidade: "Fisioterapia",       modalidade: "Presencial", data: "24/04",         avatar: "https://picsum.photos/200/200?random=52", status: "agendada" },
  { id: 6, horario: "10:30", nome: "Bruno Silva",           especialidade: "Medicina Esportiva", modalidade: "Online",     data: "25/04",         avatar: "https://picsum.photos/200/200?random=25", status: "pendente" },
  { id: 7, horario: "13:00", nome: "Dra. Camila Nery",      especialidade: "Personal Trainer",   modalidade: "Presencial", data: "26/04",         avatar: "https://picsum.photos/200/200?random=22", status: "agendada" },
];

// ─── Status Config ────────────────────────────────────────────────────────────

const statusConfig: Record<
  ConsultaStatus,
  { label: string; bg: string; color: string; dotColor: string; actionLabel?: string }
> = {
  agendada:     { label: "AGENDADA",     bg: "rgba(16,185,129,0.12)",  color: "#10b981", dotColor: "#10b981",  actionLabel: "Reagendar" },
  pendente:     { label: "PENDENTE",     bg: "rgba(234,179,8,0.12)",   color: "#facc15", dotColor: "#facc15",  actionLabel: "Pagar" },
  a_confirmar:  { label: "A CONFIRMAR",  bg: "rgba(161,161,170,0.1)",  color: "#a1a1aa", dotColor: "#a1a1aa" },
  em_andamento: { label: "EM ANDAMENTO", bg: "rgba(96,165,250,0.12)",  color: "#60a5fa", dotColor: "#60a5fa" },
};

const STATUS_FILTERS = ["Todas", "Agendadas", "Pendentes", "A Confirmar", "Em Andamento"];

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

const DotsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="5" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="19" r="1" fill="currentColor" />
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

const FilterIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="12" y1="18" x2="12" y2="18" />
  </svg>
);

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

// ─── Consulta Row Card ────────────────────────────────────────────────────────

function ConsultaRow({ c }: { c: Consulta }) {
  const cfg = statusConfig[c.status];
  const isAndamento = c.status === "em_andamento";

  return (
    <Card borderWidth={1}
      backgroundColor={isAndamento ? "rgba(96,165,250,0.05)" : "$color2"}
      borderColor={isAndamento ? "rgba(96,165,250,0.25)" : "$borderColor"}
      borderRadius="$4"
      paddingHorizontal="$4"
      paddingVertical="$3"
      hoverStyle={{ backgroundColor: "$color3", borderColor: isAndamento ? "#60a5fa" : "$green8" }}
      cursor="pointer"
     
    >
      <XStack alignItems="center" gap="$3">

        {/* Horário */}
        <YStack alignItems="center" width={52} flexShrink={0}>
          <Text color={isAndamento ? "#60a5fa" : "$color11"} fontSize={13} fontWeight="bold">
            {c.horario}
          </Text>
          {isAndamento && (
            <Circle size={6} backgroundColor="#60a5fa" marginTop={4} style={{ boxShadow: "0 0 6px #60a5fa" }} />
          )}
        </YStack>

        <Separator vertical height={36} borderColor="$borderColor" />

        {/* Avatar */}
        <Avatar circular size="$4" backgroundColor="$color4" flexShrink={0}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <Avatar.Image src={c.avatar} />
          <Avatar.Fallback alignItems="center" justifyContent="center">
            <Text color="$color12" fontSize={14} fontWeight="bold">{c.nome[0]}</Text>
          </Avatar.Fallback>
        </Avatar>

        {/* Info */}
        <YStack flex={1} gap="$1">
          <Text color="$color12" fontSize={14} fontWeight="bold" numberOfLines={1}>
            {c.nome}
          </Text>
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

        {/* Status badge + action */}
        <XStack alignItems="center" gap="$2" flexShrink={0}>
          <XStack
            paddingHorizontal="$3"
            paddingVertical="$1"
            borderRadius="$10"
            borderWidth={1}
            alignItems="center"
            justifyContent="center"
            style={{
              background: cfg.bg,
              borderColor: cfg.color + "44",
            }}
          >
            <Text fontSize={10} fontWeight="bold" style={{ color: cfg.color }}>
              {cfg.label}
            </Text>
          </XStack>

          {cfg.actionLabel && (
            <Button
              size="$2"
              borderRadius="$10"
              borderWidth={1}
              paddingHorizontal="$3"
              style={{
                background: cfg.bg,
                borderColor: cfg.color + "55",
                color: cfg.color,
                fontSize: 11,
                fontWeight: "600",
                height: 28,
              }}
            >
              {cfg.actionLabel}
            </Button>
          )}

          <Button
            size="$2"
            circular
            chromeless
            icon={<span style={{ color: "#71717a" }}><DotsIcon /></span>}
            hoverStyle={{ backgroundColor: "$color4" }}
          />
        </XStack>
      </XStack>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ConsultasPage() {
  const [filter, setFilter] = useState("Todas");

  const filtered = consultas.filter((c) => {
    if (filter === "Todas")        return true;
    if (filter === "Agendadas")    return c.status === "agendada";
    if (filter === "Pendentes")    return c.status === "pendente";
    if (filter === "A Confirmar")  return c.status === "a_confirmar";
    if (filter === "Em Andamento") return c.status === "em_andamento";
    return true;
  });

  return (
    <ScrollView flex={1} backgroundColor="$background" showsVerticalScrollIndicator={false}>
      <YStack
        padding="$4"
        $gtSm={{ padding: "$6" }}
        gap="$5"
        maxWidth={1100}
        marginHorizontal="auto"
        width="100%"
      >

        {/* ── Cabeçalho ── */}
        <XStack justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap="$3">
          <YStack gap="$1">
            <H2 color="$color12" size="$6" fontWeight="bold">Consultas</H2>
            <Text color="$color11" fontSize={14}>
              Gerencie seus agendamentos e acompanhe o status de cada consulta
            </Text>
          </YStack>

          <XStack gap="$2" flexWrap="wrap" alignItems="center">
            {/* Filtro período */}
            <Button
              size="$3"
              borderRadius="$4"
              borderWidth={1}
              borderColor="$borderColor"
              backgroundColor="$color2"
              hoverStyle={{ backgroundColor: "$color3" }}
              paddingHorizontal="$3"
              gap="$2"
              id="btn-filtro-periodo"
            >
              <span style={{ color: "#a1a1aa" }}><CalendarIcon /></span>
              <Text color="$color11" fontSize={12}>22/04/2026 — 22/05/2026</Text>
              <span style={{ color: "#a1a1aa" }}><FilterIcon /></span>
            </Button>

            {/* Filtrar por status */}
            <Button
              size="$3"
              borderRadius="$4"
              borderWidth={1}
              borderColor="$borderColor"
              backgroundColor="$color2"
              hoverStyle={{ backgroundColor: "$color3" }}
              paddingHorizontal="$3"
              gap="$2"
              id="btn-filtro-status"
            >
              <Text color="$color11" fontSize={12}>Filtrar por status</Text>
              <span style={{ color: "#a1a1aa" }}><FilterIcon /></span>
            </Button>

            {/* Nova consulta */}
            <Button
              size="$3"
              borderRadius="$4"
              backgroundColor="$green9"
              hoverStyle={{ backgroundColor: "$green10" }}
              paddingHorizontal="$4"
              gap="$2"
              id="btn-nova-consulta"
            >
              <span style={{ color: "#fff" }}><PlusIcon /></span>
              <Text color="white" fontSize={13} fontWeight="bold">Nova Consulta</Text>
            </Button>
          </XStack>
        </XStack>

        {/* ── Cards de Resumo ── */}
        <XStack gap="$4" flexWrap="wrap" $gtSm={{ flexWrap: "nowrap" }}>

          {/* Bloco esquerdo: Resumo + Em Andamento */}
          <YStack gap="$4" flex={1} minWidth={260}>

            {/* Resumo do Período */}
            <Card borderWidth={1}
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
              <XStack gap="$4">
                {/* Consultas */}
                <YStack flex={1} gap="$2">
                  <Circle size="$3" backgroundColor="rgba(16,185,129,0.12)">
                    <TrendingIcon />
                  </Circle>
                  <Text color="$color11" fontSize={12}>Consultas</Text>
                  <Text color="$color12" fontSize={22} fontWeight="bold">7</Text>
                  <XStack alignItems="center" gap="$1">
                    <Circle size={6} backgroundColor="#10b981" />
                    <Text color="#10b981" fontSize={11}>+2 vs mês anterior</Text>
                  </XStack>
                </YStack>

                <Separator vertical borderColor="$borderColor" />

                {/* Valor Investido */}
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

            {/* Em Andamento */}
            <Card borderWidth={1}
              backgroundColor="rgba(96,165,250,0.05)"
              borderColor="rgba(96,165,250,0.25)"
              borderRadius="$5"
              overflow="hidden"
              hoverStyle={{ backgroundColor: "rgba(96,165,250,0.08)", borderColor: "#60a5fa" }}
              cursor="pointer"
             
            >
              {/* Accent bar */}
              <YStack height={3} backgroundColor="#60a5fa" />
              <YStack padding="$4" gap="$3">
                <XStack justifyContent="space-between" alignItems="center">
                  <Text color="$color11" fontSize={11} fontWeight="bold" letterSpacing={1} textTransform="uppercase">
                    Em Andamento
                  </Text>
                  <XStack
                    alignItems="center"
                    gap="$1"
                    paddingHorizontal="$2"
                    paddingVertical="$1"
                    borderRadius="$10"
                    backgroundColor="rgba(96,165,250,0.15)"
                  >
                    <Circle
                      size={6}
                      backgroundColor="#60a5fa"
                      style={{ boxShadow: "0 0 6px #60a5fa", animation: "pulse 2s infinite" }}
                    />
                    <Text color="#60a5fa" fontSize={10} fontWeight="bold">Ao vivo</Text>
                  </XStack>
                </XStack>

                <XStack gap="$3" alignItems="center">
                  <Avatar circular size="$5" backgroundColor="$color4" borderWidth={2} borderColor="rgba(96,165,250,0.4)">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <Avatar.Image src={consultaEmAndamento.avatar} />
                    <Avatar.Fallback alignItems="center" justifyContent="center">
                      <Text color="$color12" fontSize={16} fontWeight="bold">L</Text>
                    </Avatar.Fallback>
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
          <Card flex={1}
            minWidth={220}
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

          {/* Filtros */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <XStack gap="$2" paddingBottom="$1">
              {STATUS_FILTERS.map((f) => {
                const isActive = filter === f;
                return (
                  <Button
                    key={f}
                    size="$3"
                    borderRadius="$10"
                    borderWidth={1}
                    borderColor={isActive ? "transparent" : "$borderColor"}
                    backgroundColor={isActive ? "$color12" : "transparent"}
                    onPress={() => setFilter(f)}
                    hoverStyle={{ opacity: 0.8 }}
                    paddingHorizontal="$4"
                    id={`filter-${f.toLowerCase().replace(/\s/g, "-")}`}
                  >
                    <Text fontWeight={isActive ? "bold" : "500"} color={isActive ? "$background" : "$color12"} fontSize={13}>
                      {f}
                    </Text>
                  </Button>
                );
              })}
            </XStack>
          </ScrollView>

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
  );
}
