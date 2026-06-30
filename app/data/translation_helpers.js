const path = require('path');

const SPECIES_API = require('./pokeapi_species_ko_en.json');
const MOVES_API = require('./pokeapi_moves_ko_en.json');
const ABILITIES_API = require('./pokeapi_abilities_ko_en.json');
const MOVES_LOCAL = require('./final_move_map.json');
const TRAINER_MAP = require('./trainer_map.json');
const KEYWORD_MAP = require('./keyword_map.json');
const B3B_SUPPLEMENT = require('./b3b_en_supplement.json');

Object.assign(TRAINER_MAP, B3B_SUPPLEMENT.trainers || {});
Object.assign(KEYWORD_MAP, B3B_SUPPLEMENT.keywords || {});

Object.assign(TRAINER_MAP, {
  '부스트에너지 고대': 'Ancient Booster Energy Capsule',
  '부스트에너지 미래': 'Future Booster Energy Capsule',
  '에리어 제로': 'Area Zero',
  '올림박사': 'Professor Sada',
  '투로박사': 'Professor Turo',
  '푸름': 'Juliana',
});

const ADDON_POKEMON = {
  '메가나무킹': 'Mega Sceptile', '메가나무킹 ex': 'Mega Sceptile ex',
  '꼬몽울': 'Budew', '두르보': 'Sewaddle', '두르쿤': 'Swadloon', '모아머': 'Leavanny', '애프룡': 'Flapple',
  '사나운버섯': 'Brute Bonnet', '땅을기는날개': 'Slither Wing',
  '둔타': 'Numel', '폭타': 'Camerupt', '메가폭타': 'Mega Camerupt', '메가폭타 ex': 'Mega Camerupt ex',
  '캐스퐁': 'Castform', '캐스퐁 태양의 모습': 'Castform Sunny Form',
  '캐스퐁 빗방울의 모습': 'Castform Rainy Form', '캐스퐁 설운의 모습': 'Castform Snowy Form',
  '비크티니': 'Victini', '뚜꾸리': 'Tepig', '차오꿀': 'Pignite', '염무왕': 'Emboar', '무쇠독나방': 'Iron Moth',
  '진주몽': 'Clamperl', '헌테일': 'Huntail', '분홍장이': 'Gorebyss',
  '코고미': 'Cubchoo', '툰베어': 'Beartic', '울머기': 'Sobble', '누겔레온': 'Drizzile', '인텔리레온': 'Inteleon',
  '연격 우라오스': 'Rapid Strike Urshifu', '일격 우라오스': 'Single Strike Urshifu',
  '가라르 나이킹': 'Galarian Perrserker',
  '무쇠보따리': 'Iron Bundle', '무쇠보따리 ex': 'Iron Bundle ex',
  '제크로무': 'Zekrom', '무쇠손': 'Iron Hands', '무쇠가시': 'Iron Thorns',
  '냐스퍼': 'Espurr', '냐오닉스': 'Meowstic', '디안시': 'Diancie',
  '몸지브림': 'Hatenna', '손지브림': 'Hattrem', '브리무음': 'Hatterene',
  '우렁찬꼬리': 'Scream Tail', '날개치는머리': 'Flutter Mane', '날개치는머리 ex': 'Flutter Mane ex',
  '무쇠무인': 'Iron Valiant', '무쇠잎새': 'Iron Leaves', '무쇠암석': 'Iron Boulder', '무쇠감투': 'Iron Crown',
  '톱치': 'Trapinch', '꼬지지': 'Bonsly', '던지미': 'Throh', '타격귀': 'Sawk',
  '모래뱀': 'Silicobra', '사다이사': 'Sandaconda', '치고마': 'Kubfu',
  '베베솔트': 'Nacli', '스태솔트': 'Naclstack', '콜로솔트': 'Garganacl',
  '위대한엄니': 'Great Tusk', '모래털가죽': 'Sandy Shocks',
  '깜놀버섯': 'Foongus', '뽀록나': 'Amoonguss', '벌차이': 'Vullaby', '버랜지나': 'Mandibuzz',
  '자루도': 'Zoroark', '절각참': 'Bisharp', '대도각참': 'Kingambit',
  '초롱순': 'Glimmet', '킬라플로르': 'Glimmora', '무쇠머리': 'Iron Jugulis', '고동치는달': 'Roaring Moon',
  '끼리동': 'Cufant', '대왕끼리동': 'Copperajah', '무쇠바퀴': 'Iron Treads',
  '비브라바': 'Vibrava', '플라이곤': 'Flygon', '플라이곤 ex': 'Flygon ex',
  '굽이치는물결': 'Walking Wake', '꿰뚫는화염': 'Gouging Fire', '날뛰는우레': 'Raging Bolt',
  '메가다부니': 'Mega Audino', '메가다부니 ex': 'Mega Audino ex', '다부니': 'Audino',
  '키키링': 'Farigiraf', '노고고치': 'Dudunsparce',
  '테라파고스': 'Terapagos', '테라파고스 ex': 'Terapagos ex',
  '지가르데': 'Zygarde', '지가르데 ex': 'Zygarde ex',
  '메가헤라크로스': 'Mega Heracross', '메가헤라크로스 ex': 'Mega Heracross ex',
  ...(B3B_SUPPLEMENT.pokemon || {}),
};

