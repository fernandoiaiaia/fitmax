"use client";

import { useState, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Aba = "dados" | "plano" | "notificacoes" | "senha";

interface ShowPasswords {
  atual: boolean;
  nova: boolean;
  confirmar: boolean;
}

// ─── Mock ─────────────────────────────────────────────────────────────────────

const PLANOS = [
  {
    id: "free", nome: "Free", preco: "R$ 0", periodo: "grátis",
    features: ["Até 5 consultas/mês", "Busca de profissionais", "Suporte por e-mail"],
    color: "#71717a", ativo: false,
  },
  {
    id: "plus", nome: "Plus", preco: "R$ 29", periodo: "/mês",
    features: ["Consultas ilimitadas", "Histórico completo", "Avaliações e favoritos", "Suporte prioritário", "Notificações avançadas"],
    color: "#10b981", ativo: true, destaque: true,
  },
  {
    id: "premium", nome: "Premium", preco: "R$ 59", periodo: "/mês",
    features: ["Tudo do Plus", "Consulta de emergência", "Acesso antecipado", "Gerenciador familiar", "Integração wearables"],
    color: "#a78bfa", ativo: false,
  },
];

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconLock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const IconEye = ({ open }: { open: boolean }) => open ? (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
) : (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const IconSave = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
  </svg>
);

const IconTrash = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconStar = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="#facc15" stroke="#facc15" strokeWidth="1">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const IconCamera = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

// ─── Sub-components ───────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="cfg2-field">
      <label className="cfg2-field__label">{label}</label>
      {children}
    </div>
  );
}

function TextInput({ id, type = "text", placeholder, value, onChange, disabled }: {
  id: string; type?: string; placeholder?: string;
  value: string; onChange: (v: string) => void; disabled?: boolean;
}) {
  return (
    <input
      id={id} type={type} placeholder={placeholder} value={value}
      onChange={(e) => onChange(e.target.value)} disabled={disabled}
      className={`cfg2-input${disabled ? " cfg2-input--disabled" : ""}`}
    />
  );
}

function PasswordField({ id, label, placeholder, show, onToggle, value, onChange }: {
  id: string; label: string; placeholder: string;
  show: boolean; onToggle: () => void;
  value: string; onChange: (v: string) => void;
}) {
  return (
    <Field label={label}>
      <div className="cfg2-pwd-wrap">
        <span className="cfg2-pwd-lock"><IconLock /></span>
        <input
          id={id} type={show ? "text" : "password"} placeholder={placeholder}
          value={value} onChange={(e) => onChange(e.target.value)}
          className="cfg2-input cfg2-input--pwd"
        />
        <button type="button" className="cfg2-eye-btn" onClick={onToggle} id={`toggle-${id}`}>
          <IconEye open={show} />
        </button>
      </div>
    </Field>
  );
}

// ─── Toggle de notificação ────────────────────────────────────────────────────

function NotifToggle({ id, label, desc, value, onChange }: {
  id: string; label: string; desc: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="cfg2-notif-row">
      <div className="cfg2-notif-row__text">
        <p className="cfg2-notif-row__label">{label}</p>
        <p className="cfg2-notif-row__desc">{desc}</p>
      </div>
      <button
        id={id}
        role="switch"
        aria-checked={value}
        className={`cfg2-toggle${value ? " cfg2-toggle--on" : ""}`}
        onClick={() => onChange(!value)}
      >
        <span className="cfg2-toggle__thumb" />
      </button>
    </div>
  );
}

// ─── Aba Dados Pessoais ───────────────────────────────────────────────────────

