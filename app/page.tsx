import { cookies } from "next/headers";
import CardGrid from "./components/CardGrid";
import { fetchCards } from "./lib/fetchCards";

export const dynamic = "force-dynamic";

export default async function Home() {
  const cookieStore = await cookies();
  const lang = cookieStore.get("lang")?.value ?? "ko";
  const cards = await fetchCards(lang);
  return (
    <main className="min-h-screen">
      <CardGrid cards={cards} />
    </main>
  );
}

