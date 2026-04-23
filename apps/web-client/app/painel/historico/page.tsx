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

interface ConsultaHistorico {
  id: number;
  data: string;         // "01/02/2026"
  dataISO: string;      // Para agrupamento "Fevereiro 2026"
  horario: string;
  nome: string;
  especialidade: string;
  modalidade: string;
  avatar: string;
  avaliado: boolean;
  nota?: number;        // 1-5 estrelas (se avaliado)
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const historicoMock: ConsultaHistorico[] = [
  {
    id: 1,
    data: "15/02/2026",
    dataISO: "2026-02",
    horario: "14:30",
    nome: "Carla Souza",
    especialidade: "Cardiologia",
    modalidade: "Consulta Online",
    avatar: "https://picsum.photos/200/200?random=70",
    avaliado: false,
  },
  {
    id: 2,
    data: "14/02/2026",
    dataISO: "2026-02",
    horario: "09:00",
    nome: "Roberto Cardoso Silva Matos Santos",
    especialidade: "Cardiologia",
    modalidade: "Consulta Online",
    avatar: "https://picsum.photos/200/200?random=71",
    avaliado: false,
  },
  {
    id: 3,
    data: "13/02/2026",
    dataISO: "2026-02",
    horario: "11:00",
    nome: "Dra. Ana Souza",
    especialidade: "Nutrição",
    modalidade: "Consulta Online",
    avatar: "https://picsum.photos/200/200?random=23",
    avaliado: true,
    nota: 5,
  },
  {
    id: 4,
    data: "12/02/2026",
    dataISO: "2026-02",
    horario: "16:00",
    nome: "Dr. Roberto Alves",
    especialidade: "Cardiologia",
    modalidade: "Consulta Online",
    avatar: "https://picsum.photos/200/200?random=21",
    avaliado: true,
    nota: 4,
  },
  {
    id: 5,
    data: "11/02/2026",
    dataISO: "2026-02",
    horario: "10:00",
    nome: "Dra. Letícia Marques",
    especialidade: "Cardiologia",
    modalidade: "Consulta Online",
    avatar: "https://picsum.photos/200/200?random=50",
    avaliado: false,
  },
  {
    id: 6,
    data: "10/02/2026",
    dataISO: "2026-02",
    horario: "15:30",
    nome: "Dr. Vinícius Almeida",
    especialidade: "Cardiologia",
    modalidade: "Consulta Online",
    avatar: "https://picsum.photos/200/200?random=60",
    avaliado: true,
    nota: 5,
  },
  {
    id: 7,
    data: "29/01/2026",
    dataISO: "2026-01",
    horario: "09:00",
    nome: "Roberto Cardoso Silva Matos Santos",
    especialidade: "Cardiologia",
    modalidade: "Consulta Online",
    avatar: "https://picsum.photos/200/200?random=71",
    avaliado: false,
  },
  {
    id: 8,
    data: "01/02/2026",
    dataISO: "2026-02",
    horario: "08:00",
    nome: "Carla Souza",
    especialidade: "Cardiologia",
    modalidade: "Consulta Online",
    avatar: "https://picsum.photos/200/200?random=70",
    avaliado: false,
  },
  {
    id: 9,
    data: "20/01/2026",
    dataISO: "2026-01",
    horario: "14:00",
    nome: "Marcelo Strong",
    especialidade: "Fisioterapia",
    modalidade: "Presencial",
    avatar: "https://picsum.photos/200/200?random=52",
    avaliado: true,
    nota: 3,
  },
  {
    id: 10,
    data: "10/01/2026",
    dataISO: "2026-01",
    horario: "11:30",
    nome: "Bruno Silva",
    especialidade: "Medicina Esportiva",
    modalidade: "Presencial",
    avatar: "https://picsum.photos/200/200?random=25",
    avaliado: true,
    nota: 5,
  },
];

// Linha do tempo (ordenada do mais recente)
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
    <XStack gap={2}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill={i <= nota ? "#facc15" : "none"}
          stroke={i <= nota ? "#facc15" : "#3f3f46"}
          strokeWidth="2"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </XStack>
  );
}

// ─── Icons ───────────────────────────────────────────────────────────────────

function IconCalendar() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconChevronDown() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function IconExternalLink() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

// ─── Consulta Card ────────────────────────────────────────────────────────────

