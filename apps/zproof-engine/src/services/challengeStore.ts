import crypto from "node:crypto";
import { env } from "../config/env.js";
import type { ChallengeRecord, GameConfig } from "../types/humanity.js";

const challenges = new Map<string, ChallengeRecord>();

const defaultGames: GameConfig[] = [
  { id: "signal", gameType: "signal_catch", title: "Signal Catch", durationMs: 18_000 },
  { id: "sequence", gameType: "sequence_memory", title: "Sequence Memory", durationMs: 16_000 },
  { id: "path", gameType: "path_trace", title: "Path Trace", durationMs: 14_000 },
  { id: "pattern", gameType: "pattern_shift", title: "Pattern Shift", durationMs: 14_000 },
];

export function createChallenge(input: { wallet?: string; sessionId?: string }) {
  const challengeId = crypto.randomUUID();
  const now = Date.now();

  const record: ChallengeRecord = {
    challengeId,
    wallet: input.wallet,
    sessionId: input.sessionId,
    createdAt: now,
    expiresAt: now + env.CHALLENGE_TTL_MS,
    used: false,
    games: defaultGames,
  };

  challenges.set(challengeId, record);
  cleanupExpiredChallenges();
  return record;
}

export function getChallenge(challengeId: string) {
  return challenges.get(challengeId);
}

export function markChallengeUsed(challengeId: string) {
  const record = challenges.get(challengeId);
  if (!record) return;
  record.used = true;
  challenges.set(challengeId, record);
}

export function cleanupExpiredChallenges() {
  const now = Date.now();
  for (const [id, record] of challenges.entries()) {
    if (record.expiresAt < now - 60_000) challenges.delete(id);
  }
}
