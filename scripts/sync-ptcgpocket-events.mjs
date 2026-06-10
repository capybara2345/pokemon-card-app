import { writeFileSync, readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT = join(__dirname, "..", "public", "data", "events.json");
const API_BASE = "https://ptcgpocket.gg/wp-json/wp/v2/posts";
const EVENTS_CATEGORY_ID = 7;
const SOURCE_URL = "https://ptcgpocket.gg/events/";

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

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "PPCardList/1.0 (event sync)" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
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

  return events.sort((a, b) => a.startDate.localeCompare(b.startDate));
}

async function main() {
  const posts = await fetchAllEventPosts();
  console.log(`Fetched ${posts.length} posts`);

  const events = buildEvents(posts);
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
    if (prevCount > 0 && events.length < Math.max(10, Math.floor(prevCount * 0.5))) {
      console.error(
        `Only ${events.length} events parsed (previous: ${prevCount}). Keeping existing events.json`
      );
      process.exit(1);
    }
  }

  const payload = {
    source: "ptcgpocket.gg",
    sourceUrl: SOURCE_URL,
    disclaimer:
      "Schedule data is collected from ptcgpocket.gg (unofficial guide) and may change without notice. Not an official Pokémon Company schedule.",
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
