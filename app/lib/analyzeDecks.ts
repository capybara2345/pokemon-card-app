import type { Standing, Pairing } from "./limitless";

export interface AnalyzedDeck {
  name: string;
  displayName: string;
  lists: { cards: string[]; score: number; strength: number }[];
  popularity: number;
  percentOfGames: number;
}

export interface MatchupEntry {
  name: string;
  winRate: number;
  totalGames: number;
}

export type MatchupData = Record<string, MatchupEntry[]>;

export function analyzeDecks(
  allStandings: Array<{ tournamentId: string; standings: Standing[] }>,
  allPairings: Array<{ tournamentId: string; pairings: Pairing[] }>
): { decks: AnalyzedDeck[]; matchups: MatchupData } {
  const combinedStandings = allStandings.flatMap((s) => s.standings);

  const archetypeMap = new Map<
    string,
    {
      displayName: string;
      lists: Map<string, { cards: string[]; count: number }>;
      totalGames: number;
      wins: number;
      players: number;
    }
  >();

  for (const s of combinedStandings) {
    const slug = slugifyDeckName(s.deck.name);
    if (!archetypeMap.has(slug)) {
      archetypeMap.set(slug, {
        displayName: s.deck.name,
        lists: new Map(),
        totalGames: 0,
        wins: 0,
        players: 0,
      });
    }
    const entry = archetypeMap.get(slug)!;
    entry.players++;

    if (s.record) {
      entry.totalGames += s.record.wins + s.record.losses + s.record.ties;
      entry.wins += s.record.wins;
    }

    const decklist = s.decklist ?? {};
    const cards = Object.entries(decklist)
      .map(([id, count]) => `${count}:${id}`)
      .sort();

    const listKey = cards.join(",");
    const existing = entry.lists.get(listKey);
    if (existing) {
      existing.count++;
    } else {
      entry.lists.set(listKey, { cards, count: 1 });
    }
  }

  const totalPlayers = Math.max(combinedStandings.length, 1);
  const totalGamesAll = combinedStandings.reduce(
    (sum, s) => sum + (s.record ? s.record.wins + s.record.losses + s.record.ties : 0),
    0
  );

  const matchupMap = new Map<string, Map<string, { wins: number; games: number }>>();

  for (const { tournamentId, pairings } of allPairings) {
    const tournamentStandings =
      allStandings.find((s) => s.tournamentId === tournamentId)?.standings ?? [];
    const playerToArchetype = new Map<string, string>();
    for (const s of tournamentStandings) {
      playerToArchetype.set(s.player.id, slugifyDeckName(s.deck.name));
    }

    for (const p of pairings) {
      const a1 = playerToArchetype.get(p.player1);
      const a2 = playerToArchetype.get(p.player2);
      if (!a1 || !a2) continue;

      if (!matchupMap.has(a1)) matchupMap.set(a1, new Map());
      const a1Map = matchupMap.get(a1)!;
      if (!a1Map.has(a2)) a1Map.set(a2, { wins: 0, games: 0 });

      if (!matchupMap.has(a2)) matchupMap.set(a2, new Map());
      const a2Map = matchupMap.get(a2)!;
      if (!a2Map.has(a1)) a2Map.set(a1, { wins: 0, games: 0 });

      a1Map.get(a2)!.games++;
      a2Map.get(a1)!.games++;

      if (p.winner === p.player1) {
        a1Map.get(a2)!.wins++;
      } else if (p.winner === p.player2) {
        a2Map.get(a1)!.wins++;
      }
    }
  }

  const decks: AnalyzedDeck[] = [];
  for (const [slug, data] of archetypeMap) {
    let bestList = { cards: [] as string[], count: 0 };
    for (const [, listData] of data.lists) {
      if (listData.count > bestList.count) {
        bestList = { cards: listData.cards, count: listData.count };
      }
    }

    const winRate = data.totalGames > 0 ? data.wins / data.totalGames : 0;
    const score = winRate * Math.sqrt(data.players);
    const strength = winRate;

    decks.push({
      name: slug,
      displayName: data.displayName,
      lists: [{ cards: bestList.cards, score, strength }],
      popularity: data.players / totalPlayers,
      percentOfGames: totalGamesAll > 0 ? data.totalGames / totalGamesAll : 0,
    });
  }

  const matchups: MatchupData = {};
  for (const [slug, oppMap] of matchupMap) {
    const entries: MatchupEntry[] = [];
    let totalWins = 0;
    let totalGames = 0;

    for (const [oppSlug, result] of oppMap) {
      entries.push({
        name: oppSlug,
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

    matchups[slug] = entries;
  }

  return { decks, matchups };
}

function slugifyDeckName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[/&]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
