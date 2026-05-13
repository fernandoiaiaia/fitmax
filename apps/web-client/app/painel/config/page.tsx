//@ts-nocheck
"use client";

import { useState, useRef } from "react";

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

const PLANOS = [
  { id: "plus",    nome: "Plus",    preco: "R$ 29", periodo: "/mês",   color: "#10b981", ativo: true,  destaque: true, features: ["Consultas ilimitadas", "Histórico completo", "Avaliações e favoritos", "Suporte prioritário"] },
  { id: "premium", nome: "Premium", preco: "R$ 59", periodo: "/mês",   color: "#a78bfa", ativo: false, features: ["Tudo do Plus", "Consulta de emergência", "Acesso antecipado", "Gerenciador familiar"] },
];

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
  const [nome,  setNome]  = useState("Gabriel Silas");
  const [tel,   setTel]   = useState("(11) 95346-4325");
  const [email, setEmail] = useState("gabriel@fitmax.com");
  const [user,  setUser]  = useState("@gabrielsilas");
  const [obj,   setObj]   = useState("Hipertrofia");
  const [saved, setSaved] = useState(false);

  function handleSave() { setSaved(true); setTimeout(() => setSaved(false), 2500); }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <HCard style={{ padding:16 }}>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <div style={{ position: "relative" }}>
            <img src="https://picsum.photos/200/200?random=1" style={{ width:64, height:64, borderRadius:"50%", objectFit:"cover", border:"2px solid #10b981" }} alt="" />
            <button
              id="btn-trocar-avatar"
              onClick={() => avatarRef.current?.click()}
              style={{
                position: "absolute", bottom: 0, right: 0,
                background: "#10b981", border: "2px solid #111",
                borderRadius: "50%", width: 28, height: 28,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
              }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </button>
            <input ref={avatarRef} type="file" accept="image/*" style={{ display: "none" }} />
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
            <span style={{ color:C.color12, fontSize:18, fontWeight:"bold" }}>{nome}</span>
            <span style={{ color:C.color11, fontSize:13 }}>{email}</span>
            <span style={{ color:"#10b981", fontSize:11, fontWeight:"bold", background:"rgba(16,185,129,0.12)", padding:"2px 12px", borderRadius:999, alignSelf:"flex-start", marginTop:4, display:"block" }}>Plano Plus · Ativo</span>
          </div>
        </div>
      </HCard>

      {/* Dados */}
      <HCard style={{ padding:16, display:"flex", flexDirection:"column", gap:16 }}>
        <SectionTitle>Dados Pessoais</SectionTitle>
        <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
          <InputField id="input-nome"  label="Nome completo" value={nome}  onChange={setNome} />
          <InputField id="input-email" label="E-mail"        value={email} onChange={setEmail} type="email" />
        </div>
        <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
          <InputField id="input-tel"  label="Telefone"        value={tel}  onChange={setTel}  type="tel" />
          <InputField id="input-user" label="Nome de usuário" value={user} onChange={setUser} />
        </div>
      </HCard>

      {/* Objetivo */}
      <HCard style={{ padding:16, display:"flex", flexDirection:"column", gap:12 }}>
        <SectionTitle>Objetivo Fitness</SectionTitle>
        <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
          {["Hipertrofia","Emagrecimento","Saúde Geral","Performance","Reabilitação","Flexibilidade"].map((o)=>{
            const isActive=obj===o;
            return <button key={o} onClick={()=>setObj(o)} id={`obj-${o.toLowerCase().replace(/\s/g,"-")}`} style={{ padding:"6px 16px", borderRadius:999, border:`1px solid ${isActive?"#10b981":C.border}`, backgroundColor:isActive?"rgba(16,185,129,0.12)":"transparent", color:isActive?"#10b981":C.color11, fontSize:13, fontWeight:isActive?"bold":"400", cursor:"pointer", fontFamily:"inherit", transition:"all .15s" }}>{o}</button>;
          })}
        </div>
      </HCard>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
        <span id="link-termos" style={{ color:C.color10, fontSize:12, textDecoration:"underline", cursor:"pointer" }}>Termos de Uso e Política de Privacidade</span>
        <div style={{ display:"flex", gap:8 }}>
          <button id="btn-excluir-conta" style={{ padding:"8px 16px", borderRadius:8, backgroundColor:"rgba(244,63,94,0.1)", border:"1px solid rgba(244,63,94,0.3)", color:"#f43f5e", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Excluir conta</button>
          <button id="btn-salvar-dados" onClick={handleSave} style={{ padding:"8px 16px", borderRadius:8, backgroundColor:saved?"#059669":"#10b981", border:"none", color:"white", fontSize:13, fontWeight:"bold", cursor:"pointer", fontFamily:"inherit" }}>{saved?"✓ Salvo!":"Salvar alterações"}</button>
        </div>
      </div>
    </div>
  );
}

function AbaPlano() {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <HCard style={{ padding:16, backgroundColor:"rgba(16,185,129,0.05)", borderColor:"rgba(16,185,129,0.3)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
          <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ color:"#10b981", fontSize:10, fontWeight:"bold", background:"rgba(16,185,129,0.15)", padding:"2px 8px", borderRadius:999 }}>ATIVO</span>
              <span style={{ color:"#fafafa", fontSize:22, fontWeight:"bold" }}>Plus</span>
            </div>
            <span style={{ color:"#10b981", fontSize:18, fontWeight:"bold" }}>R$ 29<span style={{ color:"#a1a1aa", fontSize:13 }}>/mês</span></span>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:4, alignItems:"flex-end" }}>
            <span style={{ color:"#a1a1aa", fontSize:13 }}>Renovação em <strong style={{ color:"#fafafa" }}>21 dias</strong></span>
            <span style={{ color:"#a1a1aa", fontSize:13 }}>Próxima cobrança: <strong style={{ color:"#fafafa" }}>17/05/2026</strong></span>
          </div>
        </div>
      </HCard>
      <SectionTitle>Comparar planos</SectionTitle>
      <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
        {PLANOS.map(p=>(
          <div key={p.id} style={{ flex:1, minWidth:200, border:`${p.destaque?2:1}px solid ${p.destaque?p.color:C.border}`, backgroundColor:p.destaque?"rgba(16,185,129,0.04)":C.color2, borderRadius:12, padding:16, display:"flex", flexDirection:"column", gap:12, overflow:"hidden", cursor:"pointer", transition:"background .15s" }}
            onMouseEnter={e=>(e.currentTarget as HTMLElement).style.backgroundColor=C.color3}
            onMouseLeave={e=>(e.currentTarget as HTMLElement).style.backgroundColor=p.destaque?"rgba(16,185,129,0.04)":C.color2}>
            {p.destaque&&<span style={{ alignSelf:"flex-start", backgroundColor:p.color, color:"white", fontSize:11, fontWeight:"bold", padding:"2px 12px", borderRadius:999 }}>⭐ Popular</span>}
            <span style={{ color:p.color, fontSize:18, fontWeight:"bold" }}>{p.nome}</span>
            <span style={{ color:"#fafafa", fontSize:22, fontWeight:"bold" }}>{p.preco}<span style={{ color:"#a1a1aa", fontSize:13 }}>{p.periodo}</span></span>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {p.features.map(f=>(
                <div key={f} style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  <span style={{ color:"#a1a1aa", fontSize:13 }}>{f}</span>
                </div>
              ))}
            </div>
            <button id={`btn-plano-${p.id}`} style={{ marginTop:"auto", padding:"8px 0", borderRadius:8, border:`1px solid ${p.ativo?"transparent":p.color}`, backgroundColor:p.ativo?p.color:"transparent", color:p.ativo?"white":p.color, fontSize:13, fontWeight:"bold", cursor:"pointer", fontFamily:"inherit" }}>{p.ativo?"Plano atual":"Selecionar"}</button>
          </div>
        ))}
      </div>
      <div style={{ display:"flex", justifyContent:"flex-end" }}>
        <button id="btn-cancelar-assinatura" style={{ padding:"8px 16px", borderRadius:8, backgroundColor:"rgba(244,63,94,0.1)", border:"1px solid rgba(244,63,94,0.3)", color:"#f43f5e", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Cancelar assinatura</button>
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
  const [saved, setSaved] = useState(false);
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
      <div style={{ display:"flex", justifyContent:"flex-end" }}>
        <button id="btn-salvar-notificacoes" onClick={()=>{setSaved(true);setTimeout(()=>setSaved(false),2500);}} style={{ padding:"8px 16px", borderRadius:8, backgroundColor:saved?"#059669":"#10b981", border:"none", color:"white", fontSize:13, fontWeight:"bold", cursor:"pointer", fontFamily:"inherit" }}>{saved?"✓ Salvo!":"Salvar preferências"}</button>
      </div>
    </div>
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
      <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
        <span style={{ color:C.color10, fontSize:12 }}>{label}</span>
        <div style={{ position: "relative" }}>
          <input
            id={id}
            type={show[field] ? "text" : "password"}
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
            onClick={() => setShow((p) => ({ ...p, [field]: !p[field] }))}
            style={{
              position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer", color: "#10b981",
            }}>
            {show[field]
              ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
            }
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16, maxWidth:480 }}>
      <HCard style={{ padding:16, display:"flex", flexDirection:"column", gap:16 }}>
        <PwdInput id="input-senha-atual"    label="Senha atual"         field="atual"     value={senhaAtual} onChange={setSenhaAtual} />
        <PwdInput id="input-nova-senha"     label="Nova senha"          field="nova"      value={novaSenha}  onChange={setNovaSenha} />
        {novaSenha.length>0&&(
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            <div style={{ display:"flex", gap:4 }}>
              {[0,1,2,3].map(i=>(<div key={i} style={{ flex:1, height:4, borderRadius:4, backgroundColor:i<strength?strengthColors[strength-1]:"rgba(255,255,255,0.08)" }}/>))}
            </div>
            <span style={{ fontSize:12, color:strength>0?strengthColors[strength-1]:"#52525b" }}>{strength===0?"Senha muito curta":strengthLabel[strength-1]}</span>
          </div>
        )}
        <PwdInput id="input-confirmar-senha" label="Confirmar nova senha" field="confirmar" value={confirmar}  onChange={setConfirmar} />
      </HCard>
      <div style={{ display:"flex", justifyContent:"flex-end" }}>
        <button id="btn-salvar-senha" onClick={()=>{setSaved(true);setTimeout(()=>setSaved(false),2500);}} style={{ padding:"8px 16px", borderRadius:8, backgroundColor:saved?"#059669":"#10b981", border:"none", color:"white", fontSize:13, fontWeight:"bold", cursor:"pointer", fontFamily:"inherit" }}>{saved?"✓ Salvo!":"Salvar senha"}</button>
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
