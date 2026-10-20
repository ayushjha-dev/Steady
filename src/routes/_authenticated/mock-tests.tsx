import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Clock, Loader2, Plus, Target, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CalmError, EmptyState, Shimmer, SubjectDot } from "@/components/steady/kit";
import { createMockTest, useMockTests, useSubjects } from "@/lib/data";
import type { SubjectKey } from "@/lib/curriculum";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/mock-tests")({
  head: () => ({
    meta: [
      { title: "Mock Tests — Steady" },
      {
        name: "description",
        content: "Full-length mock tests with timer and detailed analytics.",
      },
      { property: "og:title", content: "Mock Tests — Steady" },
      {
        property: "og:description",
        content: "Practice with timed mock tests and track your progress.",
      },
    ],
  }),
  component: MockTestsPage,
});

const COUNTS = [10, 20, 30] as const;

function MockTestsPage() {
  const { data: tests, isLoading, isError } = useMockTests();
  const [filter, setFilter] = useState<"all" | "completed" | "in_progress">("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  if (isError) return <CalmError />;

  const filteredTests =
    filter === "all"
      ? tests
      : tests?.filter((t) => t.status === filter || t.status === "not_started");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] sm:text-[32px]">Mock Tests</h1>
          <p className="text-sm text-muted-foreground">
            Full-length practice tests with timer and analytics
          </p>
        </div>
        <Button className="rounded-xl" onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 size-4" />
          New Mock Test
        </Button>
      </div>

      <NewMockTestDialog open={dialogOpen} onOpenChange={setDialogOpen} />

      {/* Stats Overview */}
      {!isLoading && tests && tests.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary-tint">
                <Target className="size-5 text-primary" />
              </div>
              <div>
                <div className="num text-2xl font-semibold text-foreground">
                  {tests.filter((t) => t.status === "completed").length}
                </div>
                <p className="text-xs text-muted-foreground">Tests completed</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary-tint">
                <Trophy className="size-5 text-primary" />
              </div>
              <div>
                <div className="num text-2xl font-semibold text-foreground">
                  {tests.filter((t) => t.status === "completed").length > 0
                    ? Math.round(
                        tests
                          .filter((t) => t.status === "completed")
                          .reduce((acc, t) => acc + (t.percentage || 0), 0) /
                          tests.filter((t) => t.status === "completed").length,
                      )
                    : 0}
                  %
                </div>
                <p className="text-xs text-muted-foreground">Average score</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary-tint">
                <Clock className="size-5 text-primary" />
              </div>
              <div>
                <div className="num text-2xl font-semibold text-foreground">
                  {tests.filter((t) => t.status === "in_progress").length}
                </div>
                <p className="text-xs text-muted-foreground">In progress</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filter tabs */}
      {!isLoading && tests && tests.length > 0 && (
        <div className="flex gap-2">
          {(["all", "in_progress", "completed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface-2 text-muted-foreground hover:bg-surface-2/80",
              )}
            >
              {f === "all" ? "All" : f === "in_progress" ? "In Progress" : "Completed"}
            </button>
          ))}
        </div>
      )}

      {/* Tests List */}
      {isLoading ? (
        <div className="space-y-4">
          <Shimmer className="h-32" />
          <Shimmer className="h-32" />
          <Shimmer className="h-32" />
        </div>
      ) : !tests || tests.length === 0 ? (
        <div className="space-y-4">
          <EmptyState
            title="No mock tests yet"
            body="Create your first mock test — pick one of your subjects or go full syllabus — and practice under timed conditions."
          />
          <div className="flex justify-center">
            <Button className="rounded-xl" onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 size-4" />
              Create Mock Test
            </Button>
          </div>
        </div>
      ) : filteredTests && filteredTests.length === 0 ? (
        <EmptyState title="No tests found" body={`No ${filter} tests to show.`} />
      ) : (
        <div className="space-y-4">
          {filteredTests?.map((test) => (
            <MockTestCard key={test.id} test={test} />
          ))}
        </div>
      )}
    </div>
  );
}

function NewMockTestDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: subjects } = useSubjects();
  const [choice, setChoice] = useState<string>("full");
  const [count, setCount] = useState<(typeof COUNTS)[number]>(20);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const list = useMemo(() => subjects ?? [], [subjects]);

  const create = async () => {
    setBusy(true);
    setError(null);
    try {
      const { generateMockTest } = await import("@/lib/ai");
      const isFull = choice === "full";
      const picked = list.find((s) => s.id === choice);
      const label = isFull ? "Full syllabus" : (picked?.name ?? "Subject");
      const topicScope = (isFull ? list : picked ? [picked] : []).flatMap((s) =>
        s.sections.flatMap((sec) => sec.topics.map((t) => t.name)),
      );
      const response = await generateMockTest(label, count, topicScope);
      if (response.error || !response.data) {
        throw new Error(response.error || "No questions generated");
      }
      const test = await createMockTest({
        title: `${label} Mock · ${count} Qs`,
        description: isFull
          ? `Covers all your subjects (${list.map((s) => s.name).join(", ")})`
          : `Covers ${label}`,
        testType: isFull ? "full" : "subject",
        questions: response.data.questions,
        durationMinutes: count * 2,
        totalMarks: count,
      });
      await qc.invalidateQueries({ queryKey: ["mock_tests"] });
      onOpenChange(false);
      navigate({ to: "/mock-test/$testId", params: { testId: test.id } });
    } catch (err) {
      console.error("Failed to create mock test:", err);
      setError("Couldn't build the test this time. Please try again.");
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">New mock test</DialogTitle>
          <DialogDescription>
            Pick a subject from your plan — or go full syllabus across everything you study.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <p className="label-caps">Subject</p>
          <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
            <SubjectOption
              selected={choice === "full"}
              onSelect={() => setChoice("full")}
              label="Full syllabus"
              hint="All my subjects"
              dot={null}
            />
            {list.map((s) => {
              const topics = s.sections.reduce((a, sec) => a + sec.topics.length, 0);
              return (
                <SubjectOption
                  key={s.id}
                  selected={choice === s.id}
                  onSelect={() => setChoice(s.id)}
                  label={s.name}
                  hint={`${topics} topics`}
                  dot={<SubjectDot k={s.key as SubjectKey} />}
                />
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <p className="label-caps">Questions</p>
          <div className="flex gap-2">
            {COUNTS.map((c) => (
              <button
                key={c}
                onClick={() => setCount(c)}
                className={cn(
                  "num flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors",
                  count === c
                    ? "border-primary bg-primary-tint text-primary-deep"
                    : "border-border bg-surface text-muted-foreground hover:text-foreground",
                )}
              >
                {c} Qs
                <span className="block text-[11px] font-normal">~{c * 2} min</span>
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-clay">{error}</p>}

        <DialogFooter>
          <Button className="h-11 w-full rounded-xl" onClick={create} disabled={busy}>
            {busy && <Loader2 className="size-4 animate-spin" />}
            {busy ? "Building your test…" : "Create test"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SubjectOption({
  selected,
  onSelect,
  label,
  hint,
  dot,
}: {
  selected: boolean;
  onSelect: () => void;
  label: string;
  hint: string;
  dot: React.ReactNode;
}) {
  return (
    <button
      onClick={onSelect}
      role="radio"
      aria-checked={selected}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-colors",
        selected
          ? "border-primary bg-primary-tint/50"
          : "border-border bg-surface hover:border-primary/50",
      )}
    >
      {dot ?? <span className="inline-block size-2 rounded-full bg-primary" />}
      <span className="flex-1">
        <span className="block text-sm font-medium text-foreground">{label}</span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
      <span
        className={cn(
          "grid size-5 place-items-center rounded-full border",
          selected ? "border-primary bg-primary text-primary-foreground" : "border-border",
        )}
      >
        {selected && <Check className="size-3" strokeWidth={3} />}
      </span>
    </button>
  );
}

function MockTestCard({ test }: { test: import("@/lib/data").MockTest }) {
  const statusColor =
    test.status === "completed"
      ? "text-primary"
      : test.status === "in_progress"
        ? "text-sand"
        : "text-muted-foreground";

  const statusLabel =
    test.status === "completed"
      ? "Completed"
      : test.status === "in_progress"
        ? "In Progress"
        : "Not Started";

  return (
    <Link
      to="/mock-test/$testId"
      params={{ testId: test.id }}
      className="card-paper block p-6 transition-transform hover:-translate-y-0.5"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-medium text-foreground">{test.title}</h3>
            <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
              {test.test_type === "full" ? "Full syllabus" : "Subject"}
            </span>
            <span className={cn("text-xs font-medium", statusColor)}>{statusLabel}</span>
          </div>
          {test.description && <p className="text-sm text-muted-foreground">{test.description}</p>}
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Clock className="size-3.5" />
              <span>{test.duration_minutes} minutes</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Target className="size-3.5" />
              <span>{test.total_marks} marks</span>
            </div>
            {test.completed_at && (
              <div className="flex items-center gap-1.5">
                <Trophy className="size-3.5" />
                <span>{test.percentage?.toFixed(1)}% scored</span>
              </div>
            )}
          </div>
        </div>
        {test.status === "completed" && (
          <div className="text-right">
            <div className="num text-3xl font-semibold text-foreground">
              {test.score}/{test.total_marks}
            </div>
            <p className="text-xs text-muted-foreground">
              {test.completed_at &&
                formatDistanceToNow(new Date(test.completed_at), { addSuffix: true })}
            </p>
          </div>
        )}
        {test.status === "in_progress" && <Button className="rounded-xl">Resume Test</Button>}
        {test.status === "not_started" && <Button className="rounded-xl">Start Test</Button>}
      </div>
    </Link>
  );
}
