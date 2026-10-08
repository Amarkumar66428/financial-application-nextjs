import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <section className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-8">
      <div className="w-full max-w-md rounded-lg border border-indigo-100 bg-white p-8 shadow-xl sm:p-10">
        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-bold text-primary">Financial Application</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to continue to your dashboard.
          </p>
        </div>

        <LoginForm />
      </div>
    </section>
  );
}
