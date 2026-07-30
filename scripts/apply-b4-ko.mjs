/**
 * B4 EN→KO patch for card_list.xlsx
 * Sources: Limitless EN text + GameWith JP naming + existing Pocket KO style
 */
import { createRequire } from "module";
import { writeFileSync } from "fs";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

const MOVES = {
  "0 Mime-y Shuffle": "흉내셔플",
  "0 Stompy Jammer": "스톰피재머",
  "Abyssal Drop": "어비설드롭",
  "Acceleration Drive": "액셀드라이브",
  "Bass Control": "베이스컨트롤",
  "Bedrock Breaker": "기반파괴",
  "Blizzlock": "블리즈록",
  "Bone Rush": "본러쉬",
  "Bursting Tail": "폭렬테일",
  "Chase Order": "체이스오더",
  "Cocoon Collector": "고치컬렉터",
  Confront: "대치",
  "Cosmic Tackle": "코스믹태클",
  "Crackling Snap": "크랙링스냅",
  "Deck and Cover": "덱앤드커버",
  "Destructive Inferno": "디스트럭티브인페르노",
  "Disaster Volt": "디재스터볼트",
  "Double Hit": "더블어택",
  "Double Spin": "더블스핀",
  "Dragon Impact": "드래곤임팩트",
  Electrispark: "일렉트리스파크",
  "Energy Blender": "에너지블렌더",
  "Enhanced Blade": "강화슬래시",
  Evoflight: "에볼플라이트",
  "Frozen Splash": "프로즌스플래시",
  "Gatling Slug": "개틀링슬러그",
  "Gold Breaker": "골드브레이커",
  "Iron Lance": "아이언랜스",
  "Jet Wing": "제트윙",
  "Junk Spark": "정크스파크",
  "Mega Burst": "메가버스트",
  Migraine: "편두통",
  "Mind Bend": "마인드벤드",
  "Mineral Pump": "미네랄펌프",
  "Mini-Metronome": "미니메트로놈",
  "Mischievous Ring": "장난꾸러기링",
  "Ogre’s Whip": "오거휩",
  "Ogre's Whip": "오거휩",
  "Pivot Throw": "피벗스로우",
  Prelude: "프렐류드",
  "Raging Blade": "레이징블레이드",
  "Resonating Blade": "레조넌스블레이드",
  "Revenge Blast": "리벤지블래스트",
  "Run Around": "뛰어다니기",
  "Samesies Slap": "똑같이스랩",
  "Seashell Attack": "조개껍질어택",
  "Shadow Bullet": "섀도불릿",
  "Sharp Claws": "날카로운발톱",
  Slam: "힘껏치기",
  "Squared Attack": "스퀘어드어택",
  "Stick and Absorb": "스티크앤드앱소브",
  "Supernatural Feather": "초자연깃털",
  "Swallow Up": "통째로삼키기",
  "Synchro Dance": "싱크로댄스",
  "Tail Rap": "꼬리로 뺨치기",
  "Team Hunt": "팀헌트",
  "Tidal Blast": "타이달블래스트",
  "Turbo Shark": "터보샤크",
  "Wondrous Waves": "원더러스위브",
};

const ABILITIES = {
  "Conductive Body": "전도바디",
  "Dragon’s Blessing": "용의은혜",
  "Dragon's Blessing": "용의은혜",
  "Dual Customization": "듀얼커스터마이즈",
  Evoshock: "에보쇼크",
  "Fur Coat": "퍼코트",
  Hospitality: "환대",
  Stance: "스탠스",
  "Treasure Collecting": "보물모으기",
  "Variety Powder": "버라이어티파우더",
};

const PREV = {
  GalarianZigzagoon: "가라르 지그제구리",
  "Galarian Zigzagoon": "가라르 지그제구리",
  GalarianLinoone: "가라르 직구리",
  "Galarian Linoone": "가라르 직구리",
};

