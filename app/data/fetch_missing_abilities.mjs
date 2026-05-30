/** Fetch EN ability names for cards whose ability is still Korean in translation. */
import fs from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');
const { translateAbility } = require('./translation_helpers.js');

const SPECIES = JSON.parse(fs.readFileSync('app/data/pokeapi_species_ko_en.json', 'utf8'));
const abilityMap = fs.existsSync('app/data/tcg_ability_map.json')
  ? JSON.parse(fs.readFileSync('app/data/tcg_ability_map.json', 'utf8'))
  : {};

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
const hangul = /[가-힣]/;

function slug(koName, serial) {
  const base = String(koName).replace(/\s+ex$/i, '').trim();
  const en = SPECIES[base] || base;
  const nameSlug = en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const ex = /\s+ex$/i.test(koName) ? '-ex' : '';
  return `${nameSlug}${ex}-${String(serial).toLowerCase()}`;
}

function parseAbilities(html) {
  const abilities = [];
  const re = /href="\/ability\/[^"]+">([^<]+)<\/a>/g;
  let m;
  while ((m = re.exec(html))) abilities.push(m[1].trim());
  return abilities;
}

const wb = XLSX.readFile('app/data/card_list.xlsx');
const jobs = new Map();
for (const sheetName of wb.SheetNames) {
  if (sheetName === '추천덱') continue;
  for (const row of XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '' })) {
    const ab = String(row['특성'] || '').trim();
    if (!ab || !hangul.test(translateAbility(ab))) continue;
    if (!jobs.has(ab)) {
      jobs.set(ab, { serial: row.Serial, name: row['이름'], ability: ab });
    }
  }
}

console.log('Unique abilities:', jobs.size);
let mapped = 0;
for (const job of jobs.values()) {
  const s = slug(job.name, job.serial);
  try {
    const res = await fetch(`https://pocketcards.net/card/${s}`, { headers: { 'User-Agent': UA } });
    if (!res.ok) {
      console.warn('MISS', s, job.ability);
      continue;
    }
    const names = parseAbilities(await res.text());
    if (names[0] && !abilityMap[job.ability]) {
      abilityMap[job.ability] = names[0];
      mapped++;
      console.log(job.ability, '->', names[0]);
    }
  } catch (e) {
    console.warn(s, e.message);
  }
  await new Promise((r) => setTimeout(r, 200));
}

fs.writeFileSync('app/data/tcg_ability_map.json', JSON.stringify(abilityMap, null, 2));
console.log('Added', mapped, 'total', Object.keys(abilityMap).length);
