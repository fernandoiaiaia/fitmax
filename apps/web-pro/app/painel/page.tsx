//@ts-nocheck
"use client";

import Link from "next/link";
import {
  Card,
  Avatar,
  Text,
  H2,
  XStack,
  YStack,
  Circle,
  Image,
} from "tamagui";

// Mock Data adaptado para o Pro
const consultasMock = [
  { id: 1, paciente: "Guilherme Augusto", tipo: "Presencial", data: "Hoje, 11:00", avatar: "https://picsum.photos/200/200?random=30", color: "$yellow4", colorText: "$yellow10" },
  { id: 2, paciente: "Mariana Ferreira", tipo: "Online", data: "Hoje, 13:00", avatar: "https://picsum.photos/200/200?random=31", color: "$green4", colorText: "$green10" },
  { id: 3, paciente: "Lucas Mendes", tipo: "Presencial", data: "Amanhã, 09:00", avatar: "https://picsum.photos/200/200?random=32", color: "$blue4", colorText: "$blue10" },
];

const agendaMock = [
  { id: 1, titulo: "Reunião de Equipe", horario: "09:00 – 10:00", color: "$purple9", time: "Hoje" },
  { id: 2, titulo: "Avaliação Cardiológica", horario: "14:00 – 15:30", color: "$green9", time: "Em breve" },
];

const feedThumbnails = [
  "/feed_cardiology.png",
  "/feed_workout.png",
  "/feed_nutrition.png",
  "/feed_running.png",
];

