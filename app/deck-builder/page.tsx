import DeckBuilder from "../components/DeckBuilder";
import { fetchCards } from "../lib/fetchCards";

export const revalidate = 21600;

export default async function DeckBuilderPage() {
  const cards = await fetchCards();
  return (
    <main className="min-h-screen">
      <DeckBuilder cards={cards} />
    </main>
  );
}
