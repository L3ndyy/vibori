"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  Unlock,
  RotateCcw,
  Download,
  Eye,
  AlertTriangle,
  Check,
  Loader2,
  Bot,
  ArrowLeft,
  Users,
  Vote,
  Sparkles,
} from "lucide-react";
import { VoterRecord } from "@/lib/storage";
import { STUDENTS_LIST } from "@/data/students";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [logs, setLogs] = useState<VoterRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [botUsername, setBotUsername] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("starosta_bot_username") || "vibori123bot";
    }
    return "vibori123bot";
  });

  const [selectedBoostCandidate, setSelectedBoostCandidate] = useState(STUDENTS_LIST[0]?.id || "");
  const [boostVotesMap, setBoostVotesMap] = useState<Record<string, number>>({});

  const fetchPollStatus = async () => {
    try {
      const res = await fetch(`/api/poll?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.state) {
          setIsClosed(data.state.isClosed);
        }
        if (data.boostVotes) {
          setBoostVotesMap(data.boostVotes);
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchPollStatus();
  }, []);

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
        fetchPollStatus();
      } else {
        setErrorMsg(data.error || "Неверный пароль администратора!");
      }
    } catch (e) {
      setErrorMsg("Ошибка подключения к серверу");
    } finally {
      setLoading(false);
    }
  };

  const handleBoost = async (delta: number) => {
    if (!selectedBoostCandidate) return;
    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password,
          action: "boost",
          payload: { candidateId: selectedBoostCandidate, delta },
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMsg(data.message);
        if (data.boostVotes) setBoostVotesMap(data.boostVotes);
        fetchPollStatus();
      } else {
        setErrorMsg(data.error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetBoosts = async () => {
    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, action: "reset_boosts" }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMsg("Вся накрутка успешна сброшена!");
        setBoostVotesMap({});
        fetchPollStatus();
      } else {
        setErrorMsg(data.error);
      }
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
        setIsClosed(!isClosed);
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
        setStatusMsg("Все голоса и накрутка успешно сброшены!");
        setLogs([]);
        setBoostVotesMap({});
        fetchPollStatus();
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
    link.setAttribute("download", `vibori_audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveBot = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = botUsername.replace(/^@/, "").trim();
    if (!clean) return;
    localStorage.setItem("starosta_bot_username", clean);
    setStatusMsg(`Имя бота сохранено: @${clean}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top navbar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition rounded-xl bg-slate-800/80 hover:bg-slate-800 px-3 py-2"
          >
            <ArrowLeft className="h-4 w-4" /> На главную
          </Link>
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <span className="font-extrabold text-sm tracking-tight text-white">
              Панель администратора выборов
            </span>
          </div>
        </div>

        <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-slate-800 text-slate-400 border border-slate-700/50">
          Скрытый доступ (/admin)
        </span>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8">
        {!isAuthenticated ? (
          <div className="max-w-md mx-auto my-12 rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-inner">
              <Lock className="h-8 w-8" />
            </div>
            <h2 className="mt-4 font-black text-xl text-white">
              Вход для организатора
            </h2>
            <p className="mt-1.5 text-xs text-slate-400">
              Введите пароль администратора для управления выборами и аудита
            </p>

            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              <input
                type="password"
                placeholder="Пароль администратора"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-800/80 p-3.5 text-center text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                autoFocus
              />

              {errorMsg && (
                <div className="rounded-xl bg-rose-950/60 border border-rose-800/60 p-3 text-xs font-bold text-rose-300">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !password}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3.5 text-xs font-extrabold text-white shadow-lg shadow-indigo-600/30 transition hover:brightness-110 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Войти в систему"}
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in">
            {/* Status alerts */}
            {statusMsg && (
              <div className="flex items-center gap-2 rounded-2xl border border-emerald-800/60 bg-emerald-950/60 p-4 text-xs font-bold text-emerald-300">
                <Check className="h-4 w-4 shrink-0" />
                <span>{statusMsg}</span>
              </div>
            )}
            {errorMsg && (
              <div className="flex items-center gap-2 rounded-2xl border border-rose-800/60 bg-rose-950/60 p-4 text-xs font-bold text-rose-300">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Controls cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Poll status switch */}
              <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Статус выборов
                  </span>
                  <h3 className="mt-1 font-black text-lg text-white">
                    {isClosed ? "Голосование закрыто" : "Голосование активно"}
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">
                    {isClosed
                      ? "Студенты не могут отправлять голоса. Результаты зафиксированы."
                      : "Студенты могут авторизоваться и отдавать голоса."}
                  </p>
                </div>

                <button
                  onClick={handleTogglePoll}
                  disabled={loading}
                  className={`mt-6 flex items-center justify-center gap-2 rounded-2xl py-3 px-4 text-xs font-black text-white shadow-lg transition hover:brightness-110 ${
                    isClosed
                      ? "bg-emerald-600 shadow-emerald-600/30"
                      : "bg-amber-600 shadow-amber-600/30"
                  }`}
                >
                  {isClosed ? (
                    <>
                      <Unlock className="h-4 w-4" /> Возобновить голосование
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" /> Закрыть голосование
                    </>
                  )}
                </button>
              </div>

              {/* Bot settings */}
              <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Настройки бота
                  </span>
                  <h3 className="mt-1 font-black text-lg text-white flex items-center gap-2">
                    <Bot className="h-5 w-5 text-sky-400" /> Telegram бот
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">
                    Официальный бот для авторизации и WebApp выборов:
                  </p>
                </div>

                <form onSubmit={handleSaveBot} className="mt-4 flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-3 text-xs font-bold text-slate-500">@</span>
                    <input
                      type="text"
                      value={botUsername}
                      onChange={(e) => setBotUsername(e.target.value)}
                      placeholder="vibori123bot"
                      className="w-full rounded-2xl border border-slate-700 bg-slate-800 py-2.5 pl-7 pr-3 text-xs font-bold text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="rounded-2xl bg-slate-800 hover:bg-slate-700 px-4 py-2.5 text-xs font-bold text-white border border-slate-700 transition"
                  >
                    Сохранить
                  </button>
                </form>
              </div>
            </div>

            {/* Boost / Fake Votes Card */}
            <div className="rounded-3xl border border-indigo-900/50 bg-slate-900/90 p-6 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-400" /> Шуточная накрутка / Тестовые голоса
                  </span>
                  <h3 className="mt-1 font-black text-lg text-white">
                    Добавить или убрать голоса
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Быстро поднимите или понизьте голоса любому кандидату (изменения сразу отобразятся в общей статистике)
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <select
                  value={selectedBoostCandidate}
                  onChange={(e) => setSelectedBoostCandidate(e.target.value)}
                  className="flex-1 rounded-2xl border border-slate-700 bg-slate-800 p-3 text-xs font-bold text-white outline-none focus:border-indigo-500"
                >
                  {STUDENTS_LIST.map((cand) => {
                    const currentBoost = boostVotesMap[cand.id] || 0;
                    return (
                      <option key={cand.id} value={cand.id}>
                        {cand.fullName} {currentBoost > 0 ? `(Накручено: +${currentBoost})` : ""}
                      </option>
                    );
                  })}
                </select>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleBoost(1)}
                    disabled={loading}
                    className="flex-1 sm:flex-none rounded-2xl bg-indigo-600 hover:bg-indigo-500 px-3.5 py-3 text-xs font-black text-white shadow-md transition"
                  >
                    +1 голос
                  </button>
                  <button
                    onClick={() => handleBoost(5)}
                    disabled={loading}
                    className="flex-1 sm:flex-none rounded-2xl bg-violet-600 hover:bg-violet-500 px-3.5 py-3 text-xs font-black text-white shadow-md transition"
                  >
                    +5 голосов
                  </button>
                  <button
                    onClick={() => handleBoost(-1)}
                    disabled={loading}
                    className="flex-1 sm:flex-none rounded-2xl bg-amber-700 hover:bg-amber-600 px-3.5 py-3 text-xs font-black text-white shadow-md transition"
                  >
                    -1 голос
                  </button>
                </div>
              </div>

              {Object.keys(boostVotesMap).length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex flex-wrap gap-2 text-slate-300">
                    <span className="font-bold text-slate-400">Активная накрутка:</span>
                    {Object.entries(boostVotesMap).map(([cid, count]) => {
                      const cand = STUDENTS_LIST.find((s) => s.id === cid);
                      return (
                        <span key={cid} className="px-2 py-0.5 rounded-lg bg-indigo-950/80 border border-indigo-800/60 font-semibold text-indigo-300">
                          {cand?.shortName || cid}: +{count}
                        </span>
                      );
                    })}
                  </div>
                  <button
                    onClick={handleResetBoosts}
                    disabled={loading}
                    className="text-rose-400 hover:text-rose-300 font-bold underline transition shrink-0 ml-2"
                  >
                    Сбросить всю накрутку
                  </button>
                </div>
              )}
            </div>

            {/* Danger & Export Actions */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h4 className="font-extrabold text-white text-sm">
                  Аудит и экспорт протокола
                </h4>
                <p className="text-xs text-slate-400">
                  Всего записей в базе данных: <strong>{logs.length}</strong>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleExportCSV}
                  disabled={logs.length === 0}
                  className="flex items-center gap-2 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 px-4 py-2.5 text-xs font-bold text-indigo-300 hover:bg-indigo-600/30 transition disabled:opacity-40"
                >
                  <Download className="h-4 w-4" /> Выгрузить CSV
                </button>
                <button
                  onClick={handleReset}
                  disabled={loading}
                  className="flex items-center gap-2 rounded-2xl bg-rose-950/40 border border-rose-800/50 px-4 py-2.5 text-xs font-bold text-rose-300 hover:bg-rose-900/60 transition"
                >
                  <RotateCcw className="h-4 w-4" /> Обнулить голоса
                </button>
              </div>
            </div>

            {/* Audit Logs Table */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl">
              <div className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                  <Eye className="h-4 w-4 text-indigo-400" /> Журнал аудита голосов (тайное голосование)
                </h3>
                <span className="text-xs text-slate-400 font-semibold">
                  {logs.length} проголосовавших
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                    <tr>
                      <th className="px-6 py-3">Время</th>
                      <th className="px-6 py-3">Telegram / Аккаунт</th>
                      <th className="px-6 py-3">Идентифицированный студент</th>
                      <th className="px-6 py-3">ID Кандидата</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                          Пока нет отданных голосов
                        </td>
                      </tr>
                    ) : (
                      logs.map((log, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40 transition">
                          <td className="px-6 py-3 text-slate-400 font-mono text-[11px]">
                            {new Date(log.votedAt).toLocaleTimeString("ru-RU", {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })}
                          </td>
                          <td className="px-6 py-3 font-semibold text-white">
                            {log.username ? `@${log.username}` : log.firstName || log.voterId}
                          </td>
                          <td className="px-6 py-3 font-bold text-indigo-300">
                            {log.studentName || "—"}
                          </td>
                          <td className="px-6 py-3 text-slate-400 font-mono text-[11px]">
                            {log.candidateId}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
