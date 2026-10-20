// Server-only data access. Every function takes an explicit userId and scopes
// all SQL to it (this is what RLS did on Supabase). Only called from
// server-function handlers — never from client components directly.
import { asBool, asJson, bit, db, migrate, newId, now, num, q, toJson } from "./db";

// ---------- auth ----------

export async function findUserByEmail(email: string) {
  await migrate();
  const c = await db();
  const rs = await c.execute(q({
    sql: "SELECT * FROM users WHERE email = ?",
    args: [email.toLowerCase().trim()],
  }));
  return rs.rows[0] ?? null;
}

export async function createUser(email: string, passwordHash: string) {
  await migrate();
  const c = await db();
  const id = newId();
  const created = now();
  await c.execute(q({
    sql: "INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)",
    args: [id, email.toLowerCase().trim(), passwordHash, created],
  }));
  await c.execute(q({
    sql: "INSERT INTO profiles (id, name, start_date, daily_target_minutes, plan_loaded, selected_subjects, created_at) VALUES (?, '', ?, 210, 0, '[]', ?)",
    args: [id, created.slice(0, 10), created],
  }));
  return { id, email: email.toLowerCase().trim() };
}

export async function createSession(userId: string, days = 30) {
  const c = await db();
  const token =
    [...globalThis.crypto.getRandomValues(new Uint8Array(32))]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  const created = now();
  const expires = new Date(Date.now() + days * 86400_000).toISOString();
  await c.execute(q({
    sql: "INSERT INTO sessions (token, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)",
    args: [token, userId, expires, created],
  }));
  return { token, expires };
}

export async function getSessionUser(token: string | null | undefined) {
  if (!token) return null;
  await migrate();
  const c = await db();
  const rs = await c.execute(q({
    sql: "SELECT s.user_id, s.expires_at, u.email FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?",
    args: [token],
  }));
  const row = rs.rows[0] as any;
  if (!row) return null;
  if (new Date(row.expires_at as string).getTime() < Date.now()) {
    await c.execute(q({ sql: "DELETE FROM sessions WHERE token = ?", args: [token] }));
    return null;
  }
  return { id: row.user_id as string, email: row.email as string };
}

export async function deleteSession(token: string) {
  const c = await db();
  await c.execute(q({ sql: "DELETE FROM sessions WHERE token = ?", args: [token] }));
}

// ---------- profiles ----------

export async function getProfile(userId: string) {
  await migrate();
  const c = await db();
  const rs = await c.execute(q({ sql: "SELECT * FROM profiles WHERE id = ?", args: [userId] }));
  let row = rs.rows[0] as any;
  if (!row) {
    const created = new Date().toISOString();
    await c.execute(q({
      sql: "INSERT INTO profiles (id, name, start_date, daily_target_minutes, plan_loaded, selected_subjects, created_at) VALUES (?, '', ?, 210, 0, '[]', ?)",
      args: [userId, created.slice(0, 10), created],
    }));
    const rs2 = await c.execute(q({ sql: "SELECT * FROM profiles WHERE id = ?", args: [userId] }));
    row = rs2.rows[0] as any;
  }
  if (!row) return null;
  return {
    ...row,
    plan_loaded: asBool(row.plan_loaded),
    selected_subjects: asJson<string[]>(row.selected_subjects, []),
  };
}

export async function updateProfile(
  userId: string,
  patch: Partial<{
    name: string;
    start_date: string;
    daily_target_minutes: number;
    plan_loaded: boolean;
    selected_subjects: string[];
  }>,
) {
  const c = await db();
  const sets: string[] = [];
  const args: unknown[] = [];
  if (patch.name !== undefined) {
    sets.push("name = ?");
    args.push(patch.name);
  }
  if (patch.start_date !== undefined) {
    sets.push("start_date = ?");
    args.push(patch.start_date);
  }
  if (patch.daily_target_minutes !== undefined) {
    sets.push("daily_target_minutes = ?");
    args.push(num(patch.daily_target_minutes));
  }
  if (patch.plan_loaded !== undefined) {
    sets.push("plan_loaded = ?");
    args.push(bit(patch.plan_loaded));
  }
  if (patch.selected_subjects !== undefined) {
    sets.push("selected_subjects = ?");
    args.push(toJson(patch.selected_subjects));
  }
  if (sets.length === 0) return getProfile(userId);
  args.push(userId);
  await c.execute(q({ sql: `UPDATE profiles SET ${sets.join(", ")} WHERE id = ?`, args }));
  return getProfile(userId);
}

