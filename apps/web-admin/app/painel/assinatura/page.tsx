//@ts-nocheck
"use client";

import React, { useState, useEffect } from "react";
import { ScrollView, YStack, XStack, H2, Text, Card, Button, Separator, Circle, Input } from "tamagui";

type PeriodoPlano = "Mensal" | "Trimestral" | "Semestral" | "Anual";

interface Plano {
  id: number;
  nome: string;
  tipo: PeriodoPlano;
  valor: number;
  consultas: number;
  taxa: number;
  ativo: boolean;
}

const planosIniciais: Plano[] = [
  { id: 1, nome: "Plano Básico",       tipo: "Mensal",      valor: 140, consultas: 30, taxa: 6, ativo: true  },
  { id: 2, nome: "Plano Plus",         tipo: "Semestral",   valor: 320, consultas: 35, taxa: 6, ativo: true  },
  { id: 3, nome: "Plano Standard",     tipo: "Anual",       valor: 80,  consultas: 10, taxa: 6, ativo: false },
  { id: 4, nome: "Plano Profissional", tipo: "Trimestral",  valor: 260, consultas: 20, taxa: 6, ativo: true  },
];

const TOTAL_PLANOS = 100;

// ── Icons ─────────────────────────────────────────────────────────────────────

const IconPlus = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const IconTrash = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);

const IconChevron = ({ dir }: { dir: "left" | "right" }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    {dir === "left" ? <polyline points="15 18 9 12 15 6"/> : <polyline points="9 18 15 12 9 6"/>}
  </svg>
);

const IconToggleOn = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="5" width="22" height="14" rx="7"/>
    <circle cx="16" cy="12" r="3" fill="currentColor" stroke="none"/>
  </svg>
);

const IconToggleOff = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="5" width="22" height="14" rx="7"/>
    <circle cx="8" cy="12" r="3" fill="currentColor" stroke="none"/>
  </svg>
);

const IconCreditCard = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
    <line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);

const IconX = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

// ── Modals ────────────────────────────────────────────────────────────────────

function ModalCadastro({ onClose, onSave }: any) {
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<PeriodoPlano>("Mensal");
  const [valor, setValor] = useState("");
  const [consultas, setConsultas] = useState("");
  const [taxa, setTaxa] = useState("6");

  const handleSave = () => {
    if (!nome || !valor || !consultas) return;
    onSave({
      nome,
      tipo,
      valor: Number(valor),
      consultas: Number(consultas),
      taxa: Number(taxa),
      ativo: true
    });
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <Card cursor="default" animation="quick" backgroundColor="$color2" borderWidth={1} borderColor="$borderColor" padding="$5" borderRadius="$4" width="100%" maxWidth={500} onClick={e => e.stopPropagation()}>
        <H2 size="$5" color="$color12" marginBottom="$2">Cadastrar Plano</H2>
        <Text color="$color11" marginBottom="$4">Novo plano será ativado imediatamente.</Text>
        <YStack gap="$4">
           
           <YStack gap="$2">
             <Text color="$color11" fontSize={12} fontWeight="bold">NOME DO PLANO</Text>
             <Input value={nome} onChangeText={setNome} placeholder="Ex: Plano Ouro" backgroundColor="$color1" borderColor="$borderColor" focusStyle={{ borderColor: "$green8", outlineWidth: 0 }} />
           </YStack>

           <YStack gap="$2">
             <Text color="$color11" fontSize={12} fontWeight="bold">PERÍODO</Text>
             <XStack gap="$2" flexWrap="wrap">
               {(["Mensal", "Trimestral", "Semestral", "Anual"] as PeriodoPlano[]).map(t => (
                 <Button key={t} size="$3" flex={1} minWidth={100} borderWidth={1} borderColor={tipo === t ? "$green9" : "$borderColor"} backgroundColor={tipo === t ? "rgba(16,185,129,0.1)" : "$color1"} hoverStyle={{ backgroundColor: tipo === t ? "rgba(16,185,129,0.2)" : "$color3" }} onPress={() => setTipo(t)}>
                   <Text color={tipo === t ? "$green10" : "$color11"} fontWeight={tipo === t ? "bold" : "normal"}>{t}</Text>
                 </Button>
               ))}
             </XStack>
           </YStack>

           <XStack gap="$3" flexWrap="wrap">
             <YStack gap="$2" flex={1} minWidth={120}>
               <Text color="$color11" fontSize={12} fontWeight="bold">VALOR (R$)</Text>
               <Input value={valor} onChangeText={setValor} keyboardType="numeric" placeholder="0.00" backgroundColor="$color1" borderColor="$borderColor" focusStyle={{ borderColor: "$green8", outlineWidth: 0 }} />
             </YStack>
             <YStack gap="$2" flex={1} minWidth={120}>
               <Text color="$color11" fontSize={12} fontWeight="bold">QTD. CONSULTAS</Text>
               <Input value={consultas} onChangeText={setConsultas} keyboardType="numeric" placeholder="Ex: 10" backgroundColor="$color1" borderColor="$borderColor" focusStyle={{ borderColor: "$green8", outlineWidth: 0 }} />
             </YStack>
             <YStack gap="$2" flex={1} minWidth={120}>
               <Text color="$color11" fontSize={12} fontWeight="bold">TAXA (%)</Text>
               <Input value={taxa} onChangeText={setTaxa} keyboardType="numeric" placeholder="6" backgroundColor="$color1" borderColor="$borderColor" focusStyle={{ borderColor: "$green8", outlineWidth: 0 }} />
             </YStack>
           </XStack>

           <XStack gap="$3" marginTop="$2" justifyContent="flex-end">
             <Button chromeless color="$color11" onPress={onClose}>Cancelar</Button>
             <Button backgroundColor="$green9" color="white" hoverStyle={{ backgroundColor: "$green10" }} onPress={handleSave}>Confirmar</Button>
           </XStack>
        </YStack>
      </Card>
    </div>
  );
}