const EFFECTS = {
  "Put 3 random cards from among Silcoon and Cascoon from your deck onto your Bench.":
    "자신의 덱에서 실쿤과 카스쿤을 랜덤으로 3장 벤치로 내보낸다.",

  "Heal 30 damage from this Pokémon. During your opponent's next turn, the Defending Pokémon can't retreat.":
    "이 포켓몬의 HP를 30회복. 상대의 다음 차례에 이 기술을 받은 포켓몬은 후퇴할 수 없다.",

  "You may discard 1 of your Benched Basic [ G ] Pokémon. If you do, this attack does 70 more damage.":
    "자신의 벤치의 기본 풀포켓몬 1마리를 트래쉬한다. 트래쉬했다면 70데미지를 추가한다.",

  "Your opponent's Active Pokémon is now Poisoned and Paralyzed. Shuffle this Pokémon and all attached cards into your deck.":
    "상대의 배틀 포켓몬을 독과 마비로 만든다. 이 포켓몬과 붙어 있는 카드를 모두 덱으로 되돌리고 섞는다.",

  "If you haven't gotten any points, this attack does 60 more damage.":
    "자신이 아직 포인트를 가져가지 않았다면 60데미지를 추가한다.",

  "This attack does damage to your opponent's Active Pokémon equal to this Pokémon's remaining HP.":
    "이 포켓몬의 남은 HP만큼의 데미지를 상대의 배틀 포켓몬에게 준다.",

  "Take a [ R ] Energy from your Energy Zone and attach it to this Pokémon.":
    "자신의 에너지존에서 불에너지를 1개보내 이 포켓몬에게 붙인다.",

  "Discard Fire [ R ] Energy from this Pokémon. Your opponent's Active Pokémon is now Burned.":
    "이 포켓몬에서 불에너지를 트래쉬한다. 상대의 배틀 포켓몬을 화상으로 만든다.",

  "Flip a coin. If heads, your opponent's Active Pokémon is now Confused. If tails, this Pokémon is now Confused.":
    "동전을 1번 던져서 앞면이 나오면 상대의 배틀 포켓몬을 혼란으로 만든다. 뒷면이 나오면 이 포켓몬을 혼란으로 만든다.",

  "Take a [ W ] Energy from your Energy Zone and attach it to 1 of your Benched [ W ] Pokémon.":
    "자신의 에너지존에서 물에너지를 1개보내 벤치의 물포켓몬에게 붙인다.",

  "This Pokémon recovers from all Special Conditions.":
    "이 포켓몬의 특수 상태를 모두 회복한다.",

  "If your opponent's Active Pokémon is a [ F ] Pokémon, this attack does 70 more damage.":
    "상대의 배틀 포켓몬이 격투포켓몬이라면 70데미지를 추가한다.",

  "Discard 3 [ W ] Energy from this Pokémon, and this attack does 50 damage to each of your opponent's Pokémon.":
    "이 포켓몬에서 물에너지를 3개 트래쉬하고, 상대의 포켓몬 전원에게 50데미지를 준다.",

  "Heal 10 damage from each of your Benched Pokémon.":
    "자신의 벤치 포켓몬 전원의 HP를 10회복.",

  "This attack does 50 more damage for each point your opponent has gotten.":
    "상대가 이미 가져간 포인트의 수 × 50데미지를 추가한다.",

  "Discard the top card of your deck, and if that card is an Item, this attack does 20 more damage.":
    "자신의 덱을 위에서부터 1장 트래쉬하고, 그 카드가 아이템이라면 20데미지를 추가한다.",

  "This attack does 10 more damage for each Item card in your discard pile.":
    "자신의 트래쉬에 있는 아이템의 장수 × 10데미지를 추가한다.",

  "This attack does 20 more damage for each Energy attached to all of your opponent's Pokémon.":
    "상대의 포켓몬 전원에게 붙어 있는 에너지의 개수 × 20데미지를 추가한다.",

  "Discard a [ L ] Energy from this Pokémon.":
    "이 포켓몬에서 번개에너지를 1개 트래쉬한다.",

  "If this Pokémon and your opponent's Active Pokémon have the same amount of Energy attached, this attack does 40 more damage.":
    "이 포켓몬과 상대의 배틀 포켓몬의 에너지 개수가 같다면 40데미지를 추가한다.",

  "This attack does 40 more damage for each Energy attached to your opponent's Active Pokémon.":
    "상대 배틀 포켓몬의 에너지의 개수 × 40데미지를 추가한다.",

  "If you have the same number of cards in your hand as your opponent, this attack does 40 more damage.":
    "자신의 패의 장수가 상대와 같다면 40데미지를 추가한다.",

  "During your opponent's next turn, attacks used by the Defending Pokémon cost 1 [ C ] more.":
    "상대의 다음 차례에 이 기술을 받은 포켓몬이 사용하는 기술에 필요한 에너지가 무색에너지 1개분 늘어난다.",

  "Before doing damage, shuffle all Pokémon Tools from each of your opponent's Pokémon into their deck.":
    "데미지를 주기 전에 상대의 포켓몬 전원으로부터 「포켓몬의 도구」를 모두 상대의 덱으로 되돌리고 섞는다.",

  "During your opponent's next turn, this Pokémon takes +50 damage from attacks.":
    "상대의 다음 차례에 이 포켓몬이 받는 기술의 데미지를 +50한다.",

  "Discard all Energy from this Pokémon. Choose a spot from among your opponent's Active Spot and Bench. At the end of your opponent's next turn, Knock Out the Pokémon in the spot you chose.":
    "이 포켓몬에서 에너지를 모두 트래쉬한다. 상대의 배틀필드와 벤치 중에서 장소를 1곳 고른다. 상대의 다음 차례 마지막에 고른 장소의 포켓몬을 기절시킨다.",

  "Discard all [ R ] and [ L ] Energy from this Pokémon, and this attack does 50 damage for each Energy you discarded in this way.":
    "이 포켓몬에서 불에너지와 번개에너지를 모두 트래쉬하고, 트래쉬한 에너지의 개수 × 50데미지를 준다.",

  "1 of your opponent's Pokémon is chosen at random 3 times. For each time a Pokémon was chosen, do 60 damage to it.":
    "상대의 포켓몬이 랜덤으로 3번 선택되어 선택된 포켓몬 전원에게 선택된 횟수 × 60데미지를 준다.",

  "Flip 2 coins. If both of them are heads, this attack does 100 more damage.":
    "동전을 2번 던져서 모두 앞면이 나오면 100데미지를 추가한다.",

  "If this Pokémon has a Pokémon Tool attached, this attack does 30 more damage.":
    "이 포켓몬에게 「포켓몬의 도구」가 붙어 있다면 30데미지를 추가한다.",

  "This attack does 10 more damage for each [ M ] Energy attached to this Pokémon.":
    "이 포켓몬의 강철에너지의 개수 × 10데미지를 추가한다.",

  "This attack does 80 damage to 1 of your opponent's Pokémon.":
    "상대의 포켓몬 1마리에게 80데미지를 준다.",

  "Switch your Active Stage 1 Pokémon with 1 of your Benched Pokémon.":
    "자신의 배틀필드의 1진화 포켓몬을 벤치 포켓몬과 교체한다.",

  "Take a [ C ] Energy from your Energy Zone and attach it to 1 of your Stage 2 Pokémon.":
    "자신의 에너지존에서 무색에너지를 1개보내 자신의 2진화 포켓몬에게 붙인다.",

  "At the end of each player's turn, that player heals 20 damage from each of their Pokémon that has any [ W ] Energy attached.":
    "서로의 플레이어의 차례 마지막에 물에너지가 붙어 있는 자신의 포켓몬 전원의 HP를 20회복.",

  "Once during each player's turn, that player may discard the Energy that has been generated in their Energy Zone. If they do, the next Energy is produced.":
    "서로의 플레이어는 자신의 차례에 1번 사용할 수 있다. 자신의 에너지존에 발생해 있는 에너지를 트래쉬한다. 트래쉬했다면 다음 에너지를 발생시킨다.",

  "During this turn, 1 of your opponent's Pokémon is chosen 1 more time for the Draco Meteor attack used by your Pokémon.":
    "이 차례에 자신의 포켓몬이 사용하는 「용성군」의 대상으로 상대의 포켓몬이 1번 더 선택된다.",

  "If this Pokémon and your opponent's Active Pokémon have 1 or more of the same type of Energy attached, this attack does 30 more damage.":
    "이 포켓몬과 상대의 배틀 포켓몬의 에너지 타입이 1종류 이상 같으면 30데미지를 추가한다.",

  "If this Pokémon has damage on it, this attack does 80 more damage.":
    "이 포켓몬이 데미지를 받고 있다면 80데미지를 추가한다.",

  "If your opponent's Active Pokémon has less remaining HP than this Pokémon, this attack does 80 more damage.":
    "상대의 배틀 포켓몬의 남은 HP가 이 포켓몬보다 적다면 80데미지를 추가한다.",

  "If your opponent's Active Pokémon is a Pokémon ex, this attack does 90 more damage.":
    "상대의 배틀 포켓몬이 「포켓몬 ex」라면 90데미지를 추가한다.",

  "Flip a coin. If heads, put a random Item card from your deck into your hand.":
    "동전을 1번 던져서 앞면이 나오면 자신의 덱에서 아이템을 랜덤으로 1장 패로 가져온다.",

  "Draw a card for each Poochyena you have in play.":
    "자신의 필드에 있는 포챠나의 수만큼 자신의 덱을 뽑는다.",

  "During your next turn, this Pokémon's Overacceleration attack does +70 damage.":
    "자신의 다음 차례에 이 포켓몬의 「오버액셀」의 데미지를 +70한다.",

  "At the end of your turn, if the [ D ] Pokémon this card is attached to is in the Active Spot, do 10 damage to your opponent's Active Pokémon.":
    "자신의 차례 마지막에 이 카드를 붙이고 있는 악포켓몬이 배틀필드에 있다면 상대의 배틀 포켓몬에게 10데미지를 준다.",

  "Play this card as if it were a 40-HP Basic [ C ] Pokémon. At any time during your turn, you may discard this card from play. This card can't retreat.":
    "이 카드를 HP40의 기본 무색포켓몬으로서 필드에 내보낸다. 자신의 차례라면 언제라도 필드에서 트래쉬할 수 있다. 이 카드는 후퇴할 수 없다.",

  "Prevent all effects of attacks used by your opponent's Pokémon done to the Pokémon this card is attached to. (Existing effects are not removed.)":
    "이 카드를 붙이고 있는 포켓몬은 상대의 포켓몬이 사용하는 기술의 효과를 받지 않는다. (이미 받고 있는 효과는 제거되지 않는다.)",

  "You may move any amount of Energy from your Pokémon in play to your other Pokémon in any way you like.":
    "자신의 포켓몬에게서 에너지를 원하는 만큼 자신의 다른 포켓몬에게 자유롭게 붙일 수 있다.",
};

