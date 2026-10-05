"use client";

import React, { useState } from "react";
import { ShieldCheck, Lock, Unlock, RotateCcw, Download, Eye, AlertTriangle, Check, Loader2, Bot } from "lucide-react";
import { VoterRecord } from "@/lib/storage";
import { STUDENTS_LIST } from "@/data/students";

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  isClosed: boolean;
  onRefresh: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  isClosed,
  onRefresh,
}) => {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [logs, setLogs] = useState<VoterRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [botUsername, setBotUsername] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("starosta_bot_username") || "vibori";
    }
    return "vibori";
  });

  const handleSaveBot = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = botUsername.replace(/^@/, "").trim();
    if (!clean) return;
    localStorage.setItem("starosta_bot_username", clean);
    setStatusMsg(`Имя бота сохранено: @${clean}`);
  };

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, action: "getAuditLogs" }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsAuthenticated(true);
        setLogs(data.logs || []);
      } else {
        setErrorMsg(data.error || "Неверный пароль администратора!");
      }
    } catch (e) {
      setErrorMsg("Ошибка подключения к серверу");
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePoll = async () => {
    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password,
          action: "toggle",
          payload: { closed: !isClosed },
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMsg(data.message);
        onRefresh();
      } else {
        setErrorMsg(data.error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    const ok = window.confirm(
      "ВНИМАНИЕ! Вы уверены, что хотите обнулить все голоса? Это действие необратимо."
    );
    if (!ok) return;

    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, action: "reset" }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMsg("Все голоса успешно сброшены!");
        setLogs([]);
        onRefresh();
      } else {
        setErrorMsg(data.error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (logs.length === 0) return;
    const headers = ["Время", "Voter ID", "Telegram/Имя", "Студент из списка", "ID Кандидата", "Кандидат"];
    const rows = logs.map((l) => {
      const cand = STUDENTS_LIST.find((s) => s.id === l.candidateId)?.fullName || l.candidateId;
      return [
        `"${new Date(l.votedAt).toLocaleString("ru-RU")}"`,
        `"${l.voterId}"`,
        `"${l.username ? `@${l.username}` : l.firstName || ""}"`,
        `"${l.studentName || ""}"`,
        `"${l.candidateId}"`,
        `"${cand}"`,
      ].join(",");
    });
    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `vibori_audit_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">
                Панель управления выборами
              </h3>
              <p className="text-xs text-slate-500">
                Контроль и аудит голосования
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!isAuthenticated ? (
            <form onSubmit={handleLogin} className="max-w-sm mx-auto py-8 text-center space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
                <Lock className="h-7 w-7" />
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-base">
                Вход для организатора
              </h4>
              <p className="text-xs text-slate-500">
                Введите пароль администратора (по умолчанию: <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">admin2026</code>)
              </p>

              <input
                type="password"
                placeholder="Пароль администратора"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-center text-sm outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-800"
                autoFocus
              />

              {errorMsg && (
                <p className="text-xs font-semibold text-rose-600">{errorMsg}</p>
              )}

              <button
                type="submit"
                disabled={loading || !password}
                className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? "Проверка..." : "Войти"}
              </button>
            </form>
          ) : (
            <>
              {statusMsg && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <Check className="h-4 w-4" />
                  {statusMsg}
                </div>
              )}

              {/* Telegram Bot Setting (Admin Only) */}
              <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-2 mb-1.5">
                  <Bot className="h-4 w-4 text-sky-500" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Имя Telegram-бота (@username)
                  </h4>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                  Укажите точный юзернейм вашего бота из @BotFather. Студенты будут переходить именно в него.
                </p>
                <form onSubmit={handleSaveBot} className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-xs font-bold text-slate-400">@</span>
                    <input
                      type="text"
                      placeholder="имя_вашего_бота"
                      value={botUsername}
                      onChange={(e) => setBotUsername(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-7 pr-3 text-xs outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <button
                    type="submit"
                    className="rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-sky-700 transition"
                  >
                    Сохранить
                  </button>
                  <a
                    href={`https://t.me/${botUsername.replace(/^@/, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 flex items-center"
                    title="Проверить в Telegram"
                  >
                    Открыть бота
                  </a>
                </form>
              </div>

              {/* Controls */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  onClick={handleTogglePoll}
                  disabled={loading}
                  className={`flex items-center justify-center gap-2 rounded-2xl border p-4 text-xs font-bold transition shadow-sm ${
                    isClosed
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
                  }`}
                >
                  {isClosed ? (
                    <>
                      <Unlock className="h-4 w-4" />
                      Возобновить голосование
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" />
                      Остановить голосование
                    </>
                  )}
                </button>

                <button
                  onClick={handleReset}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-700 hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300"
                >
                  <RotateCcw className="h-4 w-4" />
                  Сбросить все голоса (0)
                </button>
              </div>

              {/* Audit Table */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-indigo-500" />
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Журнал аудита ({logs.length})
                    </h4>
                  </div>
                  {logs.length > 0 && (
                    <button
                      onClick={handleExportCSV}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Экспорт CSV
                    </button>
                  )}
                </div>

                {logs.length === 0 ? (
                  <p className="text-xs italic text-slate-400 py-4 text-center">
                    Голосов пока нет
                  </p>
                ) : (
                  <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-100 text-xs dark:border-slate-800">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400 sticky top-0">
                        <tr>
                          <th className="p-2.5">Время</th>
                          <th className="p-2.5">Избиратель</th>
                          <th className="p-2.5">За кого отдан голос</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {logs.map((log, idx) => {
                          const cand = STUDENTS_LIST.find((s) => s.id === log.candidateId);
                          return (
                            <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                              <td className="p-2.5 text-slate-400 whitespace-nowrap">
                                {new Date(log.votedAt).toLocaleTimeString("ru-RU", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  second: "2-digit",
                                })}
                              </td>
                              <td className="p-2.5 font-medium text-slate-800 dark:text-slate-200">
                                {log.studentName || (log.username ? `@${log.username}` : log.firstName || log.voterId)}
                              </td>
                              <td className="p-2.5 font-semibold text-indigo-600 dark:text-indigo-400">
                                {cand ? cand.shortName : log.candidateId}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
