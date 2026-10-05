"use client";

import React, { useState, useEffect } from "react";
import { Send, User, X, Check, ShieldCheck, AlertCircle, Sparkles, ExternalLink } from "lucide-react";
import { STUDENTS_LIST } from "@/data/students";
import { VoterUser } from "./UserBar";
import { TelegramLoginWidget } from "./TelegramLoginWidget";
import { playClickSound } from "@/lib/sound";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: VoterUser) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [selectedStudent, setSelectedStudent] = useState(STUDENTS_LIST[0].fullName);
  const [isTelegramWebAppDetected, setIsTelegramWebAppDetected] = useState(false);
  const [detectedTgUser, setDetectedTgUser] = useState<any>(null);

  // Check if running inside Telegram WebApp
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).Telegram?.WebApp) {
      const tg = (window as any).Telegram.WebApp;
      const user = tg.initDataUnsafe?.user;
      if (user) {
        setIsTelegramWebAppDetected(true);
        setDetectedTgUser(user);
      }
    }
  }, []);

  if (!isOpen) return null;

  // Handler for official Telegram Widget callback
  const handleTelegramAuth = (user: any) => {
    playClickSound();
    const cleanUser = user.username || `${user.first_name || ""} ${user.last_name || ""}`.trim();
    onLogin({
      id: `tg_${user.id}`,
      name: user.username ? `@${user.username}` : cleanUser,
      username: user.username,
      isTelegram: true,
      telegramData: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        photo_url: user.photo_url,
        auth_date: user.auth_date,
        hash: user.hash,
      },
    });
    onClose();
  };

  const handleApproveTgWebApp = () => {
    if (!detectedTgUser) return;
    handleTelegramAuth(detectedTgUser);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:p-7">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-md shadow-sky-500/25">
              <Send className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                Вход через Telegram
              </h3>
              <p className="text-xs text-slate-500">
                Официальная авторизация без ручного ввода
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-6">
          {/* If opened in Telegram WebApp */}
          {isTelegramWebAppDetected && detectedTgUser ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-center dark:border-emerald-900/60 dark:bg-emerald-950/30">
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                <Sparkles className="h-4 w-4" /> Telegram обнаружен
              </span>
              <p className="mt-1 text-sm font-extrabold text-slate-900 dark:text-white">
                {detectedTgUser.first_name} {detectedTgUser.last_name || ""} {detectedTgUser.username ? `(@${detectedTgUser.username})` : ""}
              </p>
              <button
                onClick={handleApproveTgWebApp}
                className="mt-3 w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow hover:bg-emerald-700"
              >
                Разрешить вход и подтянуть профиль
              </button>
            </div>
          ) : (
            <>
              {/* Official Telegram Widget */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5 text-center dark:border-slate-800 dark:bg-slate-800/40">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Официальный виджет Telegram
                </span>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                  Нажмите кнопку ниже. Telegram откроет окно и сам передаст ваше имя и юзернейм в систему выборов.
                </p>

                <div className="mt-4">
                  <TelegramLoginWidget onAuth={handleTelegramAuth} />
                </div>
              </div>
            </>
          )}

          {/* Security guarantee */}
          <div className="flex items-start gap-2.5 rounded-2xl bg-indigo-50/70 p-3.5 text-xs text-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300">
            <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-indigo-600 dark:text-indigo-400" />
            <span>
              <strong>Честные выборы:</strong> Нельзя ввести чужой никнейм вручную. Каждый студент подтверждает свой реальный Telegram в официальном окне Telegram.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
