"use client";

import React from "react";
import { Student } from "@/data/students";
import { Check, Vote, Sparkles, TrendingUp } from "lucide-react";
import { playClickSound } from "@/lib/sound";

interface CandidateCardProps {
  candidate: Student;
  votes: number;
  totalVotes: number;
  isMyVote: boolean;
  canVote: boolean;
  isClosed: boolean;
  onSelectVote: (candidate: Student) => void;
}

export const CandidateCard: React.FC<CandidateCardProps> = ({
  candidate,
  votes,
  totalVotes,
  isMyVote,
  canVote,
  isClosed,
  onSelectVote,
}) => {
  const percent = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
  const nameParts = candidate.fullName.split(" ");
  const lastName = nameParts[0];
  const firstNameMiddle = nameParts.slice(1).join(" ");

  const handleVoteClick = () => {
    playClickSound();
    onSelectVote(candidate);
  };

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-3xl border transition-all duration-300 ${
        isMyVote
          ? "border-emerald-500/80 bg-gradient-to-b from-emerald-50/80 to-white shadow-xl shadow-emerald-500/10 ring-2 ring-emerald-500/30 dark:from-emerald-950/40 dark:to-slate-900 dark:border-emerald-500/60"
          : "border-slate-200/80 bg-white shadow-sm hover:-translate-y-1 hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-500/10 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-600"
      }`}
    >
      {/* Choice Badge */}
      {isMyVote && (
        <div className="absolute right-4 top-4 z-10 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-extrabold text-white shadow-md shadow-emerald-500/30">
          <Check className="h-3.5 w-3.5 stroke-[3]" />
          Ваш выбор
        </div>
      )}

      <div className="p-5 sm:p-6">
        {/* Candidate Avatar & Info */}
        <div className="flex items-center gap-4">
          <div
            style={{ background: candidate.bgGradient }}
            className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-xl font-black text-white shadow-lg transition-transform duration-300 group-hover:scale-105 ring-2 ring-white/80 dark:ring-slate-800"
          >
            {candidate.initials}
            {votes > 0 && (
              <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
                {votes}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Кандидат в старосты
            </span>
            <h3 className="truncate text-base font-extrabold text-slate-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400 sm:text-lg">
              {lastName}
            </h3>
            <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">
              {firstNameMiddle}
            </p>
          </div>
        </div>

        {/* Live support progress bar */}
        <div className="mt-5 rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/80 ring-1 ring-slate-100 dark:ring-slate-800">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 font-medium text-slate-500 dark:text-slate-400">
              <TrendingUp className="h-3 w-3 text-indigo-500" />
              Поддержка:
            </span>
            <div className="flex items-center gap-1.5 font-bold tabular-numbers text-slate-700 dark:text-slate-200">
              <span>{votes} {votes === 1 ? "голос" : votes >= 2 && votes <= 4 ? "голоса" : "голосов"}</span>
              <span className="text-slate-400 dark:text-slate-500">({percent}%)</span>
            </div>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200/70 dark:bg-slate-700">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${
                isMyVote
                  ? "bg-emerald-500"
                  : "bg-gradient-to-r from-indigo-500 to-purple-500"
              }`}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="border-t border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/95 rounded-b-3xl">
        {isClosed ? (
          <div className="py-1 text-center text-xs font-semibold text-slate-400">
            Голосование завершено
          </div>
        ) : isMyVote ? (
          <div className="flex items-center justify-center gap-1.5 py-1 text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
            <Sparkles className="h-4 w-4" />
            Вы отдали голос за этого кандидата
          </div>
        ) : (
          <button
            onClick={handleVoteClick}
            disabled={!canVote}
            className={`group/btn w-full rounded-2xl py-3 px-4 text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
              canVote
                ? "bg-slate-900 text-white hover:bg-gradient-to-r hover:from-indigo-600 hover:to-violet-600 shadow-md shadow-slate-900/10 hover:shadow-indigo-500/25 active:scale-[0.97] dark:bg-indigo-600 dark:text-white dark:hover:bg-indigo-500"
                : "bg-slate-200/70 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500"
            }`}
          >
            <Vote className="h-4 w-4 transition-transform group-hover/btn:scale-110" />
            <span>Голосовать за кандидата</span>
          </button>
        )}
      </div>
    </div>
  );
};
