import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
      <head>
        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-P4NX7BH2');`,
          }}
        />
        {/* End Google Tag Manager */}
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
      </body>
    </html>
  );
}
