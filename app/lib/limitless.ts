const API_BASE = "https://play.limitlesstcg.com/api";

export interface Tournament {
  id: string;
  game: string;
  format: string;
  name: string;
  date: string;
  players: number;
}

export interface Standing {
  player: { id: string; name: string };
  deck: { id: string; name: string; icons: string[] };
  decklist?: Record<string, number>;
  placing: number;
  record?: { wins: number; losses: number; ties: number };
}

export interface Pairing {
  round: number;
  phase?: number;
  table?: number;
  player1: string;
  player2: string;
  winner: string; // user id, "0" = tie, "-1" = double loss
}

export async function fetchRecentTournaments(game = "Pocket", limit = 3): Promise<Tournament[]> {
  const url = `${API_BASE}/tournaments?game=${encodeURIComponent(game)}&limit=${limit}&sort=-date`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch tournaments: ${res.status}`);
  return res.json();
}

export async function fetchStandings(tournamentId: string): Promise<Standing[]> {
  const url = `${API_BASE}/tournaments/${encodeURIComponent(tournamentId)}/standings`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch standings: ${res.status}`);
  return res.json();
}

export async function fetchPairings(tournamentId: string): Promise<Pairing[]> {
  const url = `${API_BASE}/tournaments/${encodeURIComponent(tournamentId)}/pairings`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch pairings: ${res.status}`);
  return res.json();
}
