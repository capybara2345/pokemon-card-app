import { readFileSync } from "fs";
import { join } from "path";
import * as XLSX from "xlsx";
import { type PokemonCard, pokemonCards, parseCardId } from "../data/cards";

const XLSX_PATH = join(process.cwd(), "app", "data", "card_list.xlsx");

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

  const headers = (rows[0] as (string | number)[]).map((h) =>
    String(h).trim()
  );

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
      관련서포터: "",
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

    cards.push(card);
  }

  return cards;
}

export async function fetchCards(): Promise<PokemonCard[]> {
  try {
    const buf = readFileSync(XLSX_PATH);
    const wb = XLSX.read(buf, { type: "buffer" });

    const allCards: PokemonCard[] = [];
    for (const sheetName of wb.SheetNames) {
      const ws = wb.Sheets[sheetName];
      const cards = parseSheetCards(ws);
      allCards.push(...cards);
    }

    return allCards.length > 0 ? allCards : pokemonCards;
  } catch (err) {
    console.warn("fetchCards (xlsx) error, using fallback data:", err);
    return pokemonCards;
  }
}
