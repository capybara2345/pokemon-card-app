import type { PokemonCard } from "../data/cards";
import { parseCardTypeFlags } from "./cardTypeFlags";

function hasCardTypeLabel(card: PokemonCard, koLabel: string, _enLabel: string): boolean {
  const flags = parseCardTypeFlags(card.카드타입);
  if (koLabel === "고대") return flags.ancient;
  if (koLabel === "미래") return flags.future;
  return (card.카드타입 ?? "").includes(koLabel);
}

/** 포켓몬·트레이너 카드에 맞는 관련 서포트 카드 이름 목록 */
export function getRelatedSupporters(card: PokemonCard): string[] {
  const supporters: string[] = [];

  if (card.진화 === "1진화") supporters.push("관광객");
  if (card.진화 === "2진화") supporters.push("릴리에");
  if (card.타입 === "풀") supporters.push("민화");
  if (card.타입 === "물") supporters.push("이슬");
  if (card.타입 === "물") supporters.push("낚시꾼");
  if (card.타입 === "물" && !card.카드타입?.includes("메가ex")) supporters.push("파라솔 아가씨");
  if (card.타입 === "물" && card.HP <= 50) supporters.push("윤진");
  if (card.타입 === "초") supporters.push("유빈");
  if (card.타입 === "초") supporters.push("카르네");
  if (card.타입 === "격투") supporters.push("등산가");
  if (card.타입 === "격투") supporters.push("코르니");
  if (card.타입 === "강철") supporters.push("찬석");
  if (card.타입 === "무색") supporters.push("일리마");
  if (hasCardTypeLabel(card, "고대", "Ancient")) supporters.push("올림박사");
  if (hasCardTypeLabel(card, "미래", "Future")) supporters.push("투로박사");
  if (card.이름 === "딱구리" || card.이름 === "롱스톤") supporters.push("웅");
  if (card.이름 === "나인테일" || card.이름 === "날쌩마") supporters.push("강연");
  if (card.이름 === "질뻐기" || card.이름 === "또도가스") supporters.push("독수");
  if (card.이름 === "라이츄" || card.이름 === "붐볼" || card.이름 === "에레브") supporters.push("마티스");
  if (card.이름 === "뮤 ex") supporters.push("신출내기 조사원");
  if (card.이름 === "나옹마" || card.이름 === "스컹뿡" || card.이름 === "삐딱구리") supporters.push("갤럭시단의 조무래기");
  if (card.이름 === "한카리아스" || card.이름 === "토게키스") supporters.push("난천");
  if (card.이름 === "에레키블" || card.이름 === "렌트라") supporters.push("전진");
  if (card.이름 === "잠만보" || card.이름 === "헤라크로스" || card.이름 === "찌르호크") supporters.push("용식");
  if (card.이름 === "모래성이당" || card.이름 === "따라큐") supporters.push("아세로라");
  if (card.이름 === "알로라 텅구리" || card.이름 === "폭거북스") supporters.push("키아웨");
  if (card.이름 === "깨비물거미") supporters.push("수련");
  if (card.이름 === "알로라 딱구리" || card.이름 === "투구뿌논" || card.이름 === "토게데마루") supporters.push("마마네");
  if (card.이름 === "마셰이드" || card.이름 === "달코퀸") supporters.push("마오");
  if (card.이름 === "타입:널" || card.이름 === "실버디") supporters.push("글라디오");
  if (card.이름 === "모크나이퍼 ex" || card.이름 === "어흥염 ex" || card.이름 === "누리레느 ex") supporters.push("하우");
  if (card.이름 === "강철톤" || card.이름 === "무장조 ex") supporters.push("규리");
  if (card.이름 === "밀탱크") supporters.push("꼭두");
  if (card.이름 === "늑골라" || card.이름 === "탱탱겔") supporters.push("시즈");
  if (card.이름 === "하리뭉" || card.이름 === "모단단게") supporters.push("할라");
  if (card.이름 === "둥실라이드" || card.이름 === "무우마직") supporters.push("멜리사");
  if (card.이름 === "레어코일" || card.이름 === "일레도리자드") supporters.push("시트론");
  if (card.이름 === "가라르 가로막구리") supporters.push("두송");
  if (card.이름 === "빠르모트") supporters.push("네모");
  if (card.이름 === "엑스라이즈") supporters.push("아이리스");
  if (card.이름 === "보르그" || card.이름 === "바랜드") supporters.push("체렌");
  if (card.기술명 === "강아지투성이") supporters.push("퍼피 러빙걸");
  const typeFlags = parseCardTypeFlags(card.카드타입);
  if (typeFlags.ultraBeast) supporters.push("루자미네");
  if (typeFlags.megaEx) {
    supporters.push("세레나");
    supporters.push("칼름");
  }
  if (
    card.키워드?.includes("동전 기반") ||
    card.키워드?.includes("동전 상태이상") ||
    card.키워드?.includes("동전 기술 실패") ||
    card.키워드?.includes("동전 피격")
  ) {
    supporters.push("일목");
  }
  const hp = typeof card.HP === "number" ? card.HP : parseInt(String(card.HP), 10);
  if (hp <= 50 && card.진화 === "기본") supporters.push("루티아");

  return supporters;
}

export function formatRelatedSupporters(card: PokemonCard): string {
  return getRelatedSupporters(card).join(", ");
}

export function deckHasCardType(
  deck: { card: PokemonCard }[],
  typeLabel: "고대" | "미래",
): boolean {
  const enLabel = typeLabel === "고대" ? "Ancient" : "Future";
  return deck.some(({ card }) => hasCardTypeLabel(card, typeLabel, enLabel));
}

export function isAncientSupporterCard(name: string): boolean {
  return name === "올림박사" || name === "Professor Sada";
}

export function isFutureSupporterCard(name: string): boolean {
  return name === "투로박사" || name === "Professor Turo";
}
