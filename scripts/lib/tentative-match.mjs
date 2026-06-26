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

function parseDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function normalizeTitleForMatch(title) {
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

function getSignificantTokens(title) {
  return [
    ...new Set(
      normalizeTitleForMatch(title)
        .split(/\s+/)
        .filter((word) => word.length > 2 && !TITLE_MATCH_STOP_WORDS.has(word))
    ),
  ];
}

export function titlesLikelyMatch(tentativeTitle, confirmedTitle) {
  const tentativeTokens = getSignificantTokens(tentativeTitle.en);
  if (tentativeTokens.length === 0) return false;

  const confirmedText = `${confirmedTitle.en} ${confirmedTitle.ko}`.toLowerCase();
  const matched = tentativeTokens.filter((token) => confirmedText.includes(token));
  const threshold =
    tentativeTokens.length <= 2
      ? tentativeTokens.length
      : Math.ceil(tentativeTokens.length * 0.6);

  return matched.length >= threshold;
}

function tentativeDateMatchesConfirmed(tentative, confirmed, slackDays = 21) {
  const overlaps =
    confirmed.startDate <= tentative.estimatedEnd &&
    confirmed.endDate >= tentative.estimatedStart;

  if (overlaps) return true;

  const estimatedStart = parseDate(tentative.estimatedStart).getTime();
  const estimatedEnd = parseDate(tentative.estimatedEnd).getTime();
  const confirmedStart = parseDate(confirmed.startDate).getTime();
  const slackMs = slackDays * 86_400_000;

  return (
    confirmedStart >= estimatedStart - slackMs &&
    confirmedStart <= estimatedEnd + slackMs
  );
}

export function tentativeMatchesConfirmed(tentative, confirmed) {
  if (tentative.hideWhenConfirmedId && confirmed.id === tentative.hideWhenConfirmedId) {
    return true;
  }

  if (tentative.type !== confirmed.type) return false;
  if (!tentativeDateMatchesConfirmed(tentative, confirmed)) return false;

  return titlesLikelyMatch(tentative.title, confirmed.title);
}

export function hasMatchingConfirmedEvent(tentative, events) {
  return events.some((event) => tentativeMatchesConfirmed(tentative, event));
}

export function tentativeDuplicates(a, b) {
  if (a.type !== b.type) return false;

  const overlaps =
    a.estimatedStart <= b.estimatedEnd && a.estimatedEnd >= b.estimatedStart;
  if (!overlaps) return false;

  return titlesLikelyMatch(a.title, b.title);
}
