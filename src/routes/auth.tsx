import { useState } from "react";
import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Leaf, Loader2 } from "lucide-react";
import { signInFn, signUpFn } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Steady" },
      {
        name: "description",
        content: "Sign in to Steady, a quiet place to prepare for placements.",
      },
      { property: "og:title", content: "Sign in — Steady" },
      { property: "og:description", content: "A quiet place to prepare." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const qc = useQueryClient();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      if (mode === "in") {
        await signInFn({ data: { email, password } });
      } else {
        await signUpFn({ data: { email, password } });
      }
      qc.setQueryData(["session"], null);
      await qc.invalidateQueries();
      await router.invalidate();
      navigate({ to: "/dashboard" });
    } catch (err) {
      setMsg(
        err instanceof Error
          ? err.message
          : mode === "in"
            ? "That didn't match. Check your email and password."
            : "Couldn't create the account. Try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="card-paper page-in w-full max-w-sm p-8">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <Leaf className="size-7 text-primary" />
          <h1 className="text-[30px]">Steady</h1>
          <p className="text-sm text-muted-foreground">A quiet place to prepare.</p>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <Input
            type="email"
            required
            autoComplete="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 rounded-xl bg-surface-2"
          />
          <Input
            type="password"
            required
            minLength={6}
            autoComplete={mode === "in" ? "current-password" : "new-password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 rounded-xl bg-surface-2"
          />
          {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
          <Button type="submit" disabled={busy} className="h-11 w-full rounded-xl">
            {busy && <Loader2 className="size-4 animate-spin" />}
            {mode === "in" ? "Sign in" : "Create account"}
          </Button>
        </form>
        <button
          onClick={() => {
            setMode(mode === "in" ? "up" : "in");
            setMsg(null);
          }}
          className="mt-5 w-full text-center text-sm text-muted-foreground hover:text-primary-deep"
        >
          {mode === "in" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
