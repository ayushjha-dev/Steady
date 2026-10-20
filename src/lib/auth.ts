import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";

const COOKIE = "steady_session";
const MAX_AGE = 30 * 24 * 3600;

async function setSessionCookie(token: string) {
  const { setCookie } = await import("@tanstack/react-start/server");
  setCookie(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
    secure: process.env["NODE_ENV"] === "production",
  });
}

async function sessionToken(): Promise<string | null> {
  const { getCookie } = await import("@tanstack/react-start/server");
  return getCookie(COOKIE) ?? null;
}

/**
 * The signed-in viewer, or null. Usable in beforeLoad, components, anywhere.
 * Returns an envelope `{ viewer }` rather than the bare value — a server fn
 * whose handler returns `null` is treated as "no response" for raw HTTP
 * callers (500), while the envelope is always an object.
 */
export const getViewerFn = createServerFn({ method: "GET" })
  .validator(() => undefined as void)
  .handler(async () => {
    const { getSessionUser } = await import("./server/store");
    return { viewer: await getSessionUser(await sessionToken()) };
  });

export const signUpFn = createServerFn({ method: "POST" })
  .validator((d: unknown) => d as { email: string; password: string })
  .handler(async (ctx) => {
    const { createSession, createUser, findUserByEmail } = await import("./server/store");
    const bcrypt = await import("bcryptjs");
    const email = ctx.data.email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Enter a valid email.");
    if (!ctx.data.password || ctx.data.password.length < 6)
      throw new Error("Password must be at least 6 characters.");
    const existing = await findUserByEmail(email);
    if (existing) throw new Error("An account with this email already exists. Try signing in.");
    const user = await createUser(email, await bcrypt.hash(ctx.data.password, 10));
    const session = await createSession(user.id);
    await setSessionCookie(session.token);
    return { id: user.id, email: user.email };
  });

export const signInFn = createServerFn({ method: "POST" })
  .validator((d: unknown) => d as { email: string; password: string })
  .handler(async (ctx) => {
    const { createSession, findUserByEmail } = await import("./server/store");
    const bcrypt = await import("bcryptjs");
    const email = ctx.data.email.trim().toLowerCase();
    const row = await findUserByEmail(email);
    if (!row) throw new Error("That didn't match. Check your email and password.");
    const ok = await bcrypt.compare(ctx.data.password, (row as any).password_hash as string);
    if (!ok) throw new Error("That didn't match. Check your email and password.");
    const session = await createSession((row as any).id as string);
    await setSessionCookie(session.token);
    return { id: (row as any).id as string, email };
  });

export const signOutFn = createServerFn({ method: "POST" })
  .validator(() => undefined as void)
  .handler(async () => {
    const { deleteSession } = await import("./server/store");
    const { deleteCookie } = await import("@tanstack/react-start/server");
    const token = await sessionToken();
    if (token) await deleteSession(token);
    deleteCookie(COOKIE, { path: "/" });
    return { ok: true };
  });

export type Viewer = { id: string; email: string } | null;

export function useSession() {
  return useQuery({
    queryKey: ["session"],
    queryFn: async () => (await getViewerFn()).viewer,
    staleTime: 60_000,
    retry: false,
  });
}

export function useSignOut() {
  const qc = useQueryClient();
  return async () => {
    try {
      await signOutFn();
    } finally {
      await qc.cancelQueries();
      qc.clear();
    }
  };
}
