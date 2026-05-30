//@ts-nocheck
"use client";

import { useState, useRef, useEffect } from "react";
import { getPerfil, updatePerfil, uploadAvatar, excluirConta as excluirContaApi, getPlano, listarPlanos, getNotifPrefs, updateNotifPrefs, alterarSenha as alterarSenhaApi, alterarPlano as alterarPlanoApi, cancelarPlano as cancelarPlanoApi } from "../../../lib/perfil-api";
import type { PerfilCliente, PlanoInfo, PlanoDisponivel, NotifPrefs } from "../../../lib/perfil-api";
import { useAuth } from "../../../lib/auth-context";

const C = { bg:"#111111", color2:"#1a1a1a", color3:"#222222", color10:"#71717a", color11:"#a1a1aa", color12:"#fafafa", border:"#27272a" };
function HCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ border:`1px solid ${C.border}`, backgroundColor:C.color2, borderRadius:12, overflow:"hidden", cursor:"pointer", transition:"background .15s, border-color .15s", ...style }}
      onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.backgroundColor=C.color3;(e.currentTarget as HTMLElement).style.borderColor="#10b981";}}
      onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.backgroundColor=(style?.backgroundColor as string)||C.color2;(e.currentTarget as HTMLElement).style.borderColor=(style?.borderColor as string)||C.border;}}>
      {children}
    </div>
  );
}

type Aba = "dados" | "plano" | "notificacoes" | "senha";



const ABAS: { id: Aba; label: string; icon: string }[] = [
  { id: "dados",        label: "Dados pessoais", icon: "👤" },
  { id: "plano",        label: "Meu plano",      icon: "⭐" },
  { id: "notificacoes", label: "Notificações",   icon: "🔔" },
  { id: "senha",        label: "Senha",          icon: "🔒" },
];

/* ── helpers ── */
function SectionTitle({ children }: { children: string }) {
  return <p style={{ color:C.color11, fontSize:11, fontWeight:"bold", letterSpacing:1, textTransform:"uppercase", marginBottom:8, marginTop:0 }}>{children}</p>;
}

function InputField({ id, label, value, onChange, type = "text", disabled }: {
  id: string; label: string; value: string;
  onChange: (v: string) => void; type?: string; disabled?: boolean;
}) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:4, flex:1 }}>
      <span style={{ color:C.color10, fontSize:12 }}>{label}</span>
      <input id={id} type={type} value={value} disabled={disabled} onChange={(e)=>onChange(e.target.value)}
        style={{ background:disabled?"rgba(255,255,255,0.03)":"#141414", border:"1px solid #262626", borderRadius:10, height:42, padding:"0 12px", color:disabled?"#52525b":"#fafafa", fontSize:14, fontFamily:"inherit", outline:"none", width:"100%" }}/>
    </div>
  );
}

function Toggle({ id, label, desc, value, onChange }: {
  id: string; label: string; desc: string; value: boolean; onChange: () => void;
}) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:12, paddingBottom:12, borderBottom:`1px solid ${C.border}` }}>
      <div style={{ flex:1, display:"flex", flexDirection:"column", gap:2, paddingRight:16 }}>
        <span style={{ color:C.color12, fontSize:14, fontWeight:"500" }}>{label}</span>
        <span style={{ color:C.color11, fontSize:12 }}>{desc}</span>
      </div>
      <button id={id} role="switch" aria-checked={value} onClick={onChange}
        style={{
          width: 44, height: 24, borderRadius: 99, border: "none", cursor: "pointer",
          background: value ? "#10b981" : "#27272a", position: "relative",
          transition: "background 0.2s", flexShrink: 0,
        }}>
        <span style={{
          position: "absolute", top: 2, left: value ? 22 : 2,
          width: 20, height: 20, borderRadius: "50%", background: "#fff",
          transition: "left 0.2s",
        }} />
      </button>
    </div>
  );
}

