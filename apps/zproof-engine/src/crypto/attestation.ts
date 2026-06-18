import { ed25519 } from "@noble/curves/ed25519";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";
import { sha256 } from "@noble/hashes/sha256";
import { env } from "../config/env.js";

function randomPrivateKey(): Uint8Array {
  return ed25519.utils.randomPrivateKey();
}

const privateKey = env.ATTESTATION_PRIVATE_KEY_HEX
  ? hexToBytes(env.ATTESTATION_PRIVATE_KEY_HEX)
  : randomPrivateKey();

const publicKey = ed25519.getPublicKey(privateKey);

export function getPublicKeyHex(): string {
  return bytesToHex(publicKey);
}

export function getPrivateKeyHexForDevOnly(): string {
  return bytesToHex(privateKey);
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;

  const obj = value as Record<string, unknown>;
  return `{${Object.keys(obj)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(obj[key])}`)
    .join(",")}}`;
}

export function signAttestation(message: Record<string, unknown>) {
  const canonical = stableStringify(message);
  const digest = sha256(new TextEncoder().encode(canonical));
  const signature = ed25519.sign(digest, privateKey);

  return {
    message,
    canonical,
    signature: bytesToHex(signature),
    publicKey: getPublicKeyHex(),
    algorithm: "ed25519-sha256-stable-json",
  };
}

export function verifyAttestation(
  message: Record<string, unknown>,
  signatureHex: string,
  publicKeyHex: string
): boolean {
  const canonical = stableStringify(message);
  const digest = sha256(new TextEncoder().encode(canonical));
  return ed25519.verify(hexToBytes(signatureHex), digest, hexToBytes(publicKeyHex));
}
