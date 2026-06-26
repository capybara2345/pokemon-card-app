import { writeFileSync, readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import {
  fetchPokemonZoneSchedule,
  launchPzBrowser,
  PZ_BASE_URL,
} from "./lib/pokemon-zone-schedule.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT = join(__dirname, "..", "public", "data", "events.json");

async function main() {
  const year = new Date().getUTCFullYear();
  const paths = [
    "/schedule/",
    "/schedule/upcoming/",
    `/schedule/${year}/`,
    `/schedule/${year - 1}/`,
  ];

  const browser = await launchPzBrowser();
  let events;
  try {
    events = await fetchPokemonZoneSchedule(browser, paths);
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
    sourceUrl: `${PZ_BASE_URL}/schedule/`,
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
