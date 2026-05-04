//@ts-nocheck
"use client";

import { useState } from "react";
import {
  Card, Avatar, Text, H2, XStack, YStack,
  ScrollView, Button, Circle, Separator,
} from "tamagui";

type StatusAvaliacao = "avaliado" | "pendente" | "nao_avaliavel";

interface ConsultaHistorico {
  id: number; data: string; dataISO: string; horario: string;
  nome: string; especialidade: string; modalidade: "Presencial" | "Online";
  avatar: string; valor: string; statusAvaliacao: StatusAvaliacao; nota?: number;
}

const historico: ConsultaHistorico[] = [
  { id: 1, data: "15/02/2026", dataISO: "2026-02", horario: "14:30", nome: "Dra. Letícia Marques",  especialidade: "Endocrinologia",     modalidade: "Presencial", avatar: "https://picsum.photos/200/200?random=50", valor: "R$ 320", statusAvaliacao: "pendente" },
  { id: 2, data: "14/02/2026", dataISO: "2026-02", horario: "09:00", nome: "Dr. Roberto Alves",     especialidade: "Ortopedia",          modalidade: "Presencial", avatar: "https://picsum.photos/200/200?random=21", valor: "R$ 280", statusAvaliacao: "avaliado",      nota: 5 },
  { id: 3, data: "13/02/2026", dataISO: "2026-02", horario: "11:00", nome: "Dra. Ana Souza",        especialidade: "Nutrição",           modalidade: "Online",     avatar: "https://picsum.photos/200/200?random=23", valor: "R$ 180", statusAvaliacao: "avaliado",      nota: 5 },
  { id: 4, data: "12/02/2026", dataISO: "2026-02", horario: "16:00", nome: "Bruno Silva",           especialidade: "Medicina Esportiva", modalidade: "Online",     avatar: "https://picsum.photos/200/200?random=25", valor: "R$ 220", statusAvaliacao: "avaliado",      nota: 4 },
  { id: 5, data: "01/02/2026", dataISO: "2026-02", horario: "08:00", nome: "Dr. Vinícius Almeida",  especialidade: "Nutrologia",         modalidade: "Online",     avatar: "https://picsum.photos/200/200?random=60", valor: "R$ 250", statusAvaliacao: "pendente" },
  { id: 6, data: "29/01/2026", dataISO: "2026-01", horario: "09:00", nome: "Marcelo Strong",        especialidade: "Fisioterapia",       modalidade: "Presencial", avatar: "https://picsum.photos/200/200?random=52", valor: "R$ 150", statusAvaliacao: "avaliado",      nota: 3 },
  { id: 7, data: "20/01/2026", dataISO: "2026-01", horario: "14:00", nome: "Dra. Camila Nery",      especialidade: "Personal Trainer",   modalidade: "Presencial", avatar: "https://picsum.photos/200/200?random=22", valor: "R$ 120", statusAvaliacao: "nao_avaliavel" },
  { id: 8, data: "10/01/2026", dataISO: "2026-01", horario: "11:30", nome: "Dr. Roberto Alves",     especialidade: "Ortopedia",          modalidade: "Presencial", avatar: "https://picsum.photos/200/200?random=21", valor: "R$ 280", statusAvaliacao: "avaliado",      nota: 5 },
];

const mesLabels: Record<string, string> = { "2026-02": "Fevereiro 2026", "2026-01": "Janeiro 2026" };

function agruparPorMes(items: ConsultaHistorico[]) {
  const grupos: Record<string, ConsultaHistorico[]> = {};
  for (const item of items) {
    if (!grupos[item.dataISO]) grupos[item.dataISO] = [];
    grupos[item.dataISO].push(item);
  }
  return grupos;
}

