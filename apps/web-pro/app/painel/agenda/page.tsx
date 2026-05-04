//@ts-nocheck
"use client";

import { useState, useMemo } from "react";
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
  ZStack,
} from "tamagui";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Consulta {
  id: number;
  hora: string;
  duracao: number;
  paciente: string;
  avatar: string;
  especialidade: string;
  modalidade: "Presencial" | "Online";
  status: "confirmada" | "pendente" | "em_andamento";
}

interface HorarioConfig {
  hora: string;
  disponivel: boolean;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const HORARIOS_DIA: HorarioConfig[] = [
  { hora: "08:00", disponivel: false },
  { hora: "09:00", disponivel: true  },
  { hora: "10:00", disponivel: true  },
  { hora: "11:00", disponivel: true  },
  { hora: "12:00", disponivel: false },
  { hora: "13:00", disponivel: false },
  { hora: "14:00", disponivel: true  },
  { hora: "15:00", disponivel: true  },
  { hora: "16:00", disponivel: true  },
  { hora: "17:00", disponivel: false },
  { hora: "18:00", disponivel: false },
];

const consultasPorDia: Record<string, Consulta[]> = {
  "2026-04-23": [
    { id: 1,  hora: "09:00", duracao: 1,   paciente: "Fernanda Lima",    avatar: "https://picsum.photos/200/200?random=41", especialidade: "Cardiologia",        modalidade: "Presencial", status: "confirmada"  },
    { id: 2,  hora: "11:00", duracao: 1,   paciente: "Guilherme Augusto",avatar: "https://picsum.photos/200/200?random=30", especialidade: "Check-up",           modalidade: "Presencial", status: "em_andamento"},
    { id: 3,  hora: "14:00", duracao: 1,   paciente: "Ricardo Nunes",    avatar: "https://picsum.photos/200/200?random=45", especialidade: "Avaliação Cardíaca", modalidade: "Presencial", status: "pendente"    },
    { id: 4,  hora: "16:00", duracao: 1,   paciente: "Beatriz Santos",   avatar: "https://picsum.photos/200/200?random=46", especialidade: "Cardiologia",        modalidade: "Online",     status: "confirmada"  },
  ],
  "2026-04-24": [
    { id: 5,  hora: "09:00", duracao: 1,   paciente: "Lucas Mendes",     avatar: "https://picsum.photos/200/200?random=32", especialidade: "Check-up",           modalidade: "Presencial", status: "confirmada"  },
    { id: 6,  hora: "10:00", duracao: 1,   paciente: "Ana Paula Ramos",  avatar: "https://picsum.photos/200/200?random=48", especialidade: "Cardiologia",        modalidade: "Online",     status: "confirmada"  },
    { id: 7,  hora: "15:00", duracao: 1,   paciente: "Thiago Oliveira",  avatar: "https://picsum.photos/200/200?random=49", especialidade: "Cardiologia",        modalidade: "Presencial", status: "pendente"    },
  ],
};

const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

const STATUS_CONFIG = {
  confirmada:   { label: "Confirmada",   bg: "rgba(16,185,129,0.12)",  color: "#10b981", border: "rgba(16,185,129,0.3)",  dot: "#10b981" },
  pendente:     { label: "Pendente",     bg: "rgba(234,179,8,0.12)",   color: "#facc15", border: "rgba(234,179,8,0.3)",   dot: "#facc15" },
  em_andamento: { label: "Em andamento", bg: "rgba(59,130,246,0.12)",  color: "#60a5fa", border: "rgba(59,130,246,0.3)",  dot: "#60a5fa" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TODAY = new Date("2026-04-23T12:00:00-03:00"); // forçando fuso para evitar bugs de toISOString

function toISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function formatDiaSemana(d: Date) {
  return d.toLocaleDateString("pt-BR", { weekday: "long" });
}

function formatDataCompleta(d: Date) {
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const ChevronLeft = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
);
const ChevronRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
);
const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
);
const SettingsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
);
const VideoIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" /></svg>
);
const MapPinIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
);
const ChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
);

// ─── Consulta Card ────────────────────────────────────────────────────────────

