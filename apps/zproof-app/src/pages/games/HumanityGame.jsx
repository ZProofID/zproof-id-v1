import { useEffect, useMemo, useRef, useState } from "react";
import { Stage } from "@pixi/react";
import {
  ArrowLeft,
  BadgeCheck,
  Loader2,
  RotateCcw,
  ShieldCheck,
  UserCircle,
  Wallet,
  X,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import SignalGame from "./SignalGame";
import SequenceMemoryGame from "./SequenceMemoryGame";
import PathTraceGame from "./PathTraceGame";
import PatternShiftGame from "./PatternShiftGame";
import { useStates } from "../../contexts/StatesContext";
import { WalletKitService } from "../../wallet-kit/services/global-service";
import { Networks } from "@stellar/stellar-sdk";

const HUMANITY_API_URL =
  import.meta.env.VITE_HUMANITY_API_URL || "http://localhost:4300";

const ATTESTATION_STORAGE_KEY = "humanity-attestation";
const PROFILE_STORAGE_KEY = "zproof-user-profile";

const ONCHAIN_FEE_LABEL = "25 XLM";
const NETWORK_KEY = "TESTNET";

const games = [
  {
    id: "signal",
    title: "Signal Catch",
    Component: SignalGame,
    durationMs: 18000,
  },
  {
    id: "sequence",
    title: "Sequence Memory",
    Component: SequenceMemoryGame,
    durationMs: 16000,
  },
  {
    id: "path",
    title: "Path Trace",
    Component: PathTraceGame,
    durationMs: 14000,
  },
  {
    id: "pattern",
    title: "Pattern Shift",
    Component: PatternShiftGame,
    durationMs: 24000,
  },
];

function variance(values) {
  if (!values || values.length < 2) return 0;
  const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
  return (
    values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / values.length
  );
}

function average(values) {
  if (!values || values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function shortWallet(value) {
  if (!value) return "Not connected";
  const text = String(value);
  return text.length > 18 ? `${text.slice(0, 8)}...${text.slice(-8)}` : text;
}

function getStoredAttestation() {
  try {
    const raw = localStorage.getItem(ATTESTATION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveVerificationProfile(verification) {
  const profile = {
    wallet: verification.wallet,
    verified: Boolean(verification.passed || verification.verified),
    confidenceLevel: verification.confidenceLevel,
    adjustedHumanityScore: verification.adjustedHumanityScore,
    averageHumanityScore: verification.averageHumanityScore,
    averageAccuracy: verification.averageAccuracy,
    gamesPassed: verification.gamesPassed,
    totalGames: verification.totalGames,
    issuedAt: verification.issuedAt,
    expiresAt: verification.expiresAt,
    publicKey: verification.attestation?.publicKey,
    signature: verification.attestation?.signature,
    challengeId: verification.challengeId,
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(ATTESTATION_STORAGE_KEY, JSON.stringify(verification));
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));

  return profile;
}

async function createHumanityChallenge(wallet) {
  const response = await fetch(`${HUMANITY_API_URL}/api/humanity/challenges`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      wallet,
      sessionId: `session-${Date.now()}`,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error || "Failed to create humanity challenge");
  }

  return response.json();
}

async function prepareVerificationHumanityAttempt({
  wallet,
  challengeId,
  results,
  finalPayload,
}) {
  const response = await fetch(
    `${HUMANITY_API_URL}/api/humanity/prepare-verification`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        wallet,
        challengeId,
        results,
        payload: finalPayload,
      }),
    }
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || "Failed to prepare humanity verification");
  }

  return data;
}

async function submitVerifyHumanityAttempt({
  wallet,
  signedXdr,
  network = NETWORK_KEY,
  challengeId,
  results,
  finalPayload,
}) {
  const response = await fetch(
    `${HUMANITY_API_URL}/api/humanity/submit-verification`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        wallet,
        signedXdr,
        network,
        challengeId,
        results,
        payload: finalPayload,
      }),
    }
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || "Failed to submit humanity verification");
  }

  return data;
}

