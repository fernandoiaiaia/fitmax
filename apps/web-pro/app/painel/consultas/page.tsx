//@ts-nocheck
"use client";

import { useState } from "react";
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
  { id: 1, horario: "09:00", nome: "Fernanda Lima", especialidade: "Cardiologia", modalidade: "Presencial", data: "Hoje, 23/04", avatar: "https://picsum.photos/200/200?random=41", status: "agendada" },
  { id: 2, horario: "11:00", nome: "Guilherme Augusto", especialidade: "Cardiologia", modalidade: "Presencial", data: "Hoje, 23/04", avatar: "https://picsum.photos/200/200?random=30", status: "em_andamento" },
  { id: 3, horario: "13:00", nome: "Mariana Ferreira", especialidade: "Cardiologia", modalidade: "Online", data: "Hoje, 23/04", avatar: "https://picsum.photos/200/200?random=31", status: "pendente" },
  { id: 4, horario: "15:30", nome: "Ricardo Nunes", especialidade: "Check-up", modalidade: "Presencial", data: "Hoje, 23/04", avatar: "https://picsum.photos/200/200?random=45", status: "a_confirmar" },
  { id: 5, horario: "09:00", nome: "Lucas Mendes", especialidade: "Check-up", modalidade: "Presencial", data: "Amanhã, 24/04", avatar: "https://picsum.photos/200/200?random=32", status: "agendada" },
];

// ─── Status Config ─────────────────────────────────────────────────────────

const statusConfig: Record<ConsultaStatus, { label: string; bg: string; color: string; border: string; actionLabel?: string }> = {
  agendada:    { label: "AGENDADA",    bg: "rgba(16,185,129,0.12)",  color: "#10b981", border: "rgba(16,185,129,0.3)",  actionLabel: "Reagendar" },
  pendente:    { label: "PENDENTE",    bg: "rgba(234,179,8,0.12)",   color: "#facc15", border: "rgba(234,179,8,0.3)",   actionLabel: "Confirmar" },
  a_confirmar: { label: "A CONFIRMAR", bg: "transparent",             color: "#a1a1aa", border: "#3f3f46" },
  em_andamento:{ label: "EM ANDAMENTO",bg: "rgba(96,165,250,0.12)",  color: "#60a5fa", border: "rgba(96,165,250,0.3)" },
};

const STATUS_FILTERS = ["Todas", "Agendadas", "Pendentes", "A Confirmar", "Em Andamento"];

// ─── Icons ────────────────────────────────────────────────────────────────────

const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
);
const ClockIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
);
const DotsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="19" r="1" fill="currentColor" /></svg>
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

// ─── Row de consulta (Refatorado para Tamagui) ──────────────────────────────────────────────────────────

