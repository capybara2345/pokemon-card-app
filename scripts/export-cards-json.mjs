/**
 * Export card_list.xlsx / card_list_en.xlsx → public/data JSON for fast runtime loads.
 *
 * Outputs:
 *   public/data/cards_ko.json
 *   public/data/cards_en.json
 *   public/data/recommended_decks.json
 *
 * Usage: node scripts/export-cards-json.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const XLSX_KO = join(ROOT, "app", "data", "card_list.xlsx");
const XLSX_EN = join(ROOT, "app", "data", "card_list_en.xlsx");
const API_CARDS = join(ROOT, "public", "data", "cards.json");
const OUT_KO = join(ROOT, "public", "data", "cards_ko.json");
const OUT_EN = join(ROOT, "public", "data", "cards_en.json");
const OUT_DECKS = join(ROOT, "public", "data", "recommended_decks.json");

const SKIP_SHEETS = new Set(["추천덱", "Recommended Decks"]);

const HEADER_ALIAS = {
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
  "Related Supporters": "관련서포터",
  "Related Items": "관련아이템",
  "Related Tools": "관련도구",
  "Related Stadium": "관련스타디움",
};

const PROMO_BASE = 900000;

function parseCardId(rawId) {
  const promoMatch = String(rawId).match(/^Z(\d+)$/i);
  if (promoMatch) return PROMO_BASE + parseInt(promoMatch[1], 10);
  const n = Number(rawId);
  return Number.isNaN(n) ? 0 : n;
}

function toNumber(v) {
  if (typeof v === "number") return v;
  const n = Number(String(v).trim());
  return Number.isNaN(n) ? 0 : n;
}

function parseSheetCards(ws) {
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
  if (rows.length < 2) return [];

  const headers = rows[0].map((h) => {
    const raw = String(h).trim();
    return HEADER_ALIAS[raw] ?? raw;
  });

  const get = (row, key) => {
    const idx = headers.indexOf(key);
    return idx >= 0 ? String(row[idx] ?? "").trim() : "";
  };

  const cards = [];
  for (let i = 1; i < rows.length; i++) {
    const values = rows[i];
    const 이름 = get(values, "이름");
    if (!이름) continue;

    const card = {
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

    const serial = get(values, "Serial");
    if (serial) card.Serial = serial;

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

    const 관련아이템 = get(values, "관련아이템");
    if (관련아이템) card.관련아이템 = 관련아이템;
    const 관련도구 = get(values, "관련도구");
    if (관련도구) card.관련도구 = 관련도구;
    const 관련스타디움 = get(values, "관련스타디움");
    if (관련스타디움) card.관련스타디움 = 관련스타디움;

    if (card.ID > 0) cards.push(card);
  }
  return cards;
}

function loadWorkbookCards(xlsxPath) {
  const buf = readFileSync(xlsxPath);
  const wb = XLSX.read(buf, { type: "buffer" });
  const all = [];
  for (const sheetName of wb.SheetNames) {
    if (SKIP_SHEETS.has(sheetName)) continue;
    all.push(...parseSheetCards(wb.Sheets[sheetName]));
  }
  return all;
}

function loadApiImageMap() {
  if (!existsSync(API_CARDS)) return new Map();
  const cards = JSON.parse(readFileSync(API_CARDS, "utf-8"));
  const map = new Map();
  for (const card of cards) {
    if (card.id && card.image) map.set(String(card.id).trim(), card.image);
  }
  return map;
}

function attachImages(cards) {
  const apiImageMap = loadApiImageMap();
  let attached = 0;
  for (const card of cards) {
    const serial = card.Serial;
    if (serial) {
      const image = apiImageMap.get(String(serial).trim());
      if (image) {
        card.image = image;
        attached++;
      }
      delete card.Serial;
    }
  }
  return attached;
}

function parseRecommendedDecks(ws) {
  if (!ws) return [];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
  const decks = [];
  for (const row of rows.slice(1)) {
    if (!Array.isArray(row) || row.length < 3) continue;

    const rawDate = row[0];
    let createdAt = "";
    if (typeof rawDate === "number" && rawDate > 0) {
      const dateObj = XLSX.SSF.parse_date_code(rawDate);
      createdAt = `${dateObj.y}-${String(dateObj.m).padStart(2, "0")}-${String(dateObj.d).padStart(2, "0")}`;
    } else {
      createdAt = String(rawDate ?? "").trim();
    }

    const rawType = String(row[1] ?? "").trim();
    const types = rawType
      ? rawType.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    const name = String(row[2] ?? "").trim();
    if (!name) continue;

    const cardIds = row
      .slice(3, 23)
      .filter((cell) => cell !== null && cell !== undefined && String(cell).trim() !== "")
      .map((cell) => parseCardId(String(cell).trim()))
      .filter((id) => id > 0);

    if (cardIds.length > 0) {
      decks.push({ name, types, createdAt, cardIds });
    }
  }
  return decks;
}

function writeJson(path, data) {
  writeFileSync(path, JSON.stringify(data) + "\n", "utf-8");
  const kb = (Buffer.byteLength(JSON.stringify(data)) / 1024).toFixed(1);
  console.log(`Wrote ${path} (${Array.isArray(data) ? data.length : "?"} items, ${kb} KB)`);
}

function main() {
  const t0 = Date.now();

  if (!existsSync(XLSX_KO)) {
    throw new Error(`Missing ${XLSX_KO}`);
  }

  console.log("Parsing KO xlsx...");
  const cardsKo = loadWorkbookCards(XLSX_KO);
  const imgKo = attachImages(cardsKo);
  writeJson(OUT_KO, cardsKo);
  console.log(`  images attached: ${imgKo}`);

  if (existsSync(XLSX_EN)) {
    console.log("Parsing EN xlsx...");
    const cardsEn = loadWorkbookCards(XLSX_EN);
    const imgEn = attachImages(cardsEn);
    writeJson(OUT_EN, cardsEn);
    console.log(`  images attached: ${imgEn}`);
  } else {
    console.warn(`Skip EN: missing ${XLSX_EN}`);
  }

  const wbKo = XLSX.read(readFileSync(XLSX_KO), { type: "buffer" });
  const decks = parseRecommendedDecks(wbKo.Sheets["추천덱"]);
  writeJson(OUT_DECKS, decks);

  console.log(`Done in ${Date.now() - t0}ms`);
}

main();
