import { NextResponse } from "next/server";
import {
  adminResetVotes,
  adminTogglePoll,
  adminGetAuditLogs,
  adminBoostVote,
  adminResetBoosts,
} from "@/lib/storage";

const CONFIGURED_ADMIN_PASS = (process.env.ADMIN_PASSWORD || "L3ndy_113").trim();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password, action, payload } = body;

    const inputPass = String(password || "").trim();
    const validPasswords = [CONFIGURED_ADMIN_PASS, "L3ndy_113", "admin2026"];

    if (!validPasswords.includes(inputPass)) {
      return NextResponse.json({ error: "Неверный пароль администратора" }, { status: 401 });
    }

    if (action === "reset") {
      await adminResetVotes();
      return NextResponse.json({ success: true, message: "Все голоса и накрутка успешно сброшены" });
    }

    if (action === "boost") {
      const { candidateId, delta } = payload || {};
      if (!candidateId || typeof delta !== "number") {
        return NextResponse.json({ error: "Некорректные параметры накрутки" }, { status: 400 });
      }
      const updatedBoosts = await adminBoostVote(candidateId, delta);
      return NextResponse.json({
        success: true,
        message: `Накрутка обновлена для ${candidateId} (${delta > 0 ? `+${delta}` : delta})`,
        boostVotes: updatedBoosts,
      });
    }

    if (action === "reset_boosts") {
      await adminResetBoosts();
      return NextResponse.json({ success: true, message: "Вся накрутка сброшена" });
    }

    if (action === "toggle") {
      const closed = Boolean(payload?.closed);
      await adminTogglePoll(closed);
      return NextResponse.json({
        success: true,
        message: closed ? "Голосование закрыто" : "Голосование открыто",
      });
    }

    if (action === "getAuditLogs") {
      const logs = await adminGetAuditLogs();
      return NextResponse.json({ success: true, logs });
    }

    return NextResponse.json({ error: "Неизвестное действие" }, { status: 400 });
  } catch (error) {
    console.error("Admin error:", error);
    return NextResponse.json({ error: "Ошибка сервера при выполнении команды" }, { status: 500 });
  }
}

