/**
 * B4a EN→KO patch for card_list.xlsx (로켓단의 야망)
 */
import { createRequire } from "module";
import { writeFileSync } from "fs";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

const MOVES = {
  "Ire-Fly": "아이어플라이",
  "Leaf Boomerang": "리프부메랑",
  "Leaf Step": "리프스텝",
  Flog: "휩다운",
  "Derisive Roasting": "조롱조롱로스팅",
  "Heat Charged": "히트차지",
  Netherwing: "극염의날개",
  "Toxfire Fang": "독화염엄니",
  "Ruthless Whirlpool": "무자비한소용돌이",
  "Ice Wing": "아이스윙",
  Hailstorm: "빙설의폭풍",
  "Soul Counter": "소울카운터",
  "Random Spark": "전자스파크",
  "Electro Ball": "일렉트릭볼",
  Thunderclaw: "뇌명의갈고리발톱",
  "Double Headbutt": "더블박치기",
  Scavenge: "스케빈지",
  "Hand Kinesis": "핸드키네시스",
  Entrap: "인트랩",
  "Psychic Explosion": "사이코익스플로전",
  "Punch and Draw": "펀치앤드드로우",
  Punish: "퍼니시",
  "Gaia Impact": "가이아임팩트",
  "Shadow Seeker": "섀도시커",
  "Poison Absorption": "포이즌앱소브",
  "Reverse Thrust": "리버스스러스트",
  "Confusion Gas": "혼란가스",
  "Group Beatdown": "다함께 때려잡기",
  "Pile-Driving Hammer": "파일드라이버해머",
  "Draconic Slam": "드래고닉슬램",
  "Draconic Slam 140-": "드래고닉슬램",
  "Boost Dash": "부스트대시",
  "Dangerous Rogue": "데인저러스로그",
  "Hit and Hide": "힛앤드하이드",
  "Chubby Cheer": "통통치어",
  "0 Chubby Cheer": "통통치어",
  "Sitdown Splash": "싯다운스플래시",
  "Continuous Steps": "연속스텝",
  Tackle: "몸통박치기",
  Rollout: "구르기",
};

const ABILITIES = {
  "Regal Bloom": "로열 블룸",
  "Destiny Burst": "길동무봄버",
  "Evil Inspiration": "나쁜 번뜩임",
  "Boiler Smog": "보일러 스모그",
  "Luxury Coin": "럭셔리 동전",
  "Mach Stealth": "마하 스텔스",
  "Thieving Incisors": "도둑질 앞니",
  "Spy Ops": "스파이 활동",
  "Fur Coat": "퍼코트",
};

const PREV = {
  "Team Rocket's Houndour": "로켓단의 델빌",
  "Team Rocket’s Houndour": "로켓단의 델빌",
  "Team Rocket's Voltorb": "로켓단의 찌리리공",
  "Team Rocket’s Voltorb": "로켓단의 찌리리공",
  "Team Rocket's Slowpoke": "로켓단의 야돈",
  "Team Rocket’s Slowpoke": "로켓단의 야돈",
  "Team Rocket's Drowzee": "로켓단의 슬리프",
  "Team Rocket’s Drowzee": "로켓단의 슬리프",
  "Team Rocket's Ekans": "로켓단의 아보",
  "Team Rocket’s Ekans": "로켓단의 아보",
  "Team Rocket's Grimer": "로켓단의 질퍽이",
  "Team Rocket’s Grimer": "로켓단의 질퍽이",
  "Team Rocket's Koffing": "로켓단의 또가스",
  "Team Rocket’s Koffing": "로켓단의 또가스",
  "Team Rocket's Tinkatink": "로켓단의 어리짱",
  "Team Rocket’s Tinkatink": "로켓단의 어리짱",
  "Team Rocket's Tinkatuff": "로켓단의 벼리짱",
  "Team Rocket’s Tinkatuff": "로켓단의 벼리짱",
  "Team Rocket's Rattata": "로켓단의 꼬렛",
  "Team Rocket’s Rattata": "로켓단의 꼬렛",
  "Team Rocket's Meowth": "로켓단의 나옹",
  "Team Rocket’s Meowth": "로켓단의 나옹",
};

