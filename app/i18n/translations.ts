export type Lang = "ko" | "en";

export type Translations = {
  nav: {
    cardList: string;
    deckBuilder: string;
  };
  auth: {
    login: string;
    logout: string;
  };
  theme: {
    light: string;
    dark: string;
  };
  lang: {
    label: string;
  };
  app: {
    cardListTitle: string;
  };
  search: {
    placeholder: string;
    deckPlaceholder: string;
    noResults: string;
    total: (filtered: number, total: number) => string;
    pageOf: (page: number, total: number) => string;
  };
  filter: {
    clear: string;
    pokemonType: string;
    trainers: string;
    evolutionStage: string;
    skillEnergy: string;
    retreatEnergy: string;
    cardType: string;
    expansion: string;
    all: string;
    hasAbility: string;
    hasColorlessSkill: string;
    hasColorlessSkillShort: string;
    perPage: string;
    detailFilter: string;
    energyCount: (n: number) => string;
    keywordGroups: {
      abnormal: string;
      defense: string;
      bonusDamage: string;
      damage: string;
      energy: string;
      recovery: string;
      swap: string;
      deckHand: string;
      disrupt: string;
      evolution: string;
      skillCoin: string;
      other: string;
    };
  };
  pokemonType: Record<string, string>;
  evolution: Record<string, string>;
  cardTypeLabel: {
    megaEx: string;
    baby: string;
    ultraBeast: string;
  };
  card: {
    imageLoading: string;
    noWeakness: string;
    retreat: string;
    ability: string;
    keyword: string;
    type: string;
    name: string;
    evolutionLabel: string;
    retreatEnergyLabel: string;
    weakness: string;
    expansion: string;
    skillEnergy: string;
    skillName: string;
    effect: string;
    damage: string;
    relatedSupporters: string;
    preparing: string;
    viewKeywords: string;
  };
  pagination: {
    prev: string;
    next: string;
  };
  misc: {
    disclaimer: string;
  };
  deck: {
    title: string;
    pageTitle: string;
    subtitle: string;
    save: string;
    saveNew: string;
    load: string;
    clear: string;
    viewImage: string;
    viewImageShort: string;
    imageDownload: string;
    saveDeckTitle: string;
    savedDecksTitle: string;
    update: string;
    namePlaceholder: string;
    addCards: string;
    loading: string;
    noDecks: string;
    noResults: string;
    updated: string;
    saved: string;
    saveError: string;
    emptyError: string;
    favoriteError: string;
    clickToRemove: string;
    copyName: string;
    showDetail: string;
    showSimple: string;
    requiredEnergy: string;
    share: string;
    shareShort: string;
    shareCopied: string;
    shareLoaded: string;
    memo: string;
    memoPlaceholder: string;
    copyDeck: string;
    copyOf: string;
    undo: string;
    columns: {
      qty: string;
      name: string;
      type: string;
      expansion: string;
    };
  };
  favorites: {
    title: string;
    addTitle: (current: number, max: number) => string;
    removeTitle: string;
  };
  recommended: {
    title: string;
    synergy: string;
  };
  diagnosis: {
    button: string;
    title: string;
    noWarnings: string;
    compositionTitle: string;
    typeTitle: string;
    pokemon: string;
    trainer: string;
    noPokemon: string;
    noTrainer: string;
    fewPokemon: (n: number) => string;
    fewTrainer: (n: number) => string;
    noStage1: string;
    noBasic: string;
    missingPreEvolution: (evoName: string, preName: string) => string;
    keywordsTitle: string;
    strengthWeaknessTitle: string;
    strengthLabel: string;
    weaknessLabel: string;
    strongAgainst: (type: string) => string;
    weakAgainst: (type: string) => string;
    noWeaknessInDeck: string;
    noStrength: string;
    weakToItemBan: string;
    weakToSupportBan: string;
    strongVsItemHeavy: string;
    strongVsSupportHeavy: string;
    strongVsStatusDeck: string;
  };
};

