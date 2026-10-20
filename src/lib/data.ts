import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { getViewerFn } from "./auth";
import {
  CURRICULUM,
  generatePlan,
  toISO,
  addDays,
  dayDiff,
  PLAN_DAYS,
  type SubjectKey,
} from "./curriculum";

// ---------- types (SQLite-backed, same shape the UI expects) ----------

export type Profile = {
  id: string;
  name: string;
  start_date: string;
  daily_target_minutes: number;
  plan_loaded: boolean;
  selected_subjects: string[];
  created_at: string;
};
export type Subject = {
  id: string;
  user_id: string;
  key: string;
  name: string;
  tagline: string;
  color: string;
  is_main: boolean;
  sort_order: number;
};
export type Section = {
  id: string;
  user_id: string;
  subject_id: string;
  name: string;
  sort_order: number;
};
export type Topic = {
  id: string;
  user_id: string;
  section_id: string;
  name: string;
  status: string;
  notes: string;
  resources: any;
  sort_order: number;
  completed_at: string | null;
};
export type Task = {
  id: string;
  user_id: string;
  date: string;
  subject_id: string | null;
  title: string;
  detail: string;
  est_minutes: number;
  done: boolean;
  done_at: string | null;
  carried_over: boolean;
  notes: string;
  sort_order: number;
};
export type PracticeSet = {
  id: string;
  user_id: string;
  date: string;
  kind: string;
  topic_id: string | null;
  questions: any;
  metadata?: any;
  generated_at: string;
};
export type PracticeAttempt = {
  id: string;
  user_id: string;
  practice_set_id: string;
  question_index: number;
  selected_index: number;
  is_correct: boolean;
  time_taken_seconds: number;
  created_at: string;
};
export type PracticeDay = {
  user_id: string;
  date: string;
  total: number;
  solved: number;
  completed: boolean;
};
export type TopicNote = {
  id: string;
  user_id: string;
  topic_id: string;
  content: string;
  version: number;
  ai_generated: boolean;
  generated_at: string | null;
  last_edited_at: string | null;
  created_at: string;
  updated_at: string;
};
export type TopicNoteVersion = {
  id: string;
  note_id: string;
  user_id: string;
  version: number;
  content: string;
  change_summary: string | null;
  created_at: string;
};
export type MockTest = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  test_type: "full" | "subject" | "custom";
  questions: any;
  duration_minutes: number;
  total_marks: number;
  status: "not_started" | "in_progress" | "completed";
  started_at: string | null;
  completed_at: string | null;
  time_spent_seconds: number;
  score: number | null;
  percentage: number | null;
  correct_count: number;
  incorrect_count: number;
  unattempted_count: number;
  answers: any;
  subject_breakdown: any;
  created_at: string;
  updated_at: string;
};
export type TopicStatus = "not_started" | "in_progress" | "done" | "revise";

export const todayISO = () => toISO(new Date());

// ---------- server functions ----------
// NOTE: server-only modules (./server/*) must be imported dynamically
// INSIDE .handler() callbacks — the build forbids static (or hoisted)
// server imports in any client-reachable file.

const getProfileFn = createServerFn({ method: "GET" })
  .validator(() => undefined as void)
  .handler(async () => {
    const { viewer } = await getViewerFn();
    if (!viewer) throw new Error("Not signed in");
    const store = await import("./server/store");
    return (await store.getProfile(viewer.id)) as Profile | null;
  });

const getSubjectsFn = createServerFn({ method: "GET" })
  .validator(() => undefined as void)
  .handler(async () => {
    const { viewer } = await getViewerFn();
    if (!viewer) throw new Error("Not signed in");
    const store = await import("./server/store");
    return (await store.getSubjectsTree(viewer.id)) as SubjectTree[];
  });

const getTasksFn = createServerFn({ method: "GET" })
  .validator(() => undefined as void)
  .handler(async () => {
    const { viewer } = await getViewerFn();
    if (!viewer) throw new Error("Not signed in");
    const store = await import("./server/store");
    return (await store.getTasks(viewer.id)) as Task[];
  });