const EFFECTS = {
  "If Volbeat is in your discard pile, this attack does 60 more damage.":
    "자신의 트래쉬에 볼비트가 있다면 60데미지를 추가한다.",

  "This Pokémon gets +30 HP for each [ G ] Energy attached to it.":
    "이 포켓몬은 붙어 있는 풀에너지의 개수 × 30HP가 늘어난다.",

  "This attack does 50 more damage for each Special Condition affecting your opponent's Active Pokémon.":
    "상대의 배틀 포켓몬이 받고 있는 특수 상태의 수 × 50데미지를 추가한다.",

  "Flip 3 coins. For each heads, produce a [ R ] Energy from your Energy Zone and attach it to this Pokémon.":
    "동전을 3번 던져서 앞면이 나온 수만큼 자신의 에너지존에서 불에너지를 내보내 이 포켓몬에게 붙인다.",

  "Discard a [ R ] Energy from this Pokémon.":
    "이 포켓몬에서 불에너지를 1개 트래쉬한다.",

  "Your opponent's Active Pokémon is now Poisoned and Burned.":
    "상대의 배틀 포켓몬을 독과 화상으로 만든다.",

  "If this Pokémon has more Energy attached than your opponent's Active Pokémon, this attack does 40 more damage.":
    "이 포켓몬의 에너지가 상대의 배틀 포켓몬보다 많다면 40데미지를 추가한다.",

  "This attack also does 20 damage to each of your Benched Pokémon.":
    "자신의 벤치 포켓몬 전원에게도 20데미지를 준다.",

  "This attack does 50 more damage for each point your opponent got during their last turn.":
    "상대가 지난 차례에 가져간 포인트의 수 × 50데미지를 추가한다.",

  "If this Pokémon is in the Active Spot and is Knocked Out by damage from an attack from your opponent's Pokémon, do 70 damage to the Attacking Pokémon.":
    "이 포켓몬이 배틀필드에 있는 동안 상대의 포켓몬이 사용하는 기술의 데미지로 기절했다면 기술을 사용한 포켓몬에게 70데미지를 준다.",

  "This attack also does 50 damage to 1 of your opponent's Benched Pokémon that has damage on it.":
    "데미지를 받고 있는 상대의 벤치 포켓몬 1마리에게도 50데미지를 준다.",

  "Put a random Item card from your discard pile into your hand.":
    "자신의 트래쉬에서 아이템을 랜덤으로 1장 패로 가져온다.",

  "This attack does 20 damage for each card in your hand.":
    "자신의 패의 장수 × 20데미지를 준다.",

  "Once during your turn, if this Pokémon is in the Active Spot, you may draw a card.":
    "이 포켓몬이 배틀필드에 있다면 자신의 차례에 1번 사용할 수 있다. 자신의 덱을 1장 뽑는다.",

  "Switch in 1 of your opponent's Benched Pokémon to the Active Spot. If you do, this attack does 50 damage to the new Active Pokémon.":
    "상대의 벤치 포켓몬을 1마리 선택해서 배틀 포켓몬과 교체한다. 그 뒤, 새로 나온 포켓몬에게 50데미지를 준다.",

  "This Pokémon also does 70 damage to itself.":
    "이 포켓몬에게도 70데미지를 준다.",

  "Draw a card.": "자신의 덱을 1장 뽑는다.",

  'If your opponent\'s Active Pokémon has "Team Rocket" in its name, this attack does 70 more damage.':
    "상대의 배틀 포켓몬의 이름에 「로켓단」이 들어가 있다면 70데미지를 추가한다.",

  "If your opponent's Active Pokémon has “Team Rocket” in its name, this attack does 70 more damage.":
    "상대의 배틀 포켓몬의 이름에 「로켓단」이 들어가 있다면 70데미지를 추가한다.",

  "Discard all Energy from this Pokémon.":
    "이 포켓몬에서 에너지를 모두 트래쉬한다.",

  "This attack does 10 more damage for each Energy in your opponent's Active Pokémon's Retreat Cost.":
    "상대의 배틀 포켓몬의 후퇴에 필요한 에너지의 개수 × 10데미지를 추가한다.",

  "If your opponent's Active Pokémon is Poisoned, heal 60 damage from this Pokémon.":
    "상대의 배틀 포켓몬이 독 상태라면 이 포켓몬의 HP를 60회복.",

  "Switch this Pokémon with 1 of your Benched Pokémon.":
    "이 포켓몬을 벤치 포켓몬과 교체한다.",

  "Your opponent's Active Pokémon is now Confused.":
    "상대의 배틀 포켓몬을 혼란으로 만든다.",

  "Once during your turn, when you play this Pokémon from your hand to evolve 1 of your Pokémon, you may make your opponent's Active Pokémon Poisoned and Burned.":
    "자신의 차례에 이 포켓몬을 패에서 꺼내서 진화시켰을 때 1번 사용할 수 있다. 상대의 배틀 포켓몬을 독과 화상으로 만든다.",

  "Flip a coin for each Pokémon you have in play. This attack does 30 damage for each heads.":
    "자신의 필드에 있는 포켓몬의 수만큼 동전을 던져서 앞면이 나온 수 × 30데미지를 준다.",

  "During your opponent's next turn, attacks used by the Defending Pokémon cost 2 [ C ] more, and its Retreat Cost is 2 [ C ] more.":
    "상대의 다음 차례에 이 기술을 받은 포켓몬이 사용하는 기술에 필요한 에너지가 무색에너지 2개분 늘어나고, 후퇴에 필요한 에너지도 무색에너지 2개분 늘어난다.",

  "Once during your turn, when you flip any coins for an effect of your Trainer cards, you may ignore all results of those coin flips and begin flipping those coins again. You can't use more than 1 Luxury Coin Ability each turn.":
    "자신의 차례에 트레이너스 카드의 효과로 동전을 던질 때 1번 사용할 수 있다. 그 결과를 모두 무시하고 처음부터 다시 던진다. 이 특성은 차례에 1번만 사용할 수 있다.",

  "If your opponent's Pokémon is Knocked Out by damage from this Pokémon's attacks, during your opponent's next turn, prevent all damage from—and effects of—attacks done to this Pokémon.":
    "이 포켓몬의 기술의 데미지로 상대의 포켓몬이 기절했다면 상대의 다음 차례에 이 포켓몬은 기술의 데미지나 효과를 받지 않는다.",

  "If this Pokémon has damage on it, this attack does −100 damage.":
    "이 포켓몬이 데미지를 받고 있다면 이 기술의 데미지를 100 작게 한다.",

  "If this Pokémon has damage on it, this attack does -100 damage.":
    "이 포켓몬이 데미지를 받고 있다면 이 기술의 데미지를 100 작게 한다.",

  "Once during your turn, when you play this Pokémon from your hand to evolve 1 of your Pokémon, you may move a random Energy from your opponent's Active Pokémon to this Pokémon.":
    "자신의 차례에 이 포켓몬을 패에서 꺼내서 진화시켰을 때 1번 사용할 수 있다. 상대의 배틀 포켓몬에서 에너지를 랜덤으로 1개 이 포켓몬에게 붙인다.",

  "This attack does 40 more damage for each of your opponent's Benched Pokémon.":
    "상대의 벤치 포켓몬의 수 × 40데미지를 추가한다.",

  "Flip a coin. If heads, during your opponent's next turn, prevent all damage from—and effects of—attacks done to this Pokémon.":
    "동전을 1번 던져서 앞면이 나오면 상대의 다음 차례에 이 포켓몬은 기술의 데미지나 효과를 받지 않는다.",

  "Once during your turn, you may look at a random card from your opponent's hand.":
    "자신의 차례에 1번 사용할 수 있다. 상대의 패를 랜덤으로 1장 본다.",

  "During your next turn, attacks used by your Pokémon do +20 damage to your opponent's Active Pokémon.":
    "자신의 다음 차례에 자신의 포켓몬이 사용하는 기술이 상대의 배틀 포켓몬에게 주는 데미지를 +20한다.",

  "Flip a coin until you get tails. This attack does 30 damage for each heads.":
    "뒷면이 나올 때까지 동전을 던져서 앞면이 나온 수 × 30데미지를 준다.",

  "Flip a coin. If heads, this attack does 60 more damage.":
    "동전을 1번 던져서 앞면이 나오면 60데미지를 추가한다.",

  "Until the end of your opponent's next turn, your opponent's Active Pokémon's Retreat Cost is 1 more.":
    "상대의 다음 차례 끝까지 상대의 배틀 포켓몬의 후퇴에 필요한 에너지가 1개 늘어난다.",

  'Flip a coin until you get tails. For each heads, put a random Pokémon that has "Team Rocket" in its name from your deck into your hand.':
    "뒷면이 나올 때까지 동전을 던져서 앞면이 나온 수만큼 자신의 덱에서 이름에 「로켓단」이 들어간 포켓몬을 랜덤으로 패로 가져온다.",

  "Flip a coin until you get tails. For each heads, put a random Pokémon that has “Team Rocket” in its name from your deck into your hand.":
    "뒷면이 나올 때까지 동전을 던져서 앞면이 나온 수만큼 자신의 덱에서 이름에 「로켓단」이 들어간 포켓몬을 랜덤으로 패로 가져온다.",

  "Your opponent's Active Pokémon is now Confused. Flip a coin. If tails, your Active Pokémon is now also Confused.":
    "상대의 배틀 포켓몬을 혼란으로 만든다. 동전을 1번 던져서 뒷면이 나오면 자신의 배틀 포켓몬도 혼란으로 만든다.",

  "Look at your opponent's hand and put any number of Basic Pokémon you find there onto your opponent's Bench.":
    "상대의 패를 보고 그 중에서 기본 포켓몬을 원하는 수만큼 상대의 벤치로 내보낸다.",

  "Once during each player's turn, that player may flip 3 coins. If all of them are heads, that player draws cards until they have 7 cards in their hand.":
    "서로의 플레이어는 자신의 차례에 1번 사용할 수 있다. 동전을 3번 던져서 모두 앞면이 나오면 패가 7장이 될 때까지 자신의 덱을 뽑는다.",

  "Put a random Item card, except any Team Rocket's Thieving Machine, from your opponent's discard pile into your hand.":
    "상대의 트래쉬에서 「로켓단의 도둑질 머신」 이외의 아이템을 랜덤으로 1장 패로 가져온다.",

  "This Pokémon takes −20 damage from attacks.":
    "이 포켓몬이 받는 기술의 데미지를 -20한다.",

  "This attack does 30 damage to 1 of your opponent's Pokémon.":
    "상대의 포켓몬 1마리에게 30데미지를 준다.",
};

