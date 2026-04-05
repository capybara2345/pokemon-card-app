import CardGrid from "./components/CardGrid";
import { fetchCards } from "./lib/fetchCards";

export const revalidate = 21600;

export default async function Home() {
  const cards = await fetchCards();
  return (
    <main className="min-h-screen">
      <CardGrid cards={cards} />
    </main>
  );
}