function AbaDados() {
  const avatarRef = useRef<HTMLInputElement>(null);
  const [nome, setNome]       = useState("Gabriel Silas");
  const [cpf, setCpf]         = useState("123.456.789-10");
  const [nasc, setNasc]       = useState("15/06/1995");
  const [tel, setTel]         = useState("(11) 95346-4325");
  const [email, setEmail]     = useState("gabriel@fitmax.com");
  const [username, setUser]   = useState("@gabrielsilas");
  const [objetivo, setObj]    = useState("Hipertrofia");
  const [saved, setSaved]     = useState(false);

  function handleSave() { setSaved(true); setTimeout(() => setSaved(false), 2500); }

  return (
    <div className="cfg2-content">

      {/* Card de perfil */}
      <div className="cfg2-profile-card">
        <div className="cfg2-profile-card__avatar-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://picsum.photos/200/200?random=1" alt="Gabriel Silas" className="cfg2-profile-card__avatar" />
          <button className="cfg2-profile-card__cam" onClick={() => avatarRef.current?.click()} id="btn-trocar-avatar">
            <IconCamera />
          </button>
          <input ref={avatarRef} type="file" accept="image/*" style={{ display: "none" }} id="input-avatar" />
        </div>
        <div className="cfg2-profile-card__info">
          <p className="cfg2-profile-card__name">{nome}</p>
          <p className="cfg2-profile-card__meta">{email}</p>
          <span className="cfg2-profile-card__badge">Plano Plus · Ativo</span>
        </div>
      </div>

      <div className="cfg2-separator" />

      {/* Dados básicos */}
      <p className="cfg2-section-title">Dados Pessoais</p>

      <div className="cfg2-row">
        <Field label="Nome completo">
          <TextInput id="input-nome" value={nome} onChange={setNome} placeholder="Seu nome completo" />
        </Field>
        <Field label="CPF">
          <TextInput id="input-cpf" value={cpf} onChange={setCpf} placeholder="000.000.000-00" />
        </Field>
      </div>

      <div className="cfg2-row">
        <Field label="Data de nascimento">
          <TextInput id="input-nascimento" value={nasc} onChange={setNasc} placeholder="DD/MM/AAAA" />
        </Field>
        <Field label="Telefone">
          <TextInput id="input-telefone" type="tel" value={tel} onChange={setTel} placeholder="(00) 00000-0000" />
        </Field>
      </div>

      <Field label="E-mail">
        <TextInput id="input-email" type="email" value={email} onChange={setEmail} placeholder="seu@email.com" />
      </Field>

      <Field label="Nome de usuário">
        <TextInput id="input-username" value={username} onChange={setUser} placeholder="@usuario" />
      </Field>

      <div className="cfg2-separator" />

      {/* Objetivo fitness — exclusivo do cliente */}
      <p className="cfg2-section-title">Objetivo Fitness</p>

      <div className="cfg2-obj-grid">
        {["Hipertrofia", "Emagrecimento", "Saúde Geral", "Performance", "Reabilitação", "Flexibilidade"].map((obj) => (
          <button
            key={obj}
            id={`obj-${obj.toLowerCase().replace(/\s/g, "-")}`}
            className={`cfg2-obj-btn${objetivo === obj ? " cfg2-obj-btn--active" : ""}`}
            onClick={() => setObj(obj)}
          >
            {obj}
          </button>
        ))}
      </div>

      <div className="cfg2-separator" />

      <div className="cfg2-footer">
        <a href="#" className="cfg2-termos" id="link-termos">Ler Termos de Uso e Política de Privacidade</a>
        <div className="cfg2-footer__btns">
          <button className={`cfg2-btn-save${saved ? " cfg2-btn-save--done" : ""}`} id="btn-salvar-dados" onClick={handleSave}>
            {saved ? <><IconCheck /> Salvo!</> : <><IconSave /> Salvar alterações</>}
          </button>
          <button className="cfg2-btn-delete" id="btn-excluir-conta"><IconTrash /> Excluir conta</button>
        </div>
      </div>
    </div>
  );
}

// ─── Aba Meu Plano ────────────────────────────────────────────────────────────

