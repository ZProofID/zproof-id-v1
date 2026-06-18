import { xdr } from "@stellar/stellar-sdk";
import { fpToBytes48, frToBytes32 } from "./decimalBytes.js";

type Groth16Proof = {
  pi_a: string[];
  pi_b: string[][];
  pi_c: string[];
  protocol?: string;
  curve?: string;
};

function sym(name: string) {
  return xdr.ScVal.scvSymbol(name);
}

function bytes(value: Buffer) {
  return xdr.ScVal.scvBytes(value);
}

function field(name: string, value: xdr.ScVal) {
  return new xdr.ScMapEntry({
    key: sym(name),
    val: value,
  });
}

function map(entries: xdr.ScMapEntry[]) {
  const sorted = [...entries].sort((a, b) => {
    const ak = a.key().sym().toString();
    const bk = b.key().sym().toString();
    return ak.localeCompare(bk);
  });

  return xdr.ScVal.scvMap(sorted);
}

export function proofToScVal(proof: Groth16Proof): xdr.ScVal {
  return map([
    field("pi_a_x", bytes(fpToBytes48(proof.pi_a[0]))),
    field("pi_a_y", bytes(fpToBytes48(proof.pi_a[1]))),

    field("pi_b_x_0", bytes(fpToBytes48(proof.pi_b[0][0]))),
    field("pi_b_x_1", bytes(fpToBytes48(proof.pi_b[0][1]))),
    field("pi_b_y_0", bytes(fpToBytes48(proof.pi_b[1][0]))),
    field("pi_b_y_1", bytes(fpToBytes48(proof.pi_b[1][1]))),

    field("pi_c_x", bytes(fpToBytes48(proof.pi_c[0]))),
    field("pi_c_y", bytes(fpToBytes48(proof.pi_c[1]))),
  ]);
}

export function publicSignalsToScVal(publicSignals: string[]): xdr.ScVal {
  if (publicSignals.length !== 8) {
    throw new Error(`Expected 8 public signals, got ${publicSignals.length}`);
  }

  return map([
    field("app_hash", bytes(frToBytes32(publicSignals[7]))),
    field("challenge_hash", bytes(frToBytes32(publicSignals[5]))),
    field("max_bot_risk_score", bytes(frToBytes32(publicSignals[4]))),
    field("min_games_passed", bytes(frToBytes32(publicSignals[3]))),
    field("min_score", bytes(frToBytes32(publicSignals[2]))),
    field("nullifier", bytes(frToBytes32(publicSignals[1]))),
    field("passed", bytes(frToBytes32(publicSignals[0]))),
    field("wallet_hash", bytes(frToBytes32(publicSignals[6]))),
  ]);
}
