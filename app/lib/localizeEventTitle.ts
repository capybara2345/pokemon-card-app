import speciesKoEn from "../data/pokeapi_species_ko_en.json";

const EXPANSION_EN_TO_KO: Record<string, string> = {
  "Genetic Apex": "최강의 유전자",
  "Mythical Island": "환상이 있는 섬",
  "Space-Time Smackdown": "시공의 격투",
  "Triumphant Light": "초극의 빛",
  "Shining Revelry": "샤이닝 하이",
  "Celestial Guardians": "쌍천의 수호자",
  "Extradimensional Crisis": "이차원 크라이시스",
  "Eevee Grove": "이브이 가든",
  "Wisdom of Sea and Sky": "하늘과 바다의 인도",
  "Secluded Springs": "미지의 수역",
  "Mega Rising": "메가라이징",
  "Crimson Blaze": "홍련 블레이즈",
  "Fantastical Parade": "몽환퍼레이드",
  "Paldean Wonders": "팔데아원더",
  "Mega Shine": "샤이닝 메가",
  "Mega Shining": "샤이닝 메가",
  "Pulsing Aura": "파동 비트",
  "Paradox Drive": "진격 패러독스",
};

const POKEMON_OVERRIDES: Record<string, string> = {
  "Paldean Clodsire": "팔데아 토오",
  "Paldean Wooper": "팔데아 우파",
  "Paldean Tauros": "팔데아 켄타로스",
  "Alolan Vulpix": "알로라 식스테일",
  "Alolan Ninetales": "알로라 나인테일",
  "Galarian Corsola": "가라르 코산호",
};

const TYPE_EN_TO_KO: Record<string, string> = {
  Grass: "풀",
  Fire: "불",
  Water: "물",
  Lightning: "번개",
  Psychic: "초",
  Fighting: "격투",
  Darkness: "악",
  Metal: "강철",
  Dragon: "드래곤",
  Colorless: "무색",
};

const MONTH_EN_TO_KO: Record<string, string> = {
  January: "1월",
  February: "2월",
  March: "3월",
  April: "4월",
  May: "5월",
  June: "6월",
  July: "7월",
  August: "8월",
  September: "9월",
  October: "10월",
  November: "11월",
  December: "12월",
};

const speciesEnToKo = buildSpeciesEnToKo();

function buildSpeciesEnToKo(): Map<string, string> {
  const map = new Map<string, string>();
  for (const [ko, en] of Object.entries(speciesKoEn as Record<string, string>)) {
    if (!map.has(en)) map.set(en, ko);
  }
  return map;
}

