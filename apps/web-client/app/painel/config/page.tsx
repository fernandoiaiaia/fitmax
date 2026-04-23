"use client";

import { useState } from "react";
import {
  Card,
  Text,
  H2,
  XStack,
  YStack,
  ScrollView,
  Button,
  Separator,
  Input,
} from "tamagui";

// ─── Types ────────────────────────────────────────────────────────────────────

type ActiveTab = "dados" | "senha";

interface ShowPasswords {
  atual: boolean;
  nova: boolean;
  confirmar: boolean;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const documentosMock = [
  { id: 1, nome: "foto.pdf" },
  { id: 2, nome: "foto.pdf" },
];

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function IconLock() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function IconEye() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconEyeOff() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function IconDownload() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function IconDocument() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="9" y1="13" x2="9" y2="13" />
      <line x1="9" y1="17" x2="15" y2="17" />
      <polyline points="9 13 9 13" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function IconSave() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}

// ─── Password Field ───────────────────────────────────────────────────────────

function PasswordField({
  label,
  placeholder,
  show,
  onToggle,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  show: boolean;
  onToggle: () => void;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <YStack gap="$2">
      <Text color="$color11" fontSize={13} fontWeight="600">
        {label}
      </Text>
      <XStack
        alignItems="center"
        borderRadius="$4"
        borderWidth={1}
        borderColor="$borderColor"
        backgroundColor="#1c1c1c"
        paddingHorizontal="$3"
        gap="$2"
        style={{ transition: "border-color 0.2s" }}
        focusStyle={{ borderColor: "rgba(16,185,129,0.5)" }}
      >
        <YStack flexShrink={0}>
          <IconLock />
        </YStack>
        <Input
          flex={1}
          borderWidth={0}
          backgroundColor="transparent"
          color="$color12"
          placeholderTextColor="#525252"
          placeholder={placeholder}
          secureTextEntry={!show}
          value={value}
          onChangeText={onChange}
          fontSize={14}
          height={48}
          paddingHorizontal={0}
          focusStyle={{ borderWidth: 0 }}
          outlineWidth={0}
        />
        <Button
          size="$2"
          circular
          chromeless
          onPress={onToggle}
          flexShrink={0}
          hoverStyle={{ backgroundColor: "rgba(16,185,129,0.08)" }}
          pressStyle={{ opacity: 0.7 }}
        >
          {show ? <IconEyeOff /> : <IconEye />}
        </Button>
      </XStack>
    </YStack>
  );
}

// ─── Form Field ───────────────────────────────────────────────────────────────

