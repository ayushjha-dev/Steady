import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Briefcase, Code2, Cpu, MessagesSquare, ShieldCheck, Sigma } from "lucide-react";
import { subjectProgress, useSubjects } from "@/lib/data";
import { SUBJECT_META, type SubjectKey } from "@/lib/curriculum";
import { CalmError, Chip, ProgressBar, Shimmer } from "@/components/steady/kit";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/subjects/")({
  head: () => ({
    meta: [
      { title: "Subjects — Steady" },
      {
        name: "description",
        content: "Every subject in the placement plan with calm progress at a glance.",
      },
      { property: "og:title", content: "Subjects — Steady" },
      {
        property: "og:description",
        content: "Cybersecurity, DSA, CS fundamentals, aptitude, projects and HR.",
      },
    ],
  }),
  component: SubjectsPage,
});

export const SUBJECT_ICONS: Record<SubjectKey, typeof BookOpen> = {
  cyber: ShieldCheck,
  dsa: Code2,
  csf: Cpu,
  apt: Sigma,
  proj: Briefcase,
  hr: MessagesSquare,
};

function SubjectsPage() {
  const { data, isLoading, isError } = useSubjects();
  if (isError) return <CalmError />;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] sm:text-[32px]">Subjects</h1>
        <p className="text-sm text-muted-foreground">
          Everything you're covering, one topic at a time.
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading && Array.from({ length: 6 }).map((_, i) => <Shimmer key={i} className="h-40" />)}
        {data?.map((s) => {
          const p = subjectProgress(s);
          const key = s.key as SubjectKey;
          const Icon = SUBJECT_ICONS[key] ?? BookOpen;
          return (
            <Link
              key={s.id}
              to="/subjects/$subjectId"
              params={{ subjectId: s.id }}
              className={cn(
                "card-paper group block p-6 transition-transform hover:-translate-y-0.5",
                s.is_main && "sm:col-span-2 lg:col-span-2",
              )}
            >
              <div className="mb-4 flex items-center gap-3">
                <span
                  className={cn(
                    "grid size-10 place-items-center rounded-xl",
                    SUBJECT_META[key].tint,
                  )}
                >
                  <Icon className={cn("size-5", SUBJECT_META[key].text)} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-display text-lg text-foreground">{s.name}</div>
                  <div className="truncate text-sm text-muted-foreground">{s.tagline}</div>
                </div>
                {s.is_main && <Chip active>Main focus</Chip>}
              </div>
              <ProgressBar
                value={p.pct}
                color={SUBJECT_META[key].colorVar}
                label={`${s.name} progress`}
              />
              <div className="num mt-2 flex justify-between text-sm text-muted-foreground">
                <span>
                  {p.done} / {p.total} topics
                </span>
                <span>{p.pct}%</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
