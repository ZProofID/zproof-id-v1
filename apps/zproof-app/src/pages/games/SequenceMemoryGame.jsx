import { useEffect, useMemo, useRef, useState } from "react";
import { Container, Graphics, Text } from "@pixi/react";

function seededRandom(seed) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }

  return () => {
    h += h << 13;
    h ^= h >>> 7;
    h += h << 3;
    h ^= h >>> 17;
    h += h << 5;
    return ((h >>> 0) % 10000) / 10000;
  };
}

function variance(values) {
  if (!values || values.length < 2) return 0;
  const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
  return (
    values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / values.length
  );
}

const pads = [
  { id: 0, x: 220, y: 190, color: 0x2563eb },
  { id: 1, x: 450, y: 190, color: 0x22c55e },
  { id: 2, x: 680, y: 190, color: 0xf97316 },
  { id: 3, x: 335, y: 390, color: 0xa855f7 },
  { id: 4, x: 565, y: 390, color: 0xec4899 },
];

export default function SequenceMemoryGame({
  challengeId,
  started,
  inputEvent,
  durationMs = 16000,
  onComplete,
}) {
  const sequenceLength = 6;

  const [remaining, setRemaining] = useState(durationMs);
  const [sequence, setSequence] = useState([]);
  const [activePad, setActivePad] = useState(null);
  const [phase, setPhase] = useState("idle");
  const [clicks, setClicks] = useState([]);
  const [errors, setErrors] = useState(0);

  const startTimeRef = useRef(null);
  const completedRef = useRef(false);
  const clicksRef = useRef([]);
  const errorsRef = useRef(0);
  const reactionTimesRef = useRef([]);
  const repeatStartRef = useRef(null);

  const generatedSequence = useMemo(() => {
    const rand = seededRandom(challengeId);
    return Array.from({ length: sequenceLength }, () =>
      Math.floor(rand() * pads.length)
    );
  }, [challengeId]);

  useEffect(() => {
    clicksRef.current = clicks;
  }, [clicks]);

  useEffect(() => {
    errorsRef.current = errors;
  }, [errors]);

  useEffect(() => {
    if (!started) return;

    completedRef.current = false;
    startTimeRef.current = performance.now();
    repeatStartRef.current = null;
    clicksRef.current = [];
    errorsRef.current = 0;
    reactionTimesRef.current = [];

    setRemaining(durationMs);
    setSequence(generatedSequence);
    setClicks([]);
    setErrors(0);
    setPhase("watch");

    let index = 0;

    const flash = setInterval(() => {
      if (index >= generatedSequence.length) {
        clearInterval(flash);
        setActivePad(null);
        repeatStartRef.current = performance.now();
        setPhase("repeat");
        return;
      }

      setActivePad(generatedSequence[index]);
      setTimeout(() => setActivePad(null), 350);
      index += 1;
    }, 700);

    return () => clearInterval(flash);
  }, [started, durationMs, generatedSequence]);

  function finishGame() {
    if (completedRef.current || !startTimeRef.current) return;
    completedRef.current = true;

    const totalTimeMs = Math.round(performance.now() - startTimeRef.current);
    const correct = clicksRef.current.filter(
      (value, index) => value === sequence[index]
    ).length;
    const accuracy = sequence.length === 0 ? 0 : correct / sequence.length;
    const reactionVariance = Math.round(variance(reactionTimesRef.current));

    const humanityScore = Math.max(
      0,
      Math.min(
        100,
        Math.round(accuracy * 80 + Math.max(0, 20 - errorsRef.current * 5))
      )
    );

    onComplete({
      challengeId,
      gameType: "sequence_memory",
      passed: humanityScore >= 65 && correct >= 4,
      humanityScore,
      correct,
      errors: errorsRef.current,
      accuracy: Number(accuracy.toFixed(2)),
      reactionVariance,
      totalTimeMs,
      backendReadyPayload: {
        challengeId,
        gameType: "sequence_memory",
        correct,
        errors: errorsRef.current,
        accuracy: Number(accuracy.toFixed(2)),
        reactionVariance,
        totalTimeMs,
        humanityScore,
      },
    });
  }

  useEffect(() => {
    if (!started || !startTimeRef.current) return;

    const timer = setInterval(() => {
      const elapsed = performance.now() - startTimeRef.current;
      const left = Math.max(0, durationMs - elapsed);
      setRemaining(left);
      if (left <= 0) finishGame();
    }, 100);

    return () => clearInterval(timer);
  }, [started, durationMs, sequence]);

  useEffect(() => {
    if (!started || !inputEvent || inputEvent.type !== "click") return;
    if (phase !== "repeat") return;

    const clickedPad = pads.find((pad) => {
      const dx = inputEvent.x - pad.x;
      const dy = inputEvent.y - pad.y;
      return Math.sqrt(dx * dx + dy * dy) <= 70;
    });

    if (!clickedPad) return;

    const now = performance.now();
    if (repeatStartRef.current) {
      reactionTimesRef.current.push(now - repeatStartRef.current);
      repeatStartRef.current = now;
    }

    const nextIndex = clicksRef.current.length;
    const expected = sequence[nextIndex];

    if (clickedPad.id !== expected) {
      setErrors((value) => value + 1);
    }

    const nextClicks = [...clicksRef.current, clickedPad.id];
    clicksRef.current = nextClicks;
    setClicks(nextClicks);

    setActivePad(clickedPad.id);
    setTimeout(() => setActivePad(null), 180);

    if (nextClicks.length >= sequence.length) {
      setTimeout(finishGame, 250);
    }
  }, [inputEvent, started, phase, sequence]);

  const seconds = Math.ceil(remaining / 1000);

  return (
    <Container>
      <Graphics
        draw={(g) => {
          g.clear();
          g.beginFill(0x020617);
          g.drawRoundedRect(0, 0, 900, 560, 28);
          g.endFill();
        }}
      />

      <Text
        text={
          started
            ? phase === "watch"
              ? `Watch the sequence   Time ${seconds}s`
              : `Repeat the sequence   ${clicks.length}/${sequence.length}   Errors ${errors}`
            : "Press Continue to begin"
        }
        x={28}
        y={22}
        style={{
          fill: "#e5e7eb",
          fontSize: 18,
          fontFamily: "Inter, Arial",
          fontWeight: "700",
        }}
      />

      {pads.map((pad) => (
        <Graphics
          key={pad.id}
          x={pad.x}
          y={pad.y}
          draw={(g) => {
            g.clear();
            g.beginFill(pad.color, activePad === pad.id ? 1 : 0.45);
            g.drawCircle(0, 0, activePad === pad.id ? 74 : 62);
            g.endFill();

            g.beginFill(0xffffff, activePad === pad.id ? 0.35 : 0.12);
            g.drawCircle(0, 0, 34);
            g.endFill();
          }}
        />
      ))}
    </Container>
  );
}
