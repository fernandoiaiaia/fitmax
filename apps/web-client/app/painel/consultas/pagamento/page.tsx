//@ts-nocheck
"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ScrollView, YStack, XStack, Text, H2 } from "tamagui";
import { updateStatus } from "../consultasStore";

// ─── Mock Data ────────────────────────────────────────────────────────────────

const consultasMock = [
  { id: "c001", paciente: { nome: "Carlos Mendes", avatar: "https://picsum.photos/200/200?random=10" }, tipo: "Presencial", especialidade: { nome: "Nutrição", icon: "🥗" }, data: "2026-05-20", horario: "10:00", clinica: { nome: "SportMed Clínica", cidade: "São Paulo", uf: "SP" }, convenio: { nome: "Unimed" } },
  { id: "c002", paciente: { nome: "Fernanda Lima",  avatar: "https://picsum.photos/200/200?random=11" }, tipo: "Online",     especialidade: { nome: "Nutrologia",  icon: "💊" }, data: "2026-05-21", horario: "14:00", clinica: null, convenio: null },
  { id: "c003", paciente: { nome: "Rafael Oliveira",avatar: "https://picsum.photos/200/200?random=12" }, tipo: "Presencial", especialidade: { nome: "Fisioterapia",icon: "💪" }, data: "2026-05-22", horario: "09:00", clinica: { nome: "SportMed Clínica", cidade: "São Paulo", uf: "SP" }, convenio: { nome: "Bradesco Saúde" } },
];