const TCG_ABILITIES = {
  '파우더 힐': 'Powder Heal', '향기의 덫': 'Sweet Scent Trap', '밀림의 주인': 'Jungle Totem',
  '향기로운 화원': 'Fragrant Flower Garden', '파워 링크': 'Power Link', '숲의 숨결': 'Forest Breath',
  '도망태세': 'Run Away Stance', '코튼플라이트': 'Cotton Fluff', '단단한 껍질': 'Solid Shell',
  '의욕후르츠': 'Motivation Fruits', '터프니스 아로마': 'Toughness Aroma', '매혹의 리듬': 'Alluring Rhythm',
  '트랩 테리터리': 'Trap Territory', '평온의 바람': 'Calming Wind', '엑스트라 힐': 'Extra Heal',
  '타임리콜': 'Timely Call', '스피드 링크': 'Speed Link', '번 업': 'Burn Up', '버닝브레스': 'Burning Breath',
  '전설의고동': 'Legendary Pulse', '액션 보이스': 'Action Voice', '철갑': 'Ironclad',
  '반격': 'Counterattack', '물수리비': 'Downpour', '날려보내기': 'Blow Away',
  '크리스탈 바디': 'Crystal Body', '버블 링크': 'Bubble Link', '써노 서드': 'Thermo Third',
  '철수 지원': 'Retreat Support', '멜로디 가든': 'Melody Garden', '거친집게': 'Rough Pincers',
  '치유의문': 'Healing Door', '벌벌바디': 'Buzzing Body', '에너지변환': 'Energy Conversion',
  '껍질실드': 'Shell Shield', '메이지 메이커': 'Mage Maker', '어붙기': 'Adhesive',
  '더블샷': 'Double Shot', '볼트 차지': 'Bolt Charge', '가드 링크': 'Guard Link',
  '서비스 니': 'Service Knee', '번개 광': 'Lightning Flash', '전자파': 'Electromagnetic Wave',
  '전설의 진격': 'Legendary Assault', '그림자 박': 'Shadow Step', '흡듦의 축복': 'Blessing of Absorption',
  'CHECK [체크]': 'CHECK', '성공의 징표': 'Mark of Success', '플라즈마 커넥트': 'Plasma Connect',
  '신비의부적': 'Safeguard', '이그니션': 'Ignition', '더블타입': 'Double Type',
  '움켜잡기': 'Dig Up', '데이터 스캔': 'Data Scan', '버그진화': 'Bug Evolution',
  '초승달의 날개옷': 'Crescent Wingwear', '선풍 가드': 'Gale Guard',
  '피피 리본': 'Pipi Ribbon', '늘어남 축복': 'Blessing of Growth', '피코힐': 'Piko Heal',
  'GUARD [가드]': 'GUARD', 'POWER [파워]': 'POWER', '새로운 착지체크': 'New Landing Check',
};

const ENERGY = {
  '풀': 'Grass', '불': 'Fire', '물': 'Water', '번개': 'Lightning',
  '초': 'Psychic', '격투': 'Fighting', '악': 'Darkness',
  '강철': 'Metal', '드래곤': 'Dragon', '무색': 'Colorless',
};

const ATTRIBUTE_MAP = {
  ex: 'ex', 'ex,울트라비스트': 'ex, Ultra Beast', '울트라비스트,ex': 'Ultra Beast, ex',
  '울트라비스트': 'Ultra Beast', '메가ex': 'Mega ex', '베이비': 'Baby',
  '고대': 'Ancient', '미래': 'Future', 'ex,미래': 'ex, Future', 'ex,고대': 'ex, Ancient',
};

