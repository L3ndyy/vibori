import { neon } from "@neondatabase/serverless";
import fs from "fs";
import path from "path";
import { STUDENTS_LIST } from "@/data/students";

export interface VoterRecord {
  voterId: string; // telegram_id or unique student token
  username?: string;
  firstName?: string;
  lastName?: string;
  studentName?: string; // which student they registered as (if linked)
  deviceId?: string; // device fingerprint to prevent device reuse
  candidateId: string;
  votedAt: string;
}

export interface PollState {
  isClosed: boolean;
  secretBallot: boolean;
  votes: Record<string, number>; // candidateId -> count
  votersCount: number;
  totalStudents: number;
}

// In-memory fallback
interface LocalDbSchema {
  voters: Record<string, VoterRecord>;
  votes: Record<string, number>;
  isClosed: boolean;
  secretBallot: boolean;
}

const LOCAL_FILE_PATH = path.join(process.cwd(), ".votes_cache.json");

let memoryState: LocalDbSchema = {
  voters: {},
  votes: Object.fromEntries(STUDENTS_LIST.map((s) => [s.id, 0])),
  isClosed: false,
  secretBallot: true,
};

try {
  if (fs.existsSync(LOCAL_FILE_PATH)) {
    const raw = fs.readFileSync(LOCAL_FILE_PATH, "utf-8");
    memoryState = JSON.parse(raw);
  }
} catch (e) {}

function saveLocalState() {
  try {
    fs.writeFileSync(LOCAL_FILE_PATH, JSON.stringify(memoryState, null, 2), "utf-8");
  } catch (e) {}
}

function getDatabaseClient() {
  const rawUrl =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL;
  if (rawUrl) {
    const cleanUrl = rawUrl.trim().replace(/^"|"$/g, "");
    console.log(`[DB] Connected with URL prefix: ${cleanUrl.slice(0, 35)}... host: ${cleanUrl.split('@')[1]?.split('/')[0]}`);
    return neon(cleanUrl);
  }
  console.warn("⚠️ getDatabaseClient: NO DATABASE_URL found in environment! Available keys:", Object.keys(process.env).filter(k => k.includes("POSTGRES") || k.includes("DATABASE") || k.includes("NEON")));
  return null;
}

let tableInitialized = false;

