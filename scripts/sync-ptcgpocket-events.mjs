import { writeFileSync, readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT = join(__dirname, "..", "public", "data", "events.json");
const API_BASE = "https://ptcgpocket.gg/wp-json/wp/v2/posts";
const EVENTS_CATEGORY_ID = 7;
const SOURCE_URL = "https://ptcgpocket.gg/events/";
const SETS_URL =
  "https://raw.githubusercontent.com/flibustier/pokemon-tcg-pocket-database/main/dist/sets.json";

const EXPANSION_KO_FALLBACK = {
  "Genetic Apex": "최강의 유전자",
  "Mythical Island": "환상이 있는 섬",
  "Space-Time Smackdown": "시공의 격투",
  "Triumphant Light": "초극의 빛",
  "Shining Revelry": "샤이닝 하이",
  "Celestial Guardians": "쌍천의 수호자",
  "Extradimensional Crisis": "이차원 크라이시스",
  "Eevee Grove": "이브이 가든",
  "Wisdom of Sea and Sky": "하늘과 바다의 인도",
  "Secluded Springs": "미지의 수역",
  "Mega Rising": "메가라이징",
  "Crimson Blaze": "홍련 블레이즈",
  "Fantastical Parade": "몽환퍼레이드",
  "Paldean Wonders": "팔데아원더",
  "Mega Shine": "샤이닝 메가",
  "Pulsing Aura": "파동 비트",
  "Paradox Drive": "진격 패러독스",
};

const MONTHS = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
};

const SKIP_SLUGS = new Set([
  "eevee-grove-twitch-drops",
  "mcdonalds-x-pokemon-happy-meals-collaboration",
]);

