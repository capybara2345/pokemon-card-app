/** Second pass: fetch effect text for any KO effect string not yet in maps. */
import fs from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

const SPECIES = JSON.parse(fs.readFileSync('app/data/pokeapi_species_ko_en.json', 'utf8'));
const moveEffectMap = JSON.parse(fs.readFileSync('app/data/tcg_move_effect_map.json', 'utf8'));
const abilityEffectMap = JSON.parse(fs.readFileSync('app/data/tcg_ability_effect_map.json', 'utf8'));
const UA = 'Mozilla/5.0';

function decodeHtml(s) {
  return s.replace(/&#x27;/g, "'").replace(/&amp;/g, '&');
}

function slug(koName, serial) {
  const base = String(koName).replace(/\s+ex$/i, '').trim();
  const en = SPECIES[base] || base;
  const nameSlug = en
    .toLowerCase()
    .replace(/['.]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const ex = /\s+ex$/i.test(String(koName || '')) ? '-ex' : '';
  return `${nameSlug}${ex}-${String(serial).toLowerCase()}`;
}

function parsePage(html) {
  const attacks = [];
  const linkRe = /href="\/attack\/[^"]+">([^<]+)<\/a>/g;
  let m;
  while ((m = linkRe.exec(html))) {
    const chunk = html.slice(m.index, m.index + 1200);
    const eff = chunk.match(/<div class="mt-2"><span[^>]*><span>([\s\S]*?)<\/span>/);
    attacks.push(eff ? decodeHtml(eff[1].trim()) : '');
  }
  const abilities = [];
  const abilityRe =
    /href="\/ability\/[^"]+">([^<]+)<\/a><\/span><span[^>]*><span>([\s\S]*?)<\/span>/g;
  while ((m = abilityRe.exec(html))) {
    abilities.push(decodeHtml(m[2].trim()));
  }
  return { attacks, abilities };
}

const wb = XLSX.readFile('app/data/card_list.xlsx');
const jobs = new Map();

for (const sheetName of wb.SheetNames) {
  if (sheetName === '추천덱') continue;
  for (const row of XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '' })) {
    const serial = String(row.Serial || '').trim().toLowerCase();
    if (!serial) continue;
    const moveEffects = [row['기술추가효과'], row['기술추가효과2']].map((x) => String(x || '').trim()).filter(Boolean);
    const abilityEffect = String(row['특성효과'] || '').trim();
    const need =
      moveEffects.some((e) => e && !moveEffectMap[e]) ||
      (abilityEffect && !abilityEffectMap[abilityEffect]);
    if (!need) continue;
    jobs.set(serial, {
      serial,
      name: row['이름'],
      moveEffects,
      abilityEffect,
    });
  }
}

console.log('Jobs missing effect maps:', jobs.size);
let mapped = 0;
let i = 0;

for (const job of jobs.values()) {
  i++;
  const s = slug(job.name, job.serial);
  try {
    const res = await fetch(`https://pocketcards.net/card/${s}`, { headers: { 'User-Agent': UA } });
    if (!res.ok) {
      console.warn('MISS', s);
      continue;
    }
    const parsed = parsePage(await res.text());
    job.moveEffects.forEach((koEff, idx) => {
      const enEff = parsed.attacks[idx];
      if (koEff && enEff && !moveEffectMap[koEff]) {
        moveEffectMap[koEff] = enEff;
        mapped++;
      }
    });
    if (job.abilityEffect && parsed.abilities[0] && !abilityEffectMap[job.abilityEffect]) {
      abilityEffectMap[job.abilityEffect] = parsed.abilities[0];
      mapped++;
    }
  } catch (e) {
    console.warn(s, e.message);
  }
  if (i % 40 === 0) {
    fs.writeFileSync('app/data/tcg_move_effect_map.json', JSON.stringify(moveEffectMap, null, 2));
    fs.writeFileSync('app/data/tcg_ability_effect_map.json', JSON.stringify(abilityEffectMap, null, 2));
    console.log(`Progress ${i}/${jobs.size} mapped=${mapped}`);
  }
  await new Promise((r) => setTimeout(r, 120));
}

fs.writeFileSync('app/data/tcg_move_effect_map.json', JSON.stringify(moveEffectMap, null, 2));
fs.writeFileSync('app/data/tcg_ability_effect_map.json', JSON.stringify(abilityEffectMap, null, 2));
console.log('Done', mapped, Object.keys(moveEffectMap).length, Object.keys(abilityEffectMap).length);
