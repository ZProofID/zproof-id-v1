import { useEffect, useMemo, useRef, useState } from "react";
import { Container, Graphics, Text } from "@pixi/react";

function variance(values) {
  if (!values || values.length < 2) return 0;
  const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
  return (
    values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / values.length
  );
}

function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

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

function shuffleSeeded(items, rand) {
  const next = [...items];

  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }

  return next;
}

const pathLibrary = [
  {
    id: "zigzag",
    label: "Zigzag trace",
    instruction: "Trace the changing path",
    points: [
      { x: 120, y: 300 },
      { x: 230, y: 210 },
      { x: 360, y: 330 },
      { x: 500, y: 220 },
      { x: 650, y: 340 },
      { x: 780, y: 260 },
    ],
  },
  {
    id: "triangle",
    label: "Triangle trace",
    instruction: "Trace the triangle corners",
    points: [
      { x: 450, y: 160 },
      { x: 230, y: 395 },
      { x: 670, y: 395 },
      { x: 450, y: 160 },
    ],
  },
  {
    id: "diamond",
    label: "Diamond trace",
    instruction: "Trace the diamond shape",
    points: [
      { x: 450, y: 145 },
      { x: 675, y: 285 },
      { x: 450, y: 425 },
      { x: 225, y: 285 },
      { x: 450, y: 145 },
    ],
  },
  {
    id: "box",
    label: "Box trace",
    instruction: "Trace the square route",
    points: [
      { x: 260, y: 180 },
      { x: 640, y: 180 },
      { x: 640, y: 390 },
      { x: 260, y: 390 },
      { x: 260, y: 180 },
    ],
  },
  {
    id: "wave",
    label: "Wave trace",
    instruction: "Trace the wave motion",
    points: [
      { x: 130, y: 310 },
      { x: 240, y: 220 },
      { x: 350, y: 340 },
      { x: 470, y: 220 },
      { x: 590, y: 340 },
      { x: 720, y: 245 },
    ],
  },
  {
    id: "curve",
    label: "Curve trace",
    instruction: "Trace the curved sweep",
    points: [
      { x: 170, y: 330 },
      { x: 250, y: 245 },
      { x: 365, y: 210 },
      { x: 500, y: 240 },
      { x: 625, y: 315 },
      { x: 745, y: 260 },
    ],
  },
  {
    id: "stair",
    label: "Stair trace",
    instruction: "Trace the stair-step path",
    points: [
      { x: 160, y: 390 },
      { x: 260, y: 390 },
      { x: 260, y: 310 },
      { x: 390, y: 310 },
      { x: 390, y: 230 },
      { x: 540, y: 230 },
      { x: 540, y: 160 },
      { x: 700, y: 160 },
    ],
  },
  {
    id: "hourglass",
    label: "Hourglass trace",
    instruction: "Trace the crossing path",
    points: [
      { x: 250, y: 170 },
      { x: 650, y: 170 },
      { x: 450, y: 285 },
      { x: 650, y: 405 },
      { x: 250, y: 405 },
      { x: 450, y: 285 },
      { x: 250, y: 170 },
    ],
  },
];

