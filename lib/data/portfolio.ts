import type { Holding } from "@/lib/portfolio";

// Mock holdings. Every user gets the same list until there's a real backend.
export async function getHoldingsForUser(userId: string): Promise<Holding[]> {
  void userId;
  return [
    { symbol: "AAPL", qty: 10, avg: 150, price: 170 },
    { symbol: "TSLA", qty: 5, avg: 300, price: 650 },
    { symbol: "YHOO", qty: 8, avg: 400, price: 680 },
    { symbol: "SAMG", qty: 3, avg: 220, price: 200 },
    { symbol: "LG", qty: 9, avg: 100, price: 239 },
    { symbol: "NVDA", qty: 12, avg: 530, price: 430 },
    { symbol: "MSFT", qty: 17, avg: 600, price: 320 },
  ];
}