function ConsultaRow({ c }: { c: Consulta }) {
  const cfg = statusConfig[c.status];
  const isAndamento = c.status === "em_andamento";

  return (
    <Card cursor="pointer" animation="quick" borderWidth={1}
      backgroundColor={isAndamento ? "rgba(96,165,250,0.05)" : "$color2"}
      borderColor={isAndamento ? "rgba(96,165,250,0.3)" : "$borderColor"}
      borderRadius="$3"
      padding="$3"
      hoverStyle={{ backgroundColor: isAndamento ? "rgba(96,165,250,0.08)" : "$color3", borderColor: isAndamento ? "#60a5fa" : "$green8" }}
    >
      <XStack alignItems="center" gap="$3" flexWrap="wrap">
        {/* Horário */}
        <XStack width={60} justifyContent="center" alignItems="center" gap="$1">
          <Text color={isAndamento ? "#60a5fa" : "$color12"} fontWeight="bold" fontSize={14}>
            {c.horario}
          </Text>
          {isAndamento && (
             <Circle size={6} backgroundColor="#60a5fa" style={{ boxShadow: "0 0 6px #60a5fa", animation: "pulse 2s infinite" }} />
          )}
        </XStack>

        <Separator vertical borderColor="$borderColor" height={30} $sm={{ display: 'none' }} />

        {/* Avatar e Info Principal */}
        <XStack flex={1} minWidth={200} alignItems="center" gap="$3">
          <Avatar circular size="$4" backgroundColor="$color4" borderWidth={1} borderColor={isAndamento ? "rgba(96,165,250,0.5)" : "$borderColor"}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <Avatar.Image src={c.avatar} />
            <Avatar.Fallback alignItems="center" justifyContent="center">
              <Text color="$color12" fontSize={14} fontWeight="bold">{c.nome.charAt(0)}</Text>
            </Avatar.Fallback>
          </Avatar>
          <YStack flex={1}>
            <Text color="$color12" fontSize={14} fontWeight="bold" numberOfLines={1}>{c.nome}</Text>
            <Text color="$color11" fontSize={12} numberOfLines={1}>{c.especialidade} · {c.modalidade}</Text>
            <XStack alignItems="center" gap="$1" marginTop={2} $gtSm={{ display: 'none' }}>
               <span style={{ color: "#a1a1aa" }}><ClockIcon /></span>
               <Text color="$color11" fontSize={11}>{c.data}</Text>
            </XStack>
          </YStack>
        </XStack>

        {/* Data (Desktop apenas) */}
        <XStack width={100} alignItems="center" gap="$2" $sm={{ display: 'none' }}>
           <span style={{ color: "#a1a1aa" }}><ClockIcon /></span>
           <Text color="$color11" fontSize={12}>{c.data}</Text>
        </XStack>

        {/* Ações e Status */}
        <XStack gap="$2" alignItems="center" justifyContent="flex-end" minWidth={180}>
          <XStack
            alignItems="center"
            justifyContent="center"
            paddingHorizontal="$2"
            paddingVertical="$1"
            borderRadius="$10"
            borderWidth={1}
            backgroundColor={cfg.bg}
            borderColor={cfg.border}
          >
            <Text color={cfg.color} fontSize={10} fontWeight="bold">{cfg.label}</Text>
          </XStack>

          {cfg.actionLabel && (
            <Button
               size="$2"
               backgroundColor={cfg.bg}
               borderColor={cfg.border}
               borderWidth={1}
               color={cfg.color}
               hoverStyle={{ opacity: 0.8 }}
               $sm={{ display: 'none' }}
            >
              {cfg.actionLabel}
            </Button>
          )}

          <Button size="$2" circular chromeless icon={<DotsIcon />} />
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
      <YStack padding="$4" $gtSm={{ padding: "$6" }} gap="$5" maxWidth={1200} margin="auto" width="100%">
        
        {/* ── Cabeçalho ── */}
        <XStack flexWrap="wrap" justifyContent="space-between" alignItems="center" gap="$4">
          <YStack>
            <H1 color="$color12" size="$7" fontWeight="bold">Consultas</H1>
            <Text color="$color11" fontSize={14}>Gerencie seus agendamentos e acompanhe o status de cada consulta.</Text>
          </YStack>

          <XStack gap="$3" flexWrap="wrap">
             <Button size="$3" backgroundColor="$color2" borderWidth={1} borderColor="$borderColor" color="$color12" icon={<CalendarIcon />} iconAfter={<FilterIcon />}>
                23/04/2026 — 23/05/2026
             </Button>
             <Button size="$3" backgroundColor="$color2" borderWidth={1} borderColor="$borderColor" color="$color12" iconAfter={<FilterIcon />}>
                Filtrar por status
             </Button>
             <Button size="$3" backgroundColor="$green9" color="white" hoverStyle={{ backgroundColor: "$green10" }} fontWeight="bold">
                + Nova Consulta
             </Button>
          </XStack>
        </XStack>

        {/* ── Cards de Resumo ── */}
        <XStack flexWrap="wrap" gap="$4">
          
          <YStack flex={1} minWidth={300} gap="$4">
            {/* Resumo do Período */}
            <Card borderWidth={1}
              backgroundColor="$color2"
              borderColor="$borderColor"
              borderRadius="$5"
              padding="$4"
            >
              <Text color="$color11" fontSize={11} fontWeight="bold" letterSpacing={1} textTransform="uppercase" marginBottom="$3">
                Resumo do Período
              </Text>
              
              <XStack gap="$4" flexWrap="wrap">
                {/* Consultas Agendadas */}
                <YStack flex={1} gap="$2">
                  <Circle size="$3" backgroundColor="rgba(16,185,129,0.12)">
                    <TrendingIcon />
                  </Circle>
                  <Text color="$color11" fontSize={12}>Agendamentos</Text>
                  <Text color="$color12" fontSize={22} fontWeight="bold">142</Text>
                  <XStack alignItems="center" gap="$1">
                    <Circle size={6} backgroundColor="#10b981" />
                    <Text color="#10b981" fontSize={11}>+12% vs mês anterior</Text>
                  </XStack>
                </YStack>

                <Separator vertical borderColor="$borderColor" />

                {/* Valor Gerado */}
                <YStack flex={1} gap="$2">
                  <Circle size="$3" backgroundColor="rgba(16,185,129,0.12)">
                    <MoneyIcon />
                  </Circle>
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
            minWidth={220}
            borderWidth={1}
            backgroundColor="$color2"
            borderColor="$borderColor"
            borderRadius="$5"
            padding="$4"
            hoverStyle={{ backgroundColor: "$color3", borderColor: "$green8" }}
          >
            <Text color="$color11" fontSize={11} fontWeight="bold" letterSpacing={1} textTransform="uppercase" marginBottom="$3">
              Visão Geral do Dia
            </Text>
            <YStack gap="$3">
              {[
                { icon: "📅", label: "Total de Consultas", value: "12",  color: "$color12" },
                { icon: "✅", label: "Confirmadas",         value: "9",  color: "#10b981" },
                { icon: "⏳", label: "Pendentes",           value: "3",  color: "#facc15" },
                { icon: "⏱",  label: "Tempo Médio",         value: "48m", color: "#60a5fa" },
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
