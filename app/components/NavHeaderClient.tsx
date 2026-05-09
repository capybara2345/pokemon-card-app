"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { signIn, signOut } from "next-auth/react";
import type { Session } from "next-auth";
import { useLanguage } from "../i18n/context";

interface Props {
  session: Session | null;
}

export default function NavHeaderClient({ session }: Props) {
  const pathname = usePathname();
  const [dark, setDark] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { lang, setLang, t } = useLanguage();

    const NAV_ITEMS = [
    { label: t.nav.cardList, href: "/" },
    { label: t.nav.deckBuilder, href: "/deck-builder" },
    { label: t.nav.tournamentDecks, href: "/tournament-decks" },
  ];

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = saved === "dark" || (!saved && prefersDark);
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  const toggleLang = () => setLang(lang === "ko" ? "en" : "ko");

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 transition-colors">
      <div className="w-full px-3 md:px-6 h-12 flex items-center justify-between gap-2">
        {/* 왼쪽: 로고 + 네비 */}
        <div className="flex items-center gap-2 md:gap-4 min-w-0">
          <span className="text-sm md:text-base font-bold tracking-tight text-slate-800 dark:text-slate-100 shrink-0">PPCardList</span>
          <nav className="flex items-center gap-0.5 md:gap-1">
            {NAV_ITEMS.map(({ label, href }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`px-2 md:px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-colors whitespace-nowrap ${
                    active
                      ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* 오른쪽: 유틸 버튼들 */}
        <div className="flex items-center gap-1 md:gap-2 shrink-0">
          {/* 언어 전환 - 항상 짧게 */}
          <button
            onClick={toggleLang}
            className="px-2 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            {t.lang.label}
          </button>

          {/* 다크 모드 토글 - 아이콘만 */}
          <button
            onClick={toggleDark}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm"
            title={dark ? t.theme.light : t.theme.dark}
          >
            {dark ? "☀️" : "🌙"}
          </button>

          {/* 로그인 / 사용자 */}
          {session?.user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-1.5 px-1.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {session.user.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name ?? "user"}
                    width={28}
                    height={28}
                    className="w-7 h-7 rounded-full border border-slate-200 dark:border-slate-700"
                  />
                ) : (
                  <span className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-300">
                    {session.user.name?.[0] ?? "U"}
                  </span>
                )}
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg py-1 z-50">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700">
                    <p className="text-xs font-medium text-slate-800 dark:text-slate-100 truncate">{session.user.name}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{session.user.email}</p>
                  </div>
                  <button
                    onClick={() => { setUserMenuOpen(false); signOut(); }}
                    className="w-full text-left px-3 py-2 text-xs text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    {t.auth.logout}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => signIn("google")}
              className="px-2 md:px-3 py-1.5 rounded-lg text-xs md:text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors"
            >
              {t.auth.login}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
