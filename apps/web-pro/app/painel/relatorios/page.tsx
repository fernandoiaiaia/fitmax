//@ts-nocheck
"use client";

import { useRef, useState, useEffect, useCallback, useMemo } from "react";
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
  Input,
} from "tamagui";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ConsultaDia {
  id: number;
  data: string;       // "YYYY-MM-DD"
  horario: string;
  paciente: string;
  especialidade: string;
  modalidade: "Presencial" | "Online";
  valor: number;
  status: "realizada" | "cancelada";
}

// ─── Mock Data — consultas do mês ────────────────────────────────────────────

const consultasMock: ConsultaDia[] = [
  { id: 1,  data: "2026-04-23", horario: "09:00", paciente: "Fernanda Lima",     especialidade: "Cardiologia",        modalidade: "Presencial", valor: 350, status: "realizada" },
  { id: 2,  data: "2026-04-23", horario: "11:00", paciente: "Guilherme Augusto", especialidade: "Cardiologia",        modalidade: "Presencial", valor: 350, status: "realizada" },
  { id: 3,  data: "2026-04-23", horario: "13:00", paciente: "Mariana Ferreira",  especialidade: "Cardiologia",        modalidade: "Online",     valor: 280, status: "cancelada" },
  { id: 4,  data: "2026-04-23", horario: "15:30", paciente: "Ricardo Nunes",     especialidade: "Check-up Cardíaco",  modalidade: "Presencial", valor: 420, status: "realizada" },
  { id: 5,  data: "2026-04-22", horario: "09:00", paciente: "Beatriz Santos",    especialidade: "Cardiologia",        modalidade: "Online",     valor: 280, status: "realizada" },
  { id: 6,  data: "2026-04-22", horario: "11:30", paciente: "Carlos Eduardo",    especialidade: "Avaliação Cardíaca", modalidade: "Presencial", valor: 500, status: "realizada" },
  { id: 7,  data: "2026-04-21", horario: "10:00", paciente: "Lucas Mendes",      especialidade: "Check-up",           modalidade: "Presencial", valor: 420, status: "cancelada" },
  { id: 8,  data: "2026-04-20", horario: "14:00", paciente: "Ana Paula Ramos",   especialidade: "Cardiologia",        modalidade: "Online",     valor: 280, status: "realizada" },
  { id: 9,  data: "2026-04-19", horario: "09:30", paciente: "Thiago Oliveira",   especialidade: "Cardiologia",        modalidade: "Presencial", valor: 350, status: "realizada" },
  { id: 10, data: "2026-04-18", horario: "16:00", paciente: "Camila Torres",     especialidade: "Avaliação Cardíaca", modalidade: "Presencial", valor: 500, status: "realizada" },
  { id: 11, data: "2026-04-17", horario: "08:30", paciente: "Paulo Ramos",       especialidade: "Cardiologia",        modalidade: "Presencial", valor: 350, status: "realizada" },
  { id: 12, data: "2026-04-16", horario: "10:00", paciente: "Sofia Mendes",      especialidade: "Cardiologia",        modalidade: "Online",     valor: 280, status: "cancelada" },
  { id: 13, data: "2026-04-15", horario: "14:30", paciente: "Roberto Lima",      especialidade: "Check-up Cardíaco",  modalidade: "Presencial", valor: 420, status: "realizada" },
  { id: 14, data: "2026-04-14", horario: "11:00", paciente: "Lara Cardoso",      especialidade: "Cardiologia",        modalidade: "Online",     valor: 280, status: "realizada" },
  { id: 15, data: "2026-04-10", horario: "09:00", paciente: "Diego Souza",       especialidade: "Avaliação Cardíaca", modalidade: "Presencial", valor: 500, status: "realizada" },
];

// ─── Icons ────────────────────────────────────────────────────────────────────

const CalIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
);
const TrendUpIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>
);
const MoneyIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
);
const CheckCircleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
);
const XCircleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
);
const ClockIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
);
const UserIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function useOutsideClick(ref: React.RefObject<HTMLElement>, cb: () => void) {
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) cb();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, cb]);
}

const TODAY = "2026-04-23";

function formatCurrency(val: number) {
  return `R$ ${val.toLocaleString("pt-BR")}`;
}

