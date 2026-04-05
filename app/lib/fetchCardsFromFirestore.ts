import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import { type PokemonCard } from "../data/cards";

export async function fetchCardsFromFirestore(): Promise<PokemonCard[]> {
  const snapshot = await getDocs(collection(db, "cards"));

  if (snapshot.empty) return [];

  return snapshot.docs
    .map((doc) => doc.data() as PokemonCard)
    .sort((a, b) => a.ID - b.ID);
}
