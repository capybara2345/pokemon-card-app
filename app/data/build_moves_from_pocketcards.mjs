/**
 * Build TCG move map from pocketcards.net card pages (EN attack names)
 * paired with Korean moves from card_list.xlsx via Serial.
 */
import fs from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
const OUT = 'app/data/tcg_move_map.json';

const wb = XLSX.readFile('app/data/card_list.xlsx');
const cards = JSON.parse(fs.readFileSync('public/data/cards.json', 'utf8'));
const cardBySerial = new Map(cards.map((c) => [c.id.toLowerCase(), c]));

const moveMap = {
  ...JSON.parse(fs.readFileSync('app/data/pokeapi_moves_ko_en.json', 'utf8')),
  ...JSON.parse(fs.readFileSync('app/data/final_move_map.json', 'utf8')),
};

function slugFromSerial(serial) {
  const card = cardBySerial.get(serial);
  if (!card) return null;
  const nameSlug = card.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${nameSlug}-${serial}`;
}

function parseAttacks(html) {
  const attacks = [];
  const re = /href="\/attack\/[^"]+">([^<]+)<\/a>/g;
  let m;
  while ((m = re.exec(html))) {
    const name = m[1].trim();
    if (name && !attacks.includes(name)) attacks.push(name);
  }
  return attacks;
}

async function fetchAttacks(serial) {
  const slug = slugFromSerial(serial);
  if (!slug) return null;
  const url = `https://pocketcards.net/card/${slug}`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) return null;
  const html = await res.text();
  return parseAttacks(html);
}

async function main() {
  const groups = new Map();
  for (const sheetName of wb.SheetNames) {
    if (sheetName === '추천덱') continue;
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '' });
    for (const row of rows) {
      const serial = String(row.Serial || '').trim().toLowerCase();
      if (!cardBySerial.has(serial)) continue;
      const koMoves = [row['기술명'], row['기술명2']].map((x) => String(x || '').trim()).filter(Boolean);
      if (!koMoves.length || koMoves.every((m) => moveMap[m])) continue;
      const key = `${serial}::${koMoves.join('|')}`;
      if (!groups.has(key)) groups.set(key, { serial, koMoves });
    }
  }

  console.log('Groups:', groups.size);
  let mapped = 0;
  let i = 0;
  for (const { serial, koMoves } of groups.values()) {
    i++;
    if (koMoves.every((m) => moveMap[m])) continue;
    try {
      const enMoves = await fetchAttacks(serial);
      if (enMoves?.length >= koMoves.length) {
        koMoves.forEach((ko, idx) => {
          if (!moveMap[ko] && enMoves[idx]) {
            moveMap[ko] = enMoves[idx];
            mapped++;
          }
        });
      }
    } catch (e) {
      console.warn(serial, e.message);
    }
    if (i % 50 === 0) {
      fs.writeFileSync(OUT, JSON.stringify(moveMap, null, 2));
      console.log(`Progress ${i}/${groups.size}, mapped ${mapped}, keys ${Object.keys(moveMap).length}`);
    }
    await new Promise((r) => setTimeout(r, 150));
  }

  fs.writeFileSync(OUT, JSON.stringify(moveMap, null, 2));
  console.log('Done mapped', mapped, 'total keys', Object.keys(moveMap).length);
}

main();
