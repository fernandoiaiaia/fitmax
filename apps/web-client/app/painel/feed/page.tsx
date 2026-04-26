"use client";

import { useState } from "react";

const feedMock = [
  { id: 1, autor: "Dr. Roberto Alves", role: "Médico do Esporte", location: "São Paulo, SP", avatar: "https://picsum.photos/200/200?random=21", image: "/sports_medicine_1776777873933.png", aspectRatio: 0.85, likes: "Lucas Mendes e 360 outros", caption: "Protocolos de hipertrofia: Agenda aberta para Novembro! Consultoria médica esportiva presencial e online. Link na bio! 🏋️‍♂️", col: 0 },
  { id: 2, autor: "Camila Nery", role: "Personal Trainer", location: "Rio de Janeiro, RJ", avatar: "https://picsum.photos/200/200?random=22", image: "https://picsum.photos/600/400?random=32", aspectRatio: 1.2, likes: "Você e 210 pessoas", caption: "Personal Training: Vagas limitadas para o plano trimestral de mobilidade. Agende sua aula experimental! 🔥", col: 1 },
  { id: 3, autor: "Dra. Ana Souza", role: "Nutricionista Clínica", location: "Belo Horizonte, MG", avatar: "https://picsum.photos/200/200?random=23", image: "/nutrition_food_1776777905763.png", aspectRatio: 1.0, likes: "Gabriel e 450 outros", caption: "Atendimento Nutricional Clínico: Plano alimentar personalizado para atletas de rendimento. Agendamentos limitados 🥑", col: 2 },
  { id: 4, autor: "Studio FitCore", role: "Centro de Pilates", location: "Online", avatar: "https://picsum.photos/200/200?random=24", image: "/fitness_yoga_1776776568182.png", aspectRatio: 0.9, likes: "Dr. Roberto e 124 outros", caption: "Aulas de Pilates Clínico: Fortalecimento do core e correção postural. Pacotes mensais imperdíveis. Reserve o seu ✨", col: 0 },
  { id: 5, autor: "Bruno Silva", role: "Coach de Crossfit", location: "Curitiba, PR", avatar: "https://picsum.photos/200/200?random=25", image: "/crossfit_class_1776777890905.png", aspectRatio: 0.8, likes: "Camila e 89 outros", caption: "Box Crossfit Elite: Aulas experimentais gratuitas sexta-feira! Venha conhecer nossos pacotes e coachs credenciados. 💧", col: 1 },
  { id: 6, autor: "Lucas Mendes", role: "Fisioterapeuta", location: "Florianópolis, SC", avatar: "https://picsum.photos/200/200?random=26", image: "/physiotherapy_1776777920485.png", aspectRatio: 1.25, likes: "Dra. Ana e 45 outros", caption: "Fisioterapia Desportiva: Sessões de liberação miofascial e recovery pós-treino intenso da maratona. Marque a sua sessão! 🛠️", col: 2 },
  { id: 7, autor: "Dra. Letícia Marques", role: "Endocrinologista", location: "Campinas, SP", avatar: "https://picsum.photos/200/200?random=50", image: "https://picsum.photos/500/600?random=51", aspectRatio: 0.83, likes: "Bruno Silva e 512 outros", caption: "Consultoria em Modulação Hormonal: Avaliação individual com longo acompanhamento laboratorial. Agende já! 🔬", col: 0 },
  { id: 8, autor: "Marcelo Strong", role: "Fisioculturista PRO", location: "Goiânia, GO", avatar: "https://picsum.photos/200/200?random=52", image: "https://picsum.photos/600/500?random=53", aspectRatio: 1.2, likes: "Camila Nery e 1.2k outros", caption: "Assessoria Esportiva PRO: Mentoria e planilhas exclusivas na preparação pro calendário de competições. Vagas abertas 💪 #bodybuilding", col: 1 },
  { id: 9, autor: "FitNutrition LTDA", role: "Suplementação", location: "São Paulo, SP", avatar: "https://picsum.photos/200/200?random=54", image: "https://picsum.photos/400/400?random=55", aspectRatio: 1.0, likes: "Dr. Roberto e 890 outros", caption: "Mega Promoção: Compre a nova linha Premium Whey Isolado e ganhe coqueteleira e frete grátis! Peça pelo aplicativo. 🥤", col: 2 },
  { id: 10, autor: "Clínica OrtoFit", role: "Ortopedia Esportiva", location: "Rio de Janeiro, RJ", avatar: "https://picsum.photos/200/200?random=56", image: "https://picsum.photos/500/700?random=57", aspectRatio: 0.71, likes: "Lucas Mendes e 340 outros", caption: "Tratamento Intensivo LCA: Equipe especializada em fisioterapia ortopédica esportiva para te trazer de volta ao jogo. Entre em contato! 🦴", col: 0 },
  { id: 11, autor: "Julia Runners", role: "Coach de Corrida", location: "Porto Alegre, RS", avatar: "https://picsum.photos/200/200?random=58", image: "https://picsum.photos/500/400?random=59", aspectRatio: 1.25, likes: "Você e 180 outros", caption: "Programa Do 5k à Maratona! Planilhas de corrida 100% online com supervisão. Entre para o time e bata o seu RP! 🏃‍♀️🏅", col: 1 },
  { id: 12, autor: "Dr. Vinícius Almeida", role: "Nutrólogo", location: "Brasília, DF", avatar: "https://picsum.photos/200/200?random=60", image: "https://picsum.photos/400/400?random=61", aspectRatio: 1.0, likes: "Dra. Ana Souza e 560 outros", caption: "Avaliação Nutrológica: Descubra e inicie os protocolos para melhoria radical do sono e do rendimento! Sessões diárias limitadas 💤", col: 2 },
];

