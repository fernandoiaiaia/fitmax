//@ts-nocheck
"use client";

import { useState, useMemo } from "react";
import {
  Card, Avatar, Text, H2, XStack, YStack, ScrollView, Image, Button,
} from "tamagui";

// ─── Mock Data ────────────────────────────────────────────────────────────────

const feedMock = [
  { id: 1,  autor: "Dr. Roberto Alves",    role: "Médico do Esporte",       servico: "Medicina Esportiva",   location: "São Paulo, SP",       distKm: 2,  avatar: "https://picsum.photos/200/200?random=21", image: "/sports_medicine_1776777873933.png",  aspectRatio: 0.85, likes: "Lucas Mendes e 360 outros",      caption: "Protocolos de hipertrofia: Agenda aberta para Novembro! Consultoria médica esportiva presencial e online.",      col: 0 },
  { id: 2,  autor: "Camila Nery",          role: "Personal Trainer",        servico: "Personal Training",    location: "Rio de Janeiro, RJ",  distKm: 15, avatar: "https://picsum.photos/200/200?random=22", image: "https://picsum.photos/600/400?random=32",    aspectRatio: 1.2,  likes: "Você e 210 pessoas",             caption: "Vagas limitadas para o plano trimestral de mobilidade. Agende sua aula experimental!",                           col: 1 },
  { id: 3,  autor: "Dra. Ana Souza",       role: "Nutricionista Clínica",   servico: "Nutrição Clínica",     location: "Belo Horizonte, MG",  distKm: 40, avatar: "https://picsum.photos/200/200?random=23", image: "/nutrition_food_1776777905763.png",           aspectRatio: 1.0,  likes: "Gabriel e 450 outros",           caption: "Plano alimentar personalizado para atletas de rendimento. Agendamentos limitados.",                               col: 2 },
  { id: 4,  autor: "Studio FitCore",       role: "Centro de Pilates",       servico: "Pilates Clínico",      location: "Online",              distKm: 0,  avatar: "https://picsum.photos/200/200?random=24", image: "/fitness_yoga_1776776568182.png",             aspectRatio: 0.9,  likes: "Dr. Roberto e 124 outros",       caption: "Fortalecimento do core e correção postural. Pacotes mensais imperdíveis. Reserve o seu.",                        col: 0 },
  { id: 5,  autor: "Bruno Silva",          role: "Coach de Crossfit",       servico: "Crossfit",             location: "Curitiba, PR",        distKm: 8,  avatar: "https://picsum.photos/200/200?random=25", image: "/crossfit_class_1776777890905.png",           aspectRatio: 0.8,  likes: "Camila e 89 outros",             caption: "Aulas experimentais gratuitas sexta-feira! Venha conhecer nossos pacotes e coachs credenciados.",                col: 1 },
  { id: 6,  autor: "Lucas Mendes",         role: "Fisioterapeuta",          servico: "Fisioterapia",         location: "Florianópolis, SC",   distKm: 3,  avatar: "https://picsum.photos/200/200?random=26", image: "/physiotherapy_1776777920485.png",            aspectRatio: 1.25, likes: "Dra. Ana e 45 outros",           caption: "Sessões de liberação miofascial e recovery pós-treino intenso. Marque a sua sessão!",                            col: 2 },
  { id: 7,  autor: "Dra. Letícia Marques", role: "Endocrinologista",        servico: "Endocrinologia",       location: "Campinas, SP",        distKm: 25, avatar: "https://picsum.photos/200/200?random=50", image: "https://picsum.photos/500/600?random=51",    aspectRatio: 0.83, likes: "Bruno Silva e 512 outros",       caption: "Avaliação individual com longo acompanhamento laboratorial. Agende já!",                                         col: 0 },
  { id: 8,  autor: "Marcelo Strong",       role: "Fisiculturista PRO",      servico: "Assessoria Esportiva", location: "Goiânia, GO",         distKm: 60, avatar: "https://picsum.photos/200/200?random=52", image: "https://picsum.photos/600/500?random=53",    aspectRatio: 1.2,  likes: "Camila Nery e 1.2k outros",     caption: "Mentoria e planilhas exclusivas na preparação pro calendário de competições. Vagas abertas.",                    col: 1 },
  { id: 9,  autor: "FitNutrition LTDA",   role: "Suplementação",           servico: "Suplementação",        location: "São Paulo, SP",       distKm: 5,  avatar: "https://picsum.photos/200/200?random=54", image: "https://picsum.photos/400/400?random=55",    aspectRatio: 1.0,  likes: "Dr. Roberto e 890 outros",       caption: "Mega Promoção: nova linha Premium Whey Isolado com coqueteleira e frete grátis!",                                col: 2 },
  { id: 10, autor: "Clínica OrtoFit",     role: "Ortopedia Esportiva",     servico: "Ortopedia",            location: "Rio de Janeiro, RJ",  distKm: 18, avatar: "https://picsum.photos/200/200?random=56", image: "https://picsum.photos/500/700?random=57",    aspectRatio: 0.71, likes: "Lucas Mendes e 340 outros",      caption: "Equipe especializada em fisioterapia ortopédica esportiva para te trazer de volta ao jogo.",                     col: 0 },
  { id: 11, autor: "Julia Runners",       role: "Coach de Corrida",        servico: "Corrida",              location: "Porto Alegre, RS",    distKm: 50, avatar: "https://picsum.photos/200/200?random=58", image: "https://picsum.photos/500/400?random=59",    aspectRatio: 1.25, likes: "Você e 180 outros",              caption: "Programa Do 5k à Maratona! Planilhas de corrida 100% online com supervisão.",                                    col: 1 },
  { id: 12, autor: "Dr. Vinícius Almeida",role: "Nutrólogo",               servico: "Nutrologia",           location: "Brasília, DF",        distKm: 35, avatar: "https://picsum.photos/200/200?random=60", image: "https://picsum.photos/400/400?random=61",    aspectRatio: 1.0,  likes: "Dra. Ana Souza e 560 outros",    caption: "Descubra os protocolos para melhoria radical do sono e do rendimento!",                                          col: 2 },
];