const VALOR_BASE: Record<string, number> = {
  "Nutrição": 250, "Nutrologia": 300, "Fisioterapia": 200,
  "Ortopedia": 350, "Endocrinologia": 320,
  "Medicina Esportiva": 280, "Personal Trainer": 180, "Psicologia": 240,
};

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-"); return `${d}/${m}/${y}`;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const STYLES = `
  @keyframes pg-fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
  @keyframes pg-spin   { to { transform:rotate(360deg); } }
  @keyframes pg-scaleIn { from { opacity:0; transform:scale(0.85); } to { opacity:1; transform:scale(1); } }

  .pg-page { animation: pg-fadeUp 0.3s ease; }
  .pg-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 18px; padding: 22px;
  }
  .pg-section-label {
    font-size: 11px; font-weight: 700; color: #71717a;
    letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 10px; display: block;
  }

  /* resumo */
  .pg-resumo-row { display:flex; align-items:flex-start; gap:10px; font-size:13px; color:#a1a1aa; margin-bottom:7px; }
  .pg-resumo-row:last-child { margin-bottom:0; }
  .pg-resumo-text { color:#d4d4d8; line-height:1.5; }
  .pg-resumo-text strong { color:#f4f4f5; }

  /* valor */
  .pg-valor-block {
    background: rgba(16,185,129,0.06);
    border: 1px solid rgba(16,185,129,0.2);
    border-radius: 14px; padding: 20px 24px;
    display: flex; align-items: center; justify-content: space-between; gap: 16px;
  }
  .pg-valor-price { font-size: 32px; font-weight: 900; color: #f4f4f5; letter-spacing: -0.02em; }
  .pg-valor-note  { font-size: 12px; color: #10b981; margin-top: 4px; }

  /* métodos */
  .pg-metodo-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; }
  @media (max-width:480px) { .pg-metodo-grid { grid-template-columns: 1fr; } }
  .pg-metodo-card {
    background: rgba(255,255,255,0.03);
    border: 1.5px solid rgba(255,255,255,0.08);
    border-radius: 14px; padding: 16px 12px;
    cursor: pointer; text-align: center;
    transition: all 0.18s; position: relative;
  }
  .pg-metodo-card:hover { background: rgba(255,255,255,0.06); transform: translateY(-2px); }
  .pg-metodo-card.active { border-color: #10b981; background: rgba(16,185,129,0.08); }
  .pg-metodo-icon  { font-size: 26px; margin-bottom: 6px; }
  .pg-metodo-title { font-size: 13px; font-weight: 700; color: #f4f4f5; }
  .pg-metodo-sub   { font-size: 11px; color: #71717a; margin-top: 3px; }
  .pg-metodo-card.active .pg-metodo-title { color: #10b981; }
  .pg-metodo-check {
    position: absolute; top: 8px; right: 8px;
    width: 18px; height: 18px; border-radius: 50%;
    background: #10b981;
    display: flex; align-items: center; justify-content: center;
    opacity: 0; transform: scale(0.5);
    transition: opacity 0.2s, transform 0.22s cubic-bezier(0.34,1.56,0.64,1);
  }
  .pg-metodo-card.active .pg-metodo-check { opacity:1; transform:scale(1); }

  /* detalhes de método */
  .pg-detail { animation: pg-fadeUp 0.22s ease; }

  /* pix */
  .pg-pix-qr {
    width: 160px; height: 160px;
    background: #fff; border-radius: 12px;
    padding: 10px; margin: 0 auto 16px;
    display: flex; align-items: center; justify-content: center;
  }
  .pg-pix-code {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px; padding: 10px 14px;
    font-size: 11px; color: #71717a;
    font-family: monospace; word-break: break-all;
    margin-bottom: 10px;
  }
  .pg-copy-btn {
    background: rgba(16,185,129,0.12);
    border: 1px solid rgba(16,185,129,0.3);
    border-radius: 8px; padding: 7px 16px;
    color: #10b981; font-size: 12px; font-weight: 700;
    cursor: pointer; font-family: inherit; transition: all 0.15s;
  }
  .pg-copy-btn:hover { background: rgba(16,185,129,0.2); }

  /* cartão */
  .pg-card-form { display: flex; flex-direction: column; gap: 12px; }
  .pg-card-row  { display: flex; gap: 10px; }
  .pg-field-wrap { display: flex; flex-direction: column; gap: 4px; flex: 1; }
  .pg-field-label { font-size: 11px; font-weight: 600; color: #71717a; letter-spacing: 0.04em; text-transform: uppercase; }
  .pg-field {
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px; padding: 10px 12px; color: #f4f4f5;
    font-size: 14px; font-family: inherit; outline: none;
    transition: border-color 0.15s, box-shadow 0.15s; width: 100%; box-sizing: border-box;
  }
  .pg-field::placeholder { color: #52525b; }
  .pg-field:focus { border-color: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,0.12); }
  .pg-field select { color: #f4f4f5; }

  /* boleto */
  .pg-boleto-code {
    font-family: monospace; font-size: 13px; color: #a1a1aa;
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px; padding: 12px 16px; word-break: break-all;
    letter-spacing: 0.05em; margin-bottom: 12px; line-height: 1.6;
  }
  .pg-boleto-bars {
    display: flex; gap: 2px; height: 48px;
    margin-bottom: 12px; align-items: stretch;
  }
  .pg-bar { background: #f4f4f5; border-radius: 1px; flex-shrink: 0; }

  /* botões */
  .pg-btn-pay {
    background: #10b981; border: none; border-radius: 12px;
    padding: 15px 32px; color: #fff; font-size: 15px; font-weight: 700;
    cursor: pointer; font-family: inherit;
    transition: background 0.2s, box-shadow 0.2s, transform 0.15s;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    width: 100%;
  }
  .pg-btn-pay:hover:not(:disabled) { background: #0ea370; box-shadow: 0 0 20px rgba(16,185,129,0.4); transform: translateY(-1px); }
  .pg-btn-pay:disabled { opacity: 0.4; cursor: not-allowed; }
  .pg-spinner { animation: pg-spin 0.7s linear infinite; display: inline-block; }
  .pg-btn-ghost {
    background: transparent; border: 1px solid rgba(255,255,255,0.15);
    border-radius: 12px; padding: 14px 24px; color: #a1a1aa;
    font-size: 15px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.15s;
  }
  .pg-btn-ghost:hover { border-color: rgba(255,255,255,0.3); color: #e4e4e7; }

  /* sucesso */
  .pg-success { animation: pg-scaleIn 0.4s ease; text-align: center; padding: 48px 24px; }
  .pg-success-icon {
    width: 80px; height: 80px; border-radius: 50%;
    background: rgba(16,185,129,0.15); border: 2px solid #10b981;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 24px; font-size: 36px;
  }
`;

// ─── QR Code Mock SVG ─────────────────────────────────────────────────────────

function QrCodeMock() {
  // Padrão simples de células para simular QR
  const cells = "1110011101110001011011101001010101101100100110111011001110011000111001010111101001011011011011010010011010001101001110100011001011001110010101000110011110101011010001011001000101001010010110110110001100100110001001110001010111001100101001011100111001110011101".split("").map(Number);
  const size = 16;
  return (
    <svg width="140" height="140" viewBox="0 0 16 16" style={{ imageRendering: "pixelated" }}>
      {cells.map((v, i) => v ? (
        <rect key={i} x={i % size} y={Math.floor(i / size)} width={1} height={1} fill="#000" />
      ) : null)}
    </svg>
  );
}

// ─── Pix Block ────────────────────────────────────────────────────────────────

const PIX_CODE = "00020126330014br.gov.bcb.pix0111fitmax@pix52040000530398654062.505802BR5915FitMax Saude6009SAO PAULO62070503***6304ABCD";

function PixBlock({ copied, onCopy }: { copied: boolean; onCopy: () => void }) {
  return (
    <div className="pg-detail" style={{ textAlign: "center" }}>
      <div className="pg-pix-qr"><QrCodeMock /></div>
      <p style={{ fontSize: 12, color: "#71717a", marginBottom: 10 }}>Escaneie o QR Code com o app do seu banco</p>
      <div className="pg-pix-code">{PIX_CODE}</div>
      <button className="pg-copy-btn" onClick={onCopy}>
        {copied ? "✓ Copiado!" : "📋 Copiar código Pix"}
      </button>
    </div>
  );
}

// ─── Card Block ───────────────────────────────────────────────────────────────

function CardBlock({ cardData, onChange }: { cardData: any; onChange: (k: string, v: string) => void }) {
  function maskNumber(v: string) {
    return v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  }
  function maskExpiry(v: string) {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length > 2 ? d.slice(0,2) + "/" + d.slice(2) : d;
  }
  return (
    <div className="pg-card-form pg-detail">
      <div className="pg-field-wrap">
        <label className="pg-field-label">Número do Cartão</label>
        <input className="pg-field" placeholder="0000 0000 0000 0000" maxLength={19}
          value={cardData.number}
          onChange={e => onChange("number", maskNumber(e.target.value))} />
      </div>
      <div className="pg-field-wrap">
        <label className="pg-field-label">Nome no Cartão</label>
        <input className="pg-field" placeholder="NOME COMPLETO"
          value={cardData.name}
          onChange={e => onChange("name", e.target.value.toUpperCase())} />
      </div>
      <div className="pg-card-row">
        <div className="pg-field-wrap">
          <label className="pg-field-label">Validade</label>
          <input className="pg-field" placeholder="MM/AA" maxLength={5}
            value={cardData.expiry}
            onChange={e => onChange("expiry", maskExpiry(e.target.value))} />
        </div>
        <div className="pg-field-wrap">
          <label className="pg-field-label">CVV</label>
          <input className="pg-field" placeholder="123" maxLength={4} type="password"
            value={cardData.cvv}
            onChange={e => onChange("cvv", e.target.value.replace(/\D/g,"").slice(0,4))} />
        </div>
      </div>
      <div className="pg-field-wrap">
        <label className="pg-field-label">Parcelas</label>
        <select className="pg-field" value={cardData.parcelas}
          onChange={e => onChange("parcelas", e.target.value)}
          style={{ background: "rgba(255,255,255,0.04)", color: "#f4f4f5" }}>
          <option value="1">1x sem juros</option>
          <option value="2">2x sem juros</option>
          <option value="3">3x sem juros</option>
        </select>
      </div>
    </div>
  );
}

// ─── Boleto Block ─────────────────────────────────────────────────────────────

const BOLETO_CODE = "34191.09008 58520.610053 60047.671172 6 92770000025000";

function generateBars() {
  const widths = [2,1,3,1,2,1,1,2,3,1,2,1,3,2,1,2,1,3,1,2,1,1,3,2,1,2,1,2,3,1,2,1,1,2,3,1,2,1,2,1,3,2,1,2,1];
  return widths.map((w, i) => ({ w, dark: i % 2 === 0 }));
}

function BoletoBlock({ onCopy, copied }: { onCopy: () => void; copied: boolean }) {
  const bars = generateBars();
  return (
    <div className="pg-detail">
      <div className="pg-boleto-bars">
        {bars.map((b, i) => (
          <div key={i} className="pg-bar" style={{ width: b.w * 3, background: b.dark ? "#f4f4f5" : "transparent" }} />
        ))}
      </div>
      <div className="pg-boleto-code">{BOLETO_CODE}</div>
      <button className="pg-copy-btn" onClick={onCopy}>{copied ? "✓ Copiado!" : "📋 Copiar linha digitável"}</button>
      <p style={{ fontSize: 12, color: "#71717a", marginTop: 10, textAlign: "center" }}>
        Vencimento em 3 dias úteis. Pague em qualquer banco ou app.
      </p>
    </div>
  );
}

// ─── Inner Page ───────────────────────────────────────────────────────────────

function PagamentoInner() {
  const router    = useRouter();
  const params    = useSearchParams();
  const consultaId = params.get("id") ?? "c001";
  const consulta  = consultasMock.find(c => c.id === consultaId) ?? consultasMock[0];

  const valorBase = VALOR_BASE[consulta.especialidade.nome] ?? 250;
  const temConvenio = !!consulta.convenio;
  const valorFinal  = temConvenio ? Math.round(valorBase * 0.7) : valorBase;

  const [metodo,    setMetodo]    = useState<"pix" | "cartao" | "boleto">("pix");
  const [copied,    setCopied]    = useState(false);
  const [cardData,  setCardData]  = useState({ number: "", name: "", expiry: "", cvv: "", parcelas: "1" });
  const [paying,    setPaying]    = useState(false);
  const [success,   setSuccess]   = useState(false);

  function handleCopy(text: string) {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function changeCard(k: string, v: string) {
    setCardData(prev => ({ ...prev, [k]: v }));
  }

  const canPay =
    metodo === "pix"    ? true :
    metodo === "boleto" ? true :
    (cardData.number.replace(/\s/g,"").length === 16 && cardData.name.length > 2 && cardData.expiry.length === 5 && cardData.cvv.length >= 3);

  async function pagar() {
    if (!canPay || paying) return;
    setPaying(true);
    await new Promise(r => setTimeout(r, 1000));
    updateStatus(consulta.id, "consulta_confirmada");
    setPaying(false);
    setSuccess(true);
  }

  if (success) {
    return (
      <div className="pg-card pg-success">
        <div className="pg-success-icon">✅</div>
        <Text color="$color12" fontSize={22} fontWeight="bold" display="block" marginBottom="$2">
          Pagamento Confirmado!
        </Text>
        <Text color="$color11" fontSize={14} display="block" marginBottom="$2">
          Sua consulta com <strong style={{ color: "#f4f4f5" }}>Dr(a). {consulta.especialidade.nome}</strong> está confirmada.
        </Text>
        <Text color="$color11" fontSize={13} display="block" marginBottom="$6">
          📅 {formatDate(consulta.data)} às {consulta.horario}
          {" · "}{consulta.tipo === "Online" ? "🌐 Online" : "📍 Presencial"}
        </Text>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.35)", borderRadius: 99, padding: "4px 14px", fontSize: 11, fontWeight: 800, color: "#10b981", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 28 }}>
          🟢 consulta_confirmada
        </div>
        <button className="pg-btn-pay" style={{ maxWidth: 280, margin: "0 auto" }}
          onClick={() => router.push("/painel/consultas")}>
          Ver Minhas Consultas →
        </button>
      </div>
    );
  }

  const metodos = [
    { key: "pix",    icon: "⚡", title: "Pix",     sub: "Aprovação instantânea"  },
    { key: "cartao", icon: "💳", title: "Cartão",  sub: "Crédito em até 3x"      },
    { key: "boleto", icon: "📄", title: "Boleto",  sub: "Vence em 3 dias úteis"  },
  ];

  return (
    <YStack gap="$4">
      {/* Resumo */}
      <div className="pg-card">
        <span className="pg-section-label">Detalhes da Consulta</span>
        <div className="pg-resumo-row">
          <span>📅</span>
          <span className="pg-resumo-text"><strong>{formatDate(consulta.data)}</strong> às {consulta.horario} · {consulta.tipo}</span>
        </div>
        <div className="pg-resumo-row">
          <span>{consulta.especialidade.icon}</span>
          <span className="pg-resumo-text">{consulta.especialidade.nome}</span>
        </div>
        {consulta.tipo === "Presencial" && consulta.clinica && (
          <div className="pg-resumo-row">
            <span>📍</span>
            <span className="pg-resumo-text">{consulta.clinica.nome} · {consulta.clinica.cidade}/{consulta.clinica.uf}</span>
          </div>
        )}
        <div className="pg-resumo-row">
          <span>💳</span>
          <span className="pg-resumo-text">{consulta.convenio ? consulta.convenio.nome : <span style={{ color: "#52525b" }}>Particular</span>}</span>
        </div>
      </div>

      {/* Valor */}
      <div className="pg-valor-block">
        <div>
          <span className="pg-section-label" style={{ marginBottom: 4 }}>Valor da Consulta</span>
          <div className="pg-valor-price">R$ {valorFinal.toFixed(2).replace(".", ",")}</div>
          {temConvenio && <div className="pg-valor-note">✓ 30% coberto pelo {consulta.convenio!.nome}</div>}
        </div>
        <span style={{ fontSize: 40 }}>💰</span>
      </div>

      {/* Forma de pagamento */}
      <div className="pg-card">
        <span className="pg-section-label">Forma de Pagamento</span>
        <div className="pg-metodo-grid" style={{ marginBottom: 20 }}>
          {metodos.map(m => (
            <div
              key={m.key}
              id={`metodo-${m.key}`}
              className={`pg-metodo-card${metodo === m.key ? " active" : ""}`}
              onClick={() => { setMetodo(m.key as any); setCopied(false); }}
            >
              <div className="pg-metodo-check">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div className="pg-metodo-icon">{m.icon}</div>
              <div className="pg-metodo-title">{m.title}</div>
              <div className="pg-metodo-sub">{m.sub}</div>
            </div>
          ))}
        </div>

        {metodo === "pix"    && <PixBlock    copied={copied} onCopy={() => handleCopy(PIX_CODE)} />}
        {metodo === "cartao" && <CardBlock   cardData={cardData} onChange={changeCard} />}
        {metodo === "boleto" && <BoletoBlock copied={copied} onCopy={() => handleCopy(BOLETO_CODE)} />}
      </div>

      {/* Botões */}
      <XStack gap="$3" flexDirection="column" $gtSm={{ flexDirection: "row" }}>
        <button className="pg-btn-ghost" onClick={() => router.back()} style={{ flex: 1 }}>
          ← Cancelar
        </button>
        <button
          id="btn-pagar-consulta"
          className="pg-btn-pay"
          disabled={!canPay || paying}
          onClick={pagar}
          style={{ flex: 2 }}
        >
          {paying ? (
            <>
              <svg className="pg-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 2a10 10 0 0 1 10 10" />
              </svg>
              Processando…
            </>
          ) : (
            <>💳 Pagar R$ {valorFinal.toFixed(2).replace(".", ",")}</>
          )}
        </button>
      </XStack>
    </YStack>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PagamentoPage() {
  const router = useRouter();
  return (
    <>
      <style>{STYLES}</style>
      <ScrollView flex={1} backgroundColor="$background" showsVerticalScrollIndicator={false}>
        <YStack
          padding="$4" $gtSm={{ padding: "$6" }}
          maxWidth={600} marginHorizontal="auto" width="100%"
          gap="$5" className="pg-page"
        >
          {/* Header */}
          <XStack alignItems="center" gap="$3">
            <button
              onClick={() => router.back()}
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#a1a1aa", flexShrink: 0, transition: "all 0.15s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#10b981"; (e.currentTarget as HTMLButtonElement).style.color = "#10b981"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.1)"; (e.currentTarget as HTMLButtonElement).style.color = "#a1a1aa"; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
              </svg>
            </button>
            <YStack flex={1}>
              <H2 color="$color12" size="$6" fontWeight="bold">Pagamento</H2>
              <Text color="$color11" fontSize={13}>Finalize o pagamento para confirmar sua consulta</Text>
            </YStack>
          </XStack>

          <Suspense fallback={<Text color="$color11">Carregando...</Text>}>
            <PagamentoInner />
          </Suspense>
        </YStack>
      </ScrollView>
    </>
  );
}
