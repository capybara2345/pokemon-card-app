/**
 * Import C1 (듀얼 퓨전 / Dual Fusion) diamond cards 1–131
 * into card_list.xlsx from Limitless TCG Pocket.
 *
 * Usage: node scripts/import-c1-cards.mjs [--refresh]
 */
import fs from "fs";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

const UA = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
};

const EXPANSION_KO = "듀얼 퓨전";
const ID_BASE = 20000; // 20001–20131
const SERIAL_PREFIX = "c1";
const CARD_COUNT = 131;
const CACHE_PATH = "scripts/_c1_parsed.json";

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

const POKEMON_EN_KO_EXTRA = {
  "Mr. Mime": "마임맨",
  "Type: Null": "타입:널",
  "Type:Null": "타입:널",
  "Mewtwo X": "뮤츠X",
  Espeon: "에스피온",
  "Porygon-Z": "폴리곤Z",
  "Porygon2": "폴리곤2",
  "Paldean Clodsire": "팔데아 토오",
  "Paldean Wooper": "팔데아 우파",
};

const TRAINER_EN_KO = {
  "Sweet Honey": "달콤한꿀",
  "Super Potion": "좋은상처약",
  "Max Repel": "골드스프레이",
  "Full Heal": "만병통치제",
  Eviolite: "진화의휘석",
  "Light Ball": "전기구슬",
  Lorelei: "칸나",
  "Blue's Provocation": "그린의 도발",
  "Serena's Choice": "세레나의 선택",
  Rika: "칠리",
  "Poké Mart Guy": "프렌들리숍 직원",
  "Rising Star": "호프 트레이너",
  "Abandoned Station": "허름한 스탠드",
};

const KO_PATCH = JSON.parse(fs.readFileSync("scripts/_c1_ko_patch.json", "utf8"));

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
const pokeMoves = JSON.parse(
  fs.readFileSync("app/data/pokeapi_moves_ko_en.json", "utf8")
);

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

// Prefer canonical game/card names over later collisions in the TCG map.
const moveEnToKo = {
  ...reverseMap(moveMap),
  ...reverseMap(finalMoves),
  ...reverseMap(pokeMoves),
};
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
    .replace(/&nbsp;/g, " ")
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

function translateTypes(elementEn) {
  return String(elementEn || "")
    .split("/")
    .map((part) => TYPE_EN_KO[part.trim()] || part.trim())
    .filter(Boolean)
    .join("/");
}

