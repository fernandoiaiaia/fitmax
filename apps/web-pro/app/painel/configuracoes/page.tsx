//@ts-nocheck
"use client";

import { useState, useRef, useEffect } from "react";
import useSWR from 'swr';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { AxiosError } from 'axios';

/** Extrai mensagem de erro de respostas da API */
function apiErr(err: unknown, fallback = "Erro inesperado. Tente novamente."): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data;
    if (data?.error === "Validation error" && data?.details) {
      const details = data.details as Record<string, string[]>;
      const messages = Object.values(details).flat();
      if (messages.length > 0) return messages.join("; ");
    }
    return data?.error ?? fallback;
  }
  return fallback;
}

type Aba = "dados" | "plano" | "notificacoes" | "senha";

// PLANOS static list removed. We will fetch from API instead.

const ABAS: { id: Aba; label: string; icon: string }[] = [
  { id: "dados",        label: "Dados do profissional", icon: "👤" },
  { id: "plano",        label: "Meu plano",      icon: "⭐" },
  { id: "notificacoes", label: "Notificações",   icon: "🔔" },
  { id: "senha",        label: "Senha",          icon: "🔒" },
];

const PROFISSOES = [
  { id: "medico", label: "Médico", conselho: "CRM" },
  { id: "psicologo", label: "Psicólogo", conselho: "CRP" },
  { id: "nutricionista", label: "Nutricionista", conselho: "CRN" },
  { id: "educador", label: "Educador Físico / Personal Trainer", conselho: "CREF" },
  { id: "fisioterapeuta", label: "Fisioterapeuta / Terapeuta Ocupacional", conselho: "CREFITO" }
];

const ESTADOS_BR = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", 
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

// Convenios são carregados dinamicamente da API (cadastrados pelo admin)


const STYLES = `
.cfg-card {
  background: #141414;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  padding: 20px;
  transition: all 0.2s;
  animation: cfgFadeUp 0.3s ease;
}
.cfg-card:hover {
  background: #1a1a1a;
  border-color: #10b981;
}
@keyframes cfgFadeUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.cfg-input {
  background: #111;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  padding: 0 12px;
  height: 42px;
  color: #fafafa;
  font-family: inherit;
  font-size: 14px;
  width: 100%;
  transition: border-color 0.2s;
  outline: none;
  box-sizing: border-box;
}
.cfg-input:focus {
  border-color: #10b981;
}
.cfg-input:disabled {
  background: rgba(255,255,255,0.03);
  color: #a1a1aa;
}
.cfg-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 16px;
  height: 42px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
  border: 1px solid transparent;
}
.cfg-btn-primary {
  background: #10b981;
  color: white;
}
.cfg-btn-primary:hover {
  background: #059669;
}
.cfg-btn-outline {
  background: transparent;
  border-color: rgba(255,255,255,0.1);
  color: #a1a1aa;
}
.cfg-btn-outline:hover {
  background: rgba(255,255,255,0.05);
  color: #e4e4e7;
}
.cfg-btn-outline.active {
  background: rgba(16,185,129,0.12);
  border-color: #10b981;
  color: #10b981;
}
.cfg-btn-danger {
  background: rgba(244,63,94,0.1);
  border-color: rgba(244,63,94,0.3);
  color: #f43f5e;
}
.cfg-btn-danger:hover {
  background: rgba(244,63,94,0.2);
}
.cfg-toggle {
  width: 44px;
  height: 24px;
  border-radius: 99px;
  position: relative;
  cursor: pointer;
  border: none;
  transition: background 0.2s;
}
.cfg-toggle-knob {
  position: absolute;
  top: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  transition: left 0.2s;
}
@media(max-width:600px){
  .cfg-tabs-desk { display: none !important; }
  .cfg-tabs-mob  { display: block !important; }
}
@media(min-width:601px){
  .cfg-tabs-desk { display: flex !important; }
  .cfg-tabs-mob  { display: none !important; }
}
`;

