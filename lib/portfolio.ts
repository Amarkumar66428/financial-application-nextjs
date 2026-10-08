export type Holding = {
  symbol: string;
  qty: number;
  avg: number;
  price: number;
};

export type HoldingMetrics = {
  invested: number;
  value: number;
  pnl: number;
  pnlPct: number;
};

function metrics(invested: number, value: number): HoldingMetrics {
  const pnl = value - invested;
  return {
    invested,
    value,
    pnl,
    pnlPct: invested ? (pnl / invested) * 100 : 0,
  };
}

export function holdingMetrics({ qty, avg, price }: Holding): HoldingMetrics {
  return metrics(qty * avg, qty * price);
}

export function portfolioTotals(holdings: Holding[]): HoldingMetrics {
  let invested = 0;
  let value = 0;
  for (const h of holdings) {
    invested += h.qty * h.avg;
    value += h.qty * h.price;
  }
  return metrics(invested, value);
}

export function isHoldingList(data: unknown): data is Holding[] {
  return (
    Array.isArray(data) &&
    data.every(
      (h) =>
        typeof h === "object" &&
        h !== null &&
        typeof h.symbol === "string" &&
        typeof h.qty === "number" &&
        typeof h.avg === "number" &&
        typeof h.price === "number",
    )
  );
}

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export const formatUsd = (n: number) => usdFormatter.format(n);

export const formatSignedUsd = (n: number) =>
  `${n >= 0 ? "+" : "-"}${usdFormatter.format(Math.abs(n))}`;

export const formatPct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
