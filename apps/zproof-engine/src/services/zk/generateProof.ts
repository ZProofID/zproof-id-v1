import path from "node:path";
import { groth16 } from "snarkjs";

export type ZProofV1Input = {
  score: number;
  gamesPassed: number;
  botRiskScore: number;
  secret: string | number;
  minScore: number;
  minGamesPassed: number;
  maxBotRiskScore: number;
  challengeHash: string | number;
  walletHash: string | number;
  appHash: string | number;
};

const WASM_PATH = path.resolve(
  process.cwd(),
  "zk/build/zproof_v1_js/zproof_v1.wasm"
);
const ZKEY_PATH = path.resolve(process.cwd(), "zk/keys/zproof_v1.zkey");

export async function generateZProofV1(input: ZProofV1Input) {
  const { proof, publicSignals } = await groth16.fullProve(
    {
      score: input.score,
      gamesPassed: input.gamesPassed,
      botRiskScore: input.botRiskScore,
      secret: input.secret,
      minScore: input.minScore,
      minGamesPassed: input.minGamesPassed,
      maxBotRiskScore: input.maxBotRiskScore,
      challengeHash: input.challengeHash,
      walletHash: input.walletHash,
      appHash: input.appHash,
    },
    WASM_PATH,
    ZKEY_PATH
  );

  return {
    proof,
    publicSignals,
  };
}
