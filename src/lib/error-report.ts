// Local error reporting: logs to the console in development.
// (Replaces the old editor-telemetry hook; no external service.)

export function reportError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window !== "undefined") {
    console.error("[Steady]", describeThrown(error), context);
    return;
  }
  console.error("[Steady]", describeThrown(error), context);
}

const MAX_SERIALIZED_LENGTH = 2000;

// Loaders and server fns throw raw Responses and plain objects,
// which String() reduces to "[object ...]".
function describeThrown(error: unknown): string {
  if (error instanceof Response) {
    return `Response ${error.status}${error.url ? ` at ${error.url}` : ""}`;
  }
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  const { message } = (error ?? {}) as { message?: unknown };
  if (typeof message === "string" && message.length > 0) return message;
  try {
    return JSON.stringify(error)?.slice(0, MAX_SERIALIZED_LENGTH) ?? String(error);
  } catch {
    return String(error);
  }
}
