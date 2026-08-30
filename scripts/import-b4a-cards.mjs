/**
 * Import B4a (로켓단의 야망 / Team Rocket's Ambition) diamond 1–72 cards
 * into card_list.xlsx from Limitless TCG Pocket.
 *
 * Usage: node scripts/import-b4a-cards.mjs
 */
import fs from "fs";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

const UA = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
};

const EXPANSION_KO = "로켓단의 야망";
const ID_BASE = 19200; // 19201–19272
const SERIAL_PREFIX = "b4a";
const CARD_COUNT = 72;

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

/** Manual EN→KO for trainers / awkward display names */
const TRAINER_EN_KO = {
  "Team Rocket's Thieving Machine": "로켓단의 도둑질 머신",
  "Team Rocket's Goo-zooka": "로켓단의 구즈카",
  "Team Rocket's Researcher": "로켓단의 연구원",
  "Team Rocket's Master Plan": "로켓단의 대작전",
  "Team Rocket's Boss": "로켓단의 보스",
  Arcade: "게임센터",
};

/** Extra EN→KO pokemon / owner display names */
const POKEMON_EN_KO_EXTRA = {
  "Mr. Mime": "마임맨",
  "Hisuian Basculin": "히스이 배쓰나이",
  "Hisuian Basculegion": "히스이 대쓰바스",
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

function translateBasePokemon(enName) {
  const raw = String(enName || "").trim();
  if (!raw) return raw;
  const lower = raw.toLowerCase();
  if (nameEnToKo[lower]) return nameEnToKo[lower];
  if (POKEMON_EN_KO_EXTRA[raw]) return POKEMON_EN_KO_EXTRA[raw];

  const hisuian = raw.match(/^Hisuian\s+(.+)$/i);
  if (hisuian) return `히스이 ${translateBasePokemon(hisuian[1])}`;

  const galarian = raw.match(/^Galarian\s+(.+)$/i);
  if (galarian) return `가라르 ${translateBasePokemon(galarian[1])}`;

  const alolan = raw.match(/^Alolan\s+(.+)$/i);
  if (alolan) return `알로라 ${translateBasePokemon(alolan[1])}`;

  return nameEnToKo[lower] || raw;
}

function translateName(enName, isTrainer) {
  const raw = String(enName || "").trim();
  if (!raw) return raw;
  const lower = raw.toLowerCase();
  if (nameEnToKo[lower]) return nameEnToKo[lower];
  if (TRAINER_EN_KO[raw]) return TRAINER_EN_KO[raw];

  // Team Rocket's X ex / Team Rocket's X
  const rocketEx = raw.match(/^Team Rocket'?s\s+(.+?)\s+ex$/i);
  if (rocketEx) {
    return `로켓단의 ${translateBasePokemon(rocketEx[1])} ex`;
  }
  const rocket = raw.match(/^Team Rocket'?s\s+(.+)$/i);
  if (rocket) {
    const rest = rocket[1].trim();
    if (TRAINER_EN_KO[`Team Rocket's ${rest}`]) {
      return TRAINER_EN_KO[`Team Rocket's ${rest}`];
    }
    return `로켓단의 ${translateBasePokemon(rest)}`;
  }

  const megaEx = raw.match(/^Mega\s+(.+?)\s+ex$/i);
  if (megaEx) {
    const base = translateBasePokemon(megaEx[1]);
    return base.endsWith(" ex")
      ? `메가${base.replace(/\s+ex$/i, "")} ex`
      : `메가${base} ex`;
  }
  const mega = raw.match(/^Mega\s+(.+)$/i);
  if (mega) return `메가${translateBasePokemon(mega[1])}`;
  const ex = raw.match(/^(.+?)\s+ex$/i);
  if (ex) return `${translateBasePokemon(ex[1])} ex`;

  if (isTrainer) return TRAINER_EN_KO[raw] || raw;
  return translateBasePokemon(raw);
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
  for (const m of html.matchAll(
    /class="card-text-attack">([\s\S]*?)(?=<div class="card-text-(?:attack|ability|section)|$)/g
  )) {
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
    html.match(/src="(https:\/\/limitlesstcg[^"]+B4a_[^"]+_EN[^"]+)"/)?.[1] ||
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
  const url = `https://pocket.limitlesstcg.com/cards/B4a/${n}`;
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, { headers: UA });
    if (res.ok) return parseLimitlessCard(await res.text(), n);
    await sleep(500 * (attempt + 1));
  }
  throw new Error(`Failed to fetch B4a/${n}`);
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
    en: card,
  };
}

function toTrainerRow(card) {
  const kind = TRAINER_TYPE_EN_KO[card.trainerKind] || "아이템";
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
    en: card,
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
      ...merged.map((r) => headers.map((h) => r[h] ?? "")),
    ];
    wb.Sheets[sheetName] = XLSX.utils.aoa_to_sheet(aoa);
    console.log(`  ${sheetName}: +${newRows.length} (total ${merged.length})`);
  }
}

