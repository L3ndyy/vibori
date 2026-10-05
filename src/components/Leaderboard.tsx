"use client";

import React, { useState } from "react";
import { STUDENTS_LIST } from "@/data/students";
import { Trophy, Crown, CheckCircle2, ArrowUpDown } from "lucide-react";
import { playClickSound } from "@/lib/sound";

interface LeaderboardProps {
  votes: Record<string, number>;
  totalVotes: number;
  votedStudents: string[];
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  votes,
  totalVotes,
  votedStudents,
}) => {
  const [sortBy, setSortBy] = useState<"votes" | "name">("votes");

  // Sort candidates
  const sorted = [...STUDENTS_LIST].sort((a, b) => {
    if (sortBy === "name") {
      return a.fullName.localeCompare(b.fullName);
    }
    const voteA = votes[a.id] || 0;
    const voteB = votes[b.id] || 0;
    if (voteB !== voteA) return voteB - voteA;
    return a.fullName.localeCompare(b.fullName);
  });

  // Top 3 candidates by votes
  const topByVotes = [...STUDENTS_LIST].sort((a, b) => (votes[b.id] || 0) - (votes[a.id] || 0));
  const top1 = topByVotes[0];
  const top2 = topByVotes[1];
  const top3 = topByVotes[2];

  const top1Votes = votes[top1.id] || 0;
  const top2Votes = votes[top2.id] || 0;
  const top3Votes = votes[top3.id] || 0;

  return (
    <div className="space-y-10">
      {/* 3D Olympic Podium */}
      {totalVotes > 0 && top1Votes > 0 ? (
        <div className="relative overflow-hidden rounded-3xl border border-indigo-100/90 bg-white/80 p-6 shadow-xl shadow-indigo-500/5 dark:border-slate-800 dark:bg-slate-900/90 sm:p-8">
          <div className="mb-10 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3.5 py-1 text-xs font-black text-amber-800 shadow-sm dark:bg-amber-950/70 dark:text-amber-300">
              <Trophy className="h-4 w-4" />
              Лидеры голосования
            </span>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              Пьедестал почёта
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Тройка студентов с наибольшим количеством голосов
            </p>
          </div>

          <div className="flex items-end justify-center gap-2 sm:gap-6 pt-4">
            {/* 2nd Place (Silver) */}
            <div className="flex w-28 sm:w-40 flex-col items-center">
              <div
                style={{ background: top2.bgGradient }}
                className="relative flex h-16 w-16 sm:h-18 sm:w-18 items-center justify-center rounded-2xl text-white font-black text-lg shadow-lg ring-4 ring-slate-300/50 dark:ring-slate-700"
              >
                {top2.initials}
                <div className="absolute -top-2.5 -right-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-xs font-black text-slate-800 shadow-md">
                  🥈
                </div>
              </div>
              <h4 className="mt-3 truncate w-full text-center text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                {top2.shortName}
              </h4>
              <span className="text-xs font-semibold tabular-numbers text-slate-500">
                {top2Votes} {top2Votes === 1 ? "голос" : "голоса"}
              </span>

              {/* Pedestal */}
              <div className="mt-3 flex h-28 sm:h-32 w-full flex-col items-center justify-center rounded-t-2xl bg-gradient-to-t from-slate-200 via-slate-150 to-slate-100 p-2 text-center shadow-inner dark:from-slate-800 dark:via-slate-750 dark:to-slate-700 border-t-2 border-slate-300 dark:border-slate-600">
                <span className="text-3xl font-black text-slate-400 dark:text-slate-500">
                  2
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Серебро
                </span>
              </div>
            </div>

            {/* 1st Place (Gold - Tallest) */}
            <div className="flex w-32 sm:w-48 flex-col items-center">
              <div className="relative">
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex items-center gap-1">
                  <Crown className="h-7 w-7 text-amber-500 animate-bounce-subtle drop-shadow-md" />
                </div>
                <div
                  style={{ background: top1.bgGradient }}
                  className="relative flex h-20 w-20 sm:h-22 sm:w-22 items-center justify-center rounded-2xl text-white text-2xl font-black shadow-2xl ring-4 ring-amber-400/50"
                >
                  {top1.initials}
                  <div className="absolute -top-2.5 -right-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 text-sm font-black text-slate-950 shadow-lg">
                    🥇
                  </div>
                </div>
              </div>
              <h4 className="mt-3 truncate w-full text-center text-sm sm:text-base font-black text-indigo-600 dark:text-indigo-400">
                {top1.shortName}
              </h4>
              <span className="text-xs font-bold tabular-numbers text-slate-700 dark:text-slate-300">
                {top1Votes} {top1Votes === 1 ? "голос" : "голосов"} ({Math.round((top1Votes / totalVotes) * 100)}%)
              </span>

              {/* Pedestal */}
              <div className="mt-3 flex h-36 sm:h-44 w-full flex-col items-center justify-center rounded-t-2xl bg-gradient-to-t from-amber-200 via-amber-100 to-amber-50 p-2 text-center shadow-lg dark:from-amber-950/80 dark:via-amber-900/50 dark:to-amber-800/40 border-t-2 border-amber-300">
                <span className="text-4xl font-black text-amber-600/90 dark:text-amber-400">
                  1
                </span>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Золото
                </span>
              </div>
            </div>

            {/* 3rd Place (Bronze) */}
            <div className="flex w-28 sm:w-40 flex-col items-center">
              <div
                style={{ background: top3.bgGradient }}
                className="relative flex h-16 w-16 sm:h-18 sm:w-18 items-center justify-center rounded-2xl text-white font-black text-lg shadow-lg ring-4 ring-amber-700/30"
              >
                {top3.initials}
                <div className="absolute -top-2.5 -right-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-amber-700 text-xs font-black text-white shadow-md">
                  🥉
                </div>
              </div>
              <h4 className="mt-3 truncate w-full text-center text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                {top3.shortName}
              </h4>
              <span className="text-xs font-semibold tabular-numbers text-slate-500">
                {top3Votes} {top3Votes === 1 ? "голос" : "голоса"}
              </span>

              {/* Pedestal */}
              <div className="mt-3 flex h-20 sm:h-24 w-full flex-col items-center justify-center rounded-t-2xl bg-gradient-to-t from-orange-200 via-orange-100 to-amber-50 p-2 text-center shadow-inner dark:from-stone-800 dark:via-stone-750 dark:to-stone-700 border-t-2 border-orange-300/60 dark:border-stone-600">
                <span className="text-2xl font-black text-amber-800/60 dark:text-amber-500">
                  3
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800/70 dark:text-amber-500">
                  Бронза
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/60 p-10 text-center dark:border-slate-800 dark:bg-slate-900/60">
          <Trophy className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
          <h3 className="mt-3 text-lg font-bold text-slate-700 dark:text-slate-300">
            Пьедестал формируется
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Как только студенты отдадут первые голоса, здесь появится 3D-пьедестал призеров!
          </p>
        </div>
      )}

      {/* Complete Rankings List */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              Все 21 кандидат в рейтинге
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Детальное распределение голосов всей группы
            </p>
          </div>

          <button
            onClick={() => {
              playClickSound();
              setSortBy(sortBy === "votes" ? "name" : "votes");
            }}
            className="inline-flex items-center gap-1.5 self-start rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 sm:self-auto"
          >
            <ArrowUpDown className="h-3.5 w-3.5 text-indigo-500" />
            Сортировка: {sortBy === "votes" ? "По голосам" : "По алфавиту"}
          </button>
        </div>

        <div className="mt-6 space-y-3">
          {sorted.map((student, idx) => {
            const count = votes[student.id] || 0;
            const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
            return (
              <div
                key={student.id}
                className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 transition hover:border-slate-200 hover:bg-white dark:border-slate-800 dark:bg-slate-900/80 dark:hover:bg-slate-800/80"
              >
                <div className="relative z-10 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-white text-xs font-black tabular-numbers text-slate-600 shadow-sm dark:bg-slate-800 dark:text-slate-300">
                      {idx + 1}
                    </span>
                    <div
                      style={{ background: student.bgGradient }}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white font-black text-xs shadow-sm"
                    >
                      {student.initials}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 text-sm dark:text-white">
                        {student.fullName}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-right">
                    <span className="text-xs font-bold tabular-numbers text-slate-400 dark:text-slate-500">
                      {pct}%
                    </span>
                    <span className="rounded-xl bg-white px-3 py-1 text-xs font-extrabold tabular-numbers text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white">
                      {count} {count === 1 ? "голос" : "голосов"}
                    </span>
                  </div>
                </div>

                {/* Animated fill progress bar */}
                <div
                  className="absolute bottom-0 left-0 top-0 -z-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 transition-all duration-700 ease-out"
                  style={{ width: `${pct}%` }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Turnout Verified Students Card */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              Список проголосовавших студентов
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Тайное голосование: подтверждает явку участников, сохраняя анонимность их выбора
            </p>
          </div>
          <span className="rounded-full bg-emerald-100 px-3.5 py-1 text-xs font-black text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            {votedStudents.length} проголосовали
          </span>
        </div>

        {votedStudents.length > 0 ? (
          <div className="mt-5 flex flex-wrap gap-2.5">
            {votedStudents.map((voter, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200/80 bg-emerald-50/80 px-3 py-1.5 text-xs font-bold text-emerald-900 shadow-sm dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                {voter}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-5 text-xs italic text-slate-400">
            Пока никто не проголосовал. Станьте первым!
          </p>
        )}
      </div>
    </div>
  );
};
