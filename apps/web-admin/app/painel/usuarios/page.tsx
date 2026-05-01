//@ts-nocheck
"use client";

import React, { useState } from "react";
import { ScrollView, YStack, XStack, H2, Text, Card, Button, Avatar, Separator, Circle } from "tamagui";

type StatusUsuario = "ativo" | "inativo" | "banido";
type TipoUsuario   = "pro-personal" | "pro-terapia" | "pro-nutricao" | "cliente";

interface Usuario {
  id: number;
  nome: string;
  email: string;
  cpf: string;
  tipo: TipoUsuario;
  status: StatusUsuario;
  cadastro: string;
  avatar?: string;
}

const TOTAL = 100;

const usuarios: Usuario[] = [
  { id: 1,  nome: "Amanda Silva",       email: "amanda@email.com",   cpf: "012.345.678-90", tipo: "cliente",      status: "ativo",   cadastro: "12/01/2025", avatar: "https://picsum.photos/id/26/200/200"   },
  { id: 2,  nome: "Dr. Rafael Costa",   email: "rafael@fitmax.com",  cpf: "123.456.789-01", tipo: "pro-personal", status: "ativo",   cadastro: "03/03/2025", avatar: "https://picsum.photos/id/1025/200/200" },
  { id: 3,  nome: "Dra. Juliana Mendes",email: "juliana@email.com",  cpf: "234.567.890-12", tipo: "pro-terapia",  status: "inativo", cadastro: "19/02/2025", avatar: "https://picsum.photos/id/64/200/200"   },
  { id: 4,  nome: "Marcos Nogueira",    email: "marcos@email.com",   cpf: "345.678.901-23", tipo: "cliente",      status: "ativo",   cadastro: "07/04/2025", avatar: "https://picsum.photos/id/1012/200/200" },
  { id: 5,  nome: "Dra. Kaylane Pereira",email:"kaylane@email.com", cpf: "456.789.012-34", tipo: "pro-nutricao", status: "banido",  cadastro: "25/01/2025", avatar: "https://picsum.photos/id/91/200/200"   },
  { id: 6,  nome: "Luiza Moreira",      email: "luiza@email.com",    cpf: "567.890.123-45", tipo: "cliente",      status: "inativo", cadastro: "14/03/2025" },
];

const statusLabel: Record<StatusUsuario, { label: string; bg: string; color: string }> = {
  ativo:   { label: "Ativo", bg: "rgba(16,185,129,0.15)", color: "#10b981" },
  inativo: { label: "Inativo", bg: "rgba(255,255,255,0.05)", color: "#a1a1aa" },
  banido:  { label: "Banido", bg: "rgba(244,63,94,0.15)", color: "#f43f5e" },
};

const tipoLabel: Record<TipoUsuario, string> = {
  "pro-personal": "Personal Trainer",
  "pro-terapia":  "Terapia",
  "pro-nutricao": "Nutrição",
  "cliente":      "Cliente",
};

function initials(nome: string) {
  return nome.split(" ").slice(0, 2).map(p => p[0]).join("").toUpperCase();
}

// ── Icons ────────────────────────────────────────────────────────────────────
const IconSearch = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IconToggleOn = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="5" width="22" height="14" rx="7"/><circle cx="16" cy="12" r="3" fill="currentColor" stroke="none"/></svg>;
const IconToggleOff = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="5" width="22" height="14" rx="7"/><circle cx="8" cy="12" r="3" fill="currentColor" stroke="none"/></svg>;
const IconTrash = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
const IconAlert = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IconDocs = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>;
const IconPlus = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;