function parseAttackInfo(info, symbolBlob) {
  let rest = String(info || "").trim();
  const letters = String(symbolBlob || "").replace(/[^A-Za-z]/g, "");
  if (letters && rest.toUpperCase().startsWith(letters.toUpperCase())) {
    rest = rest.slice(letters.length).trim();
  } else {
    rest = rest.replace(/^[A-Z]+(?=\s|[A-Z][a-z])/, "").trim();
  }
  const dmgMatch = rest.match(/\s(\d+x?|\d+\+|\d+×)\s*$/i);
  let damage = "";
  let name = rest;
  if (dmgMatch) {
    damage = dmgMatch[1].replace("×", "x");
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

  const paldean = raw.match(/^Paldean\s+(.+)$/i);
  if (paldean) return `팔데아 ${translateBasePokemon(paldean[1])}`;

  return nameEnToKo[lower] || raw;
}

function translateName(enName, isTrainer) {
  const raw = String(enName || "").trim();
  if (!raw) return raw;
  const lower = raw.toLowerCase();
  if (nameEnToKo[lower]) return nameEnToKo[lower];
  if (TRAINER_EN_KO[raw]) return TRAINER_EN_KO[raw];

  const megaEx = raw.match(/^Mega\s+(.+?)\s+ex$/i);
  if (megaEx) {
    const base = translateBasePokemon(megaEx[1]);
    return `메가${base.replace(/\s+/g, "")} ex`;
  }
  const mega = raw.match(/^Mega\s+(.+)$/i);
  if (mega) return `메가${translateBasePokemon(mega[1]).replace(/\s+/g, "")}`;
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
  const s = String(en || "")
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

function hasLatin(value) {
  return /[A-Za-z]/.test(
    String(value || "")
      .replace(/\s*ex$/i, "")
      .replace(/Type:널/i, "")
  );
}

function parseLimitlessCard(html, number) {
  const name = stripTags(
    html.match(/card-text-name[\s\S]*?<a[^>]*>([^<]+)/)?.[1] || ""
  );
  const titleText = stripTags(html.match(/card-text-title">([\s\S]*?)<\/p>/)?.[1]);
  const typeText = stripTags(html.match(/card-text-type">([\s\S]*?)<\/p>/)?.[1]);

  const hp = Number(titleText.match(/(\d+)\s*HP/)?.[1] || 0);
  const elementEn =
    titleText.match(/-\s*([A-Za-z]+(?:\/[A-Za-z]+)?)\s*-\s*\d+\s*HP/i)?.[1] || "";

  const isTrainer = /^Trainer/i.test(typeText);
  const trainerKind = typeText.match(/Trainer\s*-\s*(.+)$/i)?.[1]?.trim() || "";
  const stageEn = typeText.match(/Pokémon\s*-\s*(Basic|Stage 1|Stage 2)/i)?.[1] || "";
  const evolvesFrom = typeText.match(/Evolves from\s+(.+)$/i)?.[1]?.trim() || "";

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
    if (!atkName && !damage && !effect) continue;
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
  const retreat = retreatMatch ? Number(retreatMatch[1]) : 0;

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
    typeText,
  };
}

async function fetchCard(n) {
  const url = `https://pocket.limitlesstcg.com/cards/C1/${n}`;
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url, { headers: UA });
    if (res.ok) return parseLimitlessCard(await res.text(), n);
    await sleep(400 * (attempt + 1));
  }
  throw new Error(`Failed to fetch C1/${n}`);
}

function attributeFromName(enName) {
  if (/^Mega\b/i.test(enName) && /\bex$/i.test(enName)) return "메가ex";
  if (/\bex$/i.test(enName)) return "ex";
  return "";
}

function toPokemonRow(card) {
  const types = translateTypes(card.elementEn);
  const primary = types.split("/")[0] || "무색";
  const 이름 = translateName(card.name, false);
  const 이전이름 = card.evolvesFrom ? translateName(card.evolvesFrom, false) : "";
  const 진화 = STAGE_EN_KO[card.stageEn] || "기본";
  const a1 = card.attacks[0] || {};
  const a2 = card.attacks[1] || {};

  return {
    sheet: SHEET_BY_TYPE[primary] || "일반포켓몬",
    row: {
      타입: types,
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
      약점:
        card.weaknessEn && !/^none$/i.test(card.weaknessEn)
          ? translateTypes(card.weaknessEn)
          : "",
      키워드: "",
      확장팩: EXPANSION_KO,
    },
    enName: card.name,
    en: card,
  };
}

function applyKoPatch(card, entry) {
  const patch = KO_PATCH[String(card.number)];
  if (!patch) return entry;
  entry.row = { ...entry.row, ...patch };
  return entry;
}

function toTrainerRow(card) {
  const kind = TRAINER_TYPE_EN_KO[card.trainerKind] || "아이템";
  const 타입 =
    /fossil/i.test(card.name) || /fossil/i.test(card.trainerKind) ? "화석" : kind;
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
    const aoa = [headers, ...merged.map((r) => headers.map((h) => r[h] ?? ""))];
    wb.Sheets[sheetName] = XLSX.utils.aoa_to_sheet(aoa);
    console.log(`  ${sheetName}: +${newRows.length} (total ${merged.length})`);
  }
}

async function loadCards() {
  const refresh = process.argv.includes("--refresh");
  if (!refresh && fs.existsSync(CACHE_PATH)) {
    const cached = JSON.parse(fs.readFileSync(CACHE_PATH, "utf8"));
    if (Array.isArray(cached) && cached.length >= CARD_COUNT) {
      console.log(`Using cached ${cached.length} cards`);
      return cached;
    }
  }

  const cards = [];
  for (let n = 1; n <= CARD_COUNT; n++) {
    process.stdout.write(`\r  fetch ${n}/${CARD_COUNT}`.padEnd(24));
    cards.push(await fetchCard(n));
    await sleep(70);
  }
  console.log("");
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cards, null, 2));
  return cards;
}

