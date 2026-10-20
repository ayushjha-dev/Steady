import { Link, createFileRoute, redirect } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Flame,
  Leaf,
  ShieldCheck,
  Sparkles,
  Sun,
  Timer,
  WifiOff,
} from "lucide-react";
import { getViewerFn } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ProgressBar, ProgressRing } from "@/components/steady/kit";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Steady — a quiet place to prepare for placements" },
      {
        name: "description",
        content:
          "A calm placement prep tracker. Pick your subjects at signup, get a daily focus list, topic practice, mock tests, and streaks — no noise.",
      },
      { property: "og:title", content: "Steady — a quiet place to prepare" },
      {
        property: "og:description",
        content: "Your plan · daily focus · topic practice · Sunday mocks · offline-first.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  beforeLoad: async () => {
    const { viewer } = await getViewerFn();
    if (viewer) throw redirect({ to: "/dashboard" });
  },
  component: LandingPage,
});

const FEATURES = [
  {
    icon: Sun,
    title: "One calm Today view",
    body: "Open the app and see exactly what matters today — tasks, practice minutes, and revision. No endless dashboards.",
  },
  {
    icon: CalendarDays,
    title: "A plan with real order",
    body: "The subjects you pick at signup — sequenced week by week so you never wonder what's next.",
  },
  {
    icon: BookOpenCheck,
    title: "Topic practice that sticks",
    body: "Bite-size sets per topic with AI notes, key points, and revision flags. Mark done, in-progress, or revise.",
  },
  {
    icon: ClipboardCheck,
    title: "Sunday mock tests",
    body: "Full-length timed mocks every Sunday with instant results, per-section review, and explanations.",
  },
  {
    icon: BarChart3,
    title: "Progress without pressure",
    body: "Streaks, rings, and weekly insights that encourage consistency — never guilt. Watch steady compound.",
  },
  {
    icon: WifiOff,
    title: "Offline-first PWA",
    body: "Installs on your phone, works on patchy hostel Wi-Fi, and syncs quietly when you're back online.",
  },
];

const PLAN_STEPS: { title: string; body: string; bar: number }[] = [
  { title: "1 · Choose at signup", body: "Pick only the subjects that matter to your goal.", bar: 88 },
  { title: "2 · Set your rhythm", body: "Start date plus daily hours — the plan fits your life.", bar: 55 },
  { title: "3 · Open Day 1", body: "One calm list: learn, practise, revise. Repeat.", bar: 30 },
];

