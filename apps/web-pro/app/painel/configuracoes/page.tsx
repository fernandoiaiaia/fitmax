//@ts-nocheck
"use client";

import { useState, useRef } from "react";
import {
  Card, Text, H2, XStack, YStack,
  ScrollView, Button, Avatar, Separator, Input, ZStack, Circle,
} from "tamagui";

type Aba = "dados" | "plano" | "notificacoes" | "senha";

const PLANOS = [
  { id: "plus",    nome: "Pro",     preco: "R$ 89", periodo: "/mês",   color: "#10b981", ativo: true,  destaque: true, features: ["Consultas ilimitadas", "Agenda completa", "Feed completo", "Suporte prioritário"] },
  { id: "premium", nome: "Enterprise", preco: "R$ 199", periodo: "/mês",   color: "#a78bfa", ativo: false, features: ["Tudo do Pro", "Multi-profissional", "Gerenciamento de equipe", "Integração via API"] },
];

const ABAS: { id: Aba; label: string; icon: string }[] = [
  { id: "dados",        label: "Dados do profissional", icon: "👤" },
  { id: "plano",        label: "Meu plano",      icon: "⭐" },
  { id: "notificacoes", label: "Notificações",   icon: "🔔" },
  { id: "senha",        label: "Senha",          icon: "🔒" },
];

/* ── helpers ── */
function SectionTitle({ children }: { children: string }) {
  return (
    <Text color="$color11" fontSize={11} fontWeight="bold"
      letterSpacing={1} textTransform="uppercase" marginBottom="$2">
      {children}
    </Text>
  );
}

function InputField({ id, label, value, onChange, type = "text", disabled }: {
  id: string; label: string; value: string;
  onChange: (v: string) => void; type?: string; disabled?: boolean;
}) {
  return (
    <YStack gap="$1" flex={1}>
      <Text color="$color10" fontSize={12}>{label}</Text>
      <Input
        id={id} type={type} value={value} disabled={disabled}
        onChangeText={onChange}
        backgroundColor={disabled ? "rgba(255,255,255,0.03)" : "$color2"}
        borderColor="$borderColor"
        borderRadius="$3"
        height={42}
        paddingHorizontal="$3"
        color={disabled ? "$color10" : "$color12"}
        fontSize={14}
        width="100%"
        hoverStyle={{ borderColor: disabled ? "$borderColor" : "$green8" }}
        focusStyle={{ borderColor: "$green10", outlineWidth: 0 }}
      />
    </YStack>
  );
}

function Toggle({ id, label, desc, value, onChange }: {
  id: string; label: string; desc: string; value: boolean; onChange: () => void;
}) {
  return (
    <XStack justifyContent="space-between" alignItems="center"
      paddingVertical="$3" borderBottomWidth={1} borderColor="$borderColor">
      <YStack flex={1} gap="$0.5" paddingRight="$4">
        <Text color="$color12" fontSize={14} fontWeight="500">{label}</Text>
        <Text color="$color11" fontSize={12}>{desc}</Text>
      </YStack>
      <XStack
        id={id}
        role="switch"
        aria-checked={value}
        onPress={onChange}
        width={44}
        height={24}
        borderRadius="$10"
        cursor="pointer"
        backgroundColor={value ? "$green9" : "$color5"}
        position="relative"
       
      >
        <Circle
          size={20}
          backgroundColor="white"
          position="absolute"
          top={2}
          left={value ? 22 : 2}
         
        />
      </XStack>
    </XStack>
  );
}

