// Server-only Turso/libSQL access. Lazy so importing this module is safe:
// no connection is opened and no env is read until db() is first called
// (which only ever happens inside server-function handlers).
import { createClient, type Client, type ResultSet } from "@libsql/client";
import { SCHEMA_SQL } from "./schema";

let client: Client | null = null;
let migrated = false;

function connectionInfo() {
  if (typeof window !== "undefined") {
    throw new Error("Turso client is server-only");
  }
  const url = process.env["TURSO_DATABASE_URL"] || "file:./data/steady.db";
  const authToken = process.env["TURSO_AUTH_TOKEN"] || undefined;
  return { url, authToken };
}

async function ensureParentDir(url: string) {
  if (!url.startsWith("file:")) return;
  try {
    const [{ mkdirSync }, { dirname, resolve }] = await Promise.all([
      import("node:fs"),
      import("node:path"),
    ]);
    mkdirSync(dirname(resolve(url.slice("file:".length))), { recursive: true });
  } catch {
    // best effort; libsql will surface real errors
  }
}

export async function db(): Promise<Client> {
  if (!client) {
    const { url, authToken } = connectionInfo();
    await ensureParentDir(url);
    client = authToken ? createClient({ url, authToken }) : createClient({ url });
  }
  return client;
}

/** Create tables on first use. Safe to call on every boot (IF NOT EXISTS). */
export async function migrate() {
  if (migrated) return;
  migrated = true;
  const statements = SCHEMA_SQL.split(";")
    .map((s) => s.trim())
    .filter(Boolean);
  // Serialize: libsql has a single writer.
  const c = await db();
  for (const sql of statements) {
    await c.execute(sql);
  }
}

// Typed statement builder: narrows loose unknown[] args to libsql input
// values (undefined becomes NULL) so call sites stay clean.
export function q(stmt: { sql: string; args?: unknown[] }): { sql: string; args?: any } {
  if (!stmt.args) return { sql: stmt.sql };
  return {
    sql: stmt.sql,
    args: stmt.args.map((a) => (a === undefined ? null : a)),
  };
}

export type { Client, ResultSet };

export const bit = (v: unknown) => (v === 1 || v === "1" || v === true ? 1 : 0);
export const asBool = (v: unknown) => bit(v) === 1;
export const num = (v: unknown, fallback = 0) => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
};
export const asJson = <T>(v: unknown, fallback: T): T => {
  if (v == null || v === "") return fallback;
  if (typeof v !== "string") return v as T;
  try {
    return JSON.parse(v) as T;
  } catch {
    return fallback;
  }
};
export const toJson = (v: unknown) =>
  v === undefined || v === null ? null : typeof v === "string" ? v : JSON.stringify(v);
export const now = () => new Date().toISOString();
export const newId = () =>
  (globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`);