function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2" aria-label="Steady home">
          <span className="grid size-9 place-items-center rounded-xl bg-primary-tint">
            <Leaf className="size-5 text-primary-deep" />
          </span>
          <span className="font-display text-xl text-foreground">Steady</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex" aria-label="Sections">
          <a href="#features" className="transition-colors hover:text-foreground">Features</a>
          <a href="#plan" className="transition-colors hover:text-foreground">The plan</a>
          <a href="#practice" className="transition-colors hover:text-foreground">Practice</a>
          <a href="#calm" className="transition-colors hover:text-foreground">Why calm</a>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" className="rounded-xl">
            <Link to="/auth">Sign in</Link>
          </Button>
          <Button asChild className="rounded-xl">
            <Link to="/auth">
              Start free <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function HeroArt() {
  const rows = [
    { dot: "bg-primary", t: "Core concept lab", m: "25 min", done: true },
    { dot: "bg-clay", t: "Pattern practice · 3 problems", m: "40 min", done: true },
    { dot: "bg-sand", t: "Yesterday's revision", m: "20 min", done: false },
  ];
  return (
    <div className="relative" aria-hidden="true">
      {/* soft paper glow */}
      <div className="absolute -inset-8 rounded-[32px] bg-primary-tint/60 blur-2xl" />
      <div className="absolute -right-6 -top-6 rounded-2xl bg-clay-tint px-4 py-2 text-xs font-medium text-foreground shadow-sm">
        Sunday mock · 8:00 AM
      </div>

      <div className="card-paper page-in relative p-6 sm:p-7">
        <div className="flex items-center justify-between">
          <div>
            <p className="label-caps">Today · Day 42</p>
            <p className="font-display mt-1 text-2xl text-foreground">Good morning, Aarav</p>
          </div>
          <ProgressRing value={72} size={92} stroke={9} label="72 percent complete">
            <span className="num text-lg font-semibold text-foreground">72%</span>
            <span className="text-[11px] text-muted-foreground">done</span>
          </ProgressRing>
        </div>

        <div className="mt-5 space-y-3">
          {rows.map((row) => (
            <div
              key={row.t}
              className="flex items-center gap-3 rounded-2xl border bg-surface px-3.5 py-3"
            >
              <span className={`inline-block size-2 shrink-0 rounded-full ${row.dot}`} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{row.t}</p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Timer className="size-3" /> {row.m}
                </p>
              </div>
              {row.done ? (
                <CheckCircle2 className="size-5 shrink-0 text-primary" />
              ) : (
                <span className="shrink-0 rounded-full bg-surface-2 px-3 py-1 text-xs font-medium text-muted-foreground">
                  Start
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-medium text-muted-foreground">THIS WEEK'S PROGRESS</span>
            <span className="num font-semibold text-primary-deep">5-day streak</span>
          </div>
          <ProgressBar value={68} label="Week progress" />
        </div>
      </div>

      <div className="card-paper absolute -bottom-8 -left-4 hidden items-center gap-3 px-4 py-3 sm:flex">
        <span className="grid size-10 place-items-center rounded-xl bg-primary-tint">
          <Flame className="size-5 text-clay" />
        </span>
        <div>
          <p className="num text-sm font-semibold text-foreground">12-day streak</p>
          <p className="text-xs text-muted-foreground">Small steps, every day.</p>
        </div>
      </div>
    </div>
  );
}

function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(560px 320px at 12% 8%, var(--primary-tint) 0%, transparent 65%), radial-gradient(480px 300px at 88% 18%, var(--clay-tint) 0%, transparent 60%), radial-gradient(700px 380px at 50% 110%, var(--surface-2) 0%, transparent 65%)",
          }}
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:pb-28 lg:pt-20">
          <div className="page-in">
            <p className="inline-flex items-center gap-2 rounded-full border bg-surface px-3.5 py-1.5 text-xs font-medium text-primary-deep">
              <Sparkles className="size-3.5" />
              A placement plan · built around you
            </p>
            <h1 className="mt-5 text-balance text-5xl leading-[1.04] sm:text-6xl">
              A quiet place to prepare for placements.
            </h1>
            <p className="mt-5 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
              Steady turns chaos into one calm daily list — what to learn, what to practise,
              and when to revise. Built for final-year students who want consistency without burnout.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="h-12 rounded-2xl px-6 text-base">
                <Link to="/auth">
                  Begin Day 1 <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 rounded-2xl px-6 text-base">
                <a href="#plan">See how the plan works</a>
              </Button>
            </div>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-6 border-t pt-6">
              {[
                ["You pick", "subjects at signup"],
                ["Your pace", "daily hours you set"],
                ["Every Sunday", "timed mock tests"],
              ].map(([n, l]) => (
                <div key={l}>
                  <dt className="sr-only">{l}</dt>
                  <dd className="num font-display text-3xl text-foreground">{n}</dd>
                  <dd className="mt-1 text-[13px] leading-snug text-muted-foreground">{l}</dd>
                </div>
              ))}
            </dl>
          </div>
          <HeroArt />
        </div>
      </section>

      {/* YOU DECIDE STRIP */}
      <section className="border-y bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 py-5 text-sm text-muted-foreground sm:px-6">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-primary" /> Pick your subjects at signup
          </span>
          <span className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-primary" /> Set your daily hours
          </span>
          <span className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-primary" /> Get your Day 1 list
          </span>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6 lg:py-28">
        <div className="max-w-2xl">
          <p className="label-caps">Everything in one rhythm</p>
          <h2 className="mt-2 text-balance text-4xl leading-tight sm:text-[44px]">
            Less app-hopping. More showing up.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Notes in one tab, questions in another, mocks somewhere else — Steady replaces
            all of it with a single steady loop.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <article key={title} className="card-paper group p-6 transition-transform hover:-translate-y-0.5">
              <span className="grid size-11 place-items-center rounded-2xl bg-primary-tint transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="size-5 text-primary-deep transition-colors group-hover:text-primary-foreground" />
              </span>
              <h3 className="mt-4 text-lg text-foreground">{title}</h3>
              <p className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">{body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* PLAN */}
      <section id="plan" className="border-y bg-surface scroll-mt-16">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28">
          <div>
            <p className="label-caps">The plan</p>
            <h2 className="mt-2 text-balance text-4xl leading-tight">
              You bring the hours. We bring the order.
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              You choose the subjects when you create your account — then theory, practice,
              and revision are woven together, with lighter review weeks before mocks.
            </p>
            <ol className="mt-8 space-y-4">
              {[
                ["Foundations", "Core concepts, essential patterns, and a daily habit."],
                ["Depth", "Harder sets, labs, and your projects take shape."],
                ["Proof", "Full mocks, polish, and revision sprints to placement week."],
              ].map(([t, b], i) => (
                <li key={t} className="flex gap-4">
                  <span className="num grid size-9 shrink-0 place-items-center rounded-full bg-primary-tint text-sm font-semibold text-primary-deep">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-medium text-foreground">{t}</p>
                    <p className="text-[15px] text-muted-foreground">{b}</p>
                  </div>
                </li>
              ))}
            </ol>
            <Button asChild className="mt-8 rounded-xl">
              <Link to="/auth">
                Get my Day 1 list <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
          <div className="card-paper p-6 sm:p-7" aria-label="How your plan is built">
            <p className="label-caps mb-4">Your subjects · your pace</p>
            <ul className="space-y-3">
              {PLAN_STEPS.map((s) => (
                <li key={s.title} className="rounded-2xl border bg-background px-4 py-3.5">
                  <p className="text-[15px] font-medium">{s.title}</p>
                  <p className="mt-0.5 text-[13px] text-muted-foreground">{s.body}</p>
                  <ProgressBar value={s.bar} className="mt-2.5" label={s.title} />
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[13px] leading-relaxed text-muted-foreground">
              The subjects you pick when creating your account appear here — nothing
              pre-decided, nothing extra.
            </p>
          </div>
        </div>
      </section>

      {/* PRACTICE / MOCKS */}
      <section id="practice" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6 lg:py-28">
        <div className="grid items-stretch gap-4 lg:grid-cols-2">
          <article className="card-paper flex flex-col p-7 sm:p-9">
            <span className="grid size-11 place-items-center rounded-2xl bg-clay-tint">
              <ShieldCheck className="size-5 text-foreground" />
            </span>
            <h3 className="mt-4 text-2xl">Topic practice with AI notes</h3>
            <p className="mt-2 leading-relaxed text-muted-foreground">
              Every topic in the subjects you chose opens with a two-minute brief — what it is,
              why companies ask it, and the three ideas worth remembering. Then a focused set
              to lock it in.
            </p>
            <div className="mt-6 rounded-2xl bg-surface-2 p-4 text-sm">
              <p className="font-medium">“Explain this topic in 30 seconds”</p>
              <p className="mt-1 text-muted-foreground">
                The core idea, a quick example, and the one mistake to avoid…
              </p>
            </div>
          </article>
          <article className="card-paper flex flex-col bg-primary-deep p-7 text-primary-foreground sm:p-9">
            <span className="grid size-11 place-items-center rounded-2xl bg-primary-foreground/15">
              <ClipboardCheck className="size-5" />
            </span>
            <h3 className="mt-4 font-display text-2xl">Sunday mocks, minus the dread</h3>
            <p className="mt-2 leading-relaxed opacity-80">
              One timed paper each Sunday across the subjects you chose. Auto-graded
              with calm explanations — review Monday, revise Friday.
            </p>
            <ul className="mt-6 space-y-2.5 text-[15px]">
              {["Timed like the real thing", "Section-wise review", "Retake & track best score"].map((t) => (
                <li key={t} className="flex items-center gap-2.5">
                  <CheckCircle2 className="size-4 shrink-0 opacity-80" /> {t}
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      {/* CALM */}
      <section id="calm" className="border-y bg-surface scroll-mt-16">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:py-24">
          <Leaf className="mx-auto size-7 text-primary" />
          <blockquote className="mt-5 text-balance font-display text-3xl leading-snug sm:text-4xl">
            “Placement prep doesn't need more pressure. It needs a steadier pace.”
          </blockquote>
          <p className="mt-5 text-muted-foreground">
            No leaderboards shouting at you. No 14-hour hustle charts. Just today's work,
            done well — and a streak that proves you can trust yourself.
          </p>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="card-paper relative overflow-hidden p-8 text-center sm:p-14">
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden="true"
            style={{
              background:
                "radial-gradient(500px 260px at 50% 0%, var(--primary-tint) 0%, transparent 70%)",
            }}
          />
          <div className="relative">
            <h2 className="mx-auto max-w-xl text-balance text-4xl leading-tight">
              Start small today. Walk in ready.
            </h2>
            <p className="mx-auto mt-3 max-w-md text-muted-foreground">
              Free to start. Your Day 1 list takes two minutes to generate — and twenty to complete.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className="h-12 rounded-2xl px-7 text-base">
                <Link to="/auth">
                  Create my plan <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 rounded-2xl px-7 text-base">
                <Link to="/auth">I already have an account</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t bg-surface">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <span className="flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-xl bg-primary-tint">
                <Leaf className="size-5 text-primary-deep" />
              </span>
              <span className="font-display text-xl text-foreground">Steady</span>
            </span>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              A quiet place to prepare for placements. Pick your subjects, follow one calm
              list a day, and walk in ready.
            </p>
          </div>
          <nav aria-label="Product">
            <p className="label-caps mb-4">Product</p>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#features" className="text-muted-foreground transition-colors hover:text-foreground">Features</a></li>
              <li><a href="#plan" className="text-muted-foreground transition-colors hover:text-foreground">How the plan works</a></li>
              <li><a href="#practice" className="text-muted-foreground transition-colors hover:text-foreground">Practice & mocks</a></li>
              <li><a href="#calm" className="text-muted-foreground transition-colors hover:text-foreground">Why calm</a></li>
            </ul>
          </nav>
          <nav aria-label="Get started">
            <p className="label-caps mb-4">Get started</p>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/auth" className="text-muted-foreground transition-colors hover:text-foreground">Create your account</Link></li>
              <li><Link to="/auth" className="text-muted-foreground transition-colors hover:text-foreground">Sign in</Link></li>
              <li><Link to="/auth" className="text-muted-foreground transition-colors hover:text-foreground">Begin Day 1</Link></li>
            </ul>
          </nav>
        </div>
        <div className="border-t">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-[13px] text-muted-foreground sm:flex-row sm:px-6">
            <span>© {new Date().getFullYear()} Steady · a quiet place to prepare</span>
            <span>Your subjects · your pace · 1 day at a time</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