const filters = ["Todos", "Profissionais", "Serviços", "Próximos a mim"];

export default function FeedPage() {
  const [activeFilter, setActiveFilter] = useState("Todos");

  const col0 = feedMock.filter((f) => f.col === 0);
  const col1 = feedMock.filter((f) => f.col === 1);
  const col2 = feedMock.filter((f) => f.col === 2);
  const columns = [col0, col1, col2];

  return (
    <div className="flex-1 overflow-auto bg-[#0f0f0f]">
      <div className="px-4 sm:px-6 py-6 flex flex-col gap-6 max-w-[1200px] mx-auto w-full">

        <h2 className="text-white font-bold text-2xl">Explorar</h2>

        {/* Filters */}
        <div className="overflow-x-auto">
          <div className="flex gap-3 pb-2">
            {filters.map((filter) => {
              const isActive = activeFilter === filter;
              return (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={[
                    "px-4 py-2 rounded-full text-sm font-medium border transition-colors whitespace-nowrap",
                    isActive
                      ? "bg-white text-[#0f0f0f] border-transparent font-bold"
                      : "bg-transparent text-white border-[#262626] hover:border-[#444]",
                  ].join(" ")}
                >
                  {filter}
                </button>
              );
            })}
          </div>
        </div>

        <h2 className="text-white font-bold text-2xl mt-2">Tendências</h2>

        {/* Masonry columns */}
        <div className="flex gap-4 items-start flex-wrap sm:flex-nowrap">
          {columns.map((col, colIndex) => (
            <div key={colIndex} className="flex flex-col gap-4 flex-1 min-w-[280px]">
              {col.map((post) => (
                <div key={post.id} className="w-full rounded-2xl border border-[#262626] bg-[#141414] overflow-hidden">

                  {/* Header */}
                  <div className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-[#262626] flex-shrink-0">
                        <img src={post.avatar} className="w-full h-full object-cover" alt={post.autor} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="text-white text-sm font-bold">{post.autor}</span>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="#10b981"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                        </div>
                        <p className="text-[#71717a] text-[11px]">{post.role} • {post.location}</p>
                      </div>
                    </div>
                    <span className="text-[#71717a] text-lg font-bold cursor-pointer px-2">···</span>
                  </div>

                  {/* Image */}
                  <div className="w-full bg-[#262626]" style={{ aspectRatio: post.aspectRatio }}>
                    <img src={post.image} className="w-full h-full object-cover" alt="" />
                  </div>

                  {/* Footer */}
                  <div className="p-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-4">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fafafa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fafafa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fafafa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
                      </div>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fafafa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[41, 42, 43].map((r, i) => (
                          <div key={r} className="w-5 h-5 rounded-full overflow-hidden border border-[#141414] bg-[#262626]" style={{ marginLeft: i > 0 ? -10 : 5, zIndex: 3 - i }}>
                            <img src={`https://picsum.photos/200/200?random=${r}`} className="w-full h-full object-cover" alt="" />
                          </div>
                        ))}
                      </div>
                      <span className="text-white text-xs font-bold">Curtido por {post.likes}</span>
                    </div>

                    <p className="text-[#71717a] text-sm">
                      {post.caption} <span className="text-white font-bold">...mais</span>
                    </p>
                  </div>

                </div>
              ))}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
