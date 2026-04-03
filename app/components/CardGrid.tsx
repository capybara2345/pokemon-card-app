"use client";

import { useState, useMemo, useEffect } from "react";
import { type PokemonCard } from "../data/cards";

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

const EVOLUTION_COLORS: Record<string, string> = {
  기본: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
  "1진화": "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300",
  "2진화": "bg-violet-100 text-violet-700 dark:bg-violet-900/60 dark:text-violet-300",
};

const RANK_COLORS: Record<string, string> = {
  S: "bg-amber-400 text-white font-bold",
  A: "bg-emerald-500 text-white font-bold",
  B: "bg-blue-500 text-white font-bold",
  C: "bg-gray-400 text-white font-bold",
  "-": "bg-transparent text-gray-400",
};

const COLUMNS: { key: keyof PokemonCard; label: string; width: string }[] = [
  { key: "타입", label: "타입", width: "w-20" },
  { key: "이름", label: "이름", width: "w-24" },
  { key: "진화", label: "진화", width: "w-20" },
  { key: "HP", label: "HP", width: "w-16" },
  { key: "기술명", label: "기술명", width: "w-28" },
  { key: "기술추가효과", label: "효과", width: "w-44" },
  { key: "필요에너지", label: "필요에너지", width: "w-16" },
  { key: "피해량", label: "피해", width: "w-16" },
  { key: "최대피해량", label: "최대피해", width: "w-20" },
  { key: "후퇴에너지", label: "후퇴에너지", width: "w-14" },
  { key: "특성효과", label: "특성효과", width: "w-52" },
  { key: "약점", label: "약점", width: "w-16" },
  { key: "관련서포터", label: "관련서포터", width: "w-36" },
  { key: "키워드", label: "키워드", width: "w-24" },
  { key: "확장팩", label: "확장팩", width: "w-32" },
];

const EVOLUTION_ORDER = ["기본", "1진화", "2진화"];
const PAGE_SIZE = 50;

type SortDir = "asc" | "desc" | null;