const avaliacaoConfig: Record<StatusAvaliacao, { label: string; bg: string; color: string }> = {
  avaliado:      { label: "AVALIADO", bg: "rgba(16,185,129,0.12)",  color: "#10b981" },
  pendente:      { label: "PENDENTE", bg: "rgba(167,139,250,0.12)", color: "#a78bfa" },
  nao_avaliavel: { label: "N/A",      bg: "rgba(161,161,170,0.1)",  color: "#71717a" },
};

const PERIODOS = ["Tudo", "Semana", "Mês", "Ano"];

const CalendarIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

function StarRow({ nota }: { nota: number }) {
  return (
    <XStack gap="$1">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width="12" height="12" viewBox="0 0 24 24"
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

function ConsultaCard({ c }: { c: ConsultaHistorico }) {
  const aval = avaliacaoConfig[c.statusAvaliacao];
  return (
    <Card cursor="pointer" animation="quick" borderWidth={1} backgroundColor="$color2" borderColor="$borderColor" borderRadius="$5"
      overflow="hidden" hoverStyle={{ backgroundColor: "$color3", borderColor: "$green8" }}>
      {/* Header */}
      <XStack justifyContent="space-between" alignItems="center"
        paddingHorizontal="$4" paddingVertical="$3"
        borderBottomWidth={1} borderColor="$borderColor">
        <XStack alignItems="center" gap="$2">
          <span style={{ color: "#71717a" }}><CalendarIcon /></span>
          <Text color="$color11" fontSize={12}>{c.data}</Text>
          <Circle size={3} backgroundColor="$color9" />
          <Text color="$color11" fontSize={12}>{c.horario}</Text>
        </XStack>
        <XStack paddingHorizontal="$3" paddingVertical="$1" borderRadius="$10"
          style={{ background: aval.bg }}>
          <Text fontSize={10} fontWeight="bold" style={{ color: aval.color }}>{aval.label}</Text>
        </XStack>
      </XStack>

      {/* Body */}
      <XStack padding="$4" gap="$3" alignItems="center">
        <Avatar circular size="$5" backgroundColor="$color4" flexShrink={0}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <Avatar.Image src={c.avatar} />
          <Avatar.Fallback alignItems="center" justifyContent="center">
            <Text color="$color12" fontSize={16} fontWeight="bold">{c.nome[0]}</Text>
          </Avatar.Fallback>
        </Avatar>
        <YStack flex={1} gap="$1">
          <Text color="$color12" fontSize={14} fontWeight="bold" numberOfLines={1}>{c.nome}</Text>
          <XStack alignItems="center" gap="$2">
            <Text color="$color11" fontSize={12}>{c.especialidade}</Text>
            <Circle size={3} backgroundColor="$color9" />
            <Text color="$color11" fontSize={12}>{c.modalidade}</Text>
          </XStack>
          {c.nota && (
            <XStack alignItems="center" gap="$2" marginTop="$1">
              <StarRow nota={c.nota} />
              <Text color="$color10" fontSize={11}>Sua avaliação</Text>
            </XStack>
          )}
        </YStack>
        <YStack alignItems="flex-end" gap="$1" flexShrink={0}>
          <Text color="$color10" fontSize={11}>Valor</Text>
          <Text color="$color12" fontSize={16} fontWeight="bold">{c.valor}</Text>
        </YStack>
      </XStack>

      {/* Footer */}
      <XStack paddingHorizontal="$4" paddingVertical="$2" borderTopWidth={1} borderColor="$borderColor">
        <Button size="$2" chromeless paddingHorizontal="$2" gap="$1"
          id={`btn-detalhes-${c.id}`} hoverStyle={{ backgroundColor: "$color4" }}>
          <span style={{ color: "#71717a" }}><ExternalLinkIcon /></span>
          <Text color="$color11" fontSize={12}>Ver detalhes</Text>
        </Button>
      </XStack>
    </Card>
  );
}

export default function HistoricoPage() {
  const [periodo, setPeriodo] = useState("Tudo");
  const grupos = agruparPorMes(historico);
  const meses = Object.keys(grupos).sort((a, b) => b.localeCompare(a));
  const totalGasto = historico.reduce((acc, c) => acc + parseInt(c.valor.replace(/\D/g, "")), 0);
  const avaliados = historico.filter((c) => c.statusAvaliacao === "avaliado").length;
  const pendentes = historico.filter((c) => c.statusAvaliacao === "pendente").length;
  const timeline  = historico.slice().sort((a, b) => b.id - a.id).slice(0, 8);

  return (
    <ScrollView flex={1} backgroundColor="$background" showsVerticalScrollIndicator={false}>
      <YStack padding="$4" $gtSm={{ padding: "$6" }} gap="$5"
        maxWidth={1100} marginHorizontal="auto" width="100%">

        {/* Cabeçalho */}
        <XStack justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap="$3">
          <YStack gap="$1">
            <H2 color="$color12" size="$6" fontWeight="bold">Histórico</H2>
            <Text color="$color11" fontSize={14}>Consultas realizadas, avaliações e linha do tempo.</Text>
          </YStack>
          {/* Filtros de Período (Responsivo) */}

          {/* Mobile: Dropdown */}
          <div style={{ display: "none" }} className="hist-filter-mobile">
            <select
              value={periodo}
              onChange={e => setPeriodo(e.target.value)}
              style={{
                width: "100%",
                background: "var(--color2, #1a1a1a)",
                border: "1px solid rgba(16,185,129,0.4)",
                borderRadius: 12,
                padding: "12px 16px",
                color: "#10b981",
                fontSize: 14,
                fontWeight: "bold",
                fontFamily: "inherit",
                outline: "none",
                cursor: "pointer",
                appearance: "none",
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2310b981' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 14px center",
                paddingRight: 40,
              }}
            >
              {PERIODOS.map(p => (
                <option key={p} value={p} style={{ background: "#111", color: "#fff" }}>{p}</option>
              ))}
            </select>
          </div>

          {/* Desktop: Pills */}
          <div className="hist-filter-desktop">
            <XStack gap="$2" flexWrap="wrap">
              {PERIODOS.map((p) => {
                const isActive = periodo === p;
                return (
                  <Button key={p} size="$3" borderRadius="$10" borderWidth={1}
                    animation="quick"
                    borderColor={isActive ? "$green8" : "$borderColor"}
                    backgroundColor={isActive ? "rgba(16,185,129,0.1)" : "transparent"}
                    onPress={() => setPeriodo(p)}
                    hoverStyle={{ backgroundColor: isActive ? "rgba(16,185,129,0.15)" : "$color3", borderColor: "$green8" }}
                    pressStyle={{ scale: 0.97 }}
                    paddingHorizontal="$4"
                    id={`filter-periodo-${p.toLowerCase()}`}
                  >
                    <Text fontWeight={isActive ? "bold" : "400"}
                      color={isActive ? "#10b981" : "$color11"} fontSize={13}>{p}</Text>
                  </Button>
                );
              })}
            </XStack>
          </div>

          <style>{`
            @media (max-width: 640px) {
              .hist-filter-mobile { display: block !important; }
              .hist-filter-desktop { display: none !important; }
            }
          `}</style>
        </XStack>

        {/* Corpo */}
        <XStack gap="$5" alignItems="flex-start" flexWrap="wrap" $gtSm={{ flexWrap: "nowrap" }}>

          {/* Lista de consultas */}
          <YStack flex={2} gap="$5" minWidth={280}>
            <H2 color="$color12" size="$5" fontWeight="bold">Consultas Realizadas</H2>
            {meses.map((mesKey) => {
              const items = grupos[mesKey];
              const label = mesLabels[mesKey] ?? mesKey;
              return (
                <YStack key={mesKey} gap="$3">
                  <XStack alignItems="center" gap="$3">
                    <Text color="$color11" fontSize={12} fontWeight="bold"
                      textTransform="uppercase" letterSpacing={1} flexShrink={0}>{label}</Text>
                    <Separator flex={1} borderColor="$borderColor" />
                    <Text color="$color10" fontSize={11} flexShrink={0}>{items.length} consultas</Text>
                  </XStack>
                  <YStack gap="$3">
                    {items.map((c) => <ConsultaCard key={c.id} c={c} />)}
                  </YStack>
                </YStack>
              );
            })}
          </YStack>

          {/* Sidebar */}
          <YStack flex={1} minWidth={240} gap="$4">

            {/* Linha do Tempo */}
            <Card cursor="pointer" animation="quick" borderWidth={1} backgroundColor="$color2" borderColor="$borderColor"
              borderRadius="$5" overflow="hidden" hoverStyle={{ backgroundColor: "$color3", borderColor: "$purple8" }}>
              <YStack height={3} backgroundColor="#a78bfa" />
              <YStack padding="$4" gap="$4">
                <Text color="$color11" fontSize={11} fontWeight="bold"
                  letterSpacing={1} textTransform="uppercase">Linha do tempo</Text>
                <YStack gap="$0">
                  {timeline.map((item, idx) => {
                    const isLast = idx === timeline.length - 1;
                    return (
                      <XStack key={idx} gap="$3" alignItems="flex-start">
                        <YStack alignItems="center" width={14} flexShrink={0} marginTop="$1">
                          <Circle size={10} borderWidth={2} borderColor="$color2"
                            backgroundColor="#a78bfa" zIndex={2} />
                          {!isLast && (
                            <YStack width={2} height={38} backgroundColor="$borderColor"
                              marginTop={-2} zIndex={1} />
                          )}
                        </YStack>
                        <YStack flex={1} paddingBottom={isLast ? 0 : "$3"}>
                          <Text color="$color10" fontSize={11}>{item.data}</Text>
                          <Text color="$color12" fontSize={13} fontWeight="500">
                            {item.especialidade} · {item.modalidade}
                          </Text>
                          <Text color="$color11" fontSize={12}>{item.nome}</Text>
                        </YStack>
                      </XStack>
                    );
                  })}
                </YStack>
                <Button size="$3" borderRadius="$4" borderWidth={1} borderColor="$borderColor"
                  backgroundColor="transparent" hoverStyle={{ backgroundColor: "$color3" }}
                  gap="$1" id="btn-ver-historico-completo">
                  <Text color="$color11" fontSize={13}>Ver histórico completo</Text>
                  <span style={{ color: "#a1a1aa" }}><ChevronDownIcon /></span>
                </Button>
              </YStack>
            </Card>

            {/* Resumo Geral */}
            <Card cursor="pointer" animation="quick" borderWidth={1} backgroundColor="$color2" borderColor="$borderColor"
              borderRadius="$5" padding="$4" hoverStyle={{ backgroundColor: "$color3", borderColor: "$green8" }}>
              <Text color="$color11" fontSize={11} fontWeight="bold"
                letterSpacing={1} textTransform="uppercase" marginBottom="$3">Resumo Geral</Text>
              <YStack>
                {[
                  { label: "Total de consultas",    value: String(historico.length),                    color: "$color12" },
                  { label: "Total investido",        value: `R$ ${totalGasto.toLocaleString("pt-BR")}`,  color: "#10b981" },
                  { label: "Avaliações feitas",      value: String(avaliados),                           color: "#a78bfa" },
                  { label: "Pendentes de avaliação", value: String(pendentes),                           color: "#facc15" },
                ].map((item, i, arr) => (
                  <XStack key={i} justifyContent="space-between" alignItems="center"
                    paddingVertical="$3"
                    borderBottomWidth={i < arr.length - 1 ? 1 : 0}
                    borderColor="$borderColor">
                    <Text color="$color11" fontSize={13}>{item.label}</Text>
                    <Text fontSize={14} fontWeight="bold" style={{ color: item.color as string }}>
                      {item.value}
                    </Text>
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