function replaceExpansions(title: string): string {
  let result = title;
  const entries = Object.entries(EXPANSION_EN_TO_KO).sort(
    (a, b) => b[0].length - a[0].length
  );
  for (const [en, ko] of entries) {
    result = result.replace(new RegExp(escapeRegExp(en), "gi"), ko);
  }
  return result;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function lookupPokemon(name: string): string | null {
  const trimmed = name.trim();
  if (POKEMON_OVERRIDES[trimmed]) return POKEMON_OVERRIDES[trimmed];

  const exMatch = trimmed.match(/^(.+?)\s+ex$/i);
  if (exMatch) {
    const base = lookupPokemon(exMatch[1]);
    if (base) return `${base} ex`;
  }

  if (speciesEnToKo.has(trimmed)) return speciesEnToKo.get(trimmed)!;
  return null;
}

function translatePokemonPhrase(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;

  const direct = lookupPokemon(trimmed);
  if (direct) return direct;

  const mega = trimmed.match(/^Mega\s+(.+)$/i);
  if (mega) {
    const inner = translatePokemonPhrase(mega[1]);
    return inner === mega[1] ? trimmed : `메가 ${inner}`;
  }

  const paldean = trimmed.match(/^Paldean\s+(.+)$/i);
  if (paldean) {
    const inner = translatePokemonPhrase(paldean[1]);
    return inner.startsWith("팔데아") ? inner : `팔데아 ${inner}`;
  }

  const alolan = trimmed.match(/^Alolan\s+(.+)$/i);
  if (alolan) {
    const inner = translatePokemonPhrase(alolan[1]);
    return inner.startsWith("알로라") ? inner : `알로라 ${inner}`;
  }

  const galarian = trimmed.match(/^Galarian\s+(.+)$/i);
  if (galarian) {
    const inner = translatePokemonPhrase(galarian[1]);
    return inner.startsWith("가라르") ? inner : `가라르 ${inner}`;
  }

  return trimmed;
}

function translatePokemonList(text: string): string {
  return text
    .split(/\s+and\s+/i)
    .map((part) => translatePokemonPhrase(part.trim()))
    .join(" & ");
}

function stripBoilerplate(title: string): string {
  return title
    .replace(/\s*–\s*Promo Cards, Missions & All Rewards$/i, "")
    .replace(/\s*–\s*Ranking Guide & All Rewards$/i, "")
    .trim();
}

function replaceMonths(title: string): string {
  let result = title;
  for (const [en, ko] of Object.entries(MONTH_EN_TO_KO)) {
    result = result.replace(new RegExp(`\\b${en}\\b`, "g"), ko);
  }
  return result;
}

export function localizeEventTitleKo(enTitle: string): string {
  let title = stripBoilerplate(enTitle);

  const ranked = title.match(/^Ranked Match Season\s+([A-Za-z0-9]+)/i);
  if (ranked) return `랭크 매치 시즌 ${ranked[1].toUpperCase()}`;

  if (/^Community Week Missions/i.test(title)) {
    const month = title.match(
      /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/i
    );
    if (month) {
      return `커뮤니티 위크 미션 (${month[2]}년 ${MONTH_EN_TO_KO[month[1]] ?? month[1]})`;
    }
    return "커뮤니티 위크 미션";
  }

  if (/^Bonus Week Missions/i.test(title)) {
    const month = title.match(
      /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/i
    );
    if (month) {
      return `보너스 위크 미션 (${month[2]}년 ${MONTH_EN_TO_KO[month[1]] ?? month[1]})`;
    }
    return "보너스 위크 미션";
  }

  if (/^Pok[eé]mon 30th Celebration/i.test(title)) return "포켓몬 30주년 기념";

  if (/^Elite Deck Gift Missions/i.test(title)) return "엘리트 덱 기프트 미션";

  if (/^Handy Card(?: Gift)?(?: Collection)? Missions/i.test(title)) {
    return "핸디 카드 컬렉션 미션";
  }

  const expansion = title.match(/^(.+?)\s+Expansion$/i);
  if (expansion) {
    const nameKo = replaceExpansions(expansion[1].trim());
    return nameKo === expansion[1].trim()
      ? `${expansion[1].trim()} 확장팩`
      : `${nameKo} 확장팩`;
  }

  if (/^Special Drop Event/i.test(title)) return "스페셜 드롭 이벤트";

  if (/^New Year(?: Event)?(?: Missions)?/i.test(title)) return "새해 이벤트 미션";

  if (/^Holiday(?: Event)?(?: Missions)?/i.test(title)) return "홀리데이 이벤트 미션";

  const massOutbreak = title.match(
    /^([A-Za-z]+)-type(?:\s+Pok[eé]mon)?\s+Mass Outbreak Event/i
  );
  if (massOutbreak) {
    const typeKo = TYPE_EN_TO_KO[massOutbreak[1]] ?? massOutbreak[1];
    return `${typeKo} 타입 대량 발생 이벤트`;
  }

  const wonderDash = title.match(/^(.+?)\s*–\s*Wonder Pick Event$/i);
  if (wonderDash) {
    return `${translatePokemonList(wonderDash[1])} 원더픽 이벤트`;
  }

  const wonderPlain = title.match(/^(.+?)\s+Wonder Pick Event(?:\s+Part\s+(\d+))?/i);
  if (wonderPlain) {
    const names = translatePokemonList(wonderPlain[1]);
    const part = wonderPlain[2] ? ` 파트 ${wonderPlain[2]}` : "";
    const monthYear = title.match(
      /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/i
    );
    const suffix = monthYear
      ? ` (${monthYear[2]}년 ${MONTH_EN_TO_KO[monthYear[1]] ?? monthYear[1]})`
      : "";
    return `${names} 원더픽 이벤트${part}${suffix}`;
  }

  const drop = title.match(/^(.+?)\s+Drop [Ee]vent$/);
  if (drop) {
    return `${translatePokemonPhrase(drop[1])} 드롭 이벤트`;
  }

  const emblem = title.match(/^(.+?)\s+Emblem Event$/i);
  if (emblem) {
    const subject = replaceExpansions(emblem[1]);
    return `${subject} 엠블럼 이벤트`;
  }

  title = replaceExpansions(title);
  title = replaceMonths(title);

  const phraseMap: [RegExp, string][] = [
    [/Premium Pass/gi, "프리미엄 패스"],
    [/Premium Missions/gi, "프리미엄 미션"],
    [/First Anniversary/gi, "1주년 기념"],
    [/Celebration Campaign/gi, "기념 캠페인"],
    [/Summer Event Missions/gi, "여름 이벤트 미션"],
    [/PROMO Reissue/gi, "프로모 재발행"],
    [/Wonder Pick/gi, "원더픽"],
    [/Drop Event/gi, "드롭 이벤트"],
    [/Emblem Event/gi, "엠블럼 이벤트"],
    [/Mass Outbreak/gi, "대량 발생"],
    [/Missions/gi, "미션"],
    [/Campaign/gi, "캠페인"],
    [/Celebration/gi, "기념"],
    [/Event/gi, "이벤트"],
  ];

  for (const [pattern, ko] of phraseMap) {
    title = title.replace(pattern, ko);
  }

  return title.replace(/\s+/g, " ").trim();
}
