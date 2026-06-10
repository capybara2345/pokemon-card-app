import { writeFileSync, readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import * as cheerio from "cheerio";
import { chromium, firefox } from "playwright";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT = join(__dirname, "..", "public", "data", "events.json");
const BASE_URL = "https://www.pokemon-zone.com";

const MONTHS = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

const SKIP_TITLES = new Set([
  "shops",
  "missions",
  "event battles",
  "wonder picks",
  "poke gold offers",
  "event guides",
]);

const SKIP_TITLE_PATTERNS = [
  /premium shop/i,
  /poke gold/i,
  /playmat|backdrop|card sleeve|pokémon coin|cover\)/i,
  /^\d+\s+\d+\s*-\s*items$/i,
  /^step-up battle$/i,
  /store - cards$/i,
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toDateKey(isoLike) {
  if (!isoLike) return null;
  const d = new Date(isoLike);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseDateRangeText(text, fallbackYear) {
  if (!text || text === "Available") return null;
  const cleaned = text.replace(/\s+/g, " ").trim();
  const withYear = cleaned.match(
    /^([A-Za-z]{3,9})\s+(\d{1,2})\s*-\s*([A-Za-z]{3,9})\s+(\d{1,2}),\s*(\d{4})$/
  );
  if (withYear) {
    const [, sm, sd, em, ed, year] = withYear;
    const startMonth = MONTHS[sm.toLowerCase().slice(0, 3)];
    const endMonth = MONTHS[em.toLowerCase().slice(0, 3)];
    if (!startMonth || !endMonth) return null;
    return {
      startDate: `${year}-${String(startMonth).padStart(2, "0")}-${String(sd).padStart(2, "0")}`,
      endDate: `${year}-${String(endMonth).padStart(2, "0")}-${String(ed).padStart(2, "0")}`,
    };
  }

  const noYear = cleaned.match(
    /^([A-Za-z]{3,9})\s+(\d{1,2})\s*-\s*([A-Za-z]{3,9})\s+(\d{1,2})$/
  );
  if (noYear) {
    const [, sm, sd, em, ed] = noYear;
    const startMonth = MONTHS[sm.toLowerCase().slice(0, 3)];
    const endMonth = MONTHS[em.toLowerCase().slice(0, 3)];
    const year = fallbackYear ?? new Date().getUTCFullYear();
    if (!startMonth || !endMonth) return null;
    let endYear = year;
    if (endMonth < startMonth || (endMonth === startMonth && Number(ed) < Number(sd))) {
      endYear = year + 1;
    }
    return {
      startDate: `${year}-${String(startMonth).padStart(2, "0")}-${String(sd).padStart(2, "0")}`,
      endDate: `${endYear}-${String(endMonth).padStart(2, "0")}-${String(ed).padStart(2, "0")}`,
    };
  }

  return null;
}

function classifyEvent(title) {
  const t = title.toLowerCase();
  if (t.includes("wonder pick")) return "wonder";
  if (t.includes("drop event")) return "drop";
  if (t.includes("emblem")) return "emblem";
  if (t.includes("community week") || t.includes("bonus week")) return "community";
  if (t.includes("ranked match")) return "ranked";
  if (t.includes("expansion") || t.includes("release")) return "expansion";
  return "mission";
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function shouldSkip(title) {
  const normalized = title.trim();
  if (!normalized) return true;
  if (SKIP_TITLES.has(normalized.toLowerCase())) return true;
  if (/^sc_[a-z0-9_]+$/i.test(normalized)) return true;
  return SKIP_TITLE_PATTERNS.some((re) => re.test(normalized));
}

function mergeEvent(map, raw) {
  const title = raw.title?.trim();
  if (!title || shouldSkip(title)) return;

  let startDate = raw.startDate;
  let endDate = raw.endDate;

  if ((!startDate || !endDate) && raw.datesText) {
    const fallbackYear = raw.startDate
      ? Number(raw.startDate.slice(0, 4))
      : new Date().getUTCFullYear();
    const parsed = parseDateRangeText(raw.datesText, fallbackYear);
    if (parsed) {
      startDate = startDate ?? parsed.startDate;
      endDate = endDate ?? parsed.endDate;
    }
  }

  if (!startDate || !endDate) return;
  if (endDate.startsWith("3000-")) return;
  if (endDate < startDate) return;

  const id = raw.id || slugify(raw.url?.replace(/\/$/, "").split("/").pop() || title);
  const url = raw.url?.startsWith("http")
    ? raw.url
    : raw.url
      ? `${BASE_URL}${raw.url}`
      : undefined;

  const existing = map.get(id);
  const next = {
    id,
    startDate,
    endDate,
    title: { en: title, ko: title },
    type: raw.type ?? classifyEvent(title),
    ...(url ? { url } : {}),
  };

  if (!existing || existing.endDate < next.endDate) {
    map.set(id, next);
  }
}

function parseScheduleHtml(html) {
  const $ = cheerio.load(html);
  const map = new Map();

  $(".schedule-highlight-card").each((_, el) => {
    const card = $(el);
    const title = card.find(".schedule-highlight-card__header-title").text().trim();
    const datesText = card.find(".banner-date__dates").text().trim();
    const startIso =
      card.find("[data-start]").attr("data-start") ||
      card.find("time[datetime]").first().attr("datetime");
    const endIso = card.find("[data-end]").attr("data-end");
    const href = card.find("a.button").attr("href");

    mergeEvent(map, {
      title,
      datesText,
      startDate: toDateKey(startIso),
      endDate: toDateKey(endIso),
      url: href,
    });
  });

  $('[id^="missions_"]').each((_, el) => {
    const block = $(el);
    const title = block.find(".fs-3.font-bold").first().text().trim();
    const datesText = block.find(".banner-date__dates").first().text().trim();
    const startIso = block.find("[data-start]").attr("data-start");
    const endIso = block.find("[data-end]").attr("data-end");
    const id = block.attr("id")?.replace(/^missions_/, "") || undefined;

    mergeEvent(map, {
      id: id ? slugify(id) : undefined,
      title,
      datesText,
      startDate: toDateKey(startIso),
      endDate: toDateKey(endIso),
    });
  });

  $("h3").each((_, el) => {
    const h3 = $(el);
    const title = h3.text().trim();
    if (shouldSkip(title)) return;
    const container = h3.parent();
    const datesText = container.find(".banner-date__dates").first().text().trim();
    const startIso = container.find("[data-start]").first().attr("data-start");
    const endIso = container.find("[data-end]").first().attr("data-end");

    if (!datesText && !startIso) return;
    if (!/event|mission|ranked|wonder|drop|emblem|celebration|expansion/i.test(title)) {
      return;
    }

    mergeEvent(map, {
      title,
      datesText,
      startDate: toDateKey(startIso),
      endDate: toDateKey(endIso),
    });
  });

  return map;
}

function parseHighlightsApi(payload) {
  const map = new Map();
  const buckets = ["startingSoon", "recentlyStarted", "endingSoon"];
  for (const bucket of buckets) {
    for (const item of payload?.data?.[bucket] ?? []) {
      const event = item?.data?.event;
      const schedule = item?.data?.schedule;
      if (!event?.name || !schedule) continue;
      mergeEvent(map, {
        title: event.name,
        startDate: toDateKey(schedule.openAt),
        endDate: toDateKey(schedule.closeAt),
        url: event.url,
      });
    }
  }
  return map;
}

async function waitForSchedulePage(page) {
  for (let attempt = 0; attempt < 24; attempt++) {
    const title = await page.title();
    const hasSchedule = await page
      .locator(".schedule-highlight-card, .schedule-listing, [data-start]")
      .count();
    if (
      !title.includes("Just a moment") &&
      !title.includes("Hold tight") &&
      hasSchedule > 0
    ) {
      return;
    }
    await sleep(5000);
  }
}

async function launchBrowser() {
  const browserName = (process.env.PZ_BROWSER || "firefox").toLowerCase();
  const headless = process.env.PZ_HEADLESS !== "0";

  if (browserName === "chromium" || browserName === "chrome") {
    return chromium.launch({
      headless,
      channel: process.env.PZ_BROWSER_CHANNEL || "chrome",
      args: ["--disable-blink-features=AutomationControlled"],
    });
  }

  return firefox.launch({ headless });
}

function mergeMaps(target, source) {
  for (const [id, event] of source) {
    const existing = target.get(id);
    if (!existing || existing.endDate < event.endDate) {
      target.set(id, event);
    }
  }
}

async function fetchScheduleData(browser, paths) {
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0",
    locale: "en-US",
  });
  const page = await context.newPage();
  const all = new Map();
  let passedCf = false;

  for (const path of paths) {
    const url = `${BASE_URL}${path}`;
    console.log(`Fetching ${url} ...`);
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 120000 });
      await waitForSchedulePage(page);
      await sleep(1000);

      const html = await page.content();
      if (html.includes("Just a moment") || html.includes("Hold tight")) {
        console.warn(`Skipping ${url}: Cloudflare challenge not passed`);
        continue;
      }

      passedCf = true;
      mergeMaps(all, parseScheduleHtml(html));

      if (path === paths[0]) {
        mergeMaps(all, await fetchHighlights(page));
      }
    } catch (err) {
      console.warn(`Skipping ${url}: ${err.message}`);
    }
  }

  if (!passedCf) {
    throw new Error("Cloudflare challenge not passed on any schedule page");
  }

  await context.close();
  return [...all.values()].sort((a, b) => a.startDate.localeCompare(b.startDate));
}