/* ── helpers ── */
function SectionTitle({ children }: { children: string }) {
  return (
    <div style={{ color: "#a1a1aa", fontSize: 11, fontWeight: "bold", letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>
      {children}
    </div>
  );
}

function InputField({ id, label, value, onChange, type = "text", disabled }: {
  id: string; label: string; value: string;
  onChange: (v: string) => void; type?: string; disabled?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 200 }}>
      <label style={{ color: "#a1a1aa", fontSize: 12 }}>{label}</label>
      <input
        id={id} type={type} value={value} disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="cfg-input"
      />
    </div>
  );
}

function Toggle({ id, label, desc, value, onChange }: {
  id: string; label: string; desc: string; value: boolean; onChange: () => void;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.08)", flexWrap:"wrap", gap:12 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, paddingRight: 16, minWidth: 200 }}>
        <span style={{ color: "#fafafa", fontSize: 14, fontWeight: 500 }}>{label}</span>
        <span style={{ color: "#a1a1aa", fontSize: 12 }}>{desc}</span>
      </div>
      <button
        id={id}
        role="switch"
        aria-checked={value}
        onClick={onChange}
        className="cfg-toggle"
        style={{ background: value ? "#10b981" : "rgba(255,255,255,0.1)" }}
      >
        <div className="cfg-toggle-knob" style={{ left: value ? 22 : 2 }} />
      </button>
    </div>
  );
}

