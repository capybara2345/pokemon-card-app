"use client";

import { useState, useMemo } from "react";
import { pokemonCards, type PokemonCard } from "../data/cards";

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  풀: { bg: "bg-green-100", text: "text-green-800", border: "border-green-300" },
  불꽃: { bg: "bg-red-100", text: "text-red-800", border: "border-red-300" },
  물: { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-300" },
  번개: { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-300" },
  초능력: { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-300" },
  악: { bg: "bg-gray-800", text: "text-gray-100", border: "border-gray-600" },
  격투: { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-300" },
  땅: { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-300" },
  무색: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-300" },
};

const EVOLUTION_COLORS: Record<string, string> = {
  기본: "bg-slate-100 text-slate-700",
  "1진화": "bg-indigo-100 text-indigo-700",
  "2진화": "bg-violet-100 text-violet-700",
};

const RANK_COLORS: Record<string, string> = {
  S: "bg-amber-400 text-white font-bold",
  A: "bg-emerald-500 text-white font-bold",
  B: "bg-blue-500 text-white font-bold",
  C: "bg-gray-400 text-white font-bold",
  "-": "bg-transparent text-gray-400",
};

const COLUMNS: { key: keyof PokemonCard; label: string; width: string }[] = [
  { key: "추천순위", label: "추천", width: "w-14" },
  { key: "타입", label: "타입", width: "w-20" },
  { key: "이름", label: "이름", width: "w-24" },
  { key: "진화", label: "진화", width: "w-20" },
  { key: "HP", label: "HP", width: "w-16" },
  { key: "기술명", label: "기술명", width: "w-28" },
  { key: "기술추가효과", label: "추가효과", width: "w-44" },
  { key: "필요에너지", label: "에너지", width: "w-16" },
  { key: "피해량", label: "피해", width: "w-16" },
  { key: "최대피해량", label: "최대피해", width: "w-20" },
  { key: "후퇴에너지", label: "후퇴", width: "w-14" },
  { key: "특성효과", label: "특성효과", width: "w-52" },
  { key: "약점", label: "약점", width: "w-16" },
  { key: "관련서포터", label: "관련서포터", width: "w-36" },
  { key: "키워드", label: "키워드", width: "w-24" },
  { key: "확장팩", label: "확장팩", width: "w-32" },
];

const FILTER_OPTIONS = {
  타입: [...new Set(pokemonCards.map((c) => c.타입))],
  진화: ["기본", "1진화", "2진화"],
  추천순위: [...new Set(pokemonCards.map((c) => c.추천순위))].filter(Boolean),
};

type SortDir = "asc" | "desc" | null;

export default function CardGrid() {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<{
    타입: string[];
    진화: string[];
    추천순위: string[];
  }>({ 타입: [], 진화: [], 추천순위: [] });
  const [sort, setSort] = useState<{ key: keyof PokemonCard | null; dir: SortDir }>({
    key: null,
    dir: null,
  });

  const toggleFilter = (
    group: keyof typeof filters,
    value: string
  ) => {
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

  const filtered = useMemo(() => {
    let result = pokemonCards;

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
    if (filters.추천순위.length)
      result = result.filter((c) => filters.추천순위.includes(c.추천순위));

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
  }, [search, filters, sort]);

  const typeColor = (type: string) =>
    TYPE_COLORS[type] ?? { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-300" };

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6 min-h-screen bg-slate-50">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">
          포켓몬 카드 포켓 덱
        </h1>
        <p className="text-sm text-slate-500">
          총 <span className="font-semibold text-slate-700">{filtered.length}</span>장 / {pokemonCards.length}장
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
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 placeholder:text-slate-400"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
          >
            ✕
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        {(
          [
            { group: "타입", label: "타입", options: FILTER_OPTIONS.타입 },
            { group: "진화", label: "진화단계", options: FILTER_OPTIONS.진화 },
            { group: "추천순위", label: "추천순위", options: FILTER_OPTIONS.추천순위 },
          ] as const
        ).map(({ group, label, options }) => (
          <div key={group} className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {label}
            </span>
            <div className="flex gap-1 flex-wrap">
              {options.map((opt) => {
                const active = filters[group].includes(opt);
                const colorCls =
                  group === "타입"
                    ? active
                      ? `${typeColor(opt).bg} ${typeColor(opt).text} ${typeColor(opt).border} border`
                      : "bg-white border border-slate-200 text-slate-600 hover:border-slate-400"
                    : group === "추천순위"
                    ? active
                      ? RANK_COLORS[opt]
                      : "bg-white border border-slate-200 text-slate-600 hover:border-slate-400"
                    : active
                    ? "bg-indigo-100 text-indigo-700 border border-indigo-300"
                    : "bg-white border border-slate-200 text-slate-600 hover:border-slate-400";
                return (
                  <button
                    key={opt}
                    onClick={() => toggleFilter(group, opt)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${colorCls}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {(filters.타입.length || filters.진화.length || filters.추천순위.length) ? (
          <button
            onClick={() => setFilters({ 타입: [], 진화: [], 추천순위: [] })}
            className="px-2.5 py-1 rounded-full text-xs font-medium text-red-500 border border-red-200 hover:bg-red-50 transition-colors"
          >
            초기화
          </button>
        ) : null}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm bg-white">
        <table className="text-sm w-full border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-600 text-xs uppercase tracking-wide">
              {COLUMNS.map(({ key, label, width }) => (
                <th
                  key={key}
                  onClick={() => handleSort(key)}
                  className={`${width} px-3 py-3 text-left font-semibold whitespace-nowrap cursor-pointer select-none hover:bg-slate-200 transition-colors`}
                >
                  <span className="flex items-center gap-1">
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
                  className="text-center py-12 text-slate-400 text-sm"
                >
                  검색 결과가 없습니다.
                </td>
              </tr>
            )}
            {filtered.map((card, idx) => {
              const tc = typeColor(card.타입);
              return (
                <tr
                  key={`${card.이름}-${idx}`}
                  className="border-t border-slate-100 hover:bg-indigo-50/40 transition-colors"
                >
                  {/* 추천순위 */}
                  <td className="px-3 py-2.5 text-center">
                    <span
                      className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs ${RANK_COLORS[card.추천순위] ?? "bg-transparent text-gray-400"}`}
                    >
                      {card.추천순위}
                    </span>
                  </td>

                  {/* 타입 */}
                  <td className="px-3 py-2.5">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${tc.bg} ${tc.text} ${tc.border}`}
                    >
                      {card.타입}
                    </span>
                  </td>

                  {/* 이름 */}
                  <td className="px-3 py-2.5 font-semibold text-slate-800 whitespace-nowrap">
                    {card.이름}
                  </td>

                  {/* 진화 */}
                  <td className="px-3 py-2.5">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${EVOLUTION_COLORS[card.진화] ?? "bg-gray-100 text-gray-600"}`}
                    >
                      {card.진화}
                    </span>
                  </td>

                  {/* HP */}
                  <td className="px-3 py-2.5 text-center font-bold text-red-600">
                    {card.HP}
                  </td>

                  {/* 기술명 */}
                  <td className="px-3 py-2.5 whitespace-nowrap text-slate-700">
                    {card.기술명}
                  </td>

                  {/* 기술추가효과 */}
                  <td className="px-3 py-2.5 text-slate-500 text-xs max-w-[160px]">
                    {card.기술추가효과 === "-" ? (
                      <span className="text-slate-300">—</span>
                    ) : (
                      card.기술추가효과
                    )}
                  </td>

                  {/* 필요에너지 */}
                  <td className="px-3 py-2.5 text-center">
                    <EnergyDots count={card.필요에너지} typeColor={tc} />
                  </td>

                  {/* 피해량 */}
                  <td className="px-3 py-2.5 text-center font-semibold text-slate-700">
                    {card.피해량 > 0 ? card.피해량 : "—"}
                  </td>

                  {/* 최대피해량 */}
                  <td className="px-3 py-2.5 text-center font-semibold text-slate-700">
                    {card.최대피해량 > 0 ? card.최대피해량 : "—"}
                  </td>

                  {/* 후퇴에너지 */}
                  <td className="px-3 py-2.5 text-center text-slate-500 text-xs">
                    {Array.from({ length: card.후퇴에너지 }).map((_, i) => (
                      <span key={i}>●</span>
                    ))}
                    {card.후퇴에너지 === 0 && <span className="text-slate-300">—</span>}
                  </td>

                  {/* 특성효과 */}
                  <td className="px-3 py-2.5 text-xs text-slate-500 max-w-[200px]">
                    {card.특성효과 === "-" ? (
                      <span className="text-slate-300">—</span>
                    ) : (
                      <span className="text-purple-700 font-medium">{card.특성효과}</span>
                    )}
                  </td>

                  {/* 약점 */}
                  <td className="px-3 py-2.5">
                    {card.약점 && (
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${typeColor(card.약점).bg} ${typeColor(card.약점).text}`}
                      >
                        {card.약점}
                      </span>
                    )}
                  </td>

                  {/* 관련서포터 */}
                  <td className="px-3 py-2.5 text-xs text-slate-500 whitespace-nowrap">
                    {card.관련서포터 || <span className="text-slate-300">—</span>}
                  </td>

                  {/* 키워드 */}
                  <td className="px-3 py-2.5">
                    {card.키워드 ? (
                      <div className="flex flex-wrap gap-1">
                        {card.키워드.split(",").map((kw) => (
                          <span
                            key={kw}
                            className="inline-block px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 text-xs border border-indigo-100"
                          >
                            {kw.trim()}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-300 text-xs">—</span>
                    )}
                  </td>

                  {/* 확장팩 */}
                  <td className="px-3 py-2.5 text-xs text-slate-500 whitespace-nowrap">
                    {card.확장팩}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-400 text-center mt-2">
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
    return <span className="text-slate-300 text-[10px]">⇅</span>;
  }
  return (
    <span className="text-indigo-500 text-[10px]">
      {sort.dir === "asc" ? "↑" : "↓"}
    </span>
  );
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
          className={`inline-block w-3 h-3 rounded-full border ${typeColor.bg} ${typeColor.border}`}
        />
      ))}
    </span>
  );
}
