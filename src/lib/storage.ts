import { Redis } from "@upstash/redis";
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
  secretBallot: boolean; // if true, don't reveal who voted for whom publicly, only totals and turnout list
  votes: Record<string, number>; // candidateId -> count
  votersCount: number;
  totalStudents: number;
}

// In-memory fallback for local dev or when Redis is not yet configured
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

// Try loading local file if it exists
try {
  if (fs.existsSync(LOCAL_FILE_PATH)) {
    const raw = fs.readFileSync(LOCAL_FILE_PATH, "utf-8");
    memoryState = JSON.parse(raw);
  }
} catch (e) {
  // Ignore filesystem errors in serverless
}

function saveLocalState() {
  try {
    fs.writeFileSync(LOCAL_FILE_PATH, JSON.stringify(memoryState, null, 2), "utf-8");
  } catch (e) {
    // Ignore on read-only serverless filesystems
  }
}

// Check if Upstash Redis credentials are provided
function getRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (url && token) {
    return new Redis({ url, token });
  }
  return null;
}

const KEY_VOTERS = "starosta:voters";
const KEY_VOTES = "starosta:votes";
const KEY_SETTINGS = "starosta:settings";

export async function getPollState(voterId?: string): Promise<{
  state: PollState;
  hasUserVoted: boolean;
  userVote?: string | null;
  votedStudents: string[]; // names of people who participated
}> {
  const redis = getRedisClient();

  if (redis) {
    const [votesHash, settings, voterData, allVoters] = await Promise.all([
      redis.hgetall<Record<string, number>>(KEY_VOTES),
      redis.hgetall<{ isClosed?: string; secretBallot?: string }>(KEY_SETTINGS),
      voterId ? redis.hget<VoterRecord>(KEY_VOTERS, voterId) : null,
      redis.hgetall<Record<string, VoterRecord | string>>(KEY_VOTERS),
    ]);

    const votes: Record<string, number> = {};
    for (const student of STUDENTS_LIST) {
      votes[student.id] = Number(votesHash?.[student.id] || 0);
    }

    const isClosed = settings?.isClosed === "true";
    const secretBallot = settings?.secretBallot !== "false"; // default true

    const votedList: string[] = [];
    if (allVoters) {
      for (const val of Object.values(allVoters)) {
        try {
          const rec: VoterRecord = typeof val === "string" ? JSON.parse(val) : val;
          if (rec.studentName) votedList.push(rec.studentName);
          else if (rec.username) votedList.push(`@${rec.username}`);
          else if (rec.firstName) votedList.push(rec.firstName);
        } catch {
          // ignore parsing error
        }
      }
    }

    return {
      state: {
        isClosed,
        secretBallot,
        votes,
        votersCount: allVoters ? Object.keys(allVoters).length : 0,
        totalStudents: STUDENTS_LIST.length,
      },
      hasUserVoted: Boolean(voterData),
      userVote: voterData ? (typeof voterData === "string" ? JSON.parse(voterData).candidateId : voterData.candidateId) : null,
      votedStudents: votedList,
    };
  }

  // Fallback to local memory / JSON
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
  const redis = getRedisClient();

  if (redis) {
    const settings = await redis.hgetall<{ isClosed?: string }>(KEY_SETTINGS);
    if (settings?.isClosed === "true") {
      return { success: false, error: "Голосование уже завершено!" };
    }

    // Check if this voter already voted
    const existing = await redis.hexists(KEY_VOTERS, record.voterId);
    if (existing) {
      return { success: false, error: "Вы уже проголосовали! Повторное голосование запрещено." };
    }

    // Also check if the studentName was already used (if provided)
    // Also check if the studentName or deviceId was already used
    if (record.studentName || record.deviceId) {
      const allVoters = await redis.hgetall<Record<string, VoterRecord | string>>(KEY_VOTERS);
      if (allVoters) {
        for (const val of Object.values(allVoters)) {
          const rec: VoterRecord = typeof val === "string" ? JSON.parse(val) : val;
          if (record.studentName && rec.studentName && rec.studentName.toLowerCase() === record.studentName.toLowerCase()) {
            return {
              success: false,
              error: `Голос от имени «${record.studentName}» уже был зарегистрирован!`,
            };
          }
          if (record.deviceId && rec.deviceId && rec.deviceId === record.deviceId) {
            return {
              success: false,
              error: "С вашего устройства (браузера) уже был отдан голос! Повторное голосование запрещено.",
            };
          }
        }
      }
    }

    // Atomic transaction / pipeline
    const pipeline = redis.pipeline();
    pipeline.hset(KEY_VOTERS, { [record.voterId]: JSON.stringify(record) });
    pipeline.hincrby(KEY_VOTES, record.candidateId, 1);
    await pipeline.exec();

    return { success: true };
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
  const redis = getRedisClient();
  if (redis) {
    await redis.del(KEY_VOTERS);
    await redis.del(KEY_VOTES);
    await redis.del(KEY_SETTINGS);
  }
  memoryState = {
    voters: {},
    votes: Object.fromEntries(STUDENTS_LIST.map((s) => [s.id, 0])),
    isClosed: false,
    secretBallot: true,
  };
  saveLocalState();
}

export async function adminTogglePoll(closed: boolean): Promise<void> {
  const redis = getRedisClient();
  if (redis) {
    await redis.hset(KEY_SETTINGS, { isClosed: closed ? "true" : "false" });
  }
  memoryState.isClosed = closed;
  saveLocalState();
}

export async function adminGetAuditLogs(): Promise<VoterRecord[]> {
  const redis = getRedisClient();
  if (redis) {
    const all = await redis.hgetall<Record<string, VoterRecord | string>>(KEY_VOTERS);
    if (!all) return [];
    return Object.values(all).map((val) => (typeof val === "string" ? JSON.parse(val) : val));
  }
  return Object.values(memoryState.voters);
}
