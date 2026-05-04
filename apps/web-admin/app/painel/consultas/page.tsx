//@ts-nocheck
"use client";

import React, { useState, useEffect } from "react";
import { ScrollView, YStack, XStack, H2, Text, Card, Button, Separator, Circle, Input } from "tamagui";

// ── Icons ─────────────────────────────────────────────────────────────────────
const IconSearch = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
const IconDownload = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>;
const IconVideo = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14v-4z"/><rect x="3" y="6" width="12" height="12" rx="2" ry="2"/></svg>;
const IconMapPin = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>;
const IconCheck = () => <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;

// ── Status Config ─────────────────────────────────────────────────────────────
const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
  pago:     { label: "PAGO",     bg: "rgba(16,185,129,0.15)", color: "#10b981" },
  pendente: { label: "PENDENTE", bg: "rgba(234,179,8,0.15)",  color: "#facc15" },
  estorno:  { label: "ESTORNO",  bg: "rgba(244,63,94,0.15)",  color: "#f43f5e" },
};

export default function ConsultasAdminPage() {
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [isSmall, setIsSmall] = useState(false);

  useEffect(() => {
    const check = () => setIsSmall(window.innerWidth <= 660);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Mock data for table
  const consultas = [
    { id: 1, prof: "Dr. Rafael Costa", paciente: "Amanda Silva", tipo: "Presencial", especialidade: "Cardiologia", valor: "R$ 350,00", repasse: "R$ 315,00", status: "pago" },
    { id: 2, prof: "Dra. Juliana Mendes", paciente: "Marcos Nogueira", tipo: "Online", especialidade: "Psicologia", valor: "R$ 200,00", repasse: "R$ 180,00", status: "pendente" },
    { id: 3, prof: "Dr. Carlos Eduardo", paciente: "Renata Faria", tipo: "Presencial", especialidade: "Ortopedia", valor: "R$ 400,00", repasse: "R$ 360,00", status: "estorno" },
    { id: 4, prof: "Dra. Simone Alves", paciente: "Tiago Gomes", tipo: "Online", especialidade: "Nutrição", valor: "R$ 250,00", repasse: "R$ 225,00", status: "pago" },
    { id: 5, prof: "Dr. Rafael Costa", paciente: "Luiza Moreira", tipo: "Presencial", especialidade: "Cardiologia", valor: "R$ 350,00", repasse: "R$ 315,00", status: "pendente" },
  ];

  const handleSelectRow = (id: number) => {
    setSelectedRows(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
  };

  return (
    <ScrollView flex={1} backgroundColor="$background" showsVerticalScrollIndicator={false}>
      <YStack padding="$4" $gtSm={{ padding: "$6" }} gap="$5" maxWidth={1100} marginHorizontal="auto" width="100%">
        
        {/* Header */}
        <XStack justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap="$4">
          <YStack>
            <H2 color="$color12" size="$6" fontWeight="bold">Gestão de Consultas</H2>
            <Text color="$color11" fontSize={14}>Acompanhe e gerencie repasses financeiros das consultas</Text>
          </YStack>
          
          <XStack gap="$3" flexWrap="wrap">
             <XStack backgroundColor="$color2" borderWidth={1} borderColor="$borderColor" borderRadius="$4" paddingHorizontal="$3" height={40} alignItems="center" width={280}>
                <Text color="$color11" marginRight="$2"><IconSearch /></Text>
                <input type="text" placeholder="Buscar consulta..." style={{ flex: 1, background: "transparent", border: "none", color: "white", outline: "none", fontSize: 14 }} />
             </XStack>
             <Button size="$3" backgroundColor="$color2" borderWidth={1} borderColor="$borderColor" color="$color12" icon={<IconDownload />} hoverStyle={{ backgroundColor: "$color3", borderColor: "$green8" }}>
               Exportar
             </Button>
          </XStack>
        </XStack>

        <Separator borderColor="$borderColor" />

        {/* Financial Cards */}
        <XStack gap="$4" flexWrap="wrap" style={{ flexDirection: isSmall ? 'column' : 'row' }}>
          <Card cursor="pointer" animation="quick" flex={1} minWidth={200} backgroundColor="$color2" borderWidth={1} borderColor="$borderColor" borderTopWidth={3} borderTopColor="$green9" padding="$4" borderRadius="$4" hoverStyle={{ backgroundColor: "$color3", borderColor: "$green9" }}>
            <Text color="$color12" fontSize={14} fontWeight="bold" marginBottom="$2">Total já repassado</Text>
            <Text color="$green10" fontSize={24} fontWeight="bold">R$ 27.700,00</Text>
            <Text color="$color11" fontSize={12} marginTop="$1">Valores transferidos aos profissionais</Text>
          </Card>
          <Card cursor="pointer" animation="quick" flex={1} minWidth={200} backgroundColor="$color2" borderWidth={1} borderColor="$borderColor" borderTopWidth={3} borderTopColor="#facc15" padding="$4" borderRadius="$4" hoverStyle={{ backgroundColor: "$color3", borderColor: "#facc15" }}>
            <Text color="$color12" fontSize={14} fontWeight="bold" marginBottom="$2">Repasses pendentes</Text>
            <Text color="#facc15" fontSize={24} fontWeight="bold">R$ 8.760,00</Text>
            <Text color="$color11" fontSize={12} marginTop="$1">Aguardando processamento</Text>
          </Card>
          <Card cursor="pointer" animation="quick" flex={1} minWidth={200} backgroundColor="$color2" borderWidth={1} borderColor="$borderColor" borderTopWidth={3} borderTopColor="#f43f5e" padding="$4" borderRadius="$4" hoverStyle={{ backgroundColor: "$color3", borderColor: "#f43f5e" }}>
            <Text color="$color12" fontSize={14} fontWeight="bold" marginBottom="$2">Estornos solicitados</Text>
            <Text color="#f43f5e" fontSize={24} fontWeight="bold">R$ 2.590,00</Text>
            <Text color="$color11" fontSize={12} marginTop="$1">35 estornos no período</Text>
          </Card>
          <Card cursor="pointer" animation="quick" flex={1} minWidth={200} backgroundColor="$color2" borderWidth={1} borderColor="$borderColor" borderTopWidth={3} borderTopColor="$color9" padding="$4" borderRadius="$4" hoverStyle={{ backgroundColor: "$color3", borderColor: "$color9" }}>
            <Text color="$color12" fontSize={14} fontWeight="bold" marginBottom="$2">Total geral movimentado</Text>
            <Text color="$color12" fontSize={24} fontWeight="bold">R$ 39.050,00</Text>
            <Text color="$color11" fontSize={12} marginTop="$1">Valor bruto (receitas totais)</Text>
          </Card>
        </XStack>

        <XStack justifyContent="space-between" alignItems="center" marginTop="$4">
           <H2 size="$5" color="$color12">Lista de Consultas ({consultas.length})</H2>
           <Button size="$3" backgroundColor="$green9" color="white" hoverStyle={{ backgroundColor: "$green10" }} disabled={selectedRows.length === 0} opacity={selectedRows.length === 0 ? 0.5 : 1}>
             Repassar Selecionados ({selectedRows.length})
           </Button>
        </XStack>

        {/* List of Consultas */}
        <YStack gap="$3">
          {consultas.map((c) => {
            const sc = statusConfig[c.status];
            const isSelected = selectedRows.includes(c.id);

            return (
              <Card cursor="pointer" animation="quick" key={c.id} backgroundColor={isSelected ? "rgba(16,185,129,0.05)" : "$color2"} borderWidth={1} borderColor={isSelected ? "$green8" : "$borderColor"} padding="$4" borderRadius="$4" hoverStyle={{ backgroundColor: "$color3", borderColor: "$green8" }}  onPress={() => handleSelectRow(c.id)}>
                <XStack justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="$4">
                  <XStack gap="$4" alignItems="center" flex={2} minWidth={250}>
                     <Circle size={16} animation="quick" backgroundColor={isSelected ? "$green9" : "rgba(255,255,255,0.03)"} borderWidth={1.5} borderColor={isSelected ? "$green9" : "$color8"} hoverStyle={{ borderColor: "$green8", backgroundColor: isSelected ? "$green10" : "rgba(16,185,129,0.1)" }} justifyContent="center" alignItems="center">
                       {isSelected && <IconCheck />}
                     </Circle>
                     <YStack>
                       <Text color="$color12" fontSize={16} fontWeight="bold">{c.prof}</Text>
                       <Text color="$color11" fontSize={13}>Paciente: {c.paciente}</Text>
                       <XStack gap="$2" marginTop="$1" alignItems="center">
                          <Text color={c.tipo === "Online" ? "#60a5fa" : "#f59e0b"} fontSize={12} display="flex" alignItems="center" gap="$1">
                            {c.tipo === "Online" ? <IconVideo /> : <IconMapPin />} {c.tipo}
                          </Text>
                          <Text color="$color11" fontSize={12}>• {c.especialidade}</Text>
                       </XStack>
                     </YStack>
                  </XStack>

                  <YStack flex={1} minWidth={120}>
                     <Text color="$color11" fontSize={12}>Consulta</Text>
                     <Text color="$color12" fontSize={16} fontWeight="bold">{c.valor}</Text>
                  </YStack>

                  <YStack flex={1} minWidth={120}>
                     <Text color="$color11" fontSize={12}>Repasse (FitMax -10%)</Text>
                     <Text color="$green10" fontSize={16} fontWeight="bold">{c.repasse}</Text>
                  </YStack>

                  <XStack flex={1} minWidth={100} justifyContent="flex-end">
                     <XStack backgroundColor={sc.bg} paddingHorizontal="$2" paddingVertical="$1" borderRadius="$10">
                        <Text color={sc.color as any} fontSize={10} fontWeight="bold" letterSpacing={1}>{sc.label}</Text>
                     </XStack>
                  </XStack>
                </XStack>
              </Card>
            );
          })}
        </YStack>

      </YStack>
    </ScrollView>
  );
}
