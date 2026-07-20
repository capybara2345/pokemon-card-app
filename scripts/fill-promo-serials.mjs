/**
 * Fill empty Serial values in card_list.xlsx 프로모 sheet.
 * Matches Korean rows to promo serial IDs via name/HP/type/ex + attack disambiguation.
 */
import fs from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

const species = JSON.parse(fs.readFileSync('app/data/pokeapi_species_ko_en.json', 'utf8'));
const moveMap = JSON.parse(fs.readFileSync('app/data/tcg_move_map.json', 'utf8'));
const cards = JSON.parse(fs.readFileSync('public/data/cards.json', 'utf8'));
const promo = cards.filter((c) => /^p[ab]-/.test(c.id));

const KO_EN = {
  '코코파스': 'Probopass',
  '왕큰부리': 'Toucannon',
  '개구마르': 'Froakie',
  '파비코': 'Swablu',
  '롱스톤': 'Onix',
  '메가요가램 ex': 'Mega Medicham ex',
  '메가요가램': 'Mega Medicham',
  '드니차': 'Frigibax',
  '부르롱': 'Varoom',
  '카르본': 'Charcadet',
  '파라블레이즈 ex': 'Ceruledge ex',
  '자망칼': 'Pawniard',
  '빈티나': 'Feebas',
  '찌르호크': 'Staraptor',
  '초라기': 'Chinchou',
  '돌살이': 'Nosepass',
  '다부니': 'Audino',
  '알로라 질퍽이': 'Alolan Grimer',
  '네크로즈마 새벽의 날개': 'Dawn Wings Necrozma',
  '네크로즈마 황혼의 갈기': 'Dusk Mane Necrozma',
  '울트라네크로즈마 ex': 'Ultra Necrozma ex',
  '메가피죤투 ex': 'Mega Pidgeot ex',
  '메가라티오스 ex': 'Mega Latios ex',
  '메가헤라크로스 ex': 'Mega Heracross ex',
};

const TYPE = {
  물: 'Water',
  격투: 'Fighting',
  초: 'Psychic',
  무색: 'Colorless',
  번개: 'Lightning',
  악: 'Darkness',
  풀: 'Grass',
  불: 'Fire',
  강철: 'Metal',
  드래곤: 'Dragon',
};

/** Confirmed by attack / ability / release order when auto-match is ambiguous */
const MANUAL = {
  Z00011: 'pa-022',
  Z00012: 'pa-030',
  Z00015: 'pa-045', // Iron Defense — Nosepass (sheet name 코코파스 is mislabeled)
  Z00020: 'pa-064',
  Z00033: 'pa-111',
  Z00035: 'pa-114',
  Z00037: 'pa-061',
  Z00041: 'pb-021',
  Z00053: 'pb-053',
  Z00056: 'pb-059', // Shell Armor — Dwebble (sheet name 돌살이 is mislabeled)
  Z00057: 'pb-035',
  Z00060: 'pb-072',
  Z00062: 'pb-075',
};

function enName(ko) {
  if (KO_EN[ko]) return KO_EN[ko];
  const base = ko.replace(/\s+ex$/i, '').trim();
  let en = species[base] || species[ko];
  if (!en) return null;
  if (/\s+ex$/i.test(ko)) en += ' ex';
  return en;
}

function normalizeName(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/\s+ex$/i, '')
    .trim();
}

function matchCandidates(row, used) {
  const ko = row['이름'];
  const en = enName(ko);
  if (!en) return [];
  const hp = String(row.HP);
  const type = TYPE[row['타입']];
  const isEx = /\s+ex$/i.test(ko);
  const baseEn = normalizeName(en);

  return promo.filter((c) => {
    if (used.has(c.id)) return false;
    if (normalizeName(c.name) !== baseEn) return false;
    if (type && c.type !== type) return false;
    if (isEx && c.ex !== 'Yes') return false;
    if (!isEx && c.ex === 'Yes') return false;
    const cardHp = Number(c.health);
    const rowHp = Number(hp);
    if (Number.isFinite(cardHp) && Number.isFinite(rowHp) && Math.abs(cardHp - rowHp) > 10) {
      return false;
    }
    return true;
  });
}

