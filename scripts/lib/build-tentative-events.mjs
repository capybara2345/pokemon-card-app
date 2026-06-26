import {
  hasMatchingConfirmedEvent,
  tentativeDuplicates,
  tentativeMatchesConfirmed,
} from "./tentative-match.mjs";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function pzEventToTentative(pzEvent) {
  return {
    id: `pz-${pzEvent.id}`,
    type: pzEvent.type,
    estimatedStart: pzEvent.startDate,
    estimatedEnd: pzEvent.endDate,
    title: {
      en: pzEvent.title.en,
      ko: pzEvent.title.ko ?? pzEvent.title.en,
    },
    ...(pzEvent.url ? { url: pzEvent.url } : {}),
    source: "pokemon-zone",
  };
}

function isAlreadyConfirmed(pzEvent, confirmedEvents) {
  return confirmedEvents.some((confirmed) =>
    tentativeMatchesConfirmed(
      {
        id: `pz-${pzEvent.id}`,
        estimatedStart: pzEvent.startDate,
        estimatedEnd: pzEvent.endDate,
        title: pzEvent.title,
        type: pzEvent.type,
      },
      confirmed
    )
  );
}

function findLocalization(titleEn, localizations) {
  return localizations.find((entry) => entry.match.test(titleEn));
}

function applyLocalization(tentative, localizations) {
  const localization = findLocalization(tentative.title.en, localizations);
  if (!localization) return tentative;

  return {
    ...tentative,
    ...(localization.id ? { id: localization.id } : {}),
    ...(localization.title ? { title: { ...tentative.title, ...localization.title } } : {}),
    ...(localization.estimatedStart ? { estimatedStart: localization.estimatedStart } : {}),
    ...(localization.estimatedEnd ? { estimatedEnd: localization.estimatedEnd } : {}),
    ...(localization.hideWhenConfirmedId
      ? { hideWhenConfirmedId: localization.hideWhenConfirmedId }
      : {}),
    ...(localization.type ? { type: localization.type } : {}),
  };
}

function dedupeTentativeEvents(items) {
  const result = [];

  for (const item of items) {
    const duplicateIndex = result.findIndex((existing) => tentativeDuplicates(existing, item));
    if (duplicateIndex === -1) {
      result.push(item);
      continue;
    }

    const existing = result[duplicateIndex];
    const preferManual = item.source === "manual" && existing.source !== "manual";
    result[duplicateIndex] = preferManual ? item : existing;
  }

  return result.sort((a, b) => a.estimatedStart.localeCompare(b.estimatedStart));
}

function filterVisibleTentative(items, confirmedEvents) {
  const today = todayKey();
  return items
    .filter((item) => item.estimatedEnd >= today)
    .filter((item) => !hasMatchingConfirmedEvent(item, confirmedEvents));
}

function countBySource(items) {
  return items.reduce(
    (acc, item) => {
      const key = item.source ?? "unknown";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    },
    { "pokemon-zone": 0, manual: 0, cache: 0, unknown: 0 }
  );
}

/**
 * Pokemon Zone upcoming + 수동 보정/보충으로 예상 일정 목록 생성.
 */
export function buildTentativeEvents({
  confirmedEvents,
  pzUpcomingEvents = [],
  pzFetchFailed = false,
  cachedTentativeEvents = [],
  manualEvents = [],
  localizations = [],
}) {
  const today = todayKey();
  let autoEvents = [];
  let cacheEvents = [];
  let usedCache = false;

  if (!pzFetchFailed && pzUpcomingEvents.length > 0) {
    autoEvents = pzUpcomingEvents
      .filter((event) => event.endDate >= today)
      .filter((event) => !isAlreadyConfirmed(event, confirmedEvents))
      .map((event) => pzEventToTentative(event))
      .map((event) => applyLocalization(event, localizations));
  }

  const manualPrepared = manualEvents
    .map((event) => applyLocalization({ ...event, source: event.source ?? "manual" }, localizations))
    .filter((event) => event.estimatedEnd >= today)
    .filter((event) => !hasMatchingConfirmedEvent(event, confirmedEvents));

  let merged = dedupeTentativeEvents([...autoEvents, ...manualPrepared]);

  if (autoEvents.length === 0) {
    cacheEvents = cachedTentativeEvents
      .map((event) => applyLocalization({ ...event, source: event.source ?? "cache" }, localizations))
      .filter((event) => event.estimatedEnd >= today)
      .filter((event) => !hasMatchingConfirmedEvent(event, confirmedEvents));

    if (cacheEvents.length > 0) {
      usedCache = true;
      merged = dedupeTentativeEvents([...cacheEvents, ...manualPrepared]);
    }
  }

  const events = filterVisibleTentative(merged, confirmedEvents);
  const mergedCounts = countBySource(merged);

  return {
    events,
    meta: {
      autoCount: autoEvents.length,
      manualCount: manualPrepared.length,
      cacheCount: usedCache ? cacheEvents.length : 0,
      mergedCount: merged.length,
      visibleCount: events.length,
      usedCache,
      sources: mergedCounts,
    },
  };
}
