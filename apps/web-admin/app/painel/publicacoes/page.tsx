//@ts-nocheck
"use client";

import React, { useState, useEffect } from "react";
import { ScrollView, YStack, XStack, H2, Text, Card, Button, Avatar, Separator, Circle, Image } from "tamagui";

type Status = "ativa" | "banida" | "denunciada";

interface Publicacao {
  id: number;
  prof: string;
  crm: string;
  avatar: string;
  topico: string;
  texto: string;
  imagem: string;
  status: Status;
  data: string;
}

const publicacoes: Publicacao[] = [
  {
    id: 1,
    prof: "Dra. Beatriz Oliveira",
    crm: "CRM 84.521 · SP",
    avatar: "https://picsum.photos/id/64/200/200",
    topico: "Dermatologia",
    texto: "Cuidar da pele no verão é essencial. Aplique protetor solar FPS 50+ a cada 2 horas, evite exposição direta entre 10h e 16h e mantenha-se hidratada. Pequenos hábitos fazem toda a diferença na saúde da pele!",
    imagem: "https://picsum.photos/id/110/800/450",
    status: "ativa",
    data: "28 abr 2026 · 09:14",
  },
  {
    id: 2,
    prof: "Dra. Kaylane Pereira",
    crm: "CRM 61.402 · RJ",
    avatar: "https://picsum.photos/id/91/200/200",
    topico: "Saúde Mental",
    texto: "A terapia não é fraqueza — é autocuidado. Minha publicação sobre saúde mental foi removida sem justificativa. Compartilho aqui novamente pois acredito na importância do diálogo.",
    imagem: "https://picsum.photos/id/177/800/450",
    status: "banida",
    data: "27 abr 2026 · 17:02",
  },
  {
    id: 3,
    prof: "Dra. Juliana Monteiro",
    crm: "CRM 92.017 · MG",
    avatar: "https://picsum.photos/id/1027/200/200",
    topico: "Educação Física",
    texto: "Treino personalizado para iniciantes: comece com 3x por semana, foque em movimentos compostos e progrida gradualmente. Nunca sacrifique a técnica pela carga. Consulte sempre um profissional!",
    imagem: "https://picsum.photos/id/145/800/450",
    status: "denunciada",
    data: "26 abr 2026 · 11:45",
  },
  {
    id: 4,
    prof: "Dr. Carlos Eduardo",
    crm: "CRM 55.730 · SP",
    avatar: "https://picsum.photos/id/1025/200/200",
    topico: "Nutrição",
    texto: "Alimentação balanceada é o pilar de uma vida saudável. Inclua proteínas magras, carboidratos complexos e gorduras boas em cada refeição. O jejum intermitente pode ser aliado, mas exige acompanhamento.",
    imagem: "https://picsum.photos/id/292/800/450",
    status: "ativa",
    data: "25 abr 2026 · 08:30",
  },
];

