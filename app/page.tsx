import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { translations, Lang } from "./i18n/translations";
import { SITE_URL } from "./lib/constants";

export const metadata: Metadata = {
  title: "PPCardList — Pokémon TCG Pocket Tools",
  description:
    "포켓몬 포켓 카드 리스트, 덱 빌더, 토너먼트 덱. 최신 공식 소식과 함께 포켓몬 포켓의 모든 것을 확인하세요. ポケポケの全カードリスト・デッキビルダー・トーナメントデッキ・公式ニュース。 Complete Pokemon TCG Pocket card list, deck builder, tournament decks and official news.",
  keywords: [
    "포켓몬 포켓",
    "포켓몬 포켓 카드",
    "포켓몬 포켓 덱",
    "포켓몬 포켓 토너먼트",
    "포켓몬 포켓 뉴스",
    "pokemon tcg pocket",
    "pokemon pocket cards",
    "pokemon pocket deck builder",
    "pokemon pocket tournament decks",
    "pokemon pocket news",
    "ポケポケ",
    "ポケポケ カード",
    "ポケポケ デッキ",
    "ポケポケ ニュース",
    "PTCGP",
  ],
  openGraph: {
    title: "PPCardList — Pokémon TCG Pocket Tools",
    description:
      "포켓몬 포켓 카드 리스트, 덱 빌더, 토너먼트 덱, 최신 소식. ポケポケの全カードリスト・デッキビルダー・トーナメントデッキ。 Complete Pokemon TCG Pocket tools.",
    url: SITE_URL,
    type: "website",
    images: [
      {
        url: "/etc/card_case.png",
        width: 1200,
        height: 630,
        alt: "PPCardList",
      },
    ],
  },
  alternates: {
    canonical: SITE_URL,
  },
};

const OFFICIAL_LINKS: Record<
  Lang,
  { title: string; desc: string; url: string; domain: string }[]
> = {
  ko: [
    {
      title: "공식 포켓몬 포켓 사이트",
      desc: "최신 소식과 업데이트",
      url: "https://tcgpocket.pokemon.com/en-us/",
      domain: "tcgpocket.pokemon.com",
    },
    {
      title: "포켓몬 공식 뉴스",
      desc: "포켓몬 포켓 관련 공식 소식",
      url: "https://www.pokemon.com/us/pokemon-news",
      domain: "pokemon.com",
    },
    {
      title: "포켓몬 커뮤니티 포럼",
      desc: "다른 트레이너들과 소통하기",
      url: "https://community.pokemon.com/en-us/discussions",
      domain: "community.pokemon.com",
    },
  ],
  en: [
    {
      title: "Official Pokémon TCG Pocket",
      desc: "Latest news and updates",
      url: "https://tcgpocket.pokemon.com/en-us/",
      domain: "tcgpocket.pokemon.com",
    },
    {
      title: "Pokémon Official News",
      desc: "Official Pokémon TCG Pocket news",
      url: "https://www.pokemon.com/us/pokemon-news",
      domain: "pokemon.com",
    },
    {
      title: "Pokémon Community Forums",
      desc: "Connect with fellow trainers",
      url: "https://community.pokemon.com/en-us/discussions",
      domain: "community.pokemon.com",
    },
  ],
};

const FEATURES = [
  {
    href: "/cards",
    titleKey: "cardList" as const,
    descKey: "cardListDesc" as const,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
    color:
      "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 border-indigo-100 dark:border-indigo-800",
  },
  {
    href: "/deck-builder",
    titleKey: "deckBuilder" as const,
    descKey: "deckBuilderDesc" as const,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
      </svg>
    ),
    color:
      "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800",
  },
  {
    href: "/tournament-decks",
    titleKey: "tournamentDecks" as const,
    descKey: "tournamentDesc" as const,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
      </svg>
    ),
    color:
      "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-300 border-amber-100 dark:border-amber-800",
  },
];

export default async function HomePage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("lang")?.value ?? "ko") as Lang;
  const t = translations[lang];

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-purple-700 dark:from-indigo-900 dark:to-purple-950 text-white">
        <div className="w-full px-4 md:px-6 py-16 md:py-24 text-center">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            Pokemon Pocket CardList
          </h1>
          <p className="text-base md:text-lg text-indigo-100 dark:text-indigo-200 max-w-xl mx-auto">
            {lang === "ko"
              ? "포켓몬 포켓 카드 리스트, 덱 빌더, 토너먼트 덱. 최신 공식 소식과 함께 포켓몬 포켓의 모든 것을 확인하세요."
              : "Pokemon TCG Pocket card list, deck builder, tournament decks. Everything you need with the latest official news."}
          </p>
        </div>
      </section>

      {/* Latest News */}
      <section className="w-full px-4 md:px-6 py-10 md:py-14">
        <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6 md:mb-8">
          {t.home.latestNews}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {OFFICIAL_LINKS[lang].map((item) => (
            <a
              key={item.url}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  {item.domain}
                </span>
              </div>
              <h3 className="text-sm md:text-base font-semibold text-slate-800 dark:text-slate-100 mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {item.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 flex-1">
                {item.desc}
              </p>
              <span className="inline-flex items-center text-xs font-medium text-indigo-600 dark:text-indigo-400 group-hover:underline">
                {t.home.viewMore}
                <svg
                  className="ml-1 w-3.5 h-3.5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d="M7 17L17 7M17 7H7M17 7v10" />
                </svg>
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="w-full px-4 md:px-6 py-10 md:py-14 bg-slate-50 dark:bg-slate-900/50">
        <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6 md:mb-8">
          {t.home.features}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {FEATURES.map((f) => (
            <Link
              key={f.href}
              href={f.href}
              className={`group flex flex-col rounded-xl border p-6 hover:shadow-md transition-all ${f.color}`}
            >
              <div className="mb-4">{f.icon}</div>
              <h3 className="text-sm md:text-base font-semibold mb-1">
                {t.nav[f.titleKey]}
              </h3>
              <p className="text-xs opacity-80">{t.home[f.descKey]}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