const getPracticeSetFn = createServerFn({ method: "GET" })
  .validator((d: unknown) => d as { date: string; kind?: string })
  .handler(async (ctx) => {
    const { viewer } = await getViewerFn();
    if (!viewer) throw new Error("Not signed in");
    const store = await import("./server/store");
    return (await store.getPracticeSet(
      viewer.id,
      ctx.data.date,
      ctx.data.kind,
    )) as PracticeSet | null;
  });

const getPracticeDayFn = createServerFn({ method: "GET" })
  .validator((d: unknown) => d as { date: string })
  .handler(async (ctx) => {
    const { viewer } = await getViewerFn();
    if (!viewer) throw new Error("Not signed in");
    const store = await import("./server/store");
    return (await store.getPracticeDay(viewer.id, ctx.data.date)) as PracticeDay | null;
  });

const getCompletedPracticeDaysFn = createServerFn({ method: "GET" })
  .validator(() => undefined as void)
  .handler(async () => {
    const { viewer } = await getViewerFn();
    if (!viewer) throw new Error("Not signed in");
    const store = await import("./server/store");
    return (await store.getCompletedPracticeDays(viewer.id)) as PracticeDay[];
  });

const getPracticeDaysSinceFn = createServerFn({ method: "GET" })
  .validator((d: unknown) => d as { startDate: string })
  .handler(async (ctx) => {
    const { viewer } = await getViewerFn();
    if (!viewer) throw new Error("Not signed in");
    const store = await import("./server/store");
    return (await store.getPracticeDaysSince(viewer.id, ctx.data.startDate)) as PracticeDay[];
  });

const getPracticeAttemptsSinceFn = createServerFn({ method: "GET" })
  .validator((d: unknown) => d as { since: string })
  .handler(async (ctx) => {
    const { viewer } = await getViewerFn();
    if (!viewer) throw new Error("Not signed in");
    const store = await import("./server/store");
    return store.getPracticeAttemptsSince(viewer.id, ctx.data.since);
  });

const updateTaskFn = createServerFn({ method: "POST" })
  .validator((d: unknown) => d as { id: string; patch: Partial<Task> })
  .handler(async (ctx) => {
    const { viewer } = await getViewerFn();
    if (!viewer) throw new Error("Not signed in");
    const store = await import("./server/store");
    await store.updateTask(viewer.id, ctx.data.id, ctx.data.patch as Record<string, unknown>);
    return { ok: true };
  });

const updateTopicFn = createServerFn({ method: "POST" })
  .validator((d: unknown) => d as { id: string; patch: Partial<Topic> })
  .handler(async (ctx) => {
    const { viewer } = await getViewerFn();
    if (!viewer) throw new Error("Not signed in");
    const store = await import("./server/store");
    await store.updateTopic(viewer.id, ctx.data.id, ctx.data.patch as Record<string, unknown>);
    return { ok: true };
  });

type PlanRow = {
  date: string;
  subject: string | null;
  title: string;
  detail: string;
  est_minutes: number;
  sort_order: number;
};

type LoadPlanData = {
  profile: { name: string; startDate: string; dailyMinutes: number; selectedSubjects: string[] };
  curriculum: {
    key: string;
    name: string;
    tagline: string;
    is_main?: boolean | undefined;
    sections: [string, string[]][];
  }[];
  plan: PlanRow[];
};

const loadPlanFn = createServerFn({ method: "POST" })
  .validator((d: unknown) => d as LoadPlanData)
  .handler(async (ctx) => {
    const { viewer } = await getViewerFn();
    if (!viewer) throw new Error("Not signed in");
    const store = await import("./server/store");
    await store.loadPlanRows(viewer.id, ctx.data.profile, ctx.data.curriculum, ctx.data.plan);
    return { ok: true };
  });