// ---------- subjects tree ----------

export async function getSubjectsTree(userId: string) {
  const c = await db();
  const [s, sec, t] = await Promise.all([
    c.execute(q({
      sql: "SELECT * FROM subjects WHERE user_id = ? ORDER BY sort_order",
      args: [userId],
    })),
    c.execute(q({
      sql: "SELECT * FROM sections WHERE user_id = ? ORDER BY sort_order",
      args: [userId],
    })),
    c.execute(q({
      sql: "SELECT * FROM topics WHERE user_id = ? ORDER BY sort_order LIMIT 5000",
      args: [userId],
    })),
  ]);
  const mapTopic = (r: any) => ({
    ...r,
    resources: asJson(r.resources, []),
  });
  const mapSubject = (r: any) => ({ ...r, is_main: asBool(r.is_main) });
  return s.rows.map((subj: any) => ({
    ...mapSubject(subj),
    sections: sec.rows
      .filter((x: any) => x.subject_id === subj.id)
      .map((x: any) => ({
        ...x,
        topics: t.rows.filter((tp: any) => tp.section_id === x.id).map(mapTopic),
      })),
  }));
}

// ---------- tasks ----------

const mapTask = (r: any) => ({
  ...r,
  done: asBool(r.done),
  carried_over: asBool(r.carried_over),
  est_minutes: num(r.est_minutes),
  sort_order: num(r.sort_order),
});

export async function getTasks(userId: string) {
  const c = await db();
  const rs = await c.execute(q({
    sql: "SELECT * FROM tasks WHERE user_id = ? ORDER BY date, sort_order LIMIT 5000",
    args: [userId],
  }));
  return rs.rows.map(mapTask);
}

export async function updateTask(
  userId: string,
  id: string,
  patch: Record<string, unknown>,
) {
  const c = await db();
  const allowed = [
    "date",
    "subject_id",
    "title",
    "detail",
    "est_minutes",
    "done",
    "done_at",
    "carried_over",
    "notes",
    "sort_order",
  ] as const;
  const sets: string[] = [];
  const args: unknown[] = [];
  for (const k of allowed) {
    if (patch[k] !== undefined) {
      sets.push(`${k} = ?`);
      args.push(k === "done" || k === "carried_over" ? bit(patch[k]) : patch[k]);
    }
  }
  if (sets.length === 0) return;
  args.push(id, userId);
  await c.execute(q({
    sql: `UPDATE tasks SET ${sets.join(", ")} WHERE id = ? AND user_id = ?`,
    args,
  }));
}

export async function updateTopic(userId: string, id: string, patch: Record<string, unknown>) {
  const c = await db();
  const allowed = ["name", "status", "notes", "resources", "sort_order", "completed_at"] as const;
  const sets: string[] = [];
  const args: unknown[] = [];
  for (const k of allowed) {
    if (patch[k] !== undefined) {
      sets.push(`${k} = ?`);
      args.push(k === "resources" ? toJson(patch[k]) : patch[k]);
    }
  }
  if (sets.length === 0) return;
  args.push(id, userId);
  await c.execute(q({
    sql: `UPDATE topics SET ${sets.join(", ")} WHERE id = ? AND user_id = ?`,
    args,
  }));
}

