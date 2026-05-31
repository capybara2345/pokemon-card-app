"use client";

import type { PokemonCard } from "../data/cards";
import type { CardNameLookup } from "../lib/cardNameLookup";

type RelatedCardNamesProps = {
  names: string[];
  lookup: CardNameLookup;
  onSelect: (card: PokemonCard) => void;
  className?: string;
};

const linkClass =
  "hover:underline decoration-dotted underline-offset-2 cursor-pointer transition-opacity hover:opacity-75";

export function RelatedCardNames({
  names,
  lookup,
  onSelect,
  className = "",
}: RelatedCardNamesProps) {
  if (names.length === 0) {
    return <span className="text-slate-300 dark:text-slate-600">—</span>;
  }

  return (
    <span className={className}>
      {names.map((ruleName, index) => {
        const card = lookup.resolve(ruleName);
        const label = lookup.displayName(ruleName);
        return (
          <span key={`${ruleName}-${index}`}>
            {index > 0 && ", "}
            {card ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(card);
                }}
                className={linkClass}
              >
                {label}
              </button>
            ) : (
              <span>{label}</span>
            )}
          </span>
        );
      })}
    </span>
  );
}