const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: "https://ptcgpocket.gg/events/",
  Origin: "https://ptcgpocket.gg",
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function decodeHtml(text) {
  return text
    .replace(/&#8211;/g, "–")
    .replace(/&#8212;/g, "—")
    .replace(/&#038;/g, "&")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
}

function toDateKeyFromDotgg(text) {
  if (!text) return null;
  const cleaned = text
    .trim()
    .replace(/\s+/g, " ")
    .replace(/,\s*(\d{4}),\s*\1/g, ", $1")
    .replace(/(\d{4})\s+\1/g, "$1");

  const match = cleaned.match(/([A-Za-z]+)\s+0?(\d{1,2}),?\s*(\d{4})/i);
  if (!match) return null;

  const month = MONTHS[match[1].toLowerCase()];
  if (!month) return null;

  const year = match[3];
  const day = String(match[2]).padStart(2, "0");
  const monthStr = String(month).padStart(2, "0");
  return `${year}-${monthStr}-${day}`;
}

function parseEventPeriod(html) {
  const match = html.match(
    /Start:<\/strong>\s*([^<]+)<\/li>[\s\S]{0,800}?End:<\/strong>\s*([^<]+)<\/li>/i
  );
  if (!match) return null;

  const startDate = toDateKeyFromDotgg(match[1]);
  const endDate = toDateKeyFromDotgg(match[2]);
  if (!startDate || !endDate || endDate < startDate) return null;

  return { startDate, endDate };
}

function classifyEvent(title) {
  const t = title.toLowerCase();
  if (t.includes("wonder pick")) return "wonder";
  if (t.includes("drop event") || t.includes("drop event")) return "drop";
  if (/\bdrop\b/.test(t) && !t.includes("drop rate")) return "drop";
  if (t.includes("emblem")) return "emblem";
  if (t.includes("community week") || t.includes("bonus week")) return "community";
  if (t.includes("ranked match")) return "ranked";
  if (t.includes("mass outbreak")) return "mission";
  if (t.includes("expansion") || /\([ab]\d/i.test(t)) return "expansion";
  return "mission";
}

async function fetchJson(url, { retries = 3 } = {}) {
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const res = await fetch(url, { headers: FETCH_HEADERS });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} for ${url}`);
      }
      return res.json();
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        console.warn(`Attempt ${attempt} failed: ${err.message}. Retrying...`);
        await sleep(1500 * attempt);
      }
    }
  }

  throw lastError;
}

async function fetchAllEventPosts() {
  const posts = [];
  let page = 1;

  while (true) {
    const url = `${API_BASE}?categories=${EVENTS_CATEGORY_ID}&per_page=100&page=${page}&_fields=id,slug,title,link,content`;
    console.log(`Fetching ${url} ...`);
    const batch = await fetchJson(url);
    if (!Array.isArray(batch) || batch.length === 0) break;
    posts.push(...batch);
    if (batch.length < 100) break;
    page += 1;
  }

  return posts;
}

function loadCachedBlogEvents() {
  if (!existsSync(OUTPUT)) return [];

  const existing = JSON.parse(readFileSync(OUTPUT, "utf8"));
  return (existing.events ?? []).filter(
    (event) => event.type !== "expansion" && !String(event.id ?? "").startsWith("expansion-")
  );
}

function buildEvents(posts) {
  const events = [];

  for (const post of posts) {
    if (SKIP_SLUGS.has(post.slug)) continue;

    const title = decodeHtml(post.title?.rendered ?? "").trim();
    if (!title) continue;

    const period = parseEventPeriod(post.content?.rendered ?? "");
    if (!period) {
      console.warn(`Skipping ${post.slug}: no Event Period dates`);
      continue;
    }

    events.push({
      id: post.slug,
      startDate: period.startDate,
      endDate: period.endDate,
      title: { en: title, ko: title },
      type: classifyEvent(title),
      url: post.link,
    });
  }

  return events;
}

function buildExpansionEvents(setsBySeries) {
  const events = [];

  for (const sets of Object.values(setsBySeries ?? {})) {
    if (!Array.isArray(sets)) continue;

    for (const set of sets) {
      if (!set?.releaseDate || /^PROMO/i.test(set.code ?? "")) continue;

      const enName = set.name?.en?.trim() || set.code;
      const koName =
        set.name?.ko?.trim() || EXPANSION_KO_FALLBACK[enName] || enName;

      events.push({
        id: `expansion-${String(set.code).toLowerCase()}`,
        startDate: set.releaseDate,
        endDate: set.releaseDate,
        title: {
          en: `${enName} Expansion`,
          ko: `${koName} 확장팩`,
        },
        type: "expansion",
      });
    }
  }

  return events;
}

function mergeEvents(...groups) {
  const merged = new Map();
  for (const group of groups) {
    for (const event of group) {
      merged.set(event.id, event);
    }
  }
  return [...merged.values()].sort((a, b) => a.startDate.localeCompare(b.startDate));
}

async function main() {
  let blogEvents = [];
  let blogEventsFromCache = false;

  try {
    const posts = await fetchAllEventPosts();
    console.log(`Fetched ${posts.length} posts`);
    blogEvents = buildEvents(posts);
  } catch (err) {
    console.warn(`ptcgpocket.gg API unavailable (${err.message}).`);
    blogEvents = loadCachedBlogEvents();
    blogEventsFromCache = true;

    if (blogEvents.length === 0) {
      throw new Error(
        "Could not fetch ptcgpocket.gg events and no cached blog events are available"
      );
    }

    console.warn(`Using ${blogEvents.length} cached blog events from ${OUTPUT}`);
  }

  console.log(`Fetching ${SETS_URL} ...`);
  const setsBySeries = await fetchJson(SETS_URL);
  const expansionEvents = buildExpansionEvents(setsBySeries);
  console.log(`Parsed ${blogEvents.length} events, ${expansionEvents.length} expansions`);

  const events = mergeEvents(blogEvents, expansionEvents);
  if (events.length === 0) {
    if (existsSync(OUTPUT)) {
      console.error("No events parsed. Keeping existing events.json");
      process.exit(1);
    }
    throw new Error("No events parsed and no existing events.json fallback");
  }

  if (!blogEventsFromCache && existsSync(OUTPUT)) {
    const existing = JSON.parse(readFileSync(OUTPUT, "utf8"));
    const prevCount = existing.events?.length ?? 0;
    if (prevCount > 0 && events.length < Math.max(10, Math.floor(prevCount * 0.5))) {
      console.error(
        `Only ${events.length} events parsed (previous: ${prevCount}). Keeping existing events.json`
      );
      process.exit(1);
    }
  }

  const disclaimer = blogEventsFromCache
    ? "Schedule data is collected from unofficial sources (ptcgpocket.gg, community set database) and may change without notice. Not an official Pokémon Company schedule. Blog events were kept from the last successful sync because ptcgpocket.gg blocked automated access."
    : "Schedule data is collected from unofficial sources (ptcgpocket.gg, community set database) and may change without notice. Not an official Pokémon Company schedule.";

  const payload = {
    source: "ptcgpocket.gg + flibustier/pokemon-tcg-pocket-database",
    sourceUrl: SOURCE_URL,
    disclaimer,
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