const ABILITY_EFFECTS = {
  "Once during your turn, you may use this Ability. 1 Special Condition from among Burned, Confused, and Poisoned is chosen at random, and your opponent's Active Pokémon is now affected by that Special Condition. Any Special Conditions already affecting that Pokémon will not be chosen.":
    "자신의 차례에 1번 사용할 수 있다. 화상·혼란·독 중에서 랜덤으로 1개가 선택되어 상대의 배틀 포켓몬을 그 상태로 만든다. 이미 받고 있는 특수 상태는 선택되지 않는다.",

  "Once during your turn, when you put this Pokémon from your hand onto your Bench, you may heal 20 damage from your Active [ G ] Pokémon.":
    "자신의 차례에 이 포켓몬을 패에서 벤치로 내보냈을 때 1번 사용할 수 있다. 자신의 배틀필드의 풀포켓몬의 HP를 20회복.",

  "Once during your turn, when you play this Pokémon from your hand to evolve 1 of your Pokémon, you may prevent all damage from—and effects of—attacks from your opponent's Pokémon done to this Pokémon until the end of your opponent's next turn.":
    "자신의 차례에 이 포켓몬을 패에서 꺼내서 진화시켰을 때 1번 사용할 수 있다. 상대의 다음 차례 끝까지 이 포켓몬은 상대의 포켓몬이 사용하는 기술의 데미지와 효과를 받지 않는다.",

  "Once during your turn, when you play this Pokémon from your hand to evolve 1 of your Pokémon, you may flip a coin. If heads, your opponent's Active Pokémon is now Paralyzed.":
    "자신의 차례에 이 포켓몬을 패에서 꺼내서 진화시켰을 때 1번 사용할 수 있다. 동전을 1번 던져서 앞면이 나오면 상대의 배틀 포켓몬을 마비로 만든다.",

  "Once during your turn, if this Pokémon is on your Bench, you may attach an Energy from your discard pile to your Active [ N ] Pokémon.":
    "이 포켓몬이 벤치에 있다면 자신의 차례에 1번 사용할 수 있다. 자신의 트래쉬에서 에너지를 1개 선택해서 배틀필드의 드래곤포켓몬에게 붙인다.",

  "If you have another Beldum in play, this Pokémon's Retreat Cost is 2 less.":
    "자신의 필드에 다른 메탕이 있다면 이 포켓몬의 후퇴에 필요한 에너지가 2개 적어진다.",

  "This Pokémon may have up to 2 Pokémon Tool cards attached to it.":
    "이 포켓몬에는 「포켓몬의 도구」를 2장까지 붙일 수 있다.",

  "Once during your turn, when you play this Pokémon from your hand to evolve 1 of your Pokémon, you may look at the top 4 cards of your deck and put all Item cards you find there into your hand. Shuffle the other cards back into your deck.":
    "자신의 차례에 이 포켓몬을 패에서 꺼내서 진화시켰을 때 1번 사용할 수 있다. 자신의 덱을 위에서부터 4장 보고 그 중에서 아이템을 모두 패로 가져온다. 남은 카드는 덱으로 되돌리고 섞는다.",
};

