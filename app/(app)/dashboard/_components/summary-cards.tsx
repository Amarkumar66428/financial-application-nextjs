import { memo } from "react";
import {
  formatPct,
  formatSignedUsd,
  formatUsd,
  type HoldingMetrics,
} from "@/lib/portfolio";

function StatCard({
  label,
  value,
  hint,
  valueClass = "",
}: {
  label: string;
  value: string;
  hint?: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-xl">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-semibold ${valueClass}`}>{value}</p>
      {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}

export const SummaryCards = memo(function SummaryCards({
  totals,
  count,
}: {
  totals: HoldingMetrics;
  count: number;
}) {
  const tone = totals.pnl >= 0 ? "text-gain" : "text-loss";
  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-2xl bg-secondary p-5 shadow-lg shadow-indigo-500/30">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Current value
        </p>
        <p className="mt-2 text-2xl font-semibold">{formatUsd(totals.value)}</p>
        <p className="mt-1 text-sm">{formatPct(totals.pnlPct)} overall</p>
      </div>
      <StatCard label="Invested" value={formatUsd(totals.invested)} />
      <StatCard
        label="Total P&L"
        value={formatSignedUsd(totals.pnl)}
        valueClass={tone}
        hint={formatPct(totals.pnlPct)}
      />
      <StatCard label="Holdings" value={String(count)} hint="stocks" />
    </section>
  );
});