const statusLabel: Record<Status, { label: string; color: string; bg: string }> = {
  ativa: { label: "Ativa", color: "#10b981", bg: "rgba(16,185,129,0.15)" },
  banida: { label: "Banida", color: "#f43f5e", bg: "rgba(244,63,94,0.15)" },
  denunciada: { label: "Denunciada", color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
};

const IconSearch = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
const IconFilter = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>;
const IconDots = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" /></svg>;
const IconCheck = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>;
const IconX = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;

export default function PublicacoesPage() {
  const [search, setSearch] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<Status | "todas">("todas");
  const [isSmall, setIsSmall] = useState(false);

  useEffect(() => {
    const check = () => setIsSmall(window.innerWidth <= 660);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const filtered = publicacoes.filter(p => {
    const matchStatus = filtroStatus === "todas" || p.status === filtroStatus;
    const q = search.toLowerCase();
    const matchSearch = !q || p.prof.toLowerCase().includes(q) || p.topico.toLowerCase().includes(q) || p.texto.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const filtros: Array<{ key: Status | "todas"; label: string }> = [
    { key: "todas",      label: "Todas" },
    { key: "ativa",      label: "Ativas" },
    { key: "denunciada", label: "Denunciadas" },
    { key: "banida",     label: "Banidas" },
  ];

  return (
    <ScrollView flex={1} backgroundColor="$background" showsVerticalScrollIndicator={false}>
      <YStack padding="$4" $gtSm={{ padding: "$6" }} gap="$5" maxWidth={1100} marginHorizontal="auto" width="100%">
        
        {/* Header */}
        <XStack justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap="$4">
          <YStack>
            <H2 color="$color12" size="$6" fontWeight="bold">Moderação de Publicações</H2>
            <Text color="$color11" fontSize={14}>Gerencie e modere o conteúdo publicado pelos profissionais</Text>
          </YStack>
          
          <XStack gap="$3" flexWrap="wrap">
             <XStack backgroundColor="$color2" borderWidth={1} borderColor="$borderColor" borderRadius="$4" paddingHorizontal="$3" height={40} alignItems="center" width={280}>
                <Text color="$color11" marginRight="$2"><IconSearch /></Text>
                <input type="text" placeholder="Buscar publicação..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, background: "transparent", border: "none", color: "white", outline: "none", fontSize: 14 }} />
             </XStack>
             <Button size="$3" backgroundColor="$color2" borderWidth={1} borderColor="$borderColor" color="$color12" icon={<IconFilter />} hoverStyle={{ backgroundColor: "$color3", borderColor: "$green8" }}>
               Filtrar
             </Button>
          </XStack>
        </XStack>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
           <XStack borderBottomWidth={1} borderColor="$borderColor" paddingBottom="$2" gap="$4">
             {filtros.map((f) => (
               <Button key={f.key} size="$3" chromeless color={filtroStatus === f.key ? "$green10" : "$color11"} fontWeight={filtroStatus === f.key ? "bold" : "normal"} borderBottomWidth={2} borderColor={filtroStatus === f.key ? "$green10" : "transparent"} borderRadius={0} paddingHorizontal="$2" paddingBottom="$2" onPress={() => setFiltroStatus(f.key)} hoverStyle={{ backgroundColor: "transparent", color: "$green9" }}>
                 {f.label}
               </Button>
             ))}
           </XStack>
        </ScrollView>

        {/* Grid */}
        <XStack flexWrap="wrap" gap="$4" style={{ flexDirection: isSmall ? 'column' : 'row' }}>
          {filtered.map(p => {
             const stat = statusLabel[p.status];
             return (
               <Card cursor="pointer" animation="quick" key={p.id} flex={1} minWidth={300} maxWidth={isSmall ? undefined : 400} backgroundColor="$color2" borderWidth={1} borderColor={p.status === "banida" ? "rgba(244,63,94,0.3)" : p.status === "denunciada" ? "rgba(245,158,11,0.3)" : "$borderColor"} borderRadius="$4" overflow="hidden" hoverStyle={{ borderColor: "$green8", backgroundColor: "$color3" }}>
                 {/* Header */}
                 <XStack padding="$4" alignItems="center" justifyContent="space-between">
                    <XStack gap="$3" alignItems="center">
                       <Avatar circular size="$4">
                          <Avatar.Image src={p.avatar} />
                       </Avatar>
                       <YStack>
                          <Text color="$color12" fontSize={14} fontWeight="bold">{p.prof}</Text>
                          <Text color="$color11" fontSize={12}>{p.crm}</Text>
                       </YStack>
                    </XStack>
                    <XStack gap="$2" alignItems="center">
                       <XStack backgroundColor={stat.bg} paddingHorizontal="$2" paddingVertical="$1" borderRadius="$10">
                          <Text color={stat.color as any} fontSize={10} fontWeight="bold">{stat.label}</Text>
                       </XStack>
                       <Button size="$2" circular chromeless color="$color11" hoverStyle={{ backgroundColor: "$color3", color: "$color12" }} icon={<IconDots />} />
                    </XStack>
                 </XStack>

                 {/* Image */}
                 <div style={{ width: "100%", height: 200, backgroundColor: "#141414" }}>
                    <Image src={p.imagem} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                 </div>

                 {/* Body */}
                 <YStack padding="$4" gap="$2">
                    <Text color="$green10" fontSize={12} fontWeight="bold">{p.topico}</Text>
                    <Text color="$color11" fontSize={14} lineHeight={20} numberOfLines={3}>{p.texto}</Text>
                 </YStack>

                 {/* Footer */}
                 <XStack padding="$4" paddingTop={0} alignItems="center" justifyContent="space-between">
                    <Text color="$color10" fontSize={12}>{p.data}</Text>
                    <XStack gap="$2">
                       {p.status !== "ativa" && (
                         <Button size="$2" backgroundColor="rgba(16,185,129,0.15)" color="#10b981" hoverStyle={{ backgroundColor: "rgba(16,185,129,0.25)" }} icon={<IconCheck />}>Aprovar</Button>
                       )}
                       {p.status !== "banida" && (
                         <Button size="$2" backgroundColor="rgba(244,63,94,0.15)" color="#f43f5e" hoverStyle={{ backgroundColor: "rgba(244,63,94,0.25)" }} icon={<IconX />}>Banir</Button>
                       )}
                    </XStack>
                 </XStack>
               </Card>
             );
          })}
        </XStack>

      </YStack>
    </ScrollView>
  );
}