function ConsultaCard({ c }: { c: Consulta }) {
  const st = STATUS_CONFIG[c.status];
  return (
    <Card cursor="pointer" animation="quick" flex={1} borderWidth={1} backgroundColor="$color2" borderColor="$borderColor" borderRadius="$4" overflow="hidden" hoverStyle={{ backgroundColor: "$color3", borderColor: st.dot }}>
      <XStack height="100%">
        <YStack width={4} backgroundColor={st.dot} />
        <YStack flex={1} padding="$3" gap="$3">
          <XStack justifyContent="space-between" alignItems="center">
            <XStack gap="$3" alignItems="center">
              <Avatar circular size="$3" backgroundColor="$color4" borderWidth={1} borderColor="$borderColor">
                 <Avatar.Image src={c.avatar} />
              </Avatar>
              <YStack>
                 <Text color="$color12" fontSize={14} fontWeight="bold">{c.paciente}</Text>
                 <Text color="$color11" fontSize={12}>{c.especialidade}</Text>
              </YStack>
            </XStack>
            <XStack paddingHorizontal="$2" paddingVertical="$1" borderRadius="$10" borderWidth={1} backgroundColor={st.bg} borderColor={st.border}>
               <Text color={st.color} fontSize={10} fontWeight="bold">{st.label}</Text>
            </XStack>
          </XStack>
          
          <XStack gap="$3" alignItems="center">
             <XStack alignItems="center" gap="$1" backgroundColor="$color3" paddingHorizontal="$2" paddingVertical="$1" borderRadius="$2">
                <Text color="$color11">{c.modalidade === "Online" ? <VideoIcon /> : <MapPinIcon />}</Text>
                <Text color="$color11" fontSize={11}>{c.modalidade}</Text>
             </XStack>
             <Text color="$color10" fontSize={11}>{c.hora} · {c.duracao}h</Text>
          </XStack>
        </YStack>
      </XStack>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AgendaPage() {
  const [currentDate, setCurrentDate]     = useState(TODAY);
  const [mesDropdown, setMesDropdown]     = useState(false);
  const [showNovaConsulta, setShowNova]   = useState(false);

  const iso = toISO(currentDate);
  const consultasHoje = consultasPorDia[iso] ?? [];

  const consultasPorHora = useMemo(() => {
    const m: Record<string, Consulta> = {};
    for (const c of consultasHoje) m[c.hora] = c;
    return m;
  }, [consultasHoje]);

  function prevDay() { setCurrentDate((d) => addDays(d, -1)); }
  function nextDay() { setCurrentDate((d) => addDays(d, 1));  }

  const isToday = toISO(currentDate) === toISO(TODAY);

  return (
    <ScrollView flex={1} backgroundColor="$background" showsVerticalScrollIndicator={false}>
      <YStack padding="$4" $gtSm={{ padding: "$6" }} gap="$5" maxWidth={1200} marginHorizontal="auto" width="100%" position="relative">
        
        {/* ── Toolbar ── */}
        <XStack justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="$4">
          <YStack>
            <H2 color="$color12" size="$6" fontWeight="bold">Agenda</H2>
            <Text color="$color11" fontSize={14} textTransform="capitalize">{formatDiaSemana(currentDate)}</Text>
          </YStack>
          <XStack gap="$3">
            <Button size="$3" backgroundColor="$color3" borderWidth={1} borderColor="$borderColor" color="$color12" icon={<SettingsIcon />}>
              Configurações
            </Button>
            <Button size="$3" backgroundColor="$green9" color="white" hoverStyle={{ backgroundColor: "$green10" }} fontWeight="bold" icon={<PlusIcon />} onPress={() => setShowNova(true)}>
              Nova Consulta
            </Button>
          </XStack>
        </XStack>

        {/* ── Nav Bar ── */}
        <XStack justifyContent="space-between" alignItems="center" backgroundColor="$color2" padding="$3" borderRadius="$5" borderWidth={1} borderColor="$borderColor" flexWrap="wrap" gap="$3">
          
          <XStack gap="$3" alignItems="center">
            <Avatar circular size="$3" backgroundColor="$color4">
              <Avatar.Image src="https://picsum.photos/200/200?random=30" />
            </Avatar>
            <YStack $sm={{ display: "none" }}>
              <Text color="$color12" fontSize={14} fontWeight="bold">Dr. Rafael Costa</Text>
              <Text color="$color11" fontSize={12}>Cardiologista · CRM 54321</Text>
            </YStack>
          </XStack>

          <XStack alignItems="center" gap="$4">
            <Button size="$3" circular chromeless icon={<ChevronLeft />} onPress={prevDay} />
            <YStack alignItems="center">
               {isToday && (
                 <XStack backgroundColor="$green5" paddingHorizontal="$2" paddingVertical={2} borderRadius="$10" marginBottom={2}>
                    <Text color="$green10" fontSize={10} fontWeight="bold">Hoje</Text>
                 </XStack>
               )}
               <Text color="$color12" fontSize={15} fontWeight="bold">{formatDataCompleta(currentDate)}</Text>
            </YStack>
            <Button size="$3" circular chromeless icon={<ChevronRight />} onPress={nextDay} />
          </XStack>

          <YStack position="relative">
             <Button size="$3" backgroundColor="$color3" borderWidth={1} borderColor="$borderColor" color="$color12" onPress={() => setMesDropdown(!mesDropdown)} iconAfter={<ChevronDown />}>
               {MESES[currentDate.getMonth()]} {currentDate.getFullYear()}
             </Button>

             {mesDropdown && (
               <Card cursor="pointer" animation="quick" position="absolute" top={45} right={0} zIndex={50} width={200} backgroundColor="$color2" borderWidth={1} borderColor="$borderColor" padding="$2" elevation={10}>
                 {MESES.map((mes, idx) => (
                   <Button key={mes} chromeless justifyContent="flex-start" color={currentDate.getMonth() === idx ? "$green10" : "$color12"} fontWeight={currentDate.getMonth() === idx ? "bold" : "normal"} onPress={() => {
                     const d = new Date(currentDate);
                     d.setMonth(idx);
                     setCurrentDate(d);
                     setMesDropdown(false);
                   }}>
                     {mes}
                   </Button>
                 ))}
               </Card>
             )}
          </YStack>

        </XStack>

        {/* ── Corpo ── */}
        <XStack gap="$5" alignItems="flex-start" flexWrap="wrap" $gtSm={{ flexWrap: "nowrap" }}>
          
          {/* Timeline */}
          <YStack flex={2} minWidth={300} backgroundColor="$color2" borderRadius="$5" borderWidth={1} borderColor="$borderColor" overflow="hidden">
            <YStack>
               {HORARIOS_DIA.map((h, i) => {
                 const consulta = consultasPorHora[h.hora];
                 return (
                   <XStack key={h.hora} borderBottomWidth={i < HORARIOS_DIA.length - 1 ? 1 : 0} borderColor="$borderColor">
                     <YStack width={80} alignItems="center" paddingVertical="$4" borderRightWidth={1} borderColor="$borderColor" backgroundColor="$background">
                       <Text color="$color11" fontSize={14} fontWeight="bold">{h.hora}</Text>
                     </YStack>
                     <YStack flex={1} padding="$2" justifyContent="center" minHeight={80}>
                        {consulta ? (
                          <ConsultaCard c={consulta} />
                        ) : h.disponivel ? (
                          <Button size="$3" borderWidth={1} borderStyle="dashed" borderColor="$borderColor" backgroundColor="transparent" hoverStyle={{ backgroundColor: "$color3", borderColor: "$color8" }} onPress={() => setShowNova(true)} width="100%" justifyContent="center" gap="$2">
                             <Circle size={6} backgroundColor="$color8" />
                             <Text color="$color10" fontSize={13}>Horário disponível</Text>
                          </Button>
                        ) : (
                          <YStack flex={1} backgroundColor="rgba(0,0,0,0.1)" borderRadius="$3" />
                        )}
                     </YStack>
                   </XStack>
                 );
               })}
            </YStack>
          </YStack>

          {/* Sidebar */}
          <YStack flex={1} minWidth={260} gap="$4">
             
             {/* Stats */}
             <Card cursor="pointer" animation="quick" borderWidth={1} backgroundColor="$color2" borderColor="$borderColor" borderRadius="$5" padding="$4" hoverStyle={{ backgroundColor: "$color3", borderColor: "$green8" }}>
               <Text color="$color11" fontSize={11} fontWeight="bold" letterSpacing={1} textTransform="uppercase" marginBottom="$3">Resumo do Dia</Text>
               <YStack gap="$2">
                 {[
                   { label: "Confirmadas",   value: consultasHoje.filter((c) => c.status === "confirmada").length,   color: "#10b981" },
                   { label: "Pendentes",     value: consultasHoje.filter((c) => c.status === "pendente").length,     color: "#facc15" },
                   { label: "Em andamento",  value: consultasHoje.filter((c) => c.status === "em_andamento").length, color: "#60a5fa" },
                   { label: "Disponíveis",   value: HORARIOS_DIA.filter((h) => h.disponivel && !consultasPorHora[h.hora]).length, color: "#a1a1aa" },
                 ].map((s, i) => (
                   <XStack key={i} justifyContent="space-between" alignItems="center" paddingVertical="$2" borderBottomWidth={i < 3 ? 1 : 0} borderColor="$borderColor">
                      <XStack alignItems="center" gap="$2">
                         <Circle size={8} backgroundColor={s.color} />
                         <Text color="$color12" fontSize={13}>{s.label}</Text>
                      </XStack>
                      <Text color={s.color as any} fontSize={14} fontWeight="bold">{s.value}</Text>
                   </XStack>
                 ))}
               </YStack>
             </Card>

             {/* Próximas */}
             {consultasHoje.length > 0 && (
               <Card cursor="pointer" animation="quick" borderWidth={1} backgroundColor="$color2" borderColor="$borderColor" borderRadius="$5" padding="$4" hoverStyle={{ backgroundColor: "$color3", borderColor: "$green8" }}>
                 <Text color="$color11" fontSize={11} fontWeight="bold" letterSpacing={1} textTransform="uppercase" marginBottom="$3">Consultas do Dia</Text>
                 <YStack gap="$3">
                   {consultasHoje.map((c) => {
                     const st = STATUS_CONFIG[c.status];
                     return (
                       <XStack key={c.id} alignItems="center" gap="$3">
                         <Circle size={8} backgroundColor={st.dot} />
                         <YStack flex={1}>
                            <Text color="$color10" fontSize={11}>{c.hora}</Text>
                            <Text color="$color12" fontSize={13} fontWeight="bold">{c.paciente}</Text>
                            <Text color="$color11" fontSize={11}>{c.especialidade}</Text>
                         </YStack>
                         <Avatar circular size="$3" backgroundColor="$color4">
                           <Avatar.Image src={c.avatar} />
                         </Avatar>
                       </XStack>
                     );
                   })}
                 </YStack>
               </Card>
             )}

          </YStack>

        </XStack>
      </YStack>

      {/* Modal Nova Consulta (Simulada via ZStack na raiz) */}
      {showNovaConsulta && (
        <ZStack position="absolute" top={0} left={0} right={0} bottom={0} zIndex={100} alignItems="center" justifyContent="flex-start" paddingTop={80}>
           {/* Overlay */}
           <YStack position="absolute" top={0} left={0} right={0} bottom={0} backgroundColor="rgba(0,0,0,0.6)" onPress={() => setShowNova(false)} />
           
           {/* Modal Content */}
           <Card cursor="pointer" animation="quick" width={400} backgroundColor="$color2" borderWidth={1} borderColor="$borderColor" borderRadius="$5" elevation={20}>
             <XStack justifyContent="space-between" alignItems="center" padding="$4" borderBottomWidth={1} borderColor="$borderColor">
               <H2 color="$color12" size="$5" fontWeight="bold">Nova Consulta</H2>
               <Button size="$2" circular chromeless onPress={() => setShowNova(false)}>✕</Button>
             </XStack>
             
             <YStack padding="$4" gap="$4">
               <YStack gap="$2">
                 <Text color="$color11" fontSize={13}>Paciente</Text>
                 <Input size="$3" placeholder="Buscar paciente..." backgroundColor="$background" borderColor="$borderColor" />
               </YStack>
               <XStack gap="$3">
                 <YStack flex={1} gap="$2">
                   <Text color="$color11" fontSize={13}>Data</Text>
                   <Input type="date" size="$3" defaultValue={iso} backgroundColor="$background" borderColor="$borderColor" color="$color12" />
                 </YStack>
                 <YStack flex={1} gap="$2">
                   <Text color="$color11" fontSize={13}>Horário</Text>
                   <Input size="$3" placeholder="Ex: 09:00" backgroundColor="$background" borderColor="$borderColor" />
                 </YStack>
               </XStack>
               <YStack gap="$2">
                 <Text color="$color11" fontSize={13}>Especialidade</Text>
                 <Input size="$3" placeholder="Ex: Cardiologia" backgroundColor="$background" borderColor="$borderColor" />
               </YStack>
             </YStack>

             <XStack justifyContent="flex-end" padding="$4" borderTopWidth={1} borderColor="$borderColor" gap="$3">
               <Button size="$3" backgroundColor="transparent" color="$color11" onPress={() => setShowNova(false)}>Cancelar</Button>
               <Button size="$3" backgroundColor="$green9" color="white" hoverStyle={{ backgroundColor: "$green10" }} fontWeight="bold" onPress={() => setShowNova(false)}>Agendar</Button>
             </XStack>
           </Card>
        </ZStack>
      )}

    </ScrollView>
  );
}