const EFFECT_EXACT = {
  '상대의 배틀 포켓몬을 독으로 만든다.': "Your opponent's Active Pokémon is now Poisoned.",
  '상대의 배틀 포켓몬을 잠듦으로 만든다.': "Your opponent's Active Pokémon is now Asleep.",
  '상대의 배틀 포켓몬을 혼란으로 만든다.': "Your opponent's Active Pokémon is now Confused.",
  '상대의 배틀 포켓몬을 화상으로 만든다.': "Your opponent's Active Pokémon is now Burned.",
  '동전을 1번 던져서 뒷면이 나오면 이 기술은 실패한다.': 'Flip a coin. If tails, this attack fails.',
  '이 포켓몬을 벤치 포켓몬과 교체한다.': 'Switch this Pokémon with 1 of your Benched Pokémon.',
  '자신의 덱을 1장 뽑는다.': 'Draw a card.',
  '이 포켓몬의 HP를 10회복.': 'Heal 10 HP from this Pokémon.',
  '이 포켓몬의 HP를 20회복.': 'Heal 20 HP from this Pokémon.',
  '이 포켓몬의 HP를 30회복.': 'Heal 30 HP from this Pokémon.',
  '이 포켓몬의 HP를 30회복': 'Heal 30 HP from this Pokémon.',
  '이 포켓몬에게도 10데미지를 준다.': 'This Pokémon also takes 10 damage.',
  '이 포켓몬에게도 20데미지를 준다.': 'This Pokémon also takes 20 damage.',
  '이 포켓몬에게도 30데미지를 준다.': 'This Pokémon also takes 30 damage.',
  '이 포켓몬이 받는 기술의 데미지를 -20한다.': 'This Pokémon takes 20 less damage from attacks.',
  '자신의 다음 차례에 이 포켓몬은 기술을 사용할 수 없다.': "This Pokémon can't use attacks during your next turn.",
  '상대의 다음 차례에 이 기술을 받은 포켓몬은 후퇴할 수 없다.': "During your opponent's next turn, the Defending Pokémon can't retreat.",
  '상대의 다음 차례에 이 포켓몬이 받는 기술의 데미지를 -20한다.': "During your opponent's next turn, this Pokémon takes 20 less damage from attacks.",
  '동전을 1번 던져서 앞면이 나오면 20데미지를 추가한다.': 'Flip a coin. If heads, this attack does 20 more damage.',
  '동전을 1번 던져서 앞면이 나오면 30데미지를 추가한다.': 'Flip a coin. If heads, this attack does 30 more damage.',
  '동전을 1번 던져서 앞면이 나오면 50데미지를 추가한다.': 'Flip a coin. If heads, this attack does 50 more damage.',
  '동전을 1번 던져서 앞면이 나오면 상대의 배틀 포켓몬을 마비로 만든다.': "Flip a coin. If heads, your opponent's Active Pokémon is now Paralyzed.",
  '동전을 1번 던져서 앞면이 나오면 상대의 배틀 포켓몬에서 에너지를 랜덤으로 1개 트래쉬한다.': "Flip a coin. If heads, discard a random Energy from your opponent's Active Pokémon.",
  '상대의 벤치 포켓몬 1마리에게도 20데미지를 준다.': "This attack also does 20 damage to 1 of your opponent's Benched Pokémon.",
  '상대의 벤치 포켓몬 1마리에게 30데미지를 준다.': "This attack does 30 damage to 1 of your opponent's Benched Pokémon.",
  '상대의 포켓몬 1마리에게 10데미지를 준다.': "This attack does 10 damage to 1 of your opponent's Pokémon.",
  '상대의 포켓몬 1마리에게 30데미지를 준다.': "This attack does 30 damage to 1 of your opponent's Pokémon.",
  '상대의 포켓몬 1마리에게 50데미지를 준다.': "This attack does 50 damage to 1 of your opponent's Pokémon.",
  '자신의 덱에서 포켓몬을 랜덤으로 1장 패로 가져온다.': 'Put 1 random Pokémon from your deck into your hand.',
  '자신의 덱에서 2진화 포켓몬을 랜덤으로 1장 패로 가져온다.': 'Put 1 random Stage 2 Pokémon from your deck into your hand.',
  '자신의 덱에서 기본 포켓몬을 랜덤으로 1장 패로 가져온다.': 'Put 1 random Basic Pokémon from your deck into your hand.',
  '이 포켓몬에서 에너지를 모두 트래쉬한다.': 'Discard all Energy from this Pokémon.',
  '이 포켓몬에서 에너지를 랜덤으로 1개 트래쉬한다.': 'Discard a random Energy from this Pokémon.',
  '상대의 배틀 포켓몬에서 에너지를 랜덤으로 1개 트래쉬한다.': "Discard a random Energy from your opponent's Active Pokémon.",
  '상대의 배틀 포켓몬을 벤치 포켓몬과 교체한다. (배틀필드로 내보낼 포켓몬은 상대가 선택한다.)': "Switch your opponent's Active Pokémon with 1 of their Benched Pokémon. (Your opponent chooses the new Active Pokémon.)",
};

const FOSSIL_NAMES = {
  '껍질화석': 'Helix Fossil',
  '두개의화석': 'Fossilized Fish',
  '날개화석': 'Old Amber',
  '턱화석': 'Jaw Fossil',
  '방패의화석': 'Shield Fossil',
  '조개화석': 'Shell Fossil',
  '덮개화석': 'Cover Fossil',
  '지느러미화석': 'Sail Fossil',
  '릴리아': 'Lillie',
};