export default function CardGrid({ cards }: { cards: PokemonCard[] }) {
  const [search, setSearch] = useState("");
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
  const [filterEx, setFilterEx] = useState(false);
  const [filterSpecial, setFilterSpecial] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = saved === "dark" || (!saved && prefersDark);
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

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

  const filterOptions = useMemo(() => ({
    타입: [...new Set(cards.map((c) => c.타입))],
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
  }), [cards]);

  const filtered = useMemo(() => {
    let result = cards;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((card) =>
        Object.values(card).some((v) =>
          String(v).toLowerCase().includes(q)
        )
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
    if (filterEx)
      result = result.filter((c) => c.이름.toLowerCase().includes("ex"));
    if (filterSpecial)
      result = result.filter((c) => c.특성효과 && c.특성효과 !== "-");

    if (sort.key && sort.dir) {
      const { key, dir } = sort;
      result = [...result].sort((a, b) => {
        const av = a[key];
        const bv = b[key];
        if (typeof av === "number" && typeof bv === "number") {
          return dir === "asc" ? av - bv : bv - av;
        }
        return dir === "asc"
          ? String(av).localeCompare(String(bv), "ko")
          : String(bv).localeCompare(String(av), "ko");
      });
    }

    return result;
  }, [cards, search, filters, sort, filterEx, filterSpecial]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const typeColor = (type: string) =>
    TYPE_COLORS[type] ?? { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-300" };

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6 min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
            포켓몬 포켓 카드 리스트 정보
          </h1>
          <button
            onClick={toggleDark}
            className="px-3 py-1.5 rounded-lg text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            {dark ? "☀️ 라이트" : "🌙 다크"}
          </button>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          총 <span className="font-semibold text-slate-700 dark:text-slate-200">{filtered.length}</span>장 / {cards.length}장
          {totalPages > 1 && (
            <span className="ml-2 text-slate-400 dark:text-slate-500">(페이지 {page} / {totalPages})</span>
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
          placeholder="이름, 기술명, 키워드 등으로 검색..."
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
          {(
            [
              { group: "타입", label: "타입", options: filterOptions.타입 },
              { group: "진화", label: "진화단계", options: filterOptions.진화 },
              { group: "후퇴에너지", label: "후퇴에너지", options: filterOptions.후퇴에너지 },
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
                      {group === "후퇴에너지" ? `${opt}개` : opt}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* ex / 특성 토글 */}
          <div className="flex gap-1">
            <button
              onClick={() => { setFilterEx((v) => !v); resetPage(); }}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                filterEx
                  ? "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-400"
              }`}
            >
              ex
            </button>
            <button
              onClick={() => { setFilterSpecial((v) => !v); resetPage(); }}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                filterSpecial
                  ? "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-400"
              }`}
            >
              특성있음
            </button>
          </div>

          {/* 상세필터 토글 버튼 */}
          <button
            onClick={() => setShowAdvanced((v) => !v)}
            className={`ml-auto flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              showAdvanced
                ? "bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700"
                : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-400"
            }`}
          >
            상세 필터
            <span className="text-[10px]">{showAdvanced ? "▲" : "▼"}</span>
          </button>
        </div>

        {/* 상세 필터 패널 */}
        {showAdvanced && (
          <div className="flex flex-col gap-3 p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            {(
              [
                { group: "확장팩", label: "확장팩", options: filterOptions.확장팩 },
                { group: "키워드", label: "키워드", options: filterOptions.키워드 },
              ] as { group: "키워드" | "확장팩"; label: string; options: string[] }[]
            ).map(({ group, label, options }) => (
              <div key={group} className="flex items-start gap-3">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide pt-1 min-w-[48px]">
                  {label}
                </span>
                <div className="flex gap-1 flex-wrap">
                  {options.map((opt) => {
                    const active = filters[group].includes(opt);
                    return (
                      <button
                        key={opt}
                        onClick={() => toggleFilter(group, opt)}
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
            ))}
          </div>
        )}

        {/* 초기화 버튼 */}
        {(filters.타입.length || filters.진화.length || filters.키워드.length || filters.확장팩.length || filters.후퇴에너지.length || filterEx || filterSpecial) ? (
          <div>
            <button
              onClick={() => { setFilters({ 타입: [], 진화: [], 키워드: [], 확장팩: [], 후퇴에너지: [] }); setFilterEx(false); setFilterSpecial(false); resetPage(); }}
              className="px-2.5 py-1 rounded-full text-xs font-medium text-red-500 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
            >
              초기화
            </button>
          </div>
        ) : null}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-800">
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
                  검색 결과가 없습니다.
                </td>
              </tr>
            )}
            {paginated.map((card, idx) => {
              const tc = typeColor(card.타입);
              const py = card.기술명2 ? "py-4" : "py-2.5";
              const vAlignSkill = card.기술명2 ? "align-top" : "align-middle";
              const skillGap = card.기술명2 ? "gap-3" : "gap-1";
              const skillDivider = card.기술명2 ? "border-t border-slate-100 dark:border-slate-700 pt-3" : "";
              const skillDividerEnergy = card.기술명2 ? "border-t border-slate-100 dark:border-slate-700 pt-4" : "";
              // 2기술 행에서 각 셀의 첫 번째 기술 아이템 높이를 통일 (text-sm 기준 20px)
              const s1 = card.기술명2 ? "min-h-5 flex items-center" : "";
              const s1c = card.기술명2 ? "min-h-5 flex items-center justify-center" : "";
              const isEx = card.이름.toLowerCase().includes("ex");
              return (
                <tr
                  key={`${card.이름}-${idx}`}
                  className={`border-t border-slate-100 dark:border-slate-700 transition-colors ${
                    isEx
                      ? "bg-amber-50/60 dark:bg-amber-900/10 hover:bg-amber-100/60 dark:hover:bg-amber-900/20"
                      : "hover:bg-indigo-50/40 dark:hover:bg-indigo-900/20"
                  }`}
                >
                  {/* 타입 */}
                  <td className={`px-3 ${py} text-center align-middle`}>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${tc.bg} ${tc.text} ${tc.border}`}
                    >
                      {card.타입}
                    </span>
                  </td>

                  {/* 이름 */}
                  <td className={`px-3 ${py} text-center font-semibold whitespace-nowrap align-middle`}>
                    {isEx ? (
                      <span className="inline-flex items-center gap-1">
                        <span className="text-slate-800 dark:text-slate-100">{card.이름.replace(/ex$/i, "").trim()}</span>
                        <span className="inline-block px-1 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white leading-none ring-1 ring-amber-600">ex</span>
                      </span>
                    ) : (
                      <span className="text-slate-800 dark:text-slate-100">{card.이름}</span>
                    )}
                  </td>

                  {/* 진화 */}
                  <td className={`px-3 ${py} text-center align-middle`}>
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${EVOLUTION_COLORS[card.진화] ?? "bg-gray-100 text-gray-600"}`}
                    >
                      {card.진화}
                    </span>
                  </td>

                  {/* HP */}
                  <td className={`px-3 ${py} text-center font-bold align-middle`}>
                    <span className={valueColor(card.HP)}>{card.HP}</span>
                  </td>

                  {/* 기술명 */}
                  <td className={`px-3 ${py} whitespace-nowrap text-slate-700 dark:text-slate-200 ${vAlignSkill}`}>
                    <div className={`flex flex-col ${skillGap}`}>
                      <span className={s1}>{card.기술명}</span>
                      {card.기술명2 && (
                        <span className={`text-slate-700 dark:text-slate-200 ${skillDivider}`}>{card.기술명2}</span>
                      )}
                    </div>
                  </td>

                  {/* 기술추가효과 */}
                  <td className={`px-3 ${py} text-slate-500 dark:text-slate-400 max-w-[160px] ${vAlignSkill}`}>
                    <div className={`flex flex-col ${skillGap}`}>
                      <span className={s1}>{card.기술추가효과 === "-" ? <span className="text-slate-300 dark:text-slate-600">—</span> : card.기술추가효과}</span>
                      {card.기술명2 && (
                        <span className={skillDivider}>
                          {!card.기술추가효과2 || card.기술추가효과2 === "-" ? <span className="text-slate-300 dark:text-slate-600">—</span> : card.기술추가효과2}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 필요에너지 */}
                  <td className={`px-3 ${py} text-center ${vAlignSkill}`}>
                    <div className={`flex flex-col items-center ${skillGap}`}>
                      <div className={s1c}>
                        <EnergyDots count={card.필요에너지} typeColor={tc} />
                      </div>
                      {card.기술명2 && (
                        <div className={`${skillDividerEnergy} w-full flex justify-center`}>
                          <EnergyDots count={card.필요에너지2 ?? 0} typeColor={tc} />
                        </div>
                      )}
                    </div>
                  </td>

                  {/* 피해량 */}
                  <td className={`px-3 ${py} text-center font-semibold ${vAlignSkill}`}>
                    <div className={`flex flex-col ${skillGap}`}>
                      <span className={`${s1c} ${valueColor(card.피해량)}`}>{card.피해량 > 0 ? card.피해량 : "—"}</span>
                      {card.기술명2 && (
                        <span className={`${skillDivider} ${valueColor(card.피해량2 ?? 0)}`}>
                          {(card.피해량2 ?? 0) > 0 ? card.피해량2 : "—"}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 최대피해량 */}
                  <td className={`px-3 ${py} text-center font-semibold ${vAlignSkill}`}>
                    <div className={`flex flex-col ${skillGap}`}>
                      <span className={`${s1c} ${valueColor(card.최대피해량)}`}>{card.최대피해량 > 0 ? card.최대피해량 : "—"}</span>
                      {card.기술명2 && (
                        <span className={`${skillDivider} ${valueColor(card.최대피해량2 ?? 0)}`}>
                          {(card.최대피해량2 ?? 0) > 0 ? card.최대피해량2 : "—"}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 후퇴에너지 */}
                  <td className={`px-3 ${py} text-center align-middle`}>
                    <span className="flex gap-0.5 justify-center">
                      {Array.from({ length: card.후퇴에너지 }).map((_, i) => (
                        <span key={i} className="inline-block w-3.5 h-3.5 rounded-full border border-slate-500 bg-slate-500" />
                      ))}
                    </span>
                    {card.후퇴에너지 === 0 && <span className="text-slate-300 dark:text-slate-600">—</span>}
                  </td>

                  {/* 특성효과 */}
                  <td className={`px-3 ${py} text-xs text-slate-500 dark:text-slate-400 max-w-[200px] align-middle`}>
                    {card.특성효과 === "-" ? (
                      <span className="text-slate-300 dark:text-slate-600">—</span>
                    ) : (
                      <span className="text-purple-700 dark:text-purple-400 font-medium">{card.특성효과}</span>
                    )}
                  </td>

                  {/* 약점 */}
                  <td className={`px-3 ${py} text-center align-middle`}>
                    {card.약점 && (
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${typeColor(card.약점).bg} ${typeColor(card.약점).text}`}
                      >
                        {card.약점}
                      </span>
                    )}
                  </td>

                  {/* 관련서포터 */}
                  <td className={`px-3 ${py} text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap align-middle`}>
                    {card.관련서포터 || <span className="text-slate-300 dark:text-slate-600">—</span>}
                  </td>

                  {/* 키워드 */}
                  <td className={`px-3 ${py} align-middle`}>
                    {card.키워드 ? (
                      <div className="flex flex-wrap gap-1">
                        {card.키워드.split(",").map((kw) => (
                          <span
                            key={kw}
                            className="inline-block px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-xs border border-indigo-100 dark:border-indigo-800"
                          >
                            {kw.trim()}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>
                    )}
                  </td>

                  {/* 확장팩 */}
                  <td className={`px-3 ${py} text-center text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap align-middle`}>
                    {card.확장팩}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(1)}
            disabled={page === 1}
            className="px-2 py-1 rounded text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            «
          </button>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 rounded text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            이전
          </button>
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
                  >
                    {p}
                  </button>
                )
              )}
          </div>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 rounded text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            다음
          </button>
          <button
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages}
            className="px-2 py-1 rounded text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            »
          </button>
        </div>
      )}

      <p className="text-xs text-slate-400 dark:text-slate-500 text-center mt-2">
        * 데이터는 예시이며 실제 게임과 다를 수 있습니다.
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

function valueColor(v: number): string {
  if (v <= 0) return "text-slate-300 dark:text-slate-600";
  if (v < 100) return "text-green-600 dark:text-green-400";
  if (v < 200) return "text-blue-600 dark:text-blue-400";
  if (v < 300) return "text-amber-500 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function EnergyDots({
  count,
  typeColor,
}: {
  count: number;
  typeColor: { bg: string; text: string; border: string };
}) {
  return (
    <span className="flex gap-0.5 justify-center">
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className={`inline-block w-3.5 h-3.5 rounded-full border ${typeColor.bg} ${typeColor.border}`}
        />
      ))}
    </span>
  );
}