async function ensureTable(sql: any) {
  if (tableInitialized) return;
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS votes_voters (
        voter_id VARCHAR(255) PRIMARY KEY,
        username VARCHAR(255),
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        student_name VARCHAR(255),
        device_id VARCHAR(255),
        candidate_id VARCHAR(255) NOT NULL,
        voted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS votes_settings (
        key VARCHAR(50) PRIMARY KEY,
        value TEXT NOT NULL
      );
    `;
    tableInitialized = true;
  } catch (e) {
    console.error("Failed to initialize database tables:", e);
  }
}

export async function getPollState(voterId?: string): Promise<{
  state: PollState;
  hasUserVoted: boolean;
  userVote?: string | null;
  votedStudents: string[];
}> {
  const sql = getDatabaseClient();

  if (sql) {
    try {
      await ensureTable(sql);

      const rawVoterId = voterId ? voterId.trim() : "";
      const tgPrefixed = rawVoterId.startsWith("tg_") ? rawVoterId : `tg_${rawVoterId}`;
      const numericId = rawVoterId.replace(/^tg_/, "");

      const votersRows = await sql`SELECT voter_id, username, first_name, student_name, candidate_id FROM votes_voters`;
      const settingsRows = await sql`SELECT key, value FROM votes_settings`;
      const userRow = rawVoterId
        ? await sql`
            SELECT candidate_id FROM votes_voters 
            WHERE voter_id = ${rawVoterId} 
               OR voter_id = ${tgPrefixed} 
               OR voter_id = ${numericId}
               OR username = ${rawVoterId.replace(/^@/, "")}
            LIMIT 1
          `
        : [];

      console.log(`[DB] getPollState successfully queried DB: found ${votersRows.length} voters`);

      const votes: Record<string, number> = {};
      for (const student of STUDENTS_LIST) {
        votes[student.id] = 0;
      }

      const votedStudents: string[] = [];
      for (const row of votersRows) {
        if (votes[row.candidate_id] !== undefined) {
          votes[row.candidate_id] += 1;
        } else {
          votes[row.candidate_id] = 1;
        }
        if (row.student_name) votedStudents.push(row.student_name);
        else if (row.username) votedStudents.push(`@${row.username}`);
        else if (row.first_name) votedStudents.push(row.first_name);
      }

      let isClosed = false;
      let secretBallot = true;

      for (const s of settingsRows) {
        if (s.key === "isClosed") isClosed = s.value === "true";
        if (s.key === "secretBallot") secretBallot = s.value !== "false";
      }

      return {
        state: {
          isClosed,
          secretBallot,
          votes,
          votersCount: votersRows.length,
          totalStudents: STUDENTS_LIST.length,
        },
        hasUserVoted: userRow.length > 0,
        userVote: userRow.length > 0 ? userRow[0].candidate_id : null,
        votedStudents,
      };
    } catch (e) {
      console.error("Database query failed, falling back to local memory:", e);
    }
  }

  // Memory fallback
  const votes: Record<string, number> = {};
  for (const student of STUDENTS_LIST) {
    votes[student.id] = Number(memoryState.votes[student.id] || 0);
  }

  const userRecord = voterId ? memoryState.voters[voterId] : undefined;
  const votedStudents = Object.values(memoryState.voters).map(
    (v) => v.studentName || (v.username ? `@${v.username}` : v.firstName || "Студент")
  );

  return {
    state: {
      isClosed: memoryState.isClosed,
      secretBallot: memoryState.secretBallot,
      votes,
      votersCount: Object.keys(memoryState.voters).length,
      totalStudents: STUDENTS_LIST.length,
    },
    hasUserVoted: Boolean(userRecord),
    userVote: userRecord?.candidateId || null,
    votedStudents,
  };
}

export async function castVote(record: VoterRecord): Promise<{ success: boolean; error?: string }> {
  const sql = getDatabaseClient();

  if (sql) {
    try {
      await ensureTable(sql);

      // Check settings (isClosed)
      const settings = await sql`SELECT value FROM votes_settings WHERE key = 'isClosed' LIMIT 1`;
      if (settings.length > 0 && settings[0].value === "true") {
        return { success: false, error: "Голосование уже завершено!" };
      }

      // Check if voter already voted
      const existingVoter = await sql`SELECT voter_id FROM votes_voters WHERE voter_id = ${record.voterId} LIMIT 1`;
      if (existingVoter.length > 0) {
        return { success: false, error: "Вы уже проголосовали! Повторное голосование запрещено." };
      }

      // Check studentName duplicate
      if (record.studentName) {
        const existingStudent = await sql`
          SELECT student_name FROM votes_voters 
          WHERE LOWER(student_name) = LOWER(${record.studentName}) 
          LIMIT 1
        `;
        if (existingStudent.length > 0) {
          return {
            success: false,
            error: `Голос от имени «${record.studentName}» уже был зарегистрирован!`,
          };
        }
      }

      // Check device duplicate
      if (record.deviceId) {
        const existingDevice = await sql`
          SELECT device_id FROM votes_voters 
          WHERE device_id = ${record.deviceId} 
          LIMIT 1
        `;
        if (existingDevice.length > 0) {
          return {
            success: false,
            error: "С вашего устройства (браузера) уже был отдан голос! Повторное голосование запрещено.",
          };
        }
      }

      // Insert record
      await sql`
        INSERT INTO votes_voters (
          voter_id, username, first_name, last_name, student_name, device_id, candidate_id, voted_at
        ) VALUES (
          ${record.voterId},
          ${record.username || null},
          ${record.firstName || null},
          ${record.lastName || null},
          ${record.studentName || null},
          ${record.deviceId || null},
          ${record.candidateId},
          ${record.votedAt}
        )
      `;

      return { success: true };
    } catch (e: any) {
      console.error("Database insert error:", e);
      return { success: false, error: "Ошибка базы данных при сохранении голоса." };
    }
  }

  // Local fallback
  if (memoryState.isClosed) {
    return { success: false, error: "Голосование уже завершено!" };
  }

  if (memoryState.voters[record.voterId]) {
    return { success: false, error: "Вы уже проголосовали! Повторное голосование запрещено." };
  }

  if (record.studentName || record.deviceId) {
    for (const v of Object.values(memoryState.voters)) {
      if (record.studentName && v.studentName && v.studentName.toLowerCase() === record.studentName.toLowerCase()) {
        return {
          success: false,
          error: `Голос от имени «${record.studentName}» уже был зарегистрирован!`,
        };
      }
      if (record.deviceId && v.deviceId && v.deviceId === record.deviceId) {
        return {
          success: false,
          error: "С вашего устройства (браузера) уже был отдан голос! Повторное голосование запрещено.",
        };
      }
    }
  }

  memoryState.voters[record.voterId] = record;
  memoryState.votes[record.candidateId] = (memoryState.votes[record.candidateId] || 0) + 1;
  saveLocalState();

  return { success: true };
}

export async function adminResetVotes(): Promise<void> {
  const sql = getDatabaseClient();
  if (sql) {
    try {
      await ensureTable(sql);
      await sql`DELETE FROM votes_voters`;
      return;
    } catch (e) {
      console.error("DB reset failed:", e);
    }
  }

  memoryState.voters = {};
  for (const s of STUDENTS_LIST) {
    memoryState.votes[s.id] = 0;
  }
  saveLocalState();
}

export async function adminTogglePoll(closed: boolean): Promise<void> {
  const sql = getDatabaseClient();
  if (sql) {
    try {
      await ensureTable(sql);
      await sql`
        INSERT INTO votes_settings (key, value)
        VALUES ('isClosed', ${String(closed)})
        ON CONFLICT (key) DO UPDATE SET value = ${String(closed)}
      `;
      return;
    } catch (e) {
      console.error("DB toggle failed:", e);
    }
  }

  memoryState.isClosed = closed;
  saveLocalState();
}

export async function adminGetAuditLogs(): Promise<VoterRecord[]> {
  const sql = getDatabaseClient();
  if (sql) {
    try {
      await ensureTable(sql);
      const rows = await sql`
        SELECT voter_id, username, first_name, last_name, student_name, device_id, candidate_id, voted_at
        FROM votes_voters
        ORDER BY voted_at DESC
      `;
      return rows.map((r) => ({
        voterId: r.voter_id,
        username: r.username || undefined,
        firstName: r.first_name || undefined,
        lastName: r.last_name || undefined,
        studentName: r.student_name || undefined,
        deviceId: r.device_id || undefined,
        candidateId: r.candidate_id,
        votedAt: r.voted_at,
      }));
    } catch (e) {
      console.error("DB audit logs failed:", e);
    }
  }

  return Object.values(memoryState.voters).sort(
    (a, b) => new Date(b.votedAt).getTime() - new Date(a.votedAt).getTime()
  );
}
