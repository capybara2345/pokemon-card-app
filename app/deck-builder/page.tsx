import DeckBuilder from "../components/DeckBuilder";
import { fetchCards } from "../lib/fetchCards";
import { auth } from "@/auth";

export const revalidate = 21600;

export default async function DeckBuilderPage() {
  const [cards, session] = await Promise.all([fetchCards(), auth()]);
  return (
    <main className="min-h-screen">
      <DeckBuilder cards={cards} session={session} />
    </main>
  );
}
