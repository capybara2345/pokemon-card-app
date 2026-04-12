import { cookies } from "next/headers";
import DeckBuilder from "../components/DeckBuilder";
import { fetchCards } from "../lib/fetchCards";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export default async function DeckBuilderPage() {
  const cookieStore = await cookies();
  const lang = cookieStore.get("lang")?.value ?? "ko";
  const [cards, session] = await Promise.all([fetchCards(lang), auth()]);
  return (
    <main className="min-h-screen">
      <DeckBuilder cards={cards} session={session} />
    </main>
  );
}