function AbaPlano() {
  return (
    <div className="cfg2-content">
      <p className="cfg2-section-title">Plano Atual</p>

      <div className="cfg2-plan-current">
        <div>
          <span className="cfg2-plan-current__badge">ATIVO</span>
          <p className="cfg2-plan-current__name">Plus</p>
          <p className="cfg2-plan-current__price">R$ 29<span>/mês</span></p>
        </div>
        <div className="cfg2-plan-current__meta">
          <p>Renovação em <strong>21 dias</strong></p>
          <p>Próxima cobrança: <strong>17/05/2026</strong></p>
        </div>
      </div>

      <div className="cfg2-separator" />
      <p className="cfg2-section-title">Comparar planos</p>

      <div className="cfg2-plans-grid">
        {PLANOS.map((p) => (
          <div key={p.id} className={`cfg2-plan${p.destaque ? " cfg2-plan--destaque" : ""}`} style={p.destaque ? { borderColor: p.color } : {}}>
            {p.destaque && (
              <span className="cfg2-plan__tag" style={{ background: p.color }}>
                <IconStar /> Popular
              </span>
            )}
            <p className="cfg2-plan__name" style={{ color: p.color }}>{p.nome}</p>
            <p className="cfg2-plan__price">{p.preco}<span>{p.periodo}</span></p>
            <ul className="cfg2-plan__features">
              {p.features.map((f) => (
                <li key={f}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  {f}
                </li>
              ))}
            </ul>
            <button id={`btn-plano-${p.id}`} className={`cfg2-plan__btn${p.ativo ? " cfg2-plan__btn--active" : ""}`} style={!p.ativo ? { borderColor: p.color, color: p.color } : {}}>
              {p.ativo ? "Plano atual" : "Selecionar"}
            </button>
          </div>
        ))}
      </div>

      <div className="cfg2-separator" />
      <div className="cfg2-footer">
        <p className="cfg2-cancel-note">Ao cancelar, você perde o acesso ao Plus no fim do período.</p>
        <button className="cfg2-btn-delete" id="btn-cancelar-assinatura"><IconTrash /> Cancelar assinatura</button>
      </div>
    </div>
  );
}

// ─── Aba Notificações ─────────────────────────────────────────────────────────

function AbaNotificacoes() {
  const [notifs, setNotifs] = useState({
    confirmacao: true,
    lembrete: true,
    cancelamento: true,
    novosProfissionais: false,
    dicas: false,
    email: true,
    whatsapp: false,
    push: true,
  });

  const toggle = (key: keyof typeof notifs) => setNotifs((p) => ({ ...p, [key]: !p[key] }));
  const [saved, setSaved] = useState(false);
  function handleSave() { setSaved(true); setTimeout(() => setSaved(false), 2500); }

  return (
    <div className="cfg2-content cfg2-content--narrow">

      <p className="cfg2-section-title">Consultas</p>
      <div className="cfg2-notif-group">
        <NotifToggle id="notif-confirmacao"        label="Confirmação de agendamento"   desc="Receba quando uma consulta for confirmada"        value={notifs.confirmacao}         onChange={() => toggle("confirmacao")} />
        <NotifToggle id="notif-lembrete"           label="Lembrete de consulta"          desc="Notificação 1h antes da consulta"                value={notifs.lembrete}            onChange={() => toggle("lembrete")} />
        <NotifToggle id="notif-cancelamento"       label="Cancelamentos"                 desc="Alertas de consultas canceladas ou reagendadas"   value={notifs.cancelamento}        onChange={() => toggle("cancelamento")} />
      </div>

      <div className="cfg2-separator" />
      <p className="cfg2-section-title">Descoberta</p>
      <div className="cfg2-notif-group">
        <NotifToggle id="notif-novos-profissionais" label="Novos profissionais"           desc="Profissionais que combinam com seu objetivo"     value={notifs.novosProfissionais}  onChange={() => toggle("novosProfissionais")} />
        <NotifToggle id="notif-dicas"              label="Dicas de saúde"                desc="Conteúdo personalizado baseado no seu objetivo"   value={notifs.dicas}               onChange={() => toggle("dicas")} />
      </div>

      <div className="cfg2-separator" />
      <p className="cfg2-section-title">Canais</p>
      <div className="cfg2-notif-group">
        <NotifToggle id="notif-email"    label="E-mail"     desc="Notificações por e-mail"        value={notifs.email}     onChange={() => toggle("email")} />
        <NotifToggle id="notif-whatsapp" label="WhatsApp"   desc="Notificações via WhatsApp"      value={notifs.whatsapp}  onChange={() => toggle("whatsapp")} />
        <NotifToggle id="notif-push"     label="Push"       desc="Notificações no navegador"      value={notifs.push}      onChange={() => toggle("push")} />
      </div>

      <div className="cfg2-separator" />
      <div className="cfg2-footer cfg2-footer--end">
        <button className={`cfg2-btn-save${saved ? " cfg2-btn-save--done" : ""}`} id="btn-salvar-notificacoes" onClick={handleSave}>
          {saved ? <><IconCheck /> Salvo!</> : <><IconSave /> Salvar preferências</>}
        </button>
      </div>
    </div>
  );
}

