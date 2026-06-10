"use client";

import { useMemo, useState } from "react";
import { Lang } from "../i18n/translations";
import {
  EVENT_TYPE_COLORS,
  CalendarEvent,
  formatDateKey,
  getEventsOnDate,
  getUpcomingEvents,
  parseDate,
} from "../data/events";

type Props = {
  lang: Lang;
  events: CalendarEvent[];
  labels: {
    title: string;
    upcoming: string;
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

export default function EventCalendar({ lang, events, labels }: Props) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date>(today);

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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base md:text-lg font-semibold text-slate-800 dark:text-slate-100">
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

        <div className="grid grid-cols-7 gap-1 mb-1">
          {labels.weekdays.map((day) => (
            <div
              key={day}
              className="text-center text-[10px] md:text-xs font-medium text-slate-400 dark:text-slate-500 py-1"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calendarCells.map((date, i) => {
            if (!date) {
              return <div key={`empty-${i}`} className="aspect-square" />;
            }

            const dayEvents = getEventsOnDate(date, events);
            const selected = isSameDay(date, selectedDate);
            const todayMark = isToday(date);

            return (
              <button
                key={formatDateKey(date)}
                type="button"
                onClick={() => setSelectedDate(date)}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 text-xs md:text-sm transition-all relative ${
                  selected
                    ? "bg-indigo-600 text-white shadow-sm"
                    : todayMark
                      ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-semibold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                }`}
              >
                <span>{date.getDate()}</span>
                {dayEvents.length > 0 && (
                  <span className="flex gap-0.5">
                    {dayEvents.slice(0, 3).map((e) => (
                      <span
                        key={e.id}
                        className={`w-1 h-1 rounded-full ${
                          selected ? "bg-white/80" : EVENT_TYPE_COLORS[e.type].dot
                        }`}
                      />
                    ))}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {selectedEvents.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
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

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 md:p-6">
        <h3 className="text-base md:text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
          {labels.upcoming}
        </h3>
        {upcomingEvents.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">{labels.noEvents}</p>
        ) : (
          <ul className="space-y-3">
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
                      <span
                        className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${EVENT_TYPE_COLORS[event.type].dot}`}
                      />
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

        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700">
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
      <span className={`w-2 h-2 rounded-full shrink-0 ${colors.dot}`} />
      <span className="font-medium">{event.title[lang]}</span>
    </li>
  );
}