function ModalDelete({ plano, onClose, onConfirm }: any) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <Card cursor="pointer" animation="quick" backgroundColor="$color2" borderWidth={1} borderColor="$borderColor" padding="$5" borderRadius="$4" width="100%" maxWidth={400} onClick={e => e.stopPropagation()}>
        <H2 size="$5" color="$color12" marginBottom="$2">Excluir {plano.nome}</H2>
        <Text color="$color11" marginBottom="$4">Esta ação não pode ser desfeita.</Text>
        <XStack gap="$3" justifyContent="flex-end">
           <Button chromeless color="$color11" onPress={onClose}>Cancelar</Button>
           <Button backgroundColor="#f43f5e" color="white" hoverStyle={{ backgroundColor: "#e11d48" }} onPress={onConfirm}>Excluir</Button>
        </XStack>
      </Card>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AssinaturaPage() {
  const [planos, setPlanos] = useState<Plano[]>(planosIniciais);
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Plano | null>(null);
  const [isSmall, setIsSmall] = useState(false);

  useEffect(() => {
    const check = () => setIsSmall(window.innerWidth <= 660);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const toggleAtivo = (id: number) => {
    setPlanos(prev => prev.map(p => p.id === id ? { ...p, ativo: !p.ativo } : p));
  };

  return (
    <ScrollView flex={1} backgroundColor="$background" showsVerticalScrollIndicator={false}>
      <YStack padding="$4" $gtSm={{ padding: "$6" }} gap="$5" maxWidth={1100} marginHorizontal="auto" width="100%">
        
        {/* Header */}
        <XStack justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="$4">
          <XStack gap="$3" alignItems="center">
            <Circle size="$4" backgroundColor="rgba(16,185,129,0.1)">
              <IconCreditCard />
            </Circle>
            <YStack>
              <H2 color="$color12" size="$6" fontWeight="bold">Planos de Assinatura</H2>
              <Text color="$color11" fontSize={14}>Gerencie os planos da plataforma</Text>
            </YStack>
          </XStack>
          <Button size="$3" backgroundColor="$green9" color="white" hoverStyle={{ backgroundColor: "$green10" }} fontWeight="bold" icon={<IconPlus />} onPress={() => setShowModal(true)}>
            Cadastrar plano
          </Button>
        </XStack>

        <Separator borderColor="$borderColor" />

        {/* Stats */}
        <XStack gap="$4" flexWrap="wrap" style={{ flexDirection: isSmall ? 'column' : 'row' }}>
          {[
            { v: planos.length, l: "Total", c: "$color12" },
            { v: planos.filter(p => p.ativo).length, l: "Ativos", c: "$green9" },
            { v: planos.filter(p => !p.ativo).length, l: "Inativos", c: "$color11" },
          ].map((s, i) => (
            <Card cursor="pointer" animation="quick" key={i} flex={1} minWidth={150} backgroundColor="$color2" borderWidth={1} borderColor="$borderColor" padding="$4" borderRadius="$4" hoverStyle={{ backgroundColor: "$color3", borderColor: s.c === "$color11" ? "$color9" : s.c as any }}>
              <Text color={s.c as any} fontSize={28} fontWeight="bold">{s.v}</Text>
              <Text color="$color11" fontSize={12}>{s.l}</Text>
            </Card>
          ))}
        </XStack>

        {/* List */}
        <YStack gap="$3">
          {planos.map(plano => (
            <Card cursor="pointer" animation="quick" key={plano.id} backgroundColor="$color2" borderWidth={1} borderColor="$borderColor" padding="$4" borderRadius="$4" hoverStyle={{ backgroundColor: "$color3", borderColor: "$green8" }}>
              <XStack justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="$4">
                <XStack gap="$3" alignItems="center" minWidth={200}>
                  <Circle size="$3" backgroundColor="rgba(255,255,255,0.05)">
                    <IconCreditCard />
                  </Circle>
                  <YStack>
                    <Text color="$color12" fontSize={16} fontWeight="bold">{plano.nome}</Text>
                    <Text color="$green10" fontSize={12}>{plano.tipo}</Text>
                  </YStack>
                </XStack>
                <YStack minWidth={100}>
                  <Text color="$color12" fontSize={16} fontWeight="bold">R$ {plano.valor}</Text>
                  <Text color="$color11" fontSize={12}>{plano.consultas} consultas</Text>
                </YStack>
                <XStack gap="$3" alignItems="center">
                  <Button size="$3" chromeless color={plano.ativo ? "$green10" : "$color11"} icon={plano.ativo ? <IconToggleOn /> : <IconToggleOff />} onPress={() => toggleAtivo(plano.id)}>
                    {plano.ativo ? "Ativo" : "Inativo"}
                  </Button>
                  <Button size="$3" circular chromeless color="#f43f5e" hoverStyle={{ backgroundColor: "rgba(244,63,94,0.1)" }} icon={<IconTrash />} onPress={() => setDeleteTarget(plano)} />
                </XStack>
              </XStack>
            </Card>
          ))}
        </YStack>
        
      </YStack>

      {showModal && <ModalCadastro onClose={() => setShowModal(false)} onSave={(p: any) => setPlanos([...planos, { id: Date.now(), ...p }])} />}
      {deleteTarget && <ModalDelete plano={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={() => { setPlanos(planos.filter(p => p.id !== deleteTarget.id)); setDeleteTarget(null); }} />}

    </ScrollView>
  );
}
