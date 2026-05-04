//@ts-nocheck
"use client";

import React, { useState, useRef, useEffect } from "react";
import { ScrollView, YStack, XStack, H2, Text, Card, Separator, Circle } from "tamagui";

/* ── Chart data ─────────────────────────────────────────────────────────── */
const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const valores = [6200, 7800, 9100, 5400, 7200, 8600, 10300, 11200, 12800, 16000, 13500, 12530];
const maxVal = 20000;

const IconChevronDown = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>;
const IconCheck = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;

/* ── SVG Line Chart ─────────────────────────────────────────────────────── */
function LineChart() {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; val: number; mes: string } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const W = 800; const H = 260;
  const PAD = { top: 20, right: 20, bottom: 40, left: 56 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const scaleX = (i: number) => PAD.left + (i / (valores.length - 1)) * chartW;
  const scaleY = (v: number) => PAD.top + chartH - (v / maxVal) * chartH;

  const yTicks = [0, 5000, 10000, 15000, 20000];

  const points = valores.map((v, i) => `${scaleX(i)},${scaleY(v)}`).join(" ");
  const linePath = `M ${points.split(" ").join(" L ")}`;
  const areaPath = `M ${scaleX(0)},${scaleY(0)} L ${points.split(" ").join(" L ")} L ${scaleX(valores.length - 1)},${scaleY(0)} Z`;

  return (
    <div style={{ position: "relative", width: "100%", overflowX: "auto" }}>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} style={{ display: "block", width: "100%", minWidth: 600 }}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#10b981" stopOpacity="0.18"/>
            <stop offset="100%" stopColor="#10b981" stopOpacity="0"/>
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {yTicks.map(t => (
          <g key={t}>
            <line x1={PAD.left} y1={scaleY(t)} x2={W - PAD.right} y2={scaleY(t)} stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray={t === 0 ? "0" : "4 4"} />
            <text x={PAD.left - 8} y={scaleY(t) + 4} textAnchor="end" fontSize="11" fill="#52525b">{t === 0 ? "R$0" : `R$${t / 1000}K`}</text>
          </g>
        ))}

        {meses.map((m, i) => (
          <text key={m} x={scaleX(i)} y={H - PAD.bottom + 18} textAnchor="middle" fontSize="11" fill="#52525b">{m}</text>
        ))}

        <path d={areaPath} fill="url(#areaGrad)" />
        <path d={linePath} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)" />

        {valores.map((v, i) => (
          <g key={i}>
            <circle cx={scaleX(i)} cy={scaleY(v)} r="5" fill="#141414" stroke="#10b981" strokeWidth="2.5" style={{ cursor: "crosshair" }} onMouseEnter={() => setTooltip({ x: scaleX(i), y: scaleY(v), val: v, mes: meses[i] })} onMouseLeave={() => setTooltip(null)} />
            <circle cx={scaleX(i)} cy={scaleY(v)} r="14" fill="transparent" style={{ cursor: "crosshair" }} onMouseEnter={() => setTooltip({ x: scaleX(i), y: scaleY(v), val: v, mes: meses[i] })} onMouseLeave={() => setTooltip(null)} />
          </g>
        ))}

        {tooltip && (() => {
          const tx = tooltip.x > W * 0.75 ? tooltip.x - 120 : tooltip.x + 12;
          const ty = tooltip.y < PAD.top + 30 ? tooltip.y + 12 : tooltip.y - 48;
          return (
            <g>
              <line x1={tooltip.x} y1={PAD.top} x2={tooltip.x} y2={H - PAD.bottom} stroke="rgba(16,185,129,0.3)" strokeWidth="1" strokeDasharray="4 4" />
              <rect x={tx} y={ty} width="112" height="38" rx="8" fill="#1e1e1e" stroke="rgba(16,185,129,0.3)" strokeWidth="1"/>
              <text x={tx + 10} y={ty + 14} fontSize="11" fill="#a1a1aa">{tooltip.mes} 2025</text>
              <text x={tx + 10} y={ty + 29} fontSize="13" fontWeight="700" fill="#fafafa">R$ {tooltip.val.toLocaleString("pt-BR")}</text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}

function OpsBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  return (
    <YStack gap="$1" marginBottom="$2">
      <XStack justifyContent="space-between" alignItems="center">
        <Text color="$color11" fontSize={12}>{label}</Text>
        <Text color="$color12" fontSize={12} fontWeight="bold">{count}</Text>
      </XStack>
      <div style={{ height: 6, width: "100%", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${(count / total) * 100}%`, backgroundColor: color }} />
      </div>
    </YStack>
  );
}

function FinCard({ icon, label, value, delta, color }: { icon: React.ReactNode; label: string; value: string; delta: string; color: string }) {
  return (
    <Card cursor="pointer" animation="quick" flex={1} minWidth={200} backgroundColor="$color2" borderWidth={1} borderColor="$borderColor" borderTopWidth={3} borderTopColor={color as any} padding="$4" borderRadius="$4" hoverStyle={{ backgroundColor: "$color3", borderColor: color as any }}>
      <XStack gap="$3" alignItems="center" marginBottom="$3">
        <Circle size="$3" backgroundColor={`${color}20`} color={color as any}>
           {icon}
        </Circle>
        <Text color="$color12" fontSize={14} fontWeight="bold">{label}</Text>
      </XStack>
      <Text color="$color12" fontSize={24} fontWeight="bold">{value}</Text>
      <Text color="$color11" fontSize={12} marginTop="$1">{delta}</Text>
    </Card>
  );
}

export default function RelatoriosPage() {
  const [periodo, setPeriodo] = useState("Janeiro – Dezembro 2025");
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const [isSmall, setIsSmall] = useState(false);

  useEffect(() => {
    const check = () => setIsSmall(window.innerWidth <= 660);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const periodos = [
    "Janeiro – Dezembro 2025", "Janeiro 2025", "Fevereiro 2025", "Março 2025", "Abril 2025", "Maio 2025", "Junho 2025",
    "Julho 2025", "Agosto 2025", "Setembro 2025", "Outubro 2025", "Novembro 2025", "Dezembro 2025",
  ];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <ScrollView flex={1} backgroundColor="$background" showsVerticalScrollIndicator={false}>
      <YStack padding="$4" $gtSm={{ padding: "$6" }} gap="$5" maxWidth={1100} marginHorizontal="auto" width="100%">
        
        {/* Header */}
        <XStack justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap="$4">
          <YStack>
            <H2 color="$color12" size="$6" fontWeight="bold">Relatórios &amp; Analytics</H2>
            <Text color="$color11" fontSize={14}>Business intelligence e visão gerencial completa da plataforma</Text>
          </YStack>

          <div style={{ position: "relative" }} ref={dropRef}>
            <button onClick={() => setDropOpen(o => !o)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 8, backgroundColor: "#1e1e1e", border: "1px solid #3f3f46", color: "#fafafa", cursor: "pointer", fontFamily: "inherit" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              {periodo}
              <div style={{ transition: "transform 0.2s", transform: dropOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                <IconChevronDown />
              </div>
            </button>

            {dropOpen && (
              <div style={{ position: "absolute", top: "100%", right: 0, marginTop: 4, width: 220, backgroundColor: "#141414", border: "1px solid #27272a", borderRadius: 8, zIndex: 50, padding: 4 }}>
                {periodos.map(p => (
                  <button key={p} onClick={() => { setPeriodo(p); setDropOpen(false); }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "8px 12px", background: p === periodo ? "#10b98120" : "transparent", color: p === periodo ? "#10b981" : "#a1a1aa", border: "none", borderRadius: 4, textAlign: "left", cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>
                    {p}
                    {p === periodo && <IconCheck />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </XStack>

        <Separator borderColor="$borderColor" />

        {/* Financial cards */}
        <XStack gap="$4" flexWrap="wrap" style={{ flexDirection: isSmall ? 'column' : 'row' }}>
          <FinCard color="#10b981" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>} label="Faturamento Bruto" value="R$ 12.530,00" delta="↑ 18% vs. mês anterior" />
          <FinCard color="#60a5fa" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>} label="Total Repassado" value="R$ 8.200,00" delta="65% do faturamento" />
          <FinCard color="#facc15" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>} label="Total Pendente" value="R$ 3.800,00" delta="30% do faturamento" />
          <FinCard color="#f43f5e" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>} label="Estornos" value="R$ 300,00" delta="2,4% do faturamento" />
          <FinCard color="#8b5cf6" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>} label="Receita FitMax" value="R$ 530,00" delta="Taxa média: 4,2%" />
        </XStack>

        {/* Main grid */}
        <XStack gap="$4" flexWrap="wrap" alignItems="stretch" style={{ flexDirection: isSmall ? 'column' : 'row' }}>
          {/* Chart */}
          <Card cursor="pointer" animation="quick" flex={2} minWidth={400} backgroundColor="$color2" borderWidth={1} borderColor="$borderColor" padding="$4" borderRadius="$4" hoverStyle={{ backgroundColor: "$color3", borderColor: "$green8" }}>
            <XStack justifyContent="space-between" alignItems="center" marginBottom="$4">
              <YStack>
                <Text color="$color12" fontSize={16} fontWeight="bold">Faturamento Mensal</Text>
                <Text color="$color11" fontSize={13}>Evolução ao longo de 2025</Text>
              </YStack>
              <XStack alignItems="center" gap="$2">
                <Circle size={8} backgroundColor="#10b981" />
                <Text color="$color11" fontSize={12}>Faturamento bruto</Text>
              </XStack>
            </XStack>
            <LineChart />
          </Card>

          {/* Ops column */}
          <YStack flex={1} minWidth={300} gap="$4">
            <Card cursor="pointer" animation="quick" backgroundColor="$color2" borderWidth={1} borderColor="$borderColor" padding="$4" borderRadius="$4" hoverStyle={{ backgroundColor: "$color3", borderColor: "$green8" }}>
              <XStack gap="$2" alignItems="center" marginBottom="$3">
                <Circle size={8} backgroundColor="#6366f1" />
                <Text color="$color12" fontSize={14} fontWeight="bold">Novos Usuários (hoje)</Text>
              </XStack>
              <OpsBar label="Clientes" count={232} total={272} color="#38bdf8" />
              <OpsBar label="Profissionais" count={40} total={272} color="#818cf8" />
              
              <XStack marginTop="$3" gap="$3">
                <YStack flex={1}>
                   <Text color="#38bdf8" fontSize={12} display="flex" alignItems="center" gap={6}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg> Clientes</Text>
                   <Text color="#38bdf8" fontSize={20} fontWeight="bold">232</Text>
                </YStack>
                <YStack flex={1}>
                   <Text color="#818cf8" fontSize={12} display="flex" alignItems="center" gap={6}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> Profs</Text>
                   <Text color="#818cf8" fontSize={20} fontWeight="bold">40</Text>
                </YStack>
              </XStack>
            </Card>

            <Card cursor="pointer" animation="quick" backgroundColor="$color2" borderWidth={1} borderColor="$borderColor" padding="$4" borderRadius="$4" hoverStyle={{ backgroundColor: "$color3", borderColor: "$green8" }}>
              <XStack gap="$2" alignItems="center" marginBottom="$3">
                <Circle size={8} backgroundColor="#10b981" />
                <Text color="$color12" fontSize={14} fontWeight="bold">Consultas (hoje)</Text>
              </XStack>
              <OpsBar label="Realizadas" count={142} total={192} color="#10b981" />
              <OpsBar label="Pendentes" count={30} total={192} color="#fbbf24" />
              <OpsBar label="Canceladas" count={20} total={192} color="#f87171" />
            </Card>
          </YStack>
        </XStack>

      </YStack>
    </ScrollView>
  );
}