type AttemptData = {
  practiceSetId: string;
  questionIndex: number;
  selectedIndex: number;
  isCorrect: boolean;
  timeTakenSeconds: number;
};

const savePracticeAttemptFn = createServerFn({ method: "POST" })
  .validator((d: unknown) => d as AttemptData)
  .handler(async (ctx) => {
    const { viewer } = await getViewerFn();
    if (!viewer) throw new Error("Not signed in");
    const store = await import("./server/store");
    await store.savePracticeAttemptRow(viewer.id, {
      practiceSetId: ctx.data.practiceSetId,
      questionIndex: ctx.data.questionIndex,
      selectedIndex: ctx.data.selectedIndex,
      isCorrect: ctx.data.isCorrect,
      timeTakenSeconds: ctx.data.timeTakenSeconds,
    });
    return { ok: true };
  });

const updatePracticeDayFn = createServerFn({ method: "POST" })
  .validator((d: unknown) => d as { date: string; solved: number; total: number })
  .handler(async (ctx) => {
    const { viewer } = await getViewerFn();
    if (!viewer) throw new Error("Not signed in");
    const store = await import("./server/store");
    await store.upsertPracticeDay(viewer.id, ctx.data.date, ctx.data.solved, ctx.data.total);
    return { ok: true };
  });

type NewPracticeSet = {
  date: string;
  kind: string;
  topicId?: string;
  questions: unknown;
  metadata?: Record<string, unknown>;
};

const createPracticeSetFn = createServerFn({ method: "POST" })
  .validator((d: unknown) => d as NewPracticeSet)
  .handler(async (ctx) => {
    const { viewer } = await getViewerFn();
    if (!viewer) throw new Error("Not signed in");
    const store = await import("./server/store");
    return (await store.createPracticeSetRow(viewer.id, {
      date: ctx.data.date,
      kind: ctx.data.kind,
      ...(ctx.data.topicId ? { topicId: ctx.data.topicId } : {}),
      questions: ctx.data.questions,
      metadata: ctx.data.metadata,
    })) as PracticeSet;
  });

const getTopicNoteFn = createServerFn({ method: "GET" })
  .validator((d: unknown) => d as { topicId: string })
  .handler(async (ctx) => {
    const { viewer } = await getViewerFn();
    if (!viewer) throw new Error("Not signed in");
    const store = await import("./server/store");
    return (await store.getTopicNote(viewer.id, ctx.data.topicId)) as TopicNote | null;
  });

const getTopicNoteVersionsFn = createServerFn({ method: "GET" })
  .validator((d: unknown) => d as { noteId: string })
  .handler(async (ctx) => {
    const { viewer } = await getViewerFn();
    if (!viewer) throw new Error("Not signed in");
    const store = await import("./server/store");
    return (await store.getTopicNoteVersions(viewer.id, ctx.data.noteId)) as unknown as TopicNoteVersion[];
  });

type NewTopicNote = { topicId: string; content: string; aiGenerated?: boolean };

const createTopicNoteFn = createServerFn({ method: "POST" })
  .validator((d: unknown) => d as NewTopicNote)
  .handler(async (ctx) => {
    const { viewer } = await getViewerFn();
    if (!viewer) throw new Error("Not signed in");
    const store = await import("./server/store");
    return (await store.createTopicNoteRow(viewer.id, {
      topicId: ctx.data.topicId,
      content: ctx.data.content,
      aiGenerated: ctx.data.aiGenerated,
    })) as TopicNote;
  });

type NoteUpdate = { noteId: string; content: string; changeSummary?: string };

const updateTopicNoteFn = createServerFn({ method: "POST" })
  .validator((d: unknown) => d as NoteUpdate)
  .handler(async (ctx) => {
    const { viewer } = await getViewerFn();
    if (!viewer) throw new Error("Not signed in");
    const store = await import("./server/store");
    return (await store.updateTopicNoteRow(viewer.id, {
      noteId: ctx.data.noteId,
      content: ctx.data.content,
      changeSummary: ctx.data.changeSummary,
    })) as TopicNote;
  });

