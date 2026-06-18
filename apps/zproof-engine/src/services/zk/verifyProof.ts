import fs from "node:fs/promises";
import path from "node:path";
import { groth16 } from "snarkjs";

const VKEY_PATH = path.resolve(
  process.cwd(),
  "zk/keys/zproof_v1_verification_key.json"
);

let cachedVerificationKey: unknown | null = null;

async function getVerificationKey() {
  if (cachedVerificationKey) return cachedVerificationKey;

  const raw = await fs.readFile(VKEY_PATH, "utf8");
  cachedVerificationKey = JSON.parse(raw);

  return cachedVerificationKey;
}

export async function verifyZProofV1(params: {
  proof: unknown;
  publicSignals: string[];
}) {
  const verificationKey = await getVerificationKey();

  const verified = await groth16.verify(
    verificationKey,
    params.publicSignals,
    params.proof
  );

  const credentialPassed = verified && params.publicSignals[0] === "1";

  return {
    verified,
    credentialPassed,
  };
}