const ABILITY_EFFECTS = {
  "This Pokémon gets +30 HP for each [ G ] Energy attached to it.":
    "이 포켓몬은 붙어 있는 풀에너지의 개수 × 30HP가 늘어난다.",

  "If this Pokémon is in the Active Spot and is Knocked Out by damage from an attack from your opponent's Pokémon, do 70 damage to the Attacking Pokémon.":
    "이 포켓몬이 배틀필드에 있는 동안 상대의 포켓몬이 사용하는 기술의 데미지로 기절했다면 기술을 사용한 포켓몬에게 70데미지를 준다.",

  "Once during your turn, if this Pokémon is in the Active Spot, you may draw a card.":
    "이 포켓몬이 배틀필드에 있다면 자신의 차례에 1번 사용할 수 있다. 자신의 덱을 1장 뽑는다.",

  "Once during your turn, when you play this Pokémon from your hand to evolve 1 of your Pokémon, you may make your opponent's Active Pokémon Poisoned and Burned.":
    "자신의 차례에 이 포켓몬을 패에서 꺼내서 진화시켰을 때 1번 사용할 수 있다. 상대의 배틀 포켓몬을 독과 화상으로 만든다.",

  "Once during your turn, when you flip any coins for an effect of your Trainer cards, you may ignore all results of those coin flips and begin flipping those coins again. You can't use more than 1 Luxury Coin Ability each turn.":
    "자신의 차례에 트레이너스 카드의 효과로 동전을 던질 때 1번 사용할 수 있다. 그 결과를 모두 무시하고 처음부터 다시 던진다. 이 특성은 차례에 1번만 사용할 수 있다.",

  "If your opponent's Pokémon is Knocked Out by damage from this Pokémon's attacks, during your opponent's next turn, prevent all damage from—and effects of—attacks done to this Pokémon.":
    "이 포켓몬의 기술의 데미지로 상대의 포켓몬이 기절했다면 상대의 다음 차례에 이 포켓몬은 기술의 데미지나 효과를 받지 않는다.",

  "Once during your turn, when you play this Pokémon from your hand to evolve 1 of your Pokémon, you may move a random Energy from your opponent's Active Pokémon to this Pokémon.":
    "자신의 차례에 이 포켓몬을 패에서 꺼내서 진화시켰을 때 1번 사용할 수 있다. 상대의 배틀 포켓몬에서 에너지를 랜덤으로 1개 이 포켓몬에게 붙인다.",

  "Once during your turn, you may look at a random card from your opponent's hand.":
    "자신의 차례에 1번 사용할 수 있다. 상대의 패를 랜덤으로 1장 본다.",

  "This Pokémon takes −20 damage from attacks.":
    "이 포켓몬이 받는 기술의 데미지를 -20한다.",
};

