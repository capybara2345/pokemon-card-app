import type { Metadata } from "next";
import { cookies } from "next/headers";
import DeckBuilder from "../components/DeckBuilder";
import { fetchCards, fetchRecommendedDecks } from "../lib/fetchCards";
import { auth } from "@/auth";
import { SITE_URL } from "../lib/constants";

export const metadata: Metadata = {
  title: "덱 빌더 | Deck Builder",
  description:
    "포켓몬 포켓 덱 빌더. 원하는 카드를 골라 나만의 덱을 구성하고 저장하세요. Pokemon TCG Pocket deck builder — build, save, and share your custom PTCGP decks.",
  keywords: [
    "포켓몬 포켓 덱 빌더",
    "포켓몬 포켓 덱",
    "포켓몬 포켓 추천 덱",
    "포켓몬 덱 만들기",
    "PTCGP 덱",
    "pokemon pocket deck builder",
    "pokemon pocket deck",
    "best pokemon pocket deck",
    "PTCGP deck",
    "pokemon tcg pocket deck builder",
    "pokemon pocket deck list",
    "ポケポケ デッキ",
    "ポケモンポケット デッキ",
    "ポケポケ デッキビルダー",
    "ポケポケ デッキ作成",
    "ポケポケ おすすめデッキ",
    "ポケポケ デッキ構築",
    "ポケポケ カード",
    "ポケモン カード ポケット デッキ",
    "ポケポケ デッキレシピ",
  ],
  openGraph: {
    title: "포켓몬 포켓 덱 빌더 | Pokemon TCG Pocket Deck Builder",
    description:
      "나만의 포켓몬 포켓 덱을 빌드하고 저장하세요. Build and save your Pokemon TCG Pocket decks.",
    url: `${SITE_URL}/deck-builder`,
    type: "website",
  },
  alternates: {
    canonical: `${SITE_URL}/deck-builder`,
  },
};

export const dynamic = "force-dynamic";

export default async function DeckBuilderPage() {
  const cookieStore = await cookies();
  const lang = cookieStore.get("lang")?.value ?? "ko";
  const [cards, session] = await Promise.all([fetchCards(lang), auth()]);
  const recommendedDecks = fetchRecommendedDecks();
  return (
    <main className="min-h-screen">
      <DeckBuilder cards={cards} session={session} recommendedDecks={recommendedDecks} />
    </main>
  );
}
