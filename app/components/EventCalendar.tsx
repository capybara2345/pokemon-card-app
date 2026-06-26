"use client";

import { useEffect, useMemo, useState } from "react";
import { Lang } from "../i18n/translations";
import {
  EVENT_TYPE_COLORS,
  CalendarEvent,
  EventType,
  EventsData,
  TentativeEvent,
  formatDateKey,
  getEventsOnDate,
  getUpcomingEvents,
  getVisibleTentativeEvents,
  parseDate,
} from "../data/events";
import { normalizeEventsData } from "../lib/normalizeEventsData";

type Props = {
  lang: Lang;
  initialEvents: CalendarEvent[];
  initialTentativeEvents?: TentativeEvent[];
  labels: {
    title: string;
    upcoming: string;
    tentative: string;
    estimated: string;
    noEvents: string;
    ongoing: string;
    scheduleDisclaimer: string;
    weekdays: string[];
    months: string[];
  };
};

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isToday(date: Date) {
  return isSameDay(date, new Date());
}

function StarIcon({
  className,
  size = "sm",
}: {
  className?: string;
  size?: "sm" | "md";
}) {
  const dim = size === "md" ? "h-3 w-3" : "h-2.5 w-2.5";
  return (
    <svg
      className={`${dim} shrink-0 ${className ?? ""}`}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function ExpansionStar({ selected = false }: { selected?: boolean }) {
  return (
    <StarIcon
      size="sm"
      className={
        selected
          ? "text-amber-200"
          : "text-amber-500 dark:text-amber-400"
      }
    />
  );
}

function EventMarker({
  type,
  selected = false,
  size = "sm",
}: {
  type: EventType;
  selected?: boolean;
  size?: "sm" | "md";
}) {
  const color = selected ? "bg-white/90" : EVENT_TYPE_COLORS[type].dot;
  const box = size === "md" ? "h-2.5 w-2.5" : "h-2 w-2";

  if (type === "expansion") {
    return (
      <span className={`inline-flex shrink-0 items-center justify-center ${box}`}>
        <StarIcon
          size={size}
          className={
            selected
              ? "text-amber-200"
              : "text-amber-500 dark:text-amber-400"
          }
        />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center ${box}`}
      aria-hidden
    >
      <span
        className={`rounded-full ${size === "md" ? "h-2 w-2" : "h-1.5 w-1.5"} ${color}`}
      />
    </span>
  );
}

function hasRankedOnDate(date: Date, events: CalendarEvent[]) {
  return getEventsOnDate(date, events).some((e) => e.type === "ranked");
}

function getDayButtonClass(
  selected: boolean,
  todayMark: boolean,
  rankedSeason: boolean
) {
  if (selected) {
    return "bg-indigo-600 text-white shadow-sm";
  }
  if (rankedSeason && todayMark) {
    return "bg-rose-100 font-semibold text-rose-800 ring-1 ring-indigo-300 dark:bg-rose-900/40 dark:text-rose-200 dark:ring-indigo-600";
  }
  if (rankedSeason) {
    return "bg-rose-50 text-rose-800 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-200 dark:hover:bg-rose-900/45";
  }
  if (todayMark) {
    return "bg-indigo-50 font-semibold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300";
  }
  return "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/50";
}

const DAY_MARKER_LIMIT = 6;

function pickDayMarkers(events: CalendarEvent[]) {
  if (events.length <= DAY_MARKER_LIMIT) {
    return { visible: events, overflow: 0 };
  }

  const priority: Record<EventType, number> = {
    drop: 0,
    emblem: 1,
    wonder: 2,
    community: 3,
    mission: 4,
    ranked: 9,
    expansion: 9,
  };

  const sorted = [...events].sort(
    (a, b) => (priority[a.type] ?? 9) - (priority[b.type] ?? 9)
  );

  return {
    visible: sorted.slice(0, DAY_MARKER_LIMIT),
    overflow: events.length - DAY_MARKER_LIMIT,
  };
}

function formatEventRange(event: CalendarEvent, lang: Lang) {
  const start = parseDate(event.startDate);
  const end = parseDate(event.endDate);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const locale = lang === "ko" ? "ko-KR" : "en-US";
  const startStr = start.toLocaleDateString(locale, opts);
  const endStr = end.toLocaleDateString(locale, opts);
  if (event.startDate === event.endDate) return startStr;
  return `${startStr} – ${endStr}`;
}

function formatEstimatedRange(event: TentativeEvent, lang: Lang) {
  const start = parseDate(event.estimatedStart);
  const end = parseDate(event.estimatedEnd);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const locale = lang === "ko" ? "ko-KR" : "en-US";
  const startStr = start.toLocaleDateString(locale, opts);
  const endStr = end.toLocaleDateString(locale, opts);
  const range =
    event.estimatedStart === event.estimatedEnd
      ? startStr
      : `${startStr} – ${endStr}`;
  return range;
}

export default function EventCalendar({
  lang,
  initialEvents,
  initialTentativeEvents = [],
  labels,
}: Props) {
  const today = new Date();
  const [events, setEvents] = useState(initialEvents);
  const [tentativeEvents, setTentativeEvents] = useState(initialTentativeEvents);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date>(today);

  useEffect(() => {
    let cancelled = false;

    async function refreshEvents() {
      try {
        const res = await fetch("/data/events.json", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as EventsData;
        if (!cancelled) {
          const normalized = normalizeEventsData(data);
          setEvents(normalized.events);
          setTentativeEvents(normalized.tentativeEvents ?? []);
        }
      } catch {
        // 서버에서 전달한 initialEvents 유지
      }
    }

    void refreshEvents();
    return () => {
      cancelled = true;
    };
  }, []);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();

  const calendarCells = useMemo(() => {
    const cells: (Date | null)[] = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(viewYear, viewMonth, d));
    }
    return cells;
  }, [viewYear, viewMonth, daysInMonth, firstWeekday]);

  const selectedEvents = useMemo(
    () => getEventsOnDate(selectedDate, events),
    [selectedDate, events]
  );

  const upcomingEvents = useMemo(
    () => getUpcomingEvents(today, events),
    [events, today]
  );

  const visibleTentativeEvents = useMemo(
    () => getVisibleTentativeEvents(today, events, tentativeEvents),
    [events, tentativeEvents, today]
  );

  const todayKey = formatDateKey(today);

  function prevMonth() {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  function goToday() {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelectedDate(today);
  }

  return (
    <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-5">
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 lg:p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
            {labels.months[viewMonth]} {viewYear}
          </h3>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={goToday}
              className="px-2.5 py-1 text-xs font-medium rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
            >
              {lang === "ko" ? "오늘" : "Today"}
            </button>
            <button
              type="button"
              onClick={prevMonth}
              aria-label={lang === "ko" ? "이전 달" : "Previous month"}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={nextMonth}
              aria-label={lang === "ko" ? "다음 달" : "Next month"}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>

        <div className="mb-1 grid grid-cols-7 gap-0.5 lg:gap-1">
          {labels.weekdays.map((day) => (
            <div
              key={day}
              className="py-0.5 text-center text-[10px] font-medium text-slate-400 dark:text-slate-500 lg:text-[11px]"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-0.5 lg:gap-1">
          {calendarCells.map((date, i) => {
            if (!date) {
              return (
                <div
                  key={`empty-${i}`}
                  className="aspect-square lg:aspect-auto lg:h-14"
                />
              );
            }

            const dayEvents = getEventsOnDate(date, events);
            const hasExpansion = dayEvents.some((e) => e.type === "expansion");
            const rankedSeason = hasRankedOnDate(date, events);
            const markerSource = dayEvents.filter(
              (e) => e.type !== "expansion" && e.type !== "ranked"
            );
            const { visible: markerEvents, overflow } = pickDayMarkers(markerSource);
            const selected = isSameDay(date, selectedDate);
            const todayMark = isToday(date);

            return (
              <button
                key={formatDateKey(date)}
                type="button"
                onClick={() => setSelectedDate(date)}
                className={`aspect-square lg:aspect-auto lg:h-14 rounded-lg flex flex-col items-center justify-center gap-0.5 text-xs lg:text-sm transition-all relative ${getDayButtonClass(
                  selected,
                  todayMark,
                  rankedSeason
                )}`}
              >
                {hasExpansion && (
                  <span className="pointer-events-none absolute right-0.5 top-0.5 lg:right-1 lg:top-1">
                    <ExpansionStar selected={selected} />
                  </span>
                )}
                <span>{date.getDate()}</span>
                {(markerEvents.length > 0 || overflow > 0) && (
                  <span className="flex max-w-full flex-wrap items-center justify-center gap-0.5 px-0.5">
                    {markerEvents.map((e) => (
                      <EventMarker key={e.id} type={e.type} selected={selected} />
                    ))}
                    {overflow > 0 && (
                      <span
                        className={`text-[9px] font-semibold leading-none ${
                          selected
                            ? "text-white/85"
                            : "text-slate-400 dark:text-slate-500"
                        }`}
                      >
                        +{overflow}
                      </span>
                    )}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400 dark:text-slate-500">
          <span className="inline-flex items-center gap-1">
            <EventMarker type="mission" />
            {lang === "ko" ? "이벤트" : "Event"}
          </span>
          <span className="inline-flex items-center gap-1">
            <StarIcon className="text-amber-500 dark:text-amber-400" />
            {lang === "ko" ? "확장팩" : "Expansion"}
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-4 rounded-sm border border-rose-200 bg-rose-100 dark:border-rose-800 dark:bg-rose-900/40" />
            {lang === "ko" ? "랭크 시즌" : "Ranked season"}
          </span>
        </div>

        {selectedEvents.length > 0 && (
          <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-700">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
              {selectedDate.toLocaleDateString(lang === "ko" ? "ko-KR" : "en-US", {
                month: "long",
                day: "numeric",
                weekday: "short",
              })}
            </p>
            <ul className="space-y-2">
              {selectedEvents.map((event) => (
                <EventItem key={event.id} event={event} lang={lang} />
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 lg:p-4">
        <h3 className="mb-3 text-base font-semibold text-slate-800 dark:text-slate-100">
          {labels.upcoming}
        </h3>
        {upcomingEvents.length === 0 && visibleTentativeEvents.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">{labels.noEvents}</p>
        ) : (
          <ul className="space-y-2.5">
            {upcomingEvents.map((event) => {
              const ongoing =
                event.startDate <= todayKey && event.endDate >= todayKey;
              return (
                <li key={event.id}>
                  <button
                    type="button"
                    onClick={() => {
                      const d = parseDate(event.startDate);
                      setViewYear(d.getFullYear());
                      setViewMonth(d.getMonth());
                      setSelectedDate(d);
                    }}
                    className="w-full text-left group"
                  >
                    <div className="flex items-start gap-2">
                      <span className="mt-1.5 flex shrink-0 items-center justify-center">
                        {event.type === "ranked" ? (
                          <span className="h-2 w-2 rounded-sm bg-rose-500" />
                        ) : event.type === "expansion" ? (
                          <StarIcon
                            size="md"
                            className="text-amber-500 dark:text-amber-400"
                          />
                        ) : (
                          <EventMarker type={event.type} size="md" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                          {event.title[lang]}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {formatEventRange(event, lang)}
                          {ongoing && (
                            <span className="ml-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                              · {labels.ongoing}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {visibleTentativeEvents.length > 0 && (
          <div
            className={
              upcomingEvents.length > 0
                ? "mt-4 border-t border-slate-100 pt-4 dark:border-slate-700"
                : ""
            }
          >
            <h4 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {labels.tentative}
            </h4>
            <ul className="space-y-2.5">
              {visibleTentativeEvents.map((event) => (
                <li key={event.id}>
                  <button
                    type="button"
                    onClick={() => {
                      const d = parseDate(event.estimatedStart);
                      setViewYear(d.getFullYear());
                      setViewMonth(d.getMonth());
                      setSelectedDate(d);
                    }}
                    className="w-full rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-2.5 py-2 text-left transition-colors hover:border-indigo-200 hover:bg-indigo-50/50 dark:border-slate-600 dark:bg-slate-800/50 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/30"
                  >
                    <div className="flex items-start gap-2">
                      <span className="mt-1 flex shrink-0 items-center justify-center opacity-70">
                        {event.type === "expansion" ? (
                          <StarIcon
                            size="md"
                            className="text-amber-500 dark:text-amber-400"
                          />
                        ) : (
                          <EventMarker type={event.type} size="md" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                          {event.title[lang]}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {formatEstimatedRange(event, lang)}
                          <span className="ml-1.5 font-medium text-amber-600 dark:text-amber-400">
                            · {labels.estimated}
                          </span>
                        </p>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-700">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
            {labels.scheduleDisclaimer}
          </p>
        </div>
      </div>
    </div>
  );
}

function EventItem({ event, lang }: { event: CalendarEvent; lang: Lang }) {
  const colors = EVENT_TYPE_COLORS[event.type];
  return (
    <li
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${colors.bg} ${colors.text}`}
    >
      {event.type === "expansion" ? (
        <StarIcon size="md" className="text-amber-500 dark:text-amber-400" />
      ) : event.type === "ranked" ? (
        <span className="h-2 w-2 shrink-0 rounded-sm bg-rose-500" />
      ) : (
        <EventMarker type={event.type} size="md" />
      )}
      <span className="font-medium">{event.title[lang]}</span>
    </li>
  );
}
