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

type ExternalLink = {
  title: string;
  desc: string;
  url: string;
  domain: string;
};

const BOOKMARK_LINKS: Record<Lang, ExternalLink[]> = {
  ko: [
    {
      title: "포켓몬TCG포켓 갤러리",
      desc: "디시인사이드 포켓몬 포켓 마이너 갤러리",
      url: "https://gall.dcinside.com/mgallery/board/lists/?id=pokemontcgpocket",
      domain: "dcinside.com",
    },
    {
      title: "Limitless TCG 덱",
      desc: "글로벌 포켓몬 포켓 덱 리스트",
      url: "https://play.limitlesstcg.com/decks",
      domain: "limitlesstcg.com",
    },
    {
      title: "Serebii 포켓몬 포켓",
      desc: "카드·이벤트·뉴스 종합 정보",
      url: "https://serebii.net/tcgpocket/",
      domain: "serebii.net",
    },
    {
      title: "Pokemon Zone",
      desc: "일정·카드 DB·이벤트 데이터",
      url: "https://www.pokemon-zone.com/",
      domain: "pokemon-zone.com",
    },
    {
      title: "PTCGP Timeline",
      desc: "이벤트·확장팩 타임라인 (한국어 지원)",
      url: "https://ptcgp-timeline.github.io/",
      domain: "ptcgp-timeline.github.io",
    },
    {
      title: "ptcgpocket.gg",
      desc: "이벤트 가이드·미션·보상 정리",
      url: "https://ptcgpocket.gg/",
      domain: "ptcgpocket.gg",
    },
    {
      title: "r/PTCGPocket",
      desc: "Reddit 글로벌 커뮤니티",
      url: "https://www.reddit.com/r/PTCGPocket/",
      domain: "reddit.com",
    },
  ],
  en: [
    {
      title: "Pokémon TCG Pocket Gallery",
      desc: "DC Inside community gallery",
      url: "https://gall.dcinside.com/mgallery/board/lists/?id=pokemontcgpocket",
      domain: "dcinside.com",
    },
    {
      title: "Limitless TCG Decks",
      desc: "Browse global Pokémon TCG Pocket decks",
      url: "https://play.limitlesstcg.com/decks",
      domain: "limitlesstcg.com",
    },
    {
      title: "Serebii Pokémon TCG Pocket",
      desc: "Cards, events, and news hub",
      url: "https://serebii.net/tcgpocket/",
      domain: "serebii.net",
    },
    {
      title: "Pokemon Zone",
      desc: "Schedule, card database, and event data",
      url: "https://www.pokemon-zone.com/",
      domain: "pokemon-zone.com",
    },
    {
      title: "PTCGP Timeline",
      desc: "Visual event and expansion timeline",
      url: "https://ptcgp-timeline.github.io/",
      domain: "ptcgp-timeline.github.io",
    },
    {
      title: "ptcgpocket.gg",
      desc: "Event guides, missions, and rewards",
      url: "https://ptcgpocket.gg/",
      domain: "ptcgpocket.gg",
    },
    {
      title: "r/PTCGPocket",
      desc: "Global Reddit community",
      url: "https://www.reddit.com/r/PTCGPocket/",
      domain: "reddit.com",
    },
  ],
};

const OFFICIAL_LINKS: Record<Lang, ExternalLink[]> = {
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

function ExternalLinkGrid({
  items,
  viewMoreLabel,
}: {
  items: ExternalLink[];
  viewMoreLabel: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-6">
      {items.map((item) => (
        <a
          key={item.url}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex flex-col rounded-xl border border-slate-200 bg-white p-5 transition-all hover:border-indigo-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-indigo-700"
        >
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:bg-slate-700 dark:text-slate-300">
              {item.domain}
            </span>
          </div>
          <h3 className="mb-1 text-sm font-semibold text-slate-800 transition-colors group-hover:text-indigo-600 dark:text-slate-100 dark:group-hover:text-indigo-400 md:text-base">
            {item.title}
          </h3>
          <p className="mb-4 flex-1 text-xs text-slate-500 dark:text-slate-400">
            {item.desc}
          </p>
          <span className="inline-flex items-center text-xs font-medium text-indigo-600 group-hover:underline dark:text-indigo-400">
            {viewMoreLabel}
            <svg
              className="ml-1 h-3.5 w-3.5"
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
  );
}

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
      <section className="w-full px-4 py-10 md:px-6 md:py-12">
        <h2 className="mx-auto mb-5 max-w-[1200px] text-xl font-bold text-slate-800 dark:text-slate-100 md:mb-6 md:text-2xl">
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

      {/* Bookmarks */}
      <section className="w-full bg-slate-50 px-4 py-10 dark:bg-slate-900/50 md:px-6 md:py-14">
        <h2 className="mb-6 text-xl font-bold text-slate-800 dark:text-slate-100 md:mb-8 md:text-2xl">
          {t.home.bookmarks}
        </h2>
        <ExternalLinkGrid
          items={[...OFFICIAL_LINKS[lang], ...BOOKMARK_LINKS[lang]]}
          viewMoreLabel={t.home.viewMore}
        />
      </section>
    </main>
  );
}
