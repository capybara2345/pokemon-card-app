/**
 * Import B4 (천공의 지배자 / Ruler of the Skies) diamond 1–4 cards (155)
 * into card_list.xlsx from Limitless TCG Pocket + flibustier names.
 *
 * Usage: node scripts/import-b4-cards.mjs
 */
import fs from "fs";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

const UA = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
};

const EXPANSION_KO = "천공의 지배자";
const ID_BASE = 19000; // 19001–19155
const SERIAL_PREFIX = "b4";

const TYPE_EN_KO = {
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

const SHEET_BY_TYPE = {
  풀: "풀포켓몬",
  불: "불포켓몬",
  물: "물포켓몬",
  번개: "번개포켓몬",
  초: "초능력포켓몬",
  격투: "격투포켓몬",
  악: "악포켓몬",
  강철: "강철포켓몬",
  드래곤: "드래곤포켓몬",
  무색: "일반포켓몬",
};

const ENERGY_LETTER = {
  G: "풀",
  R: "불",
  W: "물",
  L: "번개",
  P: "초",
  F: "격투",
  D: "악",
  M: "강철",
  N: "드래곤",
  Y: "페어리",
  C: "무색",
};

const STAGE_EN_KO = {
  Basic: "기본",
  "Stage 1": "1진화",
  "Stage 2": "2진화",
};

const TRAINER_TYPE_EN_KO = {
  Item: "아이템",
  Supporter: "서포트",
  Stadium: "스타디움",
  Tool: "도구",
  "Pokémon Tool": "도구",
  Fossil: "화석",
};

/** Manual EN→KO for trainers / awkward names in B4 */
const TRAINER_EN_KO = {
  "Order Pad": "오더패드",
  "Claw Fossil": "발톱화석",
  "Root Fossil": "뿌리화석",
  "Deceptive Needle": "속임수바늘",
  "Clear Veil": "클리어베일",
  Psychic: "초능력자",
  Drayden: "사간",
  Skyla: "풍란",
  Wally: "민진",
  "Soothing Shore": "다독이는 해변",
  "Rainbow Cave": "무지갯빛 동굴",
};

/** Extra EN→KO pokemon display names */
const POKEMON_EN_KO_EXTRA = {
  "Mega Sharpedo ex": "메가샤크니아 ex",
  "Mega Gallade ex": "메가엘레이드 ex",
  "Mega Metagross ex": "메가메타그로스 ex",
  "Mega Rayquaza ex": "메가레쿠쟈 ex",
  "Vespiquen ex": "비퀸 ex",
  "Typhlosion ex": "블레이범 ex",
  "Wailord ex": "고래왕 ex",
  "Rotom ex": "로토무 ex",
  "Hoopa ex": "후파 ex",
  "Swanna ex": "스완나 ex",
  "Type: Null": "타입:널",
  "Type:Null": "타입:널",
};

function reverseMap(obj) {
  const out = {};
  for (const [ko, en] of Object.entries(obj || {})) {
    if (!en) continue;
    out[String(en).toLowerCase()] = ko;
  }
  return out;
}

const speciesKoEn = JSON.parse(
  fs.readFileSync("app/data/pokeapi_species_ko_en.json", "utf8")
);
const moveMap = JSON.parse(fs.readFileSync("app/data/tcg_move_map.json", "utf8"));
const abilityMap = JSON.parse(
  fs.readFileSync("app/data/tcg_ability_map.json", "utf8")
);
const moveEffectMap = fs.existsSync("app/data/tcg_move_effect_map.json")
  ? JSON.parse(fs.readFileSync("app/data/tcg_move_effect_map.json", "utf8"))
  : {};
const abilityEffectMap = fs.existsSync("app/data/tcg_ability_effect_map.json")
  ? JSON.parse(fs.readFileSync("app/data/tcg_ability_effect_map.json", "utf8"))
  : {};
const trainerMap = JSON.parse(fs.readFileSync("app/data/trainer_map.json", "utf8"));
const finalMoves = JSON.parse(fs.readFileSync("app/data/final_move_map.json", "utf8"));

// translate_cards POKEMON_NAMES is large; also use species + ADDON via reverse
const nameEnToKo = {
  ...reverseMap(speciesKoEn),
  ...reverseMap(trainerMap),
  ...Object.fromEntries(
    Object.entries(POKEMON_EN_KO_EXTRA).map(([en, ko]) => [en.toLowerCase(), ko])
  ),
  ...Object.fromEntries(
    Object.entries(TRAINER_EN_KO).map(([en, ko]) => [en.toLowerCase(), ko])
  ),
};

const moveEnToKo = { ...reverseMap(finalMoves), ...reverseMap(moveMap) };
const abilityEnToKo = reverseMap(abilityMap);
const effectEnToKo = {
  ...reverseMap(moveEffectMap),
  ...reverseMap(abilityEffectMap),
};

function stripTags(s) {
  return String(s || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function formatEnergy(symbolBlob) {
  const letters = String(symbolBlob || "").replace(/[^A-Za-z]/g, "");
  if (!letters) return "";
  const counts = [];
  for (const ch of letters.toUpperCase()) {
    const ko = ENERGY_LETTER[ch];
    if (!ko) continue;
    const last = counts[counts.length - 1];
    if (last && last.type === ko) last.n += 1;
    else counts.push({ type: ko, n: 1 });
  }
  return counts.map((c) => `${c.type}${c.n}`).join("/");
}

function parseAttackInfo(info, symbolBlob) {
  let rest = String(info || "").trim();
  // strip leading energy letters that mirror the symbol blob
  const letters = String(symbolBlob || "").replace(/[^A-Za-z]/g, "");
  if (letters && rest.toUpperCase().startsWith(letters.toUpperCase())) {
    rest = rest.slice(letters.length).trim();
  } else {
    rest = rest.replace(/^[A-Z]+(?=\s|[A-Z][a-z])/, "").trim();
  }
  const dmgMatch = rest.match(/\s(\d+x?|\d+\+)\s*$/i);
  let damage = "";
  let name = rest;
  if (dmgMatch) {
    damage = dmgMatch[1];
    name = rest.slice(0, -dmgMatch[0].length).trim();
  }
  return { name, damage };
}

function translateName(enName, isTrainer) {
  const raw = String(enName || "").trim();
  if (!raw) return raw;
  const lower = raw.toLowerCase();
  if (nameEnToKo[lower]) return nameEnToKo[lower];

  // Mega X ex / Mega X / X ex
  const megaEx = raw.match(/^Mega\s+(.+?)\s+ex$/i);
  if (megaEx) {
    const base = translateName(megaEx[1], false);
    return base.endsWith(" ex")
      ? `메가${base.replace(/\s+ex$/i, "")} ex`
      : `메가${base} ex`;
  }
  const mega = raw.match(/^Mega\s+(.+)$/i);
  if (mega) return `메가${translateName(mega[1], false)}`;
  const ex = raw.match(/^(.+?)\s+ex$/i);
  if (ex) return `${translateName(ex[1], false)} ex`;

  if (isTrainer) return TRAINER_EN_KO[raw] || raw;
  return nameEnToKo[lower] || raw;
}

function translateMove(en) {
  const s = String(en || "").trim();
  if (!s) return "";
  return moveEnToKo[s.toLowerCase()] || s;
}

function translateAbility(en) {
  let s = String(en || "")
    .replace(/^Ability:\s*/i, "")
    .trim();
  if (!s) return "";
  return abilityEnToKo[s.toLowerCase()] || s;
}

function translateEffect(en) {
  const s = String(en || "").trim();
  if (!s) return "";
  return effectEnToKo[s.toLowerCase()] || effectEnToKo[s] || s;
}

function parseLimitlessCard(html, number) {
  const name = stripTags(
    html.match(/card-text-name[\s\S]*?<a[^>]*>([^<]+)/)?.[1] ||
      html.match(/card-text-name[^>]*>[\s\S]*?>([^<]+)/)?.[1] ||
      ""
  );
  const titleText = stripTags(html.match(/card-text-title">([\s\S]*?)<\/p>/)?.[1]);
  const typeText = stripTags(html.match(/card-text-type">([\s\S]*?)<\/p>/)?.[1]);

  const hp = Number(titleText.match(/(\d+)\s*HP/)?.[1] || 0);
  const elementEn = titleText.match(/-\s*([A-Za-z]+)\s*-/)?.[1] || "";

  const isTrainer = /^Trainer/i.test(typeText);
  const trainerKind = typeText.match(/Trainer\s*-\s*(.+)$/i)?.[1]?.trim() || "";
  const stageEn = typeText.match(/Pokémon\s*-\s*(Basic|Stage 1|Stage 2)/i)?.[1] || "";
  const evolvesFrom =
    typeText.match(/Evolves from\s+(.+)$/i)?.[1]?.trim() || "";

  const attacks = [];
  for (const m of html.matchAll(/class="card-text-attack">([\s\S]*?)(?=<div class="card-text-(?:attack|ability|section)|$)/g)) {
    const block = m[1];
    const info = stripTags(block.match(/card-text-attack-info">([\s\S]*?)<\/p>/)?.[1]);
    const effect = stripTags(
      block.match(/card-text-attack-effect">([\s\S]*?)<\/p>/)?.[1]
    );
    const symbolBlob = [...block.matchAll(/ptcg-symbol">([^<]+)/g)]
      .map((x) => x[1])
      .join("");
    const { name: atkName, damage } = parseAttackInfo(info, symbolBlob);
    if (!atkName && !damage) continue;
    attacks.push({
      name: atkName,
      damage,
      effect,
      energy: formatEnergy(symbolBlob),
    });
  }

  let abilityName = "";
  let abilityEffect = "";
  const abBlock = html.match(
    /class="card-text-ability">([\s\S]*?)(?=<div class="card-text-(?:attack|ability|section)|$)/
  )?.[1];
  if (abBlock) {
    abilityName = stripTags(
      abBlock.match(/card-text-ability-info">([\s\S]*?)<\/p>/)?.[1]
    );
    abilityEffect = stripTags(
      abBlock.match(/card-text-ability-effect">([\s\S]*?)<\/p>/)?.[1]
    );
  }

  const weaknessEn =
    stripTags(html.match(/Weakness:\s*([^<\n]+)/)?.[1] || "").split(/\s+/)[0] ||
    "";
  const retreatMatch = html.match(/Retreat:\s*(\d+)/);
  const retreat = retreatMatch
    ? Number(retreatMatch[1])
    : (html.match(/Retreat:([\s\S]{0,80})/)?.[1]?.match(/ptcg-symbol/g) || [])
        .length;

  // Trainer effect: first non-title card-text-section paragraph without Weakness
  let trainerEffect = "";
  if (isTrainer) {
    const sections = [...html.matchAll(/card-text-section">([\s\S]*?)<\/div>/g)].map(
      (m) => stripTags(m[1])
    );
    trainerEffect =
      sections.find(
        (s) =>
          s &&
          !s.includes(name) &&
          !/^Trainer/i.test(s) &&
          !/Illustrated/i.test(s) &&
          !/Weakness:/i.test(s)
      ) || "";
  }

  const image =
    html.match(/og:image" content="([^"]+)/)?.[1] ||
    html.match(/src="(https:\/\/limitlesstcg[^"]+B4_[^"]+_EN[^"]+)"/)?.[1] ||
    "";

  return {
    number,
    name,
    hp,
    elementEn,
    isTrainer,
    trainerKind,
    stageEn,
    evolvesFrom,
    attacks,
    abilityName,
    abilityEffect,
    weaknessEn,
    retreat: Number(retreat) || 0,
    trainerEffect,
    image,
    typeText,
  };
}

async function fetchCard(n) {
  const url = `https://pocket.limitlesstcg.com/cards/B4/${n}`;
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, { headers: UA });
    if (res.ok) return parseLimitlessCard(await res.text(), n);
    await sleep(500 * (attempt + 1));
  }
  throw new Error(`Failed to fetch B4/${n}`);
}

function attributeFromName(enName) {
  if (/^Mega\b/i.test(enName) && /\bex$/i.test(enName)) return "메가ex";
  if (/\bex$/i.test(enName)) return "ex";
  return "";
}

function toPokemonRow(card) {
  const 타입 = TYPE_EN_KO[card.elementEn] || "무색";
  const 이름 = translateName(card.name, false);
  const 이전이름 = card.evolvesFrom ? translateName(card.evolvesFrom, false) : "";
  const 진화 = STAGE_EN_KO[card.stageEn] || "기본";
  const a1 = card.attacks[0] || {};
  const a2 = card.attacks[1] || {};

  return {
    sheet: SHEET_BY_TYPE[타입] || "일반포켓몬",
    row: {
      타입,
      ID: ID_BASE + card.number,
      Serial: `${SERIAL_PREFIX}-${String(card.number).padStart(3, "0")}`,
      속성: attributeFromName(card.name),
      이름,
      이전이름,
      진화,
      HP: card.hp || "",
      기술명: translateMove(a1.name || ""),
      기술명2: translateMove(a2.name || ""),
      기술추가효과: translateEffect(a1.effect || ""),
      기술추가효과2: translateEffect(a2.effect || ""),
      기술에너지: a1.energy || "",
      기술에너지2: a2.energy || "",
      피해량: a1.damage || "",
      피해량2: a2.damage || "",
      후퇴에너지: card.retreat || 0,
      특성: translateAbility(card.abilityName || ""),
      특성효과: translateEffect(card.abilityEffect || ""),
      약점: TYPE_EN_KO[card.weaknessEn] || "",
      키워드: "",
      확장팩: EXPANSION_KO,
    },
    enName: card.name,
    image: card.image,
  };
}

function toTrainerRow(card) {
  const kind = TRAINER_TYPE_EN_KO[card.trainerKind] || "아이템";
  // Fossil cards sometimes labeled Item
  const 타입 =
    /fossil/i.test(card.name) || /fossil/i.test(card.trainerKind)
      ? "화석"
      : kind;
  return {
    sheet: "트레이너스",
    row: {
      타입,
      ID: ID_BASE + card.number,
      Serial: `${SERIAL_PREFIX}-${String(card.number).padStart(3, "0")}`,
      이름: translateName(card.name, true),
      기술추가효과: translateEffect(card.trainerEffect || ""),
      키워드: "",
      확장팩: EXPANSION_KO,
    },
    enName: card.name,
    image: card.image,
  };
}

function appendRowsToWorkbook(wb, entries) {
  const bySheet = new Map();
  for (const e of entries) {
    if (!bySheet.has(e.sheet)) bySheet.set(e.sheet, []);
    bySheet.get(e.sheet).push(e.row);
  }

  for (const [sheetName, newRows] of bySheet) {
    const ws = wb.Sheets[sheetName];
    if (!ws) throw new Error(`Missing sheet: ${sheetName}`);
    const existing = XLSX.utils.sheet_to_json(ws, { defval: "" });
    // skip if already imported
    const filtered = existing.filter((r) => r.확장팩 !== EXPANSION_KO);
    const headers = Object.keys(
      sheetName === "트레이너스"
        ? {
            타입: "",
            ID: "",
            Serial: "",
            이름: "",
            기술추가효과: "",
            키워드: "",
            확장팩: "",
          }
        : {
            타입: "",
            ID: "",
            Serial: "",
            속성: "",
            이름: "",
            이전이름: "",
            진화: "",
            HP: "",
            기술명: "",
            기술명2: "",
            기술추가효과: "",
            기술추가효과2: "",
            기술에너지: "",
            기술에너지2: "",
            피해량: "",
            피해량2: "",
            후퇴에너지: "",
            특성: "",
            특성효과: "",
            약점: "",
            키워드: "",
            확장팩: "",
          }
    );
    const merged = [...filtered, ...newRows];
    const aoa = [
      headers,
      ...merged.map((r) => headers.map((h) => (r[h] ?? ""))),
    ];
    wb.Sheets[sheetName] = XLSX.utils.aoa_to_sheet(aoa);
    console.log(
      `  ${sheetName}: +${newRows.length} (total ${merged.length})`
    );
  }
}

function patchCardsJson(entries) {
  const path = "public/data/cards.json";
  const cards = JSON.parse(fs.readFileSync(path, "utf8"));
  const without = cards.filter((c) => !String(c.id).startsWith("b4-"));
  const added = entries.map((e) => {
    const n = e.row.ID - ID_BASE;
    const serial = `b4-${String(n).padStart(3, "0")}`;
    return {
      id: serial,
      name: e.enName,
      rarity: "",
      pack: "Ruler of the Skies",
      health: String(e.row.HP || ""),
      image:
        e.image ||
        `https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/pocket/B4/B4_${String(n).padStart(3, "0")}_EN_SM.webp`,
      fullart: "",
      ex: /ex$/i.test(e.enName) ? "Yes" : "",
      artist: "",
      type: e.row.타입 || "",
    };
  });
  // diamond only already
  const rarityByNum = Object.fromEntries(
    JSON.parse(fs.readFileSync("scripts/_b4_diamond.json", "utf8")).map((c) => [
      c.number,
      c.rarity,
    ])
  );
  const rarityLabel = { C: "◊", U: "◊◊", R: "◊◊◊", RR: "◊◊◊◊" };
  for (const c of added) {
    const n = Number(c.id.split("-")[1]);
    c.rarity = rarityLabel[rarityByNum[n]] || "";
  }
  const out = [...without, ...added];
  fs.writeFileSync(path, JSON.stringify(out, null, 2) + "\n", "utf8");
  console.log(`Patched cards.json: +${added.length} b4 (total ${out.length})`);
}

async function main() {
  const diamond = JSON.parse(fs.readFileSync("scripts/_b4_diamond.json", "utf8"));
  console.log(`Fetching ${diamond.length} B4 diamond cards from Limitless...`);

  const entries = [];
  const untranslatedNames = [];
  for (const meta of diamond) {
    const n = meta.number;
    process.stdout.write(`\r  ${n}/155 ${meta.name}`.padEnd(60));
    const card = await fetchCard(n);
    // prefer flibustier name if parse missed
    if (!card.name) card.name = meta.name;
    const entry = card.isTrainer ? toTrainerRow(card) : toPokemonRow(card);
    if (entry.row.이름 === card.name || /[A-Za-z]/.test(entry.row.이름)) {
      // still has latin letters beyond "ex" / Type:널
      if (!/ex$/i.test(entry.row.이름) && entry.row.이름 !== "타입:널") {
        if (/[A-Za-z]/.test(entry.row.이름.replace(/\s*ex$/i, ""))) {
          untranslatedNames.push(`${n}:${card.name}->${entry.row.이름}`);
        }
      }
    }
    entries.push(entry);
    await sleep(120);
  }
  console.log("\nFetched", entries.length);

  fs.writeFileSync(
    "scripts/_b4_import_preview.json",
    JSON.stringify(entries, null, 2),
    "utf8"
  );
  if (untranslatedNames.length) {
    console.log("Untranslated names:", untranslatedNames.length);
    console.log(untranslatedNames.slice(0, 40).join("\n"));
  }

  const wb = XLSX.readFile("app/data/card_list.xlsx");
  console.log("Writing card_list.xlsx...");
  appendRowsToWorkbook(wb, entries);
  XLSX.writeFile(wb, "app/data/card_list.xlsx");

  patchCardsJson(entries);

  console.log("Done. Next: node app/data/translate_cards.js  (EN xlsx)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
