"use server";

import { auth } from "@/auth";
import { getAdminDb } from "@/app/lib/firebaseAdmin";

export type DeckCard = { cardId: number; count: number };

export type SavedDeck = {
  id: string;
  name: string;
  cards: DeckCard[];
  cardCount: number;
  createdAt: string;
  updatedAt: string;
};

export async function saveDeck(
  name: string,
  cards: DeckCard[]
): Promise<{ success: boolean; id?: string; error?: string }> {
  const session = await auth();
  if (!session?.user?.email) return { success: false, error: "로그인이 필요합니다." };

  const db = getAdminDb();
  const now = new Date().toISOString();
  const docRef = await db.collection(`users/${session.user.email}/decks`).add({
    name,
    cards,
    cardCount: cards.reduce((s, c) => s + c.count, 0),
    createdAt: now,
    updatedAt: now,
  });
  return { success: true, id: docRef.id };
}

export async function updateDeck(
  deckId: string,
  name: string,
  cards: DeckCard[]
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.email) return { success: false, error: "로그인이 필요합니다." };

  const db = getAdminDb();
  await db.doc(`users/${session.user.email}/decks/${deckId}`).update({
    name,
    cards,
    cardCount: cards.reduce((s, c) => s + c.count, 0),
    updatedAt: new Date().toISOString(),
  });
  return { success: true };
}

export async function loadDecks(): Promise<{
  success: boolean;
  decks?: SavedDeck[];
  error?: string;
}> {
  const session = await auth();
  if (!session?.user?.email) return { success: false, error: "로그인이 필요합니다." };

  const db = getAdminDb();
  const snapshot = await db
    .collection(`users/${session.user.email}/decks`)
    .orderBy("updatedAt", "desc")
    .get();
  const decks: SavedDeck[] = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<SavedDeck, "id">),
  }));
  return { success: true, decks };
}

export async function deleteDeck(
  deckId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.email) return { success: false, error: "로그인이 필요합니다." };

  const db = getAdminDb();
  await db.doc(`users/${session.user.email}/decks/${deckId}`).delete();
  return { success: true };
}
