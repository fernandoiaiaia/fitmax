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
  Circle,
  Button,
  Separator,
  ScrollView,
} from "tamagui";

// ─── Types ────────────────────────────────────────────────────────────────────

type StatusPagamento = "pago" | "pendente" | "reembolsado";

interface ConsultaHistorico {
  id: number;
  data: string;
  dataISO: string;
  horario: string;
  paciente: string;
  especialidade: string;
  modalidade: "Presencial" | "Online";
  avatar: string;
  valor: string;
  statusPagamento: StatusPagamento;
  nota?: number;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const historico: ConsultaHistorico[] = [
  { id: 1, data: "23/04/2026", dataISO: "2026-04", horario: "11:00", paciente: "Guilherme Augusto", especialidade: "Cardiologia", modalidade: "Presencial", avatar: "https://picsum.photos/200/200?random=30", valor: "R$ 350", statusPagamento: "pago", nota: 5 },
  { id: 2, data: "23/04/2026", dataISO: "2026-04", horario: "13:00", paciente: "Mariana Ferreira", especialidade: "Cardiologia", modalidade: "Online", avatar: "https://picsum.photos/200/200?random=31", valor: "R$ 280", statusPagamento: "pendente" },
  { id: 3, data: "22/04/2026", dataISO: "2026-04", horario: "09:00", paciente: "Fernanda Lima", especialidade: "Cardiologia", modalidade: "Presencial", avatar: "https://picsum.photos/200/200?random=41", valor: "R$ 350", statusPagamento: "pago", nota: 4 },
  { id: 4, data: "20/04/2026", dataISO: "2026-04", horario: "15:30", paciente: "Ricardo Nunes", especialidade: "Check-up Cardíaco", modalidade: "Presencial", avatar: "https://picsum.photos/200/200?random=45", valor: "R$ 420", statusPagamento: "pago" },
  { id: 5, data: "15/04/2026", dataISO: "2026-04", horario: "10:00", paciente: "Beatriz Santos", especialidade: "Cardiologia", modalidade: "Online", avatar: "https://picsum.photos/200/200?random=46", valor: "R$ 280", statusPagamento: "reembolsado" },
  { id: 6, data: "30/03/2026", dataISO: "2026-03", horario: "14:00", paciente: "Carlos Eduardo", especialidade: "Avaliação Cardíaca", modalidade: "Presencial", avatar: "https://picsum.photos/200/200?random=47", valor: "R$ 500", statusPagamento: "pago", nota: 5 },
];

const PERIODOS = ["Semana", "Mês", "Ano", "Tudo"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mesLabels: Record<string, string> = {
  "2026-04": "Abril 2026",
  "2026-03": "Março 2026",
};

function agruparPorMes(items: ConsultaHistorico[]) {
  const grupos: Record<string, ConsultaHistorico[]> = {};
  for (const item of items) {
    if (!grupos[item.dataISO]) grupos[item.dataISO] = [];
    grupos[item.dataISO].push(item);
  }
  return grupos;
}

const pagConfig: Record<StatusPagamento, { label: string; bg: string; color: string; border: string }> = {
  pago:        { label: "PAGO",        bg: "rgba(16,185,129,0.12)",  color: "#10b981", border: "rgba(16,185,129,0.3)" },
  pendente:    { label: "PENDENTE",    bg: "rgba(234,179,8,0.12)",   color: "#facc15", border: "rgba(234,179,8,0.3)" },
  reembolsado: { label: "REEMBOLSADO", bg: "rgba(161,161,170,0.1)",  color: "#a1a1aa", border: "rgba(161,161,170,0.25)" },
};

// ─── Icons ────────────────────────────────────────────────────────────────────

const CalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
);
const ExternalLinkIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
);
const ChevronDownIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
);
const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill={filled ? "#facc15" : "none"} stroke={filled ? "#facc15" : "#3f3f46"} strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
);

function StarRow({ nota }: { nota: number }) {
  return (
    <XStack gap={2}>
      {[1, 2, 3, 4, 5].map((i) => <StarIcon key={i} filled={i <= nota} />)}
    </XStack>
  );
}

