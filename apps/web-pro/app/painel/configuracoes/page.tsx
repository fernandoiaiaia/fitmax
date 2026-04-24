"use client";

import { useState, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Aba = "dados" | "plano" | "senha";

interface ShowPasswords {
  atual: boolean;
  nova: boolean;
  confirmar: boolean;
}

// ─── Mock ─────────────────────────────────────────────────────────────────────

const documentosMock = [
  { id: 1, nome: "diploma_medicina.pdf",       tamanho: "1.2 MB" },
  { id: 2, nome: "crm_registro.pdf",           tamanho: "840 KB" },
  { id: 3, nome: "certificado_cardiologia.pdf", tamanho: "2.1 MB" },
];

const ESTADOS = [
  "Acre (AC)","Alagoas (AL)","Amapá (AP)","Amazonas (AM)","Bahia (BA)",
  "Ceará (CE)","Distrito Federal (DF)","Espírito Santo (ES)","Goiás (GO)",
  "Maranhão (MA)","Mato Grosso (MT)","Mato Grosso do Sul (MS)",
  "Minas Gerais (MG)","Pará (PA)","Paraíba (PB)","Paraná (PR)",
  "Pernambuco (PE)","Piauí (PI)","Rio de Janeiro (RJ)",
  "Rio Grande do Norte (RN)","Rio Grande do Sul (RS)","Rondônia (RO)",
  "Roraima (RR)","Santa Catarina (SC)","São Paulo (SP)","Sergipe (SE)","Tocantins (TO)",
];

const ESPECIALIDADES = [
  "Cardiologia","Neurologia","Ortopedia","Fisioterapia","Nutrição",
  "Medicina Esportiva","Endocrinologia","Psiquiatria","Dermatologia","Clínica Geral",
];

const PLANOS = [
  {
    id: "starter", nome: "Starter", preco: "R$ 0", periodo: "grátis",
    features: ["Até 10 consultas/mês", "Feed básico", "Suporte por e-mail"],
    color: "#71717a", ativo: false,
  },
  {
    id: "pro", nome: "Pro", preco: "R$ 89", periodo: "/mês",
    features: ["Consultas ilimitadas", "Agenda completa", "Relatórios financeiros", "Suporte prioritário", "Feed completo"],
    color: "#10b981", ativo: true, destaque: true,
  },
  {
    id: "enterprise", nome: "Enterprise", preco: "R$ 199", periodo: "/mês",
    features: ["Tudo do Pro", "Multi-profissional", "API de integração", "Gerenciamento de equipe", "SLA garantido"],
    color: "#a78bfa", ativo: false,
  },
];

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconLock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
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

const IconDownload = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const IconDocument = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="9" y1="17" x2="15" y2="17" />
  </svg>
);

const IconSave = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

const IconTrash = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" /><path d="M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

const IconStar = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="#facc15" stroke="#facc15" strokeWidth="1">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// ─── Componentes ──────────────────────────────────────────────────────────────

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

