import type { CardTypeFlags } from "../lib/cardTypeFlags";

type CardNameBadgesProps = {
  flags: CardTypeFlags;
  megaExLabel?: string;
  ancientLabel: string;
  futureLabel: string;
  ultraBeastShort?: string;
  babyShort?: string;
  className?: string;
};

const badgeBase =
  "inline-block px-1 py-0.5 rounded text-[10px] font-bold text-white leading-none shrink-0";

export function CardNameBadges({
  flags,
  megaExLabel = "메가ex",
  ancientLabel,
  futureLabel,
  ultraBeastShort = "UB",
  babyShort = "baby",
  className = "",
}: CardNameBadgesProps) {
  return (
    <span className={`inline-flex items-center gap-1 flex-wrap ${className}`}>
      {flags.megaEx && (
        <span className={`${badgeBase} bg-rose-500 ring-1 ring-rose-600`}>{megaExLabel}</span>
      )}
      {!flags.megaEx && flags.ex && (
        <span className={`${badgeBase} bg-amber-500 ring-1 ring-amber-600`}>ex</span>
      )}
      {flags.ultraBeast && (
        <span className={`${badgeBase} bg-teal-500 ring-1 ring-teal-600`}>{ultraBeastShort}</span>
      )}
      {flags.baby && (
        <span className={`${badgeBase} bg-sky-400 ring-1 ring-sky-500`}>{babyShort}</span>
      )}
      {flags.ancient && (
        <span className={`${badgeBase} bg-lime-500 ring-1 ring-lime-600`}>{ancientLabel}</span>
      )}
      {flags.future && (
        <span className={`${badgeBase} bg-cyan-500 ring-1 ring-cyan-600`}>{futureLabel}</span>
      )}
    </span>
  );
}
