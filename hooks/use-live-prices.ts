"use client";

import { useEffect, useState } from "react";
import type { Holding } from "@/lib/portfolio";

export type LiveHolding = Holding & { prevPrice: number };

const MAX_MOVE = 0.01; // each tick moves a price by at most ±1%

// Random walk: every new price is derived from the previous one, never replaced outright.
function nextPrice(price: number): number {
  const drift = (Math.random() * 2 - 1) * MAX_MOVE;
  return Math.max(0.01, Math.round(price * (1 + drift) * 100) / 100);
}

export function useLivePrices(
  initial: Holding[],
  { intervalMs = 2500, paused = false } = {},
) {
  const [holdings, setHoldings] = useState<LiveHolding[]>(() =>
    initial.map((h) => ({ ...h, prevPrice: h.price })),
  );

  useEffect(() => {
    if (paused) return;

    let timer: ReturnType<typeof setInterval> | undefined;
    const tick = () =>
      setHoldings((prev) =>
        prev.map((h) => ({
          ...h,
          prevPrice: h.price,
          price: nextPrice(h.price),
        })),
      );
    const start = () => {
      timer ??= setInterval(tick, intervalMs);
    };
    const stop = () => {
      clearInterval(timer);
      timer = undefined;
    };
    // Don't burn CPU or re-render while the tab is in the background.
    const onVisibility = () => (document.hidden ? stop() : start());

    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [intervalMs, paused]);

  return holdings;
}
