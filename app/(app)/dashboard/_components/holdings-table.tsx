import { memo } from "react";
import {
  formatPct,
  formatSignedUsd,
  formatUsd,
  holdingMetrics,
} from "@/lib/portfolio";
import type { LiveHolding } from "@/hooks/use-live-prices";

// Primitive props so memo can skip rows that didn't change.
const HoldingRow = memo(function HoldingRow({
  symbol,
  qty,
  avg,
  price,
  prevPrice,
}: LiveHolding) {
  const { value, pnl, pnlPct } = holdingMetrics({ symbol, qty, avg, price });
  const tone = pnl >= 0 ? "text-gain" : "text-loss";
  const move = price > prevPrice ? "up" : price < prevPrice ? "down" : "flat";

  return (
    <tr className="transition hover:bg-indigo-50/50">
      <td className="px-6 py-4 font-semibold text-brand">{symbol}</td>
      <td className="px-6 py-4 text-right">{qty}</td>
      <td className="px-6 py-4 text-right text-muted-foreground">
        {formatUsd(avg)}
      </td>
      <td
        className={`whitespace-nowrap px-6 py-4 text-right font-medium transition-colors duration-500 ${
          move === "up" ? "text-gain" : move === "down" ? "text-loss" : ""
        }`}
      >
        <span aria-hidden className="mr-1 text-xs">
          {move === "up" ? "▲" : move === "down" ? "▼" : ""}
        </span>
        {formatUsd(price)}
      </td>
      <td className="px-6 py-4 text-right font-medium">{formatUsd(value)}</td>
      <td
        className={`whitespace-nowrap px-6 py-4 text-right font-medium ${tone}`}
      >
        {formatSignedUsd(pnl)}
        <span
          className={`ml-2 rounded-full px-2 py-0.5 text-xs ${pnl >= 0 ? "bg-gain-muted" : "bg-loss-muted"}`}
        >
          {formatPct(pnlPct)}
        </span>
      </td>
    </tr>
  );
});

export function HoldingsTable({ holdings }: { holdings: LiveHolding[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-border text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-6 py-3 text-left font-medium">Symbol</th>
            <th className="px-6 py-3 text-right font-medium">Qty</th>
            <th className="px-6 py-3 text-right font-medium">Avg price</th>
            <th className="px-6 py-3 text-right font-medium">Current price</th>
            <th className="px-6 py-3 text-right font-medium">Value</th>
            <th className="px-6 py-3 text-right font-medium">P&amp;L</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {holdings.map((h) => (
            <HoldingRow key={h.symbol} {...h} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
