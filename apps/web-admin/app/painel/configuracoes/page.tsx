"use client";

import { useState, useEffect } from "react";

import { AxiosError } from "axios";
import {
  fetchPerfil, updatePerfil, uploadAvatar,
  fetchNotifPrefs, updateNotifPrefs,
  alterarSenha,
  fetchConvenios, criarConvenio, editarConvenio, toggleConvenio, excluirConvenio,
} from "../../../lib/configuracoes-api";
import type { ConvenioItem } from "../../../lib/configuracoes-api";

// ── Paleta ─────────────────────────────────────────────────────────────────────
const C = {
  bg: "#111111", card: "#1a1a1a", hover: "#222222",
  border: "#27272a", text: "#fafafa", muted: "#a1a1aa", dim: "#71717a",
  green: "#10b981",
};

// ── Types ──────────────────────────────────────────────────────────────────────
type Aba = "dados" | "notificacoes" | "seguranca" | "convenios";

const ABAS: { id: Aba; label: string; icon: string }[] = [
  { id: "dados",        label: "Dados do Admin", icon: "👤" },
  { id: "notificacoes", label: "Notificações",   icon: "🔔" },
  { id: "seguranca",    label: "Segurança",      icon: "🔒" },
  { id: "convenios",    label: "Convênios",      icon: "🏥" },
];

const CATEGORIAS_CONVENIO = ["Nacional", "Regional", "Empresarial", "Odontológico", "Outro"];

/** Extrai mensagem de erro de respostas da API */
function apiErr(err: unknown, fallback = "Erro inesperado. Tente novamente."): string {
  if (err instanceof AxiosError) return err.response?.data?.error ?? fallback;
  return fallback;
}

// ── Shared UI ──────────────────────────────────────────────────────────────────
function HCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ border:`1px solid ${C.border}`, backgroundColor:C.card, borderRadius:12, overflow:"hidden", transition:"all .18s", ...style }}
      onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor="#10b981"; (e.currentTarget as HTMLElement).style.transform="translateY(-1px)"; (e.currentTarget as HTMLElement).style.boxShadow="0 4px 20px rgba(16,185,129,0.08)";}}
      onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor=style?.borderColor as string || C.border; (e.currentTarget as HTMLElement).style.transform="translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow="none";}}>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <p style={{ color:C.muted, fontSize:11, fontWeight:700, letterSpacing:1, textTransform:"uppercase", margin:"0 0 12px" }}>{children}</p>;
}

function InputField({ id, label, value, onChange, type = "text", disabled, placeholder }: {
  id: string; label: string; value: string; onChange: (v: string) => void; type?: string; disabled?: boolean; placeholder?: string;
}) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6, flex:1, minWidth:200 }}>
      <label style={{ color:C.muted, fontSize:12, fontWeight:600 }}>{label}</label>
      <input id={id} type={type} value={value} disabled={disabled} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{ background:disabled?"rgba(255,255,255,0.03)":"#141414", border:`1px solid ${C.border}`, borderRadius:10, height:42, padding:"0 12px", color:disabled?C.dim:C.text, fontSize:14, fontFamily:"inherit", outline:"none", width:"100%", transition:"border-color .2s" }}
        onFocus={e=>(e.target.style.borderColor=C.green)} onBlur={e=>(e.target.style.borderColor=C.border)}
      />
    </div>
  );
}

function Toggle({ id, label, desc, value, onChange }: { id: string; label: string; desc: string; value: boolean; onChange: () => void; }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 0", borderBottom:`1px solid ${C.border}` }}>
      <div style={{ flex:1, display:"flex", flexDirection:"column", gap:2, paddingRight:16 }}>
        <span style={{ color:C.text, fontSize:14, fontWeight:600 }}>{label}</span>
        <span style={{ color:C.muted, fontSize:12 }}>{desc}</span>
      </div>
      <button id={id} role="switch" aria-checked={value} onClick={onChange}
        style={{ width:44, height:24, borderRadius:99, border:"none", cursor:"pointer", background: value ? C.green : "#27272a", position:"relative", transition:"background 0.2s", flexShrink:0 }}>
        <span style={{ position:"absolute", top:2, left: value ? 22 : 2, width:20, height:20, borderRadius:"50%", background:"#fff", transition:"left 0.2s" }} />
      </button>
    </div>
  );
}