type NoteUpsert = {
  id?: string;
  topicId: string;
  content: string;
  version?: number;
  aiGenerated?: boolean;
  generatedAt?: string | null;
};

const upsertTopicNoteFn = createServerFn({ method: "POST" })
  .validator((d: unknown) => d as NoteUpsert)
  .handler(async (ctx) => {
    const { viewer } = await getViewerFn();
    if (!viewer) throw new Error("Not signed in");
    const store = await import("./server/store");
    return store.upsertTopicNoteRow(viewer.id, {
      id: ctx.data.id,
      topicId: ctx.data.topicId,
      content: ctx.data.content,
      version: ctx.data.version,
      aiGenerated: ctx.data.aiGenerated,
      generatedAt: ctx.data.generatedAt,
    });
  });

export async function upsertTopicNote(params: {
  id?: string;
  topicId: string;
  content: string;
  version?: number;
  aiGenerated?: boolean;
  generatedAt?: string | null;
}) {
  return upsertTopicNoteFn({ data: params });
}

const getMockTestsFn = createServerFn({ method: "GET" })
  .validator(() => undefined as void)
  .handler(async () => {
    const { viewer } = await getViewerFn();
    if (!viewer) throw new Error("Not signed in");
    const store = await import("./server/store");
    return (await store.getMockTests(viewer.id)) as MockTest[];
  });

const getMockTestFn = createServerFn({ method: "GET" })
  .validator((d: unknown) => d as { testId: string })
  .handler(async (ctx) => {
    const { viewer } = await getViewerFn();
    if (!viewer) throw new Error("Not signed in");
    const store = await import("./server/store");
    return (await store.getMockTest(viewer.id, ctx.data.testId)) as MockTest | null;
  });

type NewMockTest = {
  title: string;
  description?: string;
  testType: string;
  questions: unknown;
  durationMinutes: number;
  totalMarks: number;
};

const createMockTestFn = createServerFn({ method: "POST" })
  .validator((d: unknown) => d as NewMockTest)
  .handler(async (ctx) => {
    const { viewer } = await getViewerFn();
    if (!viewer) throw new Error("Not signed in");
    const store = await import("./server/store");
    return (await store.createMockTestRow(viewer.id, {
      title: ctx.data.title,
      description: ctx.data.description,
      testType: ctx.data.testType,
      questions: ctx.data.questions,
      durationMinutes: ctx.data.durationMinutes,
      totalMarks: ctx.data.totalMarks,
    })) as MockTest;
  });

const startMockTestFn = createServerFn({ method: "POST" })
  .validator((d: unknown) => d as { testId: string })
  .handler(async (ctx) => {
    const { viewer } = await getViewerFn();
    if (!viewer) throw new Error("Not signed in");
    const store = await import("./server/store");
    return (await store.updateMockTestRow(viewer.id, ctx.data.testId, {
      status: "in_progress",
      started_at: new Date().toISOString(),
    })) as MockTest;
  });

type MockProgress = { testId: string; answers: unknown; timeSpentSeconds: number };

const updateMockTestProgressFn = createServerFn({ method: "POST" })
  .validator((d: unknown) => d as MockProgress)
  .handler(async (ctx) => {
    const { viewer } = await getViewerFn();
    if (!viewer) throw new Error("Not signed in");
    const store = await import("./server/store");
    return (await store.updateMockTestRow(viewer.id, ctx.data.testId, {
      answers: ctx.data.answers,
      time_spent_seconds: ctx.data.timeSpentSeconds,
    })) as MockTest;
  });

type MockCompletion = {
  testId: string;
  answers: unknown;
  timeSpentSeconds: number;
  score: number;
  percentage: number;
  correctCount: number;
  incorrectCount: number;
  unattemptedCount: number;
  subjectBreakdown: unknown;
};

