/** Fetch EN move names for the 54 cards still missing from tcg_move_map. */
import fs from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const SPECIES = JSON.parse(fs.readFileSync('app/data/pokeapi_species_ko_en.json', 'utf8'));
const cards = JSON.parse(fs.readFileSync('app/data/missing_move_cards.json', 'utf8'));
const moveMap = JSON.parse(fs.readFileSync('app/data/tcg_move_map.json', 'utf8'));

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

function slug(koName, serial) {
  const base = String(koName).replace(/\s+ex$/i, '').trim();
  const en = SPECIES[base] || base;
  const nameSlug = en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const ex = /\s+ex$/i.test(koName) ? '-ex' : '';
  return `${nameSlug}${ex}-${String(serial).toLowerCase()}`;
}

function parseAttacks(html) {
  const attacks = [];
  const linkRe = /href="\/attack\/[^"]+">([^<]+)<\/a>/g;
  let m;
  while ((m = linkRe.exec(html))) {
    const chunk = html.slice(m.index, m.index + 400);
    attacks.push(m[1].trim());
  }
  return attacks;
}

let mapped = 0;
for (const { serial, name, move } of cards) {
  const s = slug(name, serial);
  try {
    const res = await fetch(`https://pocketcards.net/card/${s}`, { headers: { 'User-Agent': UA } });
    if (!res.ok) {
      console.warn('MISS', s, res.status);
      continue;
    }
    const attacks = parseAttacks(await res.text());
    const idx = [move].length === 1 ? 0 : 0;
    if (attacks[0] && !moveMap[move]) {
      moveMap[move] = attacks[0];
      mapped++;
      console.log(move, '->', attacks[0]);
    }
  } catch (e) {
    console.warn(s, e.message);
  }
  await new Promise((r) => setTimeout(r, 200));
}

fs.writeFileSync('app/data/tcg_move_map.json', JSON.stringify(moveMap, null, 2));
console.log('Added', mapped);
