"use client";

import { useState, useEffect } from "react";
import { AxiosError } from "axios";
import { api } from "../../../lib/api";

const C = {
  bg: "#111111", card: "#1a1a1a", hover: "#222222",
  border: "#27272a", text: "#fafafa", muted: "#a1a1aa", dim: "#71717a",
  green: "#10b981",
};

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

function InputField({ id, label, value, onChange, disabled, placeholder }: {
  id: string; label: string; value: string; onChange: (v: string) => void; disabled?: boolean; placeholder?: string;
}) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6, flex:1, minWidth:200 }}>
      <label style={{ color:C.muted, fontSize:12, fontWeight:600 }}>{label}</label>
      <input id={id} type="text" value={value} disabled={disabled} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{ background:disabled?"rgba(255,255,255,0.03)":"#141414", border:`1px solid ${C.border}`, borderRadius:10, height:42, padding:"0 12px", color:disabled?C.dim:C.text, fontSize:14, fontFamily:"inherit", outline:"none", width:"100%", transition:"border-color .2s" }}
        onFocus={e=>(e.target.style.borderColor=C.green)} onBlur={e=>(e.target.style.borderColor=C.border)}
      />
    </div>
  );
}

function SaveButton({ id, saved, onClick, text = "Salvar alterações", disabled }: { id: string; saved: boolean; onClick: () => void; text?: string; disabled?: boolean }) {
  return (
    <button id={id} onClick={onClick} disabled={disabled} style={{ padding:"10px 20px", borderRadius:8, background:saved?"#059669":C.green, border:"none", color:"white", fontSize:13, fontWeight:700, cursor:disabled?"not-allowed":"pointer", fontFamily:"inherit", transition:"background .15s", opacity: disabled ? 0.6 : 1 }}
      onMouseEnter={e=>!saved&&!disabled&&((e.target as HTMLElement).style.background="#0ea370")} onMouseLeave={e=>!saved&&!disabled&&((e.target as HTMLElement).style.background=C.green)}>
      {saved ? "✓ Salvo!" : text}
    </button>
  );
}

export default function AgoraConfigPage() {
  const [appId, setAppId] = useState("");
  const [appCert, setAppCert] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get('/admin/configuracoes/agora-keys')
      .then(res => {
        setAppId(res.data.appId || "");
        setAppCert(res.data.appCertificate || "");
      })
      .catch(err => {
        if (err instanceof AxiosError) setError(err.response?.data?.error || "Erro ao carregar configurações.");
        else setError("Erro inesperado.");
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setError(null);
    setSaving(true);
    try {
      await api.put('/admin/configuracoes/agora-keys', { appId, appCertificate: appCert });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      if (err instanceof AxiosError) setError(err.response?.data?.error || "Erro ao salvar configurações.");
      else setError("Erro inesperado.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "20px 0" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: C.text, margin: "0 0 8px" }}>Integração Agora.io</h1>
        <p style={{ color: C.muted, margin: 0, fontSize: 14 }}>
          Configure as chaves da API do Agora.io para habilitar as videochamadas na plataforma.
        </p>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: C.muted }}>Carregando configurações...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <HCard style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
            <SectionTitle>Credenciais do Agora.io</SectionTitle>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <InputField 
                id="agora-appid" 
                label="App ID" 
                value={appId} 
                onChange={setAppId} 
                placeholder="Insira o seu Agora App ID" 
              />
              <InputField 
                id="agora-cert" 
                label="App Certificate" 
                value={appCert} 
                onChange={setAppCert} 
                placeholder="Insira o seu Agora App Certificate" 
              />
            </div>

            {error && (
              <div style={{ padding: "10px 14px", background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.3)", borderRadius: 8, color: "#f43f5e", fontSize: 13 }}>
                {error}
              </div>
            )}
            
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
              <SaveButton 
                id="btn-salvar-agora" 
                saved={saved} 
                onClick={handleSave} 
                disabled={saving} 
                text={saving ? "Salvando..." : "Salvar Chaves"} 
              />
            </div>
          </HCard>

          <HCard style={{ padding: 24 }}>
            <SectionTitle>Como obter essas chaves?</SectionTitle>
            <ol style={{ color: C.dim, fontSize: 13, margin: 0, paddingLeft: 16, display: "flex", flexDirection: "column", gap: 8 }}>
              <li>Crie uma conta no console da <a href="https://console.agora.io/" target="_blank" style={{ color: C.green, textDecoration: "none" }}>Agora.io</a>.</li>
              <li>Crie um novo projeto com o caso de uso de "Video Calling".</li>
              <li>Em Segurança (Security), certifique-se de escolher <strong>"App ID + App Certificate"</strong> (modo com token).</li>
              <li>Copie o App ID e o App Certificate gerados e cole nos campos acima.</li>
            </ol>
          </HCard>
        </div>
      )}
    </div>
  );
}
