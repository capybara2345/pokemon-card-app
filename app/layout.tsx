import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavHeader from "./components/NavHeader";
import { LangProvider } from "./i18n/context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://pokemon-card-app-nine.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "포켓몬 포켓 카드 도감",
    template: "%s | 포켓몬 포켓 카드 도감",
  },
  description:
    "포켓몬 포켓(Pokémon TCG Pocket) 전체 카드 목록, 덱 빌더, 카드 검색. 타입·진화단계·확장팩별 필터와 추천 트레이너스 기능 지원.",
  keywords: [
    "포켓몬 포켓",
    "포켓몬 카드",
    "pokemon pocket",
    "PTCGP",
    "포켓몬 TCG 포켓",
    "포켓몬 덱",
    "덱 빌더",
    "카드 도감",
  ],
  openGraph: {
    title: "포켓몬 포켓 카드 도감",
    description:
      "포켓몬 포켓(Pokémon TCG Pocket) 전체 카드 목록과 덱 빌더. 타입·진화단계·확장팩별 필터 지원.",
    url: SITE_URL,
    siteName: "포켓몬 포켓 카드 도감",
    locale: "ko_KR",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: SITE_URL,
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
      <body suppressHydrationWarning className="min-h-full flex flex-col">
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
      </body>
    </html>
  );
}