/* ── Abas ── */
function AbaDados() {
  const avatarRef = useRef<HTMLInputElement>(null);
  const [perfil,   setPerfil]   = useState<PerfilCliente|null>(null);
  const [nome,     setNome]     = useState("");
  const [email,    setEmail]    = useState("");
  const [tel,      setTel]      = useState("");
  const [username, setUsername] = useState("");
  const [obj,      setObj]      = useState("Hipertrofia");
  const [loading,  setLoading]  = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [erro,     setErro]     = useState<string|null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showExcluir,  setShowExcluir]  = useState(false);
  const [senhaEx,      setSenhaEx]      = useState("");
  const [excluindo,    setExcluindo]    = useState(false);
  const [erroEx,       setErroEx]       = useState<string|null>(null);

  const { loadingUser, accessToken } = useAuth();

  useEffect(() => {
    // Aguarda o auth estar pronto antes de buscar perfil (evita race condition com refresh)
    if (loadingUser || !accessToken) return;
    getPerfil().then(p => {
      setPerfil(p); setNome(p.name); setEmail(p.email);
      setTel(p.telefone ?? ""); setUsername(p.username ?? "");
      setObj(p.objetivo ?? "Hipertrofia");
    }).catch(() => setErro("Erro ao carregar perfil")).finally(() => setLoading(false));
  }, [loadingUser, accessToken]);

  async function handleSave() {
    setSalvando(true); setErro(null);
    try {
      const u = await updatePerfil({ name: nome, email, telefone: tel, username, objetivo: obj as any });
      setPerfil(u); setSaved(true); setTimeout(() => setSaved(false), 2500);
      window.dispatchEvent(new Event("perfil-atualizado"));
    } catch(e: any) { setErro(e?.response?.data?.error ?? "Erro ao salvar"); }
    finally { setSalvando(false); }
  }

  async function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadingAvatar(true);
    try {
      const r = await uploadAvatar(file);
      // Adiciona cache-busting para forçar o browser a recarregar a nova imagem
      const urlComCache = r.avatarUrl ? `${r.avatarUrl}?t=${Date.now()}` : r.avatarUrl;
      setPerfil(p => p ? {...p, avatarUrl: urlComCache} : p);
      window.dispatchEvent(new Event("perfil-atualizado"));
    } catch(err: any) {
      setErro(err?.response?.data?.error ?? "Erro ao enviar foto. Tente novamente.");
    } finally {
      setUploadingAvatar(false);
      e.target.value = ""; // permite reselecionar o mesmo arquivo
    }
  }

  async function handleExcluir() {
    setExcluindo(true); setErroEx(null);
    try { await excluirContaApi(senhaEx); window.location.href = "/login"; }
    catch(e: any) { setErroEx(e?.response?.data?.error ?? "Erro ao excluir conta"); }
    finally { setExcluindo(false); }
  }

  const avatarSrc = perfil?.avatarUrl ?? "https://picsum.photos/200/200?random=1";
  const planoLabel = `Plano ${perfil?.plano ?? "Plus"} · Ativo`;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

      {showExcluir && (
        <div onClick={e => { if(e.target===e.currentTarget) setShowExcluir(false); }}
          style={{ position:"fixed", inset:0, zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", backgroundColor:"rgba(0,0,0,0.7)", padding:16 }}>
          <div style={{ background:C.color2, border:"1px solid rgba(244,63,94,0.4)", borderRadius:16, padding:24, width:"100%", maxWidth:380 }}>
            <p style={{ color:C.color12, fontWeight:"bold", fontSize:16, margin:"0 0 8px" }}>Excluir conta</p>
            <p style={{ color:C.color11, fontSize:13, margin:"0 0 16px" }}>Ação irreversível. Confirme com sua senha atual:</p>
            <input type="password" value={senhaEx} onChange={e=>setSenhaEx(e.target.value)} placeholder="Sua senha"
              style={{ width:"100%", background:C.color3, border:`1px solid ${C.border}`, borderRadius:8, color:"#fff", padding:"10px 12px", fontSize:13, marginBottom:12, fontFamily:"inherit", boxSizing:"border-box" as any }} />
            {erroEx && <p style={{ color:"#f43f5e", fontSize:12, margin:"0 0 8px" }}>{erroEx}</p>}
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={()=>{setShowExcluir(false);setSenhaEx("");setErroEx(null);}}
                style={{ flex:1, padding:"10px 0", borderRadius:8, background:"transparent", border:`1px solid ${C.border}`, color:C.color11, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>Cancelar</button>
              <button onClick={handleExcluir} disabled={excluindo||!senhaEx}
                style={{ flex:1, padding:"10px 0", borderRadius:8, background:excluindo||!senhaEx?"#52525b":"#f43f5e", border:"none", color:"#fff", fontSize:13, fontWeight:"bold", cursor:excluindo||!senhaEx?"not-allowed":"pointer", fontFamily:"inherit" }}>
                {excluindo?"Excluindo…":"Confirmar exclusão"}
              </button>
            </div>
          </div>
        </div>
      )}

      <HCard style={{ padding:16 }}>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <div style={{ position: "relative" }}>
            <img src={avatarSrc} style={{ width:64, height:64, borderRadius:"50%", objectFit:"cover", border:"2px solid #10b981", opacity:uploadingAvatar?0.5:1 }} alt="" />
            <button id="btn-trocar-avatar" onClick={() => avatarRef.current?.click()}
              style={{ position:"absolute", bottom:0, right:0, background:"#10b981", border:"2px solid #111", borderRadius:"50%", width:28, height:28, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
            </button>
            <input ref={avatarRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatar} />
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
            <span style={{ color:C.color12, fontSize:18, fontWeight:"bold" }}>{loading?"…":nome}</span>
            <span style={{ color:C.color11, fontSize:13 }}>{loading?"…":email}</span>
            <span style={{ color:"#10b981", fontSize:11, fontWeight:"bold", background:"rgba(16,185,129,0.12)", padding:"2px 12px", borderRadius:999, alignSelf:"flex-start", marginTop:4, display:"block" }}>{planoLabel}</span>
          </div>
        </div>
      </HCard>

      <HCard style={{ padding:16, display:"flex", flexDirection:"column", gap:16 }}>
        <SectionTitle>Dados Pessoais</SectionTitle>
        <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
          <InputField id="input-nome"  label="Nome completo" value={nome}  onChange={setNome} />
          <InputField id="input-email" label="E-mail"        value={email} onChange={setEmail} type="email" />
        </div>
        <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
          <InputField id="input-tel"   label="Telefone"      value={tel}   onChange={setTel} type="tel" />
          <InputField id="input-username" label="Nome de usuário" value={username} onChange={setUsername} />
        </div>
      </HCard>

      <HCard style={{ padding:16, display:"flex", flexDirection:"column", gap:12 }}>
        <SectionTitle>Objetivo Fitness</SectionTitle>
        <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
          {["Hipertrofia","Emagrecimento","Saúde Geral","Performance","Reabilitação","Flexibilidade"].map((o)=>{
            const isActive=obj===o;
            return <button key={o} onClick={()=>setObj(o)} id={`obj-${o.toLowerCase().replace(/\s/g,"-")}`} style={{ padding:"6px 16px", borderRadius:999, border:`1px solid ${isActive?"#10b981":C.border}`, backgroundColor:isActive?"rgba(16,185,129,0.12)":"transparent", color:isActive?"#10b981":C.color11, fontSize:13, fontWeight:isActive?"bold":"400", cursor:"pointer", fontFamily:"inherit", transition:"all .15s" }}>{o}</button>;
          })}
        </div>
      </HCard>

      {erro && <p style={{ color:"#f43f5e", fontSize:13, margin:0 }}>{erro}</p>}

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
        <span id="link-termos" style={{ color:C.color10, fontSize:12, textDecoration:"underline", cursor:"pointer" }}>Termos de Uso e Política de Privacidade</span>
        <div style={{ display:"flex", gap:8 }}>
          <button id="btn-excluir-conta" onClick={()=>setShowExcluir(true)} style={{ padding:"8px 16px", borderRadius:8, backgroundColor:"rgba(244,63,94,0.1)", border:"1px solid rgba(244,63,94,0.3)", color:"#f43f5e", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Excluir conta</button>
          <button id="btn-salvar-dados" onClick={handleSave} disabled={salvando} style={{ padding:"8px 16px", borderRadius:8, backgroundColor:saved?"#059669":"#10b981", border:"none", color:"white", fontSize:13, fontWeight:"bold", cursor:"pointer", fontFamily:"inherit" }}>{salvando?"Salvando…":saved?"✓ Salvo!":"Salvar alterações"}</button>
        </div>
      </div>
    </div>
  );
}


function AbaPlano() {
  const [planoAtual,  setPlanoAtual]  = useState<PlanoInfo | null>(null);
  const [disponiveis, setDisponiveis] = useState<PlanoDisponivel[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [salvando,    setSalvando]    = useState<string | null>(null); // planoId sendo selecionado
  const [cancelando,  setCancelando]  = useState(false);
  const [erro,        setErro]        = useState<string | null>(null);
  const [sucesso,     setSucesso]     = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getPlano(), listarPlanos()])
      .then(([atual, lista]) => {
        setPlanoAtual(atual);
        setDisponiveis(lista);
      })
      .catch(() => setErro("Erro ao carregar planos"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSelecionar(p: PlanoDisponivel) {
    setSalvando(p.id); setErro(null); setSucesso(null);
    try {
      await alterarPlanoApi(p.id);
      setPlanoAtual(prev => prev ? { ...prev, planoAtual: p.nome, valor: p.valor, periodo: p.periodo, tipo: p.tipo, consultas: p.consultas, taxa: p.taxa } : prev);
      setSucesso(`Plano "${p.nome}" ativado com sucesso!`);
      setTimeout(() => setSucesso(null), 3000);
    } catch(e: any) { setErro(e?.response?.data?.error ?? "Erro ao selecionar plano"); }
    finally { setSalvando(null); }
  }

  async function handleCancelarPlano() {
    if (!confirm("Cancelar sua assinatura? Você perderá o acesso aos benefícios.")) return;
    setCancelando(true); setErro(null); setSucesso(null);
    try {
      await cancelarPlanoApi();
      setPlanoAtual(prev => prev ? { ...prev, planoAtual: null, valor: null, periodo: null, tipo: null, consultas: null, taxa: null } : prev);
      setSucesso("Assinatura cancelada.");
      setTimeout(() => setSucesso(null), 3000);
    } catch(e: any) { setErro(e?.response?.data?.error ?? "Erro ao cancelar assinatura"); }
    finally { setCancelando(false); }
  }

  // Paleta de cores para cards de planos (rotaciona ciclicamente)
  const PALETA = ["#10b981", "#a78bfa", "#3b82f6", "#f59e0b", "#f43f5e"];

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 48 }}>
        <p style={{ color: C.color11, fontSize: 14 }}>Carregando planos...</p>
      </div>
    );
  }

  const nomePlanoAtual = planoAtual?.planoAtual ?? null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Card do plano atual */}
      <HCard style={{ padding: 16, backgroundColor: "rgba(16,185,129,0.05)", borderColor: "rgba(16,185,129,0.3)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "#10b981", fontSize: 10, fontWeight: "bold", background: "rgba(16,185,129,0.15)", padding: "2px 8px", borderRadius: 999 }}>
                {nomePlanoAtual ? "ATIVO" : "SEM PLANO"}
              </span>
              <span style={{ color: "#fafafa", fontSize: 22, fontWeight: "bold" }}>
                {nomePlanoAtual ?? "—"}
              </span>
            </div>
            {planoAtual?.valor ? (
              <span style={{ color: "#10b981", fontSize: 18, fontWeight: "bold" }}>
                {planoAtual.valor}
                <span style={{ color: "#a1a1aa", fontSize: 13 }}>{planoAtual.periodo}</span>
              </span>
            ) : (
              <span style={{ color: C.color11, fontSize: 14 }}>Nenhum plano contratado</span>
            )}
            {planoAtual?.consultas != null && (
              <span style={{ color: C.color11, fontSize: 13 }}>
                {planoAtual.consultas === 0 ? "Consultas ilimitadas" : `${planoAtual.consultas} consulta(s) incluída(s)`}
              </span>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
            <span style={{ color: "#a1a1aa", fontSize: 13 }}>
              Membro desde <strong style={{ color: "#fafafa" }}>
                {planoAtual?.membrosDesde
                  ? new Date(planoAtual.membrosDesde).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })
                  : "—"}
              </strong>
            </span>
          </div>
        </div>
      </HCard>

      {/* Comparativo de planos */}
      {disponiveis.length > 0 && (
        <>
          <SectionTitle>Planos disponíveis</SectionTitle>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {disponiveis.map((p, idx) => {
              const cor      = PALETA[idx % PALETA.length];
              const isAtual  = nomePlanoAtual?.toLowerCase() === p.nome.toLowerCase();
              return (
                <div
                  key={p.id}
                  style={{
                    flex: 1, minWidth: 200,
                    border: `${isAtual ? 2 : 1}px solid ${isAtual ? cor : C.border}`,
                    backgroundColor: isAtual ? `rgba(16,185,129,0.04)` : C.color2,
                    borderRadius: 12, padding: 16,
                    display: "flex", flexDirection: "column", gap: 12,
                    cursor: "pointer", transition: "background .15s",
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = C.color3}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = isAtual ? "rgba(16,185,129,0.04)" : C.color2}
                >
                  {isAtual && (
                    <span style={{ alignSelf: "flex-start", backgroundColor: cor, color: "white", fontSize: 11, fontWeight: "bold", padding: "2px 12px", borderRadius: 999 }}>✓ Atual</span>
                  )}
                  <span style={{ color: cor, fontSize: 18, fontWeight: "bold" }}>{p.nome}</span>
                  <span style={{ color: "#fafafa", fontSize: 22, fontWeight: "bold" }}>
                    {p.valor}
                    <span style={{ color: "#a1a1aa", fontSize: 13 }}>{p.periodo}</span>
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      <span style={{ color: "#a1a1aa", fontSize: 13 }}>
                        {p.consultas === 0 ? "Consultas ilimitadas" : `${p.consultas} consulta(s)`}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      <span style={{ color: "#a1a1aa", fontSize: 13 }}>Taxa da plataforma: {p.taxa}%</span>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      <span style={{ color: "#a1a1aa", fontSize: 13 }}>Plano {p.tipo.charAt(0) + p.tipo.slice(1).toLowerCase()}</span>
                    </div>
                  </div>
                  <button
                    id={`btn-plano-${p.id}`}
                    disabled={isAtual || salvando === p.id}
                    onClick={() => handleSelecionar(p)}
                    style={{
                      marginTop: "auto", padding: "8px 0", borderRadius: 8,
                      border: `1px solid ${isAtual ? "transparent" : cor}`,
                      backgroundColor: isAtual ? cor : "transparent",
                      color: isAtual ? "white" : cor,
                      fontSize: 13, fontWeight: "bold",
                      cursor: isAtual || !!salvando ? "default" : "pointer",
                      fontFamily: "inherit",
                      opacity: isAtual ? 0.8 : salvando && salvando !== p.id ? 0.5 : 1,
                    }}
                  >
                    {salvando === p.id ? "Ativando..." : isAtual ? "Plano atual" : "Selecionar"}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

        {disponiveis.length === 0 && (
        <div style={{ textAlign: "center", color: C.color11, fontSize: 14, padding: 32, border: `1px dashed ${C.border}`, borderRadius: 12 }}>
          Nenhum plano disponível no momento. Consulte o administrador.
        </div>
      )}

      {erro && <p style={{ color: "#f43f5e", fontSize: 13, margin: 0 }}>{erro}</p>}
      {sucesso && <p style={{ color: "#10b981", fontSize: 13, margin: 0, fontWeight: "bold" }}>✓ {sucesso}</p>}

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          id="btn-cancelar-assinatura"
          disabled={cancelando || !planoAtual?.planoAtual}
          onClick={handleCancelarPlano}
          style={{ padding: "8px 16px", borderRadius: 8, backgroundColor: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.3)", color: cancelando || !planoAtual?.planoAtual ? "#52525b" : "#f43f5e", fontSize: 13, fontWeight: 600, cursor: cancelando || !planoAtual?.planoAtual ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: !planoAtual?.planoAtual ? 0.5 : 1 }}
        >
          {cancelando ? "Cancelando..." : "Cancelar assinatura"}
        </button>
      </div>
    </div>
  );
}

function AbaNotificacoes() {
  const [notifs, setNotifs] = useState({
    confirmacao: true, lembrete: true, cancelamento: true,
    novosProfissionais: false, dicas: false,
    email: true, whatsapp: false, push: true,
  });
  const toggle = (key: keyof typeof notifs) => setNotifs((p) => ({ ...p, [key]: !p[key] }));
  const [saved,    setSaved]    = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro,     setErro]     = useState<string|null>(null);

  useEffect(() => {
    getNotifPrefs().then(p => setNotifs({
      confirmacao: p.confirmacao, lembrete: p.lembrete, cancelamento: p.cancelamento,
      novosProfissionais: p.novosProfissionais, dicas: p.dicas,
      email: p.canalEmail, whatsapp: p.canalWhatsapp, push: p.canalPush,
    })).catch(() => {});
  }, []);

  async function handleSalvar() {
    setSalvando(true); setErro(null);
    try {
      await updateNotifPrefs({ confirmacao: notifs.confirmacao, lembrete: notifs.lembrete, cancelamento: notifs.cancelamento, novosProfissionais: notifs.novosProfissionais, dicas: notifs.dicas, canalEmail: notifs.email, canalWhatsapp: notifs.whatsapp, canalPush: notifs.push });
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch { setErro("Erro ao salvar preferências"); }
    finally { setSalvando(false); }
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16, maxWidth:640 }}>
      <HCard style={{ padding:16 }}>
        <SectionTitle>Consultas</SectionTitle>
        <Toggle id="notif-confirmacao"  label="Confirmação de agendamento" desc="Receba quando uma consulta for confirmada"      value={notifs.confirmacao}        onChange={()=>toggle("confirmacao")} />
        <Toggle id="notif-lembrete"     label="Lembrete de consulta"       desc="Notificação 1h antes da consulta"               value={notifs.lembrete}           onChange={()=>toggle("lembrete")} />
        <Toggle id="notif-cancelamento" label="Cancelamentos"              desc="Alertas de consultas canceladas ou reagendadas" value={notifs.cancelamento}       onChange={()=>toggle("cancelamento")} />
      </HCard>
      <HCard style={{ padding:16 }}>
        <SectionTitle>Descoberta</SectionTitle>
        <Toggle id="notif-novos" label="Novos profissionais" desc="Profissionais que combinam com seu objetivo"    value={notifs.novosProfissionais} onChange={()=>toggle("novosProfissionais")} />
        <Toggle id="notif-dicas" label="Dicas de saúde"     desc="Conteúdo personalizado baseado no seu objetivo" value={notifs.dicas}              onChange={()=>toggle("dicas")} />
      </HCard>
      <HCard style={{ padding:16 }}>
        <SectionTitle>Canais</SectionTitle>
        <Toggle id="notif-email"    label="E-mail"   desc="Notificações por e-mail"       value={notifs.email}    onChange={()=>toggle("email")} />
        <Toggle id="notif-whatsapp" label="WhatsApp" desc="Notificações via WhatsApp"     value={notifs.whatsapp} onChange={()=>toggle("whatsapp")} />
        <Toggle id="notif-push"     label="Push"     desc="Notificações no navegador"     value={notifs.push}     onChange={()=>toggle("push")} />
      </HCard>
      {erro && <p style={{ color:"#f43f5e", fontSize:13, margin:0 }}>{erro}</p>}
      <div style={{ display:"flex", justifyContent:"flex-end" }}>
        <button id="btn-salvar-notificacoes" onClick={handleSalvar} disabled={salvando} style={{ padding:"8px 16px", borderRadius:8, backgroundColor:saved?"#059669":"#10b981", border:"none", color:"white", fontSize:13, fontWeight:"bold", cursor:"pointer", fontFamily:"inherit" }}>{salvando?"Salvando…":saved?"✓ Salvo!":"Salvar preferências"}</button>
      </div>
    </div>
  );
}

function PwdInput({ id, label, field, value, onChange, show, onToggle }: {
  id: string; label: string;
  field: "atual" | "nova" | "confirmar";
  value: string; onChange: (v: string) => void;
  show: boolean; onToggle: () => void;
}) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
      <span style={{ color:C.color10, fontSize:12 }}>{label}</span>
      <div style={{ position: "relative" }}>
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            background: "#141414", border: "1px solid #262626", borderRadius: 10,
            height: 42, padding: "0 40px 0 12px", color: "#fafafa",
            fontSize: 14, fontFamily: "inherit", outline: "none", width: "100%",
          }}
        />
        <button
          type="button"
          id={`toggle-${id}`}
          onClick={onToggle}
          style={{
            position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", cursor: "pointer", color: "#10b981",
          }}>
          {show
            ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
            : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
          }
        </button>
      </div>
    </div>
  );
}

function AbaSenha() {
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha,  setNovaSenha]  = useState("");
  const [confirmar,  setConfirmar]  = useState("");
  const [show,     setShow]     = useState({ atual: false, nova: false, confirmar: false });
  const [saved,    setSaved]    = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro,     setErro]     = useState<string|null>(null);

  async function handleSalvarSenha() {
    if (novaSenha !== confirmar) { setErro("As senhas não coincidem"); return; }
    setSalvando(true); setErro(null);
    try {
      await alterarSenhaApi(senhaAtual, novaSenha, confirmar);
      setSaved(true); setSenhaAtual(""); setNovaSenha(""); setConfirmar("");
      setTimeout(() => setSaved(false), 2500);
    } catch(e: any) { setErro(e?.response?.data?.error ?? "Erro ao alterar senha"); }
    finally { setSalvando(false); }
  }

  let strength = 0;
  if (novaSenha.length >= 8)  strength++;
  if (novaSenha.length >= 10 && /[A-Z]/.test(novaSenha)) strength++;
  if (novaSenha.length >= 12 && /[0-9]/.test(novaSenha)) strength++;
  if (novaSenha.length >= 14 && /[^a-zA-Z0-9]/.test(novaSenha)) strength++;

  const strengthColors = ["#f43f5e", "#f97316", "#facc15", "#10b981"];
  const strengthLabel  = ["Muito curta", "Fraca", "Razoável", "Forte"];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16, maxWidth:480 }}>
      <HCard style={{ padding:16, display:"flex", flexDirection:"column", gap:16 }}>
        <PwdInput id="input-senha-atual"    label="Senha atual"         field="atual"     value={senhaAtual} onChange={setSenhaAtual} show={show.atual}     onToggle={() => setShow(p => ({ ...p, atual:     !p.atual }))} />
        <PwdInput id="input-nova-senha"     label="Nova senha"          field="nova"      value={novaSenha}  onChange={setNovaSenha}  show={show.nova}      onToggle={() => setShow(p => ({ ...p, nova:      !p.nova }))} />
        {novaSenha.length>0&&(
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            <div style={{ display:"flex", gap:4 }}>
              {[0,1,2,3].map(i=>(<div key={i} style={{ flex:1, height:4, borderRadius:4, backgroundColor:i<strength?strengthColors[strength-1]:"rgba(255,255,255,0.08)" }}/>))}
            </div>
            <span style={{ fontSize:12, color:strength>0?strengthColors[strength-1]:"#52525b" }}>{strength===0?"Senha muito curta":strengthLabel[strength-1]}</span>
          </div>
        )}
        <PwdInput id="input-confirmar-senha" label="Confirmar nova senha" field="confirmar" value={confirmar}  onChange={setConfirmar}  show={show.confirmar} onToggle={() => setShow(p => ({ ...p, confirmar: !p.confirmar }))} />
      </HCard>
      {erro && <p style={{ color:"#f43f5e", fontSize:13, margin:"8px 0 0" }}>{erro}</p>}
      <div style={{ display:"flex", justifyContent:"flex-end" }}>
        <button id="btn-salvar-senha" onClick={handleSalvarSenha} disabled={salvando} style={{ padding:"8px 16px", borderRadius:8, backgroundColor:saved?"#059669":"#10b981", border:"none", color:"white", fontSize:13, fontWeight:"bold", cursor:"pointer", fontFamily:"inherit" }}>{salvando?"Salvando…":saved?"✓ Salvo!":"Salvar senha"}</button>
      </div>
    </div>
  );
}

