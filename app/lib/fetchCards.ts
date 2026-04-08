import { type PokemonCard, pokemonCards } from "../data/cards";

const SHEET_ID = "1u8U1t9WlDJGh3fXCG3rbYda87DA_Rw4OhafRnBRlleY";
const CSV_URLS = [
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`,
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=2122449850`,
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=374451566`,
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=483785799`,
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=670644763`,
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=2056634255`,
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=1810879939`,
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=681214415`,
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=608429894`,
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=2079896182`,
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=605265384`
];

/** Minimal RFC-4180 CSV parser (handles quoted fields with embedded commas/newlines) */
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i += 2;
      } else if (ch === '"') {
        inQuotes = false;
        i++;
      } else {
        field += ch;
        i++;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (ch === ",") {
        row.push(field);
        field = "";
        i++;
      } else if (ch === "\r" && text[i + 1] === "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
        i += 2;
      } else if (ch === "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
        i++;
      } else {
        field += ch;
        i++;
      }
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function toNumber(v: string): number {
  const n = Number(v.trim());
  return isNaN(n) ? 0 : n;
}

function parseSheetCards(text: string): PokemonCard[] {
  const rows = parseCSV(text);
  if (rows.length < 2) return [];

  const headers = rows[0].map((h) => h.trim());
  const cards: PokemonCard[] = [];

  for (let i = 1; i < rows.length; i++) {
    const values = rows[i];
    if (values.every((v) => v.trim() === "")) continue;

    const get = (key: string) => {
      const idx = headers.indexOf(key);
      return idx >= 0 ? (values[idx] ?? "").trim() : "";
    };

    const 이름 = get("이름");
    if (!이름) continue;

    const card: PokemonCard = {
      ID: toNumber(get("ID")),
      타입: get("타입"),
      카드타입: get("속성").trim(),
      이름,
      진화: get("진화"),
      HP: toNumber(get("HP")),
      기술명: get("기술명"),
      기술추가효과: get("기술추가효과") || "-",
      필요에너지: get("기술에너지") || get("필요에너지"),
      피해량: get("피해량").trim() || "0",
      후퇴에너지: toNumber(get("후퇴에너지")),
      특성: get("특성"),
      특성효과: get("특성효과") || "-",
      약점: get("약점"),
      관련서포터: "",
      키워드: get("키워드"),
      확장팩: get("확장팩"),
    };

    const 기술명2 = get("기술명2");
    if (기술명2) {
      card.기술명2 = 기술명2;
      card.기술추가효과2 = get("기술추가효과2") || "-";
      card.필요에너지2 = get("기술에너지2") || get("필요에너지2") || undefined;
      card.피해량2 = get("피해량2").trim() || undefined;
    }

    cards.push(card);
  }

  return cards;
}

export async function fetchCards(): Promise<PokemonCard[]> {
  try {
    const results = await Promise.all(
      CSV_URLS.map((url) => fetch(url, { cache: "no-store" }))
    );

    const allCards: PokemonCard[] = [];
    for (const res of results) {
      if (!res.ok) {
        console.warn("Google Sheets fetch failed for:", res.url);
        continue;
      }
      const text = await res.text();
      const cards = parseSheetCards(text);
      allCards.push(...cards);
    }

    return allCards.length > 0 ? allCards : pokemonCards;
  } catch (err) {
    console.warn("fetchCards error, using fallback data:", err);
    return pokemonCards;
  }
}