async function fetchHighlights(page) {
  try {
    const payload = await page.evaluate(async () => {
      const res = await fetch("/api/game/schedule/highlights/", { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    });
    console.log("Fetched schedule highlights API");
    return parseHighlightsApi(payload);
  } catch (err) {
    console.warn("Highlights API fetch failed:", err.message);
    return new Map();
  }
}

async function main() {
  const year = new Date().getUTCFullYear();
  const paths = [
    "/schedule/",
    "/schedule/upcoming/",
    `/schedule/${year}/`,
    `/schedule/${year - 1}/`,
  ];

  const browser = await launchBrowser();
  let events;
  try {
    events = await fetchScheduleData(browser, paths);
  } finally {
    await browser.close();
  }

  if (events.length === 0) {
    if (existsSync(OUTPUT)) {
      console.error("No events parsed. Keeping existing events.json");
      process.exit(1);
    }
    throw new Error("No events parsed and no existing events.json fallback");
  }

  if (existsSync(OUTPUT)) {
    const existing = JSON.parse(readFileSync(OUTPUT, "utf8"));
    const prevCount = existing.events?.length ?? 0;
    if (prevCount > 0 && events.length < Math.max(5, Math.floor(prevCount * 0.6))) {
      console.error(
        `Only ${events.length} events parsed (previous: ${prevCount}). Keeping existing events.json`
      );
      process.exit(1);
    }
  }

  const payload = {
    source: "pokemon-zone.com",
    sourceUrl: `${BASE_URL}/schedule/`,
    disclaimer:
      "Schedule data is datamined from Pokemon Zone and may change without notice. Not an official Pokémon Company schedule.",
    updatedAt: new Date().toISOString(),
    events,
  };

  writeFileSync(OUTPUT, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`Wrote ${events.length} events to ${OUTPUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
