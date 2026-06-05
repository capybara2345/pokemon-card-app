import type { Lang } from "../i18n/translations";

// 프로모 카드(Z 시리즈)는 내부적으로 900001+ 범위의 숫자 ID를 사용.
// Z00001 → 900001, Z00002 → 900002, ...
const PROMO_BASE = 900000;

export function getCardImageSrc(id: number): string {
  if (id > PROMO_BASE && id < 1000000) {
    const n = String(id - PROMO_BASE).padStart(5, "0");
    return `/cards/Z/Z${n}.webp`;
  }
  return `/cards/${Math.floor(id / 1000)}/${id}.webp`;
}

/**
 * 언어별 카드 이미지 URL
 * - ko: public/cards/{ID/1000}/{ID}.webp (한글 카드)
 * - en: cards.json GitHub URL 우선, 없으면 로컬 webp
 */
export function resolveCardImageSrc(
  id: number,
  image: string | undefined,
  lang: Lang
): string {
  if (lang === "ko") return getCardImageSrc(id);
  const remote = image?.trim();
  if (remote) return remote;
  return getCardImageSrc(id);
}

/** 이미지 로드 실패 시 대체 URL (영어만 remote ↔ local 전환) */
export function getCardImageAlternateSrc(
  id: number,
  image: string | undefined,
  failedSrc: string,
  lang: Lang
): string | null {
  if (lang !== "en") return null;
  const remote = image?.trim() ?? "";
  const local = getCardImageSrc(id);
  if (failedSrc === remote && local !== remote) return local;
  if (failedSrc === local && remote) return remote;
  return null;
}

export function parseCardId(rawId: string): number {
  const promoMatch = rawId.match(/^Z(\d+)$/i);
  if (promoMatch) return PROMO_BASE + parseInt(promoMatch[1], 10);
  const n = Number(rawId);
  return isNaN(n) ? 0 : n;
}

export type PokemonCard = {
  ID: number;
  타입: string;
  카드타입: string;
  이름: string;
  진화: string;
  HP: number;
  기술명: string;
  기술명2?: string;
  기술추가효과: string;
  기술추가효과2?: string;
  필요에너지: string;
  필요에너지2?: string;
  피해량: string;
  피해량2?: string;
  후퇴에너지: number;
  특성: string;
  특성효과: string;
  약점: string;
  관련서포터?: string;
  관련아이템?: string;
  관련도구?: string;
  관련스타디움?: string;
  이전이름?: string;
  키워드: string;
  확장팩: string;
  image?: string;
};

export const pokemonCards: PokemonCard[] = [
  {
    ID: 1001,
    타입: "풀",
    카드타입: "",
    이름: "이상해씨",
    진화: "기본",
    HP: 70,
    기술명: "덩굴채찍",
    기술추가효과: "-",
    필요에너지: "풀1/무색1",
    피해량: "40",
    후퇴에너지: 1,
    특성: "",
    특성효과: "-",
    약점: "불",
    관련서포터: "",
    키워드: "",
    확장팩: "최강의 유전자",
  },
];