const CATEGORY_FILTERS = ["Todos", "Profissionais", "Serviços", "Próximos a mim"];
const PROXIMITY_OPTIONS = [
  { label: "Qualquer distância", value: 9999 },
  { label: "Até 5 km",           value: 5 },
  { label: "Até 10 km",          value: 10 },
  { label: "Até 25 km",          value: 25 },
  { label: "Até 50 km",          value: 50 },
  { label: "Online",             value: 0 },
];

// ─── Icons ────────────────────────────────────────────────────────────────────

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const MapPinIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
);

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FeedPage() {
  const [activeFilter, setActiveFilter] = useState("Todos");
  const [search, setSearch] = useState("");

  // ── Filtering logic
  const filtered = useMemo(() => {
    return feedMock.filter((post) => {
      // Busca unificada: serviço, autor, role e descrição
      if (search) {
        const q = search.toLowerCase();
        const match =
          post.servico.toLowerCase().includes(q) ||
          post.role.toLowerCase().includes(q) ||
          post.autor.toLowerCase().includes(q) ||
          post.caption.toLowerCase().includes(q);
        if (!match) return false;
      }
      // Category pills
      if (activeFilter === "Próximos a mim") {
        if (post.location !== "Online" && post.distKm > 10) return false;
      } else if (activeFilter === "Profissionais") {
        if (["Suplementação"].includes(post.servico)) return false;
      } else if (activeFilter === "Serviços") {
        if (!["Suplementação", "Pilates Clínico", "Crossfit"].includes(post.servico)) return false;
      }
      return true;
    });
  }, [search, activeFilter]);

  // Masonry columns — redistribute filtered posts dynamically to avoid empty columns
  const columns: (typeof filtered)[] = [[], [], []];
  filtered.forEach((post, i) => columns[i % 3].push(post));

  const hasSearch = !!search;

  const inputBase: React.CSSProperties = {
    background: "transparent",
    border: "none",
    outline: "none",
    color: "var(--color12, #fff)",
    fontSize: 15,
    flex: 1,
    minWidth: 0,
    padding: 0,
  };

  return (
    <ScrollView flex={1} backgroundColor="$background" showsVerticalScrollIndicator={false}>
      <YStack padding="$4" $gtSm={{ padding: "$6" }} gap="$5" maxWidth={1200} marginHorizontal="auto" flex={1} width="100%">

        <H2 color="$color12" size="$6" fontWeight="bold">Explorar</H2>

        {/* ── Barra de Busca Unificada ── */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "var(--color2, #1a1a1a)",
          border: "1px solid var(--borderColor, #333)",
          borderRadius: 14,
          padding: "0 16px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
          minHeight: 52,
        }}>
          <span style={{ color: "#10b981", flexShrink: 0, display: "flex" }}><SearchIcon /></span>
          <input
            style={inputBase}
            placeholder="Buscar por serviço, profissional ou palavra-chave..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#71717a", display: "flex", padding: 2, flexShrink: 0 }}
            >
              <CloseIcon />
            </button>
          )}
        </div>

        {/* ── Category Filter (Responsivo) ── */}

        {/* Mobile: Dropdown select */}
        <div style={{ display: "none" }} className="feed-filter-mobile">
          <select
            value={activeFilter}
            onChange={e => setActiveFilter(e.target.value)}
            style={{
              width: "100%",
              background: "var(--color2, #1a1a1a)",
              border: "1px solid rgba(16,185,129,0.4)",
              borderRadius: 12,
              padding: "12px 16px",
              color: "#10b981",
              fontSize: 14,
              fontWeight: "bold",
              fontFamily: "inherit",
              outline: "none",
              cursor: "pointer",
              appearance: "none",
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2310b981' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 14px center",
              paddingRight: 40,
            }}
          >
            {CATEGORY_FILTERS.map(f => (
              <option key={f} value={f} style={{ background: "#111", color: "#fff" }}>{f}</option>
            ))}
          </select>
        </div>

        {/* Desktop: Pills */}
        <div className="feed-filter-desktop">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <XStack gap="$3" paddingBottom="$2">
              {CATEGORY_FILTERS.map((f) => {
                const isActive = activeFilter === f;
                return (
                  <Button key={f} size="$3" borderRadius="$10" borderWidth={1}
                    animation="quick"
                    borderColor={isActive ? "$green8" : "$borderColor"}
                    backgroundColor={isActive ? "rgba(16,185,129,0.1)" : "transparent"}
                    onPress={() => setActiveFilter(f)}
                    hoverStyle={{ backgroundColor: isActive ? "rgba(16,185,129,0.15)" : "$color3", borderColor: "$green8" }}
                    pressStyle={{ scale: 0.97 }}
                    paddingHorizontal="$4"
                  >
                    <Text fontWeight={isActive ? "bold" : "400"} color={isActive ? "#10b981" : "$color11"}>
                      {f}
                    </Text>
                  </Button>
                );
              })}
            </XStack>
          </ScrollView>
        </div>

        <style>{`
          @media (max-width: 640px) {
            .feed-filter-mobile { display: block !important; }
            .feed-filter-desktop { display: none !important; }
          }
        `}</style>

        {/* ── Resultado / Título ── */}
        <XStack justifyContent="space-between" alignItems="center">
          <H2 color="$color12" size="$5" fontWeight="bold">
            {hasSearch ? `${filtered.length} resultado${filtered.length !== 1 ? "s" : ""} encontrado${filtered.length !== 1 ? "s" : ""}` : "Tendências"}
          </H2>
        </XStack>

        {/* ── Masonry Feed ── */}
        {filtered.length === 0 ? (
          <YStack alignItems="center" paddingVertical="$10" gap="$3">
            <Text fontSize={40}>🔍</Text>
            <Text color="$color11" fontSize={15}>Nenhum resultado encontrado.</Text>
            <Text color="$color10" fontSize={13}>Tente outros termos ou ajuste a distância.</Text>
          </YStack>
        ) : (
          <XStack gap="$4" alignItems="flex-start" flexWrap="wrap" $gtSm={{ flexWrap: "nowrap" }}>
            {columns.map((col, colIndex) => (
              <YStack key={colIndex} gap="$4" flex={1} minWidth={280}>
                {col.map((post) => (
                  <Card cursor="pointer" animation="quick" key={post.id} width="100%" borderWidth={1}
                    backgroundColor="$color2" borderColor="$borderColor" borderRadius="$6" overflow="hidden"
                    hoverStyle={{ backgroundColor: "$color3", borderColor: "$green8" }}
                  >
                    <Card.Header padding="$3">
                      <XStack justifyContent="space-between" alignItems="center">
                        <XStack gap="$3" alignItems="center">
                          <Avatar circular size="$3" backgroundColor="$color4">
                            <Avatar.Image src={post.avatar} />
                          </Avatar>
                          <YStack>
                            <XStack alignItems="center" gap="$2">
                              <Text color="$color12" fontSize={14} fontWeight="bold">{post.autor}</Text>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="#10b981" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#10b981" />
                              </svg>
                            </XStack>
                            <XStack alignItems="center" gap="$1">
                              <Text color="$color11" fontSize={11}>{post.role}</Text>
                              <Text color="$color10" fontSize={11}> • </Text>
                              <span style={{ color: post.location === "Online" ? "#10b981" : "#60a5fa" }}>
                                <MapPinIcon />
                              </span>
                              <Text color={post.location === "Online" ? "#10b981" : "#60a5fa"} fontSize={11}>
                                {post.location === "Online" ? "Online" : `${post.distKm} km`}
                              </Text>
                            </XStack>
                          </YStack>
                        </XStack>
                        <Text color="$color11" fontSize={16} fontWeight="bold" cursor="pointer" padding="$2">···</Text>
                      </XStack>
                    </Card.Header>

                    <YStack width="100%" aspectRatio={post.aspectRatio} backgroundColor="$color3">
                      <Image src={post.image} width="100%" height="100%" objectFit="cover" />
                    </YStack>

                    <YStack padding="$3" gap="$2">
                      <XStack justifyContent="space-between" alignItems="center" marginBottom="$1">
                        <XStack gap="$4">
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fafafa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fafafa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fafafa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>
                        </XStack>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fafafa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
                      </XStack>

                      <XStack alignItems="center" gap="$2">
                        <XStack marginLeft={5}>
                          {[41, 42, 43].map((n, i) => (
                            <Avatar key={n} circular size={20} backgroundColor="$color4" borderWidth={1} borderColor="$color2" marginLeft={i === 0 ? 0 : -10} zIndex={3 - i}>
                              <Avatar.Image src={`https://picsum.photos/200/200?random=${n}`} />
                            </Avatar>
                          ))}
                        </XStack>
                        <Text color="$color12" fontSize={12} fontWeight="bold">Curtido por {post.likes}</Text>
                      </XStack>

                      {/* Tag de serviço */}
                      <XStack>
                        <div style={{
                          fontSize: 10, fontWeight: 700, color: "#10b981",
                          background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)",
                          borderRadius: 20, padding: "2px 10px", display: "inline-block",
                        }}>
                          {post.servico}
                        </div>
                      </XStack>

                      <Text color="$color11" fontSize={13} marginTop="$1">
                        {post.caption} <Text color="$color12" fontWeight="bold">...mais</Text>
                      </Text>
                    </YStack>
                  </Card>
                ))}
              </YStack>
            ))}
          </XStack>
        )}

      </YStack>
    </ScrollView>
  );
}
