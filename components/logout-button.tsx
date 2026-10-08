"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";

export function LogoutButton() {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  async function logout() {
    setPending(true);
    setError(false);
    try {
      const res = await fetch("/api/logout", { method: "POST" });
      if (!res.ok) throw new Error(`Logout failed (${res.status})`);
      router.replace("/login");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setPending(false);
      setOpen(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
      >
        Log out
      </button>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"
            onClick={() => !pending && setOpen(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="logout-title"
              className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2
                id="logout-title"
                className="text-lg font-semibold text-slate-900"
              >
                Confirm logout
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Are you sure you want to log out of your account?
              </p>
              {error && (
                <p role="alert" className="mt-3 text-sm text-loss">
                  Couldn&apos;t log out. Please try again.
                </p>
              )}

              <div className="mt-5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={pending}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={logout}
                  disabled={pending}
                  autoFocus
                  className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-700 disabled:opacity-60"
                >
                  {pending ? "Logging out…" : "Log out"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
