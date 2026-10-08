type Meta = Record<string, string | number | boolean | undefined>;

function write(
  level: "info" | "warn" | "error",
  scope: string,
  message: string,
  meta?: Meta,
) {
  const line = `${level.toUpperCase()} [${scope}] ${message}`;
  const args = meta ? [line, meta] : [line];
  if (level === "error") console.error(...args);
  else if (level === "warn") console.warn(...args);
  else console.info(...args);
}

export const logger = {
  info: (scope: string, message: string, meta?: Meta) =>
    write("info", scope, message, meta),
  warn: (scope: string, message: string, meta?: Meta) =>
    write("warn", scope, message, meta),
  error: (scope: string, message: string, meta?: Meta) =>
    write("error", scope, message, meta),
};
