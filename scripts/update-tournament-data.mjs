import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DATA = join(__dirname, "..", "public", "data");

const API_BASE = "https://play.limitlesstcg.com/api";

// 병렬 처리 청크 크기
const CHUNK_SIZE = 3;
const DELAY_MS = 1000;
const RETRY_DELAY_MS = 2000;
const MAX_RETRIES = 3;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, retries = MAX_RETRIES) {
  for (let i = 0; i <= retries; i++) {
    const res = await fetch(url);
    if (res.ok) return res;
    if (res.status === 429 && i < retries) {
      const wait = RETRY_DELAY_MS * (i + 1);
      console.log(`    Rate limited (429). Waiting ${wait}ms before retry ${i + 1}/${retries}...`);
      await sleep(wait);
      continue;
    }
    return res;
  }
  return new Response(null, { status: 429 });
}

async function fetchRecentPocketTournaments(days = 10) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  cutoffDate.setHours(0, 0, 0, 0);

  const all = [];
  let page = 1;
  while (true) {
    const url = `${API_BASE}/tournaments?game=${encodeURIComponent("Pocket")}&limit=100&page=${page}&sort=-date`;
    const res = await fetchWithRetry(url);
    if (!res.ok) {
      console.error(`Failed to fetch page ${page}: ${res.status}`);
      break;
    }
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) break;

    let pageHasRecent = false;
    for (const t of data) {
      const tDate = new Date(t.date);
      if (tDate >= cutoffDate) {
        all.push(t);
        pageHasRecent = true;
      }
    }

    console.log(`  Fetched page ${page}: ${data.length} tournaments (recent: ${all.length})`);

    // 정렬이 -date 이므로 한 페이지 내에서 cutoff 이후가 하나도 없으면 중단
    if (!pageHasRecent) break;
    page++;
  }

  console.log(`Total recent tournaments (last ${days} days): ${all.length}`);
  return all;
}

async function fetchStandings(tournamentId) {
  const url = `${API_BASE}/tournaments/${encodeURIComponent(tournamentId)}/standings`;
  const res = await fetchWithRetry(url);
  if (!res.ok) {
    console.error(`  Failed standings for ${tournamentId}: ${res.status}`);
    return [];
  }
  return res.json();
}

async function fetchPairings(tournamentId) {
  const url = `${API_BASE}/tournaments/${encodeURIComponent(tournamentId)}/pairings`;
  const res = await fetchWithRetry(url);
  if (!res.ok) {
    console.error(`  Failed pairings for ${tournamentId}: ${res.status}`);
    return [];
  }
  return res.json();
}

function formatCardEntry(item) {
  if (!item || !item.set || !item.number) return null;
  const set = String(item.set).toLowerCase();
  const number = String(item.number).padStart(3, "0");
  const count = Number(item.count) || 1;
  return `${count}:${set}-${number}`;
}

function formatDeckList(decklist) {
  if (!decklist || typeof decklist !== "object") return [];

  const cards = [];
  const sections = ["pokemon", "trainer", "item"];

  for (const section of sections) {
    const items = decklist[section];
    if (!Array.isArray(items)) continue;
    for (const item of items) {
      const entry = formatCardEntry(item);
      if (entry) cards.push(entry);
    }
  }

  return cards.sort();
}

function calculateScore(strength, popularity) {
  return strength * Math.sqrt(popularity) * 1.65;
}

async function chunkedFetch(tournaments, fetchFn, label) {
  const results = [];
  for (let i = 0; i < tournaments.length; i += CHUNK_SIZE) {
    const chunk = tournaments.slice(i, i + CHUNK_SIZE);
    const chunkResults = await Promise.all(
      chunk.map(async (t) => ({
        tournamentId: t.id,
        data: await fetchFn(t.id),
      }))
    );
    results.push(...chunkResults);
    console.log(`  ${label}: ${Math.min(i + CHUNK_SIZE, tournaments.length)} / ${tournaments.length}`);
    if (i + CHUNK_SIZE < tournaments.length) {
      await sleep(DELAY_MS);
    }
  }
  return results;
}

