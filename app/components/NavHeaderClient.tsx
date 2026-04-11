"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { signIn, signOut } from "next-auth/react";
import type { Session } from "next-auth";

const NAV_ITEMS = [
  { label: "카드 리스트", href: "/" },
  { label: "덱 빌더", href: "/deck-builder" },
];

interface Props {
  session: Session | null;
}

export default function NavHeaderClient({ session }: Props) {
  const pathname = usePathname();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = saved === "dark" || (!saved && prefersDark);
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 transition-colors">
      <div className="w-full px-3 md:px-6 h-12 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 md:gap-4 min-w-0">
          <span className="text-sm md:text-base font-bold tracking-tight text-slate-800 dark:text-slate-100 shrink-0">PPCardList</span>
          <nav className="flex items-center gap-0.5 md:gap-1">
            {NAV_ITEMS.map(({ label, href }) => {
              const active = pathname === href;
              return (
                <a
                  key={href}
                  href={href}
                  className={`px-2 md:px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-colors whitespace-nowrap ${
                    active
                      ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  {label}
                </a>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* 다크 모드 토글 */}
          <button
            onClick={toggleDark}
            className="px-2 md:px-3 py-1.5 rounded-lg text-xs md:text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            {dark ? "☀️" : "🌙"}
            <span className="hidden sm:inline ml-1">{dark ? "라이트" : "다크"}</span>
          </button>

          {/* 로그인 / 사용자 정보 */}
          {session?.user ? (
            <div className="flex items-center gap-2">
              {session.user.image && (
                <img
                  src={session.user.image}
                  alt={session.user.name ?? "user"}
                  className="w-7 h-7 rounded-full border border-slate-200 dark:border-slate-700"
                />
              )}
              <span className="hidden sm:inline text-xs text-slate-600 dark:text-slate-300 max-w-[100px] truncate">
                {session.user.name}
              </span>
              <button
                onClick={() => signOut()}
                className="px-2 md:px-3 py-1.5 rounded-lg text-xs md:text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 transition-colors"
              >
                로그아웃
              </button>
            </div>
          ) : (
            <button
              onClick={() => signIn("google")}
              className="px-2 md:px-3 py-1.5 rounded-lg text-xs md:text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors"
            >
              Google 로그인
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
