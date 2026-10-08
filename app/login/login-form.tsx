"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/spinner";
import { validateLogin, type LoginErrors } from "@/lib/validation";

const inputClass =
  "w-full rounded-lg border bg-slate-50 py-2.5 px-3 text-sm text-foreground outline-none hover:border-indigo-300 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/15";

// Only follow relative paths from ?from= so it can't be used as an open redirect.
function safeRedirect(target: string | null): string {
  return target && target.startsWith("/") && !target.startsWith("//")
    ? target
    : "/dashboard";
}

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<LoginErrors>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const { data, errors } = validateLogin({
      email: form.get("email"),
      password: form.get("password"),
    });
    setFieldErrors(errors);
    setError(null);
    if (!data) return;

    setPending(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setFieldErrors(body.errors ?? {});
        setError(body.error ?? "Sign in failed. Please try again.");
        setPending(false);
        return;
      }

      const from = new URLSearchParams(window.location.search).get("from");
      router.replace(safeRedirect(from));
      router.refresh();
    } catch {
      setError("Network error. Check your connection and try again.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          placeholder="you@company.com"
          aria-invalid={!!fieldErrors.email}
          aria-describedby={fieldErrors.email ? "email-error" : undefined}
          className={`${inputClass} border-slate-200`}
        />
        {fieldErrors.email && (
          <p id="email-error" className="text-xs font-semibold text-loss">
            {fieldErrors.email}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            maxLength={128}
            placeholder="••••••••"
            aria-invalid={!!fieldErrors.password}
            aria-describedby={
              fieldErrors.password ? "password-error" : undefined
            }
            className={`${inputClass} border-slate-200 pr-10`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded text-slate-400 hover:text-slate-500"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-4"
            >
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
              <circle cx="12" cy="12" r="3" />
              {showPassword && <path d="M3 3l18 18" />}
            </svg>
          </button>
        </div>
        {fieldErrors.password && (
          <p id="password-error" className="text-xs font-semibold text-loss">
            {fieldErrors.password}
          </p>
        )}
      </div>

      {error && (
        <p
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-red-200 bg-rose-50 px-3 py-2 text-sm text-loss"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-white hover:bg-brand-hover hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending && <Spinner size={16} />}
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
