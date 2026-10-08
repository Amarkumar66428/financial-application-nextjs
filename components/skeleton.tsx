type Props = {
  label: string;
  cards?: number;
  rows?: number;
};

export function Skeleton({ label, cards = 0, rows = 5 }: Props) {
  return (
    <div className="space-y-8" aria-busy="true" aria-label={label}>
      {cards > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: cards }, (_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-2xl bg-muted/20"
            />
          ))}
        </div>
      )}
      <div className="space-y-3">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-xl bg-muted/15" />
        ))}
      </div>
    </div>
  );
}
