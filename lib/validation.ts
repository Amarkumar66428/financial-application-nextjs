// Used by both the login form and /api/login so the rules stay in sync.
export type LoginInput = { email: string; password: string };

export type LoginErrors = {
  email?: string;
  password?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLogin(raw: unknown): { data?: LoginInput; errors: LoginErrors } {
  const input: { email?: unknown; password?: unknown } =
    typeof raw === "object" && raw !== null ? raw : {};
  const email = typeof input.email === "string" ? input.email.trim() : "";
  const password = typeof input.password === "string" ? input.password : "";
  const errors: LoginErrors = {};

  if (!email) errors.email = "Email is required.";
  else if (email.length > 254 || !EMAIL_RE.test(email)) errors.email = "Enter a valid email address.";

  if (!password) errors.password = "Password is required.";
  else if (password.length < 6) errors.password = "Password must be at least 6 characters.";
  else if (password.length > 128) errors.password = "Password is too long.";

  return Object.keys(errors).length ? { errors } : { data: { email, password }, errors };
}