/* ── Abas ── */
function AbaDados({ me, mutate }: { me: any; mutate: any }) {
  const avatarRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  let defaultProfissao = "medico";
  let defaultRegistro = "";
  if (me.registroProfissional) {
    const match = me.registroProfissional.match(/^([A-Z]+)\s+(.+)$/);
    if (match) {
      const conselho = match[1];
      defaultRegistro = match[2];
      const p = PROFISSOES.find(x => x.conselho === conselho);
      if (p) defaultProfissao = p.id;
    } else {
      defaultRegistro = me.registroProfissional;
    }
  }

  const [nome,  setNome]  = useState(me.name || "");
  const [tel,   setTel]   = useState(me.telefone || "");
  const [email, setEmail] = useState(me.email || "");
  const [user,  setUser]  = useState(me.username || "");
  const [obj,   setObj]   = useState(me.especialidade || "Cardiologia");
  const [profissao, setProfissao] = useState(defaultProfissao);
  const [registro, setRegistro] = useState(defaultRegistro);
  const [uf, setUf] = useState(me.uf || "");
  const [convenios, setConvenios] = useState<string[]>(me.convenios || []);
  const [convenioCustom, setConvenioCustom] = useState("");
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Convênios disponíveis (da API — cadastrados pelo admin)
  const { data: conveniosDisp } = useSWR<{ id: string; nome: string; categoria: string }[]>(
    '/pro/config/convenios',
    async (url) => (await api.get(url)).data
  );
  const CONVENIOS_API = conveniosDisp?.map((c) => c.nome) ?? [];

  function toggleConvenio(nome: string) {
    setConvenios((prev) =>
      prev.includes(nome) ? prev.filter((c) => c !== nome) : [...prev, nome]
    );
  }

  function addConvenioCustom() {
    const trimmed = convenioCustom.trim();
    if (trimmed && !convenios.includes(trimmed)) {
      setConvenios((prev) => [...prev, trimmed]);
    }
    setConvenioCustom("");
  }

  const selectedProf = PROFISSOES.find(p => p.id === profissao);

  async function handleSave() {
    setErrorMsg("");
    setLoading(true);
    try {
      const regProf = registro.trim()
        ? (selectedProf ? `${selectedProf.conselho} ${registro.trim()}` : registro.trim())
        : undefined;

      await api.put('/pro/config/perfil', {
        name:                 nome       || undefined,
        email:                email      || undefined,
        telefone:             tel.trim() || null,
        username:             user.trim() || null,
        especialidade:        obj        || undefined,
        registroProfissional: regProf,
        uf:                   uf         || undefined,
        convenios,
      });
      await mutate();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      window.dispatchEvent(new Event("perfil-atualizado"));
    } catch (err: any) {
      setErrorMsg(apiErr(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleExcluir() {
    if (confirm("Tem certeza que deseja excluir sua conta? Esta ação desativará seu acesso permanentemente.")) {
      try {
        await api.delete('/pro/config/conta');
        router.push('/login');
      } catch (err) {
        setErrorMsg("Erro ao inativar conta");
      }
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Profile Card */}
      <div className="cfg-card" style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div style={{ position: "relative", width: 80, height: 80 }}>
          <img
            src={(me?.avatarUrl ? `${me.avatarUrl}${me.avatarUrl.includes('?') ? '&' : '?'}cb=${Date.now()}` : null) || "https://picsum.photos/200/200?random=30"}
            alt="Avatar"
            style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", backgroundColor: "rgba(255,255,255,0.05)" }}
          />
          <button
            onClick={() => avatarRef.current?.click()}
            style={{ position: "absolute", bottom: 0, right: 0, width: 28, height: 28, borderRadius: "50%", background: "#10b981", border: "2px solid #141414", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0 }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </button>
          <input
            ref={avatarRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: "none" }}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const formData = new FormData();
              formData.append("avatar", file);
              try {
                await api.post("/pro/config/perfil/avatar", formData, {
                  headers: { "Content-Type": "multipart/form-data" },
                });
                await mutate();
                window.dispatchEvent(new Event("perfil-atualizado"));
              } catch (err: any) {
                setErrorMsg(err?.response?.data?.error ?? "Erro ao enviar foto.");
              }
              e.target.value = "";
            }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ color: "#fafafa", fontSize: 18, fontWeight: "bold" }}>{nome}</span>
          <span style={{ color: "#a1a1aa", fontSize: 13 }}>{email}</span>
          <div style={{ padding: "4px 12px", borderRadius: 99, background: "rgba(16,185,129,0.12)", marginTop: 4, display: "inline-flex", width: "max-content" }}>
            <span style={{ color: "#10b981", fontSize: 11, fontWeight: "bold" }}>Plano Pro · Ativo</span>
          </div>
        </div>
      </div>

      {/* Dados */}
      <div className="cfg-card">
        <SectionTitle>Dados Pessoais</SectionTitle>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
          <InputField id="input-nome"  label="Nome completo" value={nome}  onChange={setNome} />
          <InputField id="input-email" label="E-mail"        value={email} onChange={setEmail} type="email" />
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <InputField id="input-tel"  label="Telefone"        value={tel}  onChange={setTel}  type="tel" />
          <InputField id="input-user" label="Nome de usuário" value={user} onChange={v => setUser(v.toLowerCase())} />
        </div>
      </div>

      {/* Profissão e Conselho */}
      <div className="cfg-card" style={{ borderColor: errorMsg && (!profissao || !registro || !uf) ? "#ef4444" : undefined }}>
        <SectionTitle>Profissão e Conselho (Obrigatório)</SectionTitle>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {PROFISSOES.map((p) => {
            const isActive = profissao === p.id;
            return (
              <button key={p.id} onClick={() => setProfissao(p.id)} id={`prof-${p.id}`} className={`cfg-btn cfg-btn-outline ${isActive ? "active" : ""}`} style={{ borderRadius: 99 }}>
                {p.label}
              </button>
            );
          })}
        </div>
        
        {selectedProf && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 100 }}>
              <label style={{ color: "#a1a1aa", fontSize: 12 }}>Conselho</label>
              <input value={selectedProf.conselho} disabled className="cfg-input" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 2, minWidth: 150 }}>
              <label style={{ color: "#a1a1aa", fontSize: 12 }}>Número de Registro</label>
              <input value={registro} onChange={(e) => setRegistro(e.target.value)} placeholder="Ex: 123456" className="cfg-input" style={{ borderColor: !registro && errorMsg ? "#ef4444" : undefined }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 100 }}>
              <label style={{ color: "#a1a1aa", fontSize: 12 }}>UF</label>
              <div style={{ position: "relative", width: "100%", height: 42 }}>
                <select
                  value={uf}
                  onChange={(e) => setUf(e.target.value)}
                  style={{
                    width: "100%", height: "100%", backgroundColor: "transparent", color: "white",
                    border: `1px solid ${!uf && errorMsg ? "#ef4444" : "rgba(255,255,255,0.1)"}`,
                    borderRadius: 8, padding: "0 12px", fontSize: 14, outline: "none", appearance: "none", cursor: "pointer"
                  }}
                >
                  <option value="" style={{ color: "black" }}>Selecione</option>
                  {ESTADOS_BR.map(e => <option key={e} value={e} style={{ color: "black" }}>{e}</option>)}
                </select>
                <div style={{ position: "absolute", right: 12, top: 14, pointerEvents: "none" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Área de Atuação */}
      <div className="cfg-card">
        <SectionTitle>Área de Atuação</SectionTitle>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {["Cardiologia", "Endocrinologia", "Nutrição Clínica", "Medicina Esportiva", "Ortopedia", "Personal Trainer"].map((o) => {
            const isActive = obj === o;
            return (
              <button key={o} onClick={() => setObj(o)} id={`obj-${o.toLowerCase().replace(/\s/g, "-")}`} className={`cfg-btn cfg-btn-outline ${isActive ? "active" : ""}`} style={{ borderRadius: 99 }}>
                {o}
              </button>
            );
          })}
        </div>
      </div>

      {/* Convênios */}
      <div className="cfg-card">
        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
          <SectionTitle>Convênios Aceitos</SectionTitle>
          <span style={{ color: "#a1a1aa", fontSize: 12 }}>Selecione os planos de saúde que você aceita. Aparecerá no seu perfil para os pacientes.</span>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        {CONVENIOS_API.length === 0 ? (
          <span style={{ color: "#52525b", fontSize: 13 }}>Carregando convênios...</span>
        ) : (
          CONVENIOS_API.map((c) => {
            const isActive = convenios.includes(c);
            return (
              <button key={c} onClick={() => toggleConvenio(c)} id={`conv-${c.toLowerCase().replace(/[^a-z0-9]/g, "-")}`} className={`cfg-btn cfg-btn-outline ${isActive ? "active" : ""}`} style={{ borderRadius: 99, gap: 4 }}>
                {isActive && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                {c}
              </button>
            );
          })
        )}
        </div>

        {convenios.filter((c) => !CONVENIOS_API.includes(c)).length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
            {convenios.filter((c) => !CONVENIOS_API.includes(c)).map((c) => (
              <div key={c} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 99, border: "1px solid #10b981", background: "rgba(16,185,129,0.12)" }}>
                <span style={{ color: "#10b981", fontSize: 13, fontWeight: "bold" }}>{c}</span>
                <button onClick={() => toggleConvenio(c)} style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }} id={`remove-conv-${c.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
          <input
            id="input-convenio-custom" value={convenioCustom} onChange={(e) => setConvenioCustom(e.target.value)}
            placeholder="Adicionar outro convênio..." className="cfg-input" style={{ flex: 1, minWidth: 200 }}
            onKeyDown={(e) => { if (e.key === "Enter") addConvenioCustom(); }}
          />
          <button onClick={addConvenioCustom} className="cfg-btn" style={{ background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid #10b981" }} id="btn-add-convenio">
            + Adicionar
          </button>
        </div>

        {convenios.length > 0 && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8, background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            <span style={{ color: "#10b981", fontSize: 12, fontWeight: 500 }}>
              {convenios.length} convênio{convenios.length !== 1 ? "s" : ""} selecionado{convenios.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>

      {/* Ações */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {errorMsg && <span style={{ color: "#ef4444", fontSize: 13, fontWeight: "bold", textAlign: "right" }}>{errorMsg}</span>}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <span style={{ color: "#a1a1aa", fontSize: 12, textDecoration: "underline", cursor: "pointer" }} id="link-termos">
            Termos de Uso e Política de Privacidade
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleExcluir} className="cfg-btn cfg-btn-danger" style={{ borderRadius: 99 }} id="btn-excluir-conta">Excluir conta</button>
            <button onClick={handleSave} disabled={loading} className="cfg-btn cfg-btn-primary" style={{ borderRadius: 99, background: saved ? "#059669" : undefined, opacity: loading ? 0.7 : 1 }} id="btn-salvar-dados">
              {loading ? "Salvando..." : saved ? "✓ Salvo!" : "Salvar alterações"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AbaPlano({ me, mutate }: { me: any; mutate: any }) {
  const { data: planosList, error: planosError } = useSWR('/pro/config/planos', async (url) => (await api.get(url)).data);
  const PLANOS = planosList || [];
  
  const currentPlanObj = PLANOS.find((p: any) => p.nome === me?.plano) || PLANOS[0];
  const currentPlanId = me?.plano ? currentPlanObj?.id : null;
  const [selectedPlan, setSelectedPlan] = useState(currentPlanId || PLANOS[0]?.id || "plus");
  const activePlan = currentPlanId ? PLANOS.find((p: any) => p.id === currentPlanId) : null;
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (PLANOS.length > 0 && selectedPlan === "plus" && !currentPlanId) {
      setSelectedPlan(PLANOS[0].id);
    }
  }, [PLANOS, currentPlanId, selectedPlan]);

  if (!planosList && !planosError) return <div style={{ color: "#a1a1aa" }}>Carregando planos...</div>;
  if (planosError) return <div style={{ color: "#ef4444" }}>Erro ao carregar planos.</div>;

  async function handleSelecionarPlano(planoId: string) {
    const planoName = PLANOS.find((p: any) => p.id === planoId)?.nome;
    if (!planoName) return;
    
    setLoading(true);
    try {
      await api.patch('/pro/config/plano', { plano: planoName });
      await mutate();
      setSelectedPlan(planoId);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelar() {
    if (confirm("Tem certeza que deseja cancelar sua assinatura? Você perderá o acesso aos recursos premium no fim do ciclo.")) {
      setLoading(true);
      try {
        await api.patch('/pro/config/plano', { plano: null });
        await mutate();
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Plano Atual */}
      {activePlan ? (
        <div className="cfg-card" style={{ background: "rgba(16,185,129,0.05)", borderColor: "rgba(16,185,129,0.3)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ padding: "2px 8px", borderRadius: 99, background: "rgba(16,185,129,0.15)" }}>
                  <span style={{ color: "#10b981", fontSize: 10, fontWeight: "bold" }}>ATIVO</span>
                </div>
                <span style={{ color: "#fafafa", fontSize: 22, fontWeight: "bold" }}>{activePlan.nome}</span>
              </div>
              <span style={{ color: "#10b981", fontSize: 18, fontWeight: "bold" }}>
                {activePlan.preco}<span style={{ color: "#a1a1aa", fontSize: 13 }}>{activePlan.periodo}</span>
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
              <span style={{ color: "#a1a1aa", fontSize: 13 }}>Renovação em <span style={{ color: "#fafafa", fontWeight: "bold" }}>21 dias</span></span>
              <span style={{ color: "#a1a1aa", fontSize: 13 }}>Próxima cobrança: <span style={{ color: "#fafafa", fontWeight: "bold" }}>17/05/2026</span></span>
            </div>
          </div>
        </div>
      ) : (
        <div className="cfg-card" style={{ background: "rgba(244,63,94,0.05)", borderColor: "rgba(244,63,94,0.3)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ padding: "2px 8px", borderRadius: 99, background: "rgba(244,63,94,0.15)" }}>
                  <span style={{ color: "#f43f5e", fontSize: 10, fontWeight: "bold" }}>CANCELADO</span>
                </div>
                <span style={{ color: "#fafafa", fontSize: 22, fontWeight: "bold" }}>Sem Assinatura Ativa</span>
              </div>
              <span style={{ color: "#a1a1aa", fontSize: 14 }}>
                Você não possui um plano ativo no momento. Escolha uma das opções abaixo para assinar.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Comparar */}
      <SectionTitle>Comparar planos</SectionTitle>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        {PLANOS.map((p: any) => {
          const isSelected = selectedPlan === p.id;
          const isCurrentPlan = currentPlanId === p.id;
          return (
            <div key={p.id} className="cfg-card" onClick={() => setSelectedPlan(p.id)} style={{ flex: 1, minWidth: 250, cursor: "pointer", borderColor: isSelected ? "#10b981" : undefined, borderWidth: isSelected ? 2 : 1, background: isSelected ? "rgba(16,185,129,0.04)" : undefined, display: "flex", flexDirection: "column", gap: 12 }}>
              {p.destaque && (
                <div style={{ padding: "4px 12px", borderRadius: 99, background: p.color, alignSelf: "flex-start" }}>
                  <span style={{ color: "white", fontSize: 11, fontWeight: "bold" }}>⭐ Popular</span>
                </div>
              )}
              <span style={{ color: p.color, fontSize: 18, fontWeight: "bold" }}>{p.nome}</span>
              <span style={{ color: "#fafafa", fontSize: 22, fontWeight: "bold" }}>
                {p.preco}<span style={{ color: "#a1a1aa", fontSize: 13 }}>{p.periodo}</span>
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                {p.features.map((f: string) => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span style={{ color: "#a1a1aa", fontSize: 13 }}>{f}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: "auto", paddingTop: 16 }}>
                <button disabled={loading} className={`cfg-btn ${isCurrentPlan ? "cfg-btn-primary" : "cfg-btn-outline"}`} style={{ width: "100%", borderRadius: 99, borderColor: isCurrentPlan ? "transparent" : p.color, color: isCurrentPlan ? "white" : p.color, opacity: loading ? 0.7 : 1 }} id={`btn-plano-${p.id}`} onClick={(e) => { e.stopPropagation(); handleSelecionarPlano(p.id); }}>
                  {isCurrentPlan ? "Plano atual" : "Selecionar"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {activePlan && (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button disabled={loading} onClick={handleCancelar} className="cfg-btn cfg-btn-danger" style={{ borderRadius: 99, opacity: loading ? 0.7 : 1 }} id="btn-cancelar-assinatura">
            Cancelar assinatura
          </button>
        </div>
      )}
    </div>
  );
}

function AbaNotificacoes({ me, mutate }: { me: any; mutate: any }) {
  const [notifs, setNotifs] = useState(me.notificacoes || {
    confirmacao: true, lembrete: true, cancelamento: true,
    novosProfissionais: false, dicas: false,
    email: true, whatsapp: false, push: true,
  });
  const toggle = (key: keyof typeof notifs) => setNotifs((p: any) => ({ ...p, [key]: !p[key] }));
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);
    try {
      await api.put('/pro/config/notificacoes', { notificacoes: notifs });
      await mutate();
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 640 }}>
      <div className="cfg-card">
        <SectionTitle>Consultas</SectionTitle>
        <Toggle id="notif-confirmacao"  label="Confirmação de agendamento" desc="Receba quando uma consulta for confirmada"      value={notifs.confirmacao}        onChange={() => toggle("confirmacao")} />
        <Toggle id="notif-lembrete"     label="Lembrete de consulta"       desc="Notificação 1h antes da consulta"               value={notifs.lembrete}           onChange={() => toggle("lembrete")} />
        <Toggle id="notif-cancelamento" label="Cancelamentos"              desc="Alertas de consultas canceladas ou reagendadas" value={notifs.cancelamento}       onChange={() => toggle("cancelamento")} />
      </div>

      <div className="cfg-card">
        <SectionTitle>Descoberta</SectionTitle>
        <Toggle id="notif-novos"  label="Novos profissionais" desc="Profissionais que combinam com seu objetivo"    value={notifs.novosProfissionais} onChange={() => toggle("novosProfissionais")} />
        <Toggle id="notif-dicas"  label="Dicas de saúde"     desc="Conteúdo personalizado baseado no seu objetivo" value={notifs.dicas}              onChange={() => toggle("dicas")} />
      </div>

      <div className="cfg-card">
        <SectionTitle>Canais</SectionTitle>
        <Toggle id="notif-email"    label="E-mail"    desc="Notificações por e-mail"       value={notifs.email}    onChange={() => toggle("email")} />
        <Toggle id="notif-whatsapp" label="WhatsApp"  desc="Notificações via WhatsApp"     value={notifs.whatsapp} onChange={() => toggle("whatsapp")} />
        <Toggle id="notif-push"     label="Push"      desc="Notificações no navegador"     value={notifs.push}     onChange={() => toggle("push")} />
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button disabled={loading} className="cfg-btn cfg-btn-primary" style={{ borderRadius: 99, background: saved ? "#059669" : undefined, opacity: loading ? 0.7 : 1 }} onClick={handleSave} id="btn-salvar-notificacoes">
          {loading ? "Salvando..." : saved ? "✓ Salvo!" : "Salvar preferências"}
        </button>
      </div>
    </div>
  );
}

function PwdInput({ id, label, value, onChange, show, onToggleShow }: {
  id: string; label: string;
  value: string; onChange: (v: string) => void;
  show: boolean; onToggleShow: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ color: "#a1a1aa", fontSize: 12 }}>{label}</label>
      <div style={{ position: "relative", width: "100%" }}>
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="cfg-input"
          style={{ paddingRight: 40 }}
        />
        <button
          id={`toggle-${id}`}
          onClick={onToggleShow}
          style={{ position: "absolute", right: 0, top: 0, bottom: 0, background: "transparent", border: "none", color: "#10b981", padding: "0 12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
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
  const [show, setShow] = useState({ atual: false, nova: false, confirmar: false });
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  let strength = 0;
  if (novaSenha.length >= 8)  strength++;
  if (novaSenha.length >= 10 && /[A-Z]/.test(novaSenha)) strength++;
  if (novaSenha.length >= 12 && /[0-9]/.test(novaSenha)) strength++;
  if (novaSenha.length >= 14 && /[^a-zA-Z0-9]/.test(novaSenha)) strength++;

  const strengthColors = ["#ef4444", "#f97316", "#eab308", "#10b981"];
  const strengthLabel  = ["Muito curta", "Fraca", "Razoável", "Forte"];

  async function handleSave() {
    if (novaSenha !== confirmar) {
      setErrorMsg("A nova senha e a confirmação não batem.");
      return;
    }
    if (strength === 0) {
      setErrorMsg("A nova senha é muito fraca.");
      return;
    }
    setErrorMsg("");
    setLoading(true);
    try {
      await api.patch('/pro/config/senha', { senhaAtual, novaSenha });
      setSenhaAtual(""); setNovaSenha(""); setConfirmar("");
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || "Erro ao trocar senha");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 480 }}>
      <div className="cfg-card" style={{ display: "flex", flexDirection: "column", gap: 16, borderColor: errorMsg ? "#ef4444" : undefined }}>
        <PwdInput id="input-senha-atual"    label="Senha atual"         value={senhaAtual} onChange={setSenhaAtual} show={show.atual} onToggleShow={() => setShow(p => ({ ...p, atual: !p.atual }))} />
        <PwdInput id="input-nova-senha"     label="Nova senha"          value={novaSenha}  onChange={setNovaSenha}  show={show.nova} onToggleShow={() => setShow(p => ({ ...p, nova: !p.nova }))} />

        {novaSenha.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", gap: 4 }}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} style={{ flex: 1, height: 4, borderRadius: 4, background: i < strength ? strengthColors[strength - 1] : "rgba(255,255,255,0.08)" }} />
              ))}
            </div>
            <span style={{ fontSize: 12, color: strength > 0 ? strengthColors[strength - 1] : "#52525b" }}>
              {strength === 0 ? "Senha muito curta" : strengthLabel[strength - 1]}
            </span>
          </div>
        )}

        <PwdInput id="input-confirmar-senha" label="Confirmar nova senha" value={confirmar}  onChange={setConfirmar} show={show.confirmar} onToggleShow={() => setShow(p => ({ ...p, confirmar: !p.confirmar }))} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {errorMsg && <span style={{ color: "#ef4444", fontSize: 13, fontWeight: "bold", textAlign: "right" }}>{errorMsg}</span>}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button disabled={loading} className="cfg-btn cfg-btn-primary" style={{ borderRadius: 99, background: saved ? "#059669" : undefined, opacity: loading ? 0.7 : 1 }} onClick={handleSave} id="btn-salvar-senha">
            {loading ? "Salvando..." : saved ? "✓ Salvo!" : "Salvar senha"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Page ── */
export default function ConfigPage() {
  const [aba, setAba] = useState<Aba>("dados");
  const { data: me, mutate, error } = useSWR('/pro/me', async (url) => (await api.get(url)).data);

  if (!me && !error) {
    return <div style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center', height: '100vh', backgroundColor:'#09090b', color:'#a1a1aa'}}>Carregando preferências...</div>;
  }

  return (
    <>
      <style>{STYLES}</style>
      <div style={{ flex: 1, overflowY: "auto", backgroundColor: "#09090b" }}>
        <div style={{ padding: "1.5rem 2rem", maxWidth: 1100, margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Cabeçalho */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <h2 style={{ color: "#fafafa", fontSize: 24, fontWeight: "bold", margin: 0 }}>Configurações</h2>
            <span style={{ color: "#a1a1aa", fontSize: 14 }}>Gerencie suas preferências e dados da conta.</span>
          </div>

          {/* Tabs — desktop */}
          <div className="cfg-tabs-desk" style={{ gap: 8, flexWrap: "wrap" }}>
            {ABAS.map((a) => {
              const isActive = aba === a.id;
              return (
                <button
                  key={a.id}
                  onClick={() => setAba(a.id)}
                  id={`tab-${a.id}`}
                  className={`cfg-btn cfg-btn-outline ${isActive ? "active" : ""}`}
                  style={{ borderRadius: 99, padding: "0 16px" }}
                >
                  <span style={{ fontSize: 14 }}>{a.icon}</span>
                  <span style={{ fontSize: 14 }}>{a.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tabs — mobile */}
          <div className="cfg-tabs-mob">
            <select
              value={aba}
              onChange={(e) => setAba(e.target.value as Aba)}
              style={{
                width: "100%",
                background: "#141414",
                border: "1px solid #10b981",
                borderRadius: 10,
                padding: "12px 16px",
                color: "#10b981",
                fontSize: 14,
                fontWeight: 700,
                fontFamily: "inherit",
                outline: "none",
                cursor: "pointer",
                appearance: "none",
              }}
            >
              {ABAS.map((a) => (
                <option key={a.id} value={a.id} style={{ background: "#09090b" }}>
                  {a.icon} {a.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ height: 1, backgroundColor: "rgba(255,255,255,0.08)", width: "100%" }} />

          {/* Conteúdo */}
          {aba === "dados"        && <AbaDados me={me} mutate={mutate} />}
          {aba === "plano"        && <AbaPlano me={me} mutate={mutate} />}
          {aba === "notificacoes" && <AbaNotificacoes me={me} mutate={mutate} />}
          {aba === "senha"        && <AbaSenha />}

        </div>
      </div>
    </>
  );
}
