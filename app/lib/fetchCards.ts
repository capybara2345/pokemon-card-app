import { existsSync, readFileSync, statSync } from "fs";
import { join } from "path";
import { type PokemonCard, pokemonCards } from "../data/cards";

const DATA_DIR = join(process.cwd(), "public", "data");
const CARDS_KO_PATH = join(DATA_DIR, "cards_ko.json");
const CARDS_EN_PATH = join(DATA_DIR, "cards_en.json");
const DECKS_PATH = join(DATA_DIR, "recommended_decks.json");

export type RecommendedDeck = {
  name: string;
  types: string[];
  createdAt: string; // "YYYY-MM-DD"
  cardIds: number[];
};

type CacheEntry<T> = { data: T; mtimeMs: number };

const cardsCache = new Map<string, CacheEntry<PokemonCard[]>>();
let decksCache: CacheEntry<RecommendedDeck[]> | null = null;

function loadCardsJson(path: string, cacheKey: string): PokemonCard[] | null {
  try {
    if (!existsSync(path)) return null;
    const { mtimeMs } = statSync(path);
    const cached = cardsCache.get(cacheKey);
    if (cached && cached.mtimeMs === mtimeMs) return cached.data;

    const data = JSON.parse(readFileSync(path, "utf-8")) as PokemonCard[];
    if (!Array.isArray(data) || data.length === 0) return null;
    cardsCache.set(cacheKey, { data, mtimeMs });
    return data;
  } catch (err) {
    console.warn(`Failed to load ${path}:`, err);
    return null;
  }
}

export function fetchRecommendedDecks(): RecommendedDeck[] {
  try {
    if (!existsSync(DECKS_PATH)) {
      console.warn(
        "recommended_decks.json not found. Run: node scripts/export-cards-json.mjs",
      );
      return [];
    }
    const { mtimeMs } = statSync(DECKS_PATH);
    if (decksCache && decksCache.mtimeMs === mtimeMs) {
      return decksCache.data;
    }
    const data = JSON.parse(readFileSync(DECKS_PATH, "utf-8")) as RecommendedDeck[];
    if (!Array.isArray(data)) return [];
    decksCache = { data, mtimeMs };
    return data;
  } catch (err) {
    console.warn("fetchRecommendedDecks error:", err);
    return [];
  }
}

export async function fetchCards(lang?: string): Promise<PokemonCard[]> {
  const isEn = lang === "en";
  const path = isEn ? CARDS_EN_PATH : CARDS_KO_PATH;
  const cacheKey = isEn ? "en" : "ko";

  const cards = loadCardsJson(path, cacheKey);
  if (cards && cards.length > 0) return cards;

  if (isEn) {
    const ko = loadCardsJson(CARDS_KO_PATH, "ko");
    if (ko && ko.length > 0) {
      console.warn("cards_en.json missing; falling back to cards_ko.json");
      return ko;
    }
  }

  console.warn(
    "Card JSON not found. Run: node scripts/export-cards-json.mjs",
  );
  return pokemonCards;
}