export async function loadPlanRows(
  userId: string,
  profile: { name: string; startDate: string; dailyMinutes: number; selectedSubjects: string[] },
  curriculum: {
    key: string;
    name: string;
    tagline: string;
    is_main?: boolean | undefined;
    sections: [string, string[]][];
  }[],
  plan: {
    date: string;
    subject: string | null;
    title: string;
    detail: string;
    est_minutes: number;
    sort_order: number;
  }[],
) {
  const c = await db();
  type Stmt = { sql: string; args: unknown[] };
  const batch: Stmt[] = [];
  const flush = async () => {
    if (batch.length === 0) return;
    // libsql batch = one round trip; keeps remote Turso fast.
    await c.batch(batch.splice(0, batch.length) as any);
  };

  batch.push({ sql: "DELETE FROM tasks WHERE user_id = ?", args: [userId] });
  batch.push({ sql: "DELETE FROM subjects WHERE user_id = ?", args: [userId] });

  const subjByKey = new Map<string, string>();
  for (let i = 0; i < curriculum.length; i++) {
    const s = curriculum[i]!;
    const id = newId();
    subjByKey.set(s.key, id);
    batch.push({
      sql: "INSERT INTO subjects (id, user_id, key, name, tagline, color, is_main, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      args: [id, userId, s.key, s.name, s.tagline, s.key, bit(!!s.is_main), i],
    });
    for (let si = 0; si < s.sections.length; si++) {
      const [secName, topics] = s.sections[si]!;
      const secId = newId();
      batch.push({
        sql: "INSERT INTO sections (id, user_id, subject_id, name, sort_order) VALUES (?, ?, ?, ?, ?)",
        args: [secId, userId, id, secName, si],
      });
      for (let ti = 0; ti < topics.length; ti++) {
        batch.push({
          sql: "INSERT INTO topics (id, user_id, section_id, name, status, notes, resources, sort_order) VALUES (?, ?, ?, ?, 'not_started', '', '[]', ?)",
          args: [newId(), userId, secId, topics[ti], ti],
        });
      }
      if (batch.length >= 200) await flush();
    }
  }

  for (const p of plan) {
    batch.push({
      sql: "INSERT INTO tasks (id, user_id, date, subject_id, title, detail, est_minutes, done, done_at, carried_over, notes, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, 0, NULL, 0, '', ?)",
      args: [
        newId(),
        userId,
        p.date,
        p.subject ? (subjByKey.get(p.subject) ?? null) : null,
        p.title,
        p.detail,
        p.est_minutes,
        p.sort_order,
      ],
    });
    if (batch.length >= 200) await flush();
  }
  await flush();

  await updateProfile(userId, {
    name: profile.name,
    start_date: profile.startDate,
    daily_target_minutes: profile.dailyMinutes,
    plan_loaded: true,
    selected_subjects: profile.selectedSubjects,
  });
}

// ---------- practice ----------

const mapPracticeSet = (r: any) => ({
  ...r,
  questions: asJson(r.questions, []),
  metadata: r.metadata ? asJson(r.metadata, undefined) : undefined,
});

export async function getPracticeSet(userId: string, date: string, kind = "daily") {
  const c = await db();
  const rs = await c.execute(q({
    sql: "SELECT * FROM practice_sets WHERE user_id = ? AND date = ? AND kind = ?",
    args: [userId, date, kind],
  }));
  const row = rs.rows[0];
  return row ? mapPracticeSet(row) : null;
}

export async function createPracticeSetRow(
  userId: string,
  params: { date: string; kind: string; topicId?: string; questions: unknown; metadata?: unknown },
) {
  const c = await db();
  const id = newId();
  const generated = now();
  // Upsert on the (user, date, kind) key: "New questions" replaces the stored set
  // in place, keeping the same id so recorded attempts stay attached.
  await c.execute(q({
    sql: `INSERT INTO practice_sets (id, user_id, date, kind, topic_id, questions, metadata, generated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(user_id, date, kind) DO UPDATE SET
            topic_id = excluded.topic_id,
            questions = excluded.questions,
            metadata = excluded.metadata,
            generated_at = excluded.generated_at`,
    args: [
      id,
      userId,
      params.date,
      params.kind,
      params.topicId ?? null,
      toJson(params.questions),
      toJson(params.metadata),
      generated,
    ],
  }));
  const rs = await c.execute(q({
    sql: "SELECT * FROM practice_sets WHERE user_id = ? AND date = ? AND kind = ?",
    args: [userId, params.date, params.kind],
  }));
  return mapPracticeSet(rs.rows[0]);
}

export async function savePracticeAttemptRow(
  userId: string,
  params: {
    practiceSetId: string;
    questionIndex: number;
    selectedIndex: number;
    isCorrect: boolean;
    timeTakenSeconds: number;
  },
) {
  const c = await db();
  await c.execute(q({
    sql: "INSERT INTO practice_attempts (id, user_id, practice_set_id, question_index, selected_index, is_correct, time_taken_seconds, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    args: [
      newId(),
      userId,
      params.practiceSetId,
      num(params.questionIndex),
      num(params.selectedIndex),
      bit(params.isCorrect),
      num(params.timeTakenSeconds),
      now(),
    ],
  }));
}