const completeMockTestFn = createServerFn({ method: "POST" })
  .validator((d: unknown) => d as MockCompletion)
  .handler(async (ctx) => {
    const { viewer } = await getViewerFn();
    if (!viewer) throw new Error("Not signed in");
    const store = await import("./server/store");
    return (await store.updateMockTestRow(viewer.id, ctx.data.testId, {
      status: "completed",
      completed_at: new Date().toISOString(),
      answers: ctx.data.answers,
      time_spent_seconds: ctx.data.timeSpentSeconds,
      score: ctx.data.score,
      percentage: ctx.data.percentage,
      correct_count: ctx.data.correctCount,
      incorrect_count: ctx.data.incorrectCount,
      unattempted_count: ctx.data.unattemptedCount,
      subject_breakdown: ctx.data.subjectBreakdown,
    })) as MockTest;
  });

// ---------- hooks & actions (same names the UI already uses) ----------

export function useProfile() {
  return useQuery({ queryKey: ["profile"], queryFn: () => getProfileFn() });
}

export type SubjectTree = Subject & { sections: (Section & { topics: Topic[] })[] };

export function useSubjects() {
  return useQuery({ queryKey: ["subjects"], queryFn: () => getSubjectsFn() });
}

export function useTasks() {
  return useQuery({ queryKey: ["tasks"], queryFn: () => getTasksFn() });
}

export function usePracticeSet(date: string) {
  return useQuery({
    queryKey: ["practice_set", date],
    queryFn: () => getPracticeSetFn({ data: { date } }),
  });
}

// Topic practice sets are stored with kind="topic" and date=topicId, which makes
// each topic's set permanent (practice_sets is UNIQUE on user_id+date+kind).
export function useTopicPracticeSet(topicId: string | undefined) {
  return useQuery({
    queryKey: ["practice_set", "topic", topicId],
    queryFn: async () => {
      if (!topicId) return null;
      return getPracticeSetFn({ data: { date: topicId, kind: "topic" } });
    },
    enabled: !!topicId,
  });
}

export function usePracticeDay(date: string) {
  return useQuery({
    queryKey: ["practice_day", date],
    queryFn: () => getPracticeDayFn({ data: { date } }),
  });
}

export function usePracticeStreak() {
  return useQuery({
    queryKey: ["practice_streak"],
    queryFn: async () => {
      const data = await getCompletedPracticeDaysFn();
      const today = todayISO();
      let current = 0;
      let longest = 0;
      let tempStreak = 0;

      if (data.length === 0) return { current: 0, longest: 0 };

      const dates = data.map((d) => d.date).sort();
      let cursor = today;

      while (dates.includes(cursor)) {
        current++;
        cursor = addDays(cursor, -1);
      }

      if (current === 0 && dates.includes(addDays(today, -1))) {
        cursor = addDays(today, -1);
        while (dates.includes(cursor)) {
          current++;
          cursor = addDays(cursor, -1);
        }
      }

      const sortedDates = [...dates].sort();
      for (let i = 0; i < sortedDates.length; i++) {
        if (i === 0 || dayDiff(sortedDates[i - 1]!, sortedDates[i]!) === 1) {
          tempStreak++;
          longest = Math.max(longest, tempStreak);
        } else {
          tempStreak = 1;
        }
      }

      return { current, longest: Math.max(current, longest) };
    },
  });
}

export function usePracticeDaysSince(startDate: string) {
  return useQuery({
    queryKey: ["practice-days-since", startDate],
    queryFn: () => getPracticeDaysSinceFn({ data: { startDate } }),
  });
}

export function usePracticeAttemptsSince(since: string) {
  return useQuery({
    queryKey: ["practice-stats-since", since],
    queryFn: () => getPracticeAttemptsSinceFn({ data: { since } }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Task> }) => {
      await updateTaskFn({ data: { id, patch } });
    },
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: ["tasks"] });
      const prev = qc.getQueryData<Task[]>(["tasks"]);
      qc.setQueryData<Task[]>(["tasks"], (old) =>
        old?.map((t) => (t.id === id ? { ...t, ...patch } : t)),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(["tasks"], ctx.prev),
  });
}

