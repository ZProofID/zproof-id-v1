import "dotenv/config";
import fs from "node:fs";

import {
  BASE_FEE,
  Keypair,
  Networks,
  TransactionBuilder,
  Contract,
  rpc,
  Operation,
  nativeToScVal,
} from "@stellar/stellar-sdk";

const RPC_URL =
  process.env.SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org";

const NETWORK_PASSPHRASE =
  process.env.SOROBAN_NETWORK_PASSPHRASE || Networks.TESTNET;

const CONTRACT_ID = process.env.ZPROOF_VERIFIER_CONTRACT_ID;
const SOURCE_SECRET = process.env.SOROBAN_SOURCE_SECRET;

const WASM_PATH =
  process.env.ZPROOF_VERIFIER_WASM ||
  "../../contracts/zproof-groth16-verifier/target/wasm32v1-none/release/zproof_groth16_verifier.wasm";

if (!CONTRACT_ID) {
  throw new Error("ZPROOF_VERIFIER_CONTRACT_ID missing");
}

if (!SOURCE_SECRET) {
  throw new Error("SOROBAN_SOURCE_SECRET missing");
}

const server = new rpc.Server(RPC_URL);
const source = Keypair.fromSecret(SOURCE_SECRET);

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

  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 1000));

    const txResult = await server.getTransaction(sent.hash);

    if (txResult.status === "SUCCESS") {
      return txResult;
    }

    if (txResult.status === "FAILED") {
      throw new Error(
        `Transaction failed: ${JSON.stringify(txResult, null, 2)}`
      );
    }
  }

  throw new Error("Timed out waiting for confirmation");
}

async function uploadWasm() {
  const wasm = fs.readFileSync(WASM_PATH);

  const account = await server.getAccount(source.publicKey());

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.uploadContractWasm({
        wasm,
      })
    )
    .setTimeout(300)
    .build();

  const result: any = await submit(tx);

  const wasmHash = result.returnValue.bytes().toString("hex");

  console.log("Uploaded WASM:");
  console.log(wasmHash);

  return wasmHash;
}

async function upgradeContract(wasmHashHex: string) {
  const contract = new Contract(CONTRACT_ID);

  const account = await server.getAccount(source.publicKey());

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call("upgrade", nativeToScVal(Buffer.from(wasmHashHex, "hex")))
    )
    .setTimeout(300)
    .build();

  const result = await submit(tx);

  console.log("Upgrade successful");
  console.log(JSON.stringify(result, null, 2));
}

async function main() {
  console.log("Uploading new WASM...");

  const wasmHash = await uploadWasm();

  console.log("Upgrading contract...");
  await upgradeContract(wasmHash);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
