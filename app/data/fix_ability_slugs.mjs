import fs from 'fs';

const UA = 'Mozilla/5.0';
const abilityMap = JSON.parse(fs.readFileSync('app/data/tcg_ability_map.json', 'utf8'));

const fixes = [
  ['rapid-strike-urshifu-b3-051', '더블타입'],
  ['galarian-perrserker-b2-111', '움켜잡기'],
  ['porygon-a1-207', '데이터 스캔'],
  ['porygon2-a4-136', '버그진화'],
];

function parseAbilities(html) {
  const re = /href="\/ability\/[^"]+">([^<]+)<\/a>/g;
  const names = [];
  let m;
  while ((m = re.exec(html))) names.push(m[1].trim());
  return names;
}

for (const [slug, ko] of fixes) {
  const res = await fetch(`https://pocketcards.net/card/${slug}`, { headers: { 'User-Agent': UA } });
  console.log(slug, res.status);
  if (res.ok) {
    const names = parseAbilities(await res.text());
    if (names[0]) {
      abilityMap[ko] = names[0];
      console.log(ko, '->', names[0]);
    }
  }
  await new Promise((r) => setTimeout(r, 300));
}

abilityMap['초승달의 날개옷'] = abilityMap['초승달의 날개옷'] || 'Crescent Wingwear';
abilityMap['선풍 가드'] = abilityMap['선풍 가드'] || 'Gale Guard';

fs.writeFileSync('app/data/tcg_ability_map.json', JSON.stringify(abilityMap, null, 2));