/* ── Abas ── */
function AbaDados() {
  const avatarRef = useRef<HTMLInputElement>(null);
  const [nome,  setNome]  = useState("Dr. Rafael Costa");
  const [tel,   setTel]   = useState("(11) 98765-4321");
  const [email, setEmail] = useState("rafael@fitmax.com");
  const [user,  setUser]  = useState("@rafaelcosta");
  const [obj,   setObj]   = useState("Cardiologia");
  const [saved, setSaved] = useState(false);

  function handleSave() { setSaved(true); setTimeout(() => setSaved(false), 2500); }

  return (
    <YStack gap="$4">
      {/* Profile Card */}
      <Card cursor="pointer" animation="quick" borderWidth={1} backgroundColor="$color2" borderColor="$borderColor"
        borderRadius="$5" padding="$4"
        hoverStyle={{ backgroundColor: "$color3", borderColor: "$green8" }}
       >
        <XStack alignItems="center" gap="$4">
          <ZStack width={80} height={80}>
            <Avatar circular size="$8" backgroundColor="$color4">
              <Avatar.Image src="https://picsum.photos/200/200?random=30" />
            </Avatar>
            <Circle
              size={28}
              backgroundColor="$green9"
              borderWidth={2}
              borderColor="$color2"
              position="absolute"
              bottom={0}
              right={0}
              cursor="pointer"
              onPress={() => avatarRef.current?.click()}
              hoverStyle={{ backgroundColor: "$green10" }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </Circle>
            <input ref={avatarRef} type="file" accept="image/*" style={{ display: "none" }} />
          </ZStack>
          <YStack gap="$1">
            <Text color="$color12" fontSize={18} fontWeight="bold">{nome}</Text>
            <Text color="$color11" fontSize={13}>{email}</Text>
            <XStack paddingHorizontal="$3" paddingVertical="$1" borderRadius="$10"
              backgroundColor="rgba(16,185,129,0.12)" marginTop="$1">
              <Text color="#10b981" fontSize={11} fontWeight="bold">Plano Pro · Ativo</Text>
            </XStack>
          </YStack>
        </XStack>
      </Card>

      {/* Dados */}
      <Card cursor="pointer" animation="quick" borderWidth={1} backgroundColor="$color2" borderColor="$borderColor"
        borderRadius="$5" padding="$4" gap="$4"
        hoverStyle={{ backgroundColor: "$color3", borderColor: "$green8" }}
       >
        <SectionTitle>Dados Pessoais</SectionTitle>
        <XStack gap="$3" flexWrap="wrap">
          <InputField id="input-nome"  label="Nome completo" value={nome}  onChange={setNome} />
          <InputField id="input-email" label="E-mail"        value={email} onChange={setEmail} type="email" />
        </XStack>
        <XStack gap="$3" flexWrap="wrap">
          <InputField id="input-tel"  label="Telefone"        value={tel}  onChange={setTel}  type="tel" />
          <InputField id="input-user" label="Nome de usuário" value={user} onChange={setUser} />
        </XStack>
      </Card>

      {/* Objetivo */}
      <Card cursor="pointer" animation="quick" borderWidth={1} backgroundColor="$color2" borderColor="$borderColor"
        borderRadius="$5" padding="$4" gap="$3"
        hoverStyle={{ backgroundColor: "$color3", borderColor: "$green8" }}
       >
        <SectionTitle>Área de Atuação</SectionTitle>
        <XStack flexWrap="wrap" gap="$2">
          {["Cardiologia", "Endocrinologia", "Nutrição Clínica", "Medicina Esportiva", "Ortopedia", "Personal Trainer"].map((o) => {
            const isActive = obj === o;
            return (
              <Button key={o} size="$3" borderRadius="$10" borderWidth={1}
                animation="quick"
                borderColor={isActive ? "#10b981" : "$borderColor"}
                backgroundColor={isActive ? "rgba(16,185,129,0.12)" : "transparent"}
                onPress={() => setObj(o)}
                hoverStyle={{ borderColor: "$green8", backgroundColor: "$color3" }}
                id={`obj-${o.toLowerCase().replace(/\s/g, "-")}`}>
                <Text color={isActive ? "#10b981" : "$color11"} fontSize={13}
                  fontWeight={isActive ? "bold" : "400"}>{o}</Text>
              </Button>
            );
          })}
        </XStack>
      </Card>

      {/* Ações */}
      <XStack justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="$3">
        <Text color="$color10" fontSize={12} textDecorationLine="underline"
          cursor="pointer" id="link-termos">
          Termos de Uso e Política de Privacidade
        </Text>
        <XStack gap="$2">
          <Button size="$3" borderRadius="$10" backgroundColor="rgba(244,63,94,0.1)"
            borderWidth={1} borderColor="rgba(244,63,94,0.3)"
            hoverStyle={{ backgroundColor: "rgba(244,63,94,0.2)" }}
            id="btn-excluir-conta">
            <Text color="#f43f5e" fontSize={13} fontWeight="600">Excluir conta</Text>
          </Button>
          <Button size="$3" borderRadius="$10" backgroundColor={saved ? "#059669" : "$green9"}
            hoverStyle={{ backgroundColor: "$green10" }}
            onPress={handleSave} id="btn-salvar-dados">
            <Text color="white" fontSize={13} fontWeight="bold">
              {saved ? "✓ Salvo!" : "Salvar alterações"}
            </Text>
          </Button>
        </XStack>
      </XStack>
    </YStack>
  );
}

function AbaPlano() {
  const [selectedPlan, setSelectedPlan] = useState("plus");

  return (
    <YStack gap="$4">
      {/* Plano Atual */}
      <Card cursor="pointer" animation="quick" borderWidth={1} backgroundColor="rgba(16,185,129,0.05)"
        borderColor="rgba(16,185,129,0.3)" borderRadius="$5" padding="$4"
        hoverStyle={{ backgroundColor: "$color3", borderColor: "$green8" }}>
        <XStack justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="$3">
          <YStack gap="$1">
            <XStack alignItems="center" gap="$2">
              <XStack paddingHorizontal="$2" paddingVertical="$0.5" borderRadius="$10"
                backgroundColor="rgba(16,185,129,0.15)">
                <Text color="#10b981" fontSize={10} fontWeight="bold">ATIVO</Text>
              </XStack>
              <Text color="$color12" fontSize={22} fontWeight="bold">Pro</Text>
            </XStack>
            <Text color="#10b981" fontSize={18} fontWeight="bold">
              R$ 89<Text color="$color11" fontSize={13}>/mês</Text>
            </Text>
          </YStack>
          <YStack gap="$1" alignItems="flex-end">
            <Text color="$color11" fontSize={13}>Renovação em <Text color="$color12" fontWeight="bold">21 dias</Text></Text>
            <Text color="$color11" fontSize={13}>Próxima cobrança: <Text color="$color12" fontWeight="bold">17/05/2026</Text></Text>
          </YStack>
        </XStack>
      </Card>

      {/* Comparar */}
      <SectionTitle>Comparar planos</SectionTitle>
      <XStack gap="$3" flexWrap="wrap">
        {PLANOS.map((p) => {
          const isSelected = selectedPlan === p.id;
          return (
          <Card cursor="pointer" animation="quick" key={p.id} flex={1} minWidth={200} borderWidth={isSelected ? 2 : 1}
            backgroundColor={isSelected ? "rgba(16,185,129,0.04)" : "$color2"}
            borderColor={isSelected ? "#10b981" : "$borderColor"}
            borderRadius="$5" padding="$4" gap="$3" overflow="hidden"
            onPress={() => setSelectedPlan(p.id)}
            hoverStyle={{ backgroundColor: "$color3", borderColor: isSelected ? "#10b981" : "$green8" }}>
            {p.destaque && (
              <XStack paddingHorizontal="$3" paddingVertical="$1" borderRadius="$10"
                backgroundColor={p.color} alignSelf="flex-start">
                <Text color="white" fontSize={11} fontWeight="bold">⭐ Popular</Text>
              </XStack>
            )}
            <Text style={{ color: p.color }} fontSize={18} fontWeight="bold">{p.nome}</Text>
            <Text color="$color12" fontSize={22} fontWeight="bold">
              {p.preco}<Text color="$color11" fontSize={13}>{p.periodo}</Text>
            </Text>
            <YStack gap="$2">
              {p.features.map((f) => (
                <XStack key={f} gap="$2" alignItems="center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <Text color="$color11" fontSize={13}>{f}</Text>
                </XStack>
              ))}
            </YStack>
            <Button size="$3" borderRadius="$10" borderWidth={1}
              borderColor={isSelected ? "transparent" : p.color}
              backgroundColor={isSelected ? "#10b981" : "transparent"}
              marginTop="auto" id={`btn-plano-${p.id}`}
              onPress={() => setSelectedPlan(p.id)}>
              <Text color={isSelected ? "white" : p.color} fontSize={13} fontWeight="bold">
                {isSelected ? "Selecionado" : (p.ativo ? "Plano atual" : "Selecionar")}
              </Text>
            </Button>
          </Card>
        )})}
      </XStack>

      <XStack justifyContent="flex-end">
        <Button size="$3" borderRadius="$10" backgroundColor="rgba(244,63,94,0.1)"
          borderWidth={1} borderColor="rgba(244,63,94,0.3)"
          hoverStyle={{ backgroundColor: "rgba(244,63,94,0.2)" }}
          id="btn-cancelar-assinatura">
          <Text color="#f43f5e" fontSize={13} fontWeight="600">Cancelar assinatura</Text>
        </Button>
      </XStack>
    </YStack>
  );
}

function AbaNotificacoes() {
  const [notifs, setNotifs] = useState({
    confirmacao: true, lembrete: true, cancelamento: true,
    novosProfissionais: false, dicas: false,
    email: true, whatsapp: false, push: true,
  });
  const toggle = (key: keyof typeof notifs) => setNotifs((p) => ({ ...p, [key]: !p[key] }));
  const [saved, setSaved] = useState(false);

  return (
    <YStack gap="$4" maxWidth={640}>
      <Card cursor="pointer" animation="quick" borderWidth={1} backgroundColor="$color2" borderColor="$borderColor"
        borderRadius="$5" paddingHorizontal="$4"
        hoverStyle={{ backgroundColor: "$color3", borderColor: "$green8" }}
       >
        <SectionTitle>Consultas</SectionTitle>
        <Toggle id="notif-confirmacao"  label="Confirmação de agendamento" desc="Receba quando uma consulta for confirmada"      value={notifs.confirmacao}        onChange={() => toggle("confirmacao")} />
        <Toggle id="notif-lembrete"     label="Lembrete de consulta"       desc="Notificação 1h antes da consulta"               value={notifs.lembrete}           onChange={() => toggle("lembrete")} />
        <Toggle id="notif-cancelamento" label="Cancelamentos"              desc="Alertas de consultas canceladas ou reagendadas" value={notifs.cancelamento}       onChange={() => toggle("cancelamento")} />
      </Card>

      <Card cursor="pointer" animation="quick" borderWidth={1} backgroundColor="$color2" borderColor="$borderColor"
        borderRadius="$5" paddingHorizontal="$4"
        hoverStyle={{ backgroundColor: "$color3", borderColor: "$green8" }}
       >
        <SectionTitle>Descoberta</SectionTitle>
        <Toggle id="notif-novos"  label="Novos profissionais" desc="Profissionais que combinam com seu objetivo"    value={notifs.novosProfissionais} onChange={() => toggle("novosProfissionais")} />
        <Toggle id="notif-dicas"  label="Dicas de saúde"     desc="Conteúdo personalizado baseado no seu objetivo" value={notifs.dicas}              onChange={() => toggle("dicas")} />
      </Card>

      <Card cursor="pointer" animation="quick" borderWidth={1} backgroundColor="$color2" borderColor="$borderColor"
        borderRadius="$5" paddingHorizontal="$4"
        hoverStyle={{ backgroundColor: "$color3", borderColor: "$green8" }}
       >
        <SectionTitle>Canais</SectionTitle>
        <Toggle id="notif-email"    label="E-mail"    desc="Notificações por e-mail"       value={notifs.email}    onChange={() => toggle("email")} />
        <Toggle id="notif-whatsapp" label="WhatsApp"  desc="Notificações via WhatsApp"     value={notifs.whatsapp} onChange={() => toggle("whatsapp")} />
        <Toggle id="notif-push"     label="Push"      desc="Notificações no navegador"     value={notifs.push}     onChange={() => toggle("push")} />
      </Card>

      <XStack justifyContent="flex-end">
        <Button size="$3" borderRadius="$10" backgroundColor={saved ? "#059669" : "$green9"}
          hoverStyle={{ backgroundColor: "$green10" }}
          onPress={() => { setSaved(true); setTimeout(() => setSaved(false), 2500); }}
          id="btn-salvar-notificacoes">
          <Text color="white" fontSize={13} fontWeight="bold">
            {saved ? "✓ Salvo!" : "Salvar preferências"}
          </Text>
        </Button>
      </XStack>
    </YStack>
  );
}

function AbaSenha() {
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha,  setNovaSenha]  = useState("");
  const [confirmar,  setConfirmar]  = useState("");
  const [show, setShow] = useState({ atual: false, nova: false, confirmar: false });
  const [saved, setSaved] = useState(false);

  let strength = 0;
  if (novaSenha.length >= 8)  strength++;
  if (novaSenha.length >= 10 && /[A-Z]/.test(novaSenha)) strength++;
  if (novaSenha.length >= 12 && /[0-9]/.test(novaSenha)) strength++;
  if (novaSenha.length >= 14 && /[^a-zA-Z0-9]/.test(novaSenha)) strength++;

  const strengthColors = ["#f43f5e", "#f97316", "#facc15", "#10b981"];
  const strengthLabel  = ["Muito curta", "Fraca", "Razoável", "Forte"];

  function PwdInput({ id, label, field, value, onChange }: {
    id: string; label: string;
    field: "atual" | "nova" | "confirmar";
    value: string; onChange: (v: string) => void;
  }) {
    return (
      <YStack gap="$1">
        <Text color="$color10" fontSize={12}>{label}</Text>
        <ZStack position="relative" width="100%">
          <Input
            id={id}
            type={show[field] ? "text" : "password"}
            value={value}
            onChangeText={onChange}
            backgroundColor="$color2"
            borderColor="$borderColor"
            borderRadius="$3"
            height={42}
            paddingLeft="$3"
            paddingRight={40}
            color="$color12"
            fontSize={14}
            width="100%"
            hoverStyle={{ borderColor: "$green8" }}
            focusStyle={{ borderColor: "$green10", outlineWidth: 0 }}
          />
          <Button
            size="$3"
            id={`toggle-${id}`}
            onPress={() => setShow((p) => ({ ...p, [field]: !p[field] }))}
            position="absolute"
            right={0}
            top={0}
            bottom={0}
            backgroundColor="transparent"
            hoverStyle={{ backgroundColor: "transparent", opacity: 0.8 }}
            color="$green10"
            padding="$2"
            focusStyle={{ outlineWidth: 0 }}
          >
            {show[field]
              ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
            }
          </Button>
        </ZStack>
      </YStack>
    );
  }

  return (
    <YStack gap="$4" maxWidth={480}>
      <Card cursor="pointer" animation="quick" borderWidth={1} backgroundColor="$color2" borderColor="$borderColor"
        borderRadius="$5" padding="$4" gap="$4"
        hoverStyle={{ backgroundColor: "$color3", borderColor: "$green8" }}
       >
        <PwdInput id="input-senha-atual"    label="Senha atual"         field="atual"     value={senhaAtual} onChange={setSenhaAtual} />
        <PwdInput id="input-nova-senha"     label="Nova senha"          field="nova"      value={novaSenha}  onChange={setNovaSenha} />

        {novaSenha.length > 0 && (
          <YStack gap="$2">
            <XStack gap="$1">
              {[0, 1, 2, 3].map((i) => (
                <YStack key={i} flex={1} height={4} borderRadius={4}
                  backgroundColor={i < strength ? strengthColors[strength - 1] : "rgba(255,255,255,0.08)"} />
              ))}
            </XStack>
            <Text fontSize={12} style={{ color: strength > 0 ? strengthColors[strength - 1] : "#52525b" }}>
              {strength === 0 ? "Senha muito curta" : strengthLabel[strength - 1]}
            </Text>
          </YStack>
        )}

        <PwdInput id="input-confirmar-senha" label="Confirmar nova senha" field="confirmar" value={confirmar}  onChange={setConfirmar} />
      </Card>

      <XStack justifyContent="flex-end">
        <Button size="$3" borderRadius="$10"
          backgroundColor={saved ? "#059669" : "$green9"}
          hoverStyle={{ backgroundColor: "$green10" }}
          onPress={() => { setSaved(true); setTimeout(() => setSaved(false), 2500); }}
          id="btn-salvar-senha">
          <Text color="white" fontSize={13} fontWeight="bold">
            {saved ? "✓ Salvo!" : "Salvar senha"}
          </Text>
        </Button>
      </XStack>
    </YStack>
  );
}

