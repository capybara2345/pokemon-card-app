import { db } from "./firebase";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  setDoc,
  doc,
  query,
  orderBy,
} from "firebase/firestore";

export type DeckCard = { cardId: number; count: number };

export type SavedDeck = {
  id: string;
  name: string;
  cards: DeckCard[];
  cardCount: number;
  createdAt: string;
  updatedAt: string;
};

function decksCol(userEmail: string) {
  return collection(db, `users/${userEmail}/decks`);
}

export const MAX_DECKS = 10;

export async function saveDeckToFirestore(
  userEmail: string,
  name: string,
  cards: DeckCard[]
): Promise<string> {
  const existing = await getDocs(decksCol(userEmail));
  if (existing.size >= MAX_DECKS) {
    throw new Error(`덱은 최대 ${MAX_DECKS}개까지 저장할 수 있습니다.`);
  }
  const now = new Date().toISOString();
  const docRef = await addDoc(decksCol(userEmail), {
    name,
    cards,
    cardCount: cards.reduce((s, c) => s + c.count, 0),
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function updateDeckInFirestore(
  userEmail: string,
  deckId: string,
  name: string,
  cards: DeckCard[]
): Promise<void> {
  await updateDoc(doc(db, `users/${userEmail}/decks/${deckId}`), {
    name,
    cards,
    cardCount: cards.reduce((s, c) => s + c.count, 0),
    updatedAt: new Date().toISOString(),
  });
}

export async function loadDecksFromFirestore(
  userEmail: string
): Promise<SavedDeck[]> {
  const q = query(decksCol(userEmail), orderBy("updatedAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<SavedDeck, "id">),
  }));
}

export async function deleteDeckFromFirestore(
  userEmail: string,
  deckId: string
): Promise<void> {
  await deleteDoc(doc(db, `users/${userEmail}/decks/${deckId}`));
}

// ── 즐겨찾기 ──

export const MAX_FAVORITES = 30;

function favoritesDoc(userEmail: string) {
  return doc(db, `users/${userEmail}/favorites`, "default");
}

export async function loadFavoritesFromFirestore(
  userEmail: string
): Promise<number[]> {
  const snap = await getDoc(favoritesDoc(userEmail));
  if (!snap.exists()) return [];
  return (snap.data().cardIds as number[]) ?? [];
}

export async function toggleFavoriteInFirestore(
  userEmail: string,
  cardId: number
): Promise<number[]> {
  const ref = favoritesDoc(userEmail);
  const snap = await getDoc(ref);
  let cardIds: number[] = snap.exists() ? (snap.data().cardIds ?? []) : [];

  if (cardIds.includes(cardId)) {
    cardIds = cardIds.filter((id) => id !== cardId);
  } else {
    if (cardIds.length >= MAX_FAVORITES) {
      throw new Error(`즐겨찾기는 최대 ${MAX_FAVORITES}개까지 가능합니다.`);
    }
    cardIds = [...cardIds, cardId];
  }

  await setDoc(ref, { cardIds, updatedAt: new Date().toISOString() });
  return cardIds;
}


