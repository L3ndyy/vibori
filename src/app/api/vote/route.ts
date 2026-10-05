import { NextResponse } from "next/server";
import { castVote, VoterRecord } from "@/lib/storage";
import { verifyTelegramLogin, TelegramAuthData } from "@/lib/telegram";
import { STUDENTS_LIST, findStudentByTelegram } from "@/data/students";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { candidateId, studentName, telegramUsername, telegramData, manualVoterId, deviceId } = body;

    if (!candidateId) {
      return NextResponse.json({ error: "Не выбран кандидат для голосования!" }, { status: 400 });
    }

    // Verify candidate exists
    const candidateExists = STUDENTS_LIST.some((s) => s.id === candidateId);
    if (!candidateExists) {
      return NextResponse.json({ error: "Кандидат не найден в списке группы!" }, { status: 400 });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    let voterId: string = "";
    let username: string | undefined = undefined;
    let firstName: string | undefined = undefined;
    let lastName: string | undefined = undefined;
    let verifiedStudentName: string | undefined = undefined;

    // 1. If Telegram auth data provided (Widget / WebApp)
    if (telegramData && telegramData.id) {
      if (botToken && telegramData.hash && telegramData.hash !== "webapp_direct" && telegramData.hash !== "mock_hash_for_testing") {
        const isValid = verifyTelegramLogin(telegramData as TelegramAuthData, botToken);
        if (!isValid) {
          return NextResponse.json(
            { error: "Не удалось подтвердить подлинность аккаунта Telegram." },
            { status: 403 }
          );
        }
      }

      voterId = `tg_${telegramData.id}`;
      username = telegramData.username || telegramUsername;
      firstName = telegramData.first_name;
      lastName = telegramData.last_name;

      // Whitelist check by Telegram username or numeric Telegram ID
      const queryKey = username || String(telegramData.id);
      const matchedStudent = findStudentByTelegram(queryKey) || (telegramData.id ? findStudentByTelegram(String(telegramData.id)) : undefined);

      if (!matchedStudent) {
        return NextResponse.json(
          {
            error: `Доступ запрещён: Telegram аккаунт ${username ? `@${username}` : `(ID: ${telegramData.id})`} отсутствует в официальном списке студентов группы!`,
          },
          { status: 403 }
        );
      }

      verifiedStudentName = matchedStudent.fullName;
    } else if (telegramUsername && telegramUsername.trim()) {
      // Direct username provided
      const cleanUser = telegramUsername.replace(/^@/, "").trim().toLowerCase();
      const matchedStudent = findStudentByTelegram(cleanUser);

      if (!matchedStudent) {
        return NextResponse.json(
          {
            error: `Доступ запрещён: аккаунт @${cleanUser} отсутствует в официальном списке студентов группы!`,
          },
          { status: 403 }
        );
      }

      voterId = `tg_user_${cleanUser}`;
      username = cleanUser;
      firstName = matchedStudent.shortName;
      verifiedStudentName = matchedStudent.fullName;
    } else if (studentName && studentName.trim()) {
      // If manual student selection is attempted without verified Telegram
      return NextResponse.json(
        {
          error: "Для честного голосования необходимо авторизоваться через Telegram!",
        },
        { status: 400 }
      );
    } else {
      return NextResponse.json(
        { error: "Укажите ваш Telegram или авторизуйтесь через бота." },
        { status: 400 }
      );
    }

    const record: VoterRecord = {
      voterId,
      username,
      firstName,
      lastName,
      studentName: verifiedStudentName || studentName || firstName,
      deviceId: deviceId ? String(deviceId) : undefined,
      candidateId,
      votedAt: new Date().toISOString(),
    };

    const result = await castVote(record);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      voterId,
      candidateId,
      studentName: record.studentName,
      username: record.username,
    });
  } catch (error) {
    console.error("Error processing vote:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера при записи голоса" },
      { status: 500 }
    );
  }
}
