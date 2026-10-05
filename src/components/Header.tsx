"use client";

import React from "react";
import { Vote, Users, ShieldCheck, Lock, BarChart3, Sun, Moon, Sparkles, Trophy } from "lucide-react";
import { playClickSound } from "@/lib/sound";

interface HeaderProps {
  votersCount: number;
  totalStudents: number;
  isClosed: boolean;
  activeTab: "candidates" | "results";
  setActiveTab: (tab: "candidates" | "results") => void;
  leaderName?: string;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  votersCount,
  totalStudents,
  isClosed,
  activeTab,
  setActiveTab,
  leaderName,
  isDark,
  onToggleTheme,
}) => {
  const percentage = Math.round((votersCount / totalStudents) * 100);

  return (
    <header className="relative w-full border-b border-slate-200/60 bg-white/70 backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-900/70">
      {/* Decorative ambient blurred blobs */}
      <div className="pointer-events-none absolute -top-32 left-1/4 -z-10 h-72 w-96 rounded-full bg-indigo-500/10 blur-[100px] dark:bg-indigo-600/15" />
      <div className="pointer-events-none absolute -top-32 right-1/4 -z-10 h-72 w-96 rounded-full bg-purple-500/10 blur-[100px] dark:bg-purple-600/15" />

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {/* Top bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 text-white shadow-xl shadow-indigo-500/25 ring-4 ring-indigo-500/10">
              <Vote className="h-6 w-6" />
              <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900">
                <Sparkles className="h-3 w-3 text-white" />
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-700/10 dark:bg-indigo-950/70 dark:text-indigo-300 dark:ring-indigo-400/20">
                  🎓 Академическая группа
                </span>
                {isClosed ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-bold text-rose-700 dark:bg-rose-950/70 dark:text-rose-300">
                    <Lock className="h-3 w-3" /> Завершено
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/80 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                    </span>
                    Идет голосование
                  </span>
                )}
              </div>

              <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                Выборы старосты группы
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Защищённое электронное волеизъявление студентов с проверкой через Telegram
              </p>
            </div>
          </div>

          {/* Quick Actions (Theme toggle) */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => {
                playClickSound();
                onToggleTheme();
              }}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 bg-white/80 text-slate-600 shadow-sm transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-700"
              title="Переключить тему оформления"
              aria-label="Theme toggle"
            >
              {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-600" />}
            </button>
          </div>
        </div>

        {/* 4 Interactive Stat Cards */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {/* Total voters card */}
          <div className="rounded-2xl border border-slate-200/70 bg-white/60 p-3.5 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-800/40">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <Users className="h-3.5 w-3.5 text-indigo-500" />
              Всего студентов
            </div>
            <div className="mt-1.5 text-xl font-extrabold text-slate-900 tabular-numbers dark:text-white">
              {totalStudents}
            </div>
          </div>

          {/* Turnout votes card */}
          <div className="rounded-2xl border border-slate-200/70 bg-white/60 p-3.5 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-800/40">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <Vote className="h-3.5 w-3.5 text-purple-500" />
              Отдано голосов
            </div>
            <div className="mt-1.5 text-xl font-extrabold text-indigo-600 tabular-numbers dark:text-indigo-400">
              {votersCount}
            </div>
          </div>

          {/* Turnout percent card */}
          <div className="rounded-2xl border border-slate-200/70 bg-white/60 p-3.5 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-800/40">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <BarChart3 className="h-3.5 w-3.5 text-emerald-500" />
              Явка группы
            </div>
            <div className="mt-1.5 text-xl font-extrabold text-slate-900 tabular-numbers dark:text-white">
              {percentage}%
            </div>
          </div>

          {/* Leader card */}
          <div className="rounded-2xl border border-slate-200/70 bg-white/60 p-3.5 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-800/40">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <Trophy className="h-3.5 w-3.5 text-amber-500" />
              Лидер гонки
            </div>
            <div className="mt-1.5 truncate text-sm font-extrabold text-amber-600 dark:text-amber-400">
              {leaderName || "Ожидание голосов"}
            </div>
          </div>
        </div>

        {/* Turnout progress bar */}
        <div className="mt-3 overflow-hidden rounded-full bg-slate-200/80 h-2 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-700 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Navigation Tabs */}
        <div className="mt-6 flex items-center gap-2 border-b border-slate-200/80 dark:border-slate-800/80">
          <button
            onClick={() => {
              playClickSound();
              setActiveTab("candidates");
            }}
            className={`relative flex items-center gap-2 px-5 py-3 text-sm font-bold transition-all ${
              activeTab === "candidates"
                ? "text-indigo-600 dark:text-indigo-400"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Кандидаты ({totalStudents})</span>
            {activeTab === "candidates" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
            )}
          </button>

          <button
            onClick={() => {
              playClickSound();
              setActiveTab("results");
            }}
            className={`relative flex items-center gap-2 px-5 py-3 text-sm font-bold transition-all ${
              activeTab === "results"
                ? "text-indigo-600 dark:text-indigo-400"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            <span>Результаты & Пьедестал</span>
            {votersCount > 0 && (
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                {votersCount}
              </span>
            )}
            {activeTab === "results" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
