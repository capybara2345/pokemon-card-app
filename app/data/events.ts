export type EventType =
  | "drop"
  | "emblem"
  | "community"
  | "expansion"
  | "wonder"
  | "mission"
  | "ranked";

export type CalendarEvent = {
  id: string;
  startDate: string;
  endDate: string;
  title: { ko: string; en: string };
  type: EventType;
  url?: string;
};

export type TentativeEvent = {
  id: string;
  estimatedStart: string;
  estimatedEnd: string;
  title: { ko: string; en: string };
  type: EventType;
  hideWhenConfirmedId?: string;
  url?: string;
  source?: "pokemon-zone" | "manual" | "cache";
};

export type TentativeMeta = {
  source: string;
  updatedAt: string;
  pzStatus: "ok" | "failed" | "empty" | "skipped";
  pzRawCount: number;
  autoCount: number;
  manualCount: number;
  cacheCount: number;
  mergedCount: number;
  visibleCount: number;
  usedCache: boolean;
  sources?: Record<string, number>;
};

export type EventsData = {
  source: string;
  sourceUrl: string;
  disclaimer: string;
  updatedAt: string;
  events: CalendarEvent[];
  tentativeEvents?: TentativeEvent[];
  tentativeMeta?: TentativeMeta;
};

export const EVENT_TYPE_COLORS: Record<
  EventType,
  { dot: string; bg: string; text: string }
> = {
  drop: {
    dot: "bg-amber-500",
    bg: "bg-amber-50 dark:bg-amber-900/20",
    text: "text-amber-700 dark:text-amber-300",
  },
  emblem: {
    dot: "bg-purple-500",
    bg: "bg-purple-50 dark:bg-purple-900/20",
    text: "text-purple-700 dark:text-purple-300",
  },
  community: {
    dot: "bg-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    text: "text-emerald-700 dark:text-emerald-300",
  },
  expansion: {
    dot: "bg-indigo-500",
    bg: "bg-indigo-50 dark:bg-indigo-900/20",
    text: "text-indigo-700 dark:text-indigo-300",
  },
  wonder: {
    dot: "bg-pink-500",
    bg: "bg-pink-50 dark:bg-pink-900/20",
    text: "text-pink-700 dark:text-pink-300",
  },
  mission: {
    dot: "bg-sky-500",
    bg: "bg-sky-50 dark:bg-sky-900/20",
    text: "text-sky-700 dark:text-sky-300",
  },
  ranked: {
    dot: "bg-rose-500",
    bg: "bg-rose-50 dark:bg-rose-900/20",
    text: "text-rose-700 dark:text-rose-300",
  },
};

export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getEventsOnDate(date: Date, events: CalendarEvent[]): CalendarEvent[] {
  const key = formatDateKey(date);
  return events.filter((e) => key >= e.startDate && key <= e.endDate);
}

export function getUpcomingEvents(
  from: Date,
  events: CalendarEvent[],
  limit = 5
): CalendarEvent[] {
  const today = formatDateKey(from);
  return events
    .filter((e) => e.endDate >= today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .slice(0, limit);
}

const TITLE_MATCH_STOP_WORDS = new Set([
  "the",
  "and",
  "part",
  "all",
  "rewards",
  "guide",
  "decklists",
  "promo",
  "cards",
  "missions",
]);

function normalizeTitleForMatch(title: string): string {
  return title
    .toLowerCase()
    .replace(/[–—-].*$/u, "")
    .replace(/\bwonder\s*pick\b/g, " ")
    .replace(/\bdrop\s*event\b/g, " ")
    .replace(/\b(emblem|expansion)\s*event\b/g, "$1")
    .replace(/\b(event|expansion|missions)\b/g, " ")
    .replace(/[&·]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getSignificantTokens(title: string): string[] {
  return [
    ...new Set(
      normalizeTitleForMatch(title)
        .split(/\s+/)
        .filter((word) => word.length > 2 && !TITLE_MATCH_STOP_WORDS.has(word))
    ),
  ];
}

function titlesLikelyMatch(
  tentativeTitle: { en: string; ko: string },
  confirmedTitle: { en: string; ko: string }
): boolean {
  const tentativeTokens = getSignificantTokens(tentativeTitle.en);
  if (tentativeTokens.length === 0) return false;

  const confirmedText = `${confirmedTitle.en} ${confirmedTitle.ko}`.toLowerCase();
  const matched = tentativeTokens.filter((token) => confirmedText.includes(token));

  const threshold =
    tentativeTokens.length <= 2 ? tentativeTokens.length : Math.ceil(tentativeTokens.length * 0.6);

  return matched.length >= threshold;
}

function tentativeDateMatchesConfirmed(
  tentative: TentativeEvent,
  confirmed: CalendarEvent,
  slackDays = 21
): boolean {
  const overlaps =
    confirmed.startDate <= tentative.estimatedEnd &&
    confirmed.endDate >= tentative.estimatedStart;

  if (overlaps) return true;

  const estimatedStart = parseDate(tentative.estimatedStart).getTime();
  const estimatedEnd = parseDate(tentative.estimatedEnd).getTime();
  const confirmedStart = parseDate(confirmed.startDate).getTime();
  const slackMs = slackDays * 86_400_000;

  return (
    confirmedStart >= estimatedStart - slackMs && confirmedStart <= estimatedEnd + slackMs
  );
}

export function tentativeMatchesConfirmed(
  tentative: TentativeEvent,
  confirmed: CalendarEvent
): boolean {
  if (tentative.hideWhenConfirmedId && confirmed.id === tentative.hideWhenConfirmedId) {
    return true;
  }

  if (tentative.type !== confirmed.type) return false;
  if (!tentativeDateMatchesConfirmed(tentative, confirmed)) return false;

  return titlesLikelyMatch(tentative.title, confirmed.title);
}

export function hasMatchingConfirmedEvent(
  tentative: TentativeEvent,
  events: CalendarEvent[]
): boolean {
  return events.some((event) => tentativeMatchesConfirmed(tentative, event));
}

export function getVisibleTentativeEvents(
  from: Date,
  events: CalendarEvent[],
  tentativeEvents: TentativeEvent[] = []
): TentativeEvent[] {
  const today = formatDateKey(from);

  return tentativeEvents
    .filter((e) => e.estimatedEnd >= today)
    .filter((e) => !hasMatchingConfirmedEvent(e, events))
    .sort((a, b) => a.estimatedStart.localeCompare(b.estimatedStart));
}
