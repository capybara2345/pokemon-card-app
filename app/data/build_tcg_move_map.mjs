/**
 * Build TCG Pocket move map (KO -> EN) via Game8 card pages.
 * One Game8 fetch per unique (serial, move-set) pair.
 */
import fs from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
const OUT = 'app/data/tcg_move_map.json';
const CACHE = 'app/data/game8_archive_cache.json';

const wb = XLSX.readFile('app/data/card_list.xlsx');
const cards = JSON.parse(fs.readFileSync('public/data/cards.json', 'utf8'));
const cardBySerial = new Map(cards.map((c) => [c.id.toLowerCase(), c]));

const moveMap = {
  ...JSON.parse(fs.readFileSync('app/data/pokeapi_moves_ko_en.json', 'utf8')),
  ...JSON.parse(fs.readFileSync('app/data/final_move_map.json', 'utf8')),
};
if (fs.existsSync(OUT)) Object.assign(moveMap, JSON.parse(fs.readFileSync(OUT, 'utf8')));

const archiveCache = fs.existsSync(CACHE)
  ? JSON.parse(fs.readFileSync(CACHE, 'utf8'))
  : {};

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

async function resolveArchiveId(enName) {
  const key = enName.replace(/\s+ex$/i, '').trim();
  if (archiveCache[key]) return archiveCache[key];
  const html = await fetchText(`https://game8.co/search?q=${encodeURIComponent(key + ' Pokemon TCG Pocket')}`);
  const m = html.match(/\/games\/Pokemon-TCG-Pocket\/archives\/(\d+)/);
  if (!m) return null;
  archiveCache[key] = m[1];
  return m[1];
}

function parseGame8Moves(html) {
  const moves = [];
  const re = /<div>([^<]+)<\/div><\/div><\/th>\s*<\/tr>\s*<tr>\s*<td>\s*<b class='a-bold'>Effect<\/b>:\s*([^<]+)/gi;
  let m;
  while ((m = re.exec(html))) {
    moves.push(m[1].trim());
  }
  return moves;
}

function collectGroups() {
  const groups = new Map();
  for (const sheetName of wb.SheetNames) {
    if (sheetName === '추천덱') continue;
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '' });
    for (const row of rows) {
      const serial = String(row.Serial || '').trim().toLowerCase();
      const enCard = cardBySerial.get(serial);
      if (!enCard) continue;
      const koMoves = [row['기술명'], row['기술명2']].map((x) => String(x || '').trim()).filter(Boolean);
      if (!koMoves.length || koMoves.every((m) => moveMap[m])) continue;
      const key = `${serial}::${koMoves.join('|')}`;
      if (!groups.has(key)) {
        groups.set(key, { serial, enName: enCard.name, koMoves });
      }
    }
  }
  return [...groups.values()];
}

async function main() {
  const groups = collectGroups();
  console.log('Groups to fetch:', groups.length);
  let mapped = 0;
  let fetched = 0;

  for (const group of groups) {
    if (group.koMoves.every((m) => moveMap[m])) continue;
    try {
      const archiveId = await resolveArchiveId(group.enName);
      if (!archiveId) {
        console.warn('No archive for', group.enName);
        continue;
      }
      const html = await fetchText(`https://game8.co/games/Pokemon-TCG-Pocket/archives/${archiveId}`);
      const enMoves = parseGame8Moves(html);
      fetched++;
      if (enMoves.length >= group.koMoves.length) {
        group.koMoves.forEach((ko, i) => {
          if (!moveMap[ko] && enMoves[i]) {
            moveMap[ko] = enMoves[i];
            mapped++;
          }
        });
      } else {
        console.warn('Move count mismatch', group.enName, group.koMoves, enMoves);
      }
    } catch (e) {
      console.warn('Error', group.enName, e.message);
    }

    if (fetched % 20 === 0) {
      fs.writeFileSync(OUT, JSON.stringify(moveMap, null, 2));
      fs.writeFileSync(CACHE, JSON.stringify(archiveCache, null, 2));
      console.log(`Fetched ${fetched}, mapped ${mapped}, total keys ${Object.keys(moveMap).length}`);
    }
    await new Promise((r) => setTimeout(r, 250));
  }

  fs.writeFileSync(OUT, JSON.stringify(moveMap, null, 2));
  fs.writeFileSync(CACHE, JSON.stringify(archiveCache, null, 2));
  console.log('Done. fetched', fetched, 'new mappings', mapped, 'total', Object.keys(moveMap).length);
}

main();