// ─── Consulta Card ────────────────────────────────────────────────────────────

function ConsultaCard({ c }: { c: ConsultaHistorico }) {
  const cfg = pagConfig[c.statusPagamento];
  return (
    <Card cursor="pointer" animation="quick" borderWidth={1} backgroundColor="$color2" borderColor="$borderColor" borderRadius="$3" hoverStyle={{ backgroundColor: "$color3", borderColor: "$green8" }}>
      {/* Header */}
      <XStack justifyContent="space-between" alignItems="center" padding="$3" borderBottomWidth={1} borderColor="$borderColor">
        <XStack alignItems="center" gap="$2">
          <Text color="$color11"><CalendarIcon /></Text>
          <Text color="$color11" fontSize={12}>{c.data} · {c.horario}</Text>
        </XStack>
        <XStack paddingHorizontal="$2" paddingVertical="$1" borderRadius="$10" borderWidth={1} backgroundColor={cfg.bg} borderColor={cfg.border}>
          <Text color={cfg.color} fontSize={10} fontWeight="bold">{cfg.label}</Text>
        </XStack>
      </XStack>

      {/* Body */}
      <XStack padding="$3" gap="$3" alignItems="center">
        <Avatar circular size="$4" backgroundColor="$color4" borderWidth={1} borderColor="$borderColor">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <Avatar.Image src={c.avatar} />
        </Avatar>
        <YStack flex={1}>
          <Text color="$color12" fontSize={14} fontWeight="bold">{c.paciente}</Text>
          <Text color="$color11" fontSize={12}>{c.especialidade} · {c.modalidade}</Text>
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
        <Button size="$2" chromeless paddingHorizontal="$2" gap="$1" hoverStyle={{ backgroundColor: "$color4" }}>
          <Text color="$color10"><ExternalLinkIcon /></Text>
          <Text color="$color11" fontSize={12}>Ver detalhes</Text>
        </Button>
      </XStack>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HistoricoPage() {
  const [periodo, setPeriodo] = useState("Mês");

  const grupos = agruparPorMes(historico);
  const meses = Object.keys(grupos).sort((a, b) => b.localeCompare(a));

  const totalPago = historico.filter((c) => c.statusPagamento === "pago").reduce((acc, c) => acc + parseInt(c.valor.replace(/\D/g, "")), 0);
  const pendentes = historico.filter((c) => c.statusPagamento === "pendente").length;
  
  const timeline = historico.slice().sort((a, b) => b.id - a.id).map((c) => ({
    data: c.data,
    descricao: `${c.especialidade} · ${c.modalidade}`,
    paciente: c.paciente,
    statusPagamento: c.statusPagamento,
  }));

  return (
    <ScrollView flex={1} backgroundColor="$background" showsVerticalScrollIndicator={false}>
      <YStack padding="$4" $gtSm={{ padding: "$6" }} gap="$5" maxWidth={1100} marginHorizontal="auto" width="100%">
        
        {/* Cabeçalho */}
        <XStack justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap="$3">
          <YStack gap="$1">
            <H2 color="$color12" size="$6" fontWeight="bold">Histórico</H2>
            <Text color="$color11" fontSize={14}>Consultas realizadas, pagamentos e linha do tempo de atendimentos.</Text>
          </YStack>
          <XStack gap="$2" flexWrap="wrap">
            {PERIODOS.map((p) => {
              const isActive = periodo === p;
              return (
                <Button key={p} size="$3" borderRadius="$10" borderWidth={1} borderColor={isActive ? "transparent" : "$borderColor"} backgroundColor={isActive ? "$color12" : "transparent"} onPress={() => setPeriodo(p)} hoverStyle={{ opacity: 0.8 }} paddingHorizontal="$4">
                  <Text fontWeight={isActive ? "bold" : "500"} color={isActive ? "$background" : "$color12"} fontSize={13}>{p}</Text>
                </Button>
              );
            })}
          </XStack>
        </XStack>

        {/* Corpo */}
        <XStack gap="$5" alignItems="flex-start" flexWrap="wrap" $gtSm={{ flexWrap: "nowrap" }}>
          
          {/* Coluna Esquerda */}
          <YStack flex={2} gap="$5" minWidth={280}>
            <H2 color="$color12" size="$5" fontWeight="bold">Consultas Realizadas</H2>
            {meses.map((mesKey) => {
              const items = grupos[mesKey];
              const label = mesLabels[mesKey] ?? mesKey;
              return (
                <YStack key={mesKey} gap="$3">
                  <XStack alignItems="center" gap="$3">
                    <Text color="$color11" fontSize={12} fontWeight="bold" textTransform="uppercase" letterSpacing={1} flexShrink={0}>{label}</Text>
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

          {/* Coluna Direita */}
          <YStack flex={1} minWidth={240} gap="$4">
            
            {/* Linha do Tempo */}
            <Card cursor="pointer" animation="quick" borderWidth={1} backgroundColor="$color2" borderColor="$borderColor" borderRadius="$5" overflow="hidden" hoverStyle={{ backgroundColor: "$color3", borderColor: "$purple8" }}>
              <YStack height={3} backgroundColor="#a78bfa" />
              <YStack padding="$4" gap="$4">
                <Text color="$color11" fontSize={11} fontWeight="bold" letterSpacing={1} textTransform="uppercase">Linha do tempo</Text>
                <YStack gap="$0">
                  {timeline.slice(0, 8).map((item, idx) => {
                    const isLast = idx === timeline.length - 1;
                    return (
                      <XStack key={idx} gap="$3" alignItems="flex-start">
                        <YStack alignItems="center" width={14} flexShrink={0} marginTop="$1">
                          <Circle size={10} borderWidth={2} borderColor="$color2" backgroundColor="#a78bfa" zIndex={2} />
                          {!isLast && <YStack width={2} height={38} backgroundColor="$borderColor" marginTop={-2} zIndex={1} />}
                        </YStack>
                        <YStack flex={1} paddingBottom={isLast ? 0 : "$3"}>
                          <Text color="$color10" fontSize={11}>{item.data}</Text>
                          <Text color="$color12" fontSize={13} fontWeight="500">{item.descricao}</Text>
                          <Text color="$color11" fontSize={12}>{item.paciente}</Text>
                        </YStack>
                      </XStack>
                    );
                  })}
                </YStack>
                <Button size="$3" borderRadius="$4" borderWidth={1} borderColor="$borderColor" backgroundColor="transparent" hoverStyle={{ backgroundColor: "$color3" }} gap="$1">
                  <Text color="$color11" fontSize={13}>Ver histórico completo</Text>
                  <Text color="$color11"><ChevronDownIcon /></Text>
                </Button>
              </YStack>
            </Card>

            {/* Resumo Geral */}
            <Card cursor="pointer" animation="quick" borderWidth={1} backgroundColor="$color2" borderColor="$borderColor" borderRadius="$5" padding="$4" hoverStyle={{ backgroundColor: "$color3", borderColor: "$green8" }}>
              <Text color="$color11" fontSize={11} fontWeight="bold" letterSpacing={1} textTransform="uppercase" marginBottom="$3">Resumo Geral</Text>
              <YStack>
                {[
                  { label: "Total de atendimentos", value: String(historico.length), color: "$color12" },
                  { label: "Total recebido", value: `R$ ${totalPago.toLocaleString("pt-BR")}`, color: "#10b981" },
                  { label: "Pendentes de pagamento", value: String(pendentes), color: "#facc15" },
                  { label: "Reembolsados", value: String(historico.filter(c => c.statusPagamento === "reembolsado").length), color: "#a1a1aa" },
                ].map((item, i, arr) => (
                  <XStack key={i} justifyContent="space-between" alignItems="center" paddingVertical="$3" borderBottomWidth={i < arr.length - 1 ? 1 : 0} borderColor="$borderColor">
                    <Text color="$color11" fontSize={13}>{item.label}</Text>
                    <Text fontSize={14} fontWeight="bold" style={{ color: item.color as string }}>{item.value}</Text>
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