function formatDateBR(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, accent = false }: { icon: React.ReactNode; label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <Card cursor="pointer" animation="quick" flex={1} minWidth={200} borderWidth={1} backgroundColor="$color2" borderColor={accent ? "$green5" : "$borderColor"} borderRadius="$5" padding="$4" hoverStyle={{ backgroundColor: "$color3", borderColor: accent ? "$green7" : "$green5" }}>
      <XStack alignItems="center" gap="$3" marginBottom="$2">
        <Circle size="$3" backgroundColor={accent ? "rgba(16,185,129,0.15)" : "$color4"}>
          {icon}
        </Circle>
        <Text color="$color11" fontSize={12} fontWeight="bold" textTransform="uppercase">{label}</Text>
      </XStack>
      <Text color="$color12" fontSize={24} fontWeight="bold">{value}</Text>
      {sub && <Text color="$color10" fontSize={11} marginTop="$1">{sub}</Text>}
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const PRESETS = ["Hoje", "7 dias", "15 dias", "Mês", "Personalizado"];

export default function RelatoriosPage() {
  const [preset, setPreset] = useState("Mês");
  const [dataInicio, setDataInicio] = useState("2026-04-01");
  const [dataFim, setDataFim] = useState(TODAY);

  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const headerMenuRef = useRef<HTMLDivElement>(null);
  useOutsideClick(headerMenuRef, useCallback(() => setHeaderMenuOpen(false), []));

  function applyPreset(p: string) {
    setPreset(p);
    const today = new Date(TODAY);
    if (p === "Hoje") {
      setDataInicio(TODAY); setDataFim(TODAY);
    } else if (p === "7 dias") {
      const d = new Date(today); d.setDate(d.getDate() - 6);
      setDataInicio(d.toISOString().slice(0, 10)); setDataFim(TODAY);
    } else if (p === "15 dias") {
      const d = new Date(today); d.setDate(d.getDate() - 14);
      setDataInicio(d.toISOString().slice(0, 10)); setDataFim(TODAY);
    } else if (p === "Mês") {
      setDataInicio("2026-04-01"); setDataFim(TODAY);
    }
  }

  const filtered = useMemo(() =>
    consultasMock.filter((c) => c.data >= dataInicio && c.data <= dataFim),
    [dataInicio, dataFim]
  );

  const realizadas   = filtered.filter((c) => c.status === "realizada");
  const canceladas   = filtered.filter((c) => c.status === "cancelada");
  const faturamento  = realizadas.reduce((s, c) => s + c.valor, 0);
  const lucroLiquido = Math.round(faturamento * 0.72);
  const ticketMedio  = realizadas.length > 0 ? Math.round(faturamento / realizadas.length) : 0;
  const taxaCancelamento = filtered.length > 0 ? Math.round((canceladas.length / filtered.length) * 100) : 0;

  const hoje         = consultasMock.filter((c) => c.data === TODAY);
  const hojeFeit     = hoje.filter((c) => c.status === "realizada");
  const hojeCanc     = hoje.filter((c) => c.status === "cancelada");

  const porEspecialidade = realizadas.reduce<Record<string, number>>((acc, c) => {
    acc[c.especialidade] = (acc[c.especialidade] ?? 0) + c.valor;
    return acc;
  }, {});
  const maxEsp = Math.max(...Object.values(porEspecialidade), 1);

  const presencial = realizadas.filter((c) => c.modalidade === "Presencial").length;
  const online     = realizadas.filter((c) => c.modalidade === "Online").length;
  const totalMod   = presencial + online;

  return (
    <ScrollView flex={1} backgroundColor="$background" showsVerticalScrollIndicator={false}>
      <YStack padding="$4" $gtSm={{ padding: "$6" }} gap="$5" maxWidth={1200} marginHorizontal="auto" width="100%">
        
        {/* Cabeçalho */}
        <XStack className="pro-page-header" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap="$3">
          <YStack gap="$1">
            <H2 color="$color12" size="$6" fontWeight="bold">Relatórios</H2>
            <Text color="$color11" fontSize={14}>Acompanhe o desempenho financeiro e operacional do período.</Text>
          </YStack>
        </XStack>

        {/* Filtro de Período */}
        <XStack flexWrap="wrap" gap="$4" alignItems="center" backgroundColor="$color2" padding="$3" borderRadius="$5" borderWidth={1} borderColor="$borderColor">
          {/* Desktop Presets */}
          <div className="pro-filter-desktop">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <XStack gap="$2" paddingBottom={2}>
                {PRESETS.map((p) => {
                  const isActive = preset === p;
                  return (
                    <Button key={p} size="$3" borderRadius="$10" borderWidth={1} animation="quick"
                      borderColor={isActive ? "$green8" : "$borderColor"}
                      backgroundColor={isActive ? "rgba(16,185,129,0.1)" : "transparent"}
                      onPress={() => applyPreset(p)}
                      hoverStyle={{ backgroundColor: "$color3", borderColor: "$green8" }}
                      paddingHorizontal="$4">
                      <Text fontWeight={isActive ? "bold" : "500"} color={isActive ? "#10b981" : "$color11"} fontSize={13}>{p}</Text>
                    </Button>
                  );
                })}
              </XStack>
            </ScrollView>
          </div>

          {/* Mobile Presets */}
          <div className="pro-filter-mobile" ref={headerMenuRef} style={{ position: "relative" }}>
            <button className="pro-filter-dropdown-btn" onClick={() => setHeaderMenuOpen(v => !v)}>
              Período: {preset}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ transform: headerMenuOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {headerMenuOpen && (
              <div className="pro-filter-dropdown-menu" style={{ left: 0, right: "auto", minWidth: 160 }}>
                 {PRESETS.map((p) => (
                   <div key={p} className={`pro-filter-dropdown-item${preset === p ? " active" : ""}`}
                     onClick={() => { applyPreset(p); setHeaderMenuOpen(false); }}>
                     {preset === p && <span style={{ marginRight: 6 }}>✓</span>}{p}
                   </div>
                 ))}
              </div>
            )}
          </div>

          <Separator vertical borderColor="$borderColor" height={30} $sm={{ display: 'none' }} />

          <XStack gap="$3" alignItems="center" flexWrap="wrap">
             <XStack alignItems="center" gap="$2">
                <Text color="$color11"><CalIcon /></Text>
                <Text color="$color11" fontSize={12}>De</Text>
                <Input size="$3" type="date" value={dataInicio} max={dataFim} onChange={(e) => { setDataInicio(e.target.value); setPreset("Personalizado"); }} backgroundColor="$background" borderWidth={1} borderColor="$borderColor" color="$color12" textAlign="center" />
             </XStack>
             <Text color="$color10">—</Text>
             <XStack alignItems="center" gap="$2">
                <Text color="$color11"><CalIcon /></Text>
                <Text color="$color11" fontSize={12}>Até</Text>
                <Input size="$3" type="date" value={dataFim} min={dataInicio} max={TODAY} onChange={(e) => { setDataFim(e.target.value); setPreset("Personalizado"); }} backgroundColor="$background" borderWidth={1} borderColor="$borderColor" color="$color12" textAlign="center" />
             </XStack>
          </XStack>
        </XStack>

        {/* ── Grid principal ── */}
        <XStack gap="$5" alignItems="flex-start" flexWrap="wrap" $gtSm={{ flexWrap: "nowrap" }}>
          
          {/* Coluna Esquerda */}
          <YStack flex={2} gap="$6" minWidth={280}>
            
            {/* Resumo Financeiro */}
            <YStack gap="$3">
              <H2 color="$color12" size="$5" fontWeight="bold">Resumo Financeiro</H2>
              <Text color="$color11" fontSize={12}>{formatDateBR(dataInicio)} — {formatDateBR(dataFim)}</Text>
              
              <XStack className="pro-stat-grid" flexWrap="wrap" gap="$3">
                <StatCard icon={<TrendUpIcon />} label="Faturamento Total" value={formatCurrency(faturamento)} sub={`${realizadas.length} consultas realizadas`} accent />
                <StatCard icon={<MoneyIcon />} label="Lucro Líquido" value={formatCurrency(lucroLiquido)} sub="72% do faturamento bruto" accent />
                <StatCard icon={<CheckCircleIcon />} label="Ticket Médio" value={formatCurrency(ticketMedio)} sub="por consulta realizada" />
                <StatCard icon={<XCircleIcon />} label="Taxa Cancelamento" value={`${taxaCancelamento}%`} sub={`${canceladas.length} consultas canceladas`} />
              </XStack>
            </YStack>

            {/* Operação do Dia */}
            <YStack gap="$3">
              <H2 color="$color12" size="$5" fontWeight="bold">Operação do Dia</H2>
              <Text color="$color11" fontSize={12}>Hoje, {formatDateBR(TODAY)}</Text>

              <XStack flexWrap="wrap" gap="$3" $sm={{ flexDirection: "column" }}>
                <Card cursor="pointer" animation="quick" flex={1} minWidth={200} borderWidth={1} backgroundColor="rgba(16,185,129,0.05)" borderColor="rgba(16,185,129,0.3)" borderRadius="$4" padding="$4" hoverStyle={{ backgroundColor: "rgba(16,185,129,0.1)", borderColor: "#10b981" }}>
                  <XStack alignItems="center" gap="$3" marginBottom="$2">
                    <Circle size="$3" backgroundColor="rgba(16,185,129,0.15)">
                      <CheckCircleIcon />
                    </Circle>
                    <Text color="#10b981" fontSize={13} fontWeight="bold">Realizadas</Text>
                  </XStack>
                  <Text color="#10b981" fontSize={24} fontWeight="bold">{hojeFeit.length}</Text>
                  <Text color="#10b981" opacity={0.8} fontSize={11}>de {hoje.length} agendadas</Text>
                </Card>

                <Card cursor="pointer" animation="quick" flex={1} minWidth={200} borderWidth={1} backgroundColor="rgba(239,68,68,0.05)" borderColor="rgba(239,68,68,0.3)" borderRadius="$4" padding="$4" hoverStyle={{ backgroundColor: "rgba(239,68,68,0.1)", borderColor: "#ef4444" }}>
                  <XStack alignItems="center" gap="$3" marginBottom="$2">
                    <Circle size="$3" backgroundColor="rgba(239,68,68,0.15)">
                      <XCircleIcon />
                    </Circle>
                    <Text color="#ef4444" fontSize={13} fontWeight="bold">Canceladas</Text>
                  </XStack>
                  <Text color="#ef4444" fontSize={24} fontWeight="bold">{hojeCanc.length}</Text>
                  <Text color="#ef4444" opacity={0.8} fontSize={11}>taxa: {hoje.length > 0 ? Math.round((hojeCanc.length / hoje.length) * 100) : 0}%</Text>
                </Card>
              </XStack>

              {/* Lista do Dia */}
              {hoje.length > 0 && (
                <Card cursor="pointer" animation="quick" borderWidth={1} backgroundColor="$color2" borderColor="$borderColor" borderRadius="$4" overflow="hidden" marginTop="$2" hoverStyle={{ backgroundColor: "$color3", borderColor: "$green8" }}>
                  {hoje.map((c, i) => (
                    <XStack key={c.id} alignItems="center" padding="$3" borderBottomWidth={i < hoje.length - 1 ? 1 : 0} borderColor="$borderColor" flexWrap="wrap" gap="$3">
                      <XStack width={80} gap="$2" alignItems="center">
                         <Text color="$color11"><ClockIcon /></Text>
                         <Text color="$color12" fontSize={13}>{c.horario}</Text>
                      </XStack>
                      <YStack flex={1} minWidth={150}>
                         <XStack alignItems="center" gap="$2">
                           <Text color="$color11"><UserIcon /></Text>
                           <Text color="$color12" fontSize={14} fontWeight="bold">{c.paciente}</Text>
                         </XStack>
                         <Text color="$color11" fontSize={12} marginLeft={18}>{c.especialidade} · {c.modalidade}</Text>
                      </YStack>
                      <XStack alignItems="center" gap="$3" minWidth={120} justifyContent="flex-end">
                         <Text color="$color12" fontSize={14} fontWeight="bold">{formatCurrency(c.valor)}</Text>
                         <XStack paddingHorizontal="$2" paddingVertical="$1" borderRadius="$10" backgroundColor={c.status === "realizada" ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)"}>
                           <Text color={c.status === "realizada" ? "#10b981" : "#ef4444"} fontSize={10} fontWeight="bold">
                             {c.status === "realizada" ? "Realizada" : "Cancelada"}
                           </Text>
                         </XStack>
                      </XStack>
                    </XStack>
                  ))}
                </Card>
              )}
            </YStack>
          </YStack>

          {/* Coluna Direita (Sidebar) */}
          <YStack flex={1} minWidth={260} gap="$4">
            
            {/* Especialidade */}
            <Card cursor="pointer" animation="quick" borderWidth={1} backgroundColor="$color2" borderColor="$borderColor" borderRadius="$5" padding="$4" hoverStyle={{ backgroundColor: "$color3", borderColor: "$green8" }}>
               <Text color="$color11" fontSize={11} fontWeight="bold" letterSpacing={1} textTransform="uppercase" marginBottom="$4">Faturamento por Especialidade</Text>
               <YStack gap="$3">
                 {Object.entries(porEspecialidade).sort(([, a], [, b]) => b - a).map(([esp, val]) => (
                   <YStack key={esp} gap="$1">
                     <XStack justifyContent="space-between">
                       <Text color="$color12" fontSize={13}>{esp}</Text>
                       <Text color="$color12" fontSize={13} fontWeight="bold">{formatCurrency(val)}</Text>
                     </XStack>
                     <YStack height={6} backgroundColor="$color4" borderRadius="$10" overflow="hidden">
                       <YStack height="100%" backgroundColor="#10b981" width={`${Math.min((val / maxEsp) * 100, 100)}%`} />
                     </YStack>
                   </YStack>
                 ))}
               </YStack>
            </Card>

            {/* Modalidade */}
            <Card cursor="pointer" animation="quick" borderWidth={1} backgroundColor="$color2" borderColor="$borderColor" borderRadius="$5" padding="$4" hoverStyle={{ backgroundColor: "$color3", borderColor: "$green8" }}>
               <Text color="$color11" fontSize={11} fontWeight="bold" letterSpacing={1} textTransform="uppercase" marginBottom="$4">Modalidade de Atendimento</Text>
               <XStack justifyContent="space-between" marginBottom="$3">
                  <YStack>
                    <XStack alignItems="center" gap="$2"><Circle size={8} backgroundColor="#10b981" /><Text color="$color11" fontSize={12}>Presencial</Text></XStack>
                    <Text color="$color12" fontSize={18} fontWeight="bold">{presencial}</Text>
                    <Text color="$color10" fontSize={11}>{totalMod > 0 ? Math.round((presencial / totalMod) * 100) : 0}%</Text>
                  </YStack>
                  <YStack>
                    <XStack alignItems="center" gap="$2"><Circle size={8} backgroundColor="#60a5fa" /><Text color="$color11" fontSize={12}>Online</Text></XStack>
                    <Text color="$color12" fontSize={18} fontWeight="bold">{online}</Text>
                    <Text color="$color10" fontSize={11}>{totalMod > 0 ? Math.round((online / totalMod) * 100) : 0}%</Text>
                  </YStack>
               </XStack>
               <XStack height={8} borderRadius="$10" overflow="hidden" width="100%">
                 <YStack height="100%" backgroundColor="#10b981" width={`${totalMod > 0 ? (presencial / totalMod) * 100 : 50}%`} />
                 <YStack height="100%" backgroundColor="#60a5fa" width={`${totalMod > 0 ? (online / totalMod) * 100 : 50}%`} />
               </XStack>
            </Card>

            {/* Resumo */}
            <Card cursor="pointer" animation="quick" borderWidth={1} backgroundColor="$color2" borderColor="$borderColor" borderRadius="$5" padding="$4" hoverStyle={{ backgroundColor: "$color3", borderColor: "$green8" }}>
               <Text color="$color11" fontSize={11} fontWeight="bold" letterSpacing={1} textTransform="uppercase" marginBottom="$3">Período Selecionado</Text>
               <YStack gap="$2">
                 {[
                   { label: "Consultas no período", value: String(filtered.length), color: "$color12" },
                   { label: "Realizadas", value: String(realizadas.length), color: "#10b981" },
                   { label: "Canceladas", value: String(canceladas.length), color: "#f87171" },
                   { label: "Faturamento bruto", value: formatCurrency(faturamento), color: "#10b981" },
                   { label: "Lucro líquido", value: formatCurrency(lucroLiquido), color: "#10b981" },
                 ].map((item, i) => (
                   <XStack key={i} justifyContent="space-between" alignItems="center" paddingVertical="$2" borderBottomWidth={i < 4 ? 1 : 0} borderColor="$borderColor">
                     <Text color="$color11" fontSize={13}>{item.label}</Text>
                     <Text color={item.color as any} fontSize={13} fontWeight="bold">{item.value}</Text>
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