export const ko: Translations = {
  nav: {
    cardList: "카드 리스트",
    deckBuilder: "덱 빌더",
  },
  auth: {
    login: "Google 로그인",
    logout: "로그아웃",
  },
  theme: {
    light: "라이트",
    dark: "다크",
  },
  lang: {
    label: "EN",
  },
  app: {
    cardListTitle: "포켓몬 포켓 카드 리스트",
  },
  search: {
    placeholder: "이름, 기술명, 키워드 등으로 검색...",
    deckPlaceholder: "이름, 기술명, 키워드로 검색...",
    noResults: "검색 결과가 없습니다.",
    total: (filtered, total) => `총 ${filtered}장 / ${total}장`,
    pageOf: (page, total) => `페이지 ${page} / ${total}`,
  },
  filter: {
    clear: "초기화",
    pokemonType: "포켓몬 타입",
    trainers: "트레이너스",
    evolutionStage: "진화단계",
    skillEnergy: "기술에너지",
    retreatEnergy: "후퇴에너지",
    cardType: "카드타입",
    expansion: "확장팩",
    all: "전체",
    hasAbility: "특성있음",
    hasColorlessSkill: "무색기술있음(무색 포켓몬 제외)",
    hasColorlessSkillShort: "무색기술있음",
    perPage: "페이지당",
    detailFilter: "상세 필터",
    energyCount: (n) => `${n}개`,
    keywordGroups: {
      abnormal: "상태 이상",
      defense: "방어/면역",
      bonusDamage: "추가 피해",
      damage: "피해/공격",
      energy: "에너지 관련",
      recovery: "회복 관련",
      swap: "교체/이동",
      deckHand: "덱·패 조작",
      disrupt: "방해/차단",
      evolution: "진화 관련",
      skillCoin: "기술/동전",
      other: "기타",
    },
  },
  pokemonType: {
    풀: "풀",
    불: "불",
    물: "물",
    번개: "번개",
    초: "초",
    격투: "격투",
    악: "악",
    강철: "강철",
    드래곤: "드래곤",
    무색: "무색",
  },
  evolution: {
    기본: "기본",
    "1진화": "1진화",
    "2진화": "2진화",
  },
  cardTypeLabel: {
    megaEx: "메가ex",
    baby: "베이비",
    ultraBeast: "울트라비스트",
  },
  card: {
    imageLoading: "이미지 준비중",
    noWeakness: "약점 없음",
    retreat: "후퇴",
    ability: "특성",
    keyword: "키워드",
    type: "타입",
    name: "이름",
    evolutionLabel: "진화",
    retreatEnergyLabel: "후퇴에너지",
    weakness: "약점",
    expansion: "확장팩",
    skillEnergy: "필요 에너지",
    skillName: "기술명",
    effect: "효과",
    damage: "피해",
    relatedSupporters: "관련서포터",
    preparing: "준비중입니다",
    viewKeywords: "보기",
  },
  pagination: {
    prev: "이전",
    next: "다음",
  },
  misc: {
    disclaimer: "* 중복된 카드는 제외하였습니다.",
  },
  deck: {
    title: "나의 덱",
    pageTitle: "포켓몬 포켓 덱 빌더",
    subtitle: "최대 20장, 같은 이름 최대 2장",
    save: "저장",
    saveNew: "새로 저장",
    load: "불러오기",
    clear: "초기화",
    viewImage: "이미지로 보기",
    viewImageShort: "이미지",
    imageDownload: "이미지 다운로드",
    saveDeckTitle: "덱 저장",
    savedDecksTitle: "저장된 덱",
    update: "업데이트",
    namePlaceholder: "덱 이름 입력...",
    addCards: "카드를 추가해보세요",
    loading: "불러오는 중...",
    noDecks: "저장된 덱이 없습니다.",
    noResults: "검색 결과가 없습니다.",
    updated: "덱이 업데이트되었습니다.",
    saved: "덱이 저장되었습니다.",
    saveError: "저장 실패: ",
    emptyError: "덱이 비어 있습니다. 카드를 추가해주세요.",
    favoriteError: "즐겨찾기 실패",
    clickToRemove: "클릭하면 1장 제거",
    copyName: "포켓몬명 복사",
    showDetail: "상세보기",
    showSimple: "간소화",
    requiredEnergy: "필요 에너지",
    share: "링크 공유",
    shareShort: "공유",
    shareCopied: "덱 링크가 복사되었습니다!",
    shareLoaded: "공유된 덱을 불러왔습니다.",
    memo: "메모",
    memoPlaceholder: "전략 메모, 교체 후보 카드, 플레이 팁 등...",
    copyDeck: "복사본으로 새 덱 만들기",
    copyOf: "복사본 - ",
    undo: "실행 취소",
    columns: {
      qty: "수량",
      name: "이름",
      type: "타입",
      expansion: "확장팩",
    },
  },
  favorites: {
    title: "즐겨찾기",
    addTitle: (current, max) => `즐겨찾기 추가 (${current}/${max})`,
    removeTitle: "즐겨찾기 해제",
  },
  recommended: {
    title: "추천 카드",
    synergy: "덱에 있는 포켓몬과 시너지가 있는 카드",
  },
  diagnosis: {
    button: "덱 진단",
    title: "덱 진단",
    noWarnings: "덱 구성이 양호합니다.",
    compositionTitle: "구성 비율",
    typeTitle: "타입별 분포",
    pokemon: "포켓몬",
    trainer: "트레이너스",
    noPokemon: "포켓몬 카드가 없습니다.",
    noTrainer: "트레이너스 카드가 없습니다.",
    fewPokemon: (n) => `포켓몬 ${n}장 (권장 8장 이상)`,
    fewTrainer: (n) => `트레이너스 ${n}장 (권장 4장 이상)`,
    noStage1: "2진화 포켓몬이 있지만 1진화 포켓몬이 없습니다.",
    noBasic: "진화 포켓몬이 있지만 기본 포켓몬이 없습니다.",    missingPreEvolution: (evoName, preName) => `${evoName}을(를) 진화시킬 ${preName}이(가) 덱에 없습니다.`,    keywordsTitle: "키워드 집합",
    strengthWeaknessTitle: "강점 / 약점",
    strengthLabel: "강점",
    weaknessLabel: "약점",
    strongAgainst: (type) => `타입 덱에 강합니다`,
    weakAgainst: (type) => `타입 덱에 약합니다`,
    noWeaknessInDeck: "덱은 약점 타입이 없습니다",
    noStrength: "분석 불가",
    weakToItemBan: "아이템 금지 덱에 약합니다",
    weakToSupportBan: "서포트 금지 덱에 약합니다",
    strongVsItemHeavy: "아이템을 많이 보유한 덱에 강합니다",
    strongVsSupportHeavy: "서포트를 많이 보유한 덱에 강합니다",
    strongVsStatusDeck: "특수상태를 부여하는 덱에 강합니다",
  },
};

