import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import NavHeader from "./components/NavHeader";
import { LangProvider } from "./i18n/context";
import { SITE_URL } from "./lib/constants";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "포켓몬 포켓 카드 도감 | Pokemon TCG Pocket Card Database",
    template: "%s | 포켓몬 포켓 카드 도감",
  },
  description:
    "포켓몬 포켓(Pokémon TCG Pocket) 전체 카드 목록, 덱 빌더, 카드 검색. 타입·진화단계·확장팩별 필터 지원. Complete Pokemon TCG Pocket (PTCGP) card list, deck builder and card search with type, evolution, and expansion filters.",
  applicationName: "포켓몬 포켓 카드 도감",
  authors: [{ name: "포켓몬 포켓 카드 도감", url: SITE_URL }],
  creator: "포켓몬 포켓 카드 도감",
  publisher: "포켓몬 포켓 카드 도감",
  category: "games",
  classification: "games",
  keywords: [
    // 한국어
    "포켓몬 포켓",
    "포켓몬 카드",
    "포켓몬 포켓 카드",
    "포켓몬 pocket 카드",
    "포켓몬 pocket 카드 리스트",
    "포켓몬 TCG 포켓",
    "포켓몬 포켓 카드 도감",
    "포켓몬 포켓 카드 리스트",
    "포켓몬 포켓 카드 목록",
    "포켓몬 포켓 덱 빌더",
    "포켓몬 포켓 덱",
    "포켓몬 포켓 공략",
    "포켓몬 포켓 카드 검색",
    "포켓몬 카드게임",
    "포켓몬 포켓 추천 덱",
    "포켓몬 포켓 카드 효과",
    "포켓몬 포켓 카드 리스트",
    "포켓몬 포켓 전체 카드",
    "덱 빌더",
    "카드 도감",
    // English
    "pokemon pocket",
    "pokemon tcg pocket",
    "PTCGP",
    "pokemon pocket cards",
    "pokemon pocket card list",
    "pokemon pocket card database",
    "pokemon pocket deck builder",
    "pokemon pocket deck",
    "pokemon pocket wiki",
    "pokemon pocket guide",
    "pokemon pocket tier list",
    "best pokemon pocket deck",
    "pokemon trading card game pocket",
    "pokemon pocket card game",
    "pokemon pocket pokedex",
    "genetic apex",
    "mythical island",
    "space time smackdown",
    "triumphant light",
    "pokemon card list",
    "pokemon card search",
    // 일본語
    "ポケモンポケット",
    "ポケポケ",
    "ポケモンTCGポケット",
    "ポケモンカード一覧",
    "ポケポケ デッキ",
    "ポケポケ カード",
    "ポケポケ カードリスト",
    "ポケポケ 全カード",
    "ポケポケ デッキビルダー",
    "ポケポケ カード検索",
    "ポケポケ メタ",
    "ポケモン カード ポケット",
    "ポケポケ 攻略",
    "ポケポケ おすすめデッキ",
    "ポケモン カードゲーム ポケット",
    "ポケポケ トーナメントデッキ",
    "ポケポケ デッキ検索",
    "ポケポケ 全カード一覧",
    "ポケモンTCGポケット カード",
    "ポケポケ カードゲーム",
  ],
  openGraph: {
    title: "포켓몬 포켓 카드 도감 | Pokemon TCG Pocket Card Database",
    description:
      "포켓몬 포켓(Pokémon TCG Pocket) 전체 카드 목록과 덱 빌더. Complete Pokemon TCG Pocket card list and deck builder. Filter by type, evolution stage, and expansion.",
    url: SITE_URL,
    siteName: "포켓몬 포켓 카드 도감",
    locale: "ko_KR",
    alternateLocale: ["en_US", "ja_JP"],
    type: "website",
    images: [
      {
        url: "/etc/card_case.png",
        width: 1200,
        height: 630,
        alt: "포켓몬 포켓 카드 도감 | Pokemon TCG Pocket Card Database",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "포켓몬 포켓 카드 도감 | Pokemon TCG Pocket Card Database",
    description:
      "포켓몬 포켓 전체 카드 목록과 덱 빌더. Complete Pokemon TCG Pocket card list and deck builder.",
    images: ["/etc/card_case.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: SITE_URL,
    languages: {
      ko: SITE_URL,
      en: SITE_URL,
      ja: SITE_URL,
      "x-default": SITE_URL,
    },
  },
  verification: {
    google: "hc1c9RVmbN3VqliJ2JehuDGvCAdI71xCFk_qcH6TPyA",
  },
  other: {
    "naver-site-verification": "81b968eb499267be642fd1eba746f7c02fb1e11c",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-P4NX7BH2');`,
          }}
        />
        {/* End Google Tag Manager */}
        {/* JSON-LD 구조화 데이터 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "포켓몬 포켓 카드 도감",
              alternateName: [
                "Pokemon TCG Pocket Card Database",
                "PTCGP Card Dex",
                "ポケモンポケット カードデックス",
              ],
              url: SITE_URL,
              description:
                "포켓몬 포켓(Pokémon TCG Pocket) 전체 카드 목록, 덱 빌더, 카드 검색. Complete Pokemon TCG Pocket card list, deck builder and card search.",
              inLanguage: ["ko", "en", "ja"],
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: `${SITE_URL}?q={search_term_string}`,
                },
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        {/* 다크 모드 FOUC 방지: 페인트 전에 클래스 적용 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(t===null&&d)){document.documentElement.classList.add('dark')}}catch(e){}})()`,
          }}
        />
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-P4NX7BH2"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        <LangProvider>
          <NavHeader />
          {children}
          <footer className="mt-auto border-t border-slate-200 dark:border-slate-700 py-4 text-center text-xs text-slate-400 dark:text-slate-500">
            광고 및 문의:{" "}
            <a
              href="mailto:kkojimo20@gmail.com"
              className="hover:text-slate-600 dark:hover:text-slate-300 underline underline-offset-2"
            >
              kkojimo20@gmail.com
            </a>
          </footer>
        </LangProvider>
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-LQFQLEM3NJ"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-LQFQLEM3NJ');
          `}
        </Script>
        {/* End Google Analytics */}
      </body>
    </html>
  );
}
