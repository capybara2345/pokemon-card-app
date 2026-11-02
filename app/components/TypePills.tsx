import { cardTypeParts } from "../data/cards";

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  풀: { bg: "bg-green-100", text: "text-green-800", border: "border-green-300" },
  불: { bg: "bg-red-100", text: "text-red-800", border: "border-red-300" },
  물: { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-300" },
  번개: { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-300" },
  초: { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-300" },
  격투: { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-300" },
  악: { bg: "bg-gray-800", text: "text-gray-100", border: "border-gray-600" },
  강철: { bg: "bg-slate-200", text: "text-slate-700", border: "border-slate-400" },
  드래곤: { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-300" },
  무색: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-300" },
  Grass: { bg: "bg-green-100", text: "text-green-800", border: "border-green-300" },
  Fire: { bg: "bg-red-100", text: "text-red-800", border: "border-red-300" },
  Water: { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-300" },
  Lightning: { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-300" },
  Psychic: { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-300" },
  Fighting: { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-300" },
  Darkness: { bg: "bg-gray-800", text: "text-gray-100", border: "border-gray-600" },
  Metal: { bg: "bg-slate-200", text: "text-slate-700", border: "border-slate-400" },
  Dragon: { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-300" },
  Colorless: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-300" },
};

const FALLBACK = { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-300" };

export function TypePills({
  type,
  className = "",
}: {
  type: string;
  className?: string;
}) {
  const parts = cardTypeParts(type);
  const shown = parts.length > 0 ? parts : [type];

  return (
    <span className={`inline-flex flex-wrap items-center justify-center gap-0.5 ${className}`}>
      {shown.map((part) => {
        const tc = TYPE_COLORS[part] ?? FALLBACK;
        return (
          <span
            key={part}
            className={`inline-block px-1.5 py-0.5 rounded-full text-xs font-medium border ${tc.bg} ${tc.text} ${tc.border}`}
          >
            {part}
          </span>
        );
      })}
    </span>
  );
}
