import { average, clamp, variance } from "../utils/math.js";
import type {
  HumanityVerification,
  VerifyGameResult,
} from "../types/humanity.js";

const REQUIRED_GAME_TYPES = new Set([
  "signal_catch",
  "sequence_memory",
  "path_trace",
  "pattern_shift",
]);

function normalizeNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function normalizeResult(result: VerifyGameResult): VerifyGameResult {
  const humanityScore = clamp(
    Math.round(normalizeNumber(result.humanityScore)),
    0,
    100
  );

  const accuracy =
    typeof result.accuracy === "number"
      ? clamp(Number(result.accuracy.toFixed(2)), 0, 1)
      : undefined;

  const reactionVariance =
    typeof result.reactionVariance === "number"
      ? Math.max(0, Math.round(result.reactionVariance))
      : undefined;

  return {
    ...result,
    humanityScore,
    accuracy,
    reactionVariance,
  };
}

function validateGameSet(results: VerifyGameResult[]) {
  const found = new Set(results.map((result) => result.gameType));

  const missing = [...REQUIRED_GAME_TYPES].filter(
    (gameType) => !found.has(gameType as VerifyGameResult["gameType"])
  );

  return { found, missing };
}

export function computeHumanityVerification(input: {
  challengeId: string;
  wallet?: string;
  results: VerifyGameResult[];
}): HumanityVerification {
  const results = input.results.map(normalizeResult);
  const { missing } = validateGameSet(results);

  const scores = results.map((result) => result.humanityScore);

  const accuracies = results
    .map((result) => result.accuracy)
    .filter((value): value is number => typeof value === "number");

  const reactionVariances = results
    .map((result) => result.reactionVariance)
    .filter((value): value is number => typeof value === "number");

  const averageHumanityScore = Math.round(average(scores));
  const averageAccuracy = Number(average(accuracies).toFixed(2));
  const accuracyVariance = Number(variance(accuracies).toFixed(4));
  const scoreVariance = Math.round(variance(scores));
  const averageReactionVariance = Math.round(average(reactionVariances));

  const gamesPassed = results.filter(
    (result) => result.humanityScore >= 65
  ).length;

  const extremelyHighAccuracy =
    accuracies.length >= 3 && accuracies.every((accuracy) => accuracy >= 0.95);

  const lowAccuracyVariance =
    accuracies.length >= 3 && accuracyVariance < 0.002;

  const lowScoreVariance = scoreVariance < 15;

  const lowReactionVariance =
    reactionVariances.length >= 2 && averageReactionVariance < 120_000;

  const roboticConsistency =
    extremelyHighAccuracy && lowAccuracyVariance && lowReactionVariance;

  let botRiskScore = 0;

  if (roboticConsistency) {
    botRiskScore += 50;
  }

  if (extremelyHighAccuracy && lowAccuracyVariance) {
    botRiskScore += 10;
  }

  if (lowReactionVariance) {
    botRiskScore += 10;
  }

  if (lowScoreVariance && extremelyHighAccuracy) {
    botRiskScore += 10;
  }

  if (missing.length > 0) {
    botRiskScore += 50;
  }

  botRiskScore = clamp(botRiskScore, 0, 100);

  const adjustedHumanityScore = clamp(
    averageHumanityScore - (roboticConsistency ? 15 : 0),
    0,
    100
  );

  const passed =
    missing.length === 0 &&
    gamesPassed >= 3 &&
    adjustedHumanityScore >= 65 &&
    !roboticConsistency;

  const confidenceLevel = !passed
    ? "unverified"
    : gamesPassed === REQUIRED_GAME_TYPES.size &&
      adjustedHumanityScore >= 90 &&
      botRiskScore <= 10
    ? "exceptional"
    : gamesPassed === REQUIRED_GAME_TYPES.size &&
      adjustedHumanityScore >= 80 &&
      botRiskScore <= 25
    ? "strong"
    : "verified";

  return {
    analyticsVersion: "humanity-engine-mvp-v1",
    challengeId: input.challengeId,
    wallet: input.wallet,
    passed,
    confidenceLevel,
    averageHumanityScore,
    adjustedHumanityScore,
    averageAccuracy,
    gamesPassed,
    totalGames: results.length,
    varianceAnalytics: {
      accuracyVariance,
      scoreVariance,
      averageReactionVariance,
    },
    botRiskSignals: {
      botRiskScore,
      extremelyHighAccuracy,
      lowAccuracyVariance,
      lowReactionVariance,
      lowScoreVariance,
      roboticConsistency,
      reason: roboticConsistency
        ? "The attempt was highly accurate with unusually low timing variance across multiple signals."
        : missing.length > 0
        ? `Missing required game results: ${missing.join(", ")}.`
        : "No strong robotic consistency pattern detected.",
    },
    results,
  };
}
