import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ChevronDown, NotebookText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SUBJECT_META, type SubjectKey } from "@/lib/curriculum";
import {
  subjectProgress,
  useSubjects,
  useUpdateTopic,
  type Topic,
  type TopicStatus,
} from "@/lib/data";
import {
  CalmError,
  Card,
  Chip,
  EmptyState,
  ProgressBar,
  Shimmer,
  STATUS_ORDER,
  StatusPill,
} from "@/components/steady/kit";

export const Route = createFileRoute("/_authenticated/subjects/$subjectId")({
  head: () => ({
    meta: [
      { title: "Subject — Steady" },
      {
        name: "description",
        content: "Sections and topics for one subject, with status and notes.",
      },
      { property: "og:title", content: "Subject — Steady" },
      {
        property: "og:description",
        content: "Track each topic: not started, in progress, done or revise.",
      },
    ],
  }),
  component: SubjectDetail,
});

const FINISH: Record<string, string> = {
  cyber: "Month 6",
  dsa: "Month 5",
  csf: "Month 4",
  apt: "Month 5",
  proj: "Month 5",
  hr: "Month 6",
};
type Filter = "all" | TopicStatus;

function SubjectDetail() {
  const { subjectId } = Route.useParams();
  const { data, isLoading, isError } = useSubjects();
  const update = useUpdateTopic();
  const [filter, setFilter] = useState<Filter>("all");
  const [openSec, setOpenSec] = useState<Set<string>>(new Set());

  if (isError) return <CalmError />;
  if (isLoading)
    return (
      <div className="space-y-4">
        <Shimmer className="h-32" />
        <Shimmer className="h-64" />
      </div>
    );
  const s = data?.find((x) => x.id === subjectId);
  if (!s)
    return (
      <EmptyState
        title="This subject isn't here."
        body="It may have been reset. Head back to Subjects."
      />
    );

  const key = s.key as SubjectKey;
  const p = subjectProgress(s);
  const cycle = (t: Topic) => {
    const next =
      STATUS_ORDER[(STATUS_ORDER.indexOf(t.status as TopicStatus) + 1) % STATUS_ORDER.length]!;
    update.mutate({
      id: t.id,
      patch: { status: next, completed_at: next === "done" ? new Date().toISOString() : null },
    });
  };
  const toggleSec = (id: string) =>
    setOpenSec((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  return (
    <div className="space-y-6">
      <Link
        to="/subjects"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Subjects
      </Link>
      <Card className="relative overflow-hidden">
        <span
          className="absolute inset-x-0 top-0 h-1"
          style={{ backgroundColor: SUBJECT_META[key].colorVar }}
        />
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            {s.is_main && (
              <Chip active className="mb-2">
                Main focus
              </Chip>
            )}
            <h1 className="text-[28px] sm:text-[32px]">{s.name}</h1>
            <p className="text-sm text-muted-foreground">Expected finish: {FINISH[key]}</p>
          </div>
          <div className="num font-display text-4xl text-foreground">{p.pct}%</div>
        </div>
        <ProgressBar
          value={p.pct}
          color={SUBJECT_META[key].colorVar}
          className="mt-4"
          label={`${s.name} progress`}
        />
        <div className="num mt-2 text-sm text-muted-foreground">
          Completed {p.done} · Remaining {p.total - p.done}
        </div>
      </Card>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter topics">
        {(["all", "in_progress", "done", "revise"] as Filter[]).map((f) => (
          <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>
            {f === "all"
              ? "All"
              : f === "in_progress"
                ? "In progress"
                : f === "done"
                  ? "Done"
                  : "Revise"}
          </Chip>
        ))}
      </div>

      <div className="card-paper divide-y overflow-hidden">
        {s.sections.map((sec) => {
          const topics = sec.topics.filter((t) => filter === "all" || t.status === filter);
          if (filter !== "all" && topics.length === 0) return null;
          const done = sec.topics.filter((t) => t.status === "done").length;
          const open = openSec.has(sec.id) || filter !== "all";
          return (
            <div key={sec.id}>
              <button
                onClick={() => toggleSec(sec.id)}
                aria-expanded={open}
                className="flex min-h-14 w-full items-center gap-3 px-5 text-left hover:bg-surface-2/60 sm:px-6"
              >
                <span className="flex-1 text-[15px] font-medium text-foreground">{sec.name}</span>
                <span className="num text-sm text-muted-foreground">
                  {done}/{sec.topics.length}
                </span>
                <ChevronDown
                  className={cn(
                    "size-4 text-muted-foreground transition-transform",
                    open && "rotate-180",
                  )}
                />
              </button>
              {open && (
                <ul className="page-in px-5 pb-3 sm:px-6">
                  {topics.map((t) => (
                    <li
                      key={t.id}
                      className="flex min-h-12 items-center gap-3 border-t border-border/60 first:border-t-0"
                    >
                      <span
                        className={cn(
                          "flex-1 text-sm",
                          t.status === "done" ? "text-muted-foreground" : "text-foreground",
                        )}
                      >
                        {t.name}
                      </span>
                      <StatusPill status={t.status as TopicStatus} onClick={() => cycle(t)} />
                      <Link
                        to="/topic/$topicId"
                        params={{ topicId: t.id }}
                        aria-label={`View ${t.name} details`}
                        className={cn(
                          "grid size-9 place-items-center rounded-lg hover:bg-surface-2",
                          t.notes || (t.resources as unknown[]).length
                            ? "text-primary-deep"
                            : "text-muted-foreground",
                        )}
                      >
                        <NotebookText className="size-4" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
