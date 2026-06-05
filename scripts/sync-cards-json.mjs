import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, "..", "public", "data", "cards.json");
const V4_URL =
  "https://raw.githubusercontent.com/chase-manning/pokemon-tcg-pocket-cards/refs/heads/main/v4.json";

async function main() {
  console.log(`Fetching ${V4_URL} ...`);
  const res = await fetch(V4_URL);
  if (!res.ok) {
    throw new Error(`Failed to fetch v4.json: ${res.status} ${res.statusText}`);
  }

  const cards = await res.json();
  if (!Array.isArray(cards)) {
    throw new Error("v4.json is not an array");
  }

  const normalized = cards.map((card) => ({
    id: String(card.id ?? "").trim(),
    name: card.name ?? "",
    rarity: card.rarity ?? "",
    pack: card.pack ?? "",
    health: card.health ?? "",
    image: card.image ?? "",
    fullart: card.fullart ?? "",
    ex: card.ex ?? "",
    artist: card.artist ?? "",
    type: card.type ?? "",
  }));

  const withImage = normalized.filter((c) => c.image).length;
  const b3aCount = normalized.filter((c) => c.id.startsWith("b3a-")).length;

  writeFileSync(OUT_PATH, JSON.stringify(normalized, null, 2) + "\n", "utf-8");

  console.log(`Wrote ${normalized.length} cards to ${OUT_PATH}`);
  console.log(`  with image: ${withImage}`);
  console.log(`  b3a series: ${b3aCount}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
