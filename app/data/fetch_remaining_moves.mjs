import fs from 'fs';

const UA = 'Mozilla/5.0';
const moveMap = JSON.parse(fs.readFileSync('app/data/tcg_move_map.json', 'utf8'));

const manual = [
  ['flabebe-a1a-036', '바라보기'],
  ['farfetchd-a1-198', '파로 때리기'],
  ['farfetchd-a4a-056', '파로 마구 때리기'],
  ['cresselia-ex-promo', null],
];

const slugFetches = [
  ['flabebe-a1a-036', '바라보기'],
  ['farfetchd-a1-198', '파로 때리기'],
  ['farfetchd-a4a-056', '파로 마구 때리기'],
];

// Promo / missing serial — EN names from Pocket TCG / pocketcards community
const promoMoves = {
  '사이코플래시': 'Psycho Flash',
  '스파이럴러시': 'Spiral Rush',
  '사이코빌리': 'Psycho Billow',
  '블랙메탈': 'Black Metal',
  '포튼클로': 'Photon Claw',
  '탈피': 'Shed Skin',
  '드레인 뺨치기': 'Drain Slap',
  '유인하는빛': 'Alluring Light',
  '행복펀치': 'Happy Punch',
  '허리케인펀치': 'Hurricane Punch',
  '자이언트 트위스터': 'Giant Twister',
  '튀어오르기 고수': 'Jumping Master',
  '소닉임펄스': 'Sonic Impulse',
  '차크라피스트': 'Chakra Fist',
  '영양소': 'Nutrients',
  '셀스톰': 'Cell Storm',
  '그라운드 레이저': 'Ground Laser',
  '다이내믹혼': 'Dynamic Horn',
  '불내뿜기': 'Fire Blast',
};

function parseFirstAttack(html) {
  const m = html.match(/href="\/attack\/[^"]+">([^<]+)<\/a>/);
  return m ? m[1].trim() : null;
}

for (const [slug, koMove] of slugFetches) {
  const res = await fetch(`https://pocketcards.net/card/${slug}`, { headers: { 'User-Agent': UA } });
  console.log(slug, res.status);
  if (res.ok) {
    const name = parseFirstAttack(await res.text());
    if (name && koMove) {
      moveMap[koMove] = name;
      console.log(koMove, '->', name);
    }
  }
  await new Promise((r) => setTimeout(r, 250));
}

for (const [ko, en] of Object.entries(promoMoves)) {
  if (!moveMap[ko]) {
    moveMap[ko] = en;
    console.log('promo', ko, '->', en);
  }
}

fs.writeFileSync('app/data/tcg_move_map.json', JSON.stringify(moveMap, null, 2));
