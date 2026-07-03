import {
  ArrowLeft,
  BadgeCheck,
  Clock,
  Copy,
  ExternalLink,
  Fingerprint,
  KeyRound,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useStates } from "../../contexts/StatesContext";

function getStoredAttestation() {
  try {
    const raw = localStorage.getItem("humanity-attestation");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function shortText(value, start = 8, end = 8) {
  if (!value) return "Not available";
  const text = String(value);
  if (text.length <= start + end) return text;
  return `${text.slice(0, start)}...${text.slice(-end)}`;
}

function formatDate(value) {
  if (!value) return "Not available";
  return new Date(value).toLocaleString();
}

function formatDateNoTime(value) {
  if (!value) return "Not available";

  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function copy(value) {
  if (!value) return;
  navigator.clipboard.writeText(
    typeof value === "string" ? value : JSON.stringify(value, null, 2)
  );
}

function getExplorerNetwork() {
  const network = import.meta.env.VITE_STELLAR_NETWORK || "testnet";
  return network.toLowerCase() === "public" ? "public" : "testnet";
}

function getTxHash(rawZkProof) {
  return (
    rawZkProof?.onchainVerification?.transactionHash ||
    rawZkProof?.onchainVerification?.txHash ||
    rawZkProof?.onchainVerification?.raw?.txHash ||
    rawZkProof?.transactionHash ||
    rawZkProof?.txHash ||
    null
  );
}

function getContractId(rawZkProof) {
  return (
    rawZkProof?.onchainVerification?.contractId ||
    rawZkProof?.contractId ||
    import.meta.env.VITE_ZPROOF_VERIFIER_CONTRACT_ID ||
    null
  );
}

function getZkProofSummary(rawZkProof) {
  if (!rawZkProof) return null;

  const transactionHash = getTxHash(rawZkProof);
  const contractId = getContractId(rawZkProof);

  return {
    verified:
      rawZkProof?.onchainVerification?.verified ??
      rawZkProof?.verified ??
      false,
    status: rawZkProof?.onchainVerification?.status || "UNKNOWN",
    credentialPassed: rawZkProof?.credentialPassed ?? false,
    circuitId: rawZkProof?.circuitId,
    protocol: rawZkProof?.protocol,
    curve: rawZkProof?.curve,
    minScore: rawZkProof?.publicInputs?.minScore,
    minGamesPassed: rawZkProof?.publicInputs?.minGamesPassed,
    maxBotRiskScore: rawZkProof?.publicInputs?.maxBotRiskScore,
    transactionHash,
    contractId,
  };
}

function getTxExplorerUrl(txHash) {
  if (!txHash) return null;
  return `https://stellar.expert/explorer/${getExplorerNetwork()}/tx/${txHash}`;
}

export default function ProfilePage() {
  const { userKey, setWalletKitIsOpen } = useStates();

  const attestation = getStoredAttestation();

  const rawZkProof = attestation?.zkProof;
  const zkProof = getZkProofSummary(rawZkProof);
  const txExplorerUrl = getTxExplorerUrl(zkProof?.transactionHash);

  const isVerified = Boolean(attestation?.passed || attestation?.verified);
  const zkVerified = Boolean(zkProof?.verified);
  const credentialPassed = Boolean(zkProof?.credentialPassed);
  const fullVerified = isVerified && zkVerified && credentialPassed;

  const message = attestation?.attestation?.message;
  const signature = attestation?.attestation?.signature;
  const publicKey = attestation?.attestation?.publicKey;

  const score =
    attestation?.adjustedHumanityScore ?? message?.adjustedHumanityScore;

  const confidence =
    attestation?.confidenceLevel ?? message?.confidenceLevel ?? "Not verified";

  const wallet =
    attestation?.wallet ?? message?.wallet ?? userKey ?? "Not connected";

  const statusLabel = fullVerified
    ? "Verified"
    : isVerified
    ? "Partially verified"
    : "Not verified";

  return (
    <main className="min-h-screen overflow-hidden bg-[#050711] text-white">
      <div className="relative mx-auto max-w-6xl px-6 py-6">
        <nav className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
            ZProof.ID
          </Link>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setWalletKitIsOpen(true)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${
                userKey
                  ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
                  : "border-blue-400/20 bg-blue-500/10 text-blue-300"
              }`}
            >
              <Wallet className="h-4 w-4" />
              {userKey ? shortText(userKey, 6, 6) : "Connect wallet"}
            </button>

            <Link
              to="/verify"
              className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
            >
              Verify again
            </Link>
          </div>
        </nav>

        <section className="mt-10">
          <div className="mb-6 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">
                User verification profile
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
                View your humanity status, score, wallet binding, signed
                attestation, and on-chain zero-knowledge proof verification.
              </p>
            </div>

            <div
              className={`inline-flex w-fit items-center gap-2 rounded-full px-8 py-2 text-sm font-bold ${
                fullVerified
                  ? "bg-green-500/15 text-green-300"
                  : isVerified
                  ? "bg-blue-500/15 text-blue-300"
                  : "bg-slate-500/15 text-slate-300"
              }`}
            >
              <BadgeCheck className="h-4 w-4" />
              {statusLabel}
            </div>
          </div>

          {!userKey || !attestation ? (
            <EmptyState
              wallet={userKey}
              onConnect={() => setWalletKitIsOpen(true)}
            />
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-4">
                <Metric
                  icon={<ShieldCheck className="h-5 w-5" />}
                  label="Humanity Status"
                  value={statusLabel}
                />
                <Metric
                  icon={<Fingerprint className="h-5 w-5" />}
                  label="Humanity Score"
                  value={score ?? "n/a"}
                />
                <Metric
                  icon={<BadgeCheck className="h-5 w-5" />}
                  label="Confidence"
                  value={confidence}
                />
                <Metric
                  icon={<Clock className="h-5 w-5" />}
                  label="Verified Until"
                  value={formatDateNoTime(attestation.expiresAt)}
                />
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                <section className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 shadow-2xl shadow-blue-950/30 backdrop-blur">
                  <h2 className="text-lg font-bold">Credential details</h2>

                  <div className="mt-5 space-y-3">
                    <InfoRow icon={<Wallet />} label="Wallet" value={wallet} />
                    <InfoRow
                      icon={<KeyRound />}
                      label="Public key"
                      value={shortText(publicKey)}
                      copyValue={publicKey}
                    />
                    <InfoRow
                      icon={<Fingerprint />}
                      label="Challenge"
                      value={shortText(attestation.challengeId)}
                      copyValue={attestation.challengeId}
                    />
                    <InfoRow
                      icon={<Clock />}
                      label="Issued"
                      value={formatDate(attestation.issuedAt)}
                    />
                    <InfoRow
                      icon={<Clock />}
                      label="Expires"
                      value={formatDate(attestation.expiresAt)}
                    />
                  </div>
                </section>

                <section className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 shadow-2xl shadow-blue-950/30 backdrop-blur">
                  <h2 className="text-lg font-bold">Verification details</h2>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <MiniStat
                      label="Humanity challenge"
                      value={isVerified ? "Passed" : "Not passed"}
                    />
                    <MiniStat
                      label="ZK credential"
                      value={credentialPassed ? "Passed" : "Not passed"}
                    />
                    <MiniStat
                      label="On-chain ZK proof"
                      value={zkVerified ? "Verified" : "Not available"}
                    />
                    <MiniStat
                      label="Games passed"
                      value={`${attestation.gamesPassed ?? 0}/${
                        attestation.totalGames ?? 4
                      }`}
                    />
                  </div>

                  <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm leading-6 text-slate-400">
                    Circuit:{" "}
                    <span className="font-semibold text-slate-200">
                      {zkProof?.circuitId ?? "Not available"}
                    </span>
                    <br />
                    Protocol:{" "}
                    <span className="font-semibold text-slate-200">
                      {zkProof?.protocol ?? "n/a"}
                    </span>{" "}
                    · Curve:{" "}
                    <span className="font-semibold text-slate-200">
                      {zkProof?.curve ?? "n/a"}
                    </span>
                  </div>
                </section>
              </div>

              {zkProof && (
                <section className="mt-6 overflow-hidden rounded-[2rem] border border-cyan-400/20 bg-cyan-500/[0.055] shadow-2xl shadow-cyan-950/30">
                  <div className="h-1 w-full bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400" />

                  <div className="p-6">
                    <div className="mb-4 flex items-center justify-between gap-4">
                      <div>
                        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          On-chain result
                        </div>

                        <h2 className="text-lg font-bold">
                          Zero-knowledge proof
                        </h2>
                        <p className="mt-1 text-sm text-slate-400">
                          Groth16 proof and on-chain verification result.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => copy(rawZkProof)}
                        className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100 hover:bg-cyan-400/20"
                      >
                        <Copy className="h-4 w-4" />
                        Copy raw proof
                      </button>
                    </div>

                    <div className="mb-4 rounded-2xl border border-cyan-400/20 bg-black/25 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
                            Stellar verification
                          </p>
                          <p className="mt-1 text-sm text-slate-400">
                            This is the result submitted and verified on-chain.
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-4 py-2 text-sm font-bold ${
                            zkProof.verified
                              ? "bg-emerald-500/15 text-emerald-300"
                              : "bg-red-500/15 text-red-300"
                          }`}
                        >
                          {zkProof.verified
                            ? "Verified on-chain"
                            : "On-chain failed"}
                        </span>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <MiniStat
                        label="On-chain Verification"
                        value={zkProof.verified ? "Verified" : "Failed"}
                      />
                      <MiniStat label="Status" value={zkProof.status} />
                      <MiniStat
                        label="Protocol"
                        value={zkProof.protocol || "n/a"}
                      />
                      <MiniStat label="Curve" value={zkProof.curve || "n/a"} />
                      <MiniStat
                        label="Minimum Score"
                        value={zkProof.minScore ?? "n/a"}
                      />
                      <MiniStat
                        label="Minimum Games"
                        value={zkProof.minGamesPassed ?? "n/a"}
                      />
                      <MiniStat
                        label="Max Bot Risk"
                        value={zkProof.maxBotRiskScore ?? "n/a"}
                      />
                      <MiniStat
                        label="Circuit"
                        value={shortText(zkProof.circuitId, 14, 6)}
                      />
                    </div>

                    <div className="mt-4 grid gap-3 lg:grid-cols-2">
                      <InfoRow
                        icon={<ShieldCheck />}
                        label="Verifier contract"
                        value={shortText(zkProof.contractId, 12, 12)}
                        copyValue={zkProof.contractId}
                      />

                      <div className="flex items-center justify-between gap-4 rounded-2xl border border-cyan-400/20 bg-black/25 p-4">
                        <div className="min-w-0">
                          <p className="text-xs text-cyan-300">
                            Transaction hash
                          </p>
                          <p className="truncate text-sm font-semibold text-slate-100">
                            {shortText(zkProof.transactionHash, 12, 12)}
                          </p>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          {zkProof.transactionHash && (
                            <button
                              type="button"
                              onClick={() => copy(zkProof.transactionHash)}
                              className="rounded-full border border-cyan-400/20 bg-cyan-400/10 p-2 text-cyan-300 hover:bg-cyan-400/20 hover:text-white"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                          )}

                          {txExplorerUrl && (
                            <a
                              href={txExplorerUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs font-semibold text-cyan-200 hover:bg-cyan-400/20"
                            >
                              Explorer
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    <details className="mt-4 rounded-2xl border border-cyan-400/20 bg-black/25 p-4">
                      <summary className="cursor-pointer text-sm font-semibold text-cyan-200">
                        Developer details
                      </summary>

                      <pre className="mt-4 max-h-[360px] overflow-auto rounded-2xl bg-black/60 p-4 text-xs text-green-300">
                        {JSON.stringify(rawZkProof, null, 2)}
                      </pre>
                    </details>
                  </div>
                </section>
              )}

              <section className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.045] p-6">
                <h2 className="text-lg font-bold">Risk analytics</h2>

                <div className="mt-5 grid gap-3 sm:grid-cols-4">
                  <MiniStat
                    label="Average accuracy"
                    value={attestation.averageAccuracy ?? "n/a"}
                  />
                  <MiniStat
                    label="Bot risk score"
                    value={attestation.botRiskSignals?.botRiskScore ?? 0}
                  />
                  <MiniStat
                    label="Score variance"
                    value={
                      attestation.varianceAnalytics?.scoreVariance ?? "n/a"
                    }
                  />
                  <MiniStat
                    label="Reaction variance"
                    value={
                      attestation.varianceAnalytics?.averageReactionVariance ??
                      "n/a"
                    }
                  />
                </div>

                <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm leading-6 text-slate-400">
                  {attestation.botRiskSignals?.reason ||
                    "No strong robotic consistency pattern detected."}
                </div>
              </section>

              <section className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.045] p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold">Game results</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Per-game scores used to generate your humanity credential.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {(attestation.results || []).map((game, index) => (
                    <div
                      key={`${game.challengeId}-${game.gameType}-${index}`}
                      className="rounded-2xl border border-white/10 bg-black/20 p-4"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-sm font-bold text-white">
                          {formatGameType(game.gameType)}
                        </p>
                        <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">
                          {game.humanityScore}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <Tiny label="Accuracy" value={game.accuracy} />
                        <Tiny label="Time" value={`${game.totalTimeMs}ms`} />
                        <Tiny label="Variance" value={game.reactionVariance} />
                        <Tiny
                          label="Result"
                          value={game.humanityScore >= 65 ? "Passed" : "Low"}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.045] p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold">Signed attestation</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      This signature can be verified by apps or Soroban
                      contracts.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => copy(signature)}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
                  >
                    <Copy className="h-4 w-4" />
                    Copy signature
                  </button>
                </div>

                <pre className="max-h-[360px] overflow-auto rounded-2xl bg-black/60 p-4 text-xs text-blue-300">
                  {JSON.stringify(attestation.attestation, null, 2)}
                </pre>
              </section>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function EmptyState({ wallet, onConnect }) {
  const connected = Boolean(wallet);

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#080B18]/80 p-6 shadow-2xl shadow-blue-950/30 backdrop-blur sm:p-8">
      <div className="relative mx-auto max-w-3xl">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex items-start gap-4">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${
                connected
                  ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
                  : "border-blue-400/20 bg-blue-500/10 text-blue-300"
              }`}
            >
              {connected ? (
                <ShieldCheck className="h-6 w-6" />
              ) : (
                <Wallet className="h-6 w-6" />
              )}
            </div>

            <div>
              <div
                className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] ${
                  connected
                    ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
                    : "border-blue-400/20 bg-blue-500/10 text-blue-300"
                }`}
              >
                {connected ? "Ready to verify" : "Wallet required"}
              </div>

              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                {connected
                  ? "Begin humanity verification."
                  : "Connect wallet to view your profile."}
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
                {connected
                  ? "Your wallet is connected. Complete the humanity challenge to generate a reusable credential linked to this wallet."
                  : "Connect your Stellar wallet to view your humanity verification or complete a new humanity test on ZProof.ID."}
              </p>
            </div>
          </div>

          {connected ? (
            <Link
              to="/verify"
              className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3.5 text-sm font-bold text-slate-950 shadow-xl shadow-blue-950/30 transition hover:bg-blue-100 sm:w-auto"
            >
              <ShieldCheck className="h-4 w-4" />
              Start verification
            </Link>
          ) : (
            <button
              type="button"
              onClick={onConnect}
              className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3.5 text-sm font-bold text-slate-950 shadow-xl shadow-blue-950/30 transition hover:bg-blue-100 sm:w-auto"
            >
              <Wallet className="h-4 w-4" />
              Connect wallet
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function Metric({ icon, label, value }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-300">
        {icon}
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-xl font-bold text-white">{value}</p>
    </div>
  );
}

function InfoRow({ icon, label, value, copyValue }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-blue-300">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-slate-500">{label}</p>
          <p className="truncate text-sm font-semibold text-slate-200">
            {value}
          </p>
        </div>
      </div>

      {copyValue && (
        <button
          type="button"
          onClick={() => copy(copyValue)}
          className="rounded-full border border-white/10 bg-white/[0.04] p-2 text-slate-400 hover:text-white"
        >
          <Copy className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-2 truncate text-lg font-bold text-white">{value}</p>
    </div>
  );
}

function Tiny({ label, value }) {
  return (
    <div className="rounded-xl bg-white/[0.04] p-3">
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-slate-200">{value}</p>
    </div>
  );
}

function formatGameType(type) {
  const map = {
    signal_catch: "Signal Catch",
    sequence_memory: "Sequence Memory",
    path_trace: "Path Trace",
    pattern_shift: "Pattern Shift",
  };

  return map[type] || type;
}
