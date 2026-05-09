import { readFileSync } from "fs";
import { join } from "path";
import * as XLSX from "xlsx";
import { type PokemonCard, pokemonCards, parseCardId } from "../data/cards";

const XLSX_PATH = join(process.cwd(), "app", "data", "card_list.xlsx");
const XLSX_PATH_EN = join(process.cwd(), "app", "data", "card_list_en.xlsx");

// English header → Korean header alias (EN xlsx uses English column names)
const HEADER_ALIAS: Record<string, string> = {
  Name: "이름",
  Type: "타입",
  Attribute: "속성",
  Stage: "진화",
  "Move 1": "기술명",
  "Move 2": "기술명2",
  "Move 1 Effect": "기술추가효과",
  "Move 2 Effect": "기술추가효과2",
  "Move 1 Energy": "기술에너지",
  "Move 2 Energy": "기술에너지2",
  "Damage 1": "피해량",
  "Damage 2": "피해량2",
  "Retreat Energy": "후퇴에너지",
  Ability: "특성",
  "Ability Effect": "특성효과",
  Weakness: "약점",
  Keywords: "키워드",
  Expansion: "확장팩",
  BeforeName: "이전이름",
};

function toNumber(v: string | number): number {
  if (typeof v === "number") return v;
  const n = Number(String(v).trim());
  return isNaN(n) ? 0 : n;
}

function parseSheetCards(ws: XLSX.WorkSheet): PokemonCard[] {
  const rows = XLSX.utils.sheet_to_json<(string | number)[]>(ws, {
    header: 1,
    defval: "",
  });
  if (rows.length < 2) return [];

  // Normalize headers: map English names → Korean so the rest of the code is unchanged
  const headers = (rows[0] as (string | number)[]).map((h) => {
    const raw = String(h).trim();
    return HEADER_ALIAS[raw] ?? raw;
  });

  const get = (row: (string | number)[], key: string) => {
    const idx = headers.indexOf(key);
    return idx >= 0 ? String(row[idx] ?? "").trim() : "";
  };

  const cards: PokemonCard[] = [];

  for (let i = 1; i < rows.length; i++) {
    const values = rows[i] as (string | number)[];
    const 이름 = get(values, "이름");
    if (!이름) continue;

    const card: PokemonCard = {
      ID: parseCardId(get(values, "ID")),
      타입: get(values, "타입"),
      카드타입: get(values, "속성"),
      이름,
      진화: get(values, "진화"),
      HP: toNumber(get(values, "HP")),
      기술명: get(values, "기술명"),
      기술추가효과: get(values, "기술추가효과") || "-",
      필요에너지: get(values, "기술에너지") || get(values, "필요에너지"),
      피해량: get(values, "피해량") || "0",
      후퇴에너지: toNumber(get(values, "후퇴에너지")),
      특성: get(values, "특성"),
      특성효과: get(values, "특성효과") || "-",
      약점: get(values, "약점"),
      키워드: get(values, "키워드"),
      확장팩: get(values, "확장팩"),
    };

    const 기술명2 = get(values, "기술명2");
    if (기술명2) {
      card.기술명2 = 기술명2;
      card.기술추가효과2 = get(values, "기술추가효과2") || "-";
      card.필요에너지2 =
        get(values, "기술에너지2") || get(values, "필요에너지2") || undefined;
      card.피해량2 = get(values, "피해량2") || undefined;
    }

    const 이전이름 = get(values, "이전이름");
    if (이전이름) card.이전이름 = 이전이름;

    cards.push(card);
  }

  return cards;
}

export type RecommendedDeck = {
  name: string;
  types: string[];
  createdAt: string; // "YYYY-MM-DD"
  cardIds: number[];
};

export function fetchRecommendedDecks(): RecommendedDeck[] {
  try {
    const buf = readFileSync(XLSX_PATH);
    const wb = XLSX.read(buf, { type: "buffer" });
    const ws = wb.Sheets["추천덱"];
    if (!ws) return [];

    const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, {
      header: 1,
      defval: "",
    }) as unknown[][];

    // 헤더 행 skip
    const dataRows = rows.slice(1);
    const decks: RecommendedDeck[] = [];

    for (const row of dataRows) {
      if (!Array.isArray(row) || row.length < 3) continue;

      // 생성일: Excel 시리얼 숫자 → "YYYY-MM-DD"
      const rawDate = row[0];
      let createdAt = "";
      if (typeof rawDate === "number" && rawDate > 0) {
        const dateObj = XLSX.SSF.parse_date_code(rawDate);
        createdAt = `${dateObj.y}-${String(dateObj.m).padStart(2, "0")}-${String(dateObj.d).padStart(2, "0")}`;
      } else {
        createdAt = String(rawDate ?? "").trim();
      }

      // 타입: 쉼표 구분 or 단일 문자열
      const rawType = String(row[1] ?? "").trim();
      const types = rawType
        ? rawType.split(",").map((t) => t.trim()).filter(Boolean)
        : [];

      // 덱 이름
      const name = String(row[2] ?? "").trim();
      if (!name) continue;

      // 카드 ID (index 3~22, 최대 20개)
      const cardIds = (row as unknown[])
        .slice(3, 23)
        .filter((cell) => cell !== null && cell !== undefined && String(cell).trim() !== "")
        .map((cell) => parseCardId(String(cell).trim()))
        .filter((id) => id > 0);

      if (cardIds.length > 0) {
        decks.push({ name, types, createdAt, cardIds });
      }
    }

    return decks;
  } catch {
    return [];
  }
}

function loadApiImageMap(): Map<string, string> {
  const path = join(process.cwd(), "public", "data", "cards.json");
  const content = readFileSync(path, "utf-8");
  const cards = JSON.parse(content) as Array<{ id: string; image: string }>;
  const map = new Map<string, string>();
  for (const card of cards) {
    if (card.id && card.image) {
      map.set(String(card.id).trim(), card.image);
    }
  }
  return map;
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
        const numericId = parseCardId(String(row.ID).trim());
        if (numericId > 0) {
          map.set(String(row.Serial).trim(), numericId);
        }
      }
    }
  }
  return map;
}

export async function fetchCards(lang?: string): Promise<PokemonCard[]> {
  const xlsxPath = lang === "en" ? XLSX_PATH_EN : XLSX_PATH;
  try {
    const buf = readFileSync(xlsxPath);
    const wb = XLSX.read(buf, { type: "buffer" });

    const allCards: PokemonCard[] = [];
    for (const sheetName of wb.SheetNames) {
      const ws = wb.Sheets[sheetName];
      const cards = parseSheetCards(ws);
      allCards.push(...cards);
    }

    if (lang === "en" && allCards.length > 0) {
      const apiImageMap = loadApiImageMap();
      const serialToId = loadSerialToIdMap();
      const numericIdToSerial = new Map<number, string>();
      for (const [serial, numericId] of serialToId.entries()) {
        numericIdToSerial.set(numericId, serial);
      }
      for (const card of allCards) {
        const serial = numericIdToSerial.get(card.ID);
        if (serial) {
          const image = apiImageMap.get(serial);
          if (image) card.image = image;
        }
      }
    }

    return allCards.length > 0 ? allCards : pokemonCards;
  } catch (err) {
    console.warn("fetchCards (xlsx) error, using fallback data:", err);
    return pokemonCards;
  }
}
