import type { Metadata } from "next";
import { cookies } from "next/headers";
import CardGrid from "./components/CardGrid";
import { fetchCards } from "./lib/fetchCards";
import { SITE_URL } from "./lib/constants";

export const metadata: Metadata = {
  title: "포켓몬 포켓 카드 리스트 | Pokemon TCG Pocket Card Database",
  description:
    "포켓몬 포켓(Pokémon TCG Pocket) 전체 카드 목록, 덱 빌더, 토너먼트 덱, 카드 검색. 타입·진화단계·확장팩별 필터 지원. ポケポケの全カードリスト・デッキビルダー・トーナメントデッキ検索。タイプ・進化段階・拡張パック別フィルタ対応。 Complete Pokemon TCG Pocket (PTCGP) card list, deck builder and card search with type, evolution, and expansion filters.",
  keywords: [
    "포켓몬 포켓",
    "포켓몬 카드",
    "포켓몬 포켓 카드",
    "포켓몬 포켓 카드 리스트",
    "포켓몬 pocket 카드 리스트",
    "포켓몬 포켓 카드 도감",
    "포켓몬 포켓 카드 목록",
    "포켓몬 포켓 덱 빌더",
    "포켓몬 포켓 덱",
    "포켓몬 포켓 덱 레시피",
    "pokemon pocket",
    "pokemon tcg pocket",
    "PTCGP",
    "pokemon pocket cards",
    "pokemon pocket card list",
    "pokemon pocket deck builder",
    "pokemon pocket wiki",
    "ポケポケ",
    "ポケポケ カード",
    "ポケポケ カードリスト",
    "ポケポケ 全カード",
    "ポケモンポケット デッキ",
    "ポケポケ デッキ",
    "ポケポケ デッキビルダー",
    "ポケモンTCGポケット",
    "ポケモン カード ポケット",
    "ポケポケ カード検索",
    "ポケポケ おすすめデッキ",
    "포켓몬 포켓 토너먼트 덱",
    "포켓몬 포켓 메타",
    "포켓몬 포켓 덱 리스트",
    "포켓몬 포켓 추천 덱",
    "포켓몬 덱 만들기",
    "PTCGP 덱",
    "pokemon pocket tournament decks",
    "pokemon tcg pocket meta",
    "pokemon pocket deck tier list",
    "PTCGP tournament",
    "pokemon pocket best decks",
    "pokemon pocket deck",
    "best pokemon pocket deck",
    "PTCGP deck",
    "pokemon tcg pocket deck builder",
    "pokemon pocket deck list",
    "ポケポケ トーナメントデッキ",
    "ポケポケ メタ",
    "ポケポケ デッキリスト",
    "ポケポケ デッキ Tier",
    "ポケポケ 最強デッキ",
    "ポケポケ 大会デッキ",
    "ポケモンTCGポケット メタ",
    "ポケポケ デッキメタ",
    "ポケポケ 勝率",
    "ポケモンポケット デッキ",
    "ポケポケ デッキ作成",
    "ポケポケ デッキ構築",
    "ポケモン カード ポケット デッキ",
    "ポケポケ デッキレシピ",
  ],
  openGraph: {
    title: "포켓몬 포켓 카드 리스트 | Pokemon TCG Pocket Card Database",
    description:
      "포켓몬 포켓 전체 카드 목록, 덱 빌더, 토너먼트 덱. ポケポケの全カードリスト・デッキビルダー・トーナメントデッキ。 Complete Pokemon TCG Pocket card list, deck builder and tournament decks.",
    url: SITE_URL,
    type: "website",
    images: [
      {
        url: "/etc/card_case.png",
        width: 1200,
        height: 630,
        alt: "포켓몬 포켓 카드 리스트",
      },
    ],
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export const dynamic = "force-dynamic";

export default async function Home() {
  const cookieStore = await cookies();
  const lang = cookieStore.get("lang")?.value ?? "ko";
  const cards = await fetchCards(lang);
  return (
    <main className="min-h-screen">
      <h1 className="sr-only">
        포켓몬 포켓 카드 리스트 — 전체 카드 목록, 덱 빌더, 토너먼트 덱
      </h1>
      <CardGrid cards={cards} />
    </main>
  );
}