const mapPracticeDay = (r: any) => ({
  ...r,
  total: num(r.total),
  solved: num(r.solved),
  completed: asBool(r.completed),
});

export async function getPracticeDay(userId: string, date: string) {
  const c = await db();
  const rs = await c.execute(q({
    sql: "SELECT * FROM practice_days WHERE user_id = ? AND date = ?",
    args: [userId, date],
  }));
  const row = rs.rows[0];
  return row ? mapPracticeDay(row) : null;
}

export async function upsertPracticeDay(
  userId: string,
  date: string,
  solved: number,
  total: number,
) {
  const c = await db();
  const completed = solved === total && total > 0 ? 1 : 0;
  await c.execute(q({
    sql: "INSERT INTO practice_days (user_id, date, total, solved, completed) VALUES (?, ?, ?, ?, ?) ON CONFLICT(user_id, date) DO UPDATE SET total = excluded.total, solved = excluded.solved, completed = excluded.completed",
    args: [userId, date, num(total), num(solved), completed],
  }));
}

export async function getCompletedPracticeDays(userId: string, limit = 365) {
  const c = await db();
  const rs = await c.execute(q({
    sql: "SELECT * FROM practice_days WHERE user_id = ? AND completed = 1 ORDER BY date DESC LIMIT ?",
    args: [userId, limit],
  }));
  return rs.rows.map(mapPracticeDay);
}

export async function getPracticeDaysSince(userId: string, startDate: string) {
  const c = await db();
  const rs = await c.execute(q({
    sql: "SELECT * FROM practice_days WHERE user_id = ? AND date >= ? ORDER BY date",
    args: [userId, startDate],
  }));
  return rs.rows.map(mapPracticeDay);
}

export async function getPracticeAttemptsSince(userId: string, createdSince: string) {
  const c = await db();
  const rs = await c.execute(q({
    sql: "SELECT * FROM practice_attempts WHERE user_id = ? AND created_at >= ?",
    args: [userId, createdSince],
  }));
  return rs.rows.map((r: any) => ({ ...r, is_correct: asBool(r.is_correct) }));
}

// ---------- topic notes ----------

const mapNote = (r: any) => ({ ...r, ai_generated: asBool(r.ai_generated) });

export async function getTopicNote(userId: string, topicId: string) {
  const c = await db();
  const rs = await c.execute(q({
    sql: "SELECT * FROM topic_notes WHERE user_id = ? AND topic_id = ?",
    args: [userId, topicId],
  }));
  const row = rs.rows[0];
  return row ? mapNote(row) : null;
}

export async function getTopicNoteVersions(userId: string, noteId: string) {
  const c = await db();
  const rs = await c.execute(q({
    sql: "SELECT * FROM topic_note_versions WHERE user_id = ? AND note_id = ? ORDER BY version DESC",
    args: [userId, noteId],
  }));
  return rs.rows;
}

export async function createTopicNoteRow(
  userId: string,
  params: { topicId: string; content: string; aiGenerated?: boolean | undefined },
) {
  const c = await db();
  const id = newId();
  const created = now();
  const ai = bit(params.aiGenerated ?? true);
  // Upsert: regenerating a topic (or two tabs generating at once) replaces the
  // existing note instead of tripping UNIQUE(user_id, topic_id).
  await c.execute(q({
    sql: `INSERT INTO topic_notes (id, user_id, topic_id, content, version, ai_generated, generated_at, last_edited_at, created_at, updated_at)
          VALUES (?, ?, ?, ?, 1, ?, ?, NULL, ?, ?)
          ON CONFLICT(user_id, topic_id) DO UPDATE SET
            content = excluded.content,
            version = topic_notes.version + 1,
            ai_generated = excluded.ai_generated,
            generated_at = excluded.generated_at,
            updated_at = excluded.updated_at`,
    args: [id, userId, params.topicId, params.content, ai, ai ? created : null, created, created],
  }));
  return getTopicNote(userId, params.topicId);
}

