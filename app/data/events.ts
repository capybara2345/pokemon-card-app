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

export type EventsData = {
  source: string;
  sourceUrl: string;
  disclaimer: string;
  updatedAt: string;
  events: CalendarEvent[];
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
