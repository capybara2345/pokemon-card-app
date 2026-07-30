import fs from "fs";

const applySrc = fs.readFileSync("scripts/apply-b4-ko.mjs", "utf8");

function extractConstObject(name) {
  const start = applySrc.indexOf(`const ${name} = {`);
  if (start < 0) throw new Error(`missing ${name}`);
  let i = applySrc.indexOf("{", start);
  let depth = 0;
  for (; i < applySrc.length; i++) {
    const ch = applySrc[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        const objSrc = applySrc.slice(applySrc.indexOf("{", start), i + 1);
        return Function(`"use strict"; return (${objSrc});`)();
      }
    }
  }
  throw new Error(`unclosed ${name}`);
}

function reverse(obj) {
  const out = {};
  for (const [en, ko] of Object.entries(obj)) {
    if (!ko) continue;
    out[ko] = String(en).replace(/^0 /, "");
  }
  return out;
}

const MOVES = extractConstObject("MOVES");
const ABILITIES = extractConstObject("ABILITIES");
const EFFECTS = extractConstObject("EFFECTS");
const ABILITY_EFFECTS = extractConstObject("ABILITY_EFFECTS");

const existing = JSON.parse(
  fs.readFileSync("app/data/b4_en_supplement.json", "utf8")
);
existing.moves = { ...(existing.moves || {}), ...reverse(MOVES) };
existing.abilities = { ...(existing.abilities || {}), ...reverse(ABILITIES) };
existing.moveEffects = { ...(existing.moveEffects || {}), ...reverse(EFFECTS) };
existing.abilityEffects = {
  ...(existing.abilityEffects || {}),
  ...reverse(ABILITY_EFFECTS),
};
existing.moveEffects[
  "자신의 배틀 포켓몬이 「사이코키네시스」 기술을 가지고 있을 때만 사용할 수 있다. 상대의 벤치 포켓몬 1마리를 선택해서 그 포켓몬에서 에너지를 랜덤으로 1개 상대의 배틀 포켓몬에게 붙인다."
] =
  "You can use this card only if your Pokémon in the Active Spot has the Psychic attack. Choose 1 of your opponent's Benched Pokémon and move a random Energy from it to your opponent's Active Pokémon.";

fs.writeFileSync(
  "app/data/b4_en_supplement.json",
  JSON.stringify(existing, null, 2) + "\n"
);

for (const [path, key] of [
  ["app/data/tcg_move_map.json", "moves"],
  ["app/data/tcg_ability_map.json", "abilities"],
  ["app/data/tcg_move_effect_map.json", "moveEffects"],
  ["app/data/tcg_ability_effect_map.json", "abilityEffects"],
]) {
  const map = JSON.parse(fs.readFileSync(path, "utf8"));
  Object.assign(map, existing[key]);
  fs.writeFileSync(path, JSON.stringify(map, null, 2) + "\n");
}

console.log("ok", {
  moves: Object.keys(existing.moves).length,
  abilities: Object.keys(existing.abilities).length,
  moveEffects: Object.keys(existing.moveEffects).length,
  abilityEffects: Object.keys(existing.abilityEffects).length,
});