const TYPE_ENERGY = {
  '풀에너지': 'Grass Energy', '불에너지': 'Fire Energy', '물에너지': 'Water Energy',
  '번개에너지': 'Lightning Energy', '초에너지': 'Psychic Energy', '격투에너지': 'Fighting Energy',
  '악에너지': 'Darkness Energy', '강철에너지': 'Metal Energy', '드래곤에너지': 'Dragon Energy',
  '무색에너지': 'Colorless Energy',
};

const EFFECT_REGEX = [
  [/^동전을 (\d+)번 던져서 앞면이 나오면 (\d+)데미지를 추가한다\.?$/, 'Flip $1 coin(s). If heads, this attack does $2 more damage.'],
  [/^동전을 (\d+)번 던져서 뒷면이 나오면 이 기술은 실패한다\.?$/, 'Flip $1 coin(s). If tails, this attack fails.'],
  [/^동전을 (\d+)번 던져서 앞면이 나오면 상대의 배틀 포켓몬을 마비로 만든다\.?$/, "Flip $1 coin(s). If heads, your opponent's Active Pokémon is now Paralyzed."],
  [/^동전을 (\d+)번 던져서 앞면이 나오면 상대의 배틀 포켓몬에서 에너지를 랜덤으로 1개 트래쉬한다\.?$/, "Flip $1 coin(s). If heads, discard a random Energy from your opponent's Active Pokémon."],
  [/^동전을 (\d+)번 던져서 앞면이 나오면 상대의 다음 차례에 이 포켓몬은 기술의 데미지나 효과를 받지 않는다\.?$/, "Flip $1 coin(s). If heads, during your opponent's next turn, prevent all damage from and effects of attacks done to this Pokémon."],
  [/^동전을 (\d+)번 던져서 앞면이 나오면 (\d+)데미지를 추가한다\.?$/, 'Flip $1 coin(s). If heads, this attack does $2 more damage.'],
  [/^동전을 (\d+)번 던져서 앞면이 나온 수 × (\d+)데미지를 추가한다\.?$/, 'Flip $1 coin(s). This attack does $2 more damage for each heads.'],
  [/^동전을 (\d+)번 던져서 앞면이 나온 수 × (\d+)데미지를 준다\.?$/, 'Flip $1 coin(s). This attack does $2 damage for each heads.'],
  [/^뒷면이 나올 때까지 동전을 던져서 앞면이 나온 수 × (\d+)데미지를 준다\.?$/, 'Flip coins until you get tails. This attack does $1 damage for each heads.'],
  [/^이 포켓몬의 HP를 (\d+)회복\.?$/, 'Heal $1 HP from this Pokémon.'],
  [/^이 포켓몬에게도 (\d+)데미지를 준다\.?$/, 'This Pokémon also does $1 damage to itself.'],
  [/^자신의 덱을 (\d+)장 뽑는다\.?$/, 'Draw $1 card.'],
  [/^자신의 덱에서 포켓몬을 랜덤으로 1장 패로 가져온다\.?$/, 'Put 1 random Pokémon from your deck into your hand.'],
  [/^자신의 덱에서 ([가-힣]+) 포켓몬을 랜덤으로 1장 패로 가져온다\.?$/, 'Put 1 random $1 Pokémon from your deck into your hand.'],
  [/^자신의 덱에서 (\d)진화 포켓몬을 랜덤으로 1장 패로 가져온다\.?$/, 'Put 1 random Stage $1 Pokémon from your deck into your hand.'],
  [/^자신의 덱에서 2진화 포켓몬을 랜덤으로 1장 패로 가져온다\.?$/, 'Put 1 random Stage 2 Pokémon from your deck into your hand.'],
  [/^상대의 배틀 포켓몬을 (독|잠듦|혼란|화상|마비)으로 만든다\.?$/, "Your opponent's Active Pokémon is now $1."],
  [/^상대의 벤치 포켓몬 1마리에게도 (\d+)데미지를 준다\.?$/, "This attack also does $1 damage to 1 of your opponent's Benched Pokémon."],
  [/^상대의 벤치 포켓몬 1마리에게 (\d+)데미지를 준다\.?$/, "This attack does $1 damage to 1 of your opponent's Benched Pokémon."],
  [/^상대의 포켓몬 1마리에게 (\d+)데미지를 준다\.?$/, "This attack does $1 damage to 1 of your opponent's Pokémon."],
  [/^상대의 벤치 포켓몬의 수 × (\d+)데미지를 추가한다\.?$/, "This attack does $1 more damage for each of your opponent's Benched Pokémon."],
  [/^상대 배틀 포켓몬의 에너지의 개수 × (\d+)데미지를 추가한다\.?$/, "This attack does $1 more damage for each Energy attached to your opponent's Active Pokémon."],
  [/^이 포켓몬을 벤치 포켓몬과 교체한다\.?$/, 'Switch this Pokémon with 1 of your Benched Pokémon.'],
  [/^이 포켓몬에서 ([가-힣]+)에너지를 (\d+)개 트래쉬한다\.?$/, 'Discard $2 $1 Energy from this Pokémon.'],
  [/^이 포켓몬에서 에너지를 모두 트래쉬한다\.?$/, 'Discard all Energy from this Pokémon.'],
  [/^이 포켓몬에서 에너지를 랜덤으로 1개 트래쉬한다\.?$/, 'Discard a random Energy from this Pokémon.'],
  [/^자신의 에너지존에서 ([가-힣]+)에너지를 1개보내 이 포켓몬에게 붙인다\.?$/, 'Send 1 $1 Energy from your Energy Zone to this Pokémon.'],
  [/^자신의 에너지존에서 ([가-힣]+)에너지를 1개보내 벤치의 ([가-힣]+) 포켓몬에게 붙인다\.?$/, 'Send 1 $1 Energy from your Energy Zone to 1 of your Benched $2 Pokémon.'],
  [/^자신의 차례에 1번 사용할 수 있다\. 자신의 포켓몬 전원의 HP를 (\d+)회복\.?$/, 'Once during your turn, you may heal $1 HP from each of your Pokémon.'],
  [/^이 포켓몬이 받는 기술의 데미지를 -(\d+)한다\.?$/, 'This Pokémon takes $1 less damage from attacks.'],
  [/^상대의 다음 차례에 이 포켓몬이 받는 기술의 데미지를 -(\d+)한다\.?$/, "During your opponent's next turn, this Pokémon takes $1 less damage from attacks."],
  [/^상대의 배틀 포켓몬에서 ([가-힣]+)에너지를 1개 트래쉬한다\.?$/, "Discard 1 $1 Energy from your opponent's Active Pokémon."],
  [/^격투 에너지 1개가 추가로 붙어 있다면 (\d+)데미지를 추가한다\.?$/, 'If this Pokémon has an extra Fighting Energy attached, this attack does $1 more damage.'],
  [/^데미지를 받고 있는 상대의 벤치 포켓몬 전원에게도 (\d+)데미지를 준다\.?\s*$/, "This attack also does $1 damage to each of your opponent's Benched Pokémon that has damage on it."],
  [/^자신이 이미 가져간 포인트의 수 × (\d+)데미지를 추가한다\.?$/, 'This attack does $1 more damage for each point you have already taken.'],
  [/^동전을 (\d+)번 던져서 앞면이 나온 수 × (\d+)데미지를 준다\. 상대의 배틀 포켓몬을 혼란으로 만든다\.?$/, "Flip $1 coins. This attack does $2 damage for each heads. Your opponent's Active Pokémon is now Confused."],
  [/^동전을 (\d+)번 던져서 앞면이 나오면 상대의 다음 차례에 이 포켓몬이 받는 기술의 데미지를 -(\d+)한다\.?$/, "Flip $1 coin. If heads, during your opponent's next turn, this Pokémon takes $2 less damage from attacks."],
  [/^상대의 다음 차례에 이 포켓몬이 받는 기술의 데미지를 -(\d+)하고 약점도 모두 없앤다\.?$/, "During your opponent's next turn, this Pokémon takes $1 less damage from attacks and has no Weakness."],
  [/^상대의 벤치 포켓몬이 랜덤으로 (\d+)번 선택되어 선택된 포켓몬 전원에게도 선택된 횟수 × (\d+)데미지를 준다\.?$/, "Choose $1 of your opponent's Benched Pokémon at random $1 times. This attack also does $2 damage to each chosen Pokémon for each time it was chosen."],
  [/^이 포켓몬의 ([가-힣]+)에너지의 개수 × (\d+)데미지를 추가한다\.?$/, 'This attack does $2 more damage for each $1 Energy attached to this Pokémon.'],
  [/^서로의 배틀 포켓몬의 에너지가 (\d+)개 이상이면 (\d+)데미지를 추가한다\.?$/, 'If each Active Pokémon has $1 or more Energy attached, this attack does $2 more damage.'],
  [/^이 포켓몬에서 ([가-힣]+)에너지를 1개 트래쉬한다\. 상대의 배틀 포켓몬을 (독|잠듦|혼란|화상|마비)으로 만든다\.?$/, "Discard 1 $1 Energy from this Pokémon. Your opponent's Active Pokémon is now $2."],
  [/^이 포켓몬의 남은 HP가 (\d+) 이하라면 (\d+)데미지를 추가한다\.?$/, 'If this Pokémon has $1 HP or less remaining, this attack does $2 more damage.'],
  [/^필드에 스타디움이 나와 있다면 상대의 배틀 포켓몬을 (독|잠듦|혼란|화상|마비)으로 만든다\.?$/, "If there is a Stadium in play, your opponent's Active Pokémon is now $1."],
  [/^필드에 스타디움이 나와 있다면 이 포켓몬의 HP를 (\d+)회복\.?$/, 'If there is a Stadium in play, heal $1 HP from this Pokémon.'],
  [/^상대의 배틀 포켓몬이 (독|화상)이라면 (\d+)데미지를 추가한다\.?$/, "If your opponent's Active Pokémon is $1, this attack does $2 more damage."],
  [/^자신의 벤치 포켓몬의 수 × (\d+)데미지를 추가한다\.?$/, 'This attack does $1 more damage for each of your Benched Pokémon.'],
  [/^자신의 필드에 ([가-힣]+)에너지가 (\d+)개 이상 있다면 (\d+)데미지를 추가한다\.?$/, 'If you have $2 or more $1 Energy in play, this attack does $3 more damage.'],
  [/^동전을 (\d+)번 던져서 앞면이 나온 수 × (\d+)데미지를 준다\. 앞면이 1번 이상 나오면 상대의 배틀 포켓몬을 화상으로 만든다\.?$/, "Flip $1 coins. This attack does $2 damage for each heads. If you get 1 or more heads, your opponent's Active Pokémon is now Burned."],
  [/^동전을 (\d+)번 던져서 앞면이 나온 수 × (\d+)데미지를 상대의 벤치 포켓몬 전원에게도 준다\.?$/, "Flip $1 coins. This attack also does $2 damage to each of your opponent's Benched Pokémon for each heads."],
  [/^상대의 덱을 위에서부터 (\d+)장 트래쉬한다\.?$/, "Discard the top $1 card of your opponent's deck."],
  [/^상대의 포켓몬이 랜덤으로 1번 선택되어 선택된 포켓몬에게 (\d+)데미지를 준다\.?$/, "Choose 1 of your opponent's Pokémon at random. This attack does $1 damage to it."],
  [/^상대의 패에서 아이템을 랜덤으로 1장 트래쉬한다\.?$/, "Discard a random Item card from your opponent's hand."],
  [/^상대의 배틀 포켓몬이 데미지를 받고 있다면 (\d+)데미지를 추가한다\.?$/, "If your opponent's Active Pokémon has damage on it, this attack does $1 more damage."],
  [/^동전을 1번 던져서 앞면이 나오면 상대의 배틀 포켓몬을 덱으로 되돌린다\.?$/, "Flip a coin. If heads, put your opponent's Active Pokémon into their deck."],
  [/^동전을 1번 던져서 앞면이 나오면 상대의 배틀 포켓몬을 패로 되돌린다\.?$/, "Flip a coin. If heads, put your opponent's Active Pokémon into their hand."],
  [/^이 포켓몬에게 초에너지가 붙어 있다면 (\d+)데미지를 추가한다\.?$/, 'If this Pokémon has Psychic Energy attached, this attack does $1 more damage.'],
  [/^상대의 다음 차례에 이 기술을 받은 포켓몬은 후퇴할 수 없다\.?$/, "During your opponent's next turn, the Defending Pokémon can't retreat."],
  [/^자신의 다음 차례에 이 포켓몬은 기술을 사용할 수 없다\.?$/, "This Pokémon can't attack during your next turn."],
];

