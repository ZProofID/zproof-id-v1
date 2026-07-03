import { Router } from "express";
import { z } from "zod";
import { getPublicKeyHex, signAttestation } from "../crypto/attestation.js";
import {
  createChallenge,
  getChallenge,
  markChallengeUsed,
} from "../services/challengeStore.js";
import { computeHumanityVerification } from "../services/humanityScoring.js";
import {
  createAndPrepareZProofV1,
  createAndVerifyZProofV1,
  submitAndVerifyZProofV1,
} from "../services/zk/zk.service.js";
import type { VerifyGameResult } from "../types/humanity.js";
import { HumanityVerification } from "../models/HumanityVerification.js";

export const humanityRouter = Router();

async function saveWalletVerificationRecord(params: {
  wallet: string;
  challengeId: string;
  verification: any;
  attestation: any;
  zkProof: any;
}) {
  const { wallet, challengeId, verification, attestation, zkProof } = params;

  return HumanityVerification.findOneAndUpdate(
    { wallet },
    {
      $inc: { verificationCount: 1 },

      $set: {
        latestChallengeId: challengeId,
        latestPassed: verification.passed,
        latestConfidenceLevel: verification.confidenceLevel,
        latestAdjustedHumanityScore: verification.adjustedHumanityScore,
        latestGamesPassed: verification.gamesPassed,
        latestTotalGames: verification.totalGames,
        latestBotRiskScore: verification.botRiskSignals?.botRiskScore,

        latestAttestation: attestation,
        latestZkProof: zkProof,
        latestResult: verification,

        lastVerifiedAt: new Date(),
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );
}

const createChallengeSchema = z.object({
  wallet: z.string().min(1).optional(),
  sessionId: z.string().min(1).optional(),
});

const gameResultSchema = z
  .object({
    challengeId: z.string().min(1),
    gameType: z.enum([
      "signal_catch",
      "sequence_memory",
      "path_trace",
      "pattern_shift",
    ]),
    humanityScore: z.number().min(0).max(100),
    accuracy: z.number().min(0).max(1).optional(),
    reactionVariance: z.number().min(0).optional(),
    totalTimeMs: z.number().min(0).optional(),
  })
  .passthrough();

const verifySchema = z.object({
  challengeId: z.string().min(1),
  wallet: z.string().min(1).optional(),
  results: z.array(gameResultSchema).min(1),
});
const submitVerifySchema = z.object({
  challengeId: z.string().min(1),
  wallet: z.string().min(1).optional(),
  signedXdr: z.string(),
  network: z.enum(["TESTNET", "PUBLIC"]),
  results: z.array(gameResultSchema).min(1),
});

humanityRouter.post("/challenges", (req, res) => {
  const parsed = createChallengeSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid request",
      details: parsed.error.flatten(),
    });
  }

  const challenge = createChallenge(parsed.data);

  return res.status(201).json({
    challengeId: challenge.challengeId,
    wallet: challenge.wallet,
    sessionId: challenge.sessionId,
    createdAt: new Date(challenge.createdAt).toISOString(),
    expiresAt: new Date(challenge.expiresAt).toISOString(),
    games: challenge.games.map((game) => ({
      ...game,
      challengeId: `${challenge.challengeId}-${game.id}`,
    })),
    publicKey: getPublicKeyHex(),
  });
});

humanityRouter.post("/prepare-verification", async (req, res) => {
  const parsed = verifySchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid request",
      details: parsed.error.flatten(),
    });
  }

  const { challengeId, wallet, results } = parsed.data;
  const challenge = getChallenge(challengeId);

  if (!challenge) {
    return res.status(404).json({
      error: "Challenge not found or expired",
    });
  }

  if (challenge.used) {
    return res.status(409).json({
      error: "Challenge already used",
    });
  }

  if (challenge.expiresAt < Date.now()) {
    return res.status(410).json({
      error: "Challenge expired",
    });
  }

  if (challenge.wallet && wallet && challenge.wallet !== wallet) {
    return res.status(403).json({
      error: "Wallet does not match challenge wallet",
    });
  }

  const resolvedWallet = wallet ?? challenge.wallet ?? null;

  const expectedChallengeIds = new Set(
    challenge.games.map((game) => `${challenge.challengeId}-${game.id}`)
  );

  const invalidChallengeResult = results.find(
    (result) => !expectedChallengeIds.has(result.challengeId)
  );

  if (invalidChallengeResult) {
    return res.status(400).json({
      error: "Result contains an invalid game challengeId",
      invalidChallengeId: invalidChallengeResult.challengeId,
    });
  }

  const verification = computeHumanityVerification({
    challengeId,
    wallet: resolvedWallet ?? undefined,
    results: results as VerifyGameResult[],
  });

  let xdr = null;

  try {
    xdr = await createAndPrepareZProofV1({
      challengeId,
      wallet: resolvedWallet ?? "anonymous-wallet",
      score: verification.adjustedHumanityScore,
      gamesPassed: verification.gamesPassed,
      botRiskScore: verification.botRiskSignals.botRiskScore,
    });
  } catch (error) {
    console.error("ZK proof generation failed:", error);
  }

  return res.json({
    xdr,
  });
});