// ── Main component ────────────────────────────────────────────────────────────
export default function UsuariosPage() {
  const [search,      setSearch]    = useState("");
  const [filtroStatus, setFiltroStatus] = useState<StatusUsuario | "todos">("todos");
  const [filtroTipo,   setFiltroTipo]   = useState<TipoUsuario   | "todos">("todos");
  const [ativos, setAtivos] = useState<Record<number, boolean>>(Object.fromEntries(usuarios.map(u => [u.id, u.status === "ativo"])));

  const filtered = usuarios.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.nome.toLowerCase().includes(q) || u.cpf.includes(q) || u.email.toLowerCase().includes(q);
    const matchStatus = filtroStatus === "todos" || u.status === filtroStatus;
    const matchTipo   = filtroTipo   === "todos" || u.tipo   === filtroTipo;
    return matchSearch && matchStatus && matchTipo;
  });

  const toggleAtivo = (id: number) => setAtivos(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <ScrollView flex={1} backgroundColor="$background" showsVerticalScrollIndicator={false}>
      <YStack padding="$4" $gtSm={{ padding: "$6" }} gap="$5" maxWidth={1100} marginHorizontal="auto" width="100%">
        
        {/* Header */}
        <XStack justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap="$4">
          <YStack>
            <H2 color="$color12" size="$6" fontWeight="bold">Gestão de Usuários</H2>
            <Text color="$color11" fontSize={14}>Gerencie contas, status e documentos dos usuários da plataforma</Text>
          </YStack>
          <Button size="$3" backgroundColor="$green9" color="white" hoverStyle={{ backgroundColor: "$green10" }} fontWeight="bold" icon={<IconPlus />}>
            Novo Usuário
          </Button>
        </XStack>

        <Separator borderColor="$borderColor" />

        {/* Controls */}
        <XStack gap="$3" flexWrap="wrap" alignItems="center">
          <XStack backgroundColor="$color2" borderWidth={1} borderColor="$borderColor" borderRadius="$4" paddingHorizontal="$3" height={40} alignItems="center" flex={1} minWidth={250}>
             <Text color="$color11" marginRight="$2"><IconSearch /></Text>
             <input type="text" placeholder="Buscar por nome, CPF ou e-mail..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, background: "transparent", border: "none", color: "white", outline: "none", fontSize: 14 }} />
          </XStack>

          <select style={{ height: 40, padding: "0 12px", background: "#1e1e1e", border: "1px solid #3f3f46", color: "#fafafa", borderRadius: 8, outline: "none", fontSize: 14 }} value={filtroStatus} onChange={e => setFiltroStatus(e.target.value as any)}>
            <option value="todos">Todos os status</option>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
            <option value="banido">Banido</option>
          </select>

          <select style={{ height: 40, padding: "0 12px", background: "#1e1e1e", border: "1px solid #3f3f46", color: "#fafafa", borderRadius: 8, outline: "none", fontSize: 14 }} value={filtroTipo} onChange={e => setFiltroTipo(e.target.value as any)}>
            <option value="todos">Todos os tipos</option>
            <option value="pro-personal">Profissional · Personal</option>
            <option value="pro-terapia">Profissional · Terapia</option>
            <option value="pro-nutricao">Profissional · Nutrição</option>
            <option value="cliente">Cliente</option>
          </select>

          <Text color="$color11" fontSize={14} marginLeft="auto">
            <Text color="$color12" fontWeight="bold">{filtered.length}</Text> de {TOTAL} usuários
          </Text>
        </XStack>

        {/* List */}
        <YStack gap="$3">
          {filtered.map(u => {
             const stat = statusLabel[u.status];
             const isPro = u.tipo !== "cliente";

             return (
               <Card cursor="pointer" animation="quick" key={u.id} backgroundColor="$color2" borderWidth={1} borderColor="$borderColor" padding="$4" borderRadius="$4" hoverStyle={{ backgroundColor: "$color3", borderColor: "$green8" }}>
                 <XStack justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="$4">
                    <XStack gap="$3" alignItems="center" minWidth={250} flex={2}>
                       <Avatar circular size="$4">
                          {u.avatar ? <Avatar.Image src={u.avatar} /> : <Avatar.Fallback alignItems="center" justifyContent="center" backgroundColor="$color4"><Text color="$color12" fontSize={14} fontWeight="bold">{initials(u.nome)}</Text></Avatar.Fallback>}
                       </Avatar>
                       <YStack>
                          <Text color="$color12" fontSize={16} fontWeight="bold">{u.nome}</Text>
                          <Text color="$color11" fontSize={13}>{u.email}</Text>
                       </YStack>
                    </XStack>

                    <YStack minWidth={140} flex={1}>
                       <Text color="$color11" fontSize={12}>CPF</Text>
                       <Text color="$color12" fontSize={14} fontFamily="$mono">{u.cpf}</Text>
                    </YStack>

                    <YStack minWidth={160} flex={1}>
                       <XStack backgroundColor={isPro ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.05)"} alignSelf="flex-start" paddingHorizontal="$2" paddingVertical="$1" borderRadius="$10">
                          <Text color={isPro ? "$green10" : "$color11"} fontSize={12} fontWeight="bold">{isPro ? `Profissional · ${tipoLabel[u.tipo]}` : "Cliente"}</Text>
                       </XStack>
                       <Text color="$color11" fontSize={12} marginTop="$1">Cadastrado: {u.cadastro}</Text>
                    </YStack>

                    <XStack gap="$3" alignItems="center">
                       <XStack backgroundColor={stat.bg} paddingHorizontal="$2" paddingVertical="$1" borderRadius="$10">
                          <Text color={stat.color as any} fontSize={10} fontWeight="bold" letterSpacing={1}>{stat.label}</Text>
                       </XStack>

                       <XStack gap="$1">
                         <Button size="$3" circular chromeless color={ativos[u.id] ? "$green9" : "$color11"} icon={ativos[u.id] ? <IconToggleOn /> : <IconToggleOff />} onPress={() => toggleAtivo(u.id)} />
                         <Button size="$3" circular chromeless color="$color11" hoverStyle={{ color: "$blue10", backgroundColor: "rgba(96,165,250,0.1)" }} icon={<IconDocs />} />
                         <Button size="$3" circular chromeless color="$color11" hoverStyle={{ color: "#f59e0b", backgroundColor: "rgba(245,158,11,0.1)" }} icon={<IconAlert />} />
                         <Button size="$3" circular chromeless color="$color11" hoverStyle={{ color: "#f43f5e", backgroundColor: "rgba(244,63,94,0.1)" }} icon={<IconTrash />} />
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
