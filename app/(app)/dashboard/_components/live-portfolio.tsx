"use client";

import { useMemo, useState } from "react";
import { useLivePrices } from "@/hooks/use-live-prices";
import { portfolioTotals, type Holding } from "@/lib/portfolio";
import { HoldingsTable } from "./holdings-table";
import { SummaryCards } from "./summary-cards";

// Starts from the server-rendered holdings so hydration matches, then
// ticks prices on the client.
export function LivePortfolio({ initialHoldings }: { initialHoldings: Holding[] }) {
  const [paused, setPaused] = useState(false);
  const holdings = useLivePrices(initialHoldings, { intervalMs: 2500, paused });
  const totals = useMemo(() => portfolioTotals(holdings), [holdings]);

  return (
    <div className="space-y-8">
      <SummaryCards totals={totals} count={holdings.length} />

      <section className="overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-xl shadow-indigo-500/5">
        <div className="flex items-center justify-between px-6 pt-6">
          <h2 className="text-sm font-semibold">Holdings</h2>
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            aria-pressed={!paused}
            className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <span className="relative flex size-2">
              {!paused && <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />}
              <span className={`relative inline-flex size-2 rounded-full ${paused ? "bg-slate-400" : "bg-emerald-500"}`} />
            </span>
            {paused ? "Paused" : "Live"}
          </button>
        </div>
        <div className="mt-4">
          <HoldingsTable holdings={holdings} />
        </div>
      </section>
    </div>
  );
}