/** Per-card field overrides (energy fixes etc.) */
const CARD_FIXES = {
  19068: { 기술명: "흉내셔플", 기술에너지: "초1", 피해량: "" },
  19074: { 기술명: "스톰피재머", 기술에너지: "무색1" },
};

function mapField(value, dict) {
  const v = String(value || "").trim();
  if (!v) return v;
  if (dict[v]) return dict[v];
  // strip leading "0 " parse bug
  if (v.startsWith("0 ") && dict[v.slice(2)]) return dict[v.slice(2)];
  return null;
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
      if (id < 19001 || id > 19155) continue;

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
        ["특성효과", ABILITY_EFFECTS],
        ["이전이름", PREV],
      ];

      for (const [field, dict] of fields) {
        if (idx[field] == null) continue;
        const cur = String(rows[i][idx[field]] || "");
        if (!cur || !/[A-Za-z]/.test(cur)) continue;
        const mapped = mapField(cur, dict);
        if (mapped) {
          rows[i][idx[field]] = mapped;
          changed++;
        } else {
          still.push({ id, field, cur: cur.slice(0, 120) });
        }
      }
    }
    wb.Sheets[sn] = XLSX.utils.aoa_to_sheet(rows);
  }

  XLSX.writeFile(wb, "app/data/card_list.xlsx");
  writeFileSync(
    "scripts/_b4_still_en.json",
    JSON.stringify(still, null, 2),
    "utf8"
  );
  console.log("changed cells", changed);
  console.log("still english", still.length);
  if (still.length) console.log(still.slice(0, 40));
}

apply();