humanityRouter.post("/submit-verification", async (req, res) => {
  const parsed = submitVerifySchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid request",
      details: parsed.error.flatten(),
    });
  }

  const { challengeId, wallet, results, signedXdr, network } = parsed.data;
  const challenge = getChallenge(challengeId);

  if (!challenge) {
    return res.status(404).json({
      error: "Challenge not found or expired",
    });
  }

  if (challenge.used) {
    return res.status(409).json({
      error: "Challenge already used",
    });
  }

  if (challenge.expiresAt < Date.now()) {
    return res.status(410).json({
      error: "Challenge expired",
    });
  }

  if (challenge.wallet && wallet && challenge.wallet !== wallet) {
    return res.status(403).json({
      error: "Wallet does not match challenge wallet",
    });
  }

  const resolvedWallet = wallet ?? challenge.wallet ?? null;

  const expectedChallengeIds = new Set(
    challenge.games.map((game) => `${challenge.challengeId}-${game.id}`)
  );

  const invalidChallengeResult = results.find(
    (result) => !expectedChallengeIds.has(result.challengeId)
  );

  if (invalidChallengeResult) {
    return res.status(400).json({
      error: "Result contains an invalid game challengeId",
      invalidChallengeId: invalidChallengeResult.challengeId,
    });
  }

  const verification = computeHumanityVerification({
    challengeId,
    wallet: resolvedWallet ?? undefined,
    results: results as VerifyGameResult[],
  });

  markChallengeUsed(challengeId);

  const issuedAt = new Date().toISOString();
  const expiresAt = new Date(
    Date.now() + 180 * 24 * 60 * 60 * 1000
  ).toISOString();

  const attestationMessage = {
    type: "humanity_attestation",
    analyticsVersion: verification.analyticsVersion,
    challengeId,
    wallet: resolvedWallet,
    passed: verification.passed,
    confidenceLevel: verification.confidenceLevel,
    adjustedHumanityScore: verification.adjustedHumanityScore,
    gamesPassed: verification.gamesPassed,
    totalGames: verification.totalGames,
    botRiskScore: verification.botRiskSignals.botRiskScore,
    issuedAt,
    expiresAt,
  };

  const attestation = signAttestation(attestationMessage);

  let zkProof = null;

  try {
    const zProof = await submitAndVerifyZProofV1({
      challengeId,
      wallet: resolvedWallet ?? "anonymous-wallet",
      score: verification.adjustedHumanityScore,
      gamesPassed: verification.gamesPassed,
      botRiskScore: verification.botRiskSignals.botRiskScore,
      signedXdr,
      network,
    });
    zkProof = {
      ...zProof,
      contractId: process.env.ZPROOF_VERIFIER_CONTRACT_ID,
    };
  } catch (error) {
    console.error("ZK proof generation failed:", error);
  }

  return res.json({
    ...verification,
    issuedAt,
    expiresAt,
    attestation,
    zkProof,
    backendReadyPayload: {
      analyticsVersion: verification.analyticsVersion,
      challengeId,
      wallet: resolvedWallet,
      passed: verification.passed,
      confidenceLevel: verification.confidenceLevel,
      averageHumanityScore: verification.averageHumanityScore,
      adjustedHumanityScore: verification.adjustedHumanityScore,
      averageAccuracy: verification.averageAccuracy,
      gamesPassed: verification.gamesPassed,
      totalGames: verification.totalGames,
      varianceAnalytics: verification.varianceAnalytics,
      botRiskSignals: verification.botRiskSignals,
      gameProofInputs: verification.results.map((result) => ({
        challengeId: result.challengeId,
        gameType: result.gameType,
        humanityScore: result.humanityScore,
        accuracy: result.accuracy,
        reactionVariance: result.reactionVariance,
        totalTimeMs: result.totalTimeMs,
      })),
      attestation,
      zkProof,
    },
  });
});

