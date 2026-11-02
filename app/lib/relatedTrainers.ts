import { isPokemonCardType, type PokemonCard } from "../data/cards";
import { parseCardTypeFlags } from "./cardTypeFlags";

import {
  formatRelatedSupporters,
  getRelatedSupporters,
} from "./relatedSupporters";

export { getRelatedSupporters, formatRelatedSupporters };

const FIRE_TYPES = new Set(["불", "Fire"]);
const WATER_TYPES = new Set(["물", "Water"]);
const GRASS_TYPES = new Set(["풀", "Grass"]);
const LIGHTNING_TYPES = new Set(["번개", "Lightning"]);
const PSYCHIC_TYPES = new Set(["초", "Psychic"]);
const STEEL_TYPES = new Set(["강철", "Metal"]);
const DARK_TYPES = new Set(["악", "Darkness"]);
const BASIC_STAGE = new Set(["기본", "Basic"]);
const STAGE_1 = new Set(["1진화", "Stage 1"]);
const STAGE_2 = new Set(["2진화", "Stage 2"]);
const FIGHTING_TYPES = new Set(["격투", "Fighting"]);

function isPokemonCard(card: PokemonCard): boolean {
  return isPokemonCardType(card.타입);
}

function baseName(name: string): string {
  return name.replace(/\s+ex$/i, "").trim();
}

function pushUnique(list: string[], ...names: string[]) {
  for (const name of names) {
    if (name && !list.includes(name)) list.push(name);
  }
}

function isEeveeEvolution(card: PokemonCard): boolean {
  const pre = card.이전이름?.trim();
  return pre === "이브이" || pre === "Eevee";
}

export function getRelatedItems(card: PokemonCard): string[] {
  if (!isPokemonCard(card)) return [];

  const items: string[] = [];
  const name = baseName(card.이름);

  if (card.이름 === "메가뮤츠Y ex" || card.이름 === "Mega Mewtwo Y ex") {
    pushUnique(items, "게놈 컨버터Y");
  }
  if (name === "레어코일" || name === "Magneton") {
    pushUnique(items, "시트론의 륙색");
  }
  if (name === "일레도리자드" || name === "Electivire") {
    pushUnique(items, "시트론의 륙색");
  }
  if (isEeveeEvolution(card)) {
    pushUnique(items, "이브이 가방");
  }
  if (parseCardTypeFlags(card.카드타입).ultraBeast) {
    pushUnique(items, "비스트월");
  }
  if (WATER_TYPES.has(card.타입) && BASIC_STAGE.has(card.진화)) {
    pushUnique(items, "물고기네트");
  }
  if (FIRE_TYPES.has(card.타입)) {
    pushUnique(items, "플레임패치");
  }
  if (GRASS_TYPES.has(card.타입)) {
    pushUnique(items, "조숙엑기스");
  }
  if (LIGHTNING_TYPES.has(card.타입)) {
    pushUnique(items, "일렉트릭 제너레이터");
  }
  if (PSYCHIC_TYPES.has(card.타입)) {
    pushUnique(items, "환상의 석판");
  }

  return items;
}

export function getRelatedTools(card: PokemonCard): string[] {
  if (!isPokemonCard(card)) return [];

  const tools: string[] = [];
  const flags = parseCardTypeFlags(card.카드타입);

  if (GRASS_TYPES.has(card.타입)) {
    pushUnique(tools, "리프망토");
  }
  if (LIGHTNING_TYPES.has(card.타입)) {
    pushUnique(tools, "일렉트릭코드");
  }
  if (flags.ultraBeast) {
    pushUnique(tools, "비스트나이트");
  }
  if (STEEL_TYPES.has(card.타입)) {
    pushUnique(tools, "강철 앞치마", "메탈코어 배리어");
  }
  if (DARK_TYPES.has(card.타입)) {
    pushUnique(tools, "다크펜던트", "속임수바늘");
  }
  if (WATER_TYPES.has(card.타입)) {
    pushUnique(tools, "워터 보트");
  }
  if (card.후퇴에너지 >= 3) {
    pushUnique(tools, "헤비멧");
  }
  if (BASIC_STAGE.has(card.진화)) {
    pushUnique(tools, "작은 풍선", "진화의휘석");
  }
  if (card.이름 === "피카츄 ex" || card.이름 === "Pikachu ex") {
    pushUnique(tools, "전기구슬");
  }
  if (STAGE_1.has(card.진화)) {
    pushUnique(tools, "우아한 망토");
  }
  if (STAGE_2.has(card.진화)) {
    pushUnique(tools, "커다란풍선");
  }
  if (flags.ancient) {
    pushUnique(tools, "부스트에너지 고대");
  }
  if (flags.future) {
    pushUnique(tools, "부스트에너지 미래");
  }

  return tools;
}

export function getRelatedStadium(card: PokemonCard): string[] {
  if (!isPokemonCard(card)) return [];

  const stadiums: string[] = [];

  if (STAGE_1.has(card.진화)) {
    pushUnique(stadiums, "트레이닝 에리어");
  }
  if (BASIC_STAGE.has(card.진화)) {
    pushUnique(stadiums, "시작의 평원");
  }
  if (WATER_TYPES.has(card.타입)) {
    pushUnique(stadiums, "다독이는 해변");
  }
  if (PSYCHIC_TYPES.has(card.타입)) {
    pushUnique(stadiums, "이상한 광장");
  }
  if (GRASS_TYPES.has(card.타입)) {
    pushUnique(stadiums, "달콤한 향기의 숲");
  }
  if (FIGHTING_TYPES.has(card.타입)) {
    pushUnique(stadiums, "옛 투기장");
  }

  return stadiums;
}

export function formatRelatedItems(card: PokemonCard): string {
  return getRelatedItems(card).join(", ");
}

export function formatRelatedTools(card: PokemonCard): string {
  return getRelatedTools(card).join(", ");
}

export function formatRelatedStadium(card: PokemonCard): string {
  return getRelatedStadium(card).join(", ");
}

export function getRelatedSortValue(
  card: PokemonCard,
  key: "관련서포터" | "관련아이템" | "관련도구" | "관련스타디움",
): string {
  switch (key) {
    case "관련서포터":
      return formatRelatedSupporters(card);
    case "관련아이템":
      return formatRelatedItems(card);
    case "관련도구":
      return formatRelatedTools(card);
    case "관련스타디움":
      return formatRelatedStadium(card);
  }
}
