import { Metadata } from "next";
import { readFileSync } from "fs";
import { join } from "path";
import TournamentDeckList from "./TournamentDeckList";
import * as XLSX from "xlsx";
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

interface BestDeck {
  name: string;
  lists: { cards: string[]; score: number; strength: number }[];
  popularity: number;
  percentOfGames: number;
}

interface MatchupEntry {
  name: string;
  winRate: number;
  totalGames: number;
}

type MatchupData = Record<string, MatchupEntry[]>;

interface RawCard {
  id: string;
  name: string;
  image: string;
}

interface CardItem {
  count: number;
  id: string;
  name: string;
  koName: string | null;
  image: string;
  numericId: number | null;
  expansion: string | null;
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

function formatDeckName(raw: string): string {
  return raw
    .split("&")
    .map((part) => {
      const segments = part.split("-");
      const nameSegments = segments.slice(0, -2);
      const formatted = nameSegments.join(" ");
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    })
    .join(" + ");
}

function loadJson<T>(filename: string): T {
  const path = join(process.cwd(), "public", "data", filename);
  const content = readFileSync(path, "utf-8");
  return JSON.parse(content) as T;
}

const PROMO_BASE = 900000;

function normalizeCardId(id: string): string {
  return id.replace(/^p-([a-z])-/i, "p$1-");
}

function parseCardId_(rawId: string): number {
  const promoMatch = rawId.match(/^Z(\d+)$/i);
  if (promoMatch) return PROMO_BASE + parseInt(promoMatch[1], 10);
  const n = Number(rawId);
  return isNaN(n) ? 0 : n;
}

function extractEnergyTypes(energyStr: string | undefined): string[] {
  if (!energyStr) return [];
  const types: string[] = [];
  const parts = String(energyStr).split("/");
  for (const part of parts) {
    const match = part.match(/^([가-힣a-zA-Z]+)(\d+)$/);
    if (match) {
      const type = match[1];
      if (type !== "무색") {
        types.push(type);
      }
    }
  }
  return types;
}

function loadSerialToIdMap(): Map<string, number> {
  const path = join(process.cwd(), "app", "data", "card_list.xlsx");
  const buf = readFileSync(path);
  const wb = XLSX.read(buf, { type: "buffer" });
  const map = new Map<string, number>();
  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: "" }) as Array<{
      ID: string | number;
      Serial: string;
    }>;
    for (const row of rows) {
      if (row.Serial && row.ID) {
        const numericId = parseCardId_(String(row.ID).trim());
        if (numericId > 0) {
          map.set(String(row.Serial).trim(), numericId);
        }
      }
    }
  }
  return map;
}

function loadSerialToKoNameMap(): Map<string, string> {
  const path = join(process.cwd(), "app", "data", "card_list.xlsx");
  const buf = readFileSync(path);
  const wb = XLSX.read(buf, { type: "buffer" });
  const map = new Map<string, string>();
  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: "" }) as Array<{
      Serial: string;
      이름: string;
    }>;
    for (const row of rows) {
      if (row.Serial && row.이름) {
        map.set(String(row.Serial).trim(), String(row.이름).trim());
      }
    }
  }
  return map;
}

function loadSerialToExpansionMap(): Map<string, string> {
  const path = join(process.cwd(), "app", "data", "card_list.xlsx");
  const buf = readFileSync(path);
  const wb = XLSX.read(buf, { type: "buffer" });
  const map = new Map<string, string>();
  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: "" }) as Array<{
      Serial: string;
      확장팩: string;
    }>;
    for (const row of rows) {
      if (row.Serial && row.확장팩) {
        map.set(String(row.Serial).trim(), String(row.확장팩).trim());
      }
    }
  }
  return map;
}

function loadSerialToEnergyMap(): Map<string, string[]> {
  const path = join(process.cwd(), "app", "data", "card_list.xlsx");
  const buf = readFileSync(path);
  const wb = XLSX.read(buf, { type: "buffer" });
  const map = new Map<string, string[]>();
  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const headers = XLSX.utils.sheet_to_json(ws, { defval: "", header: 1 })[0] as string[];
    const energyCol = headers.find((h) => h === "기술에너지" || h === "필요에너지");
    const energyCol2 = headers.find((h) => h === "기술에너지2" || h === "필요에너지2");
    if (!energyCol && !energyCol2) continue;

    const rows = XLSX.utils.sheet_to_json(ws, { defval: "" }) as Array<Record<string, string>>;
    for (const row of rows) {
      if (row.Serial) {
        const types = [
          ...extractEnergyTypes(row[energyCol ?? ""]),
          ...extractEnergyTypes(row[energyCol2 ?? ""]),
        ];
        if (types.length > 0) {
          const serial = String(row.Serial).trim();
          const existing = map.get(serial) ?? [];
          map.set(serial, [...existing, ...types]);
        }
      }
    }
  }
  return map;
}

export default async function TournamentDecksPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("lang")?.value ?? "ko") as Lang;
  const t = translations[lang].tournament;

  const session = await auth();
  const decks = loadJson<BestDeck[]>("best-decks.json");
  const matchupData = loadJson<MatchupData>("matchup-data.json");

  const cardsData = loadJson<RawCard[]>("cards.json");
  const serialToId = loadSerialToIdMap();
  const serialToKoName = loadSerialToKoNameMap();
  const serialToExpansion = loadSerialToExpansionMap();
  const serialToEnergy = loadSerialToEnergyMap();

  const cardMap = new Map<string, RawCard>(
    cardsData.map((c) => [c.id, c])
  );

  const enriched: EnrichedDeck[] = decks
    .map((deck) => {
      const matchups = matchupData[deck.name] ?? [];
      const total = matchups.find((m) => m.name === "Total");
      const bestList = deck.lists.reduce((best, list) =>
        list.score > best.score ? list : best
      );

      const cards: CardItem[] = bestList.cards.map((raw) => {
        const [countStr, id] = raw.split(":");
        const normalizedId = normalizeCardId(id);
        const card = cardMap.get(normalizedId);
        const numericId = serialToId.get(normalizedId) ?? null;
        const koName = serialToKoName.get(normalizedId) ?? null;
        const expansion = serialToExpansion.get(normalizedId) ?? null;
        return {
          count: Number(countStr),
          id,
          name: card?.name ?? id,
          koName,
          image: card?.image ?? "",
          numericId,
          expansion,
        };
      });

      const allEnergyTypes: string[] = [];
      for (const card of bestList.cards) {
        const [, id] = card.split(":");
        const types = serialToEnergy.get(normalizeCardId(id)) ?? [];
        allEnergyTypes.push(...types);
      }
      const uniqueEnergyTypes = allEnergyTypes.filter((t, i, arr) => arr.indexOf(t) === i);

      return {
        name: deck.name,
        displayName: formatDeckName(deck.name),
        winRate: total ? Math.round(total.winRate * 1000) / 10 : null,
        totalGames: total?.totalGames ?? null,
        bestScore: bestList.score,
        bestStrength: bestList.strength,
        popularity: deck.popularity,
        percentOfGames: deck.percentOfGames,
        cards,
        energyTypes: uniqueEnergyTypes,
      };
    })
    .sort((a, b) => b.bestScore - a.bestScore);

  const topDecks = enriched.slice(0, 5);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: lang === "en" ? "Pokémon Pocket Tournament Deck List" : "포켓몬 포켓 토너먼트 덱 리스트",
    itemListElement: topDecks.map((deck, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: deck.displayName,
      description: lang === "en"
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
      </div>
    </main>
  );
}
