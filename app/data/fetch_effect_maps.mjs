/**
 * Build tcg_move_effect_map.json and tcg_ability_effect_map.json from pocketcards.net
 */
import fs from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');
const { translateEffect } = require('./translation_helpers.js');

const SPECIES = JSON.parse(fs.readFileSync('app/data/pokeapi_species_ko_en.json', 'utf8'));
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

const moveEffectMap = fs.existsSync('app/data/tcg_move_effect_map.json')
  ? JSON.parse(fs.readFileSync('app/data/tcg_move_effect_map.json', 'utf8'))
  : {};
const abilityEffectMap = fs.existsSync('app/data/tcg_ability_effect_map.json')
  ? JSON.parse(fs.readFileSync('app/data/tcg_ability_effect_map.json', 'utf8'))
  : {};

function decodeHtml(s) {
  return s
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&');
}

function slug(koName, serial) {
  const base = String(koName).replace(/\s+ex$/i, '').trim();
  const en = SPECIES[base] || base;
  const nameSlug = en
    .toLowerCase()
    .replace(/['.]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const serialSlug = String(serial || '').trim().toLowerCase();
  if (!serialSlug) return null;
  const ex = /\s+ex$/i.test(String(koName || '')) ? '-ex' : '';
  return `${nameSlug}${ex}-${serialSlug}`;
}

function parsePage(html) {
  const attacks = [];
  const linkRe = /href="\/attack\/[^"]+">([^<]+)<\/a>/g;
  let m;
  while ((m = linkRe.exec(html))) {
    const chunk = html.slice(m.index, m.index + 1200);
    const eff = chunk.match(/<div class="mt-2"><span[^>]*><span>([\s\S]*?)<\/span>/);
    attacks.push({ effect: eff ? decodeHtml(eff[1].trim()) : '' });
  }
  const abilities = [];
  const abilityRe =
    /href="\/ability\/[^"]+">([^<]+)<\/a><\/span><span[^>]*><span>([\s\S]*?)<\/span>/g;
  while ((m = abilityRe.exec(html))) {
    abilities.push({ effect: decodeHtml(m[2].trim()) });
  }
  return { attacks, abilities };
}

const wb = XLSX.readFile('app/data/card_list.xlsx');
const jobs = new Map();
const hangul = /[가-힣]/;

for (const sheetName of wb.SheetNames) {
  if (sheetName === '추천덱') continue;
  for (const row of XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '' })) {
    const serial = String(row.Serial || '').trim().toLowerCase();
    if (!serial) continue;
    const moveEffects = [row['기술추가효과'], row['기술추가효과2']].map((x) => String(x || '').trim()).filter(Boolean);
    const abilityEffect = String(row['특성효과'] || '').trim();
    const needsMove = moveEffects.some((e) => hangul.test(e) && !moveEffectMap[e] && hangul.test(translateEffect(e, {}, {})));
    const needsAb =
      abilityEffect &&
      !abilityEffectMap[abilityEffect] &&
      hangul.test(translateEffect(abilityEffect, {}, {}));
    if (!needsMove && !needsAb) continue;
    if (!jobs.has(serial)) {
      jobs.set(serial, {
        serial,
        name: row['이름'],
        moveEffects,
        abilityEffect,
      });
    }
  }
}

console.log('Cards to fetch for effects:', jobs.size);
let i = 0;
let mapped = 0;

for (const job of jobs.values()) {
  i++;
  const s = slug(job.name, job.serial);
  if (!s) continue;
  try {
    const res = await fetch(`https://pocketcards.net/card/${s}`, { headers: { 'User-Agent': UA } });
    if (!res.ok) continue;
    const parsed = parsePage(await res.text());
    job.moveEffects.forEach((koEff, idx) => {
      const enEff = parsed.attacks[idx]?.effect;
      if (koEff && enEff && !moveEffectMap[koEff]) {
        moveEffectMap[koEff] = enEff;
        mapped++;
      }
    });
    if (job.abilityEffect && parsed.abilities[0]?.effect && !abilityEffectMap[job.abilityEffect]) {
      abilityEffectMap[job.abilityEffect] = parsed.abilities[0].effect;
      mapped++;
    }
  } catch {
    /* skip */
  }
  if (i % 50 === 0) {
    fs.writeFileSync('app/data/tcg_move_effect_map.json', JSON.stringify(moveEffectMap, null, 2));
    fs.writeFileSync('app/data/tcg_ability_effect_map.json', JSON.stringify(abilityEffectMap, null, 2));
    console.log(`Progress ${i}/${jobs.size} mapped=${mapped} me=${Object.keys(moveEffectMap).length} ae=${Object.keys(abilityEffectMap).length}`);
  }
  await new Promise((r) => setTimeout(r, 120));
}

fs.writeFileSync('app/data/tcg_move_effect_map.json', JSON.stringify(moveEffectMap, null, 2));
fs.writeFileSync('app/data/tcg_ability_effect_map.json', JSON.stringify(abilityEffectMap, null, 2));
console.log('Done mapped', mapped, 'moveEffects', Object.keys(moveEffectMap).length, 'abilityEffects', Object.keys(abilityEffectMap).length);