function SaveButton({ id, saved, onClick, text = "Salvar alterações" }: { id: string; saved: boolean; onClick: () => void; text?: string; }) {
  return (
    <button id={id} onClick={onClick} style={{ padding:"10px 20px", borderRadius:8, background:saved?"#059669":C.green, border:"none", color:"white", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", transition:"background .15s" }}
      onMouseEnter={e=>!saved&&((e.target as HTMLElement).style.background="#0ea370")} onMouseLeave={e=>!saved&&((e.target as HTMLElement).style.background=C.green)}>
      {saved ? "✓ Salvo!" : text}
    </button>
  );
}

// ── Aba: Dados do Admin ──
function AbaDados() {
  const [nome,      setNome]      = useState("");
  const [tel,       setTel]       = useState("");
  const [email,     setEmail]     = useState("");
  const [user,      setUser]      = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  useEffect(() => {
    fetchPerfil()
      .then(p => {
        setNome(p.name ?? "");
        setEmail(p.email);
        setTel(p.phone ?? "");
        setUser(p.username ?? "");
        setAvatarUrl(p.avatarUrl);
      })
      .catch(() => setError("Não foi possível carregar o perfil."))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setError(null); setSaving(true);
    try {
      const updated = await updatePerfil({ name: nome, phone: tel, username: user });
      setNome(updated.name ?? ""); setTel(updated.phone ?? ""); setUser(updated.username ?? "");
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch (err) { setError(apiErr(err)); }
    finally { setSaving(false); }
  }

  async function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const result = await uploadAvatar(file);
      // avatarUrl vem como "/uploads/avatars/uuid.ext" — relativo via proxy Next.js
      setAvatarUrl(result.avatarUrl);
    } catch (err) { setError(apiErr(err, "Erro ao enviar foto.")); }
  }

  // O path "/uploads/..." é servido pelo proxy do Next.js que redireciona para o Express
  const avatarSrc = avatarUrl ?? "https://picsum.photos/200/200?random=40";

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16, animation:"fadeIn .3s ease" }}>
      {loading ? (
        <div style={{ padding:40, textAlign:"center", color:C.muted }}>Carregando...</div>
      ) : (
        <>
          <HCard style={{ padding:20 }}>
            <div style={{ display:"flex", alignItems:"center", gap:20, flexWrap:"wrap" }}>
              <div style={{ position:"relative" }}>
                <img src={avatarSrc} style={{ width:80, height:80, borderRadius:"50%", objectFit:"cover", border:`2px solid ${C.green}` }} alt="Avatar do admin" />
                {/* label abre o file picker nativamente sem JS — mais robusto que ref.click() */}
                <label
                  htmlFor="avatar-upload-input"
                  title="Clique para trocar a foto"
                  style={{ position:"absolute", bottom:0, right:0, background:C.green, border:`2px solid ${C.card}`, borderRadius:"50%", width:30, height:30, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                </label>
                <input
                  id="avatar-upload-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display:"none" }}
                  onChange={handleAvatar}
                />

              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                <span style={{ color:C.text, fontSize:20, fontWeight:700 }}>{nome || email}</span>
                <span style={{ color:C.muted, fontSize:13 }}>{email}</span>
                <span style={{ color:C.green, fontSize:11, fontWeight:700, background:"rgba(16,185,129,0.12)", padding:"3px 12px", borderRadius:999, alignSelf:"flex-start", marginTop:6 }}>Administrador · Nível 5 🔐</span>
              </div>
            </div>
          </HCard>

          <HCard style={{ padding:20, display:"flex", flexDirection:"column", gap:20 }}>
            <SectionTitle>Dados Pessoais</SectionTitle>
            <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
              <InputField id="input-nome"  label="Nome completo" value={nome}  onChange={setNome} />
              <InputField id="input-email" label="E-mail"        value={email} onChange={() => {}} type="email" disabled />
            </div>
            <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
              <InputField id="input-tel"  label="Telefone"        value={tel}  onChange={setTel}  type="tel" />
              <InputField id="input-user" label="Nome de usuário" value={user} onChange={setUser} />
            </div>
            {error && <p style={{ color:"#f43f5e", fontSize:13, margin:0 }}>{error}</p>}
          </HCard>

          <div style={{ display:"flex", justifyContent:"flex-end" }}>
            <SaveButton id="btn-salvar-dados" saved={saved} onClick={handleSave} text={saving ? "Salvando..." : "Salvar alterações"} />
          </div>
        </>
      )}
    </div>
  );
}

// ── Aba: Notificações ──
function AbaNotificacoes() {
  const [notifs, setNotifs] = useState({
    novaConsulta: true, cancelamento: true, novoUsuario: true,
    assinaturaVencendo: true, relatorioSemanal: false,
    canalEmail: true, canalWhatsapp: false, canalPush: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    fetchNotifPrefs()
      .then(p => setNotifs({
        novaConsulta: p.novaConsulta, cancelamento: p.cancelamento,
        novoUsuario: p.novoUsuario, assinaturaVencendo: p.assinaturaVencendo,
        relatorioSemanal: p.relatorioSemanal,
        canalEmail: p.canalEmail, canalWhatsapp: p.canalWhatsapp, canalPush: p.canalPush,
      }))
      .catch(() => setError("Não foi possível carregar as preferências."))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (key: keyof typeof notifs) => setNotifs(p => ({ ...p, [key]: !p[key] }));

  async function handleSave() {
    setError(null); setSaving(true);
    try {
      await updateNotifPrefs({
        novaConsulta: notifs.novaConsulta, cancelamento: notifs.cancelamento,
        novoUsuario: notifs.novoUsuario, assinaturaVencendo: notifs.assinaturaVencendo,
        relatorioSemanal: notifs.relatorioSemanal,
        canalEmail: notifs.canalEmail, canalWhatsapp: notifs.canalWhatsapp, canalPush: notifs.canalPush,
      });
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch (err) { setError(apiErr(err)); }
    finally { setSaving(false); }
  }

  if (loading) return <div style={{ padding:40, textAlign:"center", color:C.muted }}>Carregando...</div>;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16, maxWidth:680, animation:"fadeIn .3s ease" }}>
      <HCard style={{ padding:"16px 20px" }}>
        <SectionTitle>Consultas</SectionTitle>
        <Toggle id="notif-nova-consulta" label="Nova consulta agendada" desc="Quando um usuário agenda uma consulta" value={notifs.novaConsulta} onChange={()=>toggle("novaConsulta")} />
        <Toggle id="notif-cancelamento"  label="Consulta cancelada"     desc="Alertas de consultas canceladas"      value={notifs.cancelamento} onChange={()=>toggle("cancelamento")} />
      </HCard>

      <HCard style={{ padding:"16px 20px" }}>
        <SectionTitle>Usuários &amp; Assinaturas</SectionTitle>
        <Toggle id="notif-novo-usuario" label="Novo usuário cadastrado" desc="Alerta quando um novo usuário se registra" value={notifs.novoUsuario}       onChange={()=>toggle("novoUsuario")} />
        <Toggle id="notif-assinatura"   label="Assinatura vencendo"     desc="Planos próximos do vencimento"           value={notifs.assinaturaVencendo}  onChange={()=>toggle("assinaturaVencendo")} />
        <Toggle id="notif-relatorio"    label="Relatório semanal"       desc="Resumo de métricas toda segunda-feira"   value={notifs.relatorioSemanal}    onChange={()=>toggle("relatorioSemanal")} />
      </HCard>

      <HCard style={{ padding:"16px 20px" }}>
        <SectionTitle>Canais</SectionTitle>
        <Toggle id="notif-email"    label="E-mail"   desc="Notificações por e-mail"   value={notifs.canalEmail}    onChange={()=>toggle("canalEmail")} />
        <Toggle id="notif-whatsapp" label="WhatsApp" desc="Notificações via WhatsApp" value={notifs.canalWhatsapp} onChange={()=>toggle("canalWhatsapp")} />
        <Toggle id="notif-push"     label="Push"     desc="Notificações no navegador" value={notifs.canalPush}     onChange={()=>toggle("canalPush")} />
      </HCard>

      {error && <p style={{ color:"#f43f5e", fontSize:13, margin:0 }}>{error}</p>}
      <div style={{ display:"flex", justifyContent:"flex-end" }}>
        <SaveButton id="btn-salvar-notificacoes" saved={saved} onClick={handleSave} text={saving ? "Salvando..." : "Salvar preferências"} />
      </div>
    </div>
  );
}

// ── Aba: Segurança ──
function AbaSeguranca() {
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha,  setNovaSenha]  = useState("");
  const [confirmar,  setConfirmar]  = useState("");
  const [show,    setShow]    = useState({ atual: false, nova: false, confirmar: false });
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  let strength = 0;
  if (novaSenha.length >= 8)  strength++;
  if (novaSenha.length >= 10 && /[A-Z]/.test(novaSenha)) strength++;
  if (novaSenha.length >= 12 && /[0-9]/.test(novaSenha)) strength++;
  if (novaSenha.length >= 14 && /[^a-zA-Z0-9]/.test(novaSenha)) strength++;

  const strengthColors = ["#f43f5e", "#f97316", "#facc15", "#10b981"];
  const strengthLabel  = ["Muito curta", "Fraca", "Razoável", "Forte"];

  async function handleSave() {
    setError(null); setSaving(true);
    try {
      await alterarSenha({ senhaAtual, novaSenha, confirmar });
      setSaved(true); setTimeout(() => setSaved(false), 2500);
      setSenhaAtual(""); setNovaSenha(""); setConfirmar("");
    } catch (err) { setError(apiErr(err)); }
    finally { setSaving(false); }
  }

  function PwdInput({ id, label, field, value, onChange }: { id: string; label: string; field: "atual"|"nova"|"confirmar"; value: string; onChange: (v:string)=>void; }) {
    return (
      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
        <label style={{ color:C.muted, fontSize:12, fontWeight:600 }}>{label}</label>
        <div style={{ position:"relative" }}>
          <input id={id} type={show[field] ? "text" : "password"} value={value} onChange={e=>onChange(e.target.value)}
            style={{ background:"#141414", border:`1px solid ${C.border}`, borderRadius:10, height:42, padding:"0 40px 0 12px", color:C.text, fontSize:14, fontFamily:"inherit", outline:"none", width:"100%", transition:"border-color .2s" }}
            onFocus={e=>(e.target.style.borderColor=C.green)} onBlur={e=>(e.target.style.borderColor=C.border)} />
          <button type="button" onClick={()=>setShow(p=>({...p, [field]:!p[field]}))} style={{ position:"absolute", right:10, top:10, background:"none", border:"none", cursor:"pointer", color:C.green }}>
            {show[field]
              ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            }
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16, maxWidth:500, animation:"fadeIn .3s ease" }}>
      <HCard style={{ padding:20, display:"flex", flexDirection:"column", gap:16 }}>
        <SectionTitle>Alterar senha</SectionTitle>
        <PwdInput id="input-senha-atual" label="Senha atual" field="atual" value={senhaAtual} onChange={setSenhaAtual} />
        <PwdInput id="input-nova-senha"  label="Nova senha"  field="nova"  value={novaSenha}  onChange={setNovaSenha} />
        {novaSenha.length > 0 && (
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            <div style={{ display:"flex", gap:4 }}>
              {[0,1,2,3].map(i => <div key={i} style={{ flex:1, height:4, borderRadius:4, background: i<strength ? strengthColors[strength-1] : "rgba(255,255,255,0.1)" }} />)}
            </div>
            <span style={{ fontSize:12, fontWeight:600, color: strength>0 ? strengthColors[strength-1] : C.dim }}>{strength===0 ? "Senha muito curta" : strengthLabel[strength-1]}</span>
          </div>
        )}
        <PwdInput id="input-confirmar-senha" label="Confirmar nova senha" field="confirmar" value={confirmar} onChange={setConfirmar} />
        {error && <p style={{ color:"#f43f5e", fontSize:13, margin:0 }}>{error}</p>}
      </HCard>
      <div style={{ display:"flex", justifyContent:"flex-end" }}>
        <SaveButton id="btn-salvar-senha" saved={saved} onClick={handleSave} text={saving ? "Salvando..." : "Salvar senha"} />
      </div>
    </div>
  );
}

