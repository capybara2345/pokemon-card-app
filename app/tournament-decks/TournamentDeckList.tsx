"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useLanguage } from "../i18n/context";
import type { Translations } from "../i18n/translations";
import type { EnrichedDeck } from "./page";
import type { Session } from "next-auth";
import {
  saveDeckToFirestore,
  type DeckCard,
} from "../lib/deckFirestore";

type SortKey = "score" | "winRate" | "totalGames" | "popularity";

interface Props {
  decks: EnrichedDeck[];
  session: Session | null;
}

const PROMO_BASE = 900000;

const ENERGY_IMAGE_MAP: Record<string, string> = {
  풀: "/energy/grass.png",
  불: "/energy/fire.png",
  물: "/energy/water.png",
  번개: "/energy/lightning.png",
  초: "/energy/psychic.png",
  격투: "/energy/fighting.png",
  악: "/energy/darkness.png",
  강철: "/energy/steel.png",
  드래곤: "/energy/dragon.png",
};

function getCardImageSrc(id: number): string {
  if (id > PROMO_BASE && id < 1000000) {
    const n = String(id - PROMO_BASE).padStart(5, "0");
    return `/cards/Z/Z${n}.webp`;
  }
  return `/cards/${Math.floor(id / 1000)}/${id}.webp`;
}

function getTierColor(index: number, total: number): string {
  const ratio = index / total;
  if (ratio <= 1 / 6) return "bg-rose-500";
  if (ratio <= 2 / 6) return "bg-orange-500";
  if (ratio <= 3 / 6) return "bg-amber-500";
  if (ratio <= 4 / 6) return "bg-lime-500";
  if (ratio <= 5 / 6) return "bg-emerald-500";
  return "bg-cyan-500";
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function downloadDeckImage(
  deckCards: { count: number; image: string; name: string; numericId: number | null }[],
  lang: string,
  t: Translations
) {
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

  const cells = deckCards.flatMap((c) =>
    Array.from({ length: c.count }, () => c)
  );

  const loadImg = (src: string): Promise<HTMLImageElement | null> =>
    new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });

  const imageUrls = cells.map((c) =>
    lang === "ko" && c.numericId ? getCardImageSrc(c.numericId) : c.image
  );
  const images = await Promise.all(
    Array.from({ length: 20 }, (_, i) =>
      imageUrls[i] ? loadImg(imageUrls[i]) : Promise.resolve(null)
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
      ctx.fillText(t.card.imageLoading, x + CARD_W / 2, y + CARD_H / 2 - 8);
      ctx.fillStyle = "#475569";
      ctx.font = "12px sans-serif";
      ctx.fillText(cells[i].name, x + CARD_W / 2, y + CARD_H / 2 + 12);
    }
  }

  const link = document.createElement("a");
  link.download = "pokemon_deck.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

