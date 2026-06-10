import type { Metadata } from "next";
import { cookies } from "next/headers";
import EventCalendar from "./components/EventCalendar";
import { loadEventsData } from "./lib/loadEventsData";
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

export default async function HomePage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("lang")?.value ?? "ko") as Lang;
  const t = translations[lang];
  const eventsData = loadEventsData();

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

      {/* Event Calendar */}
      <section className="w-full px-4 md:px-6 py-10 md:py-14">
        <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6 md:mb-8">
          {t.home.eventCalendar}
        </h2>
        <EventCalendar
          lang={lang}
          events={eventsData.events}
          labels={{
            title: t.home.eventCalendar,
            upcoming: t.home.upcomingEvents,
            noEvents: t.home.noEvents,
            ongoing: t.home.ongoing,
            scheduleDisclaimer: t.home.scheduleDisclaimer,
            weekdays: t.home.weekdays,
            months: t.home.months,
          }}
        />
      </section>

      {/* Latest News */}
      <section className="w-full px-4 md:px-6 py-10 md:py-14 bg-slate-50 dark:bg-slate-900/50">
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
    </main>
  );
}
