import { NextResponse } from "next/server";
import { adminResetVotes, adminTogglePoll, adminGetAuditLogs } from "@/lib/storage";

const DEFAULT_ADMIN_PASS = process.env.ADMIN_PASSWORD || "admin2026";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password, action, payload } = body;

    if (password !== DEFAULT_ADMIN_PASS) {
      return NextResponse.json({ error: "Неверный пароль администратора" }, { status: 401 });
    }

    if (action === "reset") {
      await adminResetVotes();
      return NextResponse.json({ success: true, message: "Все голоса успешно сброшены" });
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