export default function TournamentDeckList({ decks, session }: Props) {
  const { lang, t } = useLanguage();
  const [query, setQuery] = useState("");
  const [lastUpdated, setLastUpdated] = useState<string>("");

  useEffect(() => {
    fetch("/data/tournament-meta.json")
      .then((res) => res.json())
      .then((data: { updatedAt: string }) => setLastUpdated(data.updatedAt))
      .catch(() => setLastUpdated(""));
  }, []);
  const [sortBy, setSortBy] = useState<SortKey>("score");
  const [minGames, setMinGames] = useState(0);
  const [selectedEnergy, setSelectedEnergy] = useState("");
  const [selectedDeck, setSelectedDeck] = useState<EnrichedDeck | null>(null);
  const [showTextView, setShowTextView] = useState(false);
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 50;

  const filtered = useMemo(() => {
    let list = decks.filter((d) => {
      if (query.trim()) {
        const q = query.toLowerCase();
        if (!d.displayName.toLowerCase().includes(q)) return false;
      }
      if (minGames > 0 && (d.totalGames ?? 0) < minGames) return false;
      if (selectedEnergy && !d.energyTypes.includes(selectedEnergy)) return false;
      return true;
    });

    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case "score":
          return b.bestScore - a.bestScore;
        case "winRate":
          return (b.winRate ?? -1) - (a.winRate ?? -1);
        case "totalGames":
          return (b.totalGames ?? 0) - (a.totalGames ?? 0);
        case "popularity":
          return b.popularity - a.popularity;
        default:
          return 0;
      }
    });

    return list;
  }, [decks, query, sortBy, minGames, selectedEnergy]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, sortBy, minGames, selectedEnergy]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const endIdx = Math.min(startIdx + PAGE_SIZE, total);
  const paginatedDecks = filtered.slice(startIdx, endIdx);

  const closeModal = useCallback(() => {
    setSelectedDeck(null);
    setShowTextView(false);
    setShowSaveModal(false);
    setSaveName("");
    setSaveMsg(null);
  }, []);

  const handleSaveDeck = useCallback(async () => {
    if (!session?.user?.email || !selectedDeck) return;
    if (!saveName.trim()) {
      setSaveMsg(t.deck.nameRequired);
      return;
    }
    setSaving(true);
    setSaveMsg(null);
    try {
      const deckCards: DeckCard[] = selectedDeck.cards
        .filter((c) => c.numericId !== null)
        .map((c) => ({ cardId: c.numericId!, count: c.count }));
      await saveDeckToFirestore(session.user.email, saveName.trim(), deckCards, "");
      setSaveMsg(t.deck.saved);
      setTimeout(() => {
        setShowSaveModal(false);
        setSaveName("");
        setSaveMsg(null);
      }, 2000);
    } catch (e) {
      setSaveMsg(t.deck.saveError);
    } finally {
      setSaving(false);
    }
  }, [session, selectedDeck, saveName]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeModal();
    }
    if (selectedDeck) {
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [selectedDeck, closeModal]);

  const handleImageError = (id: string) => {
    setBrokenImages((prev) => new Set(prev).add(id));
  };

  const getImageUrl = (card: EnrichedDeck["cards"][0]) => {
    if (lang === "ko" && card.numericId) {
      return getCardImageSrc(card.numericId);
    }
    return card.image;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 필터 바 */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.tournament.searchPlaceholder}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="score">{t.tournament.sortScore}</option>
            <option value="winRate">{t.tournament.sortWinRate}</option>
            <option value="totalGames">{t.tournament.sortTotalGames}</option>
            <option value="popularity">{t.tournament.sortPopularity}</option>
          </select>

          <select
            value={minGames}
            onChange={(e) => setMinGames(Number(e.target.value))}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value={0}>{t.tournament.allGames}</option>
            <option value={10}>{t.tournament.gamesAbove(10)}</option>
            <option value={50}>{t.tournament.gamesAbove(50)}</option>
            <option value={100}>{t.tournament.gamesAbove(100)}</option>
            <option value={200}>{t.tournament.gamesAbove(200)}</option>
          </select>

          <select
            value={selectedEnergy}
            onChange={(e) => setSelectedEnergy(e.target.value)}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">{t.filter.skillEnergy}</option>
            {Object.keys(ENERGY_IMAGE_MAP)
              .filter((type) => type !== "드래곤")
              .map((type) => (
                <option key={type} value={type}>
                  {t.pokemonType[type] ?? type}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* 결과 개수 & 업데이트 시간 */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 flex-wrap gap-y-1">
        <span>{total > 0 ? `${startIdx + 1}-${endIdx} / ${total}${t.tournament.decksCount}` : `${total}${t.tournament.decksCount}`}</span>
        <span>{t.tournament.lastUpdated} {lastUpdated ? formatDateTime(lastUpdated) : "-"}</span>
      </div>

      {/* 카드 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {paginatedDecks.map((deck, i) => {
          const tierColor = getTierColor(startIdx + i, total || 1);
          return (
            <button
              key={deck.name}
              onClick={() => setSelectedDeck(deck)}
              className="text-left flex flex-col bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className={`h-1.5 w-full ${tierColor}`} />
              <div className="flex flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug line-clamp-2 min-h-[2.5rem] flex-1 min-w-0">
                    {deck.displayName}
                  </h2>
                  {deck.energyTypes.length > 0 && (
                    <div className="flex items-center gap-0.5 shrink-0 pt-0.5">
                      {deck.energyTypes.map((type) => (
                        <img
                          key={type}
                          src={ENERGY_IMAGE_MAP[type]}
                          alt={type}
                          className="w-4 h-4 rounded-full"
                          title={type}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {deck.winRate !== null ? (
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        deck.winRate >= 55
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                          : deck.winRate >= 50
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                          : "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
                      }`}
                    >
                      {t.tournament.winRate} {deck.winRate}%
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                      {t.tournament.winRate} -
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="flex flex-col items-center rounded-lg bg-slate-50 dark:bg-slate-700/50 p-2">
                    <span className="text-[10px] font-medium text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                      {t.tournament.games}
                    </span>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200 break-all">
                      {deck.totalGames !== null
                        ? deck.totalGames.toLocaleString()
                        : "-"}
                    </span>
                  </div>
                  <div className="flex flex-col items-center rounded-lg bg-slate-50 dark:bg-slate-700/50 p-2">
                    <span className="text-[10px] font-medium text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                      {t.tournament.score}
                    </span>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                      {deck.bestScore.toFixed(3)}
                    </span>
                  </div>
                  <div className="flex flex-col items-center rounded-lg bg-slate-50 dark:bg-slate-700/50 p-2">
                    <span className="text-[10px] font-medium text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                      {t.tournament.popularity}
                    </span>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                      {(deck.popularity * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* 페이징 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            {t.pagination.prev}
          </button>

          <div className="flex items-center gap-1 flex-wrap">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              const isActive = page === currentPage;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-sky-500 text-white"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                  }`}
                >
                  {page}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            {t.pagination.next}
          </button>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-12 text-sm text-slate-500 dark:text-slate-400">
          {t.tournament.noResults}
        </div>
      )}

      {/* 덱 이미지 보기 모달 */}
      {selectedDeck && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col gap-4 p-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-slate-800 dark:text-slate-100">
                {selectedDeck.displayName}{" "}
                <span className="text-sm font-normal text-slate-400 dark:text-slate-500">
                  ({selectedDeck.cards.reduce((s, c) => s + c.count, 0)} / 20)
                </span>
              </span>
              <button
                onClick={closeModal}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 text-sm transition-colors"
              >
                ✕
              </button>
            </div>

            {/* 액션 버튼 행 */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowTextView((v) => !v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  showTextView
                    ? "bg-slate-800 text-white border-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:border-slate-100"
                    : "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                {showTextView ? t.tournament.viewAsImage : t.tournament.viewAsText}
              </button>
              <button
                onClick={() => downloadDeckImage(selectedDeck.cards, lang, t)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-500 hover:bg-indigo-600 text-white transition-colors"
              >
                {t.tournament.downloadImage}
              </button>
              {session?.user && (
                <button
                  onClick={() => {
                    setSaveName(selectedDeck.displayName);
                    setShowSaveModal(true);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors"
                >
                  {t.deck.save}
                </button>
              )}
            </div>

            {/* 스탯 요약 */}
            <div className="flex items-center gap-2 flex-wrap">
              {selectedDeck.winRate !== null && (
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    selectedDeck.winRate >= 55
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                      : selectedDeck.winRate >= 50
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                      : "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
                  }`}
                >
                  {t.tournament.winRate} {selectedDeck.winRate}%
                </span>
              )}
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {selectedDeck.totalGames !== null
                  ? `${selectedDeck.totalGames.toLocaleString()}${t.tournament.games}`
                  : "-"}
                {" · "}
                {t.tournament.score} {selectedDeck.bestScore.toFixed(3)}
                {" · "}
                {t.tournament.popularity} {(selectedDeck.popularity * 100).toFixed(1)}%
              </span>
            </div>

            {showTextView ? (
              <div className="flex flex-col gap-3">
                <h4 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {t.tournament.deckComposition} ({selectedDeck.cards.reduce((s, c) => s + c.count, 0)})
                </h4>
                <div className="flex flex-col gap-2">
                  {selectedDeck.cards.map((card, idx) => (
                    <div
                      key={`${card.id}-${idx}`}
                      className="flex items-center gap-3 rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30 p-2.5"
                    >
                      <span className="w-6 text-center text-xs font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                        {card.count}x
                      </span>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                          {lang === "ko" && card.koName ? card.koName : card.name}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">
                          {card.id}
                          {card.expansion && (
                            <span className="ml-1 text-slate-400 dark:text-slate-500">· {card.expansion}</span>
                          )}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          const textToCopy = lang === "ko" && card.koName ? card.koName : card.name;
                          navigator.clipboard.writeText(textToCopy);
                          setCopiedId(card.id);
                          setTimeout(() => setCopiedId((prev) => (prev === card.id ? null : prev)), 1500);
                        }}
                        title={t.tournament.copyCardName}
                        className="shrink-0 w-7 h-7 flex items-center justify-center rounded text-slate-300 hover:text-indigo-500 dark:text-slate-500 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-xs transition-colors"
                      >
                        {copiedId === card.id ? (
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"
                            className="text-emerald-500"
                          >
                            <path d="M2 8L6 12L14 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <rect x="2" y="2" width="9" height="9" rx="1" stroke="currentColor" strokeWidth="1.5" />
                            <path d="M5 5H14V14H5V5Z" stroke="currentColor" strokeWidth="1.5" />
                          </svg>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {(() => {
                  const cells = selectedDeck.cards.flatMap((c) =>
                    Array.from({ length: c.count }, () => c)
                  );
                  return Array.from({ length: 20 }, (_, i) => {
                    const card = cells[i];
                    if (!card)
                      return (
                        <div
                          key={`empty-${i}`}
                          className="aspect-[2/3] rounded-md bg-slate-100 dark:bg-slate-700/50 border-2 border-dashed border-slate-200 dark:border-slate-600"
                        />
                      );

                    const src = getImageUrl(card);
                    const isBroken = brokenImages.has(card.id);

                    return (
                      <div
                        key={`${card.id}-${i}`}
                        className="aspect-[2/3] rounded-md overflow-hidden bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center"
                      >
                        {src && !isBroken ? (
                          <img
                            src={src}
                            alt={card.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={() => handleImageError(card.id)}
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-center px-1">
                            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-tight">
                              {card.name}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 덱 저장 모달 */}
      {showSaveModal && selectedDeck && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => {
            setShowSaveModal(false);
            setSaveMsg(null);
          }}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm flex flex-col gap-4 p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-slate-800 dark:text-slate-100">
                {t.deck.save}
              </span>
              <button
                onClick={() => {
                  setShowSaveModal(false);
                  setSaveMsg(null);
                }}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 text-sm transition-colors"
              >
                ✕
              </button>
            </div>
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder={t.deck.namePlaceholder}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-300"
              maxLength={30}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && saveName.trim()) handleSaveDeck();
              }}
            />
            {saveMsg && (
              <div className={`text-xs ${saveMsg === t.deck.saved ? "text-emerald-500" : "text-red-500"}`}>
                {saveMsg}
              </div>
            )}
            <div className="flex justify-end">
              <button
                onClick={handleSaveDeck}
                disabled={saving || !saveName.trim()}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-green-500 hover:bg-green-600 text-white disabled:opacity-40 transition-colors"
              >
                {saving ? `${t.deck.save}...` : t.deck.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
