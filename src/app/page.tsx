"use client";

import React, { useState, useEffect, useMemo } from "react";
import confetti from "canvas-confetti";
import { Search, AlertCircle, LayoutGrid, List, X, Flame } from "lucide-react";
import { STUDENTS_LIST, Student, TOTAL_STUDENTS_COUNT } from "@/data/students";
import { Header } from "@/components/Header";
import { UserBar, VoterUser } from "@/components/UserBar";
import { AuthModal } from "@/components/AuthModal";
import { CandidateCard } from "@/components/CandidateCard";
import { VoteConfirmModal } from "@/components/VoteConfirmModal";
import { Leaderboard } from "@/components/Leaderboard";
import { AdminModal } from "@/components/AdminModal";
import { playClickSound } from "@/lib/sound";

export default function Home() {
  const [currentUser, setCurrentUser] = useState<VoterUser | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"candidates" | "results">("candidates");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [onlyWithVotes, setOnlyWithVotes] = useState(false);

  const [votes, setVotes] = useState<Record<string, number>>({});
  const [isClosed, setIsClosed] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [userVoteCandidateId, setUserVoteCandidateId] = useState<string | null>(null);
  const [votedStudents, setVotedStudents] = useState<string[]>([]);
  const [votersCount, setVotersCount] = useState(0);

  const [selectedCandidateForVote, setSelectedCandidateForVote] = useState<Student | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // Theme setup
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("theme");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
        setIsDark(true);
        document.documentElement.classList.add("dark");
      } else {
        setIsDark(false);
        document.documentElement.classList.remove("dark");
      }
    } catch (e) {}
  }, []);

  const handleToggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
      return next;
    });
  };

  // Auto-detect Telegram WebApp on launch
  useEffect(() => {
    try {
      const saved = localStorage.getItem("starosta_user");
      if (saved) {
        setCurrentUser(JSON.parse(saved));
      }
    } catch (e) {}

    if (typeof window !== "undefined" && (window as any).Telegram?.WebApp) {
      const tg = (window as any).Telegram.WebApp;
      tg.ready();
      tg.expand();
      const tgUser = tg.initDataUnsafe?.user;
      if (tgUser) {
        const detectedUser: VoterUser = {
          id: `tg_${tgUser.id}`,
          name: tgUser.username ? `@${tgUser.username}` : `${tgUser.first_name} ${tgUser.last_name || ""}`.trim(),
          username: tgUser.username,
          isTelegram: true,
          telegramData: {
            id: tgUser.id,
            first_name: tgUser.first_name,
            last_name: tgUser.last_name,
            username: tgUser.username,
            photo_url: tgUser.photo_url,
            auth_date: Math.floor(Date.now() / 1000),
            hash: tg.initDataUnsafe?.hash || "webapp_direct",
          },
        };
        setCurrentUser(detectedUser);
        try {
          localStorage.setItem("starosta_user", JSON.stringify(detectedUser));
        } catch (e) {}
      }
    }
  }, []);

  // Fetch poll status
  const fetchPollStatus = async () => {
    try {
      const voterParam = currentUser?.id
        ? `?voterId=${encodeURIComponent(currentUser.id)}&t=${Date.now()}`
        : `?t=${Date.now()}`;
      const res = await fetch(`/api/poll${voterParam}`, {
        cache: "no-store",
        headers: { "Pragma": "no-cache", "Cache-Control": "no-cache" },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.state) {
        setVotes(data.state.votes || {});
        setIsClosed(data.state.isClosed);
        setVotersCount(data.state.votersCount || 0);
      }
      const userHasVoted = Boolean(data.hasUserVoted);
      setHasVoted(userHasVoted);
      setUserVoteCandidateId(userHasVoted ? data.userVote || null : null);

      if (data.votedStudents) {
        setVotedStudents(data.votedStudents);
      }
    } catch (e) {
      console.error("Error fetching poll data:", e);
    }
  };

  useEffect(() => {
    fetchPollStatus();
    const interval = setInterval(fetchPollStatus, 5000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Handle Login / Logout
  const handleLogin = (user: VoterUser) => {
    setCurrentUser(user);
    try {
      localStorage.setItem("starosta_user", JSON.stringify(user));
    } catch (e) {}
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setHasVoted(false);
    setUserVoteCandidateId(null);
    try {
      localStorage.removeItem("starosta_user");
    } catch (e) {}
  };

  // Handle vote submit
  const handleVoteSubmit = async (
    candidateId: string,
    studentName: string,
    telegramUser?: any
  ) => {
    try {
      // Retrieve or generate unique device fingerprint
      let deviceId = "";
      try {
        deviceId = localStorage.getItem("starosta_device_id") || "";
        if (!deviceId) {
          deviceId = "dev_" + Math.random().toString(36).substring(2, 12) + "_" + Date.now().toString(36);
          localStorage.setItem("starosta_device_id", deviceId);
        }
      } catch (e) {
        deviceId = "dev_" + Math.random().toString(36).substring(2, 10);
      }

      const payload: any = {
        candidateId,
        studentName,
        deviceId,
      };

      if (telegramUser) {
        payload.telegramData = telegramUser;
      } else if (currentUser?.telegramData) {
        payload.telegramData = currentUser.telegramData;
      } else if (currentUser?.username) {
        payload.telegramUsername = currentUser.username;
      } else if (currentUser?.id) {
        payload.manualVoterId = currentUser.id;
      }

      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Ошибка записи голоса" };
      }

      setHasVoted(true);
      setUserVoteCandidateId(candidateId);
      setSelectedCandidateForVote(null);

      // Confetti fireworks!
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 },
        colors: ["#6366f1", "#a855f7", "#ec4899", "#10b981", "#f59e0b"],
      });

      await fetchPollStatus();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: "Сетевая ошибка при отправке голоса" };
    }
  };

  // Leader computation
  const leader = useMemo(() => {
    let topCand: Student | null = null;
    let maxVotes = 0;
    for (const student of STUDENTS_LIST) {
      const count = votes[student.id] || 0;
      if (count > maxVotes) {
        maxVotes = count;
        topCand = student;
      }
    }
    return topCand ? topCand.shortName : undefined;
  }, [votes]);

  // Filter candidates by search & toggle, and sort by votes descending (top votes first)
  const filteredCandidates = useMemo(() => {
    let list = [...STUDENTS_LIST];
    if (onlyWithVotes) {
      list = list.filter((c) => (votes[c.id] || 0) > 0);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.fullName.toLowerCase().includes(query) ||
          c.shortName.toLowerCase().includes(query)
      );
    }

    // Sort: whoever has more votes is higher up. If tied, keep original order.
    return list.sort((a, b) => {
      const votesA = votes[a.id] || 0;
      const votesB = votes[b.id] || 0;
      if (votesB !== votesA) {
        return votesB - votesA;
      }
      return 0;
    });
  }, [searchQuery, onlyWithVotes, votes]);

  const userVoteCandidate = STUDENTS_LIST.find((s) => s.id === userVoteCandidateId);

  return (
    <div className="min-h-screen mesh-gradient-bg pb-24 text-slate-900 transition-colors duration-200 dark:text-slate-100">
      {/* Top Header */}
      <Header
        votersCount={votersCount}
        totalStudents={TOTAL_STUDENTS_COUNT}
        isClosed={isClosed}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        leaderName={leader}
        isDark={isDark}
        onToggleTheme={handleToggleTheme}
      />

      {/* Voter status bar */}
      <UserBar
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        hasVoted={hasVoted}
        userVoteCandidateName={userVoteCandidate?.fullName}
      />

      {/* Main Container */}
      <main className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
        {activeTab === "candidates" ? (
          <div>
            {/* Search, Filter & Layout bar */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Поиск по фамилии или имени..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200/90 bg-white/90 py-3 pl-11 pr-10 text-sm font-medium outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-900/90 dark:text-white"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* View options & filters */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    playClickSound();
                    setOnlyWithVotes(!onlyWithVotes);
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-2xl border px-3.5 py-2.5 text-xs font-bold transition shadow-sm ${
                    onlyWithVotes
                      ? "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
                      : "border-slate-200/80 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  <Flame className="h-3.5 w-3.5 text-amber-500" />
                  <span>Только с голосами</span>
                </button>

                <div className="hidden sm:flex items-center rounded-2xl border border-slate-200/80 bg-white p-1 dark:border-slate-800 dark:bg-slate-800">
                  <button
                    onClick={() => {
                      playClickSound();
                      setViewMode("grid");
                    }}
                    className={`rounded-xl p-1.5 transition ${
                      viewMode === "grid"
                        ? "bg-slate-100 text-indigo-600 dark:bg-slate-700 dark:text-indigo-400"
                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    }`}
                    title="Сетка"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      playClickSound();
                      setViewMode("list");
                    }}
                    className={`rounded-xl p-1.5 transition ${
                      viewMode === "list"
                        ? "bg-slate-100 text-indigo-600 dark:bg-slate-700 dark:text-indigo-400"
                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    }`}
                    title="Список"
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Candidate Grid or List */}
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                  : "grid grid-cols-1 gap-3 sm:grid-cols-2"
              }
            >
              {filteredCandidates.map((candidate) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  votes={votes[candidate.id] || 0}
                  totalVotes={votersCount}
                  isMyVote={userVoteCandidateId === candidate.id}
                  canVote={!isClosed && !hasVoted}
                  isClosed={isClosed}
                  onSelectVote={(cand) => setSelectedCandidateForVote(cand)}
                />
              ))}
            </div>

            {filteredCandidates.length === 0 && (
              <div className="py-20 text-center text-slate-400">
                <AlertCircle className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
                <h4 className="mt-3 text-base font-bold text-slate-700 dark:text-slate-300">
                  Кандидаты не найдены
                </h4>
                <p className="mt-1 text-xs">
                  Попробуйте очистить строку поиска или сбросить фильтр.
                </p>
              </div>
            )}
          </div>
        ) : (
          <Leaderboard
            votes={votes}
            totalVotes={votersCount}
            votedStudents={votedStudents}
          />
        )}
      </main>

      {/* Global Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLogin={handleLogin}
      />

      {/* Confirmation Modal */}
      {selectedCandidateForVote && (
        <VoteConfirmModal
          candidate={selectedCandidateForVote}
          currentUser={currentUser}
          onLogin={handleLogin}
          onClose={() => setSelectedCandidateForVote(null)}
          onConfirm={handleVoteSubmit}
        />
      )}

      {/* Admin Panel Modal */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        isClosed={isClosed}
        onRefresh={fetchPollStatus}
      />
    </div>
  );
}