export const en: Translations = {
  nav: {
    cardList: "Card List",
    deckBuilder: "Deck Builder",
  },
  auth: {
    login: "Sign in with Google",
    logout: "Sign out",
  },
  theme: {
    light: "Light",
    dark: "Dark",
  },
  lang: {
    label: "한국어",
  },
  app: {
    cardListTitle: "Pokémon Pocket Card List",
  },
  search: {
    placeholder: "Search by name, skill, keyword...",
    deckPlaceholder: "Search by name, skill, keyword...",
    noResults: "No results found.",
    total: (filtered, total) => `${filtered} / ${total} cards`,
    pageOf: (page, total) => `Page ${page} / ${total}`,
  },
  filter: {
    clear: "Clear",
    pokemonType: "Pokémon Type",
    trainers: "Trainers",
    evolutionStage: "Evolution",
    skillEnergy: "Skill Energy",
    retreatEnergy: "Retreat Energy",
    cardType: "Card Type",
    expansion: "Expansion",
    all: "All",
    hasAbility: "Has Ability",
    hasColorlessSkill: "Has Colorless Skill (excl. Colorless Pokémon)",
    hasColorlessSkillShort: "Has Colorless Skill",
    perPage: "per page",
    detailFilter: "Advanced",
    energyCount: (n) => `${n}`,
    keywordGroups: {
      abnormal: "Status Conditions",
      defense: "Defense/Immunity",
      bonusDamage: "Bonus Damage",
      damage: "Damage/Attack",
      energy: "Energy",
      recovery: "Recovery",
      swap: "Swap/Move",
      deckHand: "Deck/Hand",
      disrupt: "Disruption",
      evolution: "Evolution",
      skillCoin: "Skills/Coins",
      other: "Other",
    },
  },
  pokemonType: {
    풀: "Grass",
    불: "Fire",
    물: "Water",
    번개: "Lightning",
    초: "Psychic",
    격투: "Fighting",
    악: "Darkness",
    강철: "Metal",
    드래곤: "Dragon",
    무색: "Colorless",
  },
  evolution: {
    기본: "Basic",
    "1진화": "Stage 1",
    "2진화": "Stage 2",
  },
  cardTypeLabel: {
    megaEx: "Mega ex",
    baby: "Baby",
    ultraBeast: "Ultra Beast",
  },
  card: {
    imageLoading: "Image loading",
    noWeakness: "No weakness",
    retreat: "Retreat",
    ability: "Ability",
    keyword: "Keyword",
    type: "Type",
    name: "Name",
    evolutionLabel: "Evo",
    retreatEnergyLabel: "Retreat",
    weakness: "Weakness",
    expansion: "Expansion",
    skillEnergy: "Skill Energy",
    skillName: "Skill",
    effect: "Effect",
    damage: "DMG",
    relatedSupporters: "Supporters",
    preparing: "Coming soon",
    viewKeywords: "View",
  },
  pagination: {
    prev: "Prev",
    next: "Next",
  },
  misc: {
    disclaimer: "* Data may differ from the actual game. Duplicate cards are excluded.",
  },
  deck: {
    title: "My Deck",
    pageTitle: "Pokémon Pocket Deck Builder",
    subtitle: "Max 20 cards, max 2 of the same name",
    save: "Save",
    saveNew: "Save New",
    load: "Load",
    clear: "Clear",
    viewImage: "View as Image",
    viewImageShort: "Image",
    imageDownload: "Download Image",
    saveDeckTitle: "Save Deck",
    savedDecksTitle: "Saved Decks",
    update: "Update",
    namePlaceholder: "Enter deck name...",
    addCards: "Add cards to your deck",
    loading: "Loading...",
    noDecks: "No saved decks.",
    noResults: "No results found.",
    updated: "Deck updated.",
    saved: "Deck saved.",
    saveError: "Save failed: ",
    emptyError: "Deck is empty. Please add some cards.",
    favoriteError: "Favorite failed",
    clickToRemove: "Click to remove one",
    copyName: "Copy Pokémon name",
    showDetail: "Detail",
    showSimple: "Simple",
    requiredEnergy: "Required Energy",
    share: "Share Link",
    shareShort: "Share",
    shareCopied: "Deck link copied!",
    shareLoaded: "Shared deck loaded.",
    memo: "Memo",
    memoPlaceholder: "Strategy notes, alt cards, tips...",
    copyDeck: "Copy as New Deck",
    copyOf: "Copy of ",
    undo: "Undo",
    columns: {
      qty: "Qty",
      name: "Name",
      type: "Type",
      expansion: "Expansion",
    },
  },
  favorites: {
    title: "Favorites",
    addTitle: (current, max) => `Add to Favorites (${current}/${max})`,
    removeTitle: "Remove from Favorites",
  },
  recommended: {
    title: "Recommended",
    synergy: "Cards with synergy for your deck",
  },
  diagnosis: {
    button: "Diagnose",
    title: "Deck Diagnosis",
    noWarnings: "Deck composition looks good.",
    compositionTitle: "Composition",
    typeTitle: "Type Distribution",
    pokemon: "Pokémon",
    trainer: "Trainers",
    noPokemon: "No Pokémon cards in deck.",
    noTrainer: "No Trainer cards in deck.",
    fewPokemon: (n) => `${n} Pokémon (8+ recommended)`,
    fewTrainer: (n) => `${n} Trainers (4+ recommended)`,
    noStage1: "Has Stage 2 but no Stage 1 Pokémon.",
    noBasic: "Has evolved Pokémon but no Basic.",
    missingPreEvolution: (evoName, preName) => `No ${preName} in deck to evolve into ${evoName}.`,
    keywordsTitle: "Keywords",
    strengthWeaknessTitle: "Strengths / Weaknesses",
    strengthLabel: "Strengths",
    weaknessLabel: "Weaknesses",
    strongAgainst: (type) => `Strong against ${type}-type decks`,
    weakAgainst: (type) => `Weak against ${type}-type decks`,
    noWeaknessInDeck: "This deck has no type weaknesses",
    noStrength: "N/A",
    weakToItemBan: "Weak against Item-lock decks",
    weakToSupportBan: "Weak against Supporter-lock decks",
    strongVsItemHeavy: "Strong against Item-heavy decks",
    strongVsSupportHeavy: "Strong against Supporter-heavy decks",
    strongVsStatusDeck: "Strong against decks that inflict Special Conditions",
  },
};

export const translations: Record<Lang, Translations> = { ko, en };