// ─── Aba Alterar Senha ────────────────────────────────────────────────────────

function AbaSenha() {
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha]   = useState("");
  const [confirmar, setConfirmar]   = useState("");
  const [show, setShow] = useState<ShowPasswords>({ atual: false, nova: false, confirmar: false });
  const [saved, setSaved] = useState(false);

  const toggle = (f: keyof ShowPasswords) => setShow((p) => ({ ...p, [f]: !p[f] }));

  let strength = 0;
  if (novaSenha.length >= 8) strength++;
  if (novaSenha.length >= 10 && /[A-Z]/.test(novaSenha)) strength++;
  if (novaSenha.length >= 12 && /[0-9]/.test(novaSenha)) strength++;
  if (novaSenha.length >= 14 && /[^a-zA-Z0-9]/.test(novaSenha)) strength++;

  const strengthColors = ["#f43f5e", "#f97316", "#facc15", "#10b981"];
  const strengthLabel  = ["Muito curta", "Fraca", "Razoável", "Forte"];

  function handleSave() { setSaved(true); setTimeout(() => setSaved(false), 2500); }

  return (
    <div className="cfg2-content cfg2-content--narrow">
      <PasswordField id="input-senha-atual" label="Senha atual" placeholder="Insira sua senha atual" show={show.atual} onToggle={() => toggle("atual")} value={senhaAtual} onChange={setSenhaAtual} />
      <PasswordField id="input-nova-senha" label="Nova senha" placeholder="Insira sua nova senha" show={show.nova} onToggle={() => toggle("nova")} value={novaSenha} onChange={setNovaSenha} />

      {novaSenha.length > 0 && (
        <div className="cfg2-strength">
          <div className="cfg2-strength__bar">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="cfg2-strength__seg" style={{ background: i < strength ? strengthColors[strength - 1] : "rgba(255,255,255,0.08)" }} />
            ))}
          </div>
          <p className="cfg2-strength__label" style={{ color: strength > 0 ? strengthColors[strength - 1] : "#52525b" }}>
            {strength === 0 ? "Senha muito curta" : strengthLabel[strength - 1]}
          </p>
        </div>
      )}

      <PasswordField id="input-confirmar-senha" label="Confirmar nova senha" placeholder="Confirme sua nova senha" show={show.confirmar} onToggle={() => toggle("confirmar")} value={confirmar} onChange={setConfirmar} />

      <div className="cfg2-separator" />
      <div className="cfg2-footer cfg2-footer--end">
        <button className={`cfg2-btn-save${saved ? " cfg2-btn-save--done" : ""}`} id="btn-salvar-senha" onClick={handleSave}>
          {saved ? <><IconCheck /> Salvo!</> : <><IconSave /> Salvar</>}
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const ABAS: { id: Aba; label: string }[] = [
  { id: "dados",         label: "Dados pessoais" },
  { id: "plano",         label: "Meu plano" },
  { id: "notificacoes",  label: "Notificações" },
  { id: "senha",         label: "Alterar senha" },
];

export default function ConfigPage() {
  const [aba, setAba] = useState<Aba>("dados");

  return (
    <div className="cfg2-page">

      <div>
        <h1 className="cfg2-header__title">Configurações</h1>
        <p className="cfg2-header__sub">Gerencie suas preferências e dados da conta.</p>
      </div>

      <div className="cfg2-tabs">
        <div className="cfg2-tabs__bar">
          {ABAS.map((a) => (
            <button key={a.id} id={`tab-${a.id}`} className={`cfg2-tab${aba === a.id ? " cfg2-tab--active" : ""}`} onClick={() => setAba(a.id)}>
              {a.label}
            </button>
          ))}
        </div>
        <div className="cfg2-tabs__track">
          <div
            className="cfg2-tabs__indicator"
            style={{
              width: `${100 / ABAS.length}%`,
              left: `${(ABAS.findIndex((a) => a.id === aba) / ABAS.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {aba === "dados"        && <AbaDados />}
      {aba === "plano"        && <AbaPlano />}
      {aba === "notificacoes" && <AbaNotificacoes />}
      {aba === "senha"        && <AbaSenha />}
    </div>
  );
}
