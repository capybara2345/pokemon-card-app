/**
 * Scrape pocketcards.net for EN move/ability names and effect text,
 * paired with Korean card_list.xlsx via Serial + species slug.
 */
import fs from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
const SPECIES = JSON.parse(fs.readFileSync('app/data/pokeapi_species_ko_en.json', 'utf8'));
const { translateMove, translateAbility, translateEffect } = require('./translation_helpers.js');

const moveMapPath = 'app/data/tcg_move_map.json';
const abilityMapPath = 'app/data/tcg_ability_map.json';
const moveEffectMapPath = 'app/data/tcg_move_effect_map.json';
const abilityEffectMapPath = 'app/data/tcg_ability_effect_map.json';

const moveMap = fs.existsSync(moveMapPath)
  ? JSON.parse(fs.readFileSync(moveMapPath, 'utf8'))
  : {};
const abilityMap = fs.existsSync(abilityMapPath)
  ? JSON.parse(fs.readFileSync(abilityMapPath, 'utf8'))
  : {};
const moveEffectMap = fs.existsSync(moveEffectMapPath)
  ? JSON.parse(fs.readFileSync(moveEffectMapPath, 'utf8'))
  : {};
const abilityEffectMap = fs.existsSync(abilityEffectMapPath)
  ? JSON.parse(fs.readFileSync(abilityEffectMapPath, 'utf8'))
  : {};

function decodeHtml(s) {
  return s
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function slugFromKoName(koName, serial) {
  const base = String(koName || '').replace(/\s+ex$/i, '').trim();
  const en = SPECIES[base] || base;
  const nameSlug = en
    .toLowerCase()
    .replace(/['.]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const serialSlug = String(serial || '').trim().toLowerCase();
  const ex = /\s+ex$/i.test(String(koName || '')) ? '-ex' : '';
  return `${nameSlug}${ex}-${serialSlug}`;
}

function parseCardPage(html) {
  const attacks = [];
  const linkRe = /href="\/attack\/[^"]+">([^<]+)<\/a>/g;
  let m;
  while ((m = linkRe.exec(html))) {
    const chunk = html.slice(m.index, m.index + 1200);
    const eff = chunk.match(/<div class="mt-2"><span[^>]*><span>([\s\S]*?)<\/span>/);
    attacks.push({
      name: decodeHtml(m[1].trim()),
      effect: eff ? decodeHtml(eff[1].trim()) : '',
    });
  }

  const abilities = [];
  const abilityRe =
    /href="\/ability\/[^"]+">([^<]+)<\/a><\/span><span[^>]*><span>([\s\S]*?)<\/span>/g;
  while ((m = abilityRe.exec(html))) {
    abilities.push({ name: decodeHtml(m[1].trim()), effect: decodeHtml(m[2].trim()) });
  }

  return { attacks, abilities };
}

function needsWork(row) {
  const moves = [row['기술명'], row['기술명2']].filter(Boolean);
  const ab = row['특성'];
  const me = [row['기술추가효과'], row['기술추가효과2']].filter(Boolean);
  const ae = row['특성효과'];
  if (moves.some((x) => /[가-힣]/.test(translateMove(x)))) return true;
  if (ab && /[가-힣]/.test(translateAbility(ab))) return true;
  if (me.some((x) => /[가-힣]/.test(translateEffect(x, {}, {})))) return true;
  if (ae && /[가-힣]/.test(translateEffect(ae, {}, {}))) return true;
  return false;
}

async function fetchPage(slug) {
  const res = await fetch(`https://pocketcards.net/card/${slug}`, {
    headers: { 'User-Agent': UA },
  });
  if (!res.ok) return null;
  return parseCardPage(await res.text());
}

async function main() {
  const wb = XLSX.readFile('app/data/card_list.xlsx');
  const jobs = new Map();

  for (const sheetName of wb.SheetNames) {
    if (sheetName === '추천덱') continue;
    for (const row of XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '' })) {
      if (!needsWork(row)) continue;
      const serial = String(row.Serial || '').trim().toLowerCase();
      if (!serial) continue;
      const key = serial;
      if (!jobs.has(key)) {
        jobs.set(key, {
          serial,
          koName: row['이름'],
          moves: [row['기술명'], row['기술명2']].map((x) => String(x || '').trim()).filter(Boolean),
          moveEffects: [row['기술추가효과'], row['기술추가효과2']].map((x) => String(x || '').trim()).filter(Boolean),
          ability: String(row['특성'] || '').trim(),
          abilityEffect: String(row['특성효과'] || '').trim(),
        });
      }
    }
  }

  console.log('Cards to fetch:', jobs.size);
  let i = 0;
  let ok = 0;
  let fail = 0;

  for (const job of jobs.values()) {
    i++;
    const slug = slugFromKoName(job.koName, job.serial);
    try {
      const parsed = await fetchPage(slug);
      if (!parsed) {
        fail++;
        if (i % 25 === 0) console.log(`[${i}/${jobs.size}] miss ${slug}`);
        await new Promise((r) => setTimeout(r, 120));
        continue;
      }
      ok++;

      job.moves.forEach((ko, idx) => {
        if (ko && parsed.attacks[idx]?.name && !moveMap[ko]) {
          moveMap[ko] = parsed.attacks[idx].name;
        }
        const koEff = job.moveEffects[idx];
        const enEff = parsed.attacks[idx]?.effect;
        if (koEff && enEff && !moveEffectMap[koEff]) moveEffectMap[koEff] = enEff;
      });

      if (job.ability && parsed.abilities[0]?.name && !abilityMap[job.ability]) {
        abilityMap[job.ability] = parsed.abilities[0].name;
      }
      if (job.abilityEffect && parsed.abilities[0]?.effect && !abilityEffectMap[job.abilityEffect]) {
        abilityEffectMap[job.abilityEffect] = parsed.abilities[0].effect;
      }
    } catch (e) {
      fail++;
      console.warn(slug, e.message);
    }

    if (i % 40 === 0) {
      fs.writeFileSync(moveMapPath, JSON.stringify(moveMap, null, 2));
      fs.writeFileSync(abilityMapPath, JSON.stringify(abilityMap, null, 2));
      fs.writeFileSync(moveEffectMapPath, JSON.stringify(moveEffectMap, null, 2));
      fs.writeFileSync(abilityEffectMapPath, JSON.stringify(abilityEffectMap, null, 2));
      console.log(`Progress ${i}/${jobs.size} ok=${ok} fail=${fail} maps: moves=${Object.keys(moveMap).length} ab=${Object.keys(abilityMap).length} me=${Object.keys(moveEffectMap).length} ae=${Object.keys(abilityEffectMap).length}`);
    }
    await new Promise((r) => setTimeout(r, 130));
  }

  fs.writeFileSync(moveMapPath, JSON.stringify(moveMap, null, 2));
  fs.writeFileSync(abilityMapPath, JSON.stringify(abilityMap, null, 2));
  fs.writeFileSync(moveEffectMapPath, JSON.stringify(moveEffectMap, null, 2));
  fs.writeFileSync(abilityEffectMapPath, JSON.stringify(abilityEffectMap, null, 2));
  console.log('Done', { ok, fail, moves: Object.keys(moveMap).length, abilities: Object.keys(abilityMap).length, moveEffects: Object.keys(moveEffectMap).length, abilityEffects: Object.keys(abilityEffectMap).length });
}

main();
