"use client";

import { useState } from "react";

type ActiveTab = "dados" | "senha";
interface ShowPasswords { atual: boolean; nova: boolean; confirmar: boolean; }

const documentosMock = [
  { id: 1, nome: "foto.pdf" },
  { id: 2, nome: "foto.pdf" },
];

function IconLock() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
}
function IconEye() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
}
function IconEyeOff() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
}
function IconDownload() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
}
function IconDocument() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="17" x2="15" y2="17"/></svg>;
}
function IconTrash() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
}
function IconSave() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;
}

function FormField({ label, value, onChange, placeholder = "", type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[#71717a] text-sm font-semibold">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-[52px] px-4 rounded-lg border border-[#262626] bg-[#1c1c1c] text-white text-sm outline-none focus:border-emerald-500/50 transition-colors"
      />
    </div>
  );
}

function PasswordField({ label, placeholder, show, onToggle, value, onChange }: {
  label: string; placeholder: string; show: boolean; onToggle: () => void; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[#71717a] text-sm font-semibold">{label}</label>
      <div className="flex items-center gap-2 px-3 rounded-lg border border-[#262626] bg-[#1c1c1c] focus-within:border-emerald-500/50 transition-colors">
        <div className="flex-shrink-0"><IconLock /></div>
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 h-12 bg-transparent text-white text-sm outline-none"
        />
        <button type="button" onClick={onToggle} className="flex-shrink-0 p-1 rounded hover:bg-emerald-500/10 transition-colors">
          {show ? <IconEyeOff /> : <IconEye />}
        </button>
      </div>
    </div>
  );
}

export default function ConfigPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("dados");
  const [nome, setNome] = useState("Carol Santos");
  const [cpf, setCpf] = useState("123.456.789-10");
  const [dataNasc, setDataNasc] = useState("15/06/1980");
  const [telefone, setTelefone] = useState("(11) 95346-4325");
  const [email, setEmail] = useState("carol@gmail.com");
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [showPass, setShowPass] = useState<ShowPasswords>({ atual: false, nova: false, confirmar: false });
  const togglePass = (field: keyof ShowPasswords) => setShowPass((prev) => ({ ...prev, [field]: !prev[field] }));

  return (
    <div className="flex-1 overflow-auto bg-[#0f0f0f]">
      <div className="px-4 py-6 flex flex-col gap-5 max-w-[860px] mx-auto w-full pb-16">

        {/* Header */}
        <div>
          <h2 className="text-white font-extrabold text-3xl tracking-tight">Configurações</h2>
          <p className="text-[#71717a] text-sm mt-1">Gerencie suas preferências e dados da conta.</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-col gap-0">
          <div className="flex">
            {(["dados", "senha"] as ActiveTab[]).map((tab) => {
              const isActive = activeTab === tab;
              const label = tab === "dados" ? "Dados pessoais" : "Alterar senha";
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="px-4 py-3 rounded-none bg-transparent border-none cursor-pointer transition-colors"
                >
                  <span
                    className="text-base font-medium transition-colors"
                    style={{ color: isActive ? "#10b981" : "#71717a", fontWeight: isActive ? 700 : 500 }}
                  >
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="relative h-0.5 bg-[#262626]">
            <div
              className="absolute h-0.5 w-1/2 bg-emerald-500 rounded-full transition-all duration-200"
              style={{ left: activeTab === "dados" ? "0%" : "50%" }}
            />
          </div>
        </div>

        {/* Tab content */}
        {activeTab === "dados" ? (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-4 sm:flex-nowrap">
                <div className="flex-1 min-w-[220px]"><FormField label="Nome" value={nome} onChange={setNome} placeholder="Seu nome completo" /></div>
                <div className="flex-1 min-w-[220px]"><FormField label="CPF" value={cpf} onChange={setCpf} placeholder="000.000.000-00" /></div>
              </div>
              <div className="flex flex-wrap gap-4 sm:flex-nowrap">
                <div className="flex-1 min-w-[220px]"><FormField label="Data de nascimento" value={dataNasc} onChange={setDataNasc} placeholder="DD/MM/AAAA" /></div>
                <div className="flex-1 min-w-[220px]"><FormField label="Telefone" value={telefone} onChange={setTelefone} placeholder="(00) 00000-0000" type="tel" /></div>
              </div>
              <FormField label="E-mail" value={email} onChange={setEmail} placeholder="seu@email.com" type="email" />
            </div>

            <div className="border-t border-[#262626]" />

            {/* Documentos */}
            <div className="flex flex-col gap-3">
              <p className="text-white text-base font-bold">Documentos</p>
              <div className="flex flex-col gap-2">
                {documentosMock.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between px-4 py-3 rounded-lg border border-[#262626] bg-[#1c1c1c] hover:border-emerald-500/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <IconDocument />
                      <span className="text-white text-sm">{doc.nome}</span>
                    </div>
                    <button className="p-1.5 rounded-full hover:bg-emerald-500/10 transition-colors">
                      <IconDownload />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-[#262626]" />

            {/* Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-emerald-500 text-sm font-medium underline cursor-pointer hover:text-emerald-400 transition-colors">
                Ler Termos de Uso e Política de Privacidade
              </span>
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 transition-colors text-white font-bold text-sm">
                  <IconSave /> Salvar alterações
                </button>
                <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-red-500/30 bg-red-500/12 hover:bg-red-500/20 transition-colors text-[#f43f5e] font-bold text-sm">
                  <IconTrash /> Excluir conta
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 max-w-[600px]">
              <PasswordField label="Senha atual" placeholder="Insira sua senha atual" show={showPass.atual} onToggle={() => togglePass("atual")} value={senhaAtual} onChange={setSenhaAtual} />
              <PasswordField label="Nova senha" placeholder="Insira sua nova senha" show={showPass.nova} onToggle={() => togglePass("nova")} value={novaSenha} onChange={setNovaSenha} />
              <PasswordField label="Confirmar nova senha" placeholder="Confirme sua nova senha" show={showPass.confirmar} onToggle={() => togglePass("confirmar")} value={confirmarSenha} onChange={setConfirmarSenha} />
            </div>

            {/* Strength indicator */}
            {novaSenha.length > 0 && (
              <div className="flex flex-col gap-2 max-w-[600px]">
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((i) => {
                    let filled = false;
                    if (novaSenha.length >= 8 && i <= 1) filled = true;
                    if (novaSenha.length >= 10 && /[A-Z]/.test(novaSenha) && i <= 2) filled = true;
                    if (novaSenha.length >= 12 && /[0-9]/.test(novaSenha) && i <= 3) filled = true;
                    if (novaSenha.length >= 14 && /[^a-zA-Z0-9]/.test(novaSenha) && i <= 4) filled = true;
                    const color = filled ? (i <= 1 ? "#f43f5e" : i <= 2 ? "#f97316" : i <= 3 ? "#facc15" : "#10b981") : "#262626";
                    return <div key={i} className="flex-1 h-1 rounded-full transition-colors" style={{ backgroundColor: color }} />;
                  })}
                </div>
                <p className="text-[#71717a] text-xs">
                  {novaSenha.length < 8 ? "Senha muito curta" : novaSenha.length < 12 ? "Senha fraca — adicione letras maiúsculas e números" : "Senha forte ✓"}
                </p>
              </div>
            )}

            <div className="border-t border-[#262626]" />

            <div className="flex justify-end">
              <button className="flex items-center gap-2 px-6 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 transition-colors text-white font-bold text-base">
                <IconSave /> Salvar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