humanityRouter.post("/verify", async (req, res) => {
  const parsed = verifySchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid request",
      details: parsed.error.flatten(),
    });
  }

  const { challengeId, wallet, results } = parsed.data;
  const challenge = getChallenge(challengeId);

  if (!challenge) {
    return res.status(404).json({
      error: "Challenge not found or expired",
    });
  }

  if (challenge.used) {
    return res.status(409).json({
      error: "Challenge already used",
    });
  }

  if (challenge.expiresAt < Date.now()) {
    return res.status(410).json({
      error: "Challenge expired",
    });
  }

  if (challenge.wallet && wallet && challenge.wallet !== wallet) {
    return res.status(403).json({
      error: "Wallet does not match challenge wallet",
    });
  }

  const resolvedWallet = wallet ?? challenge.wallet ?? null;

  const expectedChallengeIds = new Set(
    challenge.games.map((game) => `${challenge.challengeId}-${game.id}`)
  );

  const invalidChallengeResult = results.find(
    (result) => !expectedChallengeIds.has(result.challengeId)
  );

  if (invalidChallengeResult) {
    return res.status(400).json({
      error: "Result contains an invalid game challengeId",
      invalidChallengeId: invalidChallengeResult.challengeId,
    });
  }

  const verification = computeHumanityVerification({
    challengeId,
    wallet: resolvedWallet ?? undefined,
    results: results as VerifyGameResult[],
  });

  markChallengeUsed(challengeId);

  const issuedAt = new Date().toISOString();
  const expiresAt = new Date(
    Date.now() + 180 * 24 * 60 * 60 * 1000
  ).toISOString();

  const attestationMessage = {
    type: "humanity_attestation",
    analyticsVersion: verification.analyticsVersion,
    challengeId,
    wallet: resolvedWallet,
    passed: verification.passed,
    confidenceLevel: verification.confidenceLevel,
    adjustedHumanityScore: verification.adjustedHumanityScore,
    gamesPassed: verification.gamesPassed,
    totalGames: verification.totalGames,
    botRiskScore: verification.botRiskSignals.botRiskScore,
    issuedAt,
    expiresAt,
  };

  const attestation = signAttestation(attestationMessage);

  let zkProof = null;

  try {
    const zProof = await createAndVerifyZProofV1({
      challengeId,
      wallet: resolvedWallet ?? "anonymous-wallet",
      score: verification.adjustedHumanityScore,
      gamesPassed: verification.gamesPassed,
      botRiskScore: verification.botRiskSignals.botRiskScore,
    });
    zkProof = {
      ...zProof,
      contractId: process.env.ZPROOF_VERIFIER_CONTRACT_ID,
    };
  } catch (error) {
    console.error("ZK proof generation failed:", error);
  }

  return res.json({
    ...verification,
    issuedAt,
    expiresAt,
    attestation,
    zkProof,
    backendReadyPayload: {
      analyticsVersion: verification.analyticsVersion,
      challengeId,
      wallet: resolvedWallet,
      passed: verification.passed,
      confidenceLevel: verification.confidenceLevel,
      averageHumanityScore: verification.averageHumanityScore,
      adjustedHumanityScore: verification.adjustedHumanityScore,
      averageAccuracy: verification.averageAccuracy,
      gamesPassed: verification.gamesPassed,
      totalGames: verification.totalGames,
      varianceAnalytics: verification.varianceAnalytics,
      botRiskSignals: verification.botRiskSignals,
      gameProofInputs: verification.results.map((result) => ({
        challengeId: result.challengeId,
        gameType: result.gameType,
        humanityScore: result.humanityScore,
        accuracy: result.accuracy,
        reactionVariance: result.reactionVariance,
        totalTimeMs: result.totalTimeMs,
      })),
      attestation,
      zkProof,
    },
  });
});

humanityRouter.get("/public-key", (_req, res) => {
  return res.json({
    publicKey: getPublicKeyHex(),
    algorithm: "ed25519-sha256-stable-json",
  });
});
