/**
 * Fill empty 기술에너지 / 기술에너지2 in card_list.xlsx from
 * marcelpanse/tcg-pocket-collection-tracker cards.json (attack cost arrays).
 *
 * Only fills blank cells; existing values are kept.
 */
import { createRequire } from "module";
import { writeFileSync } from "fs";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

const XLSX_PATH = "app/data/card_list.xlsx";
const SOURCE_URL =
  "https://raw.githubusercontent.com/marcelpanse/tcg-pocket-collection-tracker/main/frontend/assets/cards.json";

const ENERGY_KO = {
  grass: "풀",
  fire: "불",
  water: "물",
  lightning: "번개",
  electric: "번개",
  psychic: "초",
  fighting: "격투",
  darkness: "악",
  dark: "악",
  metal: "강철",
  steel: "강철",
  dragon: "드래곤",
  colorless: "무색",
  fairy: "페어리",
};

function normalizeSerial(raw) {
  const s = String(raw || "").trim();
  const m = s.match(/^([A-Za-z]+\d*[a-z]?)-(\d+)$/i);
  if (!m) return s.toLowerCase();
  return `${m[1].toLowerCase()}-${String(Number(m[2])).padStart(3, "0")}`;
}

function costToKo(cost) {
  if (!Array.isArray(cost) || cost.length === 0) return "";
  // Baby Pokémon etc. — free attacks have no energy icons
  if (cost.every((c) => /no\s*cost/i.test(String(c || "")))) return "";
  const parts = [];
  let prev = null;
  let count = 0;
  for (const item of cost) {
    const key = String(item || "")
      .toLowerCase()
      .trim();
    if (/no\s*cost/.test(key)) continue;
    const ko = ENERGY_KO[key];
    if (!ko) continue;
    if (ko === prev) count += 1;
    else {
      if (prev) parts.push(`${prev}${count}`);
      prev = ko;
      count = 1;
    }
  }
  if (prev) parts.push(`${prev}${count}`);
  return parts.join("/");
}

async function loadCostBySerial() {
  const res = await fetch(SOURCE_URL, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  if (!res.ok) throw new Error(`Failed to fetch source: ${res.status}`);
  const data = await res.json();
  const map = new Map();
  for (const card of data) {
    const serial = normalizeSerial(card.card_id);
    if (!serial || !card.attacks?.length) continue;
    map.set(serial, card.attacks.map((a) => costToKo(a.cost)).filter(Boolean));
  }
  return map;
}

function fillSheet(ws, costMap) {
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
  if (rows.length < 2) return { filled: 0, miss: 0 };

  const headers = rows[0].map((h) => String(h).trim());
  const iSerial = headers.indexOf("Serial");
  const iE1 = headers.indexOf("기술에너지");
  const iE2 = headers.indexOf("기술에너지2");
  const iMove1 = headers.indexOf("기술명");
  const iMove2 = headers.indexOf("기술명2");
  if (iSerial < 0 || iE1 < 0) return { filled: 0, miss: 0 };

  let filled = 0;
  let miss = 0;

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const move1 = String(row[iMove1] ?? "").trim();
    if (!move1) continue;

    const serial = normalizeSerial(row[iSerial]);
    const costs = costMap.get(serial);
    if (!costs?.length) {
      if (!String(row[iE1] ?? "").trim()) miss += 1;
      continue;
    }

    if (!String(row[iE1] ?? "").trim() && costs[0]) {
      const addr = XLSX.utils.encode_cell({ r, c: iE1 });
      ws[addr] = { t: "s", v: costs[0] };
      filled += 1;
    }

    const move2 = iMove2 >= 0 ? String(row[iMove2] ?? "").trim() : "";
    if (move2 && iE2 >= 0 && !String(row[iE2] ?? "").trim() && costs[1]) {
      const addr = XLSX.utils.encode_cell({ r, c: iE2 });
      ws[addr] = { t: "s", v: costs[1] };
      filled += 1;
    }
  }

  return { filled, miss };
}

async function main() {
  console.log("Fetching attack costs...");
  const costMap = await loadCostBySerial();
  console.log(`Loaded costs for ${costMap.size} serials`);

  const wb = XLSX.readFile(XLSX_PATH);
  let filled = 0;
  let miss = 0;
  for (const sn of wb.SheetNames) {
    if (sn === "추천덱") continue;
    const result = fillSheet(wb.Sheets[sn], costMap);
    if (result.filled || result.miss) {
      console.log(`[${sn}] filled ${result.filled}, still missing ${result.miss}`);
    }
    filled += result.filled;
    miss += result.miss;
  }

  XLSX.writeFile(wb, XLSX_PATH);
  console.log(`Wrote ${XLSX_PATH}`);
  console.log(`Total filled: ${filled}, still missing (with move name): ${miss}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
