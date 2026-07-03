import { useEffect, useMemo, useRef, useState } from "react";
import { Container, Graphics, Text, useTick } from "@pixi/react";

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

export default function SignalGame({
  challengeId,
  started,
  inputEvent,
  durationMs = 18000,
  onComplete,
}) {
  const width = 900;
  const height = 560;

  const [targets, setTargets] = useState([]);
  const targetsRef = useRef([]);

  const [score, setScore] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [remaining, setRemaining] = useState(durationMs);

  const startTimeRef = useRef(null);
  const lastPointerRef = useRef(null);
  const completedRef = useRef(false);

  const latestStateRef = useRef({
    score: 0,
    hits: 0,
    misses: 0,
  });

  const metricsRef = useRef({
    pointerSamples: 0,
    distanceMoved: 0,
    directionChanges: 0,
    lastDx: 0,
    lastDy: 0,
    reactions: [],
    clicks: [],
  });

  const initialTargets = useMemo(() => {
    const rand = seededRandom(challengeId);
    const items = [];

    for (let i = 0; i < 9; i++) {
      items.push({
        id: `target-${i}`,
        x: 80 + rand() * (width - 160),
        y: 90 + rand() * (height - 160),
        vx: (rand() - 0.5) * 3.8,
        vy: (rand() - 0.5) * 3.8,
        radius: i === 0 ? 30 : 22 + rand() * 10,
        isSignal: i === 0,
      });
    }

    return items;
  }, [challengeId]);

  useEffect(() => {
    latestStateRef.current = { score, hits, misses };
  }, [score, hits, misses]);

  useEffect(() => {
    targetsRef.current = targets;
  }, [targets]);

  useEffect(() => {
    if (!started) return;

    completedRef.current = false;
    startTimeRef.current = performance.now();
    lastPointerRef.current = null;

    metricsRef.current = {
      pointerSamples: 0,
      distanceMoved: 0,
      directionChanges: 0,
      lastDx: 0,
      lastDy: 0,
      reactions: [],
      clicks: [],
    };

    setTargets(initialTargets);
    targetsRef.current = initialTargets;
    setScore(0);
    setHits(0);
    setMisses(0);
    setRemaining(durationMs);
  }, [started, durationMs, initialTargets]);

  function finishGame() {
    if (completedRef.current || !startTimeRef.current) return;
    completedRef.current = true;

    const latest = latestStateRef.current;
    const totalTimeMs = Math.round(performance.now() - startTimeRef.current);
    const metrics = metricsRef.current;

    const accuracy =
      latest.hits + latest.misses === 0
        ? 0
        : latest.hits / (latest.hits + latest.misses);

    const avgReactionMs =
      metrics.reactions.length === 0
        ? null
        : Math.round(
            metrics.reactions.reduce((sum, value) => sum + value, 0) /
              metrics.reactions.length
          );

    const reactionVariance = Math.round(variance(metrics.reactions));

    const humanityScore = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          accuracy * 55 +
            Math.min(latest.hits, 8) * 4 +
            Math.min(metrics.directionChanges, 35) * 0.6 +
            Math.min(metrics.distanceMoved / 120, 20)
        )
      )
    );

    onComplete({
      challengeId,
      gameType: "signal_catch",
      passed: humanityScore >= 65 && latest.hits >= 5 && accuracy >= 0.55,
      humanityScore,
      score: latest.score,
      hits: latest.hits,
      misses: latest.misses,
      accuracy: Number(accuracy.toFixed(2)),
      avgReactionMs,
      reactionVariance,
      totalTimeMs,
      behavioralMetrics: {
        pointerSamples: metrics.pointerSamples,
        distanceMoved: Math.round(metrics.distanceMoved),
        directionChanges: metrics.directionChanges,
        clickCount: metrics.clicks.length,
      },
      backendReadyPayload: {
        challengeId,
        gameType: "signal_catch",
        score: latest.score,
        hits: latest.hits,
        misses: latest.misses,
        accuracy: Number(accuracy.toFixed(2)),
        avgReactionMs,
        reactionVariance,
        totalTimeMs,
        humanityScore,
      },
    });
  }

  function handleMove(point) {
    if (!started) return;

    const now = performance.now();
    const last = lastPointerRef.current;

    if (last) {
      const dx = point.x - last.x;
      const dy = point.y - last.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 1) {
        const metrics = metricsRef.current;
        metrics.pointerSamples += 1;
        metrics.distanceMoved += distance;

        const dot = dx * metrics.lastDx + dy * metrics.lastDy;
        if (metrics.lastDx !== 0 && metrics.lastDy !== 0 && dot < 0) {
          metrics.directionChanges += 1;
        }

        metrics.lastDx = dx;
        metrics.lastDy = dy;
      }
    }

    lastPointerRef.current = { x: point.x, y: point.y, t: now };
  }

  function handleClick(point) {
    if (!started || !startTimeRef.current) return;

    const clickedTarget = targetsRef.current.find((target) => {
      const dx = point.x - target.x;
      const dy = point.y - target.y;
      return Math.sqrt(dx * dx + dy * dy) <= target.radius + 18;
    });

    const now = performance.now();
    const reaction = now - startTimeRef.current;

    if (!clickedTarget) {
      setMisses((value) => value + 1);
      setScore((value) => Math.max(0, value - 30));
      metricsRef.current.clicks.push({
        x: point.x,
        y: point.y,
        t: Math.round(reaction),
        hit: false,
      });
      return;
    }

    metricsRef.current.reactions.push(reaction);
    metricsRef.current.clicks.push({
      x: clickedTarget.x,
      y: clickedTarget.y,
      t: Math.round(reaction),
      hit: clickedTarget.isSignal,
    });

    if (clickedTarget.isSignal) {
      setHits((value) => value + 1);
      setScore((value) => value + 120);

      setTargets((prev) => {
        const next = prev.map((item) =>
          item.id === clickedTarget.id
            ? {
                ...item,
                x: 80 + Math.random() * (width - 160),
                y: 90 + Math.random() * (height - 160),
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
              }
            : item
        );

        targetsRef.current = next;
        return next;
      });
    } else {
      setMisses((value) => value + 1);
      setScore((value) => Math.max(0, value - 60));
    }
  }

  useEffect(() => {
    if (!started || !inputEvent) return;
    if (inputEvent.type === "move") handleMove(inputEvent);
    if (inputEvent.type === "click") handleClick(inputEvent);
  }, [inputEvent, started]);

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

  useTick(() => {
    if (!started) return;

    setTargets((prev) => {
      const next = prev.map((target) => {
        let nextX = target.x + target.vx;
        let nextY = target.y + target.vy;
        let nextVx = target.vx;
        let nextVy = target.vy;

        if (nextX < target.radius || nextX > width - target.radius) {
          nextVx *= -1;
        }

        if (nextY < target.radius + 40 || nextY > height - target.radius) {
          nextVy *= -1;
        }

        return {
          ...target,
          x: Math.max(target.radius, Math.min(width - target.radius, nextX)),
          y: Math.max(
            target.radius + 40,
            Math.min(height - target.radius, nextY)
          ),
          vx: nextVx,
          vy: nextVy,
        };
      });

      targetsRef.current = next;
      return next;
    });
  });

  const seconds = Math.ceil(remaining / 1000);

  return (
    <Container>
      <Graphics
        draw={(g) => {
          g.clear();
          g.beginFill(0x020617);
          g.drawRoundedRect(0, 0, width, height, 28);
          g.endFill();
        }}
      />

      {started ? (
        <Text
          text={`Score ${score}   Hits ${hits}   Misses ${misses}   Time ${seconds}s`}
          x={28}
          y={22}
          style={{
            fill: "#e5e7eb",
            fontSize: 18,
            fontFamily: "Inter, Arial",
            fontWeight: "700",
          }}
        />
      ) : (
        <>
          <Text
            text="Press Start Challenge"
            x={width / 2}
            y={height / 2 - 28}
            anchor={0.5}
            style={{
              fill: "#cbd5e1",
              fontSize: 34,
              fontFamily: "Inter, Arial",
              fontWeight: "800",
            }}
          />

          <Text
            text="Complete the signal challenge to begin verification."
            x={width / 2}
            y={height / 2 + 22}
            anchor={0.5}
            style={{
              fill: "#64748b",
              fontSize: 16,
              fontFamily: "Inter, Arial",
              fontWeight: "500",
            }}
          />
        </>
      )}

      {started &&
        targets.map((target) => (
          <Graphics
            key={target.id}
            x={target.x}
            y={target.y}
            draw={(g) => {
              g.clear();

              if (target.isSignal) {
                g.beginFill(0x22c55e, 0.18);
                g.drawCircle(0, 0, target.radius + 12);
                g.endFill();

                g.beginFill(0x84cc16, 0.35);
                g.drawCircle(0, 0, target.radius + 5);
                g.endFill();

                g.beginFill(0x22c55e);
                g.drawCircle(0, 0, target.radius);
                g.endFill();
              } else {
                g.beginFill(0x64748b, 0.7);
                g.drawCircle(0, 0, target.radius);
                g.endFill();

                g.beginFill(0x334155, 0.9);
                g.drawCircle(0, 0, target.radius - 8);
                g.endFill();
              }
            }}
          />
        ))}
    </Container>
  );
}
