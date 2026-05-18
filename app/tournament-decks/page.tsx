import { Metadata } from "next";
import { readFileSync } from "fs";
import { join } from "path";
import TournamentDeckList from "./TournamentDeckList";
import { auth } from "@/auth";

import { cookies } from "next/headers";
import { translations, type Lang } from "../i18n/translations";
import { SITE_URL } from "../lib/constants";

export const metadata: Metadata = {
  title: "토너먼트 덱 | Tournament Decks",
  description:
    "Pokémon Pocket TCG 토너먼트에서 사용된 상위 덱 리스트를 확인하세요. 최근 토너먼트에서 좋은 성적을 거둔 덱 아키타입과 카드 구성을 살펴보세요. PTCGP tournament meta decks, archetypes, and matchups.",
  keywords: [
    "포켓몬 포켓 토너먼트 덱",
    "포켓몬 포켓 메타",
    "포켓몬 포켓 덱 리스트",
    "pokemon pocket tournament decks",
    "pokemon tcg pocket meta",
    "pokemon pocket deck tier list",
    "PTCGP tournament",
    "pokemon pocket best decks",
    "ポケポケ トーナメントデッキ",
    "ポケポケ メタ",
    "ポケポケ デッキリスト",
    "ポケポケ デッキ Tier",
    "ポケポケ 最強デッキ",
    "ポケポケ 大会デッキ",
    "ポケモンTCGポケット メタ",
    "ポケポケ デッキメタ",
    "ポケポケ 勝率",
    "ポケポケ おすすめデッキ",
  ],
  openGraph: {
    title: "토너먼트 덱 | Pokemon TCG Pocket Tournament Decks",
    description:
      "최근 토너먼트에서 상위 덱 리스트와 매치업 데이터를 확인하세요.",
    url: `${SITE_URL}/tournament-decks`,
    type: "website",
  },
  alternates: {
    canonical: `${SITE_URL}/tournament-decks`,
  },
};

interface CardItem {
  count: number;
  id: string;
  name: string;
  koName: string | null;
  enName: string | null;
  image: string;
  numericId: number | null;
  expansion: string | null;
  hp: number | null;
}

export interface EnrichedDeck {
  name: string;
  displayName: string;
  winRate: number | null;
  totalGames: number | null;
  bestScore: number;
  bestStrength: number;
  popularity: number;
  percentOfGames: number;
  cards: CardItem[];
  energyTypes: string[];
}

interface TournamentDecksJson {
  updatedAt: string;
  decks: Array<
    Omit<EnrichedDeck, "displayName"> & {
      displayNameKo: string;
      displayNameEn: string;
    }
  >;
}

function loadJson<T>(filename: string): T {
  const path = join(process.cwd(), "public", "data", filename);
  const content = readFileSync(path, "utf-8");
  return JSON.parse(content) as T;
}

export default async function TournamentDecksPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("lang")?.value ?? "ko") as Lang;
  const t = translations[lang].tournament;

  const session = await auth();
  const data = loadJson<TournamentDecksJson>("tournament-decks.json");

  const enriched: EnrichedDeck[] = data.decks.map((deck) => ({
    ...deck,
    displayName: lang === "ko" ? deck.displayNameKo : deck.displayNameEn,
  }));

  const topDecks = enriched.slice(0, 5);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name:
      lang === "en"
        ? "Pokémon Pocket Tournament Deck List"
        : "포켓몬 포켓 토너먼트 덱 리스트",
    itemListElement: topDecks.map((deck, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: deck.displayName,
      description:
        lang === "en"
          ? `Win rate ${deck.winRate ?? "-"}% · ${deck.totalGames ?? "-"} games · Popularity ${(deck.popularity * 100).toFixed(1)}%`
          : `승률 ${deck.winRate ?? "-"}% · ${deck.totalGames ?? "-"}경기 · 인기도 ${(deck.popularity * 100).toFixed(1)}%`,
    })),
  };

  return (
    <main className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="flex flex-col gap-4 p-4 md:p-6 min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
          {t.pageTitle}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {t.subtitle}
        </p>

        <TournamentDeckList decks={enriched} session={session} />

        <div className="text-center text-[10px] text-slate-400 dark:text-slate-500 mt-2">
          <a
            href="https://play.limitlesstcg.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-600 dark:hover:text-slate-300 underline underline-offset-2"
          >
            {t.source}
          </a>
        </div>
      </div>
    </main>
  );
}
