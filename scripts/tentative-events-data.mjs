/**
 * 예상 일정 수동 보정·보충 데이터.
 *
 * - TENTATIVE_LOCALIZATIONS: PZ 자동 수집 항목에 한국어 제목·ID·hideWhenConfirmedId 적용
 * - MANUAL_TENTATIVE_EVENTS: PZ/공식 발표 선행 항목 (PZ fetch 실패 시 캐시와 함께 폴백)
 */
export const TENTATIVE_LOCALIZATIONS = [
  {
    match: /everyday wonders emblem/i,
    id: "tentative-everyday-wonders-emblem",
    title: { en: "Everyday Wonders Emblem", ko: "미라클 데이즈 엠블럼" },
  },
  {
    match: /^community week\b/i,
    id: "tentative-july-community-week",
    title: { en: "Community Week", ko: "커뮤니티 위크" },
  },
  {
    match: /hisuian zorua/i,
    id: "tentative-hisuian-zorua-drop",
    title: { en: "Hisuian Zorua Drop", ko: "히스이 조로아 드롭" },
  },
  {
    match: /growlithe.*emolga|emolga.*growlithe/i,
    id: "tentative-growlithe-emolga-wonder",
    title: { en: "Growlithe & Emolga Wonder Pick", ko: "가디·에몽가 원더픽" },
  },
  {
    match: /ruler of (the )?skies/i,
    id: "tentative-b4-expansion",
    title: { en: "Ruler of the Skies", ko: "천공의 지배자" },
    hideWhenConfirmedId: "expansion-b4",
  },
];

/** PZ upcoming에 없거나 fetch 실패 시 사용하는 공식 발표 기반 예상 일정 */
export const MANUAL_TENTATIVE_EVENTS = [
  {
    id: "tentative-everyday-wonders-emblem",
    type: "emblem",
    estimatedStart: "2026-07-01",
    estimatedEnd: "2026-07-15",
    title: {
      en: "Everyday Wonders Emblem",
      ko: "미라클 데이즈 엠블럼",
    },
  },
  {
    id: "tentative-july-community-week",
    type: "community",
    estimatedStart: "2026-07-10",
    estimatedEnd: "2026-07-20",
    title: {
      en: "Community Week",
      ko: "커뮤니티 위크",
    },
  },
  {
    id: "tentative-hisuian-zorua-drop",
    type: "drop",
    estimatedStart: "2026-07-15",
    estimatedEnd: "2026-07-28",
    title: {
      en: "Hisuian Zorua Drop",
      ko: "히스이 조로아 드롭",
    },
  },
  {
    id: "tentative-growlithe-emolga-wonder",
    type: "wonder",
    estimatedStart: "2026-07-15",
    estimatedEnd: "2026-07-28",
    title: {
      en: "Growlithe & Emolga Wonder Pick",
      ko: "가디·에몽가 원더픽",
    },
  },
  {
    id: "tentative-b4-expansion",
    type: "expansion",
    estimatedStart: "2026-07-30",
    estimatedEnd: "2026-07-30",
    hideWhenConfirmedId: "expansion-b4",
    title: {
      en: "Ruler of the Skies",
      ko: "천공의 지배자",
    },
  },
];