async function main() {
  console.log("Fetching recent Pocket tournaments...");
  const tournaments = await fetchRecentPocketTournaments(10);
  console.log(`Total tournaments to process: ${tournaments.length}`);

  console.log("\nFetching standings...");
  const allStandingsRaw = await chunkedFetch(tournaments, fetchStandings, "standings");

  console.log("\nFetching pairings...");
  const allPairingsRaw = await chunkedFetch(tournaments, fetchPairings, "pairings");

  const allStandings = allStandingsRaw.map(({ tournamentId, data }) => ({
    tournamentId,
    standings: data,
  }));

  const allPairings = allPairingsRaw.map(({ tournamentId, data }) => ({
    tournamentId,
    pairings: data,
  }));

  const archetypeMap = new Map();

  for (const { standings } of allStandings) {
    for (const s of standings) {
      if (!s.decklist) continue;

      const deckId = s.deck?.id ?? "";
      const displayName = s.deck?.name ?? "";
      const cards = formatDeckList(s.decklist);

      if (!deckId || cards.length === 0) continue;

      if (!archetypeMap.has(deckId)) {
        archetypeMap.set(deckId, {
          displayName,
          lists: new Map(),
          totalPlayers: 0,
          totalWins: 0,
          totalGames: 0,
        });
      }

      const entry = archetypeMap.get(deckId);
      entry.totalPlayers++;

      if (s.record) {
        const games = s.record.wins + s.record.losses + s.record.ties;
        entry.totalWins += s.record.wins;
        entry.totalGames += games;
      }

      const listKey = cards.join(",");
      if (entry.lists.has(listKey)) {
        const list = entry.lists.get(listKey);
        list.count++;
        if (s.record) {
          list.wins += s.record.wins;
          list.games += s.record.wins + s.record.losses + s.record.ties;
        }
      } else {
        entry.lists.set(listKey, {
          cards,
          count: 1,
          wins: s.record?.wins ?? 0,
          games: s.record
            ? s.record.wins + s.record.losses + s.record.ties
            : 0,
        });
      }
    }
  }

  const totalPlayers = Array.from(archetypeMap.values()).reduce(
    (sum, a) => sum + a.totalPlayers,
    0
  );
  const totalGamesAll = Array.from(archetypeMap.values()).reduce(
    (sum, a) => sum + a.totalGames,
    0
  );

  const bestDecks = [];
  for (const [deckId, data] of archetypeMap) {
    const popularity = totalPlayers > 0 ? data.totalPlayers / totalPlayers : 0;
    const percentOfGames =
      totalGamesAll > 0 ? data.totalGames / totalGamesAll : 0;
    const strength = data.totalGames > 0 ? data.totalWins / data.totalGames : 0;

    const lists = [];
    for (const [, listData] of data.lists) {
      const listStrength =
        listData.games > 0 ? listData.wins / listData.games : strength;
      const listScore = calculateScore(listStrength, popularity);
      lists.push({
        cards: listData.cards,
        score: listScore,
        strength: listStrength,
      });
    }

    lists.sort((a, b) => b.score - a.score);

    bestDecks.push({
      name: deckId,
      lists,
      popularity,
      percentOfGames,
    });
  }

  bestDecks.sort((a, b) => (b.lists[0]?.score ?? 0) - (a.lists[0]?.score ?? 0));

  const matchupMap = new Map();

  for (const { tournamentId, pairings } of allPairings) {
    const tournamentStandings =
      allStandings.find((s) => s.tournamentId === tournamentId)?.standings ??
      [];
    const playerToArchetype = new Map();

    for (const s of tournamentStandings) {
      if (s.deck?.id && s.decklist) {
        playerToArchetype.set(s.player, s.deck.id);
      }
    }

    for (const p of pairings) {
      const a1 = playerToArchetype.get(p.player1);
      const a2 = playerToArchetype.get(p.player2);
      if (!a1 || !a2) continue;

      if (!matchupMap.has(a1)) matchupMap.set(a1, new Map());
      const a1Map = matchupMap.get(a1);
      if (!a1Map.has(a2)) a1Map.set(a2, { wins: 0, games: 0 });

      if (!matchupMap.has(a2)) matchupMap.set(a2, new Map());
      const a2Map = matchupMap.get(a2);
      if (!a2Map.has(a1)) a2Map.set(a1, { wins: 0, games: 0 });

      a1Map.get(a2).games++;
      a2Map.get(a1).games++;

      if (p.winner === p.player1) {
        a1Map.get(a2).wins++;
      } else if (p.winner === p.player2) {
        a2Map.get(a1).wins++;
      }
    }
  }

  const finalMatchups = {};
  for (const [deckName, oppMap] of matchupMap) {
    const entries = [];
    let totalWins = 0;
    let totalGames = 0;

    for (const [oppName, result] of oppMap) {
      entries.push({
        name: oppName,
        winRate: result.games > 0 ? result.wins / result.games : 0,
        totalGames: result.games,
      });
      totalWins += result.wins;
      totalGames += result.games;
    }

    entries.push({
      name: "Total",
      winRate: totalGames > 0 ? totalWins / totalGames : 0,
      totalGames,
    });

    finalMatchups[deckName] = entries;
  }

  writeFileSync(
    join(PUBLIC_DATA, "best-decks.json"),
    JSON.stringify(bestDecks, null, 2)
  );
  writeFileSync(
    join(PUBLIC_DATA, "matchup-data.json"),
    JSON.stringify(finalMatchups, null, 2)
  );

  console.log(`\nUpdated best-decks.json with ${bestDecks.length} archetypes`);
  console.log(
    `Updated matchup-data.json with ${Object.keys(finalMatchups).length} matchups`
  );
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