function FormField({
  label,
  value,
  onChange,
  placeholder = "",
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <YStack gap="$2">
      <Text color="$color11" fontSize={13} fontWeight="600">
        {label}
      </Text>
      <Input
        borderRadius="$4"
        borderWidth={1}
        borderColor="$borderColor"
        backgroundColor="#1c1c1c"
        color="$color12"
        placeholderTextColor="#525252"
        placeholder={placeholder}
        value={value}
        onChangeText={onChange}
        fontSize={14}
        height={52}
        paddingHorizontal="$4"
        focusStyle={{
          borderColor: "rgba(16,185,129,0.5)",
          outlineWidth: 0,
        }}
        outlineWidth={0}
      />
    </YStack>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ConfigPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("dados");

  // Dados Pessoais state
  const [nome, setNome] = useState("Carol Santos");
  const [cpf, setCpf] = useState("123.456.789-10");
  const [dataNasc, setDataNasc] = useState("15/06/1980");
  const [telefone, setTelefone] = useState("(11) 95346-4325");
  const [email, setEmail] = useState("carol@gmail.com");

  // Senha state
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [showPass, setShowPass] = useState<ShowPasswords>({
    atual: false,
    nova: false,
    confirmar: false,
  });

  const togglePass = (field: keyof ShowPasswords) =>
    setShowPass((prev) => ({ ...prev, [field]: !prev[field] }));

  return (
    <ScrollView flex={1} backgroundColor="$background">
      <YStack
        padding="$4"
        gap="$5"
        maxWidth={860}
        marginHorizontal="auto"
        width="100%"
        paddingBottom="$10"
      >
        {/* ── Cabeçalho ── */}
        <YStack gap="$1">
          <H2 color="$color12" size="$7" fontWeight="800" letterSpacing={-0.5}>
            Configurações
          </H2>
          <Text color="$color11" fontSize={14}>
            Gerencie suas preferências e dados da conta.
          </Text>
        </YStack>

        {/* ── Tabs ── */}
        <YStack gap={0}>
          <XStack gap={0}>
            {(["dados", "senha"] as ActiveTab[]).map((tab) => {
              const isActive = activeTab === tab;
              const label = tab === "dados" ? "Dados pessoais" : "Alterar senha";
              return (
                <Button
                  key={tab}
                  chromeless
                  onPress={() => setActiveTab(tab)}
                  paddingHorizontal="$4"
                  paddingVertical="$3"
                  borderRadius={0}
                  hoverStyle={{ backgroundColor: "transparent" }}
                  pressStyle={{ backgroundColor: "transparent" }}
                >
                  <Text
                    fontSize={15}
                    fontWeight={isActive ? "700" : "500"}
                    color={isActive ? "#10b981" : "$color11"}
                    style={{ transition: "color 0.15s" }}
                  >
                    {label}
                  </Text>
                </Button>
              );
            })}
          </XStack>

          {/* Tab indicator bar */}
          <XStack position="relative" height={2} backgroundColor="$borderColor">
            <YStack
              position="absolute"
              height={2}
              width="50%"
              backgroundColor="#10b981"
              borderRadius={999}
              style={{
                left: activeTab === "dados" ? "0%" : "50%",
                transition: "left 0.25s ease",
              }}
            />
          </XStack>
        </YStack>

        {/* ── Conteúdo ── */}
        {activeTab === "dados" ? (
          <YStack gap="$6">
            {/* Grid de campos */}
            <YStack gap="$4">
              {/* Nome + CPF */}
              <XStack gap="$4" flexWrap="wrap" $sm={{ flexDirection: "column" }}>
                <YStack flex={1} minWidth={220}>
                  <FormField label="Nome" value={nome} onChange={setNome} placeholder="Seu nome completo" />
                </YStack>
                <YStack flex={1} minWidth={220}>
                  <FormField label="CPF" value={cpf} onChange={setCpf} placeholder="000.000.000-00" />
                </YStack>
              </XStack>

              {/* Data de nascimento + Telefone */}
              <XStack gap="$4" flexWrap="wrap" $sm={{ flexDirection: "column" }}>
                <YStack flex={1} minWidth={220}>
                  <FormField label="Data de nascimento" value={dataNasc} onChange={setDataNasc} placeholder="DD/MM/AAAA" />
                </YStack>
                <YStack flex={1} minWidth={220}>
                  <FormField label="Telefone" value={telefone} onChange={setTelefone} placeholder="(00) 00000-0000" type="tel" />
                </YStack>
              </XStack>

              {/* E-mail full width */}
              <FormField label="E-mail" value={email} onChange={setEmail} placeholder="seu@email.com" type="email" />
            </YStack>

            <Separator borderColor="$borderColor" />

            {/* Documentos */}
            <YStack gap="$3">
              <Text color="$color12" fontSize={15} fontWeight="700">
                Documentos
              </Text>

              <YStack gap="$2">
                {documentosMock.map((doc) => (
                  <XStack
                    key={doc.id}
                    alignItems="center"
                    justifyContent="space-between"
                    paddingHorizontal="$4"
                    paddingVertical="$3"
                    borderRadius="$4"
                    borderWidth={1}
                    borderColor="$borderColor"
                    backgroundColor="#1c1c1c"
                    hoverStyle={{ borderColor: "rgba(16,185,129,0.3)" }}
                    style={{ transition: "border-color 0.15s" }}
                  >
                    <XStack alignItems="center" gap="$3">
                      <IconDocument />
                      <Text color="$color12" fontSize={14}>
                        {doc.nome}
                      </Text>
                    </XStack>

                    <Button
                      size="$2"
                      circular
                      chromeless
                      hoverStyle={{ backgroundColor: "rgba(16,185,129,0.1)" }}
                      pressStyle={{ opacity: 0.7 }}
                    >
                      <IconDownload />
                    </Button>
                  </XStack>
                ))}
              </YStack>
            </YStack>

            <Separator borderColor="$borderColor" />

            {/* Rodapé: Termos + Salvar + Excluir */}
            <XStack justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="$3">
              <Text
                color="#10b981"
                fontSize={13}
                fontWeight="500"
                textDecorationLine="underline"
                cursor="pointer"
                hoverStyle={{ color: "#34d399" }}
                style={{ transition: "color 0.15s" }}
              >
                Ler Termos de Uso e Política de Privacidade
              </Text>

              <XStack gap="$3" alignItems="center">
                {/* Salvar alterações */}
                <Button
                  size="$3"
                  borderRadius="$4"
                  paddingHorizontal="$5"
                  backgroundColor="#10b981"
                  borderWidth={0}
                  icon={<IconSave />}
                  hoverStyle={{ backgroundColor: "#059669" }}
                  pressStyle={{ opacity: 0.8 }}
                  style={{ transition: "background 0.2s" }}
                >
                  <Text color="white" fontWeight="700" fontSize={14}>
                    Salvar alterações
                  </Text>
                </Button>

                {/* Excluir conta */}
                <Button
                  size="$3"
                  borderRadius="$4"
                  paddingHorizontal="$5"
                  backgroundColor="rgba(244,63,94,0.12)"
                  borderWidth={1}
                  borderColor="rgba(244,63,94,0.3)"
                  icon={<IconTrash />}
                  hoverStyle={{ backgroundColor: "rgba(244,63,94,0.2)" }}
                  pressStyle={{ opacity: 0.75 }}
                  style={{ transition: "background 0.2s" }}
                >
                  <Text color="#f43f5e" fontWeight="700" fontSize={14}>
                    Excluir conta
                  </Text>
                </Button>
              </XStack>
            </XStack>
          </YStack>
        ) : (
          /* ── Aba: Alterar Senha ── */
          <YStack gap="$6">
            <YStack gap="$4" maxWidth={600}>
              <PasswordField
                label="Senha atual"
                placeholder="Insira sua senha atual"
                show={showPass.atual}
                onToggle={() => togglePass("atual")}
                value={senhaAtual}
                onChange={setSenhaAtual}
              />
              <PasswordField
                label="Nova senha"
                placeholder="Insira sua nova senha"
                show={showPass.nova}
                onToggle={() => togglePass("nova")}
                value={novaSenha}
                onChange={setNovaSenha}
              />
              <PasswordField
                label="Confirmar nova senha"
                placeholder="Confirme sua nova senha"
                show={showPass.confirmar}
                onToggle={() => togglePass("confirmar")}
                value={confirmarSenha}
                onChange={setConfirmarSenha}
              />
            </YStack>

            {/* Indicador de força de senha (bonus UX) */}
            {novaSenha.length > 0 && (
              <YStack gap="$2" maxWidth={600}>
                <XStack gap="$2">
                  {[1, 2, 3, 4].map((i) => {
                    let filled = false;
                    if (novaSenha.length >= 8 && i <= 1) filled = true;
                    if (novaSenha.length >= 10 && /[A-Z]/.test(novaSenha) && i <= 2) filled = true;
                    if (novaSenha.length >= 12 && /[0-9]/.test(novaSenha) && i <= 3) filled = true;
                    if (novaSenha.length >= 14 && /[^a-zA-Z0-9]/.test(novaSenha) && i <= 4) filled = true;
                    return (
                      <YStack
                        key={i}
                        flex={1}
                        height={4}
                        borderRadius={999}
                        backgroundColor={
                          filled
                            ? i <= 1 ? "#f43f5e"
                            : i <= 2 ? "#f97316"
                            : i <= 3 ? "#facc15"
                            : "#10b981"
                            : "$borderColor"
                        }
                        style={{ transition: "background 0.2s" }}
                      />
                    );
                  })}
                </XStack>
                <Text color="$color11" fontSize={12}>
                  {novaSenha.length < 8
                    ? "Senha muito curta"
                    : novaSenha.length < 12
                    ? "Senha fraca — adicione letras maiúsculas e números"
                    : "Senha forte ✓"}
                </Text>
              </YStack>
            )}

            <Separator borderColor="$borderColor" />

            {/* Rodapé: Salvar */}
            <XStack justifyContent="flex-end">
              <Button
                size="$4"
                borderRadius="$4"
                paddingHorizontal="$6"
                backgroundColor="#10b981"
                borderWidth={0}
                icon={<IconSave />}
                hoverStyle={{ backgroundColor: "#059669" }}
                pressStyle={{ opacity: 0.8 }}
                style={{ transition: "background 0.2s" }}
              >
                <Text color="white" fontWeight="700" fontSize={15}>
                  Salvar
                </Text>
              </Button>
            </XStack>
          </YStack>
        )}
      </YStack>
    </ScrollView>
  );
}
