import {
  BASE_FEE,
  Contract,
  Keypair,
  Networks,
  TransactionBuilder,
  rpc,
  scValToNative,
} from "@stellar/stellar-sdk";
import {
  proofToScVal,
  publicSignalsToScVal,
} from "./zproofSoroban.serialize.js";

type VerifyOnchainParams = {
  proof: {
    pi_a: string[];
    pi_b: string[][];
    pi_c: string[];
    protocol?: string;
    curve?: string;
  };
  publicSignals: string[];
};

const rpcUrl = process.env.SOROBAN_RPC_URL;
const sourceSecret = process.env.SOROBAN_SOURCE_SECRET;
const contractId = process.env.ZPROOF_VERIFIER_CONTRACT_ID;

const networkPassphrase =
  process.env.SOROBAN_NETWORK_PASSPHRASE || Networks.TESTNET;

if (!rpcUrl) throw new Error("SOROBAN_RPC_URL is required");
if (!sourceSecret) throw new Error("SOROBAN_SOURCE_SECRET is required");
if (!contractId) throw new Error("ZPROOF_VERIFIER_CONTRACT_ID is required");

const server = new rpc.Server(rpcUrl);
const sourceKeypair = Keypair.fromSecret(sourceSecret);
const contract = new Contract(contractId);

async function submitPreparedTransaction(tx: any) {
  const sendResponse = await server.sendTransaction(tx);

  if (sendResponse.status === "ERROR") {
    throw new Error(`Soroban send failed: ${JSON.stringify(sendResponse)}`);
  }

  let status = sendResponse.status;
  let result: any = sendResponse;

  for (let i = 0; i < 30; i++) {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    result = await server.getTransaction(sendResponse.hash);

    status = result.status;

    if (status === "SUCCESS") return result;
    if (status === "FAILED") {
      throw new Error(`Soroban transaction failed: ${JSON.stringify(result)}`);
    }
  }

  throw new Error(`Soroban transaction timed out: ${sendResponse.hash}`);
}

export async function verifyZProofOnchain(params: VerifyOnchainParams) {
  const account = await server.getAccount(sourceKeypair.publicKey());

  const proofArg = proofToScVal(params.proof);
  const signalsArg = publicSignalsToScVal(params.publicSignals);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(contract.call("zproof_verify", proofArg, signalsArg))
    .setTimeout(60)
    .build();

  const simulated = await server.simulateTransaction(tx);

  if (rpc.Api.isSimulationError(simulated)) {
    throw new Error(`Soroban simulation failed: ${JSON.stringify(simulated)}`);
  }

  const prepared = rpc.assembleTransaction(tx, simulated).build();

  prepared.sign(sourceKeypair);

  const result = await submitPreparedTransaction(prepared);

  const returnValue = result.returnValue;

  return {
    transactionHash: result.hash,
    status: result.status,
    verified: returnValue ? Boolean(scValToNative(returnValue)) : false,
    raw: result,
  };
}