function SelectInput({ id, options, value, onChange }: {
  id: string; options: string[]; value: string; onChange: (v: string) => void;
}) {
  return (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className="cfg2-input">
      {options.map((o) => <option key={o}>{o}</option>)}
    </select>
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

// ─── Aba Dados Pessoais ───────────────────────────────────────────────────────

function AbaDados() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [nome, setNome]             = useState("Dr. Rafael Costa");
  const [cpf, setCpf]               = useState("123.456.789-10");
  const [nascimento, setNascimento] = useState("15/03/1985");
  const [telefone, setTelefone]     = useState("(11) 98765-4321");
  const [email, setEmail]           = useState("rafael@fitmax.com");
  const [username, setUsername]     = useState("@rafaelcosta");
  const [atuacao, setAtuacao]       = useState("Médico");
  const [espec, setEspec]           = useState("Cardiologia");
  const [conselho, setConselho]     = useState("CFM-54321");
  const [estado, setEstado]         = useState("São Paulo (SP)");
  const [docs, setDocs]             = useState(documentosMock);
  const [saved, setSaved]           = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocs((prev) => [...prev, {
      id: Date.now(), nome: file.name,
      tamanho: `${(file.size / 1024).toFixed(0)} KB`,
    }]);
  }

  function removeDoc(id: number) {
    setDocs((prev) => prev.filter((d) => d.id !== id));
  }

  return (
    <div className="cfg2-content">

      {/* Linha 1: Nome + CPF */}
      <div className="cfg2-row">
        <Field label="Nome">
          <TextInput id="input-nome" value={nome} onChange={setNome} placeholder="Seu nome completo" />
        </Field>
        <Field label="CPF">
          <TextInput id="input-cpf" value={cpf} onChange={setCpf} placeholder="000.000.000-00" />
        </Field>
      </div>

      {/* Linha 2: Data nascimento + Telefone */}
      <div className="cfg2-row">
        <Field label="Data de nascimento">
          <TextInput id="input-nascimento" value={nascimento} onChange={setNascimento} placeholder="DD/MM/AAAA" />
        </Field>
        <Field label="Telefone">
          <TextInput id="input-telefone" type="tel" value={telefone} onChange={setTelefone} placeholder="(00) 00000-0000" />
        </Field>
      </div>

      {/* Linha 3: E-mail full width */}
      <Field label="E-mail">
        <TextInput id="input-email" type="email" value={email} onChange={setEmail} placeholder="seu@email.com" />
      </Field>

      {/* Linha 4: Username */}
      <Field label="Nome de usuário">
        <TextInput id="input-username" value={username} onChange={setUsername} placeholder="@usuario" />
      </Field>

      <div className="cfg2-separator" />

      {/* Dados profissionais */}
      <p className="cfg2-section-title">Dados Profissionais</p>

      <div className="cfg2-row">
        <Field label="Área de atuação">
          <SelectInput id="input-atuacao" options={["Médico","Fisioterapeuta","Nutricionista","Personal Trainer","Psicólogo","Educador Físico"]} value={atuacao} onChange={setAtuacao} />
        </Field>
        <Field label="Especialidade">
          <SelectInput id="input-especialidade" options={ESPECIALIDADES} value={espec} onChange={setEspec} />
        </Field>
      </div>

      <div className="cfg2-row">
        <Field label="Número do conselho">
          <TextInput id="input-conselho" value={conselho} onChange={setConselho} placeholder="Ex: CFM-12345" />
        </Field>
        <Field label="Estado">
          <SelectInput id="input-estado" options={ESTADOS} value={estado} onChange={setEstado} />
        </Field>
      </div>

      <div className="cfg2-separator" />

      {/* Documentos */}
      <p className="cfg2-section-title">Documentos</p>

      <div className="cfg2-docs">
        {docs.map((doc) => (
          <div key={doc.id} className="cfg2-doc-item">
            <div className="cfg2-doc-item__left">
              <IconDocument />
              <div>
                <p className="cfg2-doc-item__name">{doc.nome}</p>
                <p className="cfg2-doc-item__size">{doc.tamanho}</p>
              </div>
            </div>
            <div className="cfg2-doc-item__actions">
              <button className="cfg2-doc-btn" title="Download" id={`btn-download-${doc.id}`}>
                <IconDownload />
              </button>
              <button
                className="cfg2-doc-btn cfg2-doc-btn--del"
                title="Remover"
                id={`btn-remover-${doc.id}`}
                onClick={() => removeDoc(doc.id)}
              >
                <IconTrash />
              </button>
            </div>
          </div>
        ))}

        {/* Upload novo */}
        <button
          className="cfg2-upload-btn"
          id="btn-upload-doc"
          onClick={() => fileRef.current?.click()}
        >
          + Adicionar documento
        </button>
        <input
          ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png"
          style={{ display: "none" }} id="input-upload-doc"
          onChange={handleUpload}
        />
      </div>

      <div className="cfg2-separator" />

      {/* Footer */}
      <div className="cfg2-footer">
        <a href="#" className="cfg2-termos" id="link-termos">
          Ler Termos de Uso e Política de Privacidade
        </a>
        <div className="cfg2-footer__btns">
          <button
            className={`cfg2-btn-save${saved ? " cfg2-btn-save--done" : ""}`}
            id="btn-salvar-dados"
            onClick={handleSave}
          >
            {saved ? <><IconCheck /> Salvo!</> : <><IconSave /> Salvar alterações</>}
          </button>
          <button className="cfg2-btn-delete" id="btn-excluir-conta">
            <IconTrash /> Excluir conta
          </button>
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
          <span className="cfg2-plan-current__badge">Ativo</span>
          <p className="cfg2-plan-current__name">Pro</p>
          <p className="cfg2-plan-current__price">R$ 89<span>/mês</span></p>
        </div>
        <div className="cfg2-plan-current__meta">
          <p>Renovação em <strong>14 dias</strong></p>
          <p>Próxima cobrança: <strong>07/05/2026</strong></p>
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
                <li key={f}><IconCheck /> {f}</li>
              ))}
            </ul>
            <button
              id={`btn-plano-${p.id}`}
              className={`cfg2-plan__btn${p.ativo ? " cfg2-plan__btn--active" : ""}`}
              style={!p.ativo ? { borderColor: p.color, color: p.color } : {}}
            >
              {p.ativo ? "Plano atual" : "Selecionar"}
            </button>
          </div>
        ))}
      </div>

      <div className="cfg2-separator" />

      <div className="cfg2-footer">
        <p className="cfg2-cancel-note">Ao cancelar, você perde o acesso ao Pro no fim do período.</p>
        <button className="cfg2-btn-delete" id="btn-cancelar-assinatura">
          <IconTrash /> Cancelar assinatura
        </button>
      </div>
    </div>
  );
}

