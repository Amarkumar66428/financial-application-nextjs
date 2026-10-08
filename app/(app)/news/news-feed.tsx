"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import type { NewsArticle } from "@/lib/data/news";

const PAGE_SIZE = 5;
const ALL_SOURCES = "all";
const REFRESH_MS = 30_000; // matches the 30s revalidate on getNews()

// Shared clock so "Updated 2 minutes ago" keeps ticking without setState in an effect.
let now = Date.now();
function subscribeToClock(onChange: () => void) {
  now = Date.now();
  const id = setInterval(() => {
    now = Date.now();
    onChange();
  }, 30_000);
  return () => clearInterval(id);
}

// Re-fetch the server-rendered feed so the ISR cache's latest version shows up.
function useAutoRefresh() {
  const router = useRouter();

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    const start = () => {
      timer ??= setInterval(() => router.refresh(), REFRESH_MS);
    };
    const stop = () => {
      clearInterval(timer);
      timer = undefined;
    };
    // Pause in background tabs, and catch up right away when the user returns.
    const onVisibility = () => {
      if (document.hidden) return stop();
      router.refresh();
      start();
    };

    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [router]);
}

function useNow() {
  return useSyncExternalStore(
    subscribeToClock,
    () => now,
    () => null,
  );
}

const relativeFormat = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

function timeAgo(iso: string, current: number) {
  const seconds = Math.round((new Date(iso).getTime() - current) / 1000);
  if (Math.abs(seconds) < 45) return "just now";
  const minutes = Math.round(seconds / 60);
  if (Math.abs(minutes) < 60) return relativeFormat.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return relativeFormat.format(hours, "hour");
  return relativeFormat.format(Math.round(hours / 24), "day");
}

export function NewsFeed({
  articles,
  generatedAt,
}: {
  articles: NewsArticle[];
  generatedAt: string;
}) {
  const [source, setSource] = useState<string>(ALL_SOURCES);
  const [page, setPage] = useState(1);
  const current = useNow();
  useAutoRefresh();

  const sources = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of articles)
      counts.set(a.source, (counts.get(a.source) ?? 0) + 1);
    return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [articles]);

  const filtered = useMemo(() => {
    return articles.filter(
      (a) => source === ALL_SOURCES || a.source === source,
    );
  }, [articles, source]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);

  function chooseSource(next: string) {
    setSource(next);
    setPage(1);
  }

  function clearFilters() {
    setSource(ALL_SOURCES);
    setPage(1);
  }

  const chipClass = (active: boolean) =>
    `rounded-full border px-3 py-1 text-xs font-medium transition ${
      active
        ? "border-brand bg-brand text-white"
        : "border-indigo-100 bg-white text-muted-foreground hover:border-brand hover:text-brand"
    }`;

  return (
    <section className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Updated{" "}
        <time
          dateTime={generatedAt}
          title={new Date(generatedAt).toUTCString()}
        >
          {current === null ? "recently" : timeAgo(generatedAt, current)}
        </time>
      </p>

      <div
        role="group"
        aria-label="Filter by source"
        className="flex flex-wrap gap-2"
      >
        <button
          type="button"
          aria-pressed={source === ALL_SOURCES}
          onClick={() => chooseSource(ALL_SOURCES)}
          className={chipClass(source === ALL_SOURCES)}
        >
          All sources · {articles.length}
        </button>
        {sources.map(([name, count]) => (
          <button
            key={name}
            type="button"
            aria-pressed={source === name}
            onClick={() => chooseSource(name)}
            className={chipClass(source === name)}
          >
            {name} · {count}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-indigo-100 bg-white p-8 text-center text-sm text-muted-foreground">
          <p>No headlines match your filters.</p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-3 font-medium text-indigo-600 hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-xl shadow-indigo-500/5">
          {visible.map((article) => (
            <li
              key={article.id}
              className="flex items-center gap-4 px-6 py-5 transition hover:bg-secondary"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand text-sm font-semibold text-white">
                {article.source.charAt(0)}
              </span>
              <div>
                <h2 className="font-semibold">{article.title}</h2>
                <p className="text-xs text-muted-foreground">
                  {article.source}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {filtered.length > 0 && (
        <nav
          aria-label="News pagination"
          className="flex flex-wrap items-center justify-between gap-3"
        >
          <p className="text-xs text-muted-foreground">
            Showing {start + 1}–{start + visible.length} of {filtered.length}{" "}
            {filtered.length === 1 ? "headline" : "headlines"}
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="rounded-lg px-3 py-1.5 text-sm font-semibold text-brand transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:text-muted-foreground disabled:hover:bg-transparent"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPage(n)}
                  aria-current={n === currentPage ? "page" : undefined}
                  aria-label={`Page ${n}`}
                  className={`size-8 rounded-lg text-sm font-medium transition cursor-pointer ${
                    n === currentPage
                      ? "bg-brand text-white"
                      : "text-muted-foreground hover:bg-brand hover:text-white"
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="rounded-lg px-3 py-1.5 text-sm font-semibold text-brand transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:text-muted-foreground disabled:hover:bg-transparent"
              >
                Next
              </button>
            </div>
          )}
        </nav>
      )}
    </section>
  );
}