/** Per-card field overrides (parse fixes etc.) */
const CARD_FIXES = {
  19201: { 기술명: "몸통박치기" },
  19234: { 기술명: "몸통박치기" },
  19246: { 기술명: "구르기" },
  19257: {
    기술명: "드래고닉슬램",
    피해량: "140-",
    기술추가효과:
      "이 포켓몬이 데미지를 받고 있다면 이 기술의 데미지를 100 작게 한다.",
  },
  19263: { 기술명: "통통치어", 기술에너지: "" },
  19267: {
    기술추가효과:
      "상대의 트래쉬에서 「로켓단의 도둑질 머신」 이외의 아이템을 랜덤으로 1장 패로 가져온다.",
  },
};

function mapField(value, dict) {
  const v = String(value || "").trim();
  if (!v) return v;
  if (dict[v]) return dict[v];
  if (v.startsWith("0 ") && dict[v.slice(2)]) return dict[v.slice(2)];
  // normalize fancy apostrophe / quotes
  const norm = v
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"');
  if (dict[norm]) return dict[norm];
  return null;
}

function stillHasLatin(s) {
  return /[A-Za-z]/.test(
    String(s || "")
      .replace(/\s*ex$/i, "")
      .replace(/HP/g, "")
  );
}

function apply() {
  const wb = XLSX.readFile("app/data/card_list.xlsx");
  let changed = 0;
  const still = [];

  for (const sn of wb.SheetNames) {
    if (sn === "추천덱") continue;
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sn], { header: 1, defval: "" });
    const h = rows[0];
    const idx = Object.fromEntries(h.map((k, i) => [k, i]));

    for (let i = 1; i < rows.length; i++) {
      const id = Number(rows[i][idx["ID"]]);
      if (id < 19201 || id > 19272) continue;

      const fix = CARD_FIXES[id];
      if (fix) {
        for (const [k, v] of Object.entries(fix)) {
          if (idx[k] != null) {
            rows[i][idx[k]] = v;
            changed++;
          }
        }
      }

      const fields = [
        ["기술명", MOVES],
        ["기술명2", MOVES],
        ["기술추가효과", EFFECTS],
        ["기술추가효과2", EFFECTS],
        ["특성", ABILITIES],
        ["특성효과", { ...EFFECTS, ...ABILITY_EFFECTS }],
        ["이전이름", PREV],
      ];

      for (const [field, dict] of fields) {
        if (idx[field] == null) continue;
        const cur = String(rows[i][idx[field]] || "");
        if (!cur || !/[A-Za-z]/.test(cur)) continue;
        // skip legitimate "ex" only
        if (field === "이름" || field === "이전이름") {
          // handled via PREV / already KO
        }
        const mapped = mapField(cur, dict);
        if (mapped) {
          rows[i][idx[field]] = mapped;
          changed++;
        } else if (stillHasLatin(cur) && field !== "이름") {
          still.push({ id, field, cur: cur.slice(0, 160) });
        }
      }

      // also fix wrong KO leftovers from reverse-map collisions
      if (idx["기술명"] != null) {
        const move = String(rows[i][idx["기술명"]] || "");
        if (move === "원시의날갯짓") {
          rows[i][idx["기술명"]] = "몸통박치기";
          changed++;
        }
        if (move === "친구사이") {
          rows[i][idx["기술명"]] = "구르기";
          changed++;
        }
      }
    }
    wb.Sheets[sn] = XLSX.utils.aoa_to_sheet(rows);
  }

  XLSX.writeFile(wb, "app/data/card_list.xlsx");
  writeFileSync(
    "scripts/_b4a_still_en.json",
    JSON.stringify(still, null, 2),
    "utf8"
  );
  console.log("changed cells", changed);
  console.log("still english", still.length);
  if (still.length) console.log(still.slice(0, 50));
}

apply();
