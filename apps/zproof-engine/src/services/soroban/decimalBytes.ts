export function decToFixedBytes(
  value: string | number | bigint,
  bytes: number
): Buffer {
  const bigintValue = BigInt(value);
  if (bigintValue < 0n) {
    throw new Error("Negative values are not supported");
  }

  const hex = bigintValue.toString(16).padStart(bytes * 2, "0");

  if (hex.length > bytes * 2) {
    throw new Error(`Value does not fit in ${bytes} bytes`);
  }

  return Buffer.from(hex, "hex");
}

export function frToBytes32(value: string | number | bigint): Buffer {
  return decToFixedBytes(value, 32);
}

export function fpToBytes48(value: string | number | bigint): Buffer {
  return decToFixedBytes(value, 48);
}
