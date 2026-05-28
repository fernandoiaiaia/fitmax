//@ts-nocheck
"use client";

import { useState, useEffect, useCallback } from "react";
import { listarConsultas, cancelarConsulta } from "../../../lib/consultas-api";
import type { ConsultaResumo } from "../../../lib/consultas-api";
import { useAuth } from "../../../lib/auth-context";

// ─── Paleta ───────────────────────────────────────────────────────────────────
const C = {
  bg: "#111111", card: "#1a1a1a", card2: "#222222",
  border: "#27272a", text: "#fafafa", muted: "#a1a1aa",
  dim: "#71717a", green: "#10b981", yellow: "#facc15", red: "#f43f5e",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DIAS_SEMANA = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

function fmtData(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day:"2-digit", month:"short", year:"numeric" });
}
function fmtHora(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour:"2-digit", minute:"2-digit" });
}
function toLocalDate(iso: string) {
  // Interpreta corretamente independente de timezone
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function statusLabel(s: string) {
  if (s === "consulta_confirmada") return { label: "Confirmada", color: C.green };
  if (s === "pagamento_pendente")  return { label: "Pendente",   color: C.yellow };
  return { label: "Cancelada", color: C.red };
}

// ─── Card de consulta ─────────────────────────────────────────────────────────
function ConsultaCard({ c, onCancel }: { c: ConsultaResumo; onCancel: (id: string) => void }) {
  const st = statusLabel(c.statusFluxo);
  return (
    <div style={{ background: C.card2, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 16px", display: "flex", gap: 12, alignItems: "flex-start" }}>
      <img src={c.profissional.avatarUrl ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(c.profissional.name)}&background=10b981&color=fff`}
        style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} alt="" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, flexWrap: "wrap" }}>
          <span style={{ color: C.text, fontWeight: "bold", fontSize: 14 }}>{c.profissional.name}</span>
          <span style={{ fontSize: 11, fontWeight: "bold", color: st.color, background: `${st.color}18`, padding: "2px 10px", borderRadius: 999, whiteSpace: "nowrap" }}>{st.label}</span>
        </div>
        <span style={{ color: C.muted, fontSize: 12, display: "block", marginTop: 2 }}>{c.especialidade} · {c.tipo}</span>
        <div style={{ display: "flex", gap: 12, marginTop: 6, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ color: C.dim, fontSize: 12 }}>🕐 {fmtHora(c.dataHora)}</span>
          <span style={{ color: C.dim, fontSize: 12 }}>💰 R$ {c.valorReais}</span>
          {c.profissional.cidade && <span style={{ color: C.dim, fontSize: 12 }}>📍 {c.profissional.cidade}</span>}
        </div>
      </div>
      {c.statusFluxo !== "consulta_cancelada" && (
        <button onClick={() => onCancel(c.id)}
          style={{ background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.25)", borderRadius: 8, color: C.red, fontSize: 12, padding: "6px 10px", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0 }}>
          Cancelar
        </button>
      )}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function AgendaPage() {
  const { loadingUser, accessToken } = useAuth();

  // Estado do calendário
  const today = new Date();
  const [ano,  setAno]  = useState(today.getFullYear());
  const [mes,  setMes]  = useState(today.getMonth());       // 0-indexed
  const [diaSelecionado, setDiaSelecionado] = useState<string>(() => toLocalDate(today.toISOString()));

  // Consultas do mês inteiro (para os pontos no calendário)
  const [consultasMes,  setConsultasMes]  = useState<ConsultaResumo[]>([]);
  const [loadingMes,    setLoadingMes]    = useState(false);

  // Consultas do dia selecionado
  const [consultasDia,  setConsultasDia]  = useState<ConsultaResumo[]>([]);
  const [loadingDia,    setLoadingDia]    = useState(false);

  // Próximas consultas (futuras)
  const [proximas,      setProximas]      = useState<ConsultaResumo[]>([]);
  const [loadingProx,   setLoadingProx]   = useState(false);

  // Erro + modal de cancelamento
  const [erro,          setErro]          = useState<string | null>(null);
  const [cancelando,    setCancelando]    = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);

  // ── Carrega consultas do mês ────────────────────────────────────────────────
  const carregarMes = useCallback(async (a: number, m: number) => {
    if (loadingUser || !accessToken) return;
    setLoadingMes(true);
    const primeiro = new Date(a, m, 1).toISOString().slice(0, 10);
    const ultimo   = new Date(a, m + 1, 0).toISOString().slice(0, 10);
    try {
      const r = await listarConsultas({ dateFrom: primeiro, dateTo: ultimo, limit: 200 });
      setConsultasMes(r.data);
    } catch { setErro("Erro ao carregar agenda do mês"); }
    finally { setLoadingMes(false); }
  }, [loadingUser, accessToken]);

  // ── Carrega consultas do dia selecionado ────────────────────────────────────
  const carregarDia = useCallback(async (dia: string) => {
    if (loadingUser || !accessToken) return;
    setLoadingDia(true);
    try {
      const r = await listarConsultas({ dateFrom: dia, dateTo: dia, limit: 50 });
      setConsultasDia(r.data);
    } catch { setConsultasDia([]); }
    finally { setLoadingDia(false); }
  }, [loadingUser, accessToken]);

  // ── Carrega próximas consultas ──────────────────────────────────────────────
  const carregarProximas = useCallback(async () => {
    if (loadingUser || !accessToken) return;
    setLoadingProx(true);
    const amanha = new Date(); amanha.setDate(amanha.getDate() + 1);
    try {
      const r = await listarConsultas({ dateFrom: amanha.toISOString().slice(0,10), limit: 5 });
      setProximas(r.data);
    } catch { setProximas([]); }
    finally { setLoadingProx(false); }
  }, [loadingUser, accessToken]);

  useEffect(() => { carregarMes(ano, mes); }, [ano, mes, carregarMes]);
  useEffect(() => { carregarDia(diaSelecionado); }, [diaSelecionado, carregarDia]);
  useEffect(() => { carregarProximas(); }, [carregarProximas]);

  // ── Cancelar consulta ───────────────────────────────────────────────────────
  async function handleCancelar(id: string) {
    setCancelando(id);
    try {
      await cancelarConsulta(id);
      setConfirmCancel(null);
      await Promise.all([carregarMes(ano, mes), carregarDia(diaSelecionado), carregarProximas()]);
    } catch(e: any) { setErro(e?.response?.data?.error ?? "Erro ao cancelar"); }
    finally { setCancelando(null); }
  }

  // ── Mapa de dias com consultas (para pontos no calendário) ──────────────────
  const diasComConsultas = consultasMes.reduce<Record<string, { confirmada: boolean; pendente: boolean }>>((acc, c) => {
    const dia = toLocalDate(c.dataHora);
    if (!acc[dia]) acc[dia] = { confirmada: false, pendente: false };
    if (c.statusFluxo === "consulta_confirmada") acc[dia].confirmada = true;
    if (c.statusFluxo === "pagamento_pendente")  acc[dia].pendente   = true;
    return acc;
  }, {});

  // ── Geração das células do calendário ──────────────────────────────────────
  const primeiroDia = new Date(ano, mes, 1).getDay(); // 0=Dom
  const ultimoDia   = new Date(ano, mes + 1, 0).getDate();
  const celulas: (number | null)[] = [
    ...Array(primeiroDia).fill(null),
    ...Array.from({ length: ultimoDia }, (_, i) => i + 1),
  ];
  // Completa para múltiplo de 7
  while (celulas.length % 7 !== 0) celulas.push(null);

  function navMes(delta: number) {
    let nm = mes + delta, na = ano;
    if (nm < 0)  { nm = 11; na--; }
    if (nm > 11) { nm = 0;  na++; }
    setMes(nm); setAno(na);
  }

  const consultasDiaSelecionado = consultasDia;
  const todayStr = toLocalDate(today.toISOString());

  return (
    <div style={{ flex: 1, overflowY: "auto", backgroundColor: C.bg, padding: 16, fontFamily: "inherit" }}>
      {/* Modal de confirmação de cancelamento */}
      {confirmCancel && (
        <div onClick={e => { if (e.target === e.currentTarget) setConfirmCancel(null); }}
          style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.7)", padding: 16 }}>
          <div style={{ background: C.card, border: "1px solid rgba(244,63,94,0.4)", borderRadius: 16, padding: 24, width: "100%", maxWidth: 360 }}>
            <p style={{ color: C.text, fontWeight: "bold", fontSize: 16, margin: "0 0 8px" }}>Cancelar consulta?</p>
            <p style={{ color: C.muted, fontSize: 13, margin: "0 0 20px" }}>Esta ação não pode ser desfeita.</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setConfirmCancel(null)}
                style={{ flex: 1, padding: "10px 0", borderRadius: 8, background: "transparent", border: `1px solid ${C.border}`, color: C.muted, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Voltar</button>
              <button onClick={() => handleCancelar(confirmCancel!)} disabled={!!cancelando}
                style={{ flex: 1, padding: "10px 0", borderRadius: 8, background: cancelando ? "#52525b" : C.red, border: "none", color: "#fff", fontSize: 13, fontWeight: "bold", cursor: cancelando ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
                {cancelando ? "Cancelando…" : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Header */}
        <div>
          <h2 style={{ color: C.text, fontSize: 24, fontWeight: "bold", margin: 0 }}>Agenda</h2>
          <p style={{ color: C.muted, fontSize: 14, margin: "4px 0 0" }}>Suas consultas agendadas</p>
        </div>

        {erro && (
          <div style={{ background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.3)", borderRadius: 8, padding: "10px 14px", color: C.red, fontSize: 13 }}>{erro}</div>
        )}

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
          {/* ── Calendário ─────────────────────────────────────────────────── */}
          <div style={{ flex: "0 0 auto", width: "100%", maxWidth: 340, background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16 }}>
            {/* Navegação */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <button id="btn-mes-anterior" onClick={() => navMes(-1)}
                style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 8, color: C.muted, padding: "6px 10px", cursor: "pointer", fontSize: 16, fontFamily: "inherit" }}>‹</button>
              <span style={{ color: C.text, fontWeight: "bold", fontSize: 15 }}>{MESES[mes]} {ano}</span>
              <button id="btn-mes-proximo" onClick={() => navMes(1)}
                style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 8, color: C.muted, padding: "6px 10px", cursor: "pointer", fontSize: 16, fontFamily: "inherit" }}>›</button>
            </div>

            {/* Dias da semana */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 4 }}>
              {DIAS_SEMANA.map(d => (
                <div key={d} style={{ textAlign: "center", color: C.dim, fontSize: 11, fontWeight: "bold", padding: "4px 0" }}>{d}</div>
              ))}
            </div>

            {/* Células */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
              {celulas.map((dia, i) => {
                if (!dia) return <div key={`empty-${i}`} />;
                const diaStr = `${ano}-${String(mes+1).padStart(2,"0")}-${String(dia).padStart(2,"0")}`;
                const info   = diasComConsultas[diaStr];
                const isToday    = diaStr === todayStr;
                const isSelected = diaStr === diaSelecionado;
                return (
                  <button key={diaStr} id={`dia-${diaStr}`} onClick={() => setDiaSelecionado(diaStr)}
                    style={{
                      position: "relative", textAlign: "center", padding: "6px 2px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: isToday ? "bold" : "normal",
                      background: isSelected ? C.green : isToday ? "rgba(16,185,129,0.15)" : "transparent",
                      border: isSelected ? "none" : isToday ? `1px solid ${C.green}` : "none",
                      color: isSelected ? "#fff" : isToday ? C.green : C.text,
                    }}>
                    {dia}
                    {info && (
                      <div style={{ position: "absolute", bottom: 2, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 2 }}>
                        {info.confirmada && <div style={{ width: 4, height: 4, borderRadius: "50%", background: isSelected ? "#fff" : C.green }} />}
                        {info.pendente   && <div style={{ width: 4, height: 4, borderRadius: "50%", background: isSelected ? "#fff" : C.yellow }} />}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legenda */}
            <div style={{ display: "flex", gap: 12, marginTop: 12, justifyContent: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.green }} />
                <span style={{ color: C.dim, fontSize: 11 }}>Confirmada</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.yellow }} />
                <span style={{ color: C.dim, fontSize: 11 }}>Pendente</span>
              </div>
            </div>

            {loadingMes && (
              <p style={{ textAlign: "center", color: C.dim, fontSize: 12, marginTop: 8 }}>Carregando...</p>
            )}
          </div>

          {/* ── Painel direito ─────────────────────────────────────────────── */}
          <div style={{ flex: 1, minWidth: 260, display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Consultas do dia */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16 }}>
              <h3 style={{ color: C.text, fontSize: 15, fontWeight: "bold", margin: "0 0 12px" }}>
                {diaSelecionado === todayStr ? "Hoje" : fmtData(`${diaSelecionado}T12:00:00`)}
              </h3>
              {loadingDia ? (
                <p style={{ color: C.dim, fontSize: 13, margin: 0 }}>Carregando...</p>
              ) : consultasDiaSelecionado.length === 0 ? (
                <p style={{ color: C.dim, fontSize: 13, margin: 0 }}>Nenhuma consulta neste dia.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {consultasDiaSelecionado.map(c => (
                    <ConsultaCard key={c.id} c={c} onCancel={id => setConfirmCancel(id)} />
                  ))}
                </div>
              )}
            </div>

            {/* Próximas consultas */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16 }}>
              <h3 style={{ color: C.text, fontSize: 15, fontWeight: "bold", margin: "0 0 12px" }}>Próximas consultas</h3>
              {loadingProx ? (
                <p style={{ color: C.dim, fontSize: 13, margin: 0 }}>Carregando...</p>
              ) : proximas.length === 0 ? (
                <p style={{ color: C.dim, fontSize: 13, margin: 0 }}>Nenhuma consulta futura agendada.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {proximas.map(c => (
                    <div key={c.id} style={{ display: "flex", gap: 12, alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                      <img src={c.profissional.avatarUrl ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(c.profissional.name)}&background=10b981&color=fff`}
                        style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} alt="" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: C.text, fontSize: 13, fontWeight: "bold", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.profissional.name}</div>
                        <div style={{ color: C.muted, fontSize: 12 }}>{fmtData(c.dataHora)} · {fmtHora(c.dataHora)}</div>
                      </div>
                      <button onClick={() => { setAno(new Date(c.dataHora).getFullYear()); setMes(new Date(c.dataHora).getMonth()); setDiaSelecionado(toLocalDate(c.dataHora)); }}
                        style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 6, color: C.muted, fontSize: 11, padding: "4px 8px", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>Ver</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