/* ── Page ── */
export default function ConfigPage() {
  const [aba, setAba] = useState<Aba>("dados");

  return (
    <ScrollView flex={1} backgroundColor="$background" showsVerticalScrollIndicator={false}>
      <YStack padding="$4" $gtSm={{ padding: "$6" }} gap="$5"
        maxWidth={1100} marginHorizontal="auto" width="100%">

        {/* Cabeçalho */}
        <YStack gap="$1">
          <H2 color="$color12" size="$6" fontWeight="bold">Configurações</H2>
          <Text color="$color11" fontSize={14}>Gerencie suas preferências e dados da conta.</Text>
        </YStack>

        {/* Tabs */}
        <XStack gap="$2" flexWrap="wrap">
          {ABAS.map((a) => {
            const isActive = aba === a.id;
            return (
              <Button key={a.id} size="$3" borderRadius="$10" borderWidth={1}
                animation="quick"
                borderColor={isActive ? "$green8" : "$borderColor"}
                backgroundColor={isActive ? "rgba(16,185,129,0.1)" : "$color2"}
                hoverStyle={{ backgroundColor: isActive ? "rgba(16,185,129,0.15)" : "$color3", borderColor: "$green8" }}
                onPress={() => setAba(a.id)}
                id={`tab-${a.id}`}
                paddingHorizontal="$4">
                <XStack gap="$2" alignItems="center">
                  <Text fontSize={14}>{a.icon}</Text>
                  <Text color={isActive ? "#10b981" : "$color11"}
                    fontWeight={isActive ? "bold" : "400"} fontSize={14}>
                    {a.label}
                  </Text>
                </XStack>
              </Button>
            );
          })}
        </XStack>

        <Separator borderColor="$borderColor" />

        {/* Conteúdo */}
        {aba === "dados"        && <AbaDados />}
        {aba === "plano"        && <AbaPlano />}
        {aba === "notificacoes" && <AbaNotificacoes />}
        {aba === "senha"        && <AbaSenha />}

      </YStack>
    </ScrollView>
  );
}