function writeSupplement(entries) {
  const pokemon = {};
  const trainers = {};
  const moves = {};
  const abilities = {};
  const moveEffects = {};
  const abilityEffects = {};

  for (const e of entries) {
    const row = e.row;
    const en = e.en;
    if (en.isTrainer) {
      if (row.이름 && e.enName) trainers[row.이름] = e.enName;
      if (row.기술추가효과 && en.trainerEffect && /[가-힣]/.test(row.기술추가효과)) {
        moveEffects[row.기술추가효과] = en.trainerEffect;
      }
      continue;
    }
    if (row.이름 && e.enName) pokemon[row.이름] = e.enName;
    const atk = en.attacks || [];
    if (row.기술명 && atk[0]?.name && /[가-힣]/.test(row.기술명)) moves[row.기술명] = atk[0].name;
    if (row.기술명2 && atk[1]?.name && /[가-힣]/.test(row.기술명2)) moves[row.기술명2] = atk[1].name;
    if (row.기술추가효과 && atk[0]?.effect && /[가-힣]/.test(row.기술추가효과)) {
      moveEffects[row.기술추가효과] = atk[0].effect;
    }
    if (row.기술추가효과2 && atk[1]?.effect && /[가-힣]/.test(row.기술추가효과2)) {
      moveEffects[row.기술추가효과2] = atk[1].effect;
    }
    const abilityEn = String(en.abilityName || "").replace(/^Ability:\s*/i, "");
    if (row.특성 && abilityEn && /[가-힣]/.test(row.특성)) abilities[row.특성] = abilityEn;
    if (row.특성효과 && en.abilityEffect && /[가-힣]/.test(row.특성효과)) {
      abilityEffects[row.특성효과] = en.abilityEffect;
    }
  }

  const supplement = {
    expansions: { "듀얼 퓨전": "Dual Fusion" },
    pokemon,
    trainers,
    moves,
    abilities,
    moveEffects,
    abilityEffects,
  };
  fs.writeFileSync(
    "app/data/c1_en_supplement.json",
    JSON.stringify(supplement, null, 2) + "\n"
  );
  console.log(
    `Supplement: pokemon ${Object.keys(pokemon).length}, trainers ${Object.keys(trainers).length}, moves ${Object.keys(moves).length}, effects ${Object.keys(moveEffects).length}`
  );
}

async function main() {
  const cards = await loadCards();
  const entries = [];
  const untranslated = [];

  for (const card of cards) {
    if (!card.name) throw new Error(`Missing name for C1/${card.number}`);
    if ((card.attacks || []).length > 2) {
      console.log(`WARN ${card.number} ${card.name} has ${card.attacks.length} attacks`);
    }
    const entry = applyKoPatch(
      card,
      card.isTrainer ? toTrainerRow(card) : toPokemonRow(card)
    );
    const row = entry.row;
    const fields = ["이름", "이전이름", "기술명", "기술명2", "특성", "기술추가효과", "기술추가효과2", "특성효과"];
    for (const field of fields) {
      const value = row[field];
      if (value && hasLatin(value)) {
        untranslated.push(`${card.number} ${field}: ${card.name} => ${value}`);
      }
    }
    entries.push(entry);
  }

  fs.writeFileSync(
    "scripts/_c1_import_preview.json",
    JSON.stringify(
      entries.map((e) => ({
        sheet: e.sheet,
        row: e.row,
        enName: e.enName,
        en: {
          elementEn: e.en?.elementEn,
          attacks: e.en?.attacks,
          abilityName: e.en?.abilityName,
          abilityEffect: e.en?.abilityEffect,
          trainerEffect: e.en?.trainerEffect,
          evolvesFrom: e.en?.evolvesFrom,
          trainerKind: e.en?.trainerKind,
        },
      })),
      null,
      2
    )
  );

  console.log(`Cards: ${entries.length}, untranslated fields: ${untranslated.length}`);
  if (untranslated.length) console.log(untranslated.join("\n"));

  writeSupplement(entries);

  if (process.argv.includes("--preview")) {
    console.log("Preview only. xlsx not written.");
    return;
  }

  const wb = XLSX.readFile("app/data/card_list.xlsx");
  console.log("Writing card_list.xlsx...");
  appendRowsToWorkbook(wb, entries);
  XLSX.writeFile(wb, "app/data/card_list.xlsx");
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