export default function HumanityGame() {
  const { userKey, setWalletKitIsOpen } = useStates();

  const connectedWallet = userKey || null;
  const walletConnected = Boolean(connectedWallet);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const [inputEvent, setInputEvent] = useState(null);
  const [results, setResults] = useState([]);
  const [challenge, setChallenge] = useState(null);
  const [challengeLoading, setChallengeLoading] = useState(false);
  const [backendError, setBackendError] = useState(null);
  const [verification, setVerification] = useState(null);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [hasStoredProfile, setHasStoredProfile] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(null);
  const [prepareLoading, setPrepareLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const verificationStartedRef = useRef(false);

  const currentGame = games[currentIndex];
  const CurrentComponent = currentGame.Component;

  const fallbackChallengeId = useMemo(() => {
    if (crypto?.randomUUID) return crypto.randomUUID();
    return `challenge-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }, []);

  useEffect(() => {
    setHasStoredProfile(Boolean(getStoredAttestation()));
  }, []);

  const baseChallengeId = challenge?.challengeId || fallbackChallengeId;
  const gameChallengeId = `${baseChallengeId}-${currentGame.id}`;

  const completed = results.length === games.length;
  const progressPercent = completed
    ? 100
    : Math.round((results.length / games.length) * 100);

  const backendVerified = Boolean(
    verification?.passed || verification?.verified
  );

  const navigate = useNavigate();

  const statusLabel = !walletConnected
    ? "Wallet required"
    : verification
    ? backendVerified
      ? "Verified"
      : "Rejected"
    : verificationLoading
    ? "Verifying"
    : prepareLoading
    ? "Preparing"
    : completed
    ? "Complete"
    : started
    ? "In progress"
    : "Ready";

  function getGamePoint(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * 900,
      y: ((event.clientY - rect.top) / rect.height) * 560,
    };
  }

  async function startGame() {
    if (!connectedWallet) {
      setWalletKitIsOpen(true);
      return;
    }

    setBackendError(null);

    try {
      if (!challenge) {
        setChallengeLoading(true);
        const newChallenge = await createHumanityChallenge(connectedWallet);
        setChallenge(newChallenge);
      }

      setStarted(true);
      setInputEvent(null);
    } catch (error) {
      setBackendError(error.message || "Could not start challenge");
    } finally {
      setChallengeLoading(false);
    }
  }

  function restartAll() {
    setCurrentIndex(0);
    setStarted(false);
    setInputEvent(null);
    setResults([]);
    setChallenge(null);
    setBackendError(null);
    setVerification(null);
    setVerificationLoading(false);
    setPendingVerification(null);
    setPrepareLoading(false);
    setModalOpen(false);
    verificationStartedRef.current = false;
  }

  function handleCancelModal() {
    setModalOpen(false);
  }

  function handleTryAgain() {
    restartAll();
  }

  function handleGameComplete(payload) {
    const nextResults = [...results, payload];

    setResults(nextResults);
    setStarted(false);
    setInputEvent(null);

    if (currentIndex < games.length - 1) {
      setCurrentIndex((value) => value + 1);
    }
  }

  const finalPayload = completed
    ? (() => {
        const scores = results.map((result) => result.humanityScore);
        const accuracies = results
          .map((result) => result.accuracy)
          .filter((value) => typeof value === "number");
        const reactionVariances = results
          .map((result) => result.reactionVariance)
          .filter((value) => typeof value === "number");

        const averageHumanityScore = Math.round(average(scores));
        const averageAccuracy = Number(average(accuracies).toFixed(2));
        const accuracyVariance = Number(variance(accuracies).toFixed(4));
        const scoreVariance = Math.round(variance(scores));
        const averageReactionVariance = Math.round(average(reactionVariances));
        const gamesPassed = results.filter((result) => result.passed).length;

        const extremelyHighAccuracy =
          accuracies.length >= 3 &&
          accuracies.every((accuracy) => accuracy >= 0.95);

        const lowAccuracyVariance =
          accuracies.length >= 3 && accuracyVariance < 0.002;
        const lowScoreVariance = scoreVariance < 15;
        const lowReactionVariance =
          reactionVariances.length >= 2 && averageReactionVariance < 120000;

        const roboticConsistency =
          extremelyHighAccuracy &&
          lowAccuracyVariance &&
          (lowReactionVariance || lowScoreVariance);

        const botRiskScore =
          (extremelyHighAccuracy ? 25 : 0) +
          (lowAccuracyVariance ? 25 : 0) +
          (lowReactionVariance ? 25 : 0) +
          (lowScoreVariance ? 15 : 0);

        const adjustedHumanityScore = Math.max(
          0,
          Math.min(100, averageHumanityScore - (roboticConsistency ? 15 : 0))
        );

        const passed =
          gamesPassed >= 3 &&
          adjustedHumanityScore >= 65 &&
          !roboticConsistency;

        const confidenceLevel =
          adjustedHumanityScore >= 85 && gamesPassed >= 3 && !roboticConsistency
            ? "high"
            : adjustedHumanityScore >= 70 && gamesPassed >= 3
            ? "medium"
            : "low";

        return {
          analyticsVersion: "humanity-engine-mvp-v1",
          wallet: connectedWallet,
          challengeId: baseChallengeId,
          passed,
          confidenceLevel,
          averageHumanityScore,
          adjustedHumanityScore,
          averageAccuracy,
          gamesPassed,
          totalGames: results.length,
          varianceAnalytics: {
            accuracyVariance,
            scoreVariance,
            averageReactionVariance,
          },
          botRiskSignals: {
            botRiskScore,
            extremelyHighAccuracy,
            lowAccuracyVariance,
            lowReactionVariance,
            lowScoreVariance,
            roboticConsistency,
            reason: roboticConsistency
              ? "The attempt was highly accurate with unusually low variance across multiple signals."
              : "No strong robotic consistency pattern detected.",
          },
          results,
          backendReadyPayload: {
            analyticsVersion: "humanity-engine-mvp-v1",
            wallet: connectedWallet,
            challengeId: baseChallengeId,
            passed,
            confidenceLevel,
            averageHumanityScore,
            adjustedHumanityScore,
            averageAccuracy,
            gamesPassed,
            totalGames: results.length,
            varianceAnalytics: {
              accuracyVariance,
              scoreVariance,
              averageReactionVariance,
            },
            botRiskSignals: {
              botRiskScore,
              extremelyHighAccuracy,
              lowAccuracyVariance,
              lowReactionVariance,
              lowScoreVariance,
              roboticConsistency,
            },
            gameProofInputs: results.map(
              (result) => result.backendReadyPayload
            ),
          },
        };
      })()
    : null;

  useEffect(() => {
    if (
      !walletConnected ||
      !completed ||
      !challenge ||
      !finalPayload ||
      verificationStartedRef.current
    ) {
      return;
    }

    verificationStartedRef.current = true;
    setBackendError(null);

    if (!finalPayload.passed) {
      setPendingVerification({
        passed: false,
        localResult: finalPayload,
        prepared: null,
      });
      setModalOpen(true);
      return;
    }

    async function prepare() {
      setPrepareLoading(true);

      try {
        const prepared = await prepareVerificationHumanityAttempt({
          wallet: connectedWallet,
          challengeId: challenge.challengeId,
          results: finalPayload.backendReadyPayload.gameProofInputs,
          finalPayload: finalPayload.backendReadyPayload,
        });

        setPendingVerification({
          passed: true,
          localResult: finalPayload,
          prepared,
        });
        setModalOpen(true);
      } catch (error) {
        setBackendError(
          error.message || "Could not prepare humanity verification"
        );
        verificationStartedRef.current = false;
      } finally {
        setPrepareLoading(false);
      }
    }

    prepare();
  }, [walletConnected, connectedWallet, completed, challenge, finalPayload]);

  async function confirmOnchain() {
    if (!pendingVerification?.prepared?.xdr?.xdr) {
      setBackendError("Prepared transaction is missing");
      return;
    }

    setBackendError(null);
    setVerificationLoading(true);

    try {
      const signedXdr = await WalletKitService.signTx(
        pendingVerification.prepared.xdr.xdr,
        {
          networkPassphrase: Networks[NETWORK_KEY],
          network: NETWORK_KEY,
        }
      );

      const response = await submitVerifyHumanityAttempt({
        signedXdr,
        network: NETWORK_KEY,
        wallet: connectedWallet,
        challengeId: challenge.challengeId,
        results: finalPayload.backendReadyPayload.gameProofInputs,
        finalPayload: finalPayload.backendReadyPayload,
      });

      setVerification(response);
      saveVerificationProfile(response);
      setHasStoredProfile(true);
      setModalOpen(false);
      navigate("/profile");
    } catch (error) {
      setBackendError(
        error.message || "Could not submit humanity verification"
      );
    } finally {
      setVerificationLoading(false);
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#050711] text-white">
      <div className="relative mx-auto max-w-6xl px-6 py-6">
        <nav className="flex items-center justify-between gap-4">
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
              className={`hidden items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold sm:inline-flex ${
                walletConnected
                  ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
                  : "border-blue-400/20 bg-blue-500/10 text-blue-300"
              }`}
            >
              <Wallet className="h-4 w-4" />
              {walletConnected
                ? shortWallet(connectedWallet)
                : "Connect wallet"}
            </button>

            {hasStoredProfile && (
              <Link
                to="/profile"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
              >
                <UserCircle className="h-4 w-4" />
                Profile
              </Link>
            )}

            <button
              type="button"
              onClick={restartAll}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
            >
              <RotateCcw className="h-4 w-4" />
              Restart
            </button>
          </div>
        </nav>

        <section className="mt-10">
          <div className="mb-6 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-white">
                Verify humanity
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Complete four lightweight behavioral humanity attestation
                challenges and link the result to your Stellar wallet.
              </p>
            </div>

            <div
              className={`inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
                !walletConnected
                  ? "bg-slate-500/15 text-slate-300"
                  : backendVerified
                  ? "bg-green-500/15 text-green-300"
                  : statusLabel === "Rejected"
                  ? "bg-red-500/15 text-red-300"
                  : "bg-blue-500/15 text-blue-300"
              }`}
            >
              {(verificationLoading || prepareLoading) && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {backendVerified && <BadgeCheck className="h-4 w-4" />}
              {statusLabel}
            </div>
          </div>

          {backendError && (
            <div className="mb-5 rounded-2xl border border-red-500/30 bg-red-950/40 p-4 text-sm text-red-200">
              {backendError}
            </div>
          )}

          {!walletConnected ? (
            <ConnectWalletView onConnect={() => setWalletKitIsOpen(true)} />
          ) : (
            <>
              <div className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-4 shadow-2xl shadow-blue-950/30 backdrop-blur">
                <div className="mb-4 flex flex-col gap-4 rounded-[1.5rem] border border-white/10 bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-slate-400">
                      Game {Math.min(currentIndex + 1, games.length)} of{" "}
                      {games.length}
                    </p>
                    <h2 className="mt-1 text-xl font-bold text-white">
                      {completed ? "Challenge complete" : currentGame.title}
                    </h2>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {games.map((game, index) => {
                      const isDone = index < results.length;
                      const isActive = index === currentIndex && !completed;

                      return (
                        <div
                          key={game.id}
                          className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                            isDone
                              ? "border-green-400/20 bg-green-500/10 text-green-300"
                              : isActive
                              ? "border-blue-400/30 bg-blue-500/10 text-blue-200"
                              : "border-white/10 bg-white/[0.03] text-slate-500"
                          }`}
                        >
                          {index + 1}. {game.title}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mb-4">
                  <div className="mb-2 flex justify-between text-xs text-slate-400">
                    <span>Progress</span>
                    <span>{progressPercent}%</span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-white"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                <div className="relative mx-auto aspect-[900/560] w-full max-w-[900px] overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950">
                  <div className="pointer-events-none absolute inset-0 [&_canvas]:!h-full [&_canvas]:!w-full">
                    <Stage
                      width={900}
                      height={560}
                      options={{ backgroundAlpha: 0, antialias: true }}
                    >
                      <CurrentComponent
                        key={gameChallengeId}
                        challengeId={gameChallengeId}
                        started={started}
                        inputEvent={inputEvent}
                        durationMs={currentGame.durationMs}
                        onComplete={handleGameComplete}
                      />
                    </Stage>
                  </div>

                  <div
                    className="absolute inset-0 cursor-crosshair"
                    onPointerMove={(event) => {
                      if (!started) return;
                      const point = getGamePoint(event);
                      setInputEvent({
                        id: performance.now(),
                        type: "move",
                        x: point.x,
                        y: point.y,
                      });
                    }}
                    onPointerDown={(event) => {
                      if (!started) return;
                      const point = getGamePoint(event);
                      setInputEvent({
                        id: performance.now(),
                        type: "click",
                        x: point.x,
                        y: point.y,
                      });
                    }}
                  />
                </div>

                <div className="mt-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div className="text-xs leading-5 text-slate-500">
                    Wallet:{" "}
                    <span className="font-semibold text-slate-300">
                      {shortWallet(connectedWallet)}
                    </span>
                  </div>

                  {!started && !completed && (
                    <button
                      type="button"
                      onClick={startGame}
                      disabled={challengeLoading}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-950 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {challengeLoading && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      {challengeLoading
                        ? "Preparing..."
                        : results.length === 0
                        ? "Start challenge"
                        : "Continue"}
                    </button>
                  )}

                  {prepareLoading && (
                    <div className="inline-flex items-center gap-2 rounded-2xl border border-blue-400/20 bg-blue-500/10 px-4 py-3 text-sm font-semibold text-blue-200">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Preparing verification
                    </div>
                  )}

                  {verificationLoading && (
                    <div className="inline-flex items-center gap-2 rounded-2xl border border-blue-400/20 bg-blue-500/10 px-4 py-3 text-sm font-semibold text-blue-200">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Confirming on-chain
                    </div>
                  )}

                  {verification && (
                    <div
                      className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold ${
                        backendVerified
                          ? "bg-green-500/15 text-green-300"
                          : "bg-red-500/15 text-red-300"
                      }`}
                    >
                      <BadgeCheck className="h-4 w-4" />
                      Backend {backendVerified ? "verified" : "rejected"}
                    </div>
                  )}
                </div>
              </div>

              {(verification || finalPayload) && (
                <section className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-white">
                        {verification ? "Verification" : "Local preview"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {verification
                          ? "Signed response returned by the verification server."
                          : "Frontend payload before backend attestation."}
                      </p>
                    </div>

                    {verification && (
                      <Link
                        to="/profile"
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
                      >
                        <UserCircle className="h-4 w-4" />
                        View profile
                      </Link>
                    )}
                  </div>

                  <pre
                    className={`max-h-[420px] overflow-auto rounded-2xl bg-black/60 p-4 text-xs ${
                      verification ? "text-blue-300" : "text-green-300"
                    }`}
                  >
                    {JSON.stringify(verification || finalPayload, null, 2)}
                  </pre>
                </section>
              )}
            </>
          )}
        </section>
      </div>

      {modalOpen && pendingVerification && (
        <VerificationDecisionModal
          pendingVerification={pendingVerification}
          onCancel={handleCancelModal}
          onTryAgain={handleTryAgain}
          onConfirm={confirmOnchain}
          confirming={verificationLoading}
          feeLabel={ONCHAIN_FEE_LABEL}
          networkLabel="Stellar Testnet"
        />
      )}
    </main>
  );
}

function VerificationDecisionModal({
  pendingVerification,
  onCancel,
  onTryAgain,
  onConfirm,
  confirming,
  feeLabel,
  networkLabel,
}) {
  const result = pendingVerification.localResult;
  const passed = Boolean(pendingVerification.passed);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#02040c]/40 px-4 py-6 backdrop-blur-sm">
      <div className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/10 bg-[#080B18]/95 shadow-2xl shadow-blue-950/50">
        <button
          type="button"
          onClick={onCancel}
          disabled={confirming}
          className="absolute right-5 top-5 rounded-full border border-white/10 bg-white/[0.04] p-2 text-slate-400 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6 sm:p-7">
          <div
            className={`mb-5 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] ${
              passed
                ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
                : "border-red-400/20 bg-red-500/10 text-red-300"
            }`}
          >
            {passed ? (
              <ShieldCheck className="h-3.5 w-3.5" />
            ) : (
              <X className="h-3.5 w-3.5" />
            )}
            {passed ? "Verification passed" : "Verification failed"}
          </div>

          <h2 className="text-2xl font-semibold tracking-tight text-white">
            {passed
              ? "Confirm on-chain to create your Humanity ID."
              : "This attempt did not meet the verification threshold."}
          </h2>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            {passed
              ? "Your result is ready. Confirm with your wallet to anchor an immutable ZProof.ID humanity credential on Stellar."
              : "Please try again with a fresh challenge or cancel this attempt."}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs text-slate-500">Score</p>
              <p className="mt-2 text-xl font-bold text-white">
                {result.adjustedHumanityScore ?? "n/a"}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs text-slate-500">Confidence</p>
              <p className="mt-2 text-xl font-bold text-white">
                {result.confidenceLevel ?? "low"}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs text-slate-500">Games</p>
              <p className="mt-2 text-xl font-bold text-white">
                {result.gamesPassed ?? 0}/{result.totalGames ?? 4}
              </p>
            </div>
          </div>

          {passed && (
            <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-slate-500">Network</p>
                  <p className="mt-1 text-sm font-semibold text-slate-200">
                    {networkLabel}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-slate-500">ID fee</p>
                  <p className="mt-1 text-sm font-semibold text-slate-200">
                    {feeLabel}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              disabled={confirming}
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-slate-200 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            {passed ? (
              <button
                type="button"
                onClick={onConfirm}
                disabled={confirming}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-950 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {confirming && <Loader2 className="h-4 w-4 animate-spin" />}
                {confirming ? "Confirming..." : "Confirm on-chain"}
              </button>
            ) : (
              <button
                type="button"
                onClick={onTryAgain}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-950 hover:bg-blue-100"
              >
                Try again
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ConnectWalletView({ onConnect }) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-slate-700 bg-[#080B18]/80 p-6 shadow-2xl shadow-blue-950/30 backdrop-blur sm:p-8">
      <div className="relative mx-auto max-w-3xl">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-500/10 text-blue-300">
              <Wallet className="h-6 w-6" />
            </div>

            <div>
              <div className="inline-flex rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-blue-300">
                Wallet required
              </div>

              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Connect wallet to start.
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
                Your wallet anchors the humanity credential. Private challenge
                data stays hidden.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onConnect}
            className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3.5 text-sm font-bold text-slate-950 shadow-xl shadow-blue-950/30 transition hover:bg-blue-100 sm:w-auto"
          >
            Connect wallet
          </button>
        </div>

        <div className="mt-6 grid gap-3 border-t border-white/10 pt-6 sm:grid-cols-3">
          <div>
            <p className="text-xs font-semibold text-slate-500">01</p>
            <p className="mt-1 text-sm font-bold text-slate-400">
              Connect wallet
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500">02</p>
            <p className="mt-1 text-sm font-bold text-slate-400">
              Complete challenge
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500">03</p>
            <p className="mt-1 text-sm font-bold text-slate-400">
              Receive credential
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