const STATUS_EN = { '독': 'Poisoned', '잠듦': 'Asleep', '혼란': 'Confused', '화상': 'Burned', '마비': 'Paralyzed' };

const TYPE_EN = {
  '풀': 'Grass', '불': 'Fire', '물': 'Water', '번개': 'Lightning', '초': 'Psychic',
  '격투': 'Fighting', '악': 'Darkness', '강철': 'Metal', '드래곤': 'Dragon', '무색': 'Colorless',
};

const ALL_MOVES = { ...MOVES_API, ...MOVES_LOCAL, ...loadTcgMoveMap() };

function loadJson(name) {
  try {
    return require(name);
  } catch {
    return {};
  }
}

function loadTcgMoveMap() {
  return { ...loadJson('./tcg_move_map.json'), ...(B3B_SUPPLEMENT.moves || {}) };
}

const TCG_ABILITIES_EXTRA = { ...loadJson('./tcg_ability_map.json'), ...(B3B_SUPPLEMENT.abilities || {}) };
const MOVE_EFFECT_MAP = { ...loadJson('./tcg_move_effect_map.json'), ...(B3B_SUPPLEMENT.moveEffects || {}) };
const ABILITY_EFFECT_MAP = { ...loadJson('./tcg_ability_effect_map.json'), ...(B3B_SUPPLEMENT.abilityEffects || {}) };