function matchByStats(row, used) {
  const hp = Number(row.HP);
  const type = TYPE[row['타입']];
  if (!Number.isFinite(hp) || !type) return [];

  const koMove = String(row['기술명'] || '').trim();
  const enMove = moveMap[koMove];
  const koAbility = String(row['특성'] || '').trim();
  const abilityHints = {
    조가비갑옷: 'Dwebble',
    철벽: null,
  };

  if (koAbility === '조가비갑옷') {
    const dwebble = promo.find((c) => c.id === 'pb-059' && !used.has(c.id));
    return dwebble ? [dwebble] : [];
  }

  if (koMove === '철벽' && hp === 60 && type === 'Fighting') {
    const nosepass = promo.find((c) => c.id === 'pa-045' && !used.has(c.id));
    return nosepass ? [nosepass] : [];
  }

  if (!enMove) return [];

  return promo.filter((c) => {
    if (used.has(c.id)) return false;
    if (c.type !== type) return false;
    const cardHp = Number(c.health);
    if (Math.abs(cardHp - hp) > 10) return false;
    if (abilityHints[koAbility] && c.name !== abilityHints[koAbility]) return false;
    return true;
  });
}

async function fetchLimitlessMoves(serial) {
  const m = serial.match(/^p([ab])-(\d+)$/i);
  if (!m) return null;
  const set = m[1] === 'a' ? 'P-A' : 'P-B';
  const num = Number(m[2]);
  const url = `https://pocket.limitlesstcg.com/cards/${set}/${num}`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const moves = [...html.matchAll(/card-move-name[^>]*>([^<]+)/g)].map((x) => x[1].trim());
    return moves;
  } catch {
    return null;
  }
}

async function disambiguateByAttack(row, cands) {
  const koMove = String(row['기술명'] || '').trim();
  const enMove = moveMap[koMove];
  if (!enMove || cands.length < 2) return cands;

  const scored = [];
  for (const c of cands) {
    const moves = await fetchLimitlessMoves(c.id);
    await new Promise((r) => setTimeout(r, 150));
    if (!moves?.length) continue;
    const hit = moves.some((m) => m.toLowerCase() === enMove.toLowerCase());
    if (hit) scored.push(c);
  }
  return scored.length ? scored : cands;
}

function updateSheet(wb, updates) {
  const ws = wb.Sheets['프로모'];
  const ref = ws['!ref'];
  if (!ref) throw new Error('프로모 sheet missing');
  const range = XLSX.utils.decode_range(ref);
  const headerRow = [];
  for (let c = range.s.c; c <= range.e.c; c++) {
    const cell = ws[XLSX.utils.encode_cell({ r: range.s.r, c })];
    headerRow.push(cell ? String(cell.v) : '');
  }
  const serialCol = headerRow.indexOf('Serial');
  const idCol = headerRow.indexOf('ID');
  if (serialCol < 0 || idCol < 0) throw new Error('Serial or ID column not found');

  for (let r = range.s.r + 1; r <= range.e.r; r++) {
    const idCell = ws[XLSX.utils.encode_cell({ r, c: idCol })];
    const id = idCell ? String(idCell.v) : '';
    const serial = updates.get(id);
    if (!serial) continue;
    const addr = XLSX.utils.encode_cell({ r, c: serialCol });
    ws[addr] = { t: 's', v: serial };
  }
}

async function main() {
  const wb = XLSX.readFile('app/data/card_list.xlsx');
  const rows = XLSX.utils.sheet_to_json(wb.Sheets['프로모'], { defval: '' });
  const used = new Set(
    rows.map((r) => String(r.Serial || '').trim().toLowerCase()).filter(Boolean),
  );

  const updates = new Map();
  const unresolved = [];

  for (const row of rows) {
    const id = row.ID;
    if (row.Serial) continue;

    if (MANUAL[id]) {
      updates.set(id, MANUAL[id]);
      used.add(MANUAL[id]);
      continue;
    }

    let cands = matchCandidates(row, used);
    if (!cands.length) {
      cands = matchByStats(row, used);
    }
    if (cands.length > 1) {
      cands = await disambiguateByAttack(row, cands);
    }
    if (cands.length === 1) {
      updates.set(id, cands[0].id);
      used.add(cands[0].id);
    } else {
      unresolved.push({
        id,
        name: row['이름'],
        en: enName(row['이름']),
        cands: cands.map((c) => c.id),
      });
    }
  }

  console.log('Updates:', updates.size);
  for (const [id, serial] of [...updates.entries()].sort()) {
    console.log(id, '->', serial);
  }
  if (unresolved.length) {
    console.log('\nUnresolved:', unresolved.length);
    unresolved.forEach((u) => console.log(u.id, u.name, u.en, u.cands.join(',') || 'NONE'));
  }

  if (process.argv.includes('--write') && updates.size) {
    updateSheet(wb, updates);
    XLSX.writeFile(wb, 'app/data/card_list.xlsx');
    console.log('\nWrote app/data/card_list.xlsx');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