export default function PathTraceGame({
  challengeId,
  started,
  inputEvent,
  durationMs = 30000,
  onComplete,
}) {
  const requiredStages = 3;

  const [remaining, setRemaining] = useState(durationMs);
  const [stageIndex, setStageIndex] = useState(0);
  const [currentTarget, setCurrentTarget] = useState(0);
  const [samples, setSamples] = useState([]);
  const [offPathMoves, setOffPathMoves] = useState(0);
  const [stageFlash, setStageFlash] = useState(null);

  const startTimeRef = useRef(null);
  const completedRef = useRef(false);

  const stageIndexRef = useRef(0);
  const currentTargetRef = useRef(0);
  const samplesRef = useRef([]);
  const offPathRef = useRef(0);

  const moveDistancesRef = useRef([]);
  const directionChangesRef = useRef(0);
  const lastPointRef = useRef(null);
  const lastDxRef = useRef(0);
  const lastDyRef = useRef(0);

  const reachedPointsRef = useRef(0);
  const reachedByStageRef = useRef({});
  const stageStatsRef = useRef({});

  const stages = useMemo(() => {
    const rand = seededRandom(`${challengeId}-path-trace-v2`);
    return shuffleSeeded(pathLibrary, rand).slice(0, requiredStages);
  }, [challengeId]);

  const totalPoints = useMemo(
    () => stages.reduce((sum, stage) => sum + stage.points.length, 0),
    [stages]
  );

  const currentStage = stages[stageIndex] || stages[0];
  const currentPoints = currentStage.points;

  useEffect(() => {
    stageIndexRef.current = stageIndex;
  }, [stageIndex]);

  useEffect(() => {
    currentTargetRef.current = currentTarget;
  }, [currentTarget]);

  useEffect(() => {
    samplesRef.current = samples;
  }, [samples]);

  useEffect(() => {
    offPathRef.current = offPathMoves;
  }, [offPathMoves]);

  useEffect(() => {
    if (!started) return;

    completedRef.current = false;

    startTimeRef.current = performance.now();
    stageIndexRef.current = 0;
    currentTargetRef.current = 0;
    samplesRef.current = [];
    offPathRef.current = 0;

    moveDistancesRef.current = [];
    directionChangesRef.current = 0;
    lastPointRef.current = null;
    lastDxRef.current = 0;
    lastDyRef.current = 0;

    reachedPointsRef.current = 0;
    reachedByStageRef.current = {};
    stageStatsRef.current = {};

    stages.forEach((stage) => {
      reachedByStageRef.current[stage.id] = 0;
      stageStatsRef.current[stage.id] = {
        id: stage.id,
        label: stage.label,
        completedPoints: 0,
        totalPoints: stage.points.length,
      };
    });

    setRemaining(durationMs);
    setStageIndex(0);
    setCurrentTarget(0);
    setSamples([]);
    setOffPathMoves(0);
    setStageFlash(null);
  }, [started, durationMs, stages]);

  function finishGame() {
    if (completedRef.current || !startTimeRef.current) return;
    completedRef.current = true;

    const totalTimeMs = Math.round(performance.now() - startTimeRef.current);
    const completedPoints = reachedPointsRef.current;
    const accuracy = totalPoints === 0 ? 0 : completedPoints / totalPoints;

    const movementVariance = Math.round(variance(moveDistancesRef.current));

    const completedStages = stages.filter((stage) => {
      const reached = reachedByStageRef.current[stage.id] || 0;
      return reached >= stage.points.length;
    }).length;

    const stageCompletionRatio =
      stages.length === 0 ? 0 : completedStages / stages.length;

    const offPathPenalty = Math.min(offPathRef.current * 0.28, 18);
    const movementSignal = Math.min(directionChangesRef.current * 1.05, 12);
    const completionScore = accuracy * 78;
    const stageScore = stageCompletionRatio * 10;

    const humanityScore = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          completionScore + stageScore + movementSignal - offPathPenalty
        )
      )
    );

    onComplete({
      challengeId,
      gameType: "path_trace",
      passed:
        humanityScore >= 65 &&
        completedPoints >= Math.ceil(totalPoints * 0.75) &&
        completedStages >= 2,
      humanityScore,
      completedPoints,
      totalPoints,
      completedStages,
      totalStages: stages.length,
      selectedPaths: stages.map((stage) => stage.id),
      stageResults: stages.map((stage) => ({
        id: stage.id,
        label: stage.label,
        completedPoints: reachedByStageRef.current[stage.id] || 0,
        totalPoints: stage.points.length,
      })),
      accuracy: Number(accuracy.toFixed(2)),
      offPathMoves: offPathRef.current,
      movementVariance,
      directionChanges: directionChangesRef.current,
      reactionVariance: movementVariance,
      totalTimeMs,
      backendReadyPayload: {
        challengeId,
        gameType: "path_trace",
        completedPoints,
        totalPoints,
        completedStages,
        totalStages: stages.length,
        selectedPaths: stages.map((stage) => stage.id),
        stageResults: stages.map((stage) => ({
          id: stage.id,
          label: stage.label,
          completedPoints: reachedByStageRef.current[stage.id] || 0,
          totalPoints: stage.points.length,
        })),
        accuracy: Number(accuracy.toFixed(2)),
        offPathMoves: offPathRef.current,
        movementVariance,
        directionChanges: directionChangesRef.current,
        reactionVariance: movementVariance,
        totalTimeMs,
        humanityScore,
      },
    });
  }

  function advanceStage() {
    const nextStage = stageIndexRef.current + 1;

    if (nextStage >= stages.length) {
      setTimeout(finishGame, 250);
      return;
    }

    stageIndexRef.current = nextStage;
    currentTargetRef.current = 0;
    lastPointRef.current = null;
    lastDxRef.current = 0;
    lastDyRef.current = 0;

    setStageFlash("Next trace");
    setTimeout(() => setStageFlash(null), 700);

    setStageIndex(nextStage);
    setCurrentTarget(0);
    setSamples([]);
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
  }, [started, durationMs]);

  useEffect(() => {
    if (!started || !inputEvent) return;
    if (inputEvent.type !== "move" && inputEvent.type !== "click") return;
    if (completedRef.current) return;

    const stage = stages[stageIndexRef.current];
    if (!stage) return;

    const target = stage.points[currentTargetRef.current];
    if (!target) return;

    const point = { x: inputEvent.x, y: inputEvent.y };

    if (lastPointRef.current) {
      const dx = point.x - lastPointRef.current.x;
      const dy = point.y - lastPointRef.current.y;
      const moveDistance = Math.sqrt(dx * dx + dy * dy);

      if (moveDistance > 1) {
        moveDistancesRef.current.push(moveDistance);

        const dot = dx * lastDxRef.current + dy * lastDyRef.current;
        if (lastDxRef.current !== 0 && lastDyRef.current !== 0 && dot < 0) {
          directionChangesRef.current += 1;
        }

        lastDxRef.current = dx;
        lastDyRef.current = dy;
      }
    }

    lastPointRef.current = point;

    setSamples((prev) => {
      const next = [...prev.slice(-120), point];
      samplesRef.current = next;
      return next;
    });

    const targetDistance = distance(point, target);

    if (targetDistance <= 44) {
      const nextTarget = currentTargetRef.current + 1;
      currentTargetRef.current = nextTarget;

      reachedPointsRef.current += 1;
      reachedByStageRef.current[stage.id] =
        (reachedByStageRef.current[stage.id] || 0) + 1;

      if (stageStatsRef.current[stage.id]) {
        stageStatsRef.current[stage.id].completedPoints =
          reachedByStageRef.current[stage.id];
      }

      setCurrentTarget(nextTarget);

      if (nextTarget >= stage.points.length) {
        advanceStage();
      }
    } else if (targetDistance > 145) {
      offPathRef.current += 1;
      setOffPathMoves(offPathRef.current);
    }
  }, [inputEvent, started, stages]);

  const seconds = Math.ceil(remaining / 1000);
  const overallPointLabel = `${reachedPointsRef.current}/${totalPoints}`;

  return (
    <Container>
      <Graphics
        draw={(g) => {
          g.clear();

          g.beginFill(0x020617);
          g.drawRoundedRect(0, 0, 900, 560, 28);
          g.endFill();

          g.lineStyle(7, 0x1e293b, 1);
          for (let i = 0; i < currentPoints.length - 1; i++) {
            g.moveTo(currentPoints[i].x, currentPoints[i].y);
            g.lineTo(currentPoints[i + 1].x, currentPoints[i + 1].y);
          }

          g.lineStyle(3, 0x334155, 1);
          for (let i = 0; i < currentPoints.length - 1; i++) {
            g.moveTo(currentPoints[i].x, currentPoints[i].y);
            g.lineTo(currentPoints[i + 1].x, currentPoints[i + 1].y);
          }

          samples.forEach((point, index) => {
            const opacity = Math.max(0.12, index / samples.length);
            g.beginFill(0x38bdf8, opacity * 0.55);
            g.drawCircle(point.x, point.y, 5);
            g.endFill();
          });
        }}
      />

      <Text
        text={
          started
            ? `${currentStage.label}   Stage ${stageIndex + 1}/${
                stages.length
              }   Points ${overallPointLabel}   Time ${seconds}s`
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

      <Text
        text={stageFlash || currentStage.instruction}
        x={stageFlash ? 390 : 330}
        y={92}
        style={{
          fill: stageFlash ? "#22c55e" : "#94a3b8",
          fontSize: 18,
          fontFamily: "Inter, Arial",
          fontWeight: "700",
        }}
      />

      {currentPoints.map((point, index) => (
        <Graphics
          key={`${currentStage.id}-${index}`}
          x={point.x}
          y={point.y}
          draw={(g) => {
            g.clear();

            const reached = index < currentTarget;
            const active = index === currentTarget;

            g.beginFill(reached ? 0x22c55e : active ? 0x38bdf8 : 0x475569);
            g.drawCircle(0, 0, active ? 34 : 24);
            g.endFill();

            if (active) {
              g.beginFill(0x38bdf8, 0.18);
              g.drawCircle(0, 0, 48);
              g.endFill();
            }

            g.beginFill(0xffffff, active ? 0.35 : 0.12);
            g.drawCircle(0, 0, 10);
            g.endFill();
          }}
        />
      ))}
    </Container>
  );
}