let _nameReplacements = null;

function buildNameReplacements(pokemonNames, nameOverrides) {
  if (_nameReplacements) return _nameReplacements;
  const merged = { ...SPECIES_API, ...pokemonNames, ...ADDON_POKEMON, ...nameOverrides, ...TRAINER_MAP };
  _nameReplacements = Object.entries(merged)
    .filter(([, en]) => en)
    .sort((a, b) => b[0].length - a[0].length);
  return _nameReplacements;
}

function lookupPokemonName(name, pokemonNames, nameOverrides) {
  if (!name) return name;
  const n = String(name).trim();
  if (nameOverrides[n]) return nameOverrides[n];
  if (ADDON_POKEMON[n]) return ADDON_POKEMON[n];
  if (pokemonNames[n]) return pokemonNames[n];
  if (SPECIES_API[n]) return SPECIES_API[n];
  if (FOSSIL_NAMES[n]) return FOSSIL_NAMES[n];
  if (n.endsWith(' ex')) {
    const base = lookupPokemonName(n.slice(0, -3), pokemonNames, nameOverrides);
    if (base && base !== n.slice(0, -3)) return base + ' ex';
  }
  return n;
}

function translateCardName(raw, cardType, pokemonNames, nameOverrides) {
  if (!raw) return raw;
  const name = String(raw).trim();
  if (cardType && !['풀', '불', '물', '번개', '초', '격투', '악', '강철', '드래곤', '무색'].includes(cardType)) {
    return TRAINER_MAP[name] || name;
  }
  return lookupPokemonName(name, pokemonNames, nameOverrides);
}