export default function PainelPage() {
  return (
    <YStack flex={1} backgroundColor="$background" padding="$3" $gtSm={{ padding: "$4" }} gap="$3" width="100%">
      
      <H2 color="$color12" size="$5" fontWeight="bold">Sua Visão Geral</H2>
      
      <XStack flex={1} flexDirection="column" $gtMd={{ flexDirection: "row" }} gap="$3" width="100%">
        
        {/* LEFT COLUMN: Feed Widget (60%) */}
        <YStack flex={1} $gtMd={{ flex: 1.5 }} height="100%">
          <Link href="/painel/feed" style={{ textDecoration: 'none', display: 'flex', flex: 1 }}>
            <Card cursor="pointer" animation="quick" width="100%" flex={1} borderWidth={1} backgroundColor="$color2" borderColor="$borderColor" hoverStyle={{ backgroundColor: "$color3", borderColor: "$green8" }}  overflow="hidden">
              <Card.Header padding="$4" paddingBottom={0}>
                <XStack justifyContent="space-between" alignItems="center">
                  <YStack>
                    <H2 size="$4" fontWeight="bold" color="$color12">Destaques do Feed</H2>
                    <Text color="$color11" fontSize={12}>Últimas publicações da plataforma</Text>
                  </YStack>
                  <Circle size="$2.5" backgroundColor="$green4">
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                  </Circle>
                </XStack>
              </Card.Header>
              
              <YStack padding="$3" paddingTop="$2" flex={1} justifyContent="center" overflow="hidden">
                 <XStack flexWrap="wrap" gap="$2" width="100%" justifyContent="space-between" alignContent="center" height="100%">
                   {feedThumbnails.map((src, idx) => (
                     <YStack key={idx} width="calc(50% - 4px)" height="calc(50% - 4px)" borderRadius="$3" overflow="hidden" backgroundColor="$color4" position="relative">
                        <Image src={src} width="100%" height="100%" objectFit="cover" />
                        {idx === 3 && (
                          <YStack position="absolute" top={0} left={0} right={0} bottom={0} backgroundColor="rgba(0,0,0,0.6)" alignItems="center" justifyContent="center">
                            <Text color="white" fontWeight="bold" fontSize={20}>+8</Text>
                          </YStack>
                        )}
                     </YStack>
                   ))}
                 </XStack>
              </YStack>

            </Card>
          </Link>
        </YStack>

        {/* RIGHT COLUMN: Stacked Widgets (40%) */}
        <YStack flex={1} gap="$3" height="100%">
          
          {/* TOP RIGHT: Consultas Widget */}
          <Link href="/painel/consultas" style={{ textDecoration: 'none', display: 'flex', flex: 1 }}>
            <Card cursor="pointer" animation="quick" width="100%" flex={1} borderWidth={1} backgroundColor="$color2" borderColor="$borderColor" hoverStyle={{ backgroundColor: "$color3", borderColor: "$blue8" }}  overflow="hidden">
              <Card.Header padding="$4" paddingBottom={0}>
                <XStack justifyContent="space-between" alignItems="center">
                  <YStack>
                    <H2 size="$4" fontWeight="bold" color="$color12">Consultas Pendentes</H2>
                    <Text color="$color11" fontSize={12}>3 confirmadas esta semana</Text>
                  </YStack>
                  <Circle size="$2.5" backgroundColor="$blue4">
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  </Circle>
                </XStack>
              </Card.Header>
              
              <YStack padding="$3" flex={1} gap="$2" justifyContent="center" overflow="hidden">
                {consultasMock.map((c) => (
                  <XStack key={c.id} gap="$2" alignItems="center" backgroundColor="$background" padding="$2" borderRadius="$3" borderWidth={1} borderColor="$borderColor">
                    <Avatar circular size="$2.5" backgroundColor="$color4">
                      <Avatar.Image src={c.avatar} />
                    </Avatar>
                    <YStack flex={1}>
                      <Text color="$color12" fontWeight="bold" fontSize={13} numberOfLines={1}>{c.paciente}</Text>
                      <Text color="$color11" fontSize={11} numberOfLines={1}>{c.tipo}</Text>
                    </YStack>
                    <XStack backgroundColor={c.color} paddingHorizontal="$2" paddingVertical={2} borderRadius="$10">
                      <Text color={c.colorText} fontSize={10} fontWeight="bold">{c.data}</Text>
                    </XStack>
                  </XStack>
                ))}
              </YStack>

            </Card>
          </Link>

          {/* BOTTOM RIGHT: Agenda Widget */}
          <Link href="/painel/agenda" style={{ textDecoration: 'none', display: 'flex', flex: 1 }}>
            <Card cursor="pointer" animation="quick" width="100%" flex={1} borderWidth={1} backgroundColor="$color2" borderColor="$borderColor" hoverStyle={{ backgroundColor: "$color3", borderColor: "$purple8" }}  overflow="hidden">
              <Card.Header padding="$4" paddingBottom={0}>
                <XStack justifyContent="space-between" alignItems="center">
                  <YStack>
                    <H2 size="$4" fontWeight="bold" color="$color12">Sua Agenda</H2>
                    <Text color="$color11" fontSize={12}>Prioridades de hoje</Text>
                  </YStack>
                  <Circle size="$2.5" backgroundColor="$purple4">
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c084fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                  </Circle>
                </XStack>
              </Card.Header>

              <YStack padding="$3" flex={1} gap="$2" paddingTop="$2" justifyContent="center" overflow="hidden">
                {agendaMock.map((a, idx) => (
                  <XStack key={a.id} gap="$2" alignItems="flex-start">
                    <YStack alignItems="center" width={12}>
                      <Circle size={10} backgroundColor={a.color} marginTop="$2" borderWidth={2} borderColor="$background" zIndex={2} />
                      {idx < agendaMock.length - 1 && (
                         <YStack width={2} height={42} backgroundColor="$borderColor" marginTop={-4} zIndex={1} />
                      )}
                    </YStack>
                    
                    <YStack flex={1} backgroundColor="$background" padding="$2" paddingHorizontal="$3" borderRadius="$3" borderWidth={1} borderColor="$borderColor">
                      <XStack justifyContent="space-between" alignItems="center" marginBottom={2}>
                         <Text color="$color12" fontWeight="bold" fontSize={13} numberOfLines={1}>{a.titulo}</Text>
                         <Text color={a.color} fontSize={10} fontWeight="bold" flexShrink={0}>{a.time}</Text>
                      </XStack>
                      <Text color="$color11" fontSize={12}>{a.horario}</Text>
                    </YStack>
                  </XStack>
                ))}
              </YStack>

            </Card>
          </Link>

        </YStack>

      </XStack>
    </YStack>
  );
}
