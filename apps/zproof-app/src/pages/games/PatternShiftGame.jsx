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

const shapes = ["circle", "square", "triangle", "diamond"];
const colors = [0x38bdf8, 0x8b5cf6, 0x22c55e, 0xf97316, 0xec4899];

const positions = [
  { x: 180, y: 290 },
  { x: 315, y: 290 },
  { x: 450, y: 290 },
  { x: 585, y: 290 },
  { x: 720, y: 290 },
];

export default function PatternShiftGame({
  challengeId,
  started,
  inputEvent,
  durationMs = 24000,
  onComplete,
}) {
  const totalRounds = 6;
  const shuffleMs = 900;

  const [remaining, setRemaining] = useState(durationMs);
  const [round, setRound] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [misses, setMisses] = useState(0);
  const [activeFlash, setActiveFlash] = useState(null);
  const [isShuffling, setIsShuffling] = useState(false);
  const [shuffleFrame, setShuffleFrame] = useState(0);

  const startTimeRef = useRef(null);
  const roundStartRef = useRef(null);
  const completedRef = useRef(false);
  const lockedRef = useRef(false);
  const shuffleTimerRef = useRef(null);
  const shuffleIntervalRef = useRef(null);

  const reactionTimesRef = useRef([]);
  const correctRef = useRef(0);
  const missesRef = useRef(0);
  const roundRef = useRef(0);

  const pattern = useMemo(() => {
    const rand = seededRandom(challengeId);

    return Array.from({ length: totalRounds }, (_, index) => {
      const oddIndex = Math.floor(rand() * positions.length);

      const baseShape = shapes[Math.floor(rand() * shapes.length)];
      const possibleOddShapes = shapes.filter((shape) => shape !== baseShape);
      const oddShape =
        possibleOddShapes[Math.floor(rand() * possibleOddShapes.length)];

      const baseColor = colors[Math.floor(rand() * colors.length)];
      const possibleOddColors = colors.filter((color) => color !== baseColor);
      const oddColor =
        possibleOddColors[Math.floor(rand() * possibleOddColors.length)];

      const mode = rand() > 0.5 ? "shape" : "color";

      return {
        round: index,
        oddIndex,
        mode,
        items: positions.map((position, itemIndex) => ({
          id: itemIndex,
          x: position.x,
          y: position.y,
          shape:
            itemIndex === oddIndex && mode === "shape" ? oddShape : baseShape,
          color:
            itemIndex === oddIndex && mode === "color" ? oddColor : baseColor,
        })),
      };
    });
  }, [challengeId]);

  const shufflePattern = useMemo(() => {
    const rand = seededRandom(`${challengeId}-shuffle`);

    return Array.from({ length: totalRounds }, (_, roundIndex) =>
      Array.from({ length: 12 }, (_, frameIndex) =>
        positions.map((position, itemIndex) => ({
          id: itemIndex,
          x: position.x + (rand() - 0.5) * 44,
          y: position.y + (rand() - 0.5) * 38,
          shape: shapes[Math.floor(rand() * shapes.length)],
          color: colors[Math.floor(rand() * colors.length)],
          scale: 0.85 + rand() * 0.28,
          rotation: (rand() - 0.5) * 0.3,
          frameIndex,
          roundIndex,
        }))
      )
    );
  }, [challengeId]);

  useEffect(() => {
    correctRef.current = correct;
    missesRef.current = misses;
  }, [correct, misses]);

  useEffect(() => {
    roundRef.current = round;
  }, [round]);

  function clearShuffleTimers() {
    if (shuffleTimerRef.current) {
      clearTimeout(shuffleTimerRef.current);
      shuffleTimerRef.current = null;
    }

    if (shuffleIntervalRef.current) {
      clearInterval(shuffleIntervalRef.current);
      shuffleIntervalRef.current = null;
    }
  }

  function beginShuffle() {
    clearShuffleTimers();

    lockedRef.current = true;
    setActiveFlash(null);
    setIsShuffling(true);
    setShuffleFrame(0);

    shuffleIntervalRef.current = setInterval(() => {
      setShuffleFrame((value) => (value + 1) % 12);
    }, 75);

    shuffleTimerRef.current = setTimeout(() => {
      clearShuffleTimers();
      setIsShuffling(false);
      lockedRef.current = false;
      roundStartRef.current = performance.now();
    }, shuffleMs);
  }

  useEffect(() => {
    if (!started) return;

    completedRef.current = false;
    lockedRef.current = true;

    startTimeRef.current = performance.now();
    roundStartRef.current = null;
    reactionTimesRef.current = [];

    correctRef.current = 0;
    missesRef.current = 0;
    roundRef.current = 0;

    setRemaining(durationMs);
    setRound(0);
    setCorrect(0);
    setMisses(0);
    setActiveFlash(null);

    beginShuffle();

    return () => clearShuffleTimers();
  }, [started, durationMs]);

  function finishGame() {
    if (completedRef.current || !startTimeRef.current) return;

    completedRef.current = true;
    lockedRef.current = true;
    clearShuffleTimers();

    const totalTimeMs = Math.round(performance.now() - startTimeRef.current);
    const accuracy = correctRef.current / totalRounds;
    const reactionVariance = Math.round(variance(reactionTimesRef.current));

    const tooPerfectPenalty =
      accuracy === 1 && reactionVariance < 15_000 ? 4 : 0;

    const humanityScore = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          accuracy * 82 +
            Math.min(reactionVariance / 80_000, 14) -
            tooPerfectPenalty
        )
      )
    );

    onComplete({
      challengeId,
      gameType: "pattern_shift",
      passed: humanityScore >= 65 && correctRef.current >= 4,
      humanityScore,
      correct: correctRef.current,
      misses: missesRef.current,
      accuracy: Number(accuracy.toFixed(2)),
      reactionVariance,
      totalTimeMs,
      backendReadyPayload: {
        challengeId,
        gameType: "pattern_shift",
        correct: correctRef.current,
        misses: missesRef.current,
        accuracy: Number(accuracy.toFixed(2)),
        reactionVariance,
        totalTimeMs,
        humanityScore,
      },
    });
  }

  function advanceRound() {
    const nextRound = roundRef.current + 1;

    if (nextRound >= totalRounds) {
      finishGame();
      return;
    }

    roundRef.current = nextRound;
    setRound(nextRound);
    beginShuffle();
  }

  useEffect(() => {
    if (!started || !startTimeRef.current) return;

    const timer = setInterval(() => {
      const elapsed = performance.now() - startTimeRef.current;
      const left = Math.max(0, durationMs - elapsed);

      setRemaining(left);

      // Display only. Pattern Shift finishes after all rounds.
    }, 100);

    return () => clearInterval(timer);
  }, [started, durationMs]);

  useEffect(() => {
    if (!started || !inputEvent || inputEvent.type !== "click") return;
    if (completedRef.current || lockedRef.current || isShuffling) return;
    if (roundRef.current >= totalRounds) return;

    const current = pattern[roundRef.current];

    const clickedItem = current.items.find((item) => {
      const dx = inputEvent.x - item.x;
      const dy = inputEvent.y - item.y;
      return Math.sqrt(dx * dx + dy * dy) <= 68;
    });

    if (!clickedItem) return;

    lockedRef.current = true;

    const now = performance.now();

    if (roundStartRef.current) {
      reactionTimesRef.current.push(now - roundStartRef.current);
    }

    const isCorrect = clickedItem.id === current.oddIndex;

    if (isCorrect) {
      const next = correctRef.current + 1;
      correctRef.current = next;
      setCorrect(next);
    } else {
      const next = missesRef.current + 1;
      missesRef.current = next;
      setMisses(next);
    }

    setActiveFlash({
      id: clickedItem.id,
      correct: isCorrect,
    });

    setTimeout(advanceRound, 520);
  }, [inputEvent, started, pattern, isShuffling]);

  const seconds = Math.ceil(remaining / 1000);
  const currentRound = pattern[roundRef.current] || pattern[0];

  const visibleItems =
    isShuffling && started
      ? shufflePattern[roundRef.current]?.[shuffleFrame] || currentRound.items
      : currentRound.items;

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
            ? `${
                isShuffling ? "Pattern shifting..." : "Find the odd item"
              }   Round ${Math.min(
                round + 1,
                totalRounds
              )}/${totalRounds}   Correct ${correct}   Misses ${misses}   Time ${seconds}s`
            : "Press Continue to begin"
        }
        x={28}
        y={22}
        style={{
          fill: "#e5e7eb",
          fontSize: 17,
          fontFamily: "Inter, Arial",
          fontWeight: "700",
        }}
      />

      <Text
        text={
          isShuffling
            ? "Watch the pattern settle"
            : currentRound.mode === "shape"
            ? "Click the shape that breaks the pattern"
            : "Click the color that breaks the pattern"
        }
        x={isShuffling ? 330 : 278}
        y={100}
        style={{
          fill: isShuffling ? "#cbd5e1" : "#94a3b8",
          fontSize: 18,
          fontFamily: "Inter, Arial",
          fontWeight: "600",
        }}
      />

      {started &&
        visibleItems.map((item) => (
          <Graphics
            key={item.id}
            x={item.x}
            y={item.y}
            scale={item.scale || 1}
            rotation={item.rotation || 0}
            draw={(g) => {
              g.clear();

              const flashed = activeFlash?.id === item.id;
              const color = flashed
                ? activeFlash.correct
                  ? 0x22c55e
                  : 0xef4444
                : item.color || 0x38bdf8;

              g.beginFill(color, flashed ? 0.95 : isShuffling ? 0.5 : 0.74);

              if (item.shape === "circle") {
                g.drawCircle(0, 0, 46);
              }

              if (item.shape === "square") {
                g.drawRoundedRect(-44, -44, 88, 88, 14);
              }

              if (item.shape === "triangle") {
                g.moveTo(0, -54);
                g.lineTo(52, 42);
                g.lineTo(-52, 42);
                g.closePath();
              }

              if (item.shape === "diamond") {
                g.moveTo(0, -54);
                g.lineTo(52, 0);
                g.lineTo(0, 54);
                g.lineTo(-52, 0);
                g.closePath();
              }

              g.endFill();

              g.beginFill(0xffffff, isShuffling ? 0.08 : 0.14);
              g.drawCircle(0, 0, 16);
              g.endFill();
            }}
          />
        ))}
    </Container>
  );
}
