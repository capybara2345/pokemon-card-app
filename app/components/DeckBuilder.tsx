"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { type PokemonCard, getCardImageSrc } from "../data/cards";
import type { Session } from "next-auth";
import { useLanguage } from "../i18n/context";
import {
  saveDeckToFirestore,
  updateDeckInFirestore,
  loadDecksFromFirestore,
  deleteDeckFromFirestore,
  loadFavoritesFromFirestore,
  toggleFavoriteInFirestore,
  type SavedDeck,
  type DeckCard,
  MAX_DECKS,
  MAX_FAVORITES,
} from "@/app/lib/deckFirestore";

const MAX_DECK = 20;
const MAX_SAME_NAME = 2;
const PAGE_SIZE = 30;

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  풀: { bg: "bg-green-100", text: "text-green-800", border: "border-green-300" },
  불: { bg: "bg-red-100", text: "text-red-800", border: "border-red-300" },
  물: { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-300" },
  번개: { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-300" },
  초: { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-300" },
  악: { bg: "bg-gray-800", text: "text-gray-100", border: "border-gray-600" },
  격투: { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-300" },
  땅: { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-300" },
  무색: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-300" },
  강철: { bg: "bg-slate-200", text: "text-slate-700", border: "border-slate-400" },
  드래곤: { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-300" },
};

const POKEMON_TYPES = ["풀", "불", "물", "번개", "초", "격투", "악", "강철", "드래곤", "무색"];

const EVOLUTION_COLORS: Record<string, string> = {
  기본: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
  "1진화": "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300",
  "2진화": "bg-violet-100 text-violet-700 dark:bg-violet-900/60 dark:text-violet-300",
};

const ENERGY_PIP_COLORS: Record<string, string> = {
  풀: "bg-green-400 border-green-600",
  불: "bg-red-400 border-red-600",
  물: "bg-blue-400 border-blue-600",
  번개: "bg-yellow-300 border-yellow-500",
  초: "bg-purple-400 border-purple-600",
  악: "bg-gray-700 border-gray-900",
  격투: "bg-orange-400 border-orange-600",
  땅: "bg-amber-400 border-amber-600",
  무색: "bg-gray-200 border-gray-400",
  강철: "bg-slate-400 border-slate-600",
  드래곤: "bg-indigo-400 border-indigo-600",
};

const EVOLUTION_ORDER = ["기본", "1진화", "2진화"];

type DeckEntry = { card: PokemonCard; count: number };

function typeColor(type: string) {
  return TYPE_COLORS[type] ?? { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-300" };
}

function countEnergy(energy: string | undefined): number {
  if (!energy || energy.trim() === "" || energy.trim() === "-") return 0;
  return energy.split("/").reduce((sum, seg) => {
    const trimmed = seg.trim();
    if (!trimmed || trimmed === "-") return sum;
    const m = trimmed.match(/(\d+)/);
    return sum + (m ? parseInt(m[1], 10) : 1);
  }, 0);
}

const ENERGY_IMAGES: Partial<Record<string, string>> = {
  풀: "/energy/grass.png",
  불: "/energy/fire.png",
  물: "/energy/water.png",
  번개: "/energy/lightning.png",
  초: "/energy/psychic.png",
  악: "/energy/darkness.png",
  격투: "/energy/fighting.png",
  강철: "/energy/steel.png",
  드래곤: "/energy/dragon.png",
  무색: "/energy/colorless.png"
};

function getEnergyImageSrc(type: string): string | undefined {
  // NFC 정규화 후 조회 (Google Sheets 데이터가 NFD로 올 수 있음)
  const normalized = type.normalize("NFC").trim();
  const result = ENERGY_IMAGES[normalized] ?? ENERGY_IMAGES[type.trim()];
  if (!result) {
    console.log("[EnergyPips] no image for type:", JSON.stringify(type), "hex:", Array.from(type).map(c => c.codePointAt(0)?.toString(16)).join(","));
  }
  return result;
}

function EnergyPips({ energy }: { energy: string }) {
  if (!energy) return <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>;
  const segments = energy.split("/");
  const pips: { type: string; colorClass: string }[] = [];
  for (const seg of segments) {
    const match = seg.trim().match(/^(.+?)(\d+)$/);
    if (!match) continue;
    const [, typeName, countStr] = match;
    const count = parseInt(countStr, 10);
    const colorClass = ENERGY_PIP_COLORS[typeName.normalize("NFC").trim()] ?? "bg-gray-200 border-gray-400";
    for (let i = 0; i < count; i++) pips.push({ type: typeName, colorClass });
  }
  if (pips.length === 0) return <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>;
  return (
    <span className="flex gap-0.5 flex-wrap items-center">
      {pips.map((pip, i) => {
        const imgSrc = getEnergyImageSrc(pip.type);
        return imgSrc ? (
          <img key={i} src={imgSrc} alt={pip.type} title={pip.type} className="inline-block w-4 h-4 object-contain" />
        ) : (
          <span key={i} title={pip.type} className={`inline-block w-3 h-3 rounded-full border ${pip.colorClass}`} />
        );
      })}
    </span>
  );
}

function DeckImageCell({ card }: { card: PokemonCard }) {
  const [imgError, setImgError] = useState(false);
  const { t } = useLanguage();
  return (
    <div className="aspect-[2/3] rounded-md overflow-hidden bg-slate-100 dark:bg-slate-700 flex items-center justify-center relative">
      {!imgError ? (
        <img
          src={getCardImageSrc(card.ID)}
          alt={card.이름}
          className="w-full h-full object-contain"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-1 text-center">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">{t.card.imageLoading}</span>
          <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300 break-keep leading-tight">{card.이름}</span>
        </div>
      )}
    </div>
  );
}

function downloadCSV(deck: DeckEntry[]) {
  const header = ["수량", "이름", "타입", "확장팩"];
  const rows = deck.map(({ card, count }) => [
    count, card.이름, card.타입, card.확장팩,
  ]);
  const csv = [header, ...rows]
    .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "pokemon_deck.csv";
  a.click();
  URL.revokeObjectURL(url);
}

async function downloadDeckImage(deck: DeckEntry[]) {
  const COLS = 4;
  const ROWS = 5;
  const CARD_W = 150;
  const CARD_H = 210;
  const GAP = 8;
  const PAD = 16;
  const canvasW = PAD * 2 + COLS * CARD_W + (COLS - 1) * GAP;
  const canvasH = PAD * 2 + ROWS * CARD_H + (ROWS - 1) * GAP;

  const canvas = document.createElement("canvas");
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, canvasW, canvasH);

  const cells: PokemonCard[] = [];
  for (const { card, count } of deck) {
    for (let i = 0; i < count; i++) cells.push(card);
  }

  const loadImg = (src: string): Promise<HTMLImageElement | null> =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });

  const images = await Promise.all(
    Array.from({ length: 20 }, (_, i) =>
      cells[i] ? loadImg(getCardImageSrc(cells[i].ID)) : Promise.resolve(null)
    )
  );

  const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };

  for (let i = 0; i < 20; i++) {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const x = PAD + col * (CARD_W + GAP);
    const y = PAD + row * (CARD_H + GAP);

    ctx.fillStyle = "#e2e8f0";
    roundRect(x, y, CARD_W, CARD_H, 6);
    ctx.fill();

    if (!cells[i]) {
      ctx.strokeStyle = "#cbd5e1";
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 2;
      roundRect(x + 1, y + 1, CARD_W - 2, CARD_H - 2, 6);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (images[i]) {
      ctx.save();
      roundRect(x, y, CARD_W, CARD_H, 6);
      ctx.clip();
      const img = images[i]!;
      const scale = Math.min(CARD_W / img.naturalWidth, CARD_H / img.naturalHeight);
      const dw = img.naturalWidth * scale;
      const dh = img.naturalHeight * scale;
      const dx = x + (CARD_W - dw) / 2;
      const dy = y + (CARD_H - dh) / 2;
      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.restore();
    } else {
      ctx.fillStyle = "#94a3b8";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("이미지 준비중", x + CARD_W / 2, y + CARD_H / 2 - 8);
      ctx.fillStyle = "#475569";
      ctx.font = "12px sans-serif";
      ctx.fillText(cells[i].이름, x + CARD_W / 2, y + CARD_H / 2 + 12);
    }
  }

  const link = document.createElement("a");
  link.download = "pokemon_deck.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

export default function DeckBuilder({ cards, session }: { cards: PokemonCard[]; session: Session | null }) {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<{
    타입: string[];
    진화: string[];
    키워드: string[];
    확장팩: string[];
    후퇴에너지: string[];
  }>({ 타입: [], 진화: [], 키워드: [], 확장팩: [], 후퇴에너지: [] });
  const [filterCardTypes, setFilterCardTypes] = useState<string[]>([]);
  const [filterSpecial, setFilterSpecial] = useState(false);
  const [filterColorless, setFilterColorless] = useState(false);
  const [filterSkillEnergy, setFilterSkillEnergy] = useState<number[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [pressedCardId, setPressedCardId] = useState<number | null>(null);
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPreviewRef = useRef(false);
  const shiftRef = useRef(false);
  const [showDeckImage, setShowDeckImage] = useState(false);
  const [showMobileDeck, setShowMobileDeck] = useState(false);
  const [deck, setDeck] = useState<DeckEntry[]>([]);
  const [page, setPage] = useState(1);
  const [copiedName, setCopiedName] = useState<string | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [deckName, setDeckName] = useState("");
  const [currentDeckId, setCurrentDeckId] = useState<string | null>(null);
  const [savedDecks, setSavedDecks] = useState<SavedDeck[]>([]);
  const [savingDeck, setSavingDeck] = useState(false);
  const [loadingDecks, setLoadingDecks] = useState(false);
  const [deckActionMsg, setDeckActionMsg] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [togglingFav, setTogglingFav] = useState<number | null>(null);

  const filterOptions = useMemo(() => {
    const allTypes = [...new Set(cards.map((c) => c.타입))];
    return {
      포켓몬타입: allTypes.filter((t) => POKEMON_TYPES.includes(t)),
      트레이너스타입: allTypes.filter((t) => !POKEMON_TYPES.includes(t)),
      진화: EVOLUTION_ORDER.filter((e) => cards.some((c) => c.진화 === e)),
      키워드: [...new Set(
        cards.flatMap((c) =>
          c.키워드 ? c.키워드.split(",").map((k) => k.trim()).filter(Boolean) : []
        )
      )].sort((a, b) => a.localeCompare(b, "ko")),
      확장팩: [...new Set(cards.map((c) => c.확장팩).filter(Boolean))],
      후퇴에너지: [...new Set(cards.map((c) => String(c.후퇴에너지)))].sort((a, b) => Number(a) - Number(b)),
    };
  }, [cards]);

  const deckKeywords = useMemo(() => {
    const set = new Set<string>();
    deck.forEach(({ card }) => {
      if (card.키워드) card.키워드.split(",").map((k) => k.trim()).filter(Boolean).forEach((k) => set.add(k));
    });
    return set;
  }, [deck]);

  const energyCounts = useMemo(() => {
    const map = new Map<number, { e1: number; e2: number }>();
    for (const c of cards) {
      map.set(c.ID, {
        e1: countEnergy(c.필요에너지),
        e2: c.기술명2 ? countEnergy(c.필요에너지2) : -1,
      });
    }
    return map;
  }, [cards]);

  const filtered = useMemo(() => {
    let result = cards;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((c) =>
        c.이름.toLowerCase().includes(q) ||
        c.기술명.toLowerCase().includes(q) ||
        (c.키워드 && c.키워드.toLowerCase().includes(q))
      );
    }
    if (filters.타입.length) result = result.filter((c) => filters.타입.includes(c.타입));
    if (filters.진화.length) result = result.filter((c) => filters.진화.includes(c.진화));
    if (filters.키워드.length)
      result = result.filter((c) =>
        c.키워드 && filters.키워드.some((kw) => c.키워드.split(",").map((k) => k.trim()).includes(kw))
      );
    if (filters.확장팩.length) result = result.filter((c) => filters.확장팩.includes(c.확장팩));
    if (filters.후퇴에너지.length) result = result.filter((c) => filters.후퇴에너지.includes(String(c.후퇴에너지)));
    if (filterCardTypes.length)
      result = result.filter((c) =>
        filterCardTypes.some((ct) =>
          c.카드타입?.split(",").map((v) => v.trim().toLowerCase()).includes(ct.toLowerCase())
        )
      );
    if (filterSpecial) result = result.filter((c) => c.특성효과 && c.특성효과 !== "-");
    if (filterColorless) {
      const isColorlessOnly = (energy: string) =>
        !!energy && energy !== "-" &&
        energy.split("/").every((seg) => /^무색\d*$/.test(seg.trim()));
      result = result.filter(
        (c) =>
          c.타입 !== "무색" &&
          (isColorlessOnly(c.필요에너지) || (!!c.필요에너지2 && isColorlessOnly(c.필요에너지2)))
      );
    }
    if (filterSkillEnergy.length) {
      result = result.filter((c) => {
        const ec = energyCounts.get(c.ID);
        if (!ec) return false;
        return filterSkillEnergy.includes(ec.e1) || (ec.e2 >= 0 && filterSkillEnergy.includes(ec.e2));
      });
    }
    return result;
  }, [cards, search, filters, filterCardTypes, filterSpecial, filterColorless, filterSkillEnergy, energyCounts]);

  useEffect(() => { setPage(1); }, [filtered]);

  // 즐겨찾기 로드
  useEffect(() => {
    if (!session?.user?.email) return;
    loadFavoritesFromFirestore(session.user.email).then((ids) =>
      setFavoriteIds(new Set(ids))
    ).catch(() => {});
  }, [session?.user?.email]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pagedCards = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  const totalCards = deck.reduce((s, e) => s + e.count, 0);

  const deckNameMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of deck) map.set(e.card.이름, (map.get(e.card.이름) ?? 0) + e.count);
    return map;
  }, [deck]);

  const recommendedCards = useMemo(() => {
    if (deck.length === 0) return [];
    const deckNames = deck.map(({ card }) => card.이름).filter((n) => n.length >= 2);
    if (deckNames.length === 0) return [];

    // 덱에 울트라비스트가 있는지
    const hasUltraBeast = deck.some(({ card }) =>
      card.카드타입?.split(",").map((v) => v.trim().toLowerCase()).includes("울트라비스트")
    );

    // 덱에 있는 포켓몬 타입 목록 (예: "불", "물")
    const deckPokemonTypes = [...new Set(
      deck
        .filter(({ card }) => POKEMON_TYPES.includes(card.타입))
        .map(({ card }) => card.타입)
    )];

    // 덱에 있는 진화단계 목록
    const deckEvolutions = [...new Set(
      deck
        .filter(({ card }) => POKEMON_TYPES.includes(card.타입) && card.진화)
        .map(({ card }) => card.진화)
    )];
    const hasAnyEvolution = deckEvolutions.some((e) => e === "1진화" || e === "2진화");

    // 덱에 HP 50 이하 포켓몬 존재 여부
    const deckHasLowHp = deck.some(({ card: c }) => POKEMON_TYPES.includes(c.타입) && c.HP <= 50);

    // 덱에 동전 관련 키워드 포켓몬 존재 여부 (일목 시너지)
    const COIN_KEYWORDS = ["동전 상태이상", "동전 기반 피해", "동전 기술 실패 위험"];
    const deckHasCoinKeyword = deck.some(({ card: c }) =>
      POKEMON_TYPES.includes(c.타입) &&
      c.키워드?.split(",").map((v) => v.trim()).some((kw) => COIN_KEYWORDS.includes(kw))
    );

    // 효과 텍스트에서 "상대의" 컨텍스트 없이 pattern이 포함되는지 확인
    const includesAsOwn = (text: string, pattern: string) => {
      let pos = 0;
      while ((pos = text.indexOf(pattern, pos)) !== -1) {
        const before = text.slice(Math.max(0, pos - 4), pos);
        if (!before.includes("상대")) return true;
        pos += 1;
      }
      return false;
    };

    return cards.filter((card) => {
      const nameCount = deckNameMap.get(card.이름) ?? 0;
      if (nameCount >= MAX_SAME_NAME) return false;
      if (favoriteIds.has(card.ID)) return false;
      if (card.키워드?.split(",").map((v) => v.trim()).includes("화석 포켓몬")) return false;
      // 루티아는 덱에 HP 50 이하 포켓몬이 있을 때만 추천
      if (card.이름 === "루티아" && !deckHasLowHp) return false;
      // 일목은 덱에 동전 관련 키워드 포켓몬이 있을 때만 추천
      if (card.이름 === "일목" && !deckHasCoinKeyword) return false;
      // 물고기네트는 덱에 물타입 기본 포켓몬이 있을 때만 추천
      if (card.이름 === "물고기네트" && !(deckPokemonTypes.includes("물") && deckEvolutions.includes("기본"))) return false;
      // 항상 제외할 카드
      if (["포켓몬피리", "벌레회피스프레이"].includes(card.이름)) return false;

      const effectTexts = [
        card.기술추가효과 ?? "",
        card.기술추가효과2 ?? "",
        card.특성효과 ?? "",
      ].join(" ");

      // 1) 포켓몬명 직접 참조 (기존)
      if (deckNames.some((name) => effectTexts.includes(`「${name}」`))) return true;

      const isTrainerCard = !POKEMON_TYPES.includes(card.타입);

      // 2) 울트라비스트 보유 시 트레이너스 중 "울트라비스트" 효과 포함 카드
      if (hasUltraBeast && isTrainerCard && effectTexts.includes("울트라비스트")) return true;

      // 3) 덱 타입 기반 트레이너스 추천 ("불포켓몬", "물포켓몬" 등)
      if (isTrainerCard) {
        if (deckPokemonTypes.some((type) => effectTexts.includes(`${type}포켓몬`))) return true;
      }

      // 4) 덱 진화단계 기반 트레이너스 추천 (상대의 포켓몬 관련 효과는 제외)
      if (isTrainerCard) {
        for (const evo of deckEvolutions) {
          if (includesAsOwn(effectTexts, `${evo} 포켓몬`) || includesAsOwn(effectTexts, `${evo}포켓몬`)) return true;
        }
        // 진화 포켓몬(1진화/2진화)이 있으면 단독 "진화 포켓몬" 언급 트레이너스도 추천
        // 단, "1진화 포켓몬"/"2진화 포켓몬" 안의 부분 매치는 제외하기 위해 앞 글자가 숫자가 아닌 경우만
        if (hasAnyEvolution) {
          const standaloneEvoRe = /(?<![0-9])진화 ?포켓몬/g;
          let m: RegExpExecArray | null;
          while ((m = standaloneEvoRe.exec(effectTexts)) !== null) {
            const before = effectTexts.slice(Math.max(0, m.index - 4), m.index);
            if (!before.includes("상대")) { return true; }
          }
        }
      }

      // 5) 일목 - 덱에 동전 관련 키워드 포켓몬이 있으면 추천
      if (card.이름 === "일목" && deckHasCoinKeyword) return true;

      return false;
    }).slice(0, 20);
  }, [cards, deck, deckNameMap, favoriteIds]);

  const addCard = (card: PokemonCard, times = 1) => {
    const nameCount = deckNameMap.get(card.이름) ?? 0;
    if (nameCount >= MAX_SAME_NAME) return;
    const canAdd = Math.min(times, MAX_DECK - totalCards, MAX_SAME_NAME - nameCount);
    if (canAdd <= 0) return;
    setDeck((prev) => {
      let next = [...prev];
      for (let i = 0; i < canAdd; i++) {
        const idx = next.findIndex((e) => e.card.ID === card.ID);
        if (idx >= 0) {
          next[idx] = { ...next[idx], count: next[idx].count + 1 };
        } else {
          next = [...next, { card, count: 1 }];
        }
      }
      const isTrainer = (c: PokemonCard) => !POKEMON_TYPES.includes(c.타입);
      return next.sort((a, b) => {
        const aT = isTrainer(a.card) ? 1 : 0;
        const bT = isTrainer(b.card) ? 1 : 0;
        if (aT !== bT) return aT - bT;
        return a.card.ID - b.card.ID;
      });
    });
  };

  const removeCard = (cardId: number) => {
    setDeck((prev) => {
      const idx = prev.findIndex((e) => e.card.ID === cardId);
      if (idx < 0) return prev;
      const entry = prev[idx];
      if (entry.count <= 1) return prev.filter((_, i) => i !== idx);
      const next = [...prev];
      next[idx] = { ...entry, count: entry.count - 1 };
      return next;
    });
  };

  const removeAll = (cardId: number) => setDeck((prev) => prev.filter((e) => e.card.ID !== cardId));
  const clearDeck = () => { setDeck([]); setCurrentDeckId(null); setDeckName(""); setSearch(""); };

  const handleToggleFavorite = async (e: React.MouseEvent, cardId: number) => {
    e.stopPropagation();
    if (!session?.user?.email || togglingFav) return;
    setTogglingFav(cardId);
    try {
      const newIds = await toggleFavoriteInFirestore(session.user.email, cardId);
      setFavoriteIds(new Set(newIds));
    } catch (err) {
      showMsg(err instanceof Error ? err.message : t.deck.favoriteError);
    } finally {
      setTogglingFav(null);
    }
  };

  const showMsg = (msg: string) => {
    setDeckActionMsg(msg);
    setTimeout(() => setDeckActionMsg(null), 2000);
  };

  const handleOpenSave = () => {
    setDeckName(currentDeckId ? (savedDecks.find(d => d.id === currentDeckId)?.name ?? "") : "");
    setShowSaveModal(true);
  };

  const handleConfirmSave = async (asNew: boolean) => {
    if (!deckName.trim() || !session?.user?.email) return;
    setSavingDeck(true);
    try {
      const email = session.user.email;
      const deckCards: DeckCard[] = deck.map(({ card, count }) => ({ cardId: card.ID, count }));
      if (!asNew && currentDeckId) {
        await updateDeckInFirestore(email, currentDeckId, deckName.trim(), deckCards);
        showMsg(t.deck.updated);
        setShowSaveModal(false);
      } else {
        const newId = await saveDeckToFirestore(email, deckName.trim(), deckCards);
        setCurrentDeckId(newId);
        showMsg(t.deck.saved);
        setShowSaveModal(false);
      }
    } catch (e) {
      showMsg(t.deck.saveError + (e instanceof Error ? e.message : String(e)));
    } finally {
      setSavingDeck(false);
    }
  };

  const handleOpenLoad = async () => {
    if (!session?.user?.email) return;
    setLoadingDecks(true);
    setShowLoadModal(true);
    try {
      const decks = await loadDecksFromFirestore(session.user.email);
      setSavedDecks(decks);
    } finally {
      setLoadingDecks(false);
    }
  };

  const handleLoadDeck = (saved: SavedDeck) => {
    const cardMap = new Map(cards.map(c => [c.ID, c]));
    const newDeck: DeckEntry[] = saved.cards
      .map(({ cardId, count }) => {
        const card = cardMap.get(cardId);
        return card ? { card, count } : null;
      })
      .filter((e): e is DeckEntry => e !== null)
      .sort((a, b) => {
        const isTrainer = (c: PokemonCard) => !POKEMON_TYPES.includes(c.타입);
        const aT = isTrainer(a.card) ? 1 : 0;
        const bT = isTrainer(b.card) ? 1 : 0;
        if (aT !== bT) return aT - bT;
        return a.card.ID - b.card.ID;
      });
    setDeck(newDeck);
    setCurrentDeckId(saved.id);
    setDeckName(saved.name);
    setShowLoadModal(false);
    showMsg(`'${saved.name}' ${t.deck.load}`);
  };

  const handleDeleteSavedDeck = async (deckId: string) => {
    if (!session?.user?.email) return;
    await deleteDeckFromFirestore(session.user.email, deckId);
    setSavedDecks(prev => prev.filter(d => d.id !== deckId));
    if (currentDeckId === deckId) setCurrentDeckId(null);
  };

  const typeDist = useMemo(() => {
    const map = new Map<string, number>();
    for (const { card, count } of deck) map.set(card.타입, (map.get(card.타입) ?? 0) + count);
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [deck]);

  const requiredEnergyTypes = useMemo(() => {
    const seen = new Set<string>();
    for (const { card } of deck) {
      for (const field of [card.필요에너지, card.필요에너지2]) {
        if (!field || field.trim() === "" || field.trim() === "-") continue;
        for (const seg of field.split("/")) {
          const match = seg.trim().match(/^(.+?)\d+$/);
          if (match) seen.add(match[1].normalize("NFC").trim());
        }
      }
    }
    return [...seen];
  }, [deck]);

  const toggleFilter = (group: keyof typeof filters, value: string) => {
    setFilters((prev) => {
      const current = prev[group];
      return { ...prev, [group]: current.includes(value) ? current.filter((v) => v !== value) : [...current, value] };
    });
  };

  const hasActiveFilter =
    !!search ||
    filters.타입.length || filters.진화.length || filters.키워드.length ||
    filters.확장팩.length || filters.후퇴에너지.length ||
    filterCardTypes.length || filterSpecial || filterColorless || filterSkillEnergy.length;

  const renderCard = (card: PokemonCard, keyPrefix = "") => {
    const tc = typeColor(card.타입);
    const nameCount = deckNameMap.get(card.이름) ?? 0;
    const deckCount = deck.find((e) => e.card.ID === card.ID)?.count ?? 0;
    const maxed = totalCards >= MAX_DECK || nameCount >= MAX_SAME_NAME;
    const 카드타입Types = card.카드타입?.split(",").map((v) => v.trim().toLowerCase()) ?? [];
    const isMegaEx = 카드타입Types.includes("메가ex");
    const isEx = 카드타입Types.includes("ex");
    const isUltraBeast = 카드타입Types.includes("울트라비스트");
    const isBaby = 카드타입Types.includes("베이비");
    const nameText = card.이름.replace(/\s+ex$/i, "").trim();
    const isTrainer = !POKEMON_TYPES.includes(card.타입);
    return (
      <button
        key={keyPrefix + card.ID}
        type="button"
        disabled={maxed}
        onPointerDown={(e) => {
          if (maxed) return;
          e.preventDefault();
          isPreviewRef.current = false;
          shiftRef.current = e.shiftKey;
          pressTimerRef.current = setTimeout(() => {
            isPreviewRef.current = true;
            setPressedCardId(card.ID);
          }, 300);
        }}
        onPointerUp={() => {
          if (pressTimerRef.current) { clearTimeout(pressTimerRef.current); pressTimerRef.current = null; }
          if (isPreviewRef.current) {
            // 모달은 X 버튼으로 닫으므로 여기서는 닫지 않음
            isPreviewRef.current = false;
          } else if (!maxed) {
            addCard(card, shiftRef.current ? 2 : 1);
          }
        }}
        onPointerLeave={() => {
          if (pressTimerRef.current) { clearTimeout(pressTimerRef.current); pressTimerRef.current = null; }
          isPreviewRef.current = false;
        }}
        onPointerCancel={() => {
          if (pressTimerRef.current) { clearTimeout(pressTimerRef.current); pressTimerRef.current = null; }
          setPressedCardId(null);
          isPreviewRef.current = false;
        }}
        className={`text-left w-full flex flex-col gap-2 p-3 rounded-lg border transition-all ${
          maxed
            ? "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 opacity-50 cursor-not-allowed"
            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/40 dark:hover:bg-indigo-900/10 cursor-pointer active:scale-[.99]"
        }`}
      >
        {/* 1행: 타입 + 진화 + 이름 + 카드타입 뱃지 + 덱 수량 + 확장팩 */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium border ${tc.bg} ${tc.text} ${tc.border}`}>{card.타입}</span>
          {!isTrainer && <span className={`shrink-0 px-1.5 py-0.5 rounded text-xs font-medium ${EVOLUTION_COLORS[card.진화] ?? "bg-gray-100 text-gray-600"}`}>{card.진화}</span>}
          <span className="font-semibold text-sm text-slate-800 dark:text-slate-100">{nameText}</span>
          {isMegaEx && <span className="px-1 py-0.5 rounded text-[10px] font-bold bg-rose-500 text-white leading-none ring-1 ring-rose-600">메가ex</span>}
          {!isMegaEx && isEx && <span className="px-1 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white leading-none ring-1 ring-amber-600">ex</span>}
          {isUltraBeast && <span className="px-1 py-0.5 rounded text-[10px] font-bold bg-teal-500 text-white leading-none ring-1 ring-teal-600">UB</span>}
          {isBaby && <span className="px-1 py-0.5 rounded text-[10px] font-bold bg-sky-400 text-white leading-none ring-1 ring-sky-500">baby</span>}
          <span className="ml-auto flex items-center gap-1.5 shrink-0">
            {card.확장팩 && (
              <span className="text-[10px] text-slate-400 dark:text-slate-300">{card.확장팩}</span>
            )}
            {session?.user && (
              <span
                role="button"
                onClick={(e) => handleToggleFavorite(e, card.ID)}
                className={`w-5 h-5 flex items-center justify-center rounded text-sm transition-colors ${
                  favoriteIds.has(card.ID)
                    ? "text-amber-400 hover:text-amber-500"
                    : "text-slate-300 dark:text-slate-600 hover:text-amber-400 dark:hover:text-amber-400"
                } ${togglingFav === card.ID ? "opacity-50 pointer-events-none" : ""}`}
                title={favoriteIds.has(card.ID) ? t.favorites.removeTitle : t.favorites.addTitle(favoriteIds.size, MAX_FAVORITES)}
              >
                {favoriteIds.has(card.ID) ? "★" : "☆"}
              </span>
            )}
            {deckCount > 0 && (
              <span className="w-5 h-5 flex items-center justify-center rounded-full text-[11px] font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                {deckCount}
              </span>
            )}
          </span>
        </div>

        {/* 상세 정보 (토글) */}
        {showDetail && (
          <>
            <div className="flex flex-col gap-1.5 min-w-0">
                {!isTrainer && (
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    HP <span className="text-slate-700 dark:text-slate-200 font-bold">{card.HP === 0 ? "—" : card.HP}</span>
                  </div>
                )}
                {card.특성 && card.특성효과 && card.특성효과 !== "-" && (
                  <div className="flex flex-col gap-0.5 bg-purple-50 dark:bg-purple-900/20 rounded px-2 py-1">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 shrink-0">특성</span>
                      <span className="text-[11px] text-purple-700 dark:text-purple-300 font-medium">{card.특성}</span>
                    </div>
                    <span className="text-[10px] text-purple-500 dark:text-purple-400 leading-relaxed">{card.특성효과}</span>
                  </div>
                )}
                {isTrainer && card.기술추가효과 && card.기술추가효과 !== "-" && (
                  <p className="text-[10px] text-slate-500 dark:text-slate-300">{card.기술추가효과}</p>
                )}
                {!isTrainer && (
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <EnergyPips energy={card.필요에너지} />
                      <span className="text-xs text-slate-700 dark:text-slate-200 font-medium flex-1 min-w-0 truncate">{card.기술명 && card.기술명 !== "-" ? card.기술명 : <span className="text-slate-300 dark:text-slate-600 font-normal">—</span>}</span>
                      {card.피해량 && card.피해량 !== "-" && card.피해량 !== "0" && (
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 shrink-0">{card.피해량}</span>
                      )}
                    </div>
                    {card.기술추가효과 && card.기술추가효과 !== "-" && (
                      <p className="text-[10px] text-slate-400 dark:text-slate-300 pl-1">{card.기술추가효과}</p>
                    )}
                  </div>
                )}
                {!isTrainer && card.기술명2 && (
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <EnergyPips energy={card.필요에너지2 ?? ""} />
                      <span className="text-xs text-slate-700 dark:text-slate-200 font-medium flex-1 min-w-0 truncate">{card.기술명2}</span>
                      {card.피해량2 && card.피해량2 !== "-" && card.피해량2 !== "0" && (
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 shrink-0">{card.피해량2}</span>
                      )}
                    </div>
                    {card.기술추가효과2 && card.기술추가효과2 !== "-" && (
                      <p className="text-[10px] text-slate-400 dark:text-slate-300 pl-1">{card.기술추가효과2}</p>
                    )}
                  </div>
                )}
                {!isTrainer && (
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>
                      {card.약점 ? (
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${typeColor(card.약점).bg} ${typeColor(card.약점).text}`}>
                          약점: {card.약점}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-300 dark:text-slate-600">약점 없음</span>
                      )}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <span className="text-[10px] text-slate-400 mr-0.5">후퇴</span>
                      {Array.from({ length: card.후퇴에너지 }).map((_, i) => (
                        <img key={i} src="/energy/colorless.png" alt="무색" className="inline-block w-2.5 h-2.5" />
                      ))}
                      {card.후퇴에너지 === 0 && <span className="text-slate-300 dark:text-slate-600 text-[10px]">0</span>}
                    </span>
                  </div>
                )}
                {card.키워드 && (
                  <div className="flex flex-wrap gap-1">
                    {card.키워드.split(",").map((k) => k.trim()).filter(Boolean).map((kw) => (
                      <span key={kw} className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800">{kw}</span>
                    ))}
                  </div>
                )}
            </div>
          </>
        )}
      </button>
    );
  };

  const previewCard = pressedCardId !== null ? cards.find((c) => c.ID === pressedCardId) ?? null : null;

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6 min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* 카드 이미지 미리보기 모달 */}
      {previewCard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setPressedCardId(null)}
        >
          <div
            className="relative pointer-events-auto bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-5 flex flex-col items-center gap-3 w-[min(24rem,90vw)]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPressedCardId(null)}
              className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg leading-none px-1"
            >✕</button>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{previewCard.이름}</p>
            <img
              src={getCardImageSrc(previewCard.ID)}
              alt={previewCard.이름}
              className="w-full rounded-lg shadow-md object-contain"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
          </div>
        </div>
      )}
      {/* Copy toast */}
      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-slate-800 text-white text-sm shadow-lg transition-all duration-300 pointer-events-none ${copiedName ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
        <span className="font-medium">{copiedName}</span> 복사됨
      </div>
      {/* Deck action toast */}
      <div className={`fixed bottom-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-green-700 text-white text-sm shadow-lg transition-all duration-300 pointer-events-none ${deckActionMsg ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
        {deckActionMsg}
      </div>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">{t.deck.pageTitle}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t.deck.subtitle}</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* 카드 선택 패널 */}
        <div className="flex-1 flex flex-col gap-3 min-w-0 order-last lg:order-first">
          {/* 검색 */}
          <div className="relative max-w-md">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">🔍</span>
            <input
              type="text"
              placeholder={t.search.deckPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-xs">✕</button>
            )}
          </div>

          {/* 필터 */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-4">
              {/* 포켓몬 타입 */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{t.filter.pokemonType}</span>
                <div className="flex gap-1 flex-wrap">
                  {filterOptions.포켓몬타입.map((opt) => {
                    const active = filters.타입.includes(opt);
                    const tc = typeColor(opt);
                    return (
                      <button key={opt} onClick={() => toggleFilter("타입", opt)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer border ${active ? `${tc.bg} ${tc.text} ${tc.border}` : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-400"}`}
                      >{t.pokemonType[opt] ?? opt}</button>
                      );
                    })}
                  </div>
                </div>

              {/* 트레이너스 타입 */}
              {filterOptions.트레이너스타입.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{t.filter.trainers}</span>
                  <div className="flex gap-1 flex-wrap">
                    {filterOptions.트레이너스타입.map((opt) => {
                      const active = filters.타입.includes(opt);
                      return (
                        <button key={opt} onClick={() => toggleFilter("타입", opt)}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer border ${active ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-400"}`}
                        >{opt}</button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 진화단계 */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{t.filter.evolutionStage}</span>
                <div className="flex gap-1 flex-wrap">
                  {filterOptions.진화.map((opt) => {
                    const active = filters.진화.includes(opt);
                    return (
                      <button key={opt} onClick={() => toggleFilter("진화", opt)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer border ${active ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-400"}`}
                      >{t.evolution[opt] ?? opt}</button>
                      );
                    })}
                  </div>
                </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{t.filter.skillEnergy}</span>
                <div className="flex gap-1">
                  {[0, 1, 2, 3, 4, 5].map((n) => {
                    const active = filterSkillEnergy.includes(n);
                    return (
                      <button key={n} onClick={() => setFilterSkillEnergy((prev) => prev.includes(n) ? prev.filter((v) => v !== n) : [...prev, n])}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${active ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700" : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-400"}`}
                      >{t.filter.energyCount(n)}</button>
                    );
                  })}
                </div>
              </div>

              {/* 후퇴에너지 */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{t.filter.retreatEnergy}</span>
                <div className="flex gap-1 flex-wrap">
                  {filterOptions.후퇴에너지.map((opt) => {
                    const active = filters.후퇴에너지.includes(opt);
                    return (
                      <button key={opt} onClick={() => toggleFilter("후퇴에너지", opt)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${active ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700" : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-400"}`}
                      >{t.filter.energyCount(Number(opt))}</button>
                    );
                  })}
                </div>
              </div>

              {/* 확장팩 필터 (셀렉트박스) */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide shrink-0">{t.filter.expansion}</span>
                <select
                  value={filters.확장팩[0] ?? ""}
                  onChange={(e) => setFilters((prev) => ({ ...prev, 확장팩: e.target.value ? [e.target.value] : [] }))}
                  className="px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer"
                >
                  <option value="">{t.filter.all}</option>
                  {filterOptions.확장팩.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              {/* 상세필터 토글 */}
              <div className="ml-auto">
                <button onClick={() => setShowAdvanced((v) => !v)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${showAdvanced ? "bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700" : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-400"}`}
                >
                  🔍 {t.filter.detailFilter} <span className="text-[10px]">{showAdvanced ? "▲" : "▼"}</span>
                </button>
              </div>
            </div>

            {/* 상세 필터 패널 */}
            {showAdvanced && (
              <div className="flex flex-col gap-3 p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                {/* 카드타입 / 특성 */}
                <div className="flex items-start gap-3">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide pt-1 min-w-[48px] whitespace-nowrap">{t.filter.cardType}</span>
                  <div className="flex items-center gap-1 flex-wrap">
                  {(["ex", "메가ex", "베이비", "울트라비스트"] as const).map((ct) => {
                    const active = filterCardTypes.includes(ct);
                    const activeCls =
                      ct === "ex" ? "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700"
                      : ct === "메가ex" ? "bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700"
                      : ct === "베이비" ? "bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-700"
                      : "bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-700";
                    return (
                      <button key={ct} onClick={() => setFilterCardTypes((prev) => prev.includes(ct) ? prev.filter((v) => v !== ct) : [...prev, ct])}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${active ? activeCls : "bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-400"}`}
                      >{ct === "메가ex" ? t.cardTypeLabel.megaEx : ct === "베이비" ? t.cardTypeLabel.baby : ct === "울트라비스트" ? t.cardTypeLabel.ultraBeast : ct}</button>
                    );
                  })}
                  <button onClick={() => setFilterSpecial((v) => !v)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${filterSpecial ? "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700" : "bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-400"}`}
                  >{t.filter.hasAbility}</button>
                  <button onClick={() => setFilterColorless((v) => !v)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${filterColorless ? "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-400 dark:border-gray-500" : "bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-400"}`}
                  >{t.filter.hasColorlessSkill}</button>
                  </div>
                </div>
                {(() => {
                  const allKw = filterOptions.키워드;
                  const used = new Set<string>();
                  const take = (pred: (k: string) => boolean) => {
                    const r = allKw.filter((k) => !used.has(k) && pred(k));
                    r.forEach((k) => used.add(k));
                    return r;
                  };
                  const 상태이상 = take((k) => /독|혼란|마비|잠듦|화상|상태이상/.test(k));
                  const 방어면역 = take((k) => /면역/.test(k) || ["약점 무시","약점 무효","효과 무시","데미지 감소","기술 데미지 감소 부여","기사회생","동전 피격 방어","HP 만땅 데미지 감소"].includes(k));
                  const 추가피해 = take((k) => k.includes("기반 피해"));
                  const 피해 = take((k) => /피해/.test(k) || ["자해","반격 기절","데미지 반사","데미지 이동","데미지 강화","HP 강제 감소","HP 절반","기절 유발","지연 피해","피격 데미지 증가"].includes(k));
                  const 에너지 = take((k) => /에너지/.test(k) || ["후퇴비용 감소","후퇴비용 증가","기술비용 감소","기술비용 증가"].includes(k));
                  const 회복 = take((k) => /회복/.test(k) || k === "HP 증가");
                  const 교체이동 = take((k) => /교체/.test(k) || ["자신 귀환","기절 시 귀환","상대 귀환 강제","벤치 전개","상대 벤치 전개"].includes(k));
                  const 덱패조작 = take((k) => /드로우|덱 서치|덱 조작|덱 확인|트래쉬 회수|패 조작|패 확인|자신 덱 트래쉬/.test(k));
                  const 방해차단 = take((k) => /차단|금지|덱 파괴|스태디움 제거|도구 트래쉬/.test(k) || ["상대 패 트래쉬","포인트 차단"].includes(k));
                  const 진화 = take((k) => /진화|퇴화|화석/.test(k));
                  const 기술동전 = take((k) => /기술 계승|기술 복사|서포트 복사|연속 기술|차례 종료|동전 확정|HP 조건 실패|추가 포인트/.test(k));
                  const 기타 = take(() => true);
                  const sortByDeck = (opts: string[]) => [
                    ...opts.filter((k) => deckKeywords.has(k)),
                    ...opts.filter((k) => !deckKeywords.has(k)),
                  ];
                  return [
                    { label: t.filter.keywordGroups.abnormal, options: sortByDeck(상태이상) },
                    { label: t.filter.keywordGroups.defense, options: sortByDeck(방어면역) },
                    { label: t.filter.keywordGroups.bonusDamage, options: sortByDeck(추가피해) },
                    { label: t.filter.keywordGroups.damage, options: sortByDeck(피해) },
                    { label: t.filter.keywordGroups.energy, options: sortByDeck(에너지) },
                    { label: t.filter.keywordGroups.recovery, options: sortByDeck(회복) },
                    { label: t.filter.keywordGroups.swap, options: sortByDeck(교체이동) },
                    { label: t.filter.keywordGroups.deckHand, options: sortByDeck(덱패조작) },
                    { label: t.filter.keywordGroups.disrupt, options: sortByDeck(방해차단) },
                    { label: t.filter.keywordGroups.evolution, options: sortByDeck(진화) },
                    { label: t.filter.keywordGroups.skillCoin, options: sortByDeck(기술동전) },
                    { label: t.filter.keywordGroups.other, options: sortByDeck(기타) },
                  ].filter((g) => g.options.length > 0).map(({ label, options }) => (
                    <div key={label} className="flex items-start gap-3">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide pt-1 min-w-[48px] whitespace-nowrap">{label}</span>
                      <div className="flex gap-1 flex-wrap">
                        {options.map((opt) => {
                          const active = filters.키워드.includes(opt);
                          const inDeck = deckKeywords.has(opt);
                          return (
                            <button key={opt} onClick={() => toggleFilter("키워드", opt)}
                              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                                active
                                  ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700"
                                  : inDeck
                                  ? "bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:border-amber-400"
                                  : "bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-400"
                              }`}
                            >{opt}</button>
                          );
                        })}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}

            {/* 필터 초기화 */}
            {hasActiveFilter ? (
              <div>
                <button
                  onClick={() => { setSearch(""); setFilters({ 타입: [], 진화: [], 키워드: [], 확장팩: [], 후퇴에너지: [] }); setFilterCardTypes([]); setFilterSpecial(false); setFilterColorless(false); setFilterSkillEnergy([]); }}
                  className="px-2.5 py-1 rounded-full text-xs font-medium text-red-500 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                >{t.filter.clear}</button>
              </div>
            ) : null}
          </div>

          {session?.user && favoriteIds.size > 0 && (() => {
            const favoriteCards = cards.filter((c) => favoriteIds.has(c.ID));
            return (
              <div className="flex flex-col gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">★ {t.favorites.title}</span>
                  <span className="text-xs text-amber-500 dark:text-amber-500">{favoriteIds.size} / {MAX_FAVORITES}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                  {favoriteCards.map((card) => renderCard(card, "fav-"))}
                </div>
              </div>
            );
          })()}

          {/* 추천 카드 섹션 */}
          {recommendedCards.length > 0 && (
            <div className="flex flex-col gap-2 p-3 rounded-xl bg-teal-50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-800/50">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-teal-600 dark:text-teal-400">✦ {t.recommended.title}</span>
                <span className="text-xs text-teal-500 dark:text-teal-500">{t.recommended.synergy}</span>
                <span className="ml-auto text-xs text-teal-400 dark:text-teal-600">{recommendedCards.length}장</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                {recommendedCards.map((card) => renderCard(card, "rec-"))}
              </div>
            </div>
          )}

          {/* 카드 목록 */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-slate-400 dark:text-slate-500">{filtered.length}장 · {page}/{totalPages}페이지</p>
              <button
                onClick={() => setShowDetail((v) => !v)}
                className="shrink-0 px-2.5 py-1 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                {showDetail ? t.deck.showSimple : t.deck.showDetail}
              </button>
            </div>
            <p className="text-[10px] text-slate-300 dark:text-slate-600">클릭: 덱 추가 · 길게 누름: 이미지 확인 · Shift+클릭: 2장 추가</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
            {pagedCards.map((card) => renderCard(card))}
            {filtered.length === 0 && (
              <div className="col-span-full text-center py-10 text-slate-400 dark:text-slate-500 text-sm">{t.search.noResults}</div>
            )}
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <>
              {/* 모바일: 이전/다음 + 현재페이지/전체 */}
              <div className="flex sm:hidden items-center justify-center gap-2 pt-1">
                <button
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  className="px-2 py-1 rounded text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >«</button>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 rounded text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >‹ 이전</button>
                <span className="px-3 py-1 rounded text-xs bg-indigo-500 text-white font-bold">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 rounded text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >다음 ›</button>
                <button
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                  className="px-2 py-1 rounded text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >»</button>
              </div>
              {/* sm 이상: 기존 전체 번호 표시 */}
              <div className="hidden sm:flex items-center justify-center gap-1 pt-1">
                <button
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  className="px-2 py-1 rounded text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >«</button>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-2 py-1 rounded text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >‹</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                  .reduce<(number | "...")[]>((acc, p, i, arr) => {
                    if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push("...");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === "..." ? (
                      <span key={`ellipsis-${i}`} className="px-1 text-xs text-slate-400">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p as number)}
                        className={`px-2.5 py-1 rounded text-xs border transition-colors ${
                          page === p
                            ? "bg-indigo-500 border-indigo-500 text-white font-bold"
                            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                        }`}
                      >{p}</button>
                    )
                  )}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-2 py-1 rounded text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >›</button>
                <button
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                  className="px-2 py-1 rounded text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >»</button>
              </div>
            </>
          )}
        </div>

        {/* 덱 패널 - 모바일에서 숨김 */}
        <div className="hidden lg:flex lg:w-80 shrink-0 flex-col gap-3 order-first lg:order-last">
          <div className="sticky top-4 flex flex-col gap-3">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <div>
                  <span className="text-base font-bold text-slate-800 dark:text-slate-100">나의 덱</span>
                  <span className={`ml-2 text-sm font-semibold ${totalCards === MAX_DECK ? "text-green-600 dark:text-green-400" : "text-indigo-600 dark:text-indigo-400"}`}>
                    {totalCards} / {MAX_DECK}
                  </span>
                  {currentDeckId && deckName && (
                    <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">{deckName}</div>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => setShowDeckImage(true)} disabled={deck.length === 0}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border border-indigo-200 dark:border-indigo-700 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 disabled:opacity-30 transition-colors"
                  >📄 {t.deck.viewImage}</button>
                  {session?.user && (
                    <>
                      <button onClick={handleOpenSave} disabled={totalCards < MAX_DECK}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 disabled:opacity-30 transition-colors"
                      >{t.deck.save}</button>
                      <button onClick={handleOpenLoad}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >{t.deck.load}</button>
                    </>
                  )}
                  {/* CSV 저장 버튼 숨김 처리 */}
                  <button onClick={clearDeck} disabled={deck.length === 0 && !search}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border border-red-200 dark:border-red-800 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 disabled:opacity-30 transition-colors"
                  >{t.deck.clear}</button>
                </div>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                <div className={`h-full rounded-full transition-all ${totalCards === MAX_DECK ? "bg-green-500" : "bg-indigo-500"}`} style={{ width: `${(totalCards / MAX_DECK) * 100}%` }} />
              </div>
              {typeDist.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {typeDist.map(([type, count]) => {
                    const tc = typeColor(type);
                    return (
                      <span key={type} className={`px-2 py-0.5 rounded-full text-xs font-medium border ${tc.bg} ${tc.text} ${tc.border}`}>{type} {count}</span>
                    );
                  })}
                </div>
              )}
              {requiredEnergyTypes.length > 0 && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-slate-400 dark:text-slate-500">{t.deck.requiredEnergy}</span>
                  <div className="flex flex-wrap gap-2">
                    {requiredEnergyTypes.map((type) => {
                      const imgSrc = getEnergyImageSrc(type);
                      return (
                        <div key={type} className="flex items-center gap-1">
                          {imgSrc
                            ? <img src={imgSrc} alt={type} className="w-5 h-5 rounded-full" />
                            : <span className="w-5 h-5 rounded-full bg-gray-200 border border-gray-400 inline-block" />
                          }
                          <span className="text-xs text-slate-600 dark:text-slate-300">{type}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
              {deck.length === 0 && (
                <div className="text-center py-10 text-slate-400 dark:text-slate-500 text-sm">{t.deck.addCards}</div>
              )}
              {deck.map(({ card, count }) => {
                const tc = typeColor(card.타입);
                return (
                  <div key={card.ID} className="flex items-center gap-2 px-3 py-2.5">
                    <button
                      onClick={() => removeCard(card.ID)}
                      title={t.deck.clickToRemove}
                      className="flex items-center gap-2 flex-1 min-w-0 text-left hover:bg-slate-50 dark:hover:bg-slate-700/40 rounded transition-colors"
                    >
                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium border ${tc.bg} ${tc.text} ${tc.border}`}>{card.타입}</span>
                      <span className="flex-1 min-w-0 text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{card.이름}</span>
                      <span className="shrink-0 w-5 text-center text-sm font-bold text-indigo-600 dark:text-indigo-400">{count}</span>
                    </button>
                    <button onClick={() => { navigator.clipboard.writeText(card.이름); setCopiedName(card.이름); setTimeout(() => setCopiedName(null), 1500); }} title={t.deck.copyName} className="shrink-0 w-6 h-6 flex items-center justify-center rounded text-slate-300 hover:text-indigo-500 dark:text-slate-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-xs transition-colors">⧉</button>
                    <button onClick={() => removeAll(card.ID)} className="shrink-0 w-6 h-6 flex items-center justify-center rounded text-slate-300 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs transition-colors">✕</button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 모바일 덱 FAB */}
      <div className="fixed bottom-6 right-6 z-40 lg:hidden">
        <button
          onClick={() => setShowMobileDeck(true)}
          className="relative flex items-center justify-center w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-xl text-white text-2xl transition-all"
          aria-label="나의 덱 열기"
        >
          🃏
          {totalCards > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] flex items-center justify-center rounded-full bg-rose-500 text-white text-[11px] font-bold px-1 leading-none shadow">
              {totalCards}
            </span>
          )}
        </button>
      </div>

      {/* 모바일 덱 바텀시트 */}
      {showMobileDeck && (
        <div
          className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end"
          onClick={() => setShowMobileDeck(false)}
        >
          <div className="flex-1 bg-black/50" />
          <div
            className="bg-white dark:bg-slate-800 rounded-t-2xl shadow-2xl flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 핸들 */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
            </div>
            {/* 헤더 */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 dark:border-slate-700">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-slate-800 dark:text-slate-100">나의 덱</span>
                  <span className={`text-sm font-semibold ${totalCards === MAX_DECK ? "text-green-600 dark:text-green-400" : "text-indigo-600 dark:text-indigo-400"}`}>
                    {totalCards} / {MAX_DECK}
                  </span>
                </div>
                {currentDeckId && deckName && (
                  <div className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-[140px]">{deckName}</div>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <button onClick={() => { setShowMobileDeck(false); setShowDeckImage(true); }} disabled={deck.length === 0}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border border-indigo-200 dark:border-indigo-700 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 disabled:opacity-30 transition-colors"
                >🖼️ {t.deck.viewImageShort}</button>
                {session?.user && (
                  <>
                    <button onClick={() => { setShowMobileDeck(false); handleOpenSave(); }} disabled={totalCards < MAX_DECK}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 disabled:opacity-30 transition-colors"
                    >{t.deck.save}</button>
                    <button onClick={() => { setShowMobileDeck(false); handleOpenLoad(); }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >{t.deck.load}</button>
                  </>
                )}
                <button onClick={clearDeck} disabled={deck.length === 0}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border border-red-200 dark:border-red-800 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 disabled:opacity-30 transition-colors"
                >{t.deck.clear}</button>
                <button onClick={() => setShowMobileDeck(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 text-sm transition-colors"
                >✕</button>
              </div>
            </div>
            {/* 프로그레스바 */}
            <div className="px-4 pt-2">
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                <div className={`h-full rounded-full transition-all ${totalCards === MAX_DECK ? "bg-green-500" : "bg-indigo-500"}`} style={{ width: `${(totalCards / MAX_DECK) * 100}%` }} />
              </div>
            </div>
            {/* 타입 분포 + 필요 에너지 */}
            {(typeDist.length > 0 || requiredEnergyTypes.length > 0) && (
              <div className="px-4 py-2 flex flex-col gap-1.5">
                {typeDist.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {typeDist.map(([type, count]) => {
                      const tc = typeColor(type);
                      return (
                        <span key={type} className={`px-2 py-0.5 rounded-full text-xs font-medium border ${tc.bg} ${tc.text} ${tc.border}`}>{type} {count}</span>
                      );
                    })}
                  </div>
                )}
                {requiredEnergyTypes.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {requiredEnergyTypes.map((type) => {
                      const imgSrc = getEnergyImageSrc(type);
                      return (
                        <div key={type} className="flex items-center gap-1">
                          {imgSrc
                            ? <img src={imgSrc} alt={type} className="w-4 h-4 rounded-full" />
                            : <span className="w-4 h-4 rounded-full bg-gray-200 border border-gray-400 inline-block" />
                          }
                          <span className="text-xs text-slate-600 dark:text-slate-300">{type}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            {/* 덱 카드 목록 */}
            <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700 flex-1">
              {deck.length === 0 && (
                <div className="text-center py-10 text-slate-400 dark:text-slate-500 text-sm">{t.deck.addCards}</div>
              )}
              {deck.map(({ card, count }) => {
                const tc = typeColor(card.타입);
                return (
                  <div key={card.ID} className="flex items-center gap-2 px-4 py-3">
                    <button
                      onClick={() => removeCard(card.ID)}
                      title={t.deck.clickToRemove}
                      className="flex items-center gap-2 flex-1 min-w-0 text-left hover:bg-slate-50 dark:hover:bg-slate-700/40 rounded transition-colors"
                    >
                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium border ${tc.bg} ${tc.text} ${tc.border}`}>{card.타입}</span>
                      <span className="flex-1 min-w-0 text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{card.이름}</span>
                      <span className="shrink-0 w-5 text-center text-sm font-bold text-indigo-600 dark:text-indigo-400">{count}</span>
                    </button>
                    <button onClick={() => { navigator.clipboard.writeText(card.이름); setCopiedName(card.이름); setTimeout(() => setCopiedName(null), 1500); }} title={t.deck.copyName} className="shrink-0 w-7 h-7 flex items-center justify-center rounded text-slate-300 hover:text-indigo-500 dark:text-slate-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-sm transition-colors">⧉</button>
                    <button onClick={() => removeAll(card.ID)} className="shrink-0 w-7 h-7 flex items-center justify-center rounded text-slate-300 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm transition-colors">✕</button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 덱 이미지 보기 모달 */}
      {showDeckImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowDeckImage(false)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col gap-4 p-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-slate-800 dark:text-slate-100">
                덱 이미지 보기 <span className="text-sm font-normal text-slate-400 dark:text-slate-500">({totalCards} / {MAX_DECK})</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadDeckImage(deck)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-500 hover:bg-indigo-600 text-white transition-colors"
                >{t.deck.imageDownload}</button>
                <button
                  onClick={() => setShowDeckImage(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 text-sm transition-colors"
                >✕</button>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {(() => {
                const cells: PokemonCard[] = [];
                for (const { card, count } of deck) {
                  for (let i = 0; i < count; i++) cells.push(card);
                }
                return Array.from({ length: 20 }, (_, i) =>
                  cells[i] ? (
                    <DeckImageCell key={`${cells[i].ID}-${i}`} card={cells[i]} />
                  ) : (
                    <div key={`empty-${i}`} className="aspect-[2/3] rounded-md bg-slate-100 dark:bg-slate-700/50 border-2 border-dashed border-slate-200 dark:border-slate-600" />
                  )
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* 덱 저장 모달 */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowSaveModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm flex flex-col gap-4 p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-slate-800 dark:text-slate-100">{t.deck.saveDeckTitle}</span>
              <button onClick={() => setShowSaveModal(false)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 text-sm transition-colors">✕</button>
            </div>
            <input
              type="text"
              placeholder={t.deck.namePlaceholder}
              value={deckName}
              onChange={e => setDeckName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && deckName.trim()) handleConfirmSave(!currentDeckId); }}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              maxLength={30}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              {currentDeckId && (
                <button
                  onClick={() => handleConfirmSave(false)}
                  disabled={savingDeck || !deckName.trim()}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 disabled:opacity-40 transition-colors"
                >{t.deck.update}</button>
              )}
              <button
                onClick={() => handleConfirmSave(true)}
                disabled={savingDeck || !deckName.trim()}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-40 transition-colors"
              >{currentDeckId ? t.deck.saveNew : t.deck.save}</button>
            </div>
          </div>
        </div>
      )}

      {/* 덱 불러오기 모달 */}
      {showLoadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowLoadModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm flex flex-col gap-3 p-5 max-h-[80vh]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-slate-800 dark:text-slate-100">{t.deck.savedDecksTitle}
                <span className="ml-2 text-sm font-normal text-slate-400 dark:text-slate-500">{savedDecks.length} / {MAX_DECKS}</span>
              </span>
              <button onClick={() => setShowLoadModal(false)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 text-sm transition-colors">✕</button>
            </div>
            {loadingDecks ? (
              <div className="text-center py-8 text-slate-400 text-sm">{t.deck.loading}</div>
            ) : savedDecks.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">{t.deck.noDecks}</div>
            ) : (
              <div className="overflow-y-auto flex flex-col divide-y divide-slate-100 dark:divide-slate-700">
                {savedDecks.map(saved => (
                  <div key={saved.id} className="flex items-center gap-2 py-2.5">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{saved.name}</div>
                      <div className="text-xs text-slate-400 dark:text-slate-500">{saved.cardCount}장 · {saved.updatedAt.slice(0, 10)}</div>
                    </div>
                    <button
                      onClick={() => handleLoadDeck(saved)}
                      className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-500 hover:bg-indigo-600 text-white transition-colors"
                    >{t.deck.load}</button>
                    <button
                      onClick={() => handleDeleteSavedDeck(saved.id)}
                      className="shrink-0 w-7 h-7 flex items-center justify-center rounded text-slate-300 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs transition-colors"
                    >✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