export function useUpdateTopic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Topic> }) => {
      await updateTopicFn({ data: { id, patch } });
    },
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: ["subjects"] });
      const prev = qc.getQueryData<SubjectTree[]>(["subjects"]);
      qc.setQueryData<SubjectTree[]>(["subjects"], (old) =>
        old?.map((s) => ({
          ...s,
          sections: s.sections.map((sec) => ({
            ...sec,
            topics: sec.topics.map((t) => (t.id === id ? { ...t, ...patch } : t)),
          })),
        })),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(["subjects"], ctx.prev),
  });
}

export async function loadPlan(opts: {
  name: string;
  startDate: string;
  dailyMinutes: number;
  selectedSubjects: SubjectKey[];
}) {
  const selectedCurriculum = CURRICULUM.filter((s) => opts.selectedSubjects.includes(s.key));
  const plan = generatePlan(opts.startDate, opts.selectedSubjects).map((p) => ({
    date: p.date,
    subject: p.subject,
    title: p.title,
    detail: p.detail,
    est_minutes: p.est_minutes,
    sort_order: p.sort_order,
  }));
  await loadPlanFn({
    data: {
      profile: {
        name: opts.name.trim(),
        startDate: opts.startDate,
        dailyMinutes: Math.round(opts.dailyMinutes),
        selectedSubjects: opts.selectedSubjects,
      },
      curriculum: selectedCurriculum.map((s) => ({
        key: s.key,
        name: s.name,
        tagline: s.tagline,
        is_main: s.is_main,
        sections: s.sections,
      })),
      plan,
    },
  });
}

// ---------- derived helpers (unchanged, pure) ----------

export function planDay(profile: Profile | undefined | null, date = todayISO()) {
  if (!profile) return { day: 1, before: false, total: PLAN_DAYS };
  const diff = dayDiff(profile.start_date, date);
  return { day: Math.min(PLAN_DAYS, Math.max(1, diff + 1)), before: diff < 0, total: PLAN_DAYS };
}

export function computeStreak(tasks: Task[] | undefined, today = todayISO()) {
  if (!tasks) return { current: 0, longest: 0 };
  const days = new Set(
    tasks.filter((t) => t.done).map((t) => (t.done_at ? toISO(new Date(t.done_at)) : t.date)),
  );
  let current = 0;
  let cursor = days.has(today) ? today : addDays(today, -1);
  while (days.has(cursor)) {
    current++;
    cursor = addDays(cursor, -1);
  }
  const sorted = [...days].sort();
  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of sorted) {
    run = prev && dayDiff(prev, d) === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = d;
  }
  return { current, longest: Math.max(longest, current) };
}

export function subjectProgress(s: SubjectTree) {
  const topics = s.sections.flatMap((x) => x.topics);
  const done = topics.filter((t) => t.status === "done").length;
  return {
    done,
    total: topics.length,
    pct: topics.length ? Math.round((done / topics.length) * 100) : 0,
  };
}

export function subjectKeyOf(
  subjects: Subject[] | undefined,
  id: string | null,
): SubjectKey | "review" {
  if (!id) return "review";
  return (subjects?.find((s) => s.id === id)?.key as SubjectKey) ?? "review";
}

export function fmtMinutes(m: number) {
  const h = Math.floor(m / 60);
  const r = Math.round(m % 60);
  if (!h) return `${r}m`;
  return r ? `${h}h ${r}m` : `${h}h`;
}

// ---------- practice persistence ----------

export async function savePracticeAttempt(params: {
  practiceSetId: string;
  questionIndex: number;
  selectedIndex: number;
  isCorrect: boolean;
  timeTakenSeconds: number;
}) {
  await savePracticeAttemptFn({ data: params });
}