// ─── Aba Alterar Senha ────────────────────────────────────────────────────────

function AbaSenha() {
  const [senhaAtual, setSenhaAtual]       = useState("");
  const [novaSenha, setNovaSenha]         = useState("");
  const [confirmar, setConfirmar]         = useState("");
  const [show, setShow] = useState<ShowPasswords>({ atual: false, nova: false, confirmar: false });
  const [saved, setSaved] = useState(false);

  const toggle = (f: keyof ShowPasswords) => setShow((p) => ({ ...p, [f]: !p[f] }));

  // Strength
  let strength = 0;
  if (novaSenha.length >= 8) strength++;
  if (novaSenha.length >= 10 && /[A-Z]/.test(novaSenha)) strength++;
  if (novaSenha.length >= 12 && /[0-9]/.test(novaSenha)) strength++;
  if (novaSenha.length >= 14 && /[^a-zA-Z0-9]/.test(novaSenha)) strength++;

  const strengthColors = ["#f43f5e", "#f97316", "#facc15", "#10b981"];
  const strengthLabel  = ["Muito curta", "Fraca", "Razoável", "Forte"];

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="cfg2-content cfg2-content--narrow">
      <PasswordField
        id="input-senha-atual" label="Senha atual" placeholder="Insira sua senha atual"
        show={show.atual} onToggle={() => toggle("atual")} value={senhaAtual} onChange={setSenhaAtual}
      />
      <PasswordField
        id="input-nova-senha" label="Nova senha" placeholder="Insira sua nova senha"
        show={show.nova} onToggle={() => toggle("nova")} value={novaSenha} onChange={setNovaSenha}
      />

      {/* Strength */}
      {novaSenha.length > 0 && (
        <div className="cfg2-strength">
          <div className="cfg2-strength__bar">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="cfg2-strength__seg"
                style={{ background: i < strength ? strengthColors[strength - 1] : "rgba(255,255,255,0.08)" }}
              />
            ))}
          </div>
          <p className="cfg2-strength__label" style={{ color: strength > 0 ? strengthColors[strength - 1] : "#52525b" }}>
            {strength === 0 ? "Senha muito curta" : strengthLabel[strength - 1]}
          </p>
        </div>
      )}

      <PasswordField
        id="input-confirmar-senha" label="Confirmar nova senha" placeholder="Confirme sua nova senha"
        show={show.confirmar} onToggle={() => toggle("confirmar")} value={confirmar} onChange={setConfirmar}
      />

      <div className="cfg2-separator" />

      <div className="cfg2-footer cfg2-footer--end">
        <button
          className={`cfg2-btn-save${saved ? " cfg2-btn-save--done" : ""}`}
          id="btn-salvar-senha"
          onClick={handleSave}
        >
          {saved ? <><IconCheck /> Salvo!</> : <><IconSave /> Salvar</>}
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const ABAS: { id: Aba; label: string }[] = [
  { id: "dados",  label: "Dados pessoais" },
  { id: "plano",  label: "Meu plano" },
  { id: "senha",  label: "Alterar senha" },
];

export default function ConfiguracoesPage() {
  const [aba, setAba] = useState<Aba>("dados");

  return (
    <div className="cfg2-page">

      <div className="cfg2-header">
        <h1 className="cfg2-header__title">Configurações</h1>
        <p className="cfg2-header__sub">Gerencie suas preferências e dados da conta.</p>
      </div>

      {/* Tabs com underline deslizante */}
      <div className="cfg2-tabs">
        <div className="cfg2-tabs__bar">
          {ABAS.map((a) => (
            <button
              key={a.id}
              id={`tab-${a.id}`}
              className={`cfg2-tab${aba === a.id ? " cfg2-tab--active" : ""}`}
              onClick={() => setAba(a.id)}
            >
              {a.label}
            </button>
          ))}
        </div>
        {/* underline track + slider */}
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

      {aba === "dados" && <AbaDados />}
      {aba === "plano" && <AbaPlano />}
      {aba === "senha" && <AbaSenha />}
    </div>
  );
}
