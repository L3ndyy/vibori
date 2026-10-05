"use client";

import React from "react";
import { Send, CheckCircle2, User, LogOut, ShieldCheck } from "lucide-react";
import { playClickSound } from "@/lib/sound";

export interface VoterUser {
  id: string; // "tg_12345" or "student_hash"
  name: string;
  username?: string;
  isTelegram: boolean;
  telegramData?: any;
}

interface UserBarProps {
  currentUser: VoterUser | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  hasVoted: boolean;
  userVoteCandidateName?: string;
}

export const UserBar: React.FC<UserBarProps> = ({
  currentUser,
  onOpenAuth,
  onLogout,
  hasVoted,
  userVoteCandidateName,
}) => {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-5 sm:px-6">
      <div className="rounded-3xl border border-indigo-100/80 bg-white/80 p-5 shadow-lg shadow-indigo-500/5 backdrop-blur-xl dark:border-indigo-950/60 dark:bg-slate-900/80">
        {currentUser ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-black shadow-md shadow-indigo-500/25 ring-2 ring-white dark:ring-slate-800">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    {currentUser.name}
                  </span>
                  {currentUser.isTelegram ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-sky-100 px-2 py-0.5 text-[11px] font-bold text-sky-700 dark:bg-sky-950/60 dark:text-sky-300">
                      <Send className="h-3 w-3" /> Telegram
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-md bg-purple-100 px-2 py-0.5 text-[11px] font-bold text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                      <User className="h-3 w-3" /> Студент группы
                    </span>
                  )}
                </div>
                {hasVoted ? (
                  <p className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    <CheckCircle2 className="h-4 w-4" />
                    Ваш голос учтён {userVoteCandidateName ? `за: «${userVoteCandidateName}»` : ""}
                  </p>
                ) : (
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                    Голос ещё не отдан. Выберите кандидата из списка ниже.
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  playClickSound();
                  onLogout();
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <LogOut className="h-3.5 w-3.5" />
                Выйти
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3.5">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 shadow-sm dark:bg-indigo-950 dark:text-indigo-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Идентификация избирателя
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Для защиты от повторного голосования каждый голос привязывается к аккаунту Telegram или студенту.
                </p>
              </div>
            </div>

            <div>
              <button
                onClick={() => {
                  playClickSound();
                  onOpenAuth();
                }}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/25 transition-all hover:brightness-110 active:scale-95"
              >
                <Send className="h-3.5 w-3.5" />
                Авторизоваться через Telegram
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
