import type { PokemonCard } from "../data/cards";
import trainerMapKoToEn from "../data/trainer_map.json";

const TRAINER_MAP = trainerMapKoToEn as Record<string, string>;

function baseName(name: string): string {
  return name.replace(/\s+ex$/i, "").trim();
}

export type CardNameLookup = {
  resolve: (name: string) => PokemonCard | undefined;
  displayName: (ruleName: string) => string;
};

/** 카드 이름·한영 매핑으로 관련 카드 이름 → PokemonCard 조회 */
export function buildCardNameLookup(
  cards: PokemonCard[],
  lang: "ko" | "en",
): CardNameLookup {
  const byKey = new Map<string, PokemonCard>();

  const register = (key: string, card: PokemonCard) => {
    const k = key.trim();
    if (!k || byKey.has(k)) return;
    byKey.set(k, card);
  };

  for (const card of cards) {
    const name = card.이름.trim();
    register(name, card);
    register(baseName(name), card);

    const enFromKo = TRAINER_MAP[name] ?? TRAINER_MAP[baseName(name)];
    if (enFromKo) register(enFromKo, card);

    for (const [ko, en] of Object.entries(TRAINER_MAP)) {
      if (en === name || en === baseName(name)) {
        register(ko, card);
      }
    }
  }

  const resolve = (ruleName: string): PokemonCard | undefined => {
    const trimmed = ruleName.trim();
    return (
      byKey.get(trimmed) ??
      byKey.get(TRAINER_MAP[trimmed] ?? "") ??
      undefined
    );
  };

  const displayName = (ruleName: string): string => {
    if (lang === "en") {
      return TRAINER_MAP[ruleName.trim()] ?? resolve(ruleName)?.이름 ?? ruleName;
    }
    return ruleName;
  };

  return { resolve, displayName };
}
