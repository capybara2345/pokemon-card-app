export type CardTypeFlags = {
  megaEx: boolean;
  ex: boolean;
  ultraBeast: boolean;
  baby: boolean;
  ancient: boolean;
  future: boolean;
};

function tokenize(카드타입?: string): string[] {
  if (!카드타입?.trim()) return [];
  return 카드타입.split(",").map((v) => v.trim().toLowerCase());
}

function hasToken(tokens: string[], ...labels: string[]): boolean {
  return labels.some((label) => tokens.includes(label));
}

export function parseCardTypeFlags(카드타입?: string): CardTypeFlags {
  const tokens = tokenize(카드타입);

  const megaEx = hasToken(tokens, "메가ex", "mega ex");
  const ultraBeast = hasToken(tokens, "울트라비스트", "ultra beast");
  const baby = hasToken(tokens, "베이비", "baby");
  const ancient = hasToken(tokens, "고대", "ancient");
  const future = hasToken(tokens, "미래", "future");
  const ex = tokens.includes("ex");

  return { megaEx, ex, ultraBeast, baby, ancient, future };
}

/** 필터 칩(고대/미래 등)과 카드 속성(고대/Ancient) 매칭 */
export function cardMatchesCardTypeFilter(카드타입: string | undefined, filter: string): boolean {
  const flags = parseCardTypeFlags(카드타입);
  const f = filter.trim().toLowerCase();
  switch (f) {
    case "메가ex":
    case "mega ex":
      return flags.megaEx;
    case "ex":
      return flags.ex;
    case "울트라비스트":
    case "ultra beast":
      return flags.ultraBeast;
    case "베이비":
    case "baby":
      return flags.baby;
    case "고대":
    case "ancient":
      return flags.ancient;
    case "미래":
    case "future":
      return flags.future;
    default:
      return tokenize(카드타입).includes(f);
  }
}
