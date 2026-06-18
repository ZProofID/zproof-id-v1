import crypto from "node:crypto";
import { generateZProofV1, type ZProofV1Input } from "./generateProof.js";
import { verifyZProofV1 } from "./verifyProof.js";
import { verifyZProofOnchain } from "../soroban/zproofSoroban.service.js";

export type CreateZProofParams = {
  challengeId: string;
  wallet: string;
  appId?: string;
  score: number;
  gamesPassed: number;
  botRiskScore: number;
};

const BLS12_381_SCALAR_FIELD = BigInt(
  "52435875175126190479447740508185965837690552500527637822603658699938581184512"
);

function hashToField(value: string): string {
  const hash = crypto.createHash("sha256").update(value).digest("hex");
  return (BigInt(`0x${hash}`) % BLS12_381_SCALAR_FIELD).toString();
}

function createSecret(challengeId: string, wallet: string): string {
  const backendSecret =
    process.env.ZPROOF_NULLIFIER_SECRET || "zproof-dev-secret-change-me";

  return hashToField(`${backendSecret}:${challengeId}:${wallet}`);
}

export async function createAndVerifyZProofV1(params: CreateZProofParams) {
  const appId = params.appId || process.env.ZPROOF_APP_ID || "zproof-id-demo";

  const input: ZProofV1Input = {
    score: Math.round(params.score),
    gamesPassed: Math.round(params.gamesPassed),
    botRiskScore: Math.round(params.botRiskScore),
    secret: createSecret(params.challengeId, params.wallet),

    minScore: Number(process.env.ZPROOF_MIN_SCORE || 65),
    minGamesPassed: Number(process.env.ZPROOF_MIN_GAMES_PASSED || 3),
    maxBotRiskScore: Number(process.env.ZPROOF_MAX_BOT_RISK_SCORE || 45),

    challengeHash: hashToField(params.challengeId),
    walletHash: hashToField(params.wallet),
    appHash: hashToField(appId),
  };

  const { proof, publicSignals } = await generateZProofV1(input);
  const onchainVerification = await verifyZProofOnchain({
    proof,
    publicSignals,
  });

  const { verified, credentialPassed } = await verifyZProofV1({
    proof,
    publicSignals,
  });

  return {
    verified,
    credentialPassed,
    circuitId: "zproof-humanity-v1",
    curve: "bls12381",
    protocol: "groth16",
    publicInputs: {
      minScore: input.minScore,
      minGamesPassed: input.minGamesPassed,
      maxBotRiskScore: input.maxBotRiskScore,
      challengeHash: input.challengeHash,
      walletHash: input.walletHash,
      appHash: input.appHash,
    },
    proof,
    publicSignals,
    onchainVerification,
  };
}