// ── Aba: Convênios ──
function AbaConvenios() {
  const [lista,          setLista]          = useState<ConvenioItem[]>([]);
  const [stats,          setStats]          = useState({ total:0, ativos:0, inativos:0 });
  const [novoNome,       setNovoNome]       = useState("");
  const [novaCategoria,  setNovaCategoria]  = useState(CATEGORIAS_CONVENIO[0]);
  const [busca,          setBusca]          = useState("");
  const [editandoId,     setEditandoId]     = useState<string|null>(null);
  const [editNome,       setEditNome]       = useState("");
  const [editCategoria,  setEditCategoria]  = useState("");
  const [filtroCategoria,setFiltroCategoria]= useState("Todos");
  const [loading,        setLoading]        = useState(true);
  const [actionError,    setActionError]    = useState<string|null>(null);

  function reloadFromApi() {
    return fetchConvenios().then(r => { setLista(r.convenios); setStats(r.stats); });
  }

  useEffect(() => {
    reloadFromApi().catch(() => setActionError("Não foi possível carregar os convênios.")).finally(() => setLoading(false));
  }, []);

  async function adicionar() {
    const t = novoNome.trim();
    if (!t) return;
    setActionError(null);
    try {
      const novo = await criarConvenio({ nome: t, categoria: novaCategoria });
      setLista(p => [...p, novo]);
      setStats(s => ({ ...s, total: s.total+1, ativos: s.ativos+1 }));
      setNovoNome("");
    } catch (err) { setActionError(apiErr(err)); }
  }

  async function remover(id: string) {
    setActionError(null);
    try {
      await excluirConvenio(id);
      setLista(p => p.filter(c => c.id !== id));
      setStats(s => {
        const era = lista.find(c=>c.id===id);
        return { total: s.total-1, ativos: era?.ativo ? s.ativos-1 : s.ativos, inativos: !era?.ativo ? s.inativos-1 : s.inativos };
      });
    } catch (err) { setActionError(apiErr(err)); }
  }

  async function toggleAtivo(id: string) {
    setActionError(null);
    try {
      const updated = await toggleConvenio(id);
      setLista(p => p.map(c => c.id===id ? updated : c));
      setStats(s => updated.ativo
        ? { ...s, ativos: s.ativos+1, inativos: s.inativos-1 }
        : { ...s, ativos: s.ativos-1, inativos: s.inativos+1 });
    } catch (err) { setActionError(apiErr(err)); }
  }

  function iniciarEdicao(c: ConvenioItem) { setEditandoId(c.id); setEditNome(c.nome); setEditCategoria(c.categoria); }

  async function salvarEdicao(id: string) {
    const t = editNome.trim();
    if (!t) return;
    setActionError(null);
    try {
      const updated = await editarConvenio(id, { nome: t, categoria: editCategoria });
      setLista(p => p.map(c => c.id===id ? updated : c));
      setEditandoId(null);
    } catch (err) { setActionError(apiErr(err)); }
  }

  const filtrados = lista.filter(c =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) &&
    (filtroCategoria==="Todos" || c.categoria===filtroCategoria)
  );

  if (loading) return <div style={{ padding:40, textAlign:"center", color:C.muted }}>Carregando...</div>;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16, animation:"fadeIn .3s ease" }}>
      {/* Stats */}
      <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
        {[
          { label:"Total",    v:stats.total,    cor:C.text,    bg:"rgba(255,255,255,0.05)" },
          { label:"Ativos",   v:stats.ativos,   cor:C.green,   bg:"rgba(16,185,129,0.12)" },
          { label:"Inativos", v:stats.inativos, cor:"#f97316", bg:"rgba(249,115,22,0.12)" },
        ].map((s,i) => (
          <div key={i} style={{ flex:1, minWidth:120, background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:16, display:"flex", flexDirection:"column", gap:4 }}>
            <span style={{ color:s.cor, fontSize:28, fontWeight:800, lineHeight:1 }}>{s.v}</span>
            <span style={{ color:C.muted, fontSize:13 }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Adicionar */}
      <HCard style={{ padding:"16px 20px" }}>
        <SectionTitle>Adicionar Convênio</SectionTitle>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"flex-end" }}>
          <InputField id="input-novo-convenio" label="Nome do convênio" value={novoNome} onChange={setNovoNome} placeholder="Ex: Unimed Nacional" />
          <div style={{ display:"flex", flexDirection:"column", gap:6, flex:1, minWidth:150 }}>
            <label style={{ color:C.muted, fontSize:12, fontWeight:600 }}>Categoria</label>
            <div style={{ position:"relative" }}>
              <select value={novaCategoria} onChange={e=>setNovaCategoria(e.target.value)} style={{ width:"100%", height:42, background:"#141414", border:`1px solid ${C.border}`, borderRadius:10, padding:"0 12px", color:C.text, fontSize:14, appearance:"none", outline:"none", cursor:"pointer", fontFamily:"inherit" }}>
                {CATEGORIAS_CONVENIO.map(c => <option key={c} value={c} style={{ background:C.bg }}>{c}</option>)}
              </select>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" style={{ position:"absolute", right:12, top:15, pointerEvents:"none" }}><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </div>
          <button id="btn-add-convenio" onClick={adicionar} style={{ height:42, padding:"0 20px", borderRadius:10, background:C.green, border:"none", color:"white", fontSize:14, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:6, transition:"background .15s" }} onMouseEnter={e=>(e.currentTarget.style.background="#0ea370")} onMouseLeave={e=>(e.currentTarget.style.background=C.green)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Adicionar
          </button>
        </div>
        {actionError && <p style={{ color:"#f43f5e", fontSize:13, margin:"8px 0 0" }}>{actionError}</p>}
      </HCard>

      {/* Busca e Filtro */}
      <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
        <input id="input-busca-convenio" value={busca} onChange={e=>setBusca(e.target.value)} placeholder="🔍 Buscar convênio..." style={{ flex:2, minWidth:200, height:42, background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"0 16px", color:C.text, fontSize:14, outline:"none", transition:"border-color .2s" }} onFocus={e=>(e.target.style.borderColor=C.green)} onBlur={e=>(e.target.style.borderColor=C.border)} />
        <div style={{ position:"relative", flex:1, minWidth:140 }}>
          <select value={filtroCategoria} onChange={e=>setFiltroCategoria(e.target.value)} style={{ width:"100%", height:42, background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"0 12px", color:C.text, fontSize:14, appearance:"none", outline:"none", cursor:"pointer" }}>
            {["Todos", ...CATEGORIAS_CONVENIO].map(c => <option key={c} value={c} style={{ background:C.bg }}>{c}</option>)}
          </select>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" style={{ position:"absolute", right:12, top:15, pointerEvents:"none" }}><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </div>

      {/* Lista */}
      <HCard style={{ border:`1px solid ${C.border}` }}>
        {filtrados.length === 0 ? (
          <div style={{ padding:40, textAlign:"center", color:C.muted }}>Nenhum convênio encontrado.</div>
        ) : (
          filtrados.map((c, i) => {
            const isEd = editandoId === c.id;
            return (
              <div key={c.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", borderBottom: i===filtrados.length-1 ? "none" : `1px solid ${C.border}`, background: isEd ? "rgba(16,185,129,0.05)" : "transparent", transition:"background .15s" }} onMouseEnter={e=>!isEd&&(e.currentTarget.style.background=C.hover)} onMouseLeave={e=>!isEd&&(e.currentTarget.style.background="transparent")}>
                <Toggle id={`toggle-conv-${c.id}`} label="" desc="" value={c.ativo} onChange={()=>toggleAtivo(c.id)} />
                {isEd ? (
                  <div style={{ flex:1, display:"flex", gap:10, flexWrap:"wrap" }}>
                    <input value={editNome} onChange={e=>setEditNome(e.target.value)} style={{ flex:2, minWidth:150, height:36, background:"#141414", border:`1px solid ${C.green}`, borderRadius:8, padding:"0 12px", color:C.text, fontSize:14, outline:"none" }} />
                    <select value={editCategoria} onChange={e=>setEditCategoria(e.target.value)} style={{ flex:1, minWidth:130, height:36, background:"#141414", border:`1px solid ${C.border}`, borderRadius:8, padding:"0 12px", color:C.text, fontSize:14, outline:"none" }}>
                      {CATEGORIAS_CONVENIO.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                ) : (
                  <div style={{ flex:1, display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                    <span style={{ color:c.ativo?C.text:C.muted, fontSize:14, fontWeight:600, flex:1, minWidth:120 }}>{c.nome}</span>
                    <span style={{ color:C.dim, fontSize:11, fontWeight:600, background:"rgba(255,255,255,0.05)", padding:"3px 10px", borderRadius:999 }}>{c.categoria}</span>
                    {!c.ativo && <span style={{ color:"#f97316", fontSize:11, fontWeight:700, background:"rgba(249,115,22,0.12)", padding:"3px 10px", borderRadius:999 }}>INATIVO</span>}
                  </div>
                )}
                <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                  {isEd ? (
                    <>
                      <button onClick={()=>salvarEdicao(c.id)} style={{ padding:"6px 12px", background:C.green, border:"none", borderRadius:6, color:"white", fontSize:12, fontWeight:700, cursor:"pointer" }}>Salvar</button>
                      <button onClick={()=>setEditandoId(null)} style={{ padding:"6px 12px", background:"transparent", border:`1px solid ${C.border}`, borderRadius:6, color:C.muted, fontSize:12, fontWeight:600, cursor:"pointer" }}>Cancelar</button>
                    </>
                  ) : (
                    <>
                      <button onClick={()=>iniciarEdicao(c)} style={{ width:32, height:32, borderRadius:8, background:"transparent", border:`1px solid ${C.border}`, color:C.muted, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"all .15s" }} onMouseEnter={e=>{e.currentTarget.style.borderColor=C.green;e.currentTarget.style.color=C.green}} onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.muted}}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button onClick={()=>remover(c.id)} style={{ width:32, height:32, borderRadius:8, background:"transparent", border:`1px solid ${C.border}`, color:"#f43f5e", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"all .15s" }} onMouseEnter={e=>{e.currentTarget.style.background="rgba(244,63,94,0.1)";e.currentTarget.style.borderColor="rgba(244,63,94,0.3)"}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor=C.border}}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </HCard>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
        <span style={{ color:C.dim, fontSize:13 }}>Mostrando {filtrados.length} convênios</span>
      </div>
    </div>
  );
}




// ── Main Page ──────────────────────────────────────────────────────────────────
export default function ConfigPage() {
  const [aba, setAba] = useState<Aba>("dados");

  return (
    <>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
        @media(max-width:680px){ .cfg-tab-desk{display:none!important} .cfg-tab-mob{display:block!important} }
        @media(min-width:681px){ .cfg-tab-desk{display:flex!important} .cfg-tab-mob{display:none!important} }
      `}</style>
      <div style={{ width:"100%", maxWidth:1200, margin:"0 auto", paddingBottom:32, display:"flex", flexDirection:"column", gap:20 }}>

        {/* Header */}
        <div>
          <h2 style={{ color:C.text, fontSize:24, fontWeight:800, margin:0, letterSpacing:"-0.02em" }}>Configurações</h2>
          <p style={{ color:C.muted, fontSize:14, margin:"4px 0 0" }}>Gerencie as preferências e configurações da plataforma.</p>
        </div>

        {/* Tabs Mobile */}
        <div className="cfg-tab-mob">
          <select value={aba} onChange={e=>setAba(e.target.value as Aba)} style={{ width:"100%", background:C.card, border:`1px solid ${C.green}`, borderRadius:10, padding:"12px 16px", color:C.green, fontSize:14, fontWeight:700, fontFamily:"inherit", outline:"none", cursor:"pointer", appearance:"none" }}>
            {ABAS.map(a=><option key={a.id} value={a.id}>{a.icon} {a.label}</option>)}
          </select>
        </div>

        {/* Tabs Desktop */}
        <div className="cfg-tab-desk" style={{ gap:10, flexWrap:"wrap" }}>
          {ABAS.map(a => {
            const isActive = aba === a.id;
            return (
              <button key={a.id} onClick={()=>setAba(a.id)} style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 18px", borderRadius:10, border:`1px solid ${isActive?C.green:C.border}`, background:isActive?"rgba(16,185,129,0.1)":C.card, color:isActive?C.green:C.muted, fontSize:14, fontWeight:isActive?700:600, cursor:"pointer", fontFamily:"inherit", transition:"all .15s" }}
                onMouseEnter={e=>!isActive&&((e.target as HTMLElement).style.background=C.hover)} onMouseLeave={e=>!isActive&&((e.target as HTMLElement).style.background=C.card)}>
                <span>{a.icon}</span> {a.label}
              </button>
            );
          })}
        </div>

        <div style={{ height:1, background:C.border, width:"100%" }} />

        {/* Content */}
        <div style={{ minHeight:400 }}>
          {aba === "dados"        && <AbaDados />}
          {aba === "notificacoes" && <AbaNotificacoes />}
          {aba === "seguranca"    && <AbaSeguranca />}
          {aba === "convenios"    && <AbaConvenios />}
        </div>

      </div>
    </>
  );
}