function ConsultaCard({ consulta }: { consulta: ConsultaHistorico }) {
  return (
    <Card
      borderWidth={1}
      borderColor="$borderColor"
      backgroundColor="$color2"
      borderRadius="$5"
      overflow="hidden"
      animation="quick"
      hoverStyle={{ borderColor: "$green8" }}
    >
      {/* Data header do card */}
      <XStack
        alignItems="center"
        gap="$2"
        paddingHorizontal="$4"
        paddingTop="$3"
        paddingBottom="$3"
        borderBottomWidth={1}
        borderColor="$borderColor"
        style={{ color: "#a1a1aa" }}
      >
        <IconCalendar />
        <Text color="$color11" fontSize={13} fontWeight="600">
          {consulta.data}
        </Text>
        <Text color="$color11" fontSize={12}>
          · {consulta.horario}
        </Text>
      </XStack>

      {/* Corpo */}
      <YStack padding="$4" gap="$3">
        {/* Profissional info + botão Avaliar */}
        <XStack alignItems="center" justifyContent="space-between" gap="$3">
          <XStack alignItems="center" gap="$3" flex={1}>
            <Avatar circular size="$5" backgroundColor="$color4">
              <Avatar.Image src={consulta.avatar} />
              <Avatar.Fallback alignItems="center" justifyContent="center" backgroundColor="$color4">
                <Text color="$color12" fontWeight="bold" fontSize={16}>
                  {consulta.nome[0]}
                </Text>
              </Avatar.Fallback>
            </Avatar>

            <YStack flex={1} gap={3}>
              <Text color="$color12" fontSize={14} fontWeight="700" numberOfLines={1}>
                {consulta.nome}
              </Text>
              <Text color="$color11" fontSize={12} numberOfLines={1}>
                {consulta.especialidade} - {consulta.modalidade}
              </Text>
              {consulta.avaliado && consulta.nota && (
                <XStack alignItems="center" gap="$2" marginTop={2}>
                  <StarRating nota={consulta.nota} />
                  <Text color="$color11" fontSize={11}>
                    Avaliado
                  </Text>
                </XStack>
              )}
            </YStack>
          </XStack>

          {!consulta.avaliado && (
            <Button
              size="$3"
              borderRadius="$10"
              paddingHorizontal="$4"
              backgroundColor="rgba(139,92,246,0.15)"
              borderWidth={1}
              borderColor="rgba(139,92,246,0.3)"
              hoverStyle={{ backgroundColor: "rgba(139,92,246,0.25)" }}
              pressStyle={{ opacity: 0.75 }}
              flexShrink={0}
            >
              <Text color="#a78bfa" fontWeight="700" fontSize={13}>
                Avaliar
              </Text>
            </Button>
          )}
        </XStack>

        {/* Botão Ver detalhes */}
        <Button
          width="100%"
          size="$3"
          borderRadius="$4"
          borderWidth={1}
          borderColor="rgba(16,185,129,0.35)"
          backgroundColor="transparent"
          hoverStyle={{ backgroundColor: "rgba(16,185,129,0.07)" }}
          pressStyle={{ opacity: 0.75 }}
          icon={<IconExternalLink />}
        >
          <Text color="#10b981" fontWeight="600" fontSize={14}>
            Ver detalhes
          </Text>
        </Button>
      </YStack>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const periodos = ["Semana", "Mês", "Ano", "Tudo"];

export default function HistoricoPage() {
  const [periodo, setPeriodo] = useState("Mês");

  const grupos = agruparPorMes(historicoMock);
  const meses = Object.keys(grupos).sort((a, b) => b.localeCompare(a)); // mais recente primeiro

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
        {/* ── Cabeçalho ── */}
        <YStack gap="$3">
          <XStack justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap="$3">
            <YStack gap="$1">
              <H2 color="$color12" size="$7" fontWeight="800" letterSpacing={-0.5}>
                Histórico
              </H2>
              <Text color="$color11" fontSize={14}>
                Gerencie suas consultas de forma simples e organizada.
              </Text>
            </YStack>

            {/* Filtro de período */}
            <XStack gap="$2">
              {periodos.map((p) => {
                const isActive = periodo === p;
                return (
                  <Button
                    key={p}
                    size="$3"
                    borderRadius="$10"
                    borderWidth={1}
                    borderColor={isActive ? "transparent" : "$borderColor"}
                    backgroundColor={isActive ? "#10b981" : "transparent"}
                    onPress={() => setPeriodo(p)}
                    hoverStyle={!isActive ? { borderColor: "$green8", backgroundColor: "rgba(16,185,129,0.06)" } : { opacity: 0.9 }}
                    pressStyle={{ opacity: 0.75 }}
                    paddingHorizontal="$3"
                  >
                    <Text fontWeight={isActive ? "700" : "500"} fontSize={13} color={isActive ? "white" : "$color11"}>
                      {p}
                    </Text>
                  </Button>
                );
              })}
            </XStack>
          </XStack>

          <Separator borderColor="$borderColor" />
        </YStack>

        {/* ── Conteúdo Principal: Lista + Linha do Tempo ── */}
        <XStack gap="$6" alignItems="flex-start" flexWrap="wrap" $gtMd={{ flexWrap: "nowrap" }}>

          {/* ── Coluna Esquerda: Consultas agrupadas ── */}
          <YStack flex={1} gap="$6" minWidth={300}>
            <Text color="$color12" fontSize={16} fontWeight="700">
              Consultas
            </Text>

            {meses.map((mesKey) => {
              const consultas = grupos[mesKey];
              const label = mesLabels[mesKey] ?? mesKey;

              return (
                <YStack key={mesKey} gap="$3">
                  {/* Label do mês */}
                  <XStack alignItems="center" gap="$3">
                    <Text color="$color11" fontSize={12} fontWeight="700" textTransform="uppercase" letterSpacing={0.6}>
                      {label}
                    </Text>
                    <YStack flex={1} height={1} backgroundColor="$borderColor" />
                    <XStack
                      paddingHorizontal="$2"
                      paddingVertical={2}
                      borderRadius={999}
                      backgroundColor="$color3"
                      borderWidth={1}
                      borderColor="$borderColor"
                    >
                      <Text color="$color11" fontSize={11} fontWeight="600">
                        {consultas.length} consultas
                      </Text>
                    </XStack>
                  </XStack>

                  {/* Cards do mês */}
                  <YStack gap="$3">
                    {consultas.map((c) => (
                      <ConsultaCard key={c.id} consulta={c} />
                    ))}
                  </YStack>
                </YStack>
              );
            })}
          </YStack>

          {/* ── Coluna Direita: Linha do Tempo ── */}
          <YStack
            width={280}
            $sm={{ display: "none" }}
            gap="$3"
            position="sticky"
            style={{ top: 24 }}
          >
            <Text color="$color12" fontSize={16} fontWeight="700">
              Linha do tempo
            </Text>

            <Card
              borderWidth={1}
              borderColor="$borderColor"
              backgroundColor="$color2"
              borderRadius="$5"
              padding="$4"
              overflow="hidden"
            >
              {/* Barra de progresso verde no topo */}
              <YStack height={2} marginBottom="$4" style={{ background: "linear-gradient(to right, #10b981, transparent)" }} borderRadius={999} />

              <YStack gap={0}>
                {timelineMock.map((item, idx) => {
                  const isLast = idx === timelineMock.length - 1;
                  return (
                    <XStack key={idx} gap="$3" alignItems="flex-start">
                      {/* Dot + linha vertical */}
                      <YStack alignItems="center" width={16} paddingTop={2}>
                        <Circle
                          size={10}
                          backgroundColor="#10b981"
                          borderWidth={2}
                          borderColor="#0d9068"
                          style={{ boxShadow: "0 0 6px rgba(16,185,129,0.5)", flexShrink: 0 }}
                        />
                        {!isLast && (
                          <YStack
                            width={2}
                            flex={1}
                            minHeight={32}
                            style={{ background: "linear-gradient(to bottom, #10b981, rgba(16,185,129,0.1))" }}
                            marginTop={2}
                          />
                        )}
                      </YStack>

                      {/* Conteúdo */}
                      <YStack paddingBottom={isLast ? 0 : "$3"} flex={1}>
                        <Text color="$color12" fontSize={13} fontWeight="700">
                          {item.data}
                        </Text>
                        <Text color="$color11" fontSize={12}>
                          {item.descricao}
                        </Text>
                      </YStack>
                    </XStack>
                  );
                })}
              </YStack>

              {/* Ver mais */}
              <XStack
                marginTop="$3"
                paddingTop="$3"
                borderTopWidth={1}
                borderColor="$borderColor"
                alignItems="center"
                justifyContent="center"
                gap="$2"
                cursor="pointer"
                hoverStyle={{ opacity: 0.8 }}
              >
                <Text color="#10b981" fontSize={13} fontWeight="600">
                  Ver histórico completo
                </Text>
                <YStack style={{ color: "#10b981" }}>
                  <IconChevronDown />
                </YStack>
              </XStack>
            </Card>

            {/* Resumo rápido */}
            <Card
              borderWidth={1}
              borderColor="$borderColor"
              backgroundColor="$color2"
              borderRadius="$5"
              padding="$4"
            >
              <Text color="$color11" fontSize={11} fontWeight="600" textTransform="uppercase" letterSpacing={0.5} marginBottom="$3">
                Resumo Geral
              </Text>
              <YStack gap="$2">
                {[
                  { label: "Total de consultas", value: String(historicoMock.length), color: "#fafafa" },
                  { label: "Avaliadas", value: String(historicoMock.filter(c => c.avaliado).length), color: "#a78bfa" },
                  { label: "Pendentes de avaliação", value: String(historicoMock.filter(c => !c.avaliado).length), color: "#facc15" },
                ].map((item, i) => (
                  <XStack key={i} justifyContent="space-between" alignItems="center" paddingVertical="$2" borderBottomWidth={i < 2 ? 1 : 0} borderColor="$borderColor">
                    <Text color="$color11" fontSize={13}>{item.label}</Text>
                    <Text fontWeight="800" fontSize={16} style={{ color: item.color }}>{item.value}</Text>
                  </XStack>
                ))}
              </YStack>
            </Card>
          </YStack>

        </XStack>
      </YStack>
    </ScrollView>
  );
}
