"use client";

import { useEffect } from "react";

export function ErrorState({
  title,
  error,
  retry,
}: {
  title: string;
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(`[ui] ${title}`, error.digest ?? error.message);
  }, [title, error]);

  return (
    <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
      <h2 className="text-lg font-semibold text-rose-700">{title}</h2>
      <p className="mt-1 text-sm text-rose-600">Something went wrong. Please try again.</p>
      <button
        type="button"
        onClick={retry}
        className="mt-4 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-700"
      >
        Try again
      </button>
    </div>
  );
}
