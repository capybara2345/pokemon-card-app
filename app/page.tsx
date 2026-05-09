import type { Metadata } from "next";
import { cookies } from "next/headers";
import CardGrid from "./components/CardGrid";
import { fetchCards } from "./lib/fetchCards";
import { SITE_URL } from "./lib/constants";

export const metadata: Metadata = {
  title: "포켓몬 포켓 카드 도감 | Pokemon TCG Pocket Card Database",
  description:
    "포켓몬 포켓(Pokémon TCG Pocket) 전체 카드 목록, 덱 빌더, 카드 검색. 타입·진화단계·확장팩별 필터 지원. Complete Pokemon TCG Pocket (PTCGP) card list, deck builder and card search with type, evolution, and expansion filters.",
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
    "ポケポケ デッキ",
    "ポケポケ デッキビルダー",
    "ポケモンTCGポケット",
    "ポケモン カード ポケット",
    "ポケポケ カード検索",
    "ポケポケ おすすめデッキ",
  ],
  openGraph: {
    title: "포켓몬 포켓 카드 도감 | Pokemon TCG Pocket Card Database",
    description:
      "포켓몬 포켓 전체 카드 목록과 덱 빌더. Complete Pokemon TCG Pocket card list and deck builder.",
    url: SITE_URL,
    type: "website",
    images: [
      {
        url: "/etc/card_case.png",
        width: 1200,
        height: 630,
        alt: "포켓몬 포켓 카드 도감",
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
        포켓몬 포켓 카드 도감 — 전체 카드 목록, 덱 빌더, 토너먼트 덱
      </h1>
      <CardGrid cards={cards} />
    </main>
  );
}

