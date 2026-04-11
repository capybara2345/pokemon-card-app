"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { type PokemonCard, getCardImageSrc } from "../data/cards";
import { useLanguage } from "../i18n/context";

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  풀: { bg: "bg-green-100", text: "text-green-800", border: "border-green-300" },
  불: { bg: "bg-red-100", text: "text-red-800", border: "border-red-300" },
  물: { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-300" },
  번개: { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-300" },
  초: { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-300" },
  악: { bg: "bg-gray-800", text: "text-gray-100", border: "border-gray-600" },
  격투: { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-300" },
  땅: { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-300" },
  무색: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-300" },  강철: { bg: "bg-slate-200", text: "text-slate-700", border: "border-slate-400" },
  드래곤: { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-300" },};

const POKEMON_TYPES = ["풀", "불", "물", "번개", "초", "격투", "악", "강철", "드래곤", "무색"];

const EVOLUTION_COLORS: Record<string, string> = {
  기본: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
  "1진화": "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300",
  "2진화": "bg-violet-100 text-violet-700 dark:bg-violet-900/60 dark:text-violet-300",
};



const EVOLUTION_ORDER = ["기본", "1진화", "2진화"];
const PAGE_SIZE = 50;

function countEnergy(energy: string | undefined): number {
  if (!energy || energy.trim() === "" || energy.trim() === "-") return 0;
  return energy.split("/").reduce((sum, seg) => {
    const trimmed = seg.trim();
    if (!trimmed || trimmed === "-") return sum;
    const m = trimmed.match(/(\d+)/);
    return sum + (m ? parseInt(m[1], 10) : 1);
  }, 0);
}

type SortDir = "asc" | "desc" | null;

export default function CardGrid({ cards }: { cards: PokemonCard[] }) {
  const { t } = useLanguage();

  const COLUMNS: { key: keyof PokemonCard; label: string; width: string }[] = [
    { key: "타입", label: t.card.type, width: "w-16" },
    { key: "이름", label: t.card.name, width: "w-24" },
    { key: "진화", label: t.card.evolutionLabel, width: "w-16" },
    { key: "HP", label: "HP", width: "w-14" },
    { key: "기술명", label: t.card.skillName, width: "w-28" },
    { key: "기술추가효과", label: t.card.effect, width: "w-56" },
    { key: "필요에너지", label: t.filter.skillEnergy, width: "w-24" },
    { key: "피해량", label: t.card.damage, width: "w-14" },
    { key: "후퇴에너지", label: t.filter.retreatEnergy, width: "w-14" },
    { key: "특성", label: t.card.ability, width: "w-24" },
    { key: "약점", label: t.card.weakness, width: "w-16" },
    { key: "관련서포터", label: t.card.relatedSupporters, width: "w-28" },
    { key: "키워드", label: t.card.keyword, width: "w-16" },
    { key: "확장팩", label: t.card.expansion, width: "w-32" },
  ];

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 200);
    return () => clearTimeout(t);
  }, [search]);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<{
    타입: string[];
    진화: string[];
    키워드: string[];
    확장팩: string[];
    후퇴에너지: string[];
  }>({ 타입: [], 진화: [], 키워드: [], 확장팩: [], 후퇴에너지: [] });
  const [sort, setSort] = useState<{ key: keyof PokemonCard | null; dir: SortDir }>({
    key: null,
    dir: null,
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filterCardTypes, setFilterCardTypes] = useState<string[]>([]);
  const [filterSpecial, setFilterSpecial] = useState(false);
  const [filterColorless, setFilterColorless] = useState(false);
  const [dark, setDark] = useState(false);
  const [selectedCard, setSelectedCard] = useState<PokemonCard | null>(null);
  const [mobileDetail, setMobileDetail] = useState<PokemonCard | null>(null);
  const [pageSize, setPageSize] = useState(50);
  const [filterSkillEnergy, setFilterSkillEnergy] = useState<number[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = saved === "dark" || (!saved && prefersDark);
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const resetPage = () => setPage(1);

  const toggleFilter = (
    group: keyof typeof filters,
    value: string
  ) => {
    resetPage();
    setFilters((prev) => {
      const current = prev[group];
      return {
        ...prev,
        [group]: current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value],
      };
    });
  };

  const handleSort = (key: keyof PokemonCard) => {
    setSort((prev) => {
      if (prev.key === key) {
        if (prev.dir === "asc") return { key, dir: "desc" };
        if (prev.dir === "desc") return { key: null, dir: null };
      }
      return { key, dir: "asc" };
    });
  };

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
      후퇴에너지: [...new Set(cards.map((c) => String(c.후퇴에너지)))].sort(
        (a, b) => Number(a) - Number(b)
      ),
    };
  }, [cards]);

  // 카드 ID별 기술에너지 수 사전 계산 (필터용)
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

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.trim().toLowerCase();
      const SEARCH_FIELDS: (keyof PokemonCard)[] = ["이름", "기술명", "기술명2", "기술추가효과", "기술추가효과2", "키워드", "특성", "특성효과"];
      result = result.filter((card) =>
        SEARCH_FIELDS.some((key) => String(card[key] ?? "").toLowerCase().includes(q))
      );
    }

    if (filters.타입.length)
      result = result.filter((c) => filters.타입.includes(c.타입));
    if (filters.진화.length)
      result = result.filter((c) => filters.진화.includes(c.진화));
    if (filters.키워드.length)
      result = result.filter((c) =>
        c.키워드 &&
        filters.키워드.some((kw) =>
          c.키워드.split(",").map((k) => k.trim()).includes(kw)
        )
      );
    if (filters.확장팩.length)
      result = result.filter((c) => filters.확장팩.includes(c.확장팩));
    if (filters.후퇴에너지.length)
      result = result.filter((c) => filters.후퇴에너지.includes(String(c.후퇴에너지)));
    if (filterCardTypes.length)
      result = result.filter((c) => filterCardTypes.some((ct) => c.카드타입?.split(",").map((v) => v.trim().toLowerCase()).includes(ct.toLowerCase())));
    if (filterSpecial)
      result = result.filter((c) => c.특성효과 && c.특성효과 !== "-");
    if (filterColorless) {
      const isColorlessOnly = (energy: string) =>
        !!energy && energy !== "-" &&
        energy.split("/").every((seg) => /^무색\d*$/.test(seg.trim()));
      result = result.filter((c) =>
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

    if (sort.key && sort.dir) {
      const { key, dir } = sort;
      result = [...result].sort((a, b) => {
        const av = a[key];
        const bv = b[key];
        if (typeof av === "number" && typeof bv === "number") {
          return dir === "asc" ? av - bv : bv - av;
        }
        const an = parseFloat(String(av));
        const bn = parseFloat(String(bv));
        if (!isNaN(an) && !isNaN(bn)) {
          return dir === "asc" ? an - bn : bn - an;
        }
        return dir === "asc"
          ? String(av).localeCompare(String(bv), "ko")
          : String(bv).localeCompare(String(av), "ko");
      });
    }

    return result;
  }, [cards, debouncedSearch, filters, sort, filterCardTypes, filterSpecial, filterColorless, filterSkillEnergy, energyCounts]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const typeColor = (type: string) =>
    TYPE_COLORS[type] ?? { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-300" };

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6 min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
            {t.app.cardListTitle}
          </h1>
          <div className="flex items-center gap-2">
          </div>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t.search.total(filtered.length, cards.length)}
          {totalPages > 1 && (
            <span className="ml-2 text-slate-400 dark:text-slate-500">({t.search.pageOf(page, totalPages)})</span>
          )}
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
          🔍
        </span>
        <input
          type="text"
          placeholder={t.search.placeholder}
          value={search}
          onChange={(e) => { setSearch(e.target.value); resetPage(); }}
          className="w-full pl-9 pr-3 py-2 text-sm text-slate-900 dark:text-slate-100 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 placeholder:text-slate-400 dark:placeholder:text-slate-500"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 text-xs"
          >
            ✕
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        {/* 기본 필터 행 */}
        <div className="flex flex-wrap items-center gap-4">
          {([
              { group: "타입", label: t.filter.pokemonType, options: filterOptions.포켓몬타입 },
              { group: "진화", label: t.filter.evolutionStage, options: filterOptions.진화 },
            ] as { group: "타입" | "진화" | "후퇴에너지"; label: string; options: string[] }[]
          ).map(({ group, label, options }) => (
            <div key={group} className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                {label}
              </span>
              <div className="flex gap-1 flex-wrap">
                {options.map((opt) => {
                  const active = filters[group].includes(opt);
                  const colorCls =
                    group === "타입"
                      ? active
                        ? `${typeColor(opt).bg} ${typeColor(opt).text} ${typeColor(opt).border} border`
                        : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-400"
                      : active
                      ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700"
                      : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-400";
                  return (
                    <button
                      key={opt}
                      onClick={() => toggleFilter(group, opt)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${colorCls}`}
                    >
                      {group === "후퇴에너지" ? t.filter.energyCount(Number(opt)) : (group === "타입" ? (t.pokemonType[opt] ?? opt) : (t.evolution[opt] ?? opt))}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {filterOptions.트레이너스타입.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{t.filter.trainers}</span>
              <div className="flex gap-1 flex-wrap">
                {filterOptions.트레이너스타입.map((opt) => {
                  const active = filters.타입.includes(opt);
                  return (
                    <button
                      key={opt}
                      onClick={() => toggleFilter("타입", opt)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer border ${
                        active
                          ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700"
                          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-400"
                      }`}
                    >{opt}</button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 기술에너지 개수 필터 */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              {t.filter.skillEnergy}
            </span>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4, 5].map((n) => {
                const active = filterSkillEnergy.includes(n);
                return (
                  <button
                    key={n}
                    onClick={() => { setFilterSkillEnergy((prev) => prev.includes(n) ? prev.filter((v) => v !== n) : [...prev, n]); resetPage(); }}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                      active
                        ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700"
                        : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-400"
                    }`}
                  >
                    {t.filter.energyCount(n)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 후퇴에너지 필터 */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              {t.filter.retreatEnergy}
            </span>
            <div className="flex gap-1 flex-wrap">
              {filterOptions.후퇴에너지.map((opt) => {
                const active = filters.후퇴에너지.includes(opt);
                return (
                  <button
                    key={opt}
                    onClick={() => toggleFilter("후퇴에너지", opt)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                      active
                        ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700"
                        : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-400"
                    }`}
                  >
                    {t.filter.energyCount(Number(opt))}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 확장팩 필터 (셀렉트박스) */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide shrink-0">{t.filter.expansion}</span>
            <select
              value={filters.확장팩[0] ?? ""}
              onChange={(e) => { setFilters((prev) => ({ ...prev, 확장팩: e.target.value ? [e.target.value] : [] })); resetPage(); }}
              className="px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer"
            >
              <option value="">{t.filter.all}</option>
              {filterOptions.확장팩.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* 상세필터 토글 버튼 */}
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 dark:text-slate-400">{t.filter.perPage}</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); resetPage(); }}
                className="px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer"
              >
                {[10, 25, 50, 100, 200].map((n) => (
                  <option key={n} value={n}>{n}개</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setShowAdvanced((v) => !v)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                showAdvanced
                  ? "bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700"
                  : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-400"
              }`}
            >
              {t.filter.detailFilter}
              <span className="text-[10px]">{showAdvanced ? "▲" : "▼"}</span>
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
              <button
                onClick={() => { setFilterCardTypes((prev) => prev.includes("ex") ? prev.filter((v) => v !== "ex") : [...prev, "ex"]); resetPage(); }}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                  filterCardTypes.includes("ex")
                    ? "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-400"
                }`}
              >ex</button>
              <button
                onClick={() => { setFilterCardTypes((prev) => prev.includes("메가ex") ? prev.filter((v) => v !== "메가ex") : [...prev, "메가ex"]); resetPage(); }}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                  filterCardTypes.includes("메가ex")
                    ? "bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-400"
                }`}
              >{t.cardTypeLabel.megaEx}</button>
              <button
                onClick={() => { setFilterCardTypes((prev) => prev.includes("베이비") ? prev.filter((v) => v !== "베이비") : [...prev, "베이비"]); resetPage(); }}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                  filterCardTypes.includes("베이비")
                    ? "bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-700"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-400"
                }`}
              >{t.cardTypeLabel.baby}</button>
              <button
                onClick={() => { setFilterCardTypes((prev) => prev.includes("울트라비스트") ? prev.filter((v) => v !== "울트라비스트") : [...prev, "울트라비스트"]); resetPage(); }}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                  filterCardTypes.includes("울트라비스트")
                    ? "bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-700"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-400"
                }`}
              >{t.cardTypeLabel.ultraBeast}</button>
              <button
                onClick={() => { setFilterSpecial((v) => !v); resetPage(); }}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                  filterSpecial
                    ? "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-400"
                }`}
              >{t.filter.hasAbility}</button>
              <button
                onClick={() => { setFilterColorless((v) => !v); resetPage(); }}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                  filterColorless
                    ? "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-400 dark:border-gray-500"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-400"
                }`}
              >{t.filter.hasColorlessSkillShort}</button>
              </div>
            </div>

            {/* 키워드 필터 - 그룹별 */}
            {(() => {
              const allKw = filterOptions.키워드;
              const used = new Set<string>();
              const take = (pred: (k: string) => boolean) => {
                const r = allKw.filter((k) => !used.has(k) && pred(k));
                r.forEach((k) => used.add(k));
                return r;
              };
              const 상태이상키워드 = take((k) => /독|혼란|마비|잠듦|화상|상태이상/.test(k));
              const 방어면역키워드 = take((k) => /면역/.test(k) || ["약점 무시","약점 무효","효과 무시","데미지 감소","기술 데미지 감소 부여","기사회생","동전 피격 방어","HP 만땅 데미지 감소"].includes(k));
              const 추가피해키워드 = take((k) => k.includes("기반 피해"));
              const 피해키워드 = take((k) => /피해/.test(k) || ["자해","반격 기절","데미지 반사","데미지 이동","데미지 강화","HP 강제 감소","HP 절반","기절 유발","지연 피해","피격 데미지 증가"].includes(k));
              const 에너지키워드 = take((k) => /에너지/.test(k) || ["후퇴비용 감소","후퇴비용 증가","기술비용 감소","기술비용 증가"].includes(k));
              const 회복키워드 = take((k) => /회복/.test(k) || k === "HP 증가");
              const 교체이동키워드 = take((k) => /교체/.test(k) || ["자신 귀환","기절 시 귀환","상대 귀환 강제","벤치 전개","상대 벤치 전개"].includes(k));
              const 덱패조작키워드 = take((k) => /드로우|덱 서치|덱 조작|덱 확인|트래쉬 회수|패 조작|패 확인|자신 덱 트래쉬/.test(k));
              const 방해차단키워드 = take((k) => /차단|금지|덱 파괴|스태디움 제거|도구 트래쉬/.test(k) || ["상대 패 트래쉬","포인트 차단"].includes(k));
              const 진화키워드 = take((k) => /진화|퇴화|화석/.test(k));
              const 기술동전키워드 = take((k) => /기술 계승|기술 복사|서포트 복사|연속 기술|차례 종료|동전 확정|HP 조건 실패|추가 포인트/.test(k));
              const 기타키워드 = take(() => true);
              const kwGroups = [
                { label: t.filter.keywordGroups.abnormal, options: 상태이상키워드 },
                { label: t.filter.keywordGroups.defense, options: 방어면역키워드 },
                { label: t.filter.keywordGroups.bonusDamage, options: 추가피해키워드 },
                { label: t.filter.keywordGroups.damage, options: 피해키워드 },
                { label: t.filter.keywordGroups.energy, options: 에너지키워드 },
                { label: t.filter.keywordGroups.recovery, options: 회복키워드 },
                { label: t.filter.keywordGroups.swap, options: 교체이동키워드 },
                { label: t.filter.keywordGroups.deckHand, options: 덱패조작키워드 },
                { label: t.filter.keywordGroups.disrupt, options: 방해차단키워드 },
                { label: t.filter.keywordGroups.evolution, options: 진화키워드 },
                { label: t.filter.keywordGroups.skillCoin, options: 기술동전키워드 },
                { label: t.filter.keywordGroups.other, options: 기타키워드 },
              ].filter((g) => g.options.length > 0);

              return kwGroups.map(({ label, options }) => (
                <div key={label} className="flex items-start gap-3">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide pt-1 min-w-[48px] whitespace-nowrap">
                    {label}
                  </span>
                  <div className="flex gap-1 flex-wrap">
                    {options.map((opt) => {
                      const active = filters.키워드.includes(opt);
                      return (
                        <button
                          key={opt}
                          onClick={() => toggleFilter("키워드", opt)}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                            active
                              ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700"
                              : "bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-400"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ));
            })()}
          </div>
        )}

        {/* 초기화 버튼 */}
        {(filters.타입.length || filters.진화.length || filters.키워드.length || filters.확장팩.length || filters.후퇴에너지.length || filterCardTypes.length || filterSpecial || filterColorless || filterSkillEnergy.length) ? (
          <div>
            <button
              onClick={() => { setFilters({ 타입: [], 진화: [], 키워드: [], 확장팩: [], 후퇴에너지: [] }); setFilterCardTypes([]); setFilterSpecial(false); setFilterColorless(false); setFilterSkillEnergy([]); resetPage(); }}
              className="px-2.5 py-1 rounded-full text-xs font-medium text-red-500 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
            >
              {t.filter.clear}
            </button>
          </div>
        ) : null}
      </div>

      {/* Mobile List */}
      <div className="block md:hidden rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700">
        {paginated.length === 0 && (
          <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-sm">
            {t.search.noResults}
          </div>
        )}
        {paginated.map((card) => {
          const tc = typeColor(card.타입);
          const nameText = card.이름.replace(/\s+ex$/i, "").trim();
          const 카드타입Types = card.카드타입?.split(",").map((v) => v.trim().toLowerCase()) ?? [];
          const isMegaEx = 카드타입Types.includes("메가ex");
          const isEx = 카드타입Types.includes("ex");
          const isUltraBeast = 카드타입Types.includes("울트라비스트");
          const isBaby = 카드타입Types.includes("베이비");
          return (
            <div key={card.ID} className="flex items-center gap-2 px-3 py-2.5">
              <span className={`shrink-0 inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${tc.bg} ${tc.text} ${tc.border}`}>
                {card.타입}
              </span>
              <span className="flex-1 text-sm font-semibold text-slate-800 dark:text-slate-100 min-w-0 truncate">
                {nameText}
                {isMegaEx && <span className="ml-1 inline-block px-1 py-0.5 rounded text-[10px] font-bold bg-rose-500 text-white leading-none ring-1 ring-rose-600">메가ex</span>}
                {!isMegaEx && isEx && <span className="ml-1 inline-block px-1 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white leading-none ring-1 ring-amber-600">ex</span>}
                {isUltraBeast && <span className="ml-1 inline-block px-1 py-0.5 rounded text-[10px] font-bold bg-teal-500 text-white leading-none ring-1 ring-teal-600">UB</span>}
                {isBaby && <span className="ml-1 inline-block px-1 py-0.5 rounded text-[10px] font-bold bg-sky-400 text-white leading-none ring-1 ring-sky-500">baby</span>}
              </span>
              <span className={`shrink-0 inline-block px-2 py-0.5 rounded text-xs font-medium ${EVOLUTION_COLORS[card.진화] ?? "bg-gray-100 text-gray-600"}`}>
                {card.진화}
              </span>
              <button
                type="button"
                onClick={() => setMobileDetail(card)}
                className="shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700 hover:bg-indigo-100 dark:hover:bg-indigo-800/40 transition-colors"
              >
                {t.deck.showDetail}
              </button>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-800">
        <table className="text-sm w-full border-collapse">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wide">
              {COLUMNS.map(({ key, label, width }) => (
                <th
                  key={key}
                  onClick={() => handleSort(key)}
                  className={`${width} px-3 py-3 text-center font-semibold whitespace-nowrap cursor-pointer select-none hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors`}
                >
                  <span className="flex items-center justify-center gap-1">
                    {label}
                    <SortIcon currentKey={key} sort={sort} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={COLUMNS.length}
                  className="text-center py-12 text-slate-400 dark:text-slate-500 text-sm"
                >
                  {t.search.noResults}
                </td>
              </tr>
            )}
            {paginated.flatMap((card, idx) => {
              const tc = typeColor(card.타입);
              const 카드타입Types = card.카드타입?.split(",").map((v) => v.trim().toLowerCase()) ?? [];
              const isMegaEx = 카드타입Types.includes("메가ex");
              const isEx = 카드타입Types.includes("ex");
              const isUltraBeast = 카드타입Types.includes("울트라비스트");
              const isBaby = 카드타입Types.includes("베이비");
              const rowBg = isMegaEx
                ? "bg-rose-50/60 dark:bg-rose-900/10 hover:bg-rose-100/60 dark:hover:bg-rose-900/20"
                : isUltraBeast
                  ? "bg-teal-50/60 dark:bg-teal-900/10 hover:bg-teal-100/60 dark:hover:bg-teal-900/20"
                  : isEx
                    ? "bg-amber-50/60 dark:bg-amber-900/10 hover:bg-amber-100/60 dark:hover:bg-amber-900/20"
                    : isBaby
                      ? "bg-sky-50/60 dark:bg-sky-900/10 hover:bg-sky-100/60 dark:hover:bg-sky-900/20"
                      : "hover:bg-indigo-50/40 dark:hover:bg-indigo-900/20";
              const py = "py-2.5";
              const rs = card.기술명2 ? 2 : 1;
              const nameText = card.이름.replace(/\s+ex$/i, "").trim();
              const rowCls = `border-t border-slate-100 dark:border-slate-700 transition-colors ${rowBg}`;
              const row2Cls = `border-t border-dashed border-slate-200 dark:border-slate-700/60 transition-colors ${rowBg}`;

              const firstRow = (
                <tr key={`${card.이름}-${idx}-0`} className={rowCls}>
                  {/* 타입 */}
                  <td rowSpan={rs} className={`px-3 ${py} text-center align-middle`}>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${tc.bg} ${tc.text} ${tc.border}`}
                    >
                      {card.타입}
                    </span>
                  </td>

                  {/* 이름 */}
                  <td rowSpan={rs} className={`px-3 ${py} text-center font-semibold whitespace-nowrap align-middle`}>
                    <button
                      type="button"
                      onClick={() => setSelectedCard(card)}
                      className="hover:underline decoration-dotted underline-offset-2 cursor-pointer transition-opacity hover:opacity-75"
                    >
                      {isMegaEx ? (
                        <span className="inline-flex items-center gap-1">
                          <span className="text-slate-800 dark:text-slate-100">{nameText}</span>
                          <span className="inline-block px-1 py-0.5 rounded text-[10px] font-bold bg-rose-500 text-white leading-none ring-1 ring-rose-600">메가ex</span>
                        </span>
                      ) : isEx && isUltraBeast ? (
                        <span className="inline-flex items-center gap-1">
                          <span className="text-slate-800 dark:text-slate-100">{nameText}</span>
                          <span className="inline-block px-1 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white leading-none ring-1 ring-amber-600">ex</span>
                          <span className="inline-block px-1 py-0.5 rounded text-[10px] font-bold bg-teal-500 text-white leading-none ring-1 ring-teal-600">UB</span>
                        </span>
                      ) : isUltraBeast ? (
                        <span className="inline-flex items-center gap-1">
                          <span className="text-slate-800 dark:text-slate-100">{nameText}</span>
                          <span className="inline-block px-1 py-0.5 rounded text-[10px] font-bold bg-teal-500 text-white leading-none ring-1 ring-teal-600">UB</span>
                        </span>
                      ) : isEx ? (
                        <span className="inline-flex items-center gap-1">
                          <span className="text-slate-800 dark:text-slate-100">{nameText}</span>
                          <span className="inline-block px-1 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white leading-none ring-1 ring-amber-600">ex</span>
                        </span>
                      ) : isBaby ? (
                        <span className="inline-flex items-center gap-1">
                          <span className="text-slate-800 dark:text-slate-100">{nameText}</span>
                          <span className="inline-block px-1 py-0.5 rounded text-[10px] font-bold bg-sky-400 text-white leading-none ring-1 ring-sky-500">baby</span>
                        </span>
                      ) : (
                        <span className="text-slate-800 dark:text-slate-100">{nameText}</span>
                      )}
                    </button>
                  </td>

                  {/* 진화 */}
                  <td rowSpan={rs} className={`px-3 ${py} text-center align-middle`}>
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${EVOLUTION_COLORS[card.진화] ?? "bg-gray-100 text-gray-600"}`}
                    >
                      {card.진화}
                    </span>
                  </td>

                  {/* HP */}
                  <td rowSpan={rs} className={`px-3 ${py} text-center font-bold align-middle`}>
                    <span className={valueColor(card.HP)}>{card.HP === 0 ? "—" : card.HP}</span>
                  </td>

                  {/* 기술명1 */}
                  <td className={`px-3 ${py} whitespace-nowrap align-middle`}>
                    {card.기술명 && card.기술명 !== "-" ? (
                      <span className="text-slate-700 dark:text-slate-200">{card.기술명}</span>
                    ) : (
                      <span className="text-slate-300 dark:text-slate-600">—</span>
                    )}
                  </td>

                  {/* 기술추가효과1 */}
                  <td className={`px-3 ${py} text-xs text-slate-500 dark:text-slate-400 max-w-[160px] align-middle`}>
                    {card.기술추가효과 === "-" ? (
                      <span className="text-slate-300 dark:text-slate-600">—</span>
                    ) : card.기술추가효과}
                  </td>

                  {/* 필요에너지1 */}
                  <td className={`px-3 ${py} text-center align-middle`}>
                    <EnergyPips energy={card.필요에너지} />
                  </td>

                  {/* 피해량1 */}
                  <td className={`px-3 ${py} text-center font-semibold align-middle`}>
                    <span className={valueColor(card.피해량)}>{card.피해량 && card.피해량 !== "0" && card.피해량 !== "-" ? card.피해량 : "—"}</span>
                  </td>

                  {/* 후퇴에너지 */}
                  <td rowSpan={rs} className={`px-3 ${py} text-center align-middle`}>
                    <span className="flex gap-0.5 justify-center">
                      {Array.from({ length: card.후퇴에너지 }).map((_, i) => (
                        <img key={i} src="/energy/colorless.png" alt="무색" className="inline-block w-3.5 h-3.5" />
                      ))}
                    </span>
                    {card.후퇴에너지 === 0 && <span className="text-slate-300 dark:text-slate-600">—</span>}
                  </td>

                  {/* 특성 */}
                  <td rowSpan={rs} className={`px-3 ${py} text-xs text-slate-500 dark:text-slate-400 align-middle`}>
                    {card.특성 ? (
                      <SpecialAbilityBadge name={card.특성} effect={card.특성효과} />
                    ) : (
                      <span className="text-slate-300 dark:text-slate-600">—</span>
                    )}
                  </td>

                  {/* 약점 */}
                  <td rowSpan={rs} className={`px-3 ${py} text-center align-middle`}>
                    {card.약점 ? (
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${typeColor(card.약점).bg} ${typeColor(card.약점).text}`}
                      >
                        {card.약점}
                      </span>
                    ) : (
                      <span className="text-slate-300 dark:text-slate-600">—</span>
                    )}
                  </td>

                  {/* 관련서포터 */}
                  <td rowSpan={rs} className={`px-3 ${py} text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap align-middle`}>
                    {(() => {
                      const supporters: string[] = [];
                      if (card.진화 === "1진화") supporters.push("관광객");
                      if (card.진화 === "2진화") supporters.push("릴리에");
                      if (card.타입 === "풀") supporters.push("민화");
                      if (card.타입 === "물") supporters.push("이슬");
                      if (card.타입 === "물") supporters.push("낚시꾼");
                      if (card.타입 === "초") supporters.push("유빈");
                      if (card.타입 === "초") supporters.push("카르네");
                      if (card.타입 === "격투") supporters.push("등산가");
                      if (card.타입 === "강철") supporters.push("찬석");
                      if (card.타입 === "무색") supporters.push("일리마");
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
                      if (card.카드타입?.includes("울트라비스트")) supporters.push("루자미네");
                      if (card.카드타입?.includes("메가ex")) supporters.push("세레나");
                      if (card.카드타입?.includes("메가ex")) supporters.push("칼름");
                      if (card.키워드?.includes("동전 기반") || card.키워드?.includes("동전 상태이상") || card.키워드?.includes("동전 기술 실패") || card.키워드?.includes("동전 피격")) supporters.push("일목");
                      if ((typeof card.HP === "number" ? card.HP : parseInt(String(card.HP), 10)) <= 50 && card.진화 === "기본") supporters.push("루티아");
                      return supporters.length > 0
                        ? supporters.join(", ")
                        : <span className="text-slate-300 dark:text-slate-600">—</span>;
                    })()}
                  </td>

                  {/* 키워드 */}
                  <td rowSpan={rs} className={`px-3 ${py} text-center align-middle`}>
                    {card.키워드 ? (
                      <KeywordBadge keywords={card.키워드} />
                    ) : (
                      <span className="text-slate-300 dark:text-slate-600">—</span>
                    )}
                  </td>

                  {/* 확장팩 */}
                  <td rowSpan={rs} className={`px-3 ${py} text-center text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap align-middle`}>
                    {card.확장팩}
                  </td>
                </tr>
              );

              if (!card.기술명2) return [firstRow];

              return [
                firstRow,
                <tr key={`${card.이름}-${idx}-1`} className={row2Cls}>
                  {/* 기술명2 */}
                  <td className={`px-3 ${py} whitespace-nowrap text-slate-700 dark:text-slate-200 align-middle`}>
                    {card.기술명2}
                  </td>

                  {/* 기술추가효과2 */}
                  <td className={`px-3 ${py} text-xs text-slate-500 dark:text-slate-400 max-w-[160px] align-middle`}>
                    {!card.기술추가효과2 || card.기술추가효과2 === "-" ? (
                      <span className="text-slate-300 dark:text-slate-600">—</span>
                    ) : card.기술추가효과2}
                  </td>

                  {/* 필요에너지2 */}
                  <td className={`px-3 ${py} text-center align-middle`}>
                    <EnergyPips energy={card.필요에너지2 ?? ""} />
                  </td>

                  {/* 피해량2 */}
                  <td className={`px-3 ${py} text-center font-semibold align-middle`}>
                    <span className={valueColor(card.피해량2 ?? "0")}>{card.피해량2 && card.피해량2 !== "0" && card.피해량2 !== "-" ? card.피해량2 : "—"}</span>
                  </td>
                </tr>,
              ];
            })}
          </tbody>
        </table>
      </div>

      {/* Card Image Modal */}
      {selectedCard && typeof window !== "undefined" && createPortal(
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedCard(null)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="relative pointer-events-auto bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-5 flex flex-col items-center gap-3 w-[min(24rem,90vw)]">
              <button
                type="button"
                onClick={() => setSelectedCard(null)}
                className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg leading-none px-1"
              >
                ✕
              </button>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{selectedCard.이름}</p>
              <CardImage id={selectedCard.ID} name={selectedCard.이름} />
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Mobile Detail Sheet */}
      {mobileDetail && typeof window !== "undefined" && createPortal(
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileDetail(null)}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] flex flex-col rounded-t-2xl bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700 shrink-0">
              <span className="text-base font-bold text-slate-800 dark:text-slate-100">{mobileDetail.이름}</span>
              <button
                type="button"
                onClick={() => setMobileDetail(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg leading-none px-1"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto p-4 flex flex-col gap-4">
              <div className="flex justify-center">
                <div className="w-48">
                  <CardImage id={mobileDetail.ID} name={mobileDetail.이름} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center gap-1 bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2">
                  <span className="text-xs text-slate-400">{t.card.type}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${typeColor(mobileDetail.타입).bg} ${typeColor(mobileDetail.타입).text} ${typeColor(mobileDetail.타입).border}`}>{mobileDetail.타입}</span>
                </div>
                <div className="flex flex-col items-center gap-1 bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2">
                  <span className="text-xs text-slate-400">{t.card.evolutionLabel}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${EVOLUTION_COLORS[mobileDetail.진화] ?? "bg-gray-100 text-gray-600"}`}>{mobileDetail.진화}</span>
                </div>
                <div className="flex flex-col items-center gap-1 bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2">
                  <span className="text-xs text-slate-400">HP</span>
                  <span className={`text-sm font-bold ${valueColor(mobileDetail.HP)}`}>{mobileDetail.HP === 0 ? "—" : mobileDetail.HP}</span>
                </div>
              </div>
              {mobileDetail.특성 && (
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 flex flex-col gap-1">
                  <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">{t.card.ability}: {mobileDetail.특성}</span>
                  {mobileDetail.특성효과 && mobileDetail.특성효과 !== "-" && (
                    <p className="text-xs text-slate-600 dark:text-slate-300">{mobileDetail.특성효과}</p>
                  )}
                </div>
              )}
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <EnergyPips energy={mobileDetail.필요에너지} />
                  <span className="flex-1 text-sm font-semibold text-slate-700 dark:text-slate-200">{mobileDetail.기술명 && mobileDetail.기술명 !== "-" ? mobileDetail.기술명 : <span className="text-slate-300 dark:text-slate-600 font-normal">—</span>}</span>
                  <span className={`text-sm font-bold shrink-0 ${valueColor(mobileDetail.피해량)}`}>
                    {mobileDetail.피해량 && mobileDetail.피해량 !== "0" && mobileDetail.피해량 !== "-" ? mobileDetail.피해량 : "—"}
                  </span>
                </div>
                {mobileDetail.기술추가효과 && mobileDetail.기술추가효과 !== "-" && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">{mobileDetail.기술추가효과}</p>
                )}
              </div>
              {mobileDetail.기술명2 && (
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <EnergyPips energy={mobileDetail.필요에너지2 ?? ""} />
                    <span className="flex-1 text-sm font-semibold text-slate-700 dark:text-slate-200">{mobileDetail.기술명2}</span>
                    <span className={`text-sm font-bold shrink-0 ${valueColor(mobileDetail.피해량2 ?? "0")}`}>
                      {mobileDetail.피해량2 && mobileDetail.피해량2 !== "0" && mobileDetail.피해량2 !== "-" ? mobileDetail.피해량2 : "—"}
                    </span>
                  </div>
                  {mobileDetail.기술추가효과2 && mobileDetail.기술추가효과2 !== "-" && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">{mobileDetail.기술추가효과2}</p>
                  )}
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2 flex flex-col gap-1">
                  <span className="text-xs text-slate-400">{t.card.retreatEnergyLabel}</span>
                  <span className="flex gap-0.5 flex-wrap">
                    {Array.from({ length: mobileDetail.후퇴에너지 }).map((_, i) => (
                      <img key={i} src="/energy/colorless.png" alt="무색" className="inline-block w-3.5 h-3.5" />
                    ))}
                    {mobileDetail.후퇴에너지 === 0 && <span className="text-slate-300 dark:text-slate-600">—</span>}
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2 flex flex-col gap-1">
                  <span className="text-xs text-slate-400">{t.card.weakness}</span>
                  {mobileDetail.약점 ? (
                    <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium w-fit ${typeColor(mobileDetail.약점).bg} ${typeColor(mobileDetail.약점).text}`}>{mobileDetail.약점}</span>
                  ) : (
                    <span className="text-slate-300 dark:text-slate-600">—</span>
                  )}
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2">
                <span className="text-xs text-slate-400">{t.card.expansion}: </span>
                <span className="text-xs text-slate-600 dark:text-slate-300">{mobileDetail.확장팩}</span>
              </div>
              {mobileDetail.키워드 && (
                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-3 flex flex-col gap-2">
                  <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{t.card.keyword}</span>
                  <div className="flex flex-wrap gap-1">
                    {mobileDetail.키워드.split(",").map((k) => k.trim()).filter(Boolean).map((kw) => (
                      <span key={kw} className="text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700/50 rounded px-2 py-0.5 border border-indigo-200 dark:border-indigo-700">{kw}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <>
          {/* 모바일: 이전/다음 + 현재/전체 */}
          <div className="flex sm:hidden items-center justify-center gap-2">
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              className="px-2 py-1 rounded text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
            >«</button>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 rounded text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
            >{t.pagination.prev}</button>
            <span className="px-3 py-1 rounded text-xs bg-indigo-600 text-white font-bold">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 rounded text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
            >{t.pagination.next}</button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              className="px-2 py-1 rounded text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
            >»</button>
          </div>
          {/* sm 이상: 번호 전체 표시 */}
          <div className="hidden sm:flex items-center justify-center gap-2">
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              className="px-2 py-1 rounded text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
            >«</button>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 rounded text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
            >{t.pagination.prev}</button>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                .reduce<(number | "...")[]>((acc, p, i, arr) => {
                  if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === "..." ? (
                    <span key={`ellipsis-${i}`} className="px-2 py-1 text-xs text-slate-400 dark:text-slate-500">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className={`px-3 py-1 rounded text-xs border transition-colors ${
                        page === p
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                      }`}
                    >{p}</button>
                  )
                )}
            </div>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 rounded text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
            >{t.pagination.next}</button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              className="px-2 py-1 rounded text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
            >»</button>
          </div>
        </>
      )}

      <p className="text-xs text-slate-400 dark:text-slate-500 text-center mt-2">
        {t.misc.disclaimer}
      </p>
    </div>
  );
}

function SortIcon({
  currentKey,
  sort,
}: {
  currentKey: keyof PokemonCard;
  sort: { key: keyof PokemonCard | null; dir: SortDir };
}) {
  if (sort.key !== currentKey) {
    return <span className="text-slate-300 dark:text-slate-600 text-[10px]">⇅</span>;
  }
  return (
    <span className="text-indigo-500 text-[10px]">
      {sort.dir === "asc" ? "↑" : "↓"}
    </span>
  );
}

function valueColor(v: string | number): string {
  const n = typeof v === "number" ? v : parseInt(String(v), 10);
  if (!n || n <= 0) return "text-slate-300 dark:text-slate-600";
  if (n < 100) return "text-green-600 dark:text-green-400";
  if (n < 200) return "text-blue-600 dark:text-blue-400";
  if (n < 300) return "text-amber-500 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

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
  const normalized = type.normalize("NFC").trim();
  return ENERGY_IMAGES[normalized] ?? ENERGY_IMAGES[type.trim()];
}

function EnergyPips({ energy }: { energy: string }) {
  if (!energy) return <span className="text-slate-300 dark:text-slate-600">—</span>;

  // "풀1/무색2" 형태를 파싱
  const segments = energy.split("/");
  const pips: { type: string; colorClass: string }[] = [];

  for (const seg of segments) {
    const match = seg.trim().match(/^(.+?)(\d+)$/);
    if (!match) continue;
    const [, typeName, countStr] = match;
    const count = parseInt(countStr, 10);
    const colorClass = ENERGY_PIP_COLORS[typeName.normalize("NFC").trim()] ?? "bg-gray-200 border-gray-400";
    for (let i = 0; i < count; i++) {
      pips.push({ type: typeName, colorClass });
    }
  }

  if (pips.length === 0) return <span className="text-slate-300 dark:text-slate-600">—</span>;

  return (
    <span className="flex gap-0.5 flex-wrap justify-center items-center">
      {pips.map((pip, i) => {
        const imgSrc = getEnergyImageSrc(pip.type);
        return imgSrc ? (
          <img key={i} src={imgSrc} alt={pip.type} title={pip.type} className="inline-block w-3.5 h-3.5 object-contain" />
        ) : (
          <span key={i} title={pip.type} className={`inline-block w-3.5 h-3.5 rounded-full border ${pip.colorClass}`} />
        );
      })}
    </span>
  );
}

function CardImage({ id, name }: { id: number; name: string }) {
  const [missing, setMissing] = useState(false);
  const { t } = useLanguage();
  return missing ? (
    <div className="w-full aspect-[3/4] flex items-center justify-center rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50">
      <span className="text-sm text-slate-400 dark:text-slate-500">{t.card.preparing}</span>
    </div>
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={getCardImageSrc(id)}
      alt={name}
      onError={() => setMissing(true)}
      className="w-full rounded-lg shadow-md object-contain"
    />
  );
}

function KeywordBadge({ keywords }: { keywords: string }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const { t } = useLanguage();
  const kwList = keywords.split(",").map((k) => k.trim()).filter(Boolean);

  const handleClick = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const tooltipHeight = Math.min(kwList.length * 28 + 24, 240);
      const above = window.innerHeight - rect.bottom < tooltipHeight;
      setPos({
        top: above ? rect.top - tooltipHeight - 4 : rect.bottom + 4,
        left: Math.min(rect.left, window.innerWidth - 224),
      });
    }
    setOpen((v) => !v);
  };

  return (
    <div className="relative inline-block">
      <button
        ref={btnRef}
        type="button"
        onClick={handleClick}
        className="px-2 py-0.5 rounded text-[11px] font-medium border border-indigo-200 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-800/40 transition-colors cursor-pointer"
      >
        {t.card.viewKeywords}
      </button>
      {open && pos && typeof window !== "undefined" && createPortal(
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            style={{ top: pos.top, left: pos.left }}
            className="fixed z-50 w-52 rounded-lg shadow-lg border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-slate-800 p-3"
          >
            <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 mb-2">{t.card.keyword}</p>
            <div className="flex flex-col gap-1">
              {kwList.map((kw) => (
                <span key={kw} className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 rounded px-2 py-0.5">
                  {kw}
                </span>
              ))}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}

function SpecialAbilityBadge({ name, effect }: { name: string; effect: string }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleClick = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const tooltipHeight = 120;
      const above = window.innerHeight - rect.bottom < tooltipHeight;
      setPos({
        top: above ? rect.top - tooltipHeight - 4 : rect.bottom + 4,
        left: Math.min(rect.left, window.innerWidth - 264),
      });
    }
    setOpen((v) => !v);
  };

  return (
    <div className="relative inline-block">
      <button
        ref={btnRef}
        type="button"
        onClick={handleClick}
        className="text-purple-700 dark:text-purple-400 font-medium underline decoration-dotted underline-offset-2 cursor-pointer hover:text-purple-500 dark:hover:text-purple-300 transition-colors"
      >
        {name}
      </button>
      {open && pos && typeof window !== "undefined" && createPortal(
        <>
          {/* backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          {/* tooltip */}
          <div
            style={{ top: pos.top, left: pos.left }}
            className="fixed z-50 w-64 rounded-lg shadow-lg border border-purple-200 dark:border-purple-700 bg-white dark:bg-slate-800 p-3"
          >
            <p className="text-xs font-semibold text-purple-700 dark:text-purple-400 mb-1">{name}</p>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {effect && effect !== "-" ? effect : "효과 없음"}
            </p>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
