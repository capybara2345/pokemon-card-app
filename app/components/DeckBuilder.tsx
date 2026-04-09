"use client";

import { useState, useMemo, useEffect } from "react";
import { type PokemonCard } from "../data/cards";

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
  return (
    <div className="aspect-[2/3] rounded-md overflow-hidden bg-slate-100 dark:bg-slate-700 flex items-center justify-center relative">
      {!imgError ? (
        <img
          src={`/cards/${Math.floor(card.ID / 1000)}/${card.ID}.webp`}
          alt={card.이름}
          className="w-full h-full object-contain"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-1 text-center">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">이미지<br />준비중</span>
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
      cells[i] ? loadImg(`/cards/${Math.floor(cells[i].ID / 1000)}/${cells[i].ID}.webp`) : Promise.resolve(null)
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

export default function DeckBuilder({ cards }: { cards: PokemonCard[] }) {
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
  const [showDeckImage, setShowDeckImage] = useState(false);
  const [deck, setDeck] = useState<DeckEntry[]>([]);
  const [page, setPage] = useState(1);
  const [copiedName, setCopiedName] = useState<string | null>(null);

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

  const addCard = (card: PokemonCard) => {
    if (totalCards >= MAX_DECK) return;
    const nameCount = deckNameMap.get(card.이름) ?? 0;
    if (nameCount >= MAX_SAME_NAME) return;
    setDeck((prev) => {
      const idx = prev.findIndex((e) => e.card.ID === card.ID);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], count: next[idx].count + 1 };
        return next;
      }
      return [...prev, { card, count: 1 }].sort((a, b) => a.card.ID - b.card.ID);
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
  const clearDeck = () => setDeck([]);

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
    filters.타입.length || filters.진화.length || filters.키워드.length ||
    filters.확장팩.length || filters.후퇴에너지.length ||
    filterCardTypes.length || filterSpecial || filterColorless || filterSkillEnergy.length;

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6 min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Copy toast */}
      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-slate-800 text-white text-sm shadow-lg transition-all duration-300 pointer-events-none ${copiedName ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
        <span className="font-medium">{copiedName}</span> 복사됨
      </div>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">포켓몬 포켓 덱 빌더</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">최대 20장, 같은 이름 최대 2장</p>
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
              placeholder="이름, 기술명, 키워드로 검색..."
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
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">포켓몬 타입</span>
                <div className="flex gap-1 flex-wrap">
                  {filterOptions.포켓몬타입.map((opt) => {
                    const active = filters.타입.includes(opt);
                    const tc = typeColor(opt);
                    return (
                      <button key={opt} onClick={() => toggleFilter("타입", opt)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer border ${active ? `${tc.bg} ${tc.text} ${tc.border}` : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-400"}`}
                      >{opt}</button>
                    );
                  })}
                </div>
              </div>

              {/* 트레이너스 타입 */}
              {filterOptions.트레이너스타입.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">트레이너스</span>
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
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">진화단계</span>
                <div className="flex gap-1 flex-wrap">
                  {filterOptions.진화.map((opt) => {
                    const active = filters.진화.includes(opt);
                    return (
                      <button key={opt} onClick={() => toggleFilter("진화", opt)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer border ${active ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-400"}`}
                      >{opt}</button>
                    );
                  })}
                </div>
              </div>

              {/* 기술에너지 */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">기술에너지</span>
                <div className="flex gap-1">
                  {[0, 1, 2, 3, 4, 5].map((n) => {
                    const active = filterSkillEnergy.includes(n);
                    return (
                      <button key={n} onClick={() => setFilterSkillEnergy((prev) => prev.includes(n) ? prev.filter((v) => v !== n) : [...prev, n])}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${active ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700" : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-400"}`}
                      >{n}개</button>
                    );
                  })}
                </div>
              </div>

              {/* 후퇴에너지 */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">후퇴에너지</span>
                <div className="flex gap-1 flex-wrap">
                  {filterOptions.후퇴에너지.map((opt) => {
                    const active = filters.후퇴에너지.includes(opt);
                    return (
                      <button key={opt} onClick={() => toggleFilter("후퇴에너지", opt)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${active ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700" : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-400"}`}
                      >{opt}개</button>
                    );
                  })}
                </div>
              </div>

              {/* 카드타입 / 특성 */}
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
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${active ? activeCls : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-400"}`}
                    >{ct}</button>
                  );
                })}
                <button onClick={() => setFilterSpecial((v) => !v)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${filterSpecial ? "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-400"}`}
                >특성있음</button>
                <button onClick={() => setFilterColorless((v) => !v)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${filterColorless ? "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-400 dark:border-gray-500" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-400"}`}
                >무색기술있음(무색 포켓몬 제외)</button>
              </div>

              {/* 상세필터 토글 */}
              <div className="ml-auto">
                <button onClick={() => setShowAdvanced((v) => !v)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${showAdvanced ? "bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700" : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-400"}`}
                >
                  상세 필터 <span className="text-[10px]">{showAdvanced ? "▲" : "▼"}</span>
                </button>
              </div>
            </div>

            {/* 상세 필터 패널 */}
            {showAdvanced && (
              <div className="flex flex-col gap-3 p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="flex items-start gap-3">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide pt-1 min-w-[48px]">확장팩</span>
                  <div className="flex gap-1 flex-wrap">
                    {filterOptions.확장팩.map((opt) => {
                      const active = filters.확장팩.includes(opt);
                      return (
                        <button key={opt} onClick={() => toggleFilter("확장팩", opt)}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${active ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700" : "bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-400"}`}
                        >{opt}</button>
                      );
                    })}
                  </div>
                </div>
                {(() => {
                  const allKw = filterOptions.키워드;
                  const 상태이상 = allKw.filter((k) => /독|혼란|마비|잠듦|화상/.test(k));
                  const 면역 = allKw.filter((k) => !상태이상.includes(k) && k.includes("면역"));
                  const 추가피해 = allKw.filter((k) => !상태이상.includes(k) && !면역.includes(k) && k.includes("기반 피해"));
                  const 피해 = allKw.filter((k) => !상태이상.includes(k) && !면역.includes(k) && !추가피해.includes(k) && k.includes("피해"));
                  const 에너지 = allKw.filter((k) => !상태이상.includes(k) && !면역.includes(k) && !추가피해.includes(k) && !피해.includes(k) && k.includes("에너지"));
                  const 회복 = allKw.filter((k) => !상태이상.includes(k) && !면역.includes(k) && !추가피해.includes(k) && !피해.includes(k) && !에너지.includes(k) && k.includes("회복"));
                  const 교체 = allKw.filter((k) => !상태이상.includes(k) && !면역.includes(k) && !추가피해.includes(k) && !피해.includes(k) && !에너지.includes(k) && !회복.includes(k) && k.includes("교체"));
                  const 시너지 = allKw.filter((k) => !상태이상.includes(k) && !면역.includes(k) && !추가피해.includes(k) && !피해.includes(k) && !에너지.includes(k) && !회복.includes(k) && !교체.includes(k) && k.includes("시너지"));
                  const 금지 = allKw.filter((k) => !상태이상.includes(k) && !면역.includes(k) && !추가피해.includes(k) && !피해.includes(k) && !에너지.includes(k) && !회복.includes(k) && !교체.includes(k) && !시너지.includes(k) && k.includes("금지"));
                  const 기타 = allKw.filter((k) => !상태이상.includes(k) && !면역.includes(k) && !추가피해.includes(k) && !피해.includes(k) && !에너지.includes(k) && !회복.includes(k) && !교체.includes(k) && !시너지.includes(k) && !금지.includes(k));
                  return [
                    { label: "상태 이상", options: 상태이상 },
                    { label: "면역 관련", options: 면역 },
                    { label: "에너지 관련", options: 에너지 },
                    { label: "피해 관련", options: 피해 },
                    { label: "추가 피해 관련", options: 추가피해 },
                    { label: "회복 관련", options: 회복 },
                    { label: "교체 관련", options: 교체 },
                    { label: "시너지 관련", options: 시너지 },
                    { label: "금지 관련", options: 금지 },
                    { label: "기타", options: 기타 },
                  ].filter((g) => g.options.length > 0).map(({ label, options }) => (
                    <div key={label} className="flex items-start gap-3">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide pt-1 min-w-[48px] whitespace-nowrap">{label}</span>
                      <div className="flex gap-1 flex-wrap">
                        {options.map((opt) => {
                          const active = filters.키워드.includes(opt);
                          return (
                            <button key={opt} onClick={() => toggleFilter("키워드", opt)}
                              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${active ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700" : "bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-400"}`}
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
                  onClick={() => { setFilters({ 타입: [], 진화: [], 키워드: [], 확장팩: [], 후퇴에너지: [] }); setFilterCardTypes([]); setFilterSpecial(false); setFilterColorless(false); setFilterSkillEnergy([]); }}
                  className="px-2.5 py-1 rounded-full text-xs font-medium text-red-500 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                >초기화</button>
              </div>
            ) : null}
          </div>

          {/* 카드 목록 */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400 dark:text-slate-500">{filtered.length}장 · {page}/{totalPages}페이지 · 클릭하면 덱에 추가</p>
            <button
              onClick={() => setShowDetail((v) => !v)}
              className="px-2.5 py-1 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              {showDetail ? "간소화" : "상세보기"}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
            {pagedCards.map((card) => {
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
                  key={card.ID}
                  type="button"
                  onClick={() => addCard(card)}
                  disabled={maxed}
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
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">{card.확장팩}</span>
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
                      {/* HP */}
                      {!isTrainer && (
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          HP <span className="text-slate-700 dark:text-slate-200 font-bold">{card.HP === 0 ? "—" : card.HP}</span>
                        </div>
                      )}

                      {/* 특성 (특성효과) */}
                      {card.특성 && card.특성효과 && card.특성효과 !== "-" && (
                        <div className="flex items-start gap-1 bg-purple-50 dark:bg-purple-900/20 rounded px-2 py-1">
                          <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 shrink-0 pt-px">특성</span>
                          <span className="text-[11px] text-purple-700 dark:text-purple-300 font-medium">{card.특성}</span>
                          <span className="text-[10px] text-purple-500 dark:text-purple-400 ml-1">{card.특성효과}</span>
                        </div>
                      )}

                      {/* 트레이너스 효과 */}
                      {isTrainer && card.기술추가효과 && card.기술추가효과 !== "-" && (
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">{card.기술추가효과}</p>
                      )}

                      {/* 기술1: 에너지핍 + 기술명 + (기술효과) + 피해량 */}
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
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 pl-1">{card.기술추가효과}</p>
                          )}
                        </div>
                      )}

                      {/* 기술2: 에너지핍 + 기술명 + (기술효과) + 피해량 */}
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
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 pl-1">{card.기술추가효과2}</p>
                          )}
                        </div>
                      )}

                      {/* 약점 (왼쪽) + 후퇴에너지 (오른쪽) */}
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
                              <span key={i} className="inline-block w-2.5 h-2.5 rounded-full border border-slate-400 bg-slate-400" />
                            ))}
                            {card.후퇴에너지 === 0 && <span className="text-slate-300 dark:text-slate-600 text-[10px]">0</span>}
                          </span>
                        </div>
                      )}

                      {/* 키워드 */}
                      {card.키워드 && (
                        <div className="flex flex-wrap gap-1">
                          {card.키워드.split(",").map((k) => k.trim()).filter(Boolean).map((kw) => (
                            <span key={kw} className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800">{kw}</span>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="col-span-full text-center py-10 text-slate-400 dark:text-slate-500 text-sm">검색 결과가 없습니다.</div>
            )}
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 pt-1">
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
          )}
        </div>

        {/* 덱 패널 */}
        <div className="lg:w-80 shrink-0 flex flex-col gap-3 order-first lg:order-last">
          <div className="sticky top-4 flex flex-col gap-3">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <div>
                  <span className="text-base font-bold text-slate-800 dark:text-slate-100">나의 덱</span>
                  <span className={`ml-2 text-sm font-semibold ${totalCards === MAX_DECK ? "text-green-600 dark:text-green-400" : "text-indigo-600 dark:text-indigo-400"}`}>
                    {totalCards} / {MAX_DECK}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowDeckImage(true)} disabled={deck.length === 0}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border border-indigo-200 dark:border-indigo-700 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 disabled:opacity-30 transition-colors"
                  >이미지로 보기</button>
                  {/* CSV 저장 버튼 숨김 처리 */}
                  <button onClick={clearDeck} disabled={deck.length === 0}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border border-red-200 dark:border-red-800 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 disabled:opacity-30 transition-colors"
                  >초기화</button>
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
                  <span className="text-xs text-slate-400 dark:text-slate-500">필요 에너지</span>
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
                <div className="text-center py-10 text-slate-400 dark:text-slate-500 text-sm">카드를 추가해보세요</div>
              )}
              {deck.map(({ card, count }) => {
                const tc = typeColor(card.타입);
                return (
                  <div key={card.ID} className="flex items-center gap-2 px-3 py-2.5">
                    <button
                      onClick={() => removeCard(card.ID)}
                      title="클릭하면 1장 제거"
                      className="flex items-center gap-2 flex-1 min-w-0 text-left hover:bg-slate-50 dark:hover:bg-slate-700/40 rounded transition-colors"
                    >
                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium border ${tc.bg} ${tc.text} ${tc.border}`}>{card.타입}</span>
                      <span className="flex-1 min-w-0 text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{card.이름}</span>
                      <span className="shrink-0 w-5 text-center text-sm font-bold text-indigo-600 dark:text-indigo-400">{count}</span>
                    </button>
                    <button onClick={() => { navigator.clipboard.writeText(card.이름); setCopiedName(card.이름); setTimeout(() => setCopiedName(null), 1500); }} title="포켓몬명 복사" className="shrink-0 w-6 h-6 flex items-center justify-center rounded text-slate-300 hover:text-indigo-500 dark:text-slate-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-xs transition-colors">⧉</button>
                    <button onClick={() => removeAll(card.ID)} className="shrink-0 w-6 h-6 flex items-center justify-center rounded text-slate-300 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs transition-colors">✕</button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

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
                >이미지 다운로드</button>
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
    </div>
  );
}