export async function updateTopicNoteRow(
  userId: string,
  params: { noteId: string; content: string; changeSummary?: string | undefined },
) {
  const c = await db();
  const cur = await c.execute(q({
    sql: "SELECT * FROM topic_notes WHERE id = ? AND user_id = ?",
    args: [params.noteId, userId],
  }));
  const current = cur.rows[0] as any;
  if (!current) throw new Error("Note not found");
  await c.execute(q({
    sql: "INSERT INTO topic_note_versions (id, note_id, user_id, version, content, change_summary, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    args: [newId(), params.noteId, userId, num(current.version, 1), current.content, params.changeSummary ?? null, now()],
  }));
  await c.execute(q({
    sql: "UPDATE topic_notes SET content = ?, version = ?, last_edited_at = ?, updated_at = ? WHERE id = ? AND user_id = ?",
    args: [params.content, num(current.version, 1) + 1, now(), now(), params.noteId, userId],
  }));
  const rs = await c.execute(q({
    sql: "SELECT * FROM topic_notes WHERE id = ? AND user_id = ?",
    args: [params.noteId, userId],
  }));
  return mapNote(rs.rows[0]);
}

export async function upsertTopicNoteRow(
  userId: string,
  params: {
    id?: string | undefined;
    topicId: string;
    content: string;
    version?: number | undefined;
    aiGenerated?: boolean | undefined;
    generatedAt?: string | null | undefined;
  },
) {
  const existing = await getTopicNote(userId, params.topicId);
  if (!existing) {
    return createTopicNoteRow(userId, {
      topicId: params.topicId,
      content: params.content,
      aiGenerated: params.aiGenerated,
    });
  }
  return updateTopicNoteRow(userId, {
    noteId: existing.id,
    content: params.content,
    changeSummary: "Offline sync",
  });
}

// ---------- mock tests ----------

const mapMockTest = (r: any) => ({
  ...r,
  questions: asJson(r.questions, []),
  answers: r.answers ? asJson(r.answers, null) : null,
  subject_breakdown: r.subject_breakdown ? asJson(r.subject_breakdown, null) : null,
  duration_minutes: num(r.duration_minutes),
  total_marks: num(r.total_marks),
  time_spent_seconds: num(r.time_spent_seconds),
  correct_count: num(r.correct_count),
  incorrect_count: num(r.incorrect_count),
  unattempted_count: num(r.unattempted_count),
});

export async function getMockTests(userId: string) {
  const c = await db();
  const rs = await c.execute(q({
    sql: "SELECT * FROM mock_tests WHERE user_id = ? ORDER BY created_at DESC",
    args: [userId],
  }));
  return rs.rows.map(mapMockTest);
}

export async function getMockTest(userId: string, testId: string) {
  const c = await db();
  const rs = await c.execute(q({
    sql: "SELECT * FROM mock_tests WHERE user_id = ? AND id = ?",
    args: [userId, testId],
  }));
  const row = rs.rows[0];
  return row ? mapMockTest(row) : null;
}

export async function createMockTestRow(
  userId: string,
  params: {
    title: string;
    description?: string | undefined;
    testType: string;
    questions: unknown;
    durationMinutes: number;
    totalMarks: number;
  },
) {
  const c = await db();
  const id = newId();
  const created = now();
  await c.execute(q({
    sql: "INSERT INTO mock_tests (id, user_id, title, description, test_type, questions, duration_minutes, total_marks, status, time_spent_seconds, correct_count, incorrect_count, unattempted_count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'not_started', 0, 0, 0, 0, ?, ?)",
    args: [
      id,
      userId,
      params.title,
      params.description ?? null,
      params.testType,
      toJson(params.questions),
      num(params.durationMinutes),
      num(params.totalMarks),
      created,
      created,
    ],
  }));
  return getMockTest(userId, id);
}

export async function updateMockTestRow(
  userId: string,
  testId: string,
  patch: Record<string, unknown>,
) {
  const c = await db();
  const allowed = [
    "status",
    "started_at",
    "completed_at",
    "answers",
    "time_spent_seconds",
    "score",
    "percentage",
    "correct_count",
    "incorrect_count",
    "unattempted_count",
    "subject_breakdown",
  ] as const;
  const sets = ["updated_at = ?"];
  const args: unknown[] = [now()];
  for (const k of allowed) {
    if (patch[k] !== undefined) {
      sets.push(`${k} = ?`);
      args.push(k === "answers" || k === "subject_breakdown" ? toJson(patch[k]) : patch[k]);
    }
  }
  args.push(testId, userId);
  await c.execute(q({
    sql: `UPDATE mock_tests SET ${sets.join(", ")} WHERE id = ? AND user_id = ?`,
    args,
  }));
  return getMockTest(userId, testId);
}
