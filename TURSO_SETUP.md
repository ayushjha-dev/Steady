# Turso setup for Steady

Steady runs on **Turso (libSQL / SQLite)** through TanStack Start server
functions. There is no Supabase, no edge functions, and no client-side database
access — every query is server-side and scoped by `user_id` in SQL.

- Schema: `src/lib/server/schema.ts` (single source of truth)
- Connection: `src/lib/server/db.ts` (lazy client, auto-migrates on boot)
- Queries: `src/lib/server/store.ts` (all SQL lives here)
- Reached from the UI via server functions in `src/lib/data.ts` / `src/lib/auth.ts`

---

## 1. Local development — zero setup (works right now)

`.env` ships with:

```env
TURSO_DATABASE_URL="file:./data/steady.db"
TURSO_AUTH_TOKEN=""
```

That's a plain SQLite file in `./data/`. On the first signup (or first
authenticated request) the server creates every table automatically
(`CREATE TABLE IF NOT EXISTS`). No account, no token, no install. A logged-out
visit alone doesn't trigger it — the very first signup does.

```bash
bun install
bun run dev
```

Your data lives in `data/steady.db`. Back it up by copying the file; wipe it
by deleting it — the next boot recreates the schema.

---

## 2. Turso Cloud — production / multi-device

### 2.1 Install the Turso CLI

| OS | Command |
| --- | --- |
| macOS / Linux | `curl -fsSL https://get.tur.so/install.sh \| sh` |
| Windows (scoop) | `scoop install turso` |
| Any | download from https://tur.so/cli |

Verify: `turso --version`

### 2.2 Log in and create a database

```bash
turso auth login                 # opens browser, GitHub sign-in
turso db create steady           # creates the database, pick a region if prompted
turso db show steady --url       # → libsql://steady-<your-org>.turso.io
turso db tokens create steady    # → auth token (save the output)
```

### 2.3 Point the app at it

Edit `.env`:

```env
TURSO_DATABASE_URL="libsql://steady-<your-org>.turso.io"
TURSO_AUTH_TOKEN="<output of turso db tokens create steady>"
```

Restart `bun run dev`. The server connects on the first signup and creates the
schema in the cloud database automatically — same tables, no migration step.
(Verify with the Turso dashboard's data browser, or `turso db shell steady` →
`.tables`.)

### 2.4 Verify

```bash
turso db shell steady            # interactive SQL
```

```sql
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM tasks;
.tables
```

Or inspect your local file directly:

```bash
bun x libsql-cli data/steady.db  # or any sqlite browser
```

---

## 3. Moving existing local data to the cloud (optional)

During development you likely don't need this — a fresh cloud database is
usually fine (just sign up again). If you do want to carry your local data:

```bash
# 1. dump the local SQLite file to SQL
bun -e "const {execSync}=require('node:child_process');"   # (or use any sqlite tool)
#    easiest with sqlite3, if installed:
sqlite3 data/steady.db .dump > dump.sql

# 2. pipe it into Turso
turso db shell steady < dump.sql
```

Note: `turso db shell` refuses statements that would modify the auth-adjacent
tables inconsistently — for this schema (plain tables only) it works as-is.

---

## 4. Environment variables (full set)

`.env` (copy from `.env.example`; already git-ignored):

```env
TURSO_DATABASE_URL="file:./data/steady.db"   # or libsql://... for cloud
TURSO_AUTH_TOKEN=""                          # empty for file:, token for cloud
GEMINI_API_KEY="<from https://aistudio.google.com/apikey>"
```

- **`GEMINI_API_KEY`** powers AI study notes, practice sets and mock tests
  (`src/lib/server/gemini.ts`, called through the `ai` server function, rate
  limited to 40 calls/hour/user). Keys are server-only — they never reach the
  browser.
- Never commit `.env` (`.gitignore` covers it — keep `.env.example` as the
  template).

---

## 5. How the schema works

`src/lib/server/schema.ts` exports `SCHEMA_SQL`, run automatically on boot in
`migrate()` (`src/lib/server/db.ts`). Statements are `CREATE TABLE IF NOT
EXISTS`, so boot is idempotent.

Tables: `users`, `sessions`, `profiles`, `subjects`, `sections`, `topics`,
`tasks`, `practice_sets`, `practice_attempts`, `practice_days`, `topic_notes`,
`topic_note_versions`, `mock_tests`.

**Changing the schema** (adding a column, etc.):

1. Edit `CREATE TABLE` in `src/lib/server/schema.ts` (for fresh databases).
2. For existing databases, `IF NOT EXISTS` won't alter old tables — either
   delete `data/steady.db` to regenerate (dev), or apply the change by hand:

   ```sql
   ALTER TABLE tasks ADD COLUMN your_new_column TEXT NOT NULL DEFAULT '';
   ```

   via `turso db shell steady` or a SQLite browser.

---

## 6. Auth model (replaces Supabase Auth)

- Email + password, hashed with bcrypt (`users.password_hash`).
- Sessions are random tokens in `sessions`, delivered as an HTTP-only
  `steady_session` cookie (30 days, SameSite=Lax).
- `src/lib/auth.ts` exposes `getViewerFn`, `signUpFn`, `signInFn`,
  `signOutFn`; route guards in `src/routes/_authenticated/route.tsx` call
  `getViewerFn()` in `beforeLoad`.
- No email confirmation, no external auth provider.

---

## 7. Production build & run

```bash
bun run build                   # → .output/ (nitro, preset: node-server)
node .output/server/index.mjs
```

Set the three env vars on the host first. Other deploy targets:

```bash
NITRO_PRESET=cloudflare-module bun run build   # Cloudflare Workers
NITRO_PRESET=vercel bun run build              # Vercel
```

(Nitro reads `NITRO_PRESET`; the default in `vite.config.ts` is `node-server`.
Remember `file:` databases only work on hosts with a writable disk — use
Turso Cloud for serverless/edge deploys.)

---

## 8. Troubleshooting

| Symptom | Fix |
| --- | --- |
| `SqliteError: unable to open database file` | `data/` missing — it's created automatically; if it persists, check write permissions or switch to a Turso URL. |
| `AuthenticationFailed` / 401 from libsql | `TURSO_AUTH_TOKEN` missing or expired — run `turso db tokens create steady` again. |
| `Not signed in` from a server function | Session cookie expired — sign in again (or the route guard should have redirected). |
| AI buttons never finish | `GEMINI_API_KEY` invalid/missing — check the server console for `Gemini API error`. |
| Schema "missing table" errors on cloud | Boot once against the new URL so `migrate()` runs, or run the DDL manually. |
| Port already in use | `bun run dev --port 3001` |