function translateMove(raw) {
  if (!raw) return raw;
  const s = String(raw).trim();
  if (!/[가-힣]/.test(s)) return s;
  return ALL_MOVES[s] || s;
}

function translateAbility(raw) {
  if (!raw) return raw;
  const s = String(raw).trim();
  if (!/[가-힣]/.test(s)) return s;
  if (TCG_ABILITIES[s]) return TCG_ABILITIES[s];
  if (TCG_ABILITIES_EXTRA[s]) return TCG_ABILITIES_EXTRA[s];
  if (ABILITIES_API[s]) return ABILITIES_API[s];
  return s;
}

function translateKeywords(raw) {
  if (!raw) return raw;
  return String(raw).split(',').map((part) => {
    const kw = part.trim();
    if (!kw) return '';
    return KEYWORD_MAP[kw] || kw;
  }).filter(Boolean).join(', ');
}

function translateAttribute(raw) {
  if (!raw) return raw;
  const s = String(raw).trim();
  return ATTRIBUTE_MAP[s] || s.split(',').map((p) => ATTRIBUTE_MAP[p.trim()] || p.trim()).join(',');
}

function translateEnergy(val) {
  if (!val) return val;
  let s = String(val);
  for (const [ko, en] of Object.entries(ENERGY)) s = s.split(ko).join(en);
  return s;
}

