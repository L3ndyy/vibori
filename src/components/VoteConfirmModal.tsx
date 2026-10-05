import React, { useState, useEffect } from "react";
import { Student, STUDENTS_LIST, findStudentByTelegram } from "@/data/students";
import { VoterUser } from "./UserBar";
import { TelegramLoginWidget } from "./TelegramLoginWidget";
import { Vote, AlertCircle, ShieldAlert, CheckCircle, Loader2, Send, Lock, UserCheck } from "lucide-react";
import { playClickSound, playSuccessChime } from "@/lib/sound";

interface VoteConfirmModalProps {
  candidate: Student | null;
  currentUser: VoterUser | null;
  onLogin: (user: VoterUser) => void;
  onClose: () => void;
  onConfirm: (
    candidateId: string,
    studentName: string,
    telegramUser?: any
  ) => Promise<{ success: boolean; error?: string }>;
}

export const VoteConfirmModal: React.FC<VoteConfirmModalProps> = ({
  candidate,
  currentUser,
  onLogin,
  onClose,
  onConfirm,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-detect matching student from verified Telegram
  const matchedStudent = currentUser
    ? findStudentByTelegram(currentUser.username || "") ||
      (currentUser.telegramData?.id ? findStudentByTelegram(String(currentUser.telegramData.id)) : undefined)
    : undefined;

  const [selectedMyName, setSelectedMyName] = useState<string>(
    matchedStudent?.fullName || (currentUser?.name && !currentUser.isTelegram ? currentUser.name : STUDENTS_LIST[0].fullName)
  );

  useEffect(() => {
    if (matchedStudent) {
      setSelectedMyName(matchedStudent.fullName);
    }
  }, [matchedStudent]);

  if (!candidate) return null;

  // Handler for Telegram widget auth directly inside the vote modal
  const handleTelegramAuth = (tgUser: any) => {
    playClickSound();
    const cleanUser = tgUser.username || `${tgUser.first_name || ""} ${tgUser.last_name || ""}`.trim();
    const userObj: VoterUser = {
      id: `tg_${tgUser.id}`,
      name: tgUser.username ? `@${tgUser.username}` : cleanUser,
      username: tgUser.username,
      isTelegram: true,
      telegramData: {
        id: tgUser.id,
        first_name: tgUser.first_name,
        last_name: tgUser.last_name,
        username: tgUser.username,
        photo_url: tgUser.photo_url,
        auth_date: tgUser.auth_date,
        hash: tgUser.hash,
      },
    };
    onLogin(userObj);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setErrorMessage("Сначала необходимо подтвердить вход через Telegram!");
      return;
    }

    playClickSound();
    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await onConfirm(
      candidate.id,
      selectedMyName,
      currentUser.telegramData
    );
    setIsSubmitting(false);

    if (res.success) {
      playSuccessChime();
    } else {
      setErrorMessage(res.error || "Не удалось отправить голос.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        {/* Banner */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 text-white text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md shadow-inner ring-2 ring-white/30">
            <Vote className="h-7 w-7 text-white" />
          </div>
          <h2 className="mt-3 text-xl font-black tracking-tight">
            Голосование за старосту
          </h2>
          <p className="mt-1 text-xs text-indigo-100 font-medium">
            Официальные выборы с подтверждением через Telegram
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-7">
          {/* Chosen Candidate Box */}
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 dark:border-indigo-950/60 dark:bg-indigo-950/30">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Вы голосуете за:
            </span>
            <div className="mt-2.5 flex items-center gap-3.5">
              <div
                style={{ background: candidate.bgGradient }}
                className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl text-white font-black text-lg shadow-md"
              >
                {candidate.initials}
              </div>
              <div className="min-w-0">
                <h3 className="truncate font-extrabold text-slate-900 dark:text-white text-base">
                  {candidate.fullName}
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Кандидат группы
                </span>
              </div>
            </div>
          </div>

          {/* Telegram Identity Block */}
          <div className="mt-5 space-y-4">
            {currentUser && currentUser.isTelegram ? (
              /* Already authorized */
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3.5 dark:border-emerald-900/60 dark:bg-emerald-950/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm">
                      <CheckCircle className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                        Telegram подтверждён
                      </span>
                      <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                        {currentUser.name}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-200/80 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                    ID: {currentUser.telegramData?.id || "OK"}
                  </span>
                </div>
              </div>
            ) : (
              /* Need to authorize via Telegram */
              <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-4 text-center dark:border-sky-900/60 dark:bg-sky-950/30">
                <div className="flex items-center justify-center gap-2 text-sky-800 dark:text-sky-300 font-bold text-xs uppercase tracking-wider mb-2">
                  <Send className="h-4 w-4" />
                  Шаг 1: Подтвердите ваш Telegram
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">
                  Нажмите кнопку ниже. Telegram запросит разрешение и сам передаст ваш реальный профиль без ручного ввода.
                </p>
                <TelegramLoginWidget onAuth={handleTelegramAuth} />
              </div>
            )}

            {/* Student list selection or auto-detected badge */}
            {currentUser && matchedStudent ? (
              <div className="rounded-2xl border border-indigo-200 bg-indigo-50/80 p-3.5 dark:border-indigo-900/60 dark:bg-indigo-950/40">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
                    <UserCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                      Студент идентифицирован
                    </span>
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {matchedStudent.fullName}
                    </p>
                  </div>
                </div>
              </div>
            ) : currentUser && !matchedStudent ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-3.5 dark:border-rose-900/60 dark:bg-rose-950/40">
                <div className="flex items-start gap-2.5">
                  <ShieldAlert className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">
                      Аккаунт не найден в списке группы
                    </span>
                    <p className="text-xs text-rose-800 dark:text-rose-200 mt-0.5 font-medium">
                      Ваш Telegram ({currentUser.name}) не числится в официальном списке 20 студентов группы. Голосование заблокировано.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Шаг 2: Выберите себя из списка группы:
                </label>
                <select
                  value={selectedMyName}
                  onChange={(e) => setSelectedMyName(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold outline-none transition focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                >
                  {STUDENTS_LIST.map((s) => (
                    <option key={s.id} value={s.fullName}>
                      {s.fullName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-start gap-2.5 rounded-2xl bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <span>
                <strong>Защита от накрутки:</strong> Голос принимается строго один раз от вашего Telegram аккаунта и устройства.
              </span>
            </div>
          </div>

          {/* Error notice */}
          {errorMessage && (
            <div className="mt-4 flex items-center gap-2 rounded-2xl bg-rose-50 p-3 text-xs font-bold text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                playClickSound();
                onClose();
              }}
              disabled={isSubmitting}
              className="rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !currentUser || !matchedStudent}
              className={`flex items-center gap-2 rounded-2xl px-6 py-3 text-xs font-black text-white shadow-lg transition active:scale-95 ${
                currentUser && matchedStudent
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 shadow-indigo-600/30 hover:brightness-110 cursor-pointer"
                  : "bg-slate-300 text-slate-500 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Фиксация голоса...
                </>
              ) : !currentUser ? (
                <>
                  <Lock className="h-4 w-4" />
                  Сначала войдите в Telegram
                </>
              ) : !matchedStudent ? (
                <>
                  <Lock className="h-4 w-4" />
                  Вы не в списке группы
                </>
              ) : (
                <>
                  <Vote className="h-4 w-4" />
                  Подтвердить голос
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