async function main() {
  let diamond = [];
  if (fs.existsSync("scripts/_b4a_diamond.json")) {
    diamond = JSON.parse(fs.readFileSync("scripts/_b4a_diamond.json", "utf8"));
  }
  if (diamond.length < CARD_COUNT) {
    diamond = Array.from({ length: CARD_COUNT }, (_, i) => ({
      set: "B4a",
      number: i + 1,
      rarity: "?",
      name: "",
      packs: ["Team Rocket's Ambition"],
    }));
  }

  console.log(`Fetching ${diamond.length} B4a diamond cards from Limitless...`);

  const entries = [];
  const untranslatedNames = [];
  for (const meta of diamond) {
    const n = meta.number;
    if (n > CARD_COUNT) continue;
    process.stdout.write(`\r  ${n}/${CARD_COUNT}`.padEnd(40));
    const card = await fetchCard(n);
    if (!card.name) card.name = meta.name;
    meta.name = card.name;
    const entry = card.isTrainer ? toTrainerRow(card) : toPokemonRow(card);
    const nameKo = entry.row.이름;
    if (/[A-Za-z]/.test(String(nameKo).replace(/\s*ex$/i, "").replace(/Type:널/i, ""))) {
      untranslatedNames.push(`${n}:${card.name}->${nameKo}`);
    }
    entries.push(entry);
    await sleep(100);
  }
  console.log("\nFetched", entries.length);

  // refresh diamond names
  fs.writeFileSync(
    "scripts/_b4a_diamond.json",
    JSON.stringify(
      diamond.map((d) => ({
        set: "B4a",
        number: d.number,
        rarity: d.rarity,
        name: d.name,
        packs: ["Team Rocket's Ambition"],
      })),
      null,
      2
    ),
    "utf8"
  );

  fs.writeFileSync(
    "scripts/_b4a_import_preview.json",
    JSON.stringify(
      entries.map((e) => ({
        sheet: e.sheet,
        row: e.row,
        enName: e.enName,
        en: {
          attacks: e.en?.attacks,
          abilityName: e.en?.abilityName,
          abilityEffect: e.en?.abilityEffect,
          trainerEffect: e.en?.trainerEffect,
          evolvesFrom: e.en?.evolvesFrom,
        },
      })),
      null,
      2
    ),
    "utf8"
  );

  if (untranslatedNames.length) {
    console.log("Untranslated names:", untranslatedNames.length);
    console.log(untranslatedNames.join("\n"));
  }

  const wb = XLSX.readFile("app/data/card_list.xlsx");
  console.log("Writing card_list.xlsx...");
  appendRowsToWorkbook(wb, entries);
  XLSX.writeFile(wb, "app/data/card_list.xlsx");

  console.log("Done. Next: apply Korean move/effect patch if needed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
