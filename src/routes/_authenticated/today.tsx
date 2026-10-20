import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useSignOut } from "@/lib/auth";
import {
  Check,
  ChevronDown,
  Code2,
  Leaf,
  LogOut,
  NotebookPen,
  Sparkles,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { addDays, fromISO } from "@/lib/curriculum";
import {
  computeStreak,
  fmtMinutes,
  planDay,
  subjectKeyOf,
  todayISO,
  usePracticeDay,
  usePracticeSet,
  usePracticeStreak,
  useProfile,
  useSubjects,
  useTasks,
  useTopicNote,
  useUpdateTask,
  type SubjectTree,
  type Task,
  type Topic,
} from "@/lib/data";
import type { MCQ } from "@/lib/ai";
import {
  Card,
  CalmError,
  EmptyState,
  ProgressRing,
  SectionHeader,
  Shimmer,
  SubjectDot,
} from "@/components/steady/kit";

export const Route = createFileRoute("/_authenticated/today")({
  head: () => ({
    meta: [
      { title: "Today's Practice — Steady" },
      {
        name: "description",
        content: "Today's tasks, practice questions, and daily reflection.",
      },
      { property: "og:title", content: "Today's Practice — Steady" },
      { property: "og:description", content: "Your daily plan and practice." },
    ],
  }),
  component: TodayPage,
});

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function TodayPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const requestSignOut = useSignOut();
  const { data: profile } = useProfile();
  const tasksQ = useTasks();
  const subjectsQ = useSubjects();
  const realToday = todayISO();
  const pd = planDay(profile, realToday);
  const date = pd.before && profile ? profile.start_date : realToday;
  const { data: tasks } = useTasks();
  const streak = computeStreak(tasks);

  const signOut = async () => {
    await requestSignOut();
    navigate({ to: "/auth", replace: true });
  };

  const initials = profile?.name
    ? profile.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const todays = useMemo(
    () => (tasksQ.data ?? []).filter((t) => t.date === date),
    [tasksQ.data, date],
  );
  const missed = useMemo(
    () =>
      pd.before
        ? []
        : (tasksQ.data ?? []).filter(
            (t) => t.date < realToday && !t.done && t.date >= addDays(realToday, -7),
          ),
    [tasksQ.data, realToday, pd.before],
  );

  if (tasksQ.isError || subjectsQ.isError) return <CalmError />;
  if (tasksQ.isLoading || subjectsQ.isLoading) {
    return (
      <div className="space-y-6">
        <Shimmer className="h-10 w-64" />
        <Shimmer className="h-40" />
        <Shimmer className="h-72" />
      </div>
    );
  }

  const subjects = subjectsQ.data ?? [];
  const { data: practiceSet } = usePracticeSet(date);
  const practiceItems = useMemo(
    () =>
      (((practiceSet?.questions as MCQ[] | undefined) ?? []).map((q, index) => ({ q, index }))),
    [practiceSet],
  );
  const doneCount = todays.filter((t) => t.done).length;
  const totalMin = todays.reduce((a, t) => a + t.est_minutes, 0);
  const doneMin = todays.filter((t) => t.done).reduce((a, t) => a + t.est_minutes, 0);
  const isSunday = fromISO(date).getDay() === 0;
  const dateLabel = fromISO(date).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  // group by subject, keep plan order
  const groups: { key: string; subjectId: string | null; tasks: Task[] }[] = [];
  for (const t of todays) {
    const k = t.subject_id ?? "review";
    let g = groups.find((x) => x.key === k);
    if (!g) groups.push((g = { key: k, subjectId: t.subject_id, tasks: [] }));
    g.tasks.push(t);
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[28px] leading-tight sm:text-[34px]">
              {greeting()}
              {profile?.name ? `, ${profile.name}` : ""}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{dateLabel}</p>
            {pd.before && (
              <p className="mt-3 inline-flex rounded-full bg-primary-tint px-3 py-1 text-xs text-primary-deep">
                Your plan begins tomorrow. Here's a quiet look at Day 1.
              </p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger className="lg:hidden">
              <Avatar className="size-9 cursor-pointer hover:ring-2 hover:ring-primary/20">
                <AvatarFallback className="bg-primary-tint text-xs font-medium text-primary-deep">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{profile?.name}</p>
                <p className="text-xs text-muted-foreground">{streak.current}-day streak</p>
              </div>
              <DropdownMenuItem onClick={signOut} className="cursor-pointer">
                <LogOut className="mr-2 size-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Card className="flex items-center gap-5 p-5">
          <ProgressRing
            value={todays.length ? (doneCount / todays.length) * 100 : 0}
            label={`${doneCount} of ${todays.length} tasks done`}
          >
            <span className="num font-display text-2xl">
              {doneCount}/{todays.length}
            </span>
            <span className="text-[11px] text-muted-foreground">tasks</span>
          </ProgressRing>
          <div>
            <div className="label-caps">Today's progress</div>
            <div className="num mt-1 text-lg">{fmtMinutes(doneMin)}</div>
            <div className="num text-sm text-muted-foreground">of {fmtMinutes(totalMin)}</div>
          </div>
        </Card>
      </section>

      {missed.length > 0 && <CatchUp missed={missed} today={realToday} />}

      <TodaysPracticeCard date={date} />

      <Card>
        <SectionHeader
          label="Today's plan"
          title={
            isSunday
              ? "A lighter day: revise and reflect"
              : todays.length <= 4
                ? "A few small steps for today"
                : "Small steps for today"
          }
        />
        {todays.length === 0 ? (
          <EmptyState
            title="Nothing planned for today."
            body="Enjoy the quiet, or open Subjects to pick something gentle."
          />
        ) : doneCount === todays.length ? (
          <>
            <EmptyState
              title="Everything for today is done. Rest your eyes."
              body="You showed up. That counts."
            />
            <TaskGroups
              groups={groups}
              subjects={subjects}
              tree={subjectsQ.data ?? []}
              date={date}
              practiceItems={practiceItems}
              practiceSetId={(practiceSet?.id as string | undefined) ?? null}
              practiceTotal={practiceItems.length}
            />
          </>
        ) : (
          <TaskGroups
            groups={groups}
            subjects={subjects}
            tree={subjectsQ.data ?? []}
            date={date}
            practiceItems={practiceItems}
            practiceSetId={(practiceSet?.id as string | undefined) ?? null}
            practiceTotal={practiceItems.length}
          />
        )}
      </Card>

      {isSunday && (
        <Card className="flex items-center gap-4">
          <NotebookPen className="size-5 text-primary" />
          <div className="flex-1">
            <div className="font-display text-lg">Weekly review</div>
            <p className="text-sm text-muted-foreground">Look back at the week, gently.</p>
          </div>
          <Button asChild variant="outline" className="rounded-xl">
            <Link to="/review">Open</Link>
          </Button>
        </Card>
      )}
    </div>
  );
}

function TaskGroups({
  groups,
  subjects,
  tree,
  date,
  practiceItems,
  practiceSetId,
  practiceTotal,
}: {
  groups: { key: string; subjectId: string | null; tasks: Task[] }[];
  subjects: { id: string; name: string; key: string }[];
  tree: SubjectTree[];
  date: string;
  practiceItems: { q: MCQ; index: number }[];
  practiceSetId: string | null;
  practiceTotal: number;
}) {
  return (
    <div className="space-y-6">
      {groups.map((g) => {
        const k = subjectKeyOf(subjects as never, g.subjectId);
        const name = subjects.find((s) => s.id === g.subjectId)?.name ?? "Review";
        const mins = g.tasks.reduce((a, t) => a + t.est_minutes, 0);
        return (
          <div key={g.key}>
            <div className="mb-1 flex items-center gap-2 text-sm">
              <SubjectDot k={k} />
              <span className="font-medium text-foreground">{name}</span>
              <span className="num text-muted-foreground">· {mins} min</span>
            </div>
            <ul className="divide-y">
              {g.tasks.map((t) => (
                <TaskRow
                  key={t.id}
                  task={t}
                  date={date}
                  study={findTopicForTask(tree, t)}
                  practice={questionsForTask(practiceItems, t)}
                  practiceSetId={practiceSetId}
                  practiceTotal={practiceTotal}
                />
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function TaskRow({
  task,
  date,
  study,
  practice,
  practiceSetId,
  practiceTotal,
}: {
  task: Task;
  date: string;
  study: { topic: Topic; subjectName: string } | null;
  practice: { q: MCQ; index: number }[];
  practiceSetId: string | null;
  practiceTotal: number;
}) {
  const update = useUpdateTask();
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(task.notes);
  const toggle = () =>
    update.mutate({
      id: task.id,
      patch: { done: !task.done, done_at: task.done ? null : new Date().toISOString() },
    });

  return (
    <li className={cn("py-1 transition-opacity", task.done && "opacity-55")}>
      <div className="flex min-h-14 items-center gap-3">
        <button
          onClick={toggle}
          role="checkbox"
          aria-checked={task.done}
          aria-label={`Mark "${task.detail}" ${task.done ? "not done" : "done"}`}
          className={cn(
            "grid size-6 shrink-0 place-items-center rounded-full border-[1.5px] transition-colors duration-200",
            task.done
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border hover:border-primary",
          )}
        >
          {task.done && <Check className="tick-in size-3.5" strokeWidth={3} />}
        </button>
        <button
          onClick={() => setOpen(!open)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
          aria-expanded={open}
        >
          <div className="min-w-0 flex-1">
            <div
              className={cn(
                "truncate text-[15px] text-foreground",
                task.done && "line-through decoration-muted-foreground/50",
              )}
            >
              {task.title}
              {task.carried_over && (
                <span className="ml-2 rounded-full bg-clay-tint px-2 py-0.5 text-[11px] text-muted-foreground no-underline">
                  carried over
                </span>
              )}
            </div>
            <div className="truncate text-[13px] text-muted-foreground">{task.detail}</div>
          </div>
          <span className="num shrink-0 text-sm text-muted-foreground">{task.est_minutes}m</span>
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          />
        </button>
      </div>
      {open && (
        <div className="page-in mb-3 ml-9 space-y-3 rounded-xl bg-surface-2 p-4">
          {study && <TaskNotesBlock topic={study.topic} subjectName={study.subjectName} />}
          {practice.length > 0 && practiceSetId && (
            <div className="space-y-3 rounded-xl border bg-surface p-4">
              <div className="flex items-center gap-2">
                <Code2 className="size-4 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  Practice questions · {practice.length}
                </span>
              </div>
              {practice.map((item) => (
                <InlineQuestion
                  key={`${practiceSetId}-${item.index}`}
                  item={item}
                  practiceSetId={practiceSetId}
                  practiceTotal={practiceTotal}
                  date={date}
                />
              ))}
            </div>
          )}
          {study && practice.length === 0 && (
            <Button asChild variant="outline" size="sm" className="rounded-xl">
              <Link to="/practice" search={{ date }}>
                Open today's practice set
              </Link>
            </Button>
          )}
          <a
            href={`https://www.google.com/search?q=${encodeURIComponent(task.detail + " tutorial")}`}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-primary-deep underline-offset-4 hover:underline"
          >
            Find a resource for “{task.detail}”
          </a>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => notes !== task.notes && update.mutate({ id: task.id, patch: { notes } })}
            placeholder="Notes for this task…"
            className="min-h-20 rounded-xl border-border bg-surface"
          />
          <button
            onClick={() =>
              update.mutate({ id: task.id, patch: { date: addDays(date, 1), carried_over: true } })
            }
            className="text-sm text-muted-foreground hover:text-primary-deep"
          >
            Move to tomorrow
          </button>
        </div>
      )}
    </li>
  );
}

function norm(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Best-effort match of a plan task to a topic in the user's subjects tree. */
function findTopicForTask(
  subjects: SubjectTree[],
  task: Task,
): { topic: Topic; subjectName: string } | null {
  if (!task.subject_id) return null;
  const hayTitle = norm(task.title ?? "");
  const hayDetail = norm(task.detail ?? "");
  const hayWords = new Set(
    `${hayTitle} ${hayDetail}`.split(" ").filter((w) => w.length > 2),
  );
  let fallback: { topic: Topic; subjectName: string } | null = null;
  let sameSubject: { topic: Topic; subjectName: string } | null = null;
  for (const s of subjects) {
    for (const sec of s.sections) {
      for (const t of sec.topics) {
        const name = norm(t.name ?? "");
        if (!name) continue;
        const entry = { topic: t, subjectName: s.name };
        const isSameSubject = s.id === task.subject_id;
        // exact match wins immediately
        if (name === hayTitle) return entry;
        const contains =
          (name.length >= 3 && hayDetail.includes(name)) ||
          (hayTitle.length >= 3 && name.includes(hayTitle));
        const words = name.split(" ").filter((w) => w.length > 2);
        const overlap = words.filter((w) => hayWords.has(w)).length;
        if (contains || (words.length > 0 && overlap >= Math.min(2, words.length))) {
          if (isSameSubject && !sameSubject) sameSubject = entry;
          else if (!fallback) fallback = entry;
        }
      }
    }
  }
  return sameSubject ?? fallback;
}

/** Practice questions from today's set whose topic matches the task. */
function questionsForTask(
  items: { q: MCQ; index: number }[],
  task: Task,
): { q: MCQ; index: number }[] {
  if (!task.subject_id) return [];
  const hayTitle = norm(task.title ?? "");
  const hayWords = new Set(
    `${hayTitle} ${norm(task.detail ?? "")}`.split(" ").filter((w) => w.length > 2),
  );
  return items.filter((item) => {
    const qt = norm(item.q.topic ?? "");
    if (!qt) return false;
    if (qt === hayTitle) return true;
    const qWords = qt.split(" ").filter((w) => w.length > 2);
    return qWords.some((w) => hayWords.has(w));
  });
}

function TaskNotesBlock({ topic, subjectName }: { topic: Topic; subjectName: string }) {
  const qc = useQueryClient();
  const { data: note, isLoading } = useTopicNote(topic.id);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const { generateTopicNotes } = await import("@/lib/ai");
      const { createTopicNote } = await import("@/lib/data");
      const response = await generateTopicNotes(topic.name, subjectName);
      if (response.error || !response.data) {
        throw new Error(response.error || "No notes generated");
      }
      await createTopicNote({ topicId: topic.id, content: response.data, aiGenerated: true });
      qc.invalidateQueries({ queryKey: ["topic_note", topic.id] });
    } catch {
      setError("Couldn't reach the AI. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="rounded-xl border bg-surface p-4">
      <div className="mb-2 flex items-center gap-2">
        <Sparkles className="size-4 shrink-0 text-primary" />
        <span className="truncate text-sm font-medium text-foreground">
          Study notes · {topic.name}
        </span>
        <Link
          to="/topic/$topicId"
          params={{ topicId: topic.id }}
          className="ml-auto shrink-0 text-xs text-primary-deep underline-offset-4 hover:underline"
        >
          Open full
        </Link>
      </div>
      {isLoading ? (
        <div className="space-y-2">
          <Shimmer className="h-4 w-full" />
          <Shimmer className="h-4 w-5/6" />
          <Shimmer className="h-4 w-4/6" />
        </div>
      ) : note ? (
        <div className="prose max-w-none text-sm">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{note.content || ""}</ReactMarkdown>
        </div>
      ) : (
        <div>
          <p className="text-sm text-muted-foreground">
            {generating
              ? "Writing study notes for this topic…"
              : "No notes for this topic yet. Generate a quick brief to study right here."}
          </p>
          {error && <p className="mt-1 text-sm text-clay">{error}</p>}
          <Button size="sm" className="mt-2 rounded-xl" onClick={generate} disabled={generating}>
            <Sparkles className="size-3.5" />
            {generating ? "Generating…" : "Generate notes"}
          </Button>
        </div>
      )}
    </div>
  );
}

function InlineQuestion({
  item,
  practiceSetId,
  practiceTotal,
  date,
}: {
  item: { q: MCQ; index: number };
  practiceSetId: string;
  practiceTotal: number;
  date: string;
}) {
  const qc = useQueryClient();
  const { q, index } = item;
  const [selected, setSelected] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const show = selected !== null;
  const isCorrect = selected === q.correct_index;

  const answer = async (i: number) => {
    if (show) return;
    setSelected(i);
    if (saved) return;
    setSaved(true);
    try {
      const { savePracticeAttempt, updatePracticeDay } = await import("@/lib/data");
      await savePracticeAttempt({
        practiceSetId,
        questionIndex: index,
        selectedIndex: i,
        isCorrect: i === q.correct_index,
        timeTakenSeconds: 0,
      });
      const day = qc.getQueryData<{ solved?: number; total?: number }>([
        "practice_day",
        date,
      ]);
      await updatePracticeDay(date, (day?.solved ?? 0) + 1, day?.total ?? practiceTotal);
      qc.invalidateQueries({ queryKey: ["practice_day", date] });
      qc.invalidateQueries({ queryKey: ["practice_set", date] });
    } catch (err) {
      console.error("Failed to save attempt:", err);
    }
  };

  return (
    <div className="rounded-xl bg-surface-2 p-3.5">
      <p className="text-[14px] leading-relaxed text-foreground">{q.question}</p>
      <div className="mt-2.5 space-y-2">
        {q.options.map((option, i) => {
          const isSel = selected === i;
          const isRight = i === q.correct_index;
          return (
            <button
              key={i}
              onClick={() => answer(i)}
              disabled={show}
              className={cn(
                "w-full rounded-lg border px-3 py-2 text-left text-[13px] transition-colors",
                !show && "border-border bg-surface hover:border-primary",
                show && isSel && isCorrect && "border-primary bg-primary-tint text-foreground",
                show && isSel && !isCorrect && "border-clay bg-clay-tint text-foreground",
                show && !isSel && isRight && "border-primary bg-primary-tint text-foreground",
                show && "cursor-default",
              )}
            >
              <span className="mr-2 font-medium text-muted-foreground">
                {String.fromCharCode(65 + i)}.
              </span>
              {option}
            </button>
          );
        })}
      </div>
      {show && (
        <p className="page-in mt-2.5 text-[13px] leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">
            {isCorrect ? "Correct. " : "Not quite. "}
          </span>
          {q.explanation}
        </p>
      )}
    </div>
  );
}

function CatchUp({ missed, today }: { missed: Task[]; today: string }) {
  const [open, setOpen] = useState(false);
  const update = useUpdateTask();
  const addAll = () =>
    missed.forEach((t) => update.mutate({ id: t.id, patch: { date: today, carried_over: true } }));
  const spread = () =>
    missed.forEach((t, i) =>
      update.mutate({ id: t.id, patch: { date: addDays(today, i % 7), carried_over: true } }),
    );
  return (
    <div className="card-paper border-l-[3px] border-l-clay p-5">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between text-left"
        aria-expanded={open}
      >
        <div>
          <div className="text-[15px] text-foreground">
            <span className="num">{missed.length}</span> {missed.length === 1 ? "task" : "tasks"}{" "}
            carried over from earlier
          </div>
          <div className="text-sm text-muted-foreground">
            Missed a day? That's okay, here's a gentle catch-up.
          </div>
        </div>
        <ChevronDown
          className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>
      {open && (
        <div className="page-in mt-4 space-y-3">
          <ul className="space-y-1 text-sm text-muted-foreground">
            {missed.map((t) => (
              <li key={t.id}>· {t.detail}</li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" className="rounded-xl" onClick={addAll}>
              Add to today
            </Button>
            <Button size="sm" variant="outline" className="rounded-xl" onClick={spread}>
              Spread across this week
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function TodaysPracticeCard({ date }: { date: string }) {
  const { data: practiceSet, isLoading } = usePracticeSet(date);
  const { data: practiceDay } = usePracticeDay(date);
  const { data: streak } = usePracticeStreak();
  const { data: profile } = useProfile();
  const qc = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);

  const total = practiceDay?.total || 0;
  const solved = practiceDay?.solved || 0;
  const completed = practiceDay?.completed || false;
  const currentStreak = streak?.current || 0;

  // Auto-generate practice set if missing
  useEffect(() => {
    if (!isLoading && !practiceSet && !isGenerating && profile?.plan_loaded) {
      setIsGenerating(true);
      (async () => {
        try {
          const { generateDailyPractice } = await import("@/lib/ai");
          const { createPracticeSet, updatePracticeDay, useTasks } = await import("@/lib/data");

          // Get today's tasks to extract topics
          const todaysTasks = qc.getQueryData<any[]>(["tasks"]);
          const topicsForToday =
            todaysTasks
              ?.filter((t: any) => t.date === date && t.subject_id)
              .map((t: any) => t.detail.split(":")[0] || t.title)
              .filter(Boolean) || [];

          // Generate questions based on today's topics (or empty for general practice)
          const response = await generateDailyPractice(
            topicsForToday.length > 0 ? topicsForToday : [],
            10, // 10 questions per day
          );

          if (response.error || !response.data) {
            throw new Error(response.error || "No questions generated");
          }

          await createPracticeSet({
            date,
            kind: "daily",
            questions: response.data.questions,
          });
          await updatePracticeDay(date, 0, response.data.questions.length);

          // Refresh queries
          qc.invalidateQueries({ queryKey: ["practice_set", date] });
          qc.invalidateQueries({ queryKey: ["practice_day", date] });
        } catch (err) {
          console.error("Failed to generate practice set:", err);
        } finally {
          setIsGenerating(false);
        }
      })();
    }
  }, [date, isLoading, practiceSet, isGenerating, profile?.plan_loaded, qc]);

  return (
    <Card>
      <SectionHeader
        label="Today's practice"
        title={completed ? "All done for today" : "Daily practice set"}
      />
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-5">
          <ProgressRing
            value={total ? (solved / total) * 100 : 0}
            label={`${solved} of ${total} questions solved`}
          >
            <span className="num font-display text-2xl">
              {solved}/{total}
            </span>
            <span className="text-[11px] text-muted-foreground">solved</span>
          </ProgressRing>
          <div>
            <div className="label-caps">Practice progress</div>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <Leaf className="size-4 text-primary" />
              <span>
                <span className="num text-foreground">{currentStreak}</span>-day streak
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {completed
                ? "You showed up today. That counts."
                : total === 0
                  ? isGenerating
                    ? "Generating your practice set..."
                    : "Loading practice..."
                  : `${total - solved} question${total - solved !== 1 ? "s" : ""} remaining`}
            </p>
          </div>
        </div>
        <Button
          asChild={!!practiceSet}
          className="h-11 rounded-xl"
          disabled={!practiceSet || completed || isGenerating}
        >
          {practiceSet ? (
            <Link to="/practice" search={{ date }}>
              {solved === 0 ? "Start practice" : "Continue practice"}
            </Link>
          ) : (
            <span>{isGenerating ? "Generating..." : "Loading..."}</span>
          )}
        </Button>
      </div>
    </Card>
  );
}
