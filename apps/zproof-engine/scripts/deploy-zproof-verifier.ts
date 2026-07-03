import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import {
  Address,
  BASE_FEE,
  Keypair,
  Networks,
  Operation,
  TransactionBuilder,
  nativeToScVal,
  rpc,
  xdr,
} from "@stellar/stellar-sdk";

const RPC_URL =
  process.env.SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org";
const NETWORK_PASSPHRASE =
  process.env.SOROBAN_NETWORK_PASSPHRASE || Networks.TESTNET;

const SOURCE_SECRET = process.env.SOROBAN_SOURCE_SECRET;
const WASM_PATH =
  process.env.ZPROOF_VERIFIER_WASM ||
  path.resolve(
    process.cwd(),
    "../../contracts/verifier/target/wasm32v1-none/release/zproof_groth16_verifier.wasm"
  );

const VK_PATH =
  process.env.ZPROOF_VK_PATH ||
  path.resolve(process.cwd(), "zk/keys/zproof_v1_verification_key.json");

if (!SOURCE_SECRET) throw new Error("SOROBAN_SOURCE_SECRET is required");

const server = new rpc.Server(RPC_URL);
const source = Keypair.fromSecret(SOURCE_SECRET);

function decToBytes(value: string | number | bigint, bytes: number): Buffer {
  const n = BigInt(value);
  if (n < 0n) throw new Error("negative value not supported");

  const hex = n.toString(16).padStart(bytes * 2, "0");
  if (hex.length > bytes * 2) {
    throw new Error(`value does not fit in ${bytes} bytes`);
  }

  return Buffer.from(hex, "hex");
}

function scBytes(buffer: Buffer): xdr.ScVal {
  return xdr.ScVal.scvBytes(buffer);
}

function scSymbol(value: string): xdr.ScVal {
  return xdr.ScVal.scvSymbol(value);
}

function scField(key: string, val: xdr.ScVal): xdr.ScMapEntry {
  return new xdr.ScMapEntry({
    key: scSymbol(key),
    val,
  });
}

function scMap(entries: xdr.ScMapEntry[]): xdr.ScVal {
  const sorted = [...entries].sort((a, b) => {
    const ak = a.key().sym().toString();
    const bk = b.key().sym().toString();
    return ak.localeCompare(bk);
  });

  return xdr.ScVal.scvMap(sorted);
}

function g1Fields(prefix: string, point: string[]) {
  return [
    scField(`${prefix}_x`, scBytes(decToBytes(point[0], 48))),
    scField(`${prefix}_y`, scBytes(decToBytes(point[1], 48))),
  ];
}

function g2Fields(prefix: string, point: string[][]) {
  return [
    scField(`${prefix}_x_0`, scBytes(decToBytes(point[0][0], 48))),
    scField(`${prefix}_x_1`, scBytes(decToBytes(point[0][1], 48))),
    scField(`${prefix}_y_0`, scBytes(decToBytes(point[1][0], 48))),
    scField(`${prefix}_y_1`, scBytes(decToBytes(point[1][1], 48))),
  ];
}

function icToScVal(ic: string[][]): xdr.ScVal {
  return xdr.ScVal.scvVec(
    ic.map((point) =>
      xdr.ScVal.scvVec([
        scBytes(decToBytes(point[0], 48)),
        scBytes(decToBytes(point[1], 48)),
      ])
    )
  );
}

function verificationKeyToScVal(vk: any): xdr.ScVal {
  if (!Array.isArray(vk.IC) || vk.IC.length !== 9) {
    throw new Error(`Expected IC length 9, got ${vk.IC?.length}`);
  }

  return scMap([
    ...g1Fields("alpha_g1", vk.vk_alpha_1),
    ...g2Fields("beta_g2", vk.vk_beta_2),
    ...g2Fields("gamma_g2", vk.vk_gamma_2),
    ...g2Fields("delta_g2", vk.vk_delta_2),
    scField("ic", icToScVal(vk.IC)),
  ]);
}

async function submit(tx: any) {
  const sim = await server.simulateTransaction(tx);

  if (rpc.Api.isSimulationError(sim)) {
    throw new Error(`Simulation failed: ${JSON.stringify(sim, null, 2)}`);
  }

  const prepared = rpc.assembleTransaction(tx, sim).build();
  prepared.sign(source);

  const sent = await server.sendTransaction(prepared);

  if (sent.status === "ERROR") {
    throw new Error(`Send failed: ${JSON.stringify(sent, null, 2)}`);
  }

  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 1000));

    const result = await server.getTransaction(sent.hash);

    if (result.status === "SUCCESS") return result;
    if (result.status === "FAILED") {
      throw new Error(`Transaction failed: ${JSON.stringify(result, null, 2)}`);
    }
  }

  throw new Error(`Transaction timed out: ${sent.hash}`);
}

async function main() {
  const wasm = fs.readFileSync(WASM_PATH);
  const vk = JSON.parse(fs.readFileSync(VK_PATH, "utf8"));

  const account = await server.getAccount(source.publicKey());

  const uploadTx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(Operation.uploadContractWasm({ wasm }))
    .setTimeout(60)
    .build();

  const uploadResult: any = await submit(uploadTx);
  const wasmHash = uploadResult.returnValue.bytes();

  console.log("WASM hash:", wasmHash.toString("hex"));

  const account2 = await server.getAccount(source.publicKey());

  const salt = Buffer.alloc(32);
  crypto.getRandomValues(salt);

  const adminArg = new Address(source.publicKey()).toScVal();
  const vkArg = verificationKeyToScVal(vk);

  const deployTx = new TransactionBuilder(account2, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.createCustomContract({
        address: new Address(source.publicKey()),
        wasmHash,
        salt,
        constructorArgs: [adminArg, vkArg],
      })
    )
    .setTimeout(60)
    .build();

  const deployResult: any = await submit(deployTx);

  console.log("Deploy result:", JSON.stringify(deployResult, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