export async function updatePracticeDay(date: string, solved: number, total: number) {
  await updatePracticeDayFn({ data: { date, solved, total } });
}

export async function createPracticeSet(params: {
  date: string;
  kind: "daily" | "topic" | "mock";
  topicId?: string;
  questions: unknown;
  metadata?: Record<string, unknown>;
}) {
  return createPracticeSetFn({ data: params });
}

// ---------- topic notes ----------

export function useTopicNote(topicId: string | undefined) {
  return useQuery({
    queryKey: ["topic_note", topicId],
    queryFn: async () => {
      if (!topicId) return null;
      return getTopicNoteFn({ data: { topicId } });
    },
    enabled: !!topicId,
  });
}

export function useTopicNoteVersions(noteId: string | undefined) {
  return useQuery({
    queryKey: ["topic_note_versions", noteId],
    queryFn: async () => {
      if (!noteId) return [];
      return getTopicNoteVersionsFn({ data: { noteId } });
    },
    enabled: !!noteId,
  });
}

export async function createTopicNote(params: {
  topicId: string;
  content: string;
  aiGenerated?: boolean;
}) {
  return createTopicNoteFn({ data: params });
}

export async function updateTopicNote(params: {
  noteId: string;
  content: string;
  changeSummary?: string;
}) {
  return updateTopicNoteFn({ data: params });
}

// ---------- mock tests ----------

export function useMockTests() {
  return useQuery({ queryKey: ["mock_tests"], queryFn: () => getMockTestsFn() });
}

export function useMockTest(testId: string | undefined) {
  return useQuery({
    queryKey: ["mock_test", testId],
    queryFn: async () => {
      if (!testId) return null;
      return getMockTestFn({ data: { testId } });
    },
    enabled: !!testId,
  });
}

export async function createMockTest(params: {
  title: string;
  description?: string;
  testType: "full" | "subject" | "custom";
  questions: unknown;
  durationMinutes: number;
  totalMarks: number;
}) {
  return createMockTestFn({ data: params });
}

export async function startMockTest(testId: string) {
  return startMockTestFn({ data: { testId } });
}

export async function updateMockTestProgress(params: {
  testId: string;
  answers: unknown;
  timeSpentSeconds: number;
}) {
  return updateMockTestProgressFn({ data: params });
}

export async function completeMockTest(params: {
  testId: string;
  answers: unknown;
  timeSpentSeconds: number;
  score: number;
  percentage: number;
  correctCount: number;
  incorrectCount: number;
  unattemptedCount: number;
  subjectBreakdown: unknown;
}) {
  return completeMockTestFn({ data: params });
}

// ---------- offline-aware wrappers ----------

import {
  isOffline,
  savePracticeAttemptOffline,
  updatePracticeDayOffline,
  getPracticeSetOffline,
} from "./offline";

export async function savePracticeAttemptWithOffline(params: {
  practiceSetId: string;
  questionIndex: number;
  selectedIndex: number;
  isCorrect: boolean;
  timeTakenSeconds: number;
}) {
  if (isOffline()) {
    await savePracticeAttemptOffline(params);
    return;
  }
  try {
    await savePracticeAttempt(params);
  } catch (error) {
    console.error("Failed to save online, saving offline:", error);
    await savePracticeAttemptOffline(params);
  }
}

export async function updatePracticeDayWithOffline(date: string, solved: number, total: number) {
  if (isOffline()) {
    await updatePracticeDayOffline(date, solved, total);
    return;
  }
  try {
    await updatePracticeDay(date, solved, total);
  } catch (error) {
    console.error("Failed to update online, saving offline:", error);
    await updatePracticeDayOffline(date, solved, total);
  }
}

export async function getPracticeSetWithOffline(date: string) {
  if (!isOffline()) {
    try {
      const data = await getPracticeSetFn({ data: { date } });
      if (data) return data;
    } catch (error) {
      console.error("Failed to fetch online, trying offline:", error);
    }
  }
  return await getPracticeSetOffline(date);
}