function translateEffectText(raw, pokemonNames, nameOverrides) {
  if (!raw || raw === '-') return raw;
  const original = String(raw).trim();
  let s = original;
  if (!/[가-힣]/.test(s)) return s;
  if (MOVE_EFFECT_MAP[s]) return MOVE_EFFECT_MAP[s];
  if (ABILITY_EFFECT_MAP[s]) return ABILITY_EFFECT_MAP[s];
  if (EFFECT_EXACT[s]) return EFFECT_EXACT[s];

  for (const [re, tpl] of EFFECT_REGEX) {
    const m = s.match(re);
    if (m) {
      let out = tpl;
      m.forEach((grp, i) => {
        if (i === 0) return;
        let rep = grp;
        if (STATUS_EN[grp]) rep = STATUS_EN[grp];
        else if (TYPE_EN[grp]) rep = TYPE_EN[grp];
        else if (TYPE_ENERGY[grp + '에너지']) rep = TYPE_ENERGY[grp + '에너지'];
        else if (TYPE_EN[grp]) rep = TYPE_EN[grp];
        else if (grp.endsWith('포켓몬') && TYPE_EN[grp.replace(/포켓몬$/, '')]) rep = TYPE_EN[grp.replace(/포켓몬$/, '')];
        out = out.replace(`$${i}`, rep);
      });
      return out;
    }
  }

  for (const [ko, en] of buildNameReplacements(pokemonNames, nameOverrides)) {
    if (s.includes(ko)) s = s.split(ko).join(en);
  }
  for (const [ko, en] of Object.entries(ALL_MOVES)) {
    if (s.includes(ko)) s = s.split(ko).join(en);
  }
  for (const [ko, en] of Object.entries(TYPE_ENERGY)) {
    if (s.includes(ko)) s = s.split(ko).join(en);
  }
  for (const [ko, en] of Object.entries(ENERGY)) {
    if (s.includes(ko)) s = s.split(ko).join(en);
  }

  const PHRASES = [
    ['자신의 차례에 1번 사용할 수 있다', 'Once during your turn, you may use this'],
    ['자신의 차례에 1번 사용할 수 있다.', 'Once during your turn, you may use this.'],
    ['이 포켓몬의 배틀필드에 있다면', 'If this Pokémon is in the Active Spot'],
    ['이 포켓몬이 배틀필드에 있다면', 'If this Pokémon is in the Active Spot'],
    ['이 포켓몬이 배틀필드에서', 'While this Pokémon is in the Active Spot'],
    ['이 포켓몬의 Active Spot에 있다면', 'If this Pokémon is in the Active Spot'],
    ['상대의 배틀 포켓몬', "your opponent's Active Pokémon"],
    ['상대의 벤치 포켓몬', "your opponent's Benched Pokémon"],
    ['상대의 포켓몬', "your opponent's Pokémon"],
    ['상대의 다음 차례에', "During your opponent's next turn"],
    ['자신의 다음 차례에', 'During your next turn'],
    ['자신의 이전 차례에', 'During your last turn'],
    ['자신의 필드의', 'on your side of the field'],
    ['필드에 스타디움이 나와 있다면', 'If there is a Stadium in play'],
    ['후퇴에 필요한 에너지를 모두 없앤다', 'it has no Retreat Cost'],
    ['포켓몬의 도구', 'Pokémon Tool'],
    ['트래쉬에서', 'from your discard pile'],
    ['패에서 꺼내서 진화시켰을 때', 'evolve it from your hand during your turn'],
    ['히트업크런치', 'Heat Upcrunch'],
    ['배틀필드를 떠날 때까지', 'until this Pokémon leaves the Active Spot'],
    ['배틀필드에 있는 한', 'while this Pokémon is in the Active Spot'],
    ['새로나온 포켓몬에게', 'to the new Active Pokémon'],
    ['약점도 모두 없앤다', 'and has no Weakness'],
    ['자신의 에너지존에서', 'from your Energy Zone'],
    ['에너지존에서', 'from the Energy Zone'],
    ['벤치 포켓몬과 교체한다', 'Switch it with 1 of your Benched Pokémon'],
    ['패로 가져온다', 'into your hand'],
    ['덱을', 'deck'],
    ['덱에서', 'from your deck'],
    ['트래쉬한다', 'discard'],
    ['트래쉬해도 좋다', 'you may discard'],
    ['기술의 데미지', 'damage from attacks'],
    ['기술을 사용할 수 없다', "can't use attacks"],
    ['기술을 사용할 때', 'when it uses an attack'],
    ['기술은 실패한다', 'the attack fails'],
    ['후퇴할 수 없다', "can't retreat"],
    ['랜덤으로', 'random'],
    ['전원의', 'all'],
    ['전원에게', 'to each'],
    ['1마리에게', 'to 1'],
    ['1장', '1 card'],
    ['1개', '1'],
    ['1번', '1'],
    ['2진화', 'Stage 2'],
    ['1진화', 'Stage 1'],
    ['기본', 'Basic'],
    ['포켓몬 ex', 'Pokémon ex'],
    ['포켓몬', 'Pokémon'],
    ['동전을', 'Flip a'],
    ['던져서', ''],
    ['앞면이 나오면', 'If heads'],
    ['뒷면이 나오면', 'If tails'],
    ['앞면이 나온 수', 'number of heads'],
    ['데미지를 추가한다', 'more damage'],
    ['데미지를 준다', 'damage'],
    ['회복', 'Heal'],
    ['이 포켓몬', 'this Pokémon'],
    ['자신의', 'your'],
    ['상대의', "your opponent's"],
    ['자신', 'you'],
    ['상대', 'your opponent'],
  ];
  for (const [ko, en] of PHRASES) {
    if (s.includes(ko)) s = s.split(ko).join(en);
  }

  s = s.replace(/(\d+)데미지/g, '$1 damage');
  s = s.replace(/(\d+)HP/g, '$1 HP');
  s = s.replace(/(\d+)장/g, '$1 card(s)');
  s = s.replace(/(\d+)개/g, '$1');
  s = s.replace(/(\d+)번/g, '$1');
  s = s.replace(/(\d+)마리/g, '$1');
  s = s.replace(/(\d+)분으로/g, ' as $1');
  s = s.replace(/「([^」]+)」/g, (_, inner) => {
    const innerEn = lookupPokemonName(inner, pokemonNames, nameOverrides);
    return `「${innerEn !== inner ? innerEn : inner}」`;
  });
  s = s.replace(/\s+/g, ' ').trim();
  if (/[가-힣]/.test(s)) return original;
  return s;
}

function translateEffect(raw, pokemonNames, nameOverrides) {
  return translateEffectText(raw, pokemonNames, nameOverrides);
}

module.exports = {
  TRAINER_MAP,
  ADDON_POKEMON,
  translateCardName,
  translateMove,
  translateAbility,
  translateKeywords,
  translateAttribute,
  translateEnergy,
  translateEffect,
  lookupPokemonName,
};
