//@ts-nocheck
"use client";

import { useState, useRef } from "react";
import {
  Card, Text, H2, XStack, YStack,
  ScrollView, Button, Avatar, Separator, Input, ZStack, Circle,
} from "tamagui";

type Aba = "dados" | "notificacoes" | "seguranca" | "convenios";

const ABAS: { id: Aba; label: string; icon: string }[] = [
  { id: "dados",        label: "Dados do Admin", icon: "👤" },
  { id: "notificacoes", label: "Notificações",   icon: "🔔" },
  { id: "seguranca",    label: "Segurança",      icon: "🔒" },
  { id: "convenios",    label: "Convênios",      icon: "🏥" },
];

const CATEGORIAS_CONVENIO = ["Nacional", "Regional", "Empresarial", "Odontológico", "Outro"];

type Convenio = { id: number; nome: string; categoria: string; ativo: boolean };

const CONVENIOS_INICIAIS: Convenio[] = [
  { id: 1,  nome: "Unimed",                    categoria: "Nacional",     ativo: true  },
  { id: 2,  nome: "Bradesco Saúde",            categoria: "Nacional",     ativo: true  },
  { id: 3,  nome: "SulAmérica",                categoria: "Nacional",     ativo: true  },
  { id: 4,  nome: "Amil",                      categoria: "Nacional",     ativo: true  },
  { id: 5,  nome: "Notre Dame Intermédica",     categoria: "Nacional",     ativo: true  },
  { id: 6,  nome: "Porto Seguro Saúde",        categoria: "Nacional",     ativo: true  },
  { id: 7,  nome: "Hapvida",                   categoria: "Regional",     ativo: true  },
  { id: 8,  nome: "Prevent Senior",            categoria: "Regional",     ativo: true  },
  { id: 9,  nome: "Golden Cross",              categoria: "Regional",     ativo: false },
  { id: 10, nome: "Cassi",                     categoria: "Empresarial",  ativo: true  },
  { id: 11, nome: "Mediservice",               categoria: "Empresarial",  ativo: true  },
  { id: 12, nome: "Fusex",                     categoria: "Empresarial",  ativo: true  },
  { id: 13, nome: "Geap",                      categoria: "Empresarial",  ativo: false },
  { id: 14, nome: "Petrobras Saúde",           categoria: "Empresarial",  ativo: true  },
  { id: 15, nome: "Particular (Sem convênio)", categoria: "Outro",        ativo: true  },
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

/* ── Aba: Dados do Admin ── */
function AbaDados() {
  const avatarRef = useRef<HTMLInputElement>(null);
  const [nome,  setNome]  = useState("Admin FitMax");
  const [tel,   setTel]   = useState("(11) 99000-0000");
  const [email, setEmail] = useState("admin@fitmax.com");
  const [user,  setUser]  = useState("@admin");
  const [saved, setSaved] = useState(false);

  function handleSave() { setSaved(true); setTimeout(() => setSaved(false), 2500); }

  return (
    <YStack gap="$4">
      {/* Profile Card */}
      <Card cursor="pointer" animation="quick" borderWidth={1} backgroundColor="$color2" borderColor="$borderColor"
        borderRadius="$5" padding="$4"
        hoverStyle={{ backgroundColor: "$color3", borderColor: "$green8" }}>
        <XStack alignItems="center" gap="$4">
          <ZStack width={80} height={80}>
            <Avatar circular size="$8" backgroundColor="$color4">
              <Avatar.Image src="https://picsum.photos/200/200?random=40" />
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
              <Text color="#10b981" fontSize={11} fontWeight="bold">Administrador · Nível 5 🔐</Text>
            </XStack>
          </YStack>
        </XStack>
      </Card>

      {/* Dados */}
      <Card cursor="pointer" animation="quick" borderWidth={1} backgroundColor="$color2" borderColor="$borderColor"
        borderRadius="$5" padding="$4" gap="$4"
        hoverStyle={{ backgroundColor: "$color3", borderColor: "$green8" }}>
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

      {/* Ações */}
      <XStack justifyContent="flex-end" gap="$2">
        <Button size="$3" borderRadius="$4" backgroundColor={saved ? "#059669" : "$green9"}
          hoverStyle={{ backgroundColor: "$green10" }}
          onPress={handleSave} id="btn-salvar-dados">
          <Text color="white" fontSize={13} fontWeight="bold">
            {saved ? "✓ Salvo!" : "Salvar alterações"}
          </Text>
        </Button>
      </XStack>
    </YStack>
  );
}


/* ── Aba: Notificações ── */
function AbaNotificacoes() {
  const [notifs, setNotifs] = useState({
    novaConsulta: true, cancelamento: true, novoUsuario: true,
    assinaturaVencendo: true, relatorioSemanal: false,
    email: true, whatsapp: false, push: true,
  });
  const toggle = (key: keyof typeof notifs) => setNotifs((p) => ({ ...p, [key]: !p[key] }));
  const [saved, setSaved] = useState(false);

  return (
    <YStack gap="$4" maxWidth={640}>
      <Card cursor="pointer" animation="quick" borderWidth={1} backgroundColor="$color2" borderColor="$borderColor"
        borderRadius="$5" paddingHorizontal="$4"
        hoverStyle={{ backgroundColor: "$color3", borderColor: "$green8" }}>
        <SectionTitle>Consultas</SectionTitle>
        <Toggle id="notif-nova-consulta"  label="Nova consulta agendada"  desc="Quando um usuário agenda uma consulta"          value={notifs.novaConsulta}       onChange={() => toggle("novaConsulta")} />
        <Toggle id="notif-cancelamento"   label="Consulta cancelada"       desc="Alertas de consultas canceladas"                value={notifs.cancelamento}        onChange={() => toggle("cancelamento")} />
      </Card>

      <Card cursor="pointer" animation="quick" borderWidth={1} backgroundColor="$color2" borderColor="$borderColor"
        borderRadius="$5" paddingHorizontal="$4"
        hoverStyle={{ backgroundColor: "$color3", borderColor: "$green8" }}>
        <SectionTitle>Usuários & Assinaturas</SectionTitle>
        <Toggle id="notif-novo-usuario"   label="Novo usuário cadastrado"  desc="Alerta quando um novo usuário se registra"    value={notifs.novoUsuario}         onChange={() => toggle("novoUsuario")} />
        <Toggle id="notif-assinatura"     label="Assinatura vencendo"      desc="Planos próximos do vencimento"                 value={notifs.assinaturaVencendo}  onChange={() => toggle("assinaturaVencendo")} />
        <Toggle id="notif-relatorio"      label="Relatório semanal"        desc="Resumo de métricas toda segunda-feira"         value={notifs.relatorioSemanal}    onChange={() => toggle("relatorioSemanal")} />
      </Card>

      <Card cursor="pointer" animation="quick" borderWidth={1} backgroundColor="$color2" borderColor="$borderColor"
        borderRadius="$5" paddingHorizontal="$4"
        hoverStyle={{ backgroundColor: "$color3", borderColor: "$green8" }}>
        <SectionTitle>Canais</SectionTitle>
        <Toggle id="notif-email"    label="E-mail"    desc="Notificações por e-mail"   value={notifs.email}    onChange={() => toggle("email")} />
        <Toggle id="notif-whatsapp" label="WhatsApp"  desc="Notificações via WhatsApp" value={notifs.whatsapp} onChange={() => toggle("whatsapp")} />
        <Toggle id="notif-push"     label="Push"      desc="Notificações no navegador" value={notifs.push}     onChange={() => toggle("push")} />
      </Card>

      <XStack justifyContent="flex-end">
        <Button size="$3" borderRadius="$4" backgroundColor={saved ? "#059669" : "$green9"}
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

/* ── Aba: Segurança ── */
function AbaSeguranca() {
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
            right={0} top={0} bottom={0}
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

      {/* Alterar Senha */}
      <Card cursor="pointer" animation="quick" borderWidth={1} backgroundColor="$color2" borderColor="$borderColor"
        borderRadius="$5" padding="$4" gap="$4"
        hoverStyle={{ backgroundColor: "$color3", borderColor: "$green8" }}>
        <SectionTitle>Alterar senha</SectionTitle>
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
        <Button size="$3" borderRadius="$4"
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

/* ── Aba: Convênios ── */
function AbaConvenios() {
  const [lista, setLista] = useState<Convenio[]>(CONVENIOS_INICIAIS);
  const [novoNome, setNovoNome] = useState("");
  const [novaCategoria, setNovaCategoria] = useState(CATEGORIAS_CONVENIO[0]);
  const [busca, setBusca] = useState("");
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editCategoria, setEditCategoria] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("Todos");
  const [saved, setSaved] = useState(false);
  let nextId = lista.length ? Math.max(...lista.map((c) => c.id)) + 1 : 1;

  function adicionar() {
    const trimmed = novoNome.trim();
    if (!trimmed) return;
    if (lista.some((c) => c.nome.toLowerCase() === trimmed.toLowerCase())) return;
    setLista((prev) => [...prev, { id: nextId++, nome: trimmed, categoria: novaCategoria, ativo: true }]);
    setNovoNome("");
    flash();
  }

  function remover(id: number) { setLista((prev) => prev.filter((c) => c.id !== id)); }

  function toggleAtivo(id: number) {
    setLista((prev) => prev.map((c) => c.id === id ? { ...c, ativo: !c.ativo } : c));
  }

  function iniciarEdicao(c: Convenio) {
    setEditandoId(c.id);
    setEditNome(c.nome);
    setEditCategoria(c.categoria);
  }

  function salvarEdicao(id: number) {
    const trimmed = editNome.trim();
    if (!trimmed) return;
    setLista((prev) => prev.map((c) => c.id === id ? { ...c, nome: trimmed, categoria: editCategoria } : c));
    setEditandoId(null);
    flash();
  }

  function flash() { setSaved(true); setTimeout(() => setSaved(false), 2500); }

  const categorias = ["Todos", ...CATEGORIAS_CONVENIO];

  const listaFiltrada = lista.filter((c) => {
    const matchBusca = c.nome.toLowerCase().includes(busca.toLowerCase());
    const matchCat = filtroCategoria === "Todos" || c.categoria === filtroCategoria;
    return matchBusca && matchCat;
  });

  const ativos   = lista.filter((c) => c.ativo).length;
  const inativos = lista.filter((c) => !c.ativo).length;

  const selectStyle = {
    width: "100%", height: "42px", backgroundColor: "transparent",
    color: "white", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px", padding: "0 12px", fontSize: "14px",
    outline: "none", appearance: "none" as const, cursor: "pointer",
  };

  const selectSmStyle = { ...selectStyle, height: "38px", fontSize: "13px" };

  return (
    <YStack gap="$4">

      {/* Estatísticas */}
      <XStack gap="$3" flexWrap="wrap">
        {[
          { label: "Total",    value: lista.length, color: "#a1a1aa",  bg: "rgba(255,255,255,0.04)" },
          { label: "Ativos",   value: ativos,       color: "#10b981",  bg: "rgba(16,185,129,0.08)"  },
          { label: "Inativos", value: inativos,     color: "#f97316",  bg: "rgba(249,115,22,0.08)"  },
        ].map((s) => (
          <Card key={s.label} flex={1} minWidth={100} borderWidth={1} borderRadius="$4"
            padding="$3" gap="$1" backgroundColor={s.bg}
            borderColor={`${s.color}30`}>
            <Text style={{ color: s.color }} fontSize={26} fontWeight="bold">{s.value}</Text>
            <Text color="$color11" fontSize={12}>{s.label}</Text>
          </Card>
        ))}
      </XStack>

      {/* Adicionar novo */}
      <Card borderWidth={1} backgroundColor="$color2" borderColor="$borderColor"
        borderRadius="$5" padding="$4" gap="$3">
        <SectionTitle>Adicionar Convênio</SectionTitle>
        <XStack gap="$2" flexWrap="wrap" alignItems="flex-end">
          <YStack flex={2} minWidth={180} gap="$1">
            <Text color="$color10" fontSize={12}>Nome do convênio</Text>
            <Input
              id="input-novo-convenio"
              value={novoNome}
              onChangeText={setNovoNome}
              placeholder="Ex: Unimed Nacional"
              backgroundColor="$color2" borderColor="$borderColor"
              borderRadius="$3" height={42} paddingHorizontal="$3"
              color="$color12" fontSize={14}
              hoverStyle={{ borderColor: "$green8" }}
              focusStyle={{ borderColor: "$green10", outlineWidth: 0 }}
              onSubmitEditing={adicionar}
            />
          </YStack>
          <YStack flex={1} minWidth={140} gap="$1">
            <Text color="$color10" fontSize={12}>Categoria</Text>
            <div style={{ position: "relative", width: "100%", height: "42px" }}>
              <select value={novaCategoria} onChange={(e) => setNovaCategoria(e.target.value)} style={selectStyle}>
                {CATEGORIAS_CONVENIO.map((cat) => (
                  <option key={cat} value={cat} style={{ color: "black" }}>{cat}</option>
                ))}
              </select>
              <div style={{ position: "absolute", right: "12px", top: "14px", pointerEvents: "none" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
              </div>
            </div>
          </YStack>
          <Button size="$3" borderRadius="$3" height={42}
            backgroundColor="$green9" hoverStyle={{ backgroundColor: "$green10" }}
            onPress={adicionar} id="btn-add-convenio">
            <XStack gap="$1" alignItems="center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              <Text color="white" fontSize={13} fontWeight="bold">Adicionar</Text>
            </XStack>
          </Button>
        </XStack>
      </Card>

      {/* Busca + Filtro */}
      <XStack gap="$2" flexWrap="wrap" alignItems="center">
        <YStack flex={2} minWidth={180} gap="$1">
          <Input
            id="input-busca-convenio"
            value={busca}
            onChangeText={setBusca}
            placeholder="🔍  Buscar convênio..."
            backgroundColor="$color2" borderColor="$borderColor"
            borderRadius="$3" height={38} paddingHorizontal="$3"
            color="$color12" fontSize={13}
            hoverStyle={{ borderColor: "$green8" }}
            focusStyle={{ borderColor: "$green10", outlineWidth: 0 }}
          />
        </YStack>
        <YStack flex={1} minWidth={130}>
          <div style={{ position: "relative", width: "100%", height: "38px" }}>
            <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} style={selectSmStyle}>
              {categorias.map((cat) => (
                <option key={cat} value={cat} style={{ color: "black" }}>{cat}</option>
              ))}
            </select>
            <div style={{ position: "absolute", right: "12px", top: "12px", pointerEvents: "none" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
            </div>
          </div>
        </YStack>
      </XStack>

      {/* Lista */}
      <Card borderWidth={1} backgroundColor="$color2" borderColor="$borderColor" borderRadius="$5" overflow="hidden">
        {listaFiltrada.length === 0 ? (
          <YStack padding="$6" alignItems="center" gap="$2">
            <Text fontSize={32}>🏥</Text>
            <Text color="$color11" fontSize={14}>Nenhum convênio encontrado.</Text>
          </YStack>
        ) : (
          listaFiltrada.map((c, idx) => {
            const isEditing = editandoId === c.id;
            const isLast = idx === listaFiltrada.length - 1;
            return (
              <XStack key={c.id} alignItems="center" gap="$3" paddingHorizontal="$4" paddingVertical="$3"
                borderBottomWidth={isLast ? 0 : 1} borderColor="$borderColor"
                backgroundColor={isEditing ? "rgba(16,185,129,0.04)" : "transparent"}
                hoverStyle={{ backgroundColor: "$color3" }}
                animation="quick">

                {/* Toggle ativo */}
                <XStack
                  id={`toggle-conv-${c.id}`}
                  role="switch" aria-checked={c.ativo}
                  onPress={() => toggleAtivo(c.id)}
                  width={36} height={20} borderRadius="$10"
                  cursor="pointer" position="relative"
                  backgroundColor={c.ativo ? "$green9" : "$color5"}
                  flexShrink={0}>
                  <Circle size={16} backgroundColor="white"
                    position="absolute" top={2} left={c.ativo ? 18 : 2} />
                </XStack>

                {/* Nome / edição */}
                {isEditing ? (
                  <XStack flex={1} gap="$2" alignItems="center" flexWrap="wrap">
                    <Input
                      id={`edit-nome-${c.id}`}
                      value={editNome} onChangeText={setEditNome}
                      backgroundColor="$color1" borderColor="$green8"
                      borderRadius="$3" height={36} paddingHorizontal="$3"
                      color="$color12" fontSize={14} flex={2} minWidth={140}
                      focusStyle={{ borderColor: "$green10", outlineWidth: 0 }}
                      onSubmitEditing={() => salvarEdicao(c.id)}
                    />
                    <div style={{ position: "relative", minWidth: "130px", height: "36px", flex: 1 }}>
                      <select value={editCategoria} onChange={(e) => setEditCategoria(e.target.value)}
                        style={{ ...selectSmStyle, height: "36px" }}>
                        {CATEGORIAS_CONVENIO.map((cat) => (
                          <option key={cat} value={cat} style={{ color: "black" }}>{cat}</option>
                        ))}
                      </select>
                      <div style={{ position: "absolute", right: "10px", top: "11px", pointerEvents: "none" }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                      </div>
                    </div>
                  </XStack>
                ) : (
                  <XStack flex={1} alignItems="center" gap="$2" flexWrap="wrap">
                    <Text color={c.ativo ? "$color12" : "$color9"} fontSize={14}
                      fontWeight="500" flex={1}>{c.nome}</Text>
                    <XStack paddingHorizontal="$2" paddingVertical={3} borderRadius="$10"
                      backgroundColor="rgba(255,255,255,0.06)">
                      <Text color="$color10" fontSize={11}>{c.categoria}</Text>
                    </XStack>
                    {!c.ativo && (
                      <XStack paddingHorizontal="$2" paddingVertical={3} borderRadius="$10"
                        backgroundColor="rgba(249,115,22,0.1)">
                        <Text color="#f97316" fontSize={11} fontWeight="bold">Inativo</Text>
                      </XStack>
                    )}
                  </XStack>
                )}

                {/* Ações */}
                <XStack gap="$1" flexShrink={0}>
                  {isEditing ? (
                    <>
                      <Button size="$2" borderRadius="$3"
                        backgroundColor="$green9" hoverStyle={{ backgroundColor: "$green10" }}
                        onPress={() => salvarEdicao(c.id)}
                        id={`btn-salvar-${c.id}`}>
                        <Text color="white" fontSize={12} fontWeight="bold">✓ Salvar</Text>
                      </Button>
                      <Button size="$2" borderRadius="$3"
                        backgroundColor="$color3" hoverStyle={{ backgroundColor: "$color4" }}
                        onPress={() => setEditandoId(null)}
                        id={`btn-cancelar-${c.id}`}>
                        <Text color="$color11" fontSize={12}>Cancelar</Text>
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button size="$2" borderRadius="$3" borderWidth={1}
                        borderColor="$borderColor" backgroundColor="transparent"
                        hoverStyle={{ backgroundColor: "$color3", borderColor: "$green8" }}
                        onPress={() => iniciarEdicao(c)}
                        id={`btn-editar-${c.id}`}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </Button>
                      <Button size="$2" borderRadius="$3" borderWidth={1}
                        borderColor="rgba(244,63,94,0.3)" backgroundColor="rgba(244,63,94,0.06)"
                        hoverStyle={{ backgroundColor: "rgba(244,63,94,0.15)" }}
                        onPress={() => remover(c.id)}
                        id={`btn-remover-${c.id}`}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                          stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14H6L5 6" />
                          <path d="M10 11v6M14 11v6" />
                          <path d="M9 6V4h6v2" />
                        </svg>
                      </Button>
                    </>
                  )}
                </XStack>
              </XStack>
            );
          })
        )}
      </Card>

      {/* Rodapé */}
      <XStack justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="$2">
        <Text color="$color10" fontSize={12}>
          {listaFiltrada.length} de {lista.length} convênio{lista.length !== 1 ? "s" : ""}
        </Text>
        <Button size="$3" borderRadius="$4" backgroundColor={saved ? "#059669" : "$green9"}
          hoverStyle={{ backgroundColor: "$green10" }}
          onPress={flash} id="btn-salvar-convenios">
          <Text color="white" fontSize={13} fontWeight="bold">
            {saved ? "✓ Salvo!" : "Publicar alterações"}
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
          <Text color="$color11" fontSize={14}>Gerencie as preferências e configurações da plataforma.</Text>
        </YStack>

        {/* Tabs */}
        <XStack gap="$2" flexWrap="wrap">
          {ABAS.map((a) => {
            const isActive = aba === a.id;
            return (
              <Button key={a.id} size="$3" borderRadius="$4" borderWidth={1}
                borderColor={isActive ? "$green8" : "$borderColor"}
                backgroundColor={isActive ? "rgba(16,185,129,0.1)" : "$color2"}
                hoverStyle={{ backgroundColor: isActive ? "rgba(16,185,129,0.15)" : "$color3" }}
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
        {aba === "notificacoes" && <AbaNotificacoes />}
        {aba === "seguranca"    && <AbaSeguranca />}
        {aba === "convenios"    && <AbaConvenios />}

      </YStack>
    </ScrollView>
  );
}