export default function ConfigPage() {
  const [aba, setAba] = useState<Aba>("dados");
  return (
    <>
      <style>{`
        @media(max-width:640px){.cfg-tabs-mob{display:block!important}.cfg-tabs-desk{display:none!important}}
        @media(min-width:641px){.cfg-tabs-mob{display:none!important}.cfg-tabs-desk{display:flex!important}}
      `}</style>
      <div style={{ flex:1, overflowY:"auto", backgroundColor:C.bg }}>
        <div style={{ padding:16, maxWidth:1100, margin:"0 auto", display:"flex", flexDirection:"column", gap:20, width:"100%" }} className="sm:p-6">
          <div>
            <h2 style={{ color:C.color12, fontSize:24, fontWeight:"bold", margin:0 }}>Configurações</h2>
            <span style={{ color:C.color11, fontSize:14 }}>Gerencie suas preferências e dados da conta.</span>
          </div>
          <div className="cfg-tabs-mob" style={{ display:"none" }}>
            <select value={aba} onChange={e=>setAba(e.target.value as Aba)} style={{ width:"100%", background:C.color2, border:"1px solid rgba(16,185,129,0.4)", borderRadius:12, padding:"12px 16px", color:"#10b981", fontSize:14, fontWeight:"bold", fontFamily:"inherit", outline:"none", cursor:"pointer" }}>
              {ABAS.map(a=><option key={a.id} value={a.id} style={{ background:C.bg, color:"#fff" }}>{a.icon} {a.label}</option>)}
            </select>
          </div>
          <div className="cfg-tabs-desk" style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {ABAS.map(a=>{
              const isActive=aba===a.id;
              return <button key={a.id} id={`tab-${a.id}`} onClick={()=>setAba(a.id)} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 16px", borderRadius:8, border:`1px solid ${isActive?"#10b981":C.border}`, backgroundColor:isActive?"rgba(16,185,129,0.1)":C.color2, color:isActive?"#10b981":C.color11, fontSize:14, fontWeight:isActive?"bold":"400", cursor:"pointer", fontFamily:"inherit", transition:"all .15s" }}><span>{a.icon}</span>{a.label}</button>;
            })}
          </div>
          <div style={{ height:1, backgroundColor:C.border }} />
          {aba==="dados"        && <AbaDados />}
          {aba==="plano"        && <AbaPlano />}
          {aba==="notificacoes" && <AbaNotificacoes />}
          {aba==="senha"        && <AbaSenha />}
        </div>
      </div>
    </>
  );
}
