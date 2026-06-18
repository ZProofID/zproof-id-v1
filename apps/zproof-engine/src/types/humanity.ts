export type GameType =
  | "signal_catch"
  | "sequence_memory"
  | "path_trace"
  | "pattern_shift";

export type GameConfig = {
  id: string;
  gameType: GameType;
  title: string;
  durationMs: number;
};

export type ChallengeRecord = {
  challengeId: string;
  wallet?: string;
  sessionId?: string;
  createdAt: number;
  expiresAt: number;
  used: boolean;
  games: GameConfig[];
};

export type VerifyGameResult = {
  challengeId: string;
  gameType: GameType;
  humanityScore: number;
  accuracy?: number;
  reactionVariance?: number;
  totalTimeMs?: number;
  [key: string]: unknown;
};

export type VarianceAnalytics = {
  accuracyVariance: number;
  scoreVariance: number;
  averageReactionVariance: number;
};

export type BotRiskSignals = {
  botRiskScore: number;
  extremelyHighAccuracy: boolean;
  lowAccuracyVariance: boolean;
  lowReactionVariance: boolean;
  lowScoreVariance: boolean;
  roboticConsistency: boolean;
  reason: string;
};

export type HumanityVerification = {
  analyticsVersion: string;
  challengeId: string;
  wallet?: string;
  passed: boolean;
  confidenceLevel: "unverified" | "verified" | "strong" | "exceptional";
  averageHumanityScore: number;
  adjustedHumanityScore: number;
  averageAccuracy: number;
  gamesPassed: number;
  totalGames: number;
  varianceAnalytics: VarianceAnalytics;
  botRiskSignals: BotRiskSignals;
  results: VerifyGameResult[];
};
