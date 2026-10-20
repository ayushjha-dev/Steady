import { db, isIndexedDBAvailable, type SyncQueueItem } from "./db";
import { getViewerFn } from "./auth";

// { id } of the signed-in viewer, or null when signed out / unreachable
// (e.g. offline — the server session can't be checked without a connection).
async function currentUser(): Promise<{ id: string } | null> {
  try {
    const { viewer } = await getViewerFn();
    return viewer ? { id: viewer.id } : null;
  } catch {
    return null;
  }
}

// Check if we're offline
export function isOffline(): boolean {
  return !navigator.onLine;
}

// Save practice attempt offline
export async function savePracticeAttemptOffline(params: {
  practiceSetId: string;
  questionIndex: number;
  selectedIndex: number;
  isCorrect: boolean;
  timeTakenSeconds: number;
}) {
  if (!isIndexedDBAvailable()) return;

  const user = await currentUser();
  if (!user) return;

  const attempt = {
    user_id: user.id,
    practice_set_id: params.practiceSetId,
    question_index: params.questionIndex,
    selected_index: params.selectedIndex,
    is_correct: params.isCorrect,
    time_taken_seconds: params.timeTakenSeconds,
    synced: false,
    created_at: new Date().toISOString(),
  };

  // Save to IndexedDB
  await db.practiceAttempts.add(attempt);

  // Add to sync queue
  await addToSyncQueue("practice_attempts", "insert", attempt);
}

// Update practice day offline
export async function updatePracticeDayOffline(date: string, solved: number, total: number) {
  if (!isIndexedDBAvailable()) return;

  const user = await currentUser();
  if (!user) return;

  const completed = solved === total && total > 0;

  const day = {
    date,
    user_id: user.id,
    solved,
    total,
    completed,
    synced: false,
    updated_at: new Date().toISOString(),
  };

  // Upsert to IndexedDB
  await db.practiceDays.put(day);

  // Add to sync queue
  await addToSyncQueue("practice_days", "update", day);
}

// Save practice set offline
export async function savePracticeSetOffline(practiceSet: {
  id: string;
  date: string;
  kind: "daily" | "topic" | "mock";
  questions: unknown;
  metadata?: Record<string, unknown>;
}) {
  if (!isIndexedDBAvailable()) return;

  const user = await currentUser();
  if (!user) return;

  const set = {
    ...practiceSet,
    user_id: user.id,
    synced: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  await db.practiceSets.put(set);
}

// Get practice set from offline storage
export async function getPracticeSetOffline(date: string) {
  if (!isIndexedDBAvailable()) return null;

  const user = await currentUser();
  if (!user) return null;

  return await db.practiceSets.where({ user_id: user.id, date, kind: "daily" }).first();
}

// Save topic note offline
export async function saveTopicNoteOffline(note: {
  id: string;
  topicId: string;
  content: string;
  aiGenerated: boolean;
}) {
  if (!isIndexedDBAvailable()) return;

  const user = await currentUser();
  if (!user) return;

  const now = new Date().toISOString();

  const offlineNote = {
    id: note.id,
    user_id: user.id,
    topic_id: note.topicId,
    content: note.content,
    version: 1,
    ai_generated: note.aiGenerated,
    generated_at: note.aiGenerated ? now : null,
    last_edited_at: null,
    synced: false,
    created_at: now,
    updated_at: now,
  };

  await db.topicNotes.put(offlineNote);
  await addToSyncQueue("topic_notes", "insert", offlineNote);
}

// Get topic note from offline storage
export async function getTopicNoteOffline(topicId: string) {
  if (!isIndexedDBAvailable()) return null;

  const user = await currentUser();
  if (!user) return null;

  return await db.topicNotes.where({ user_id: user.id, topic_id: topicId }).first();
}

// Save mock test progress offline
export async function saveMockTestOffline(test: Partial<any>) {
  if (!isIndexedDBAvailable()) return;

  const user = await currentUser();
  if (!user) return;

  const offlineTest = {
    ...test,
    user_id: user.id,
    synced: false,
    updated_at: new Date().toISOString(),
  };

  await db.mockTests.put(offlineTest as any);
  await addToSyncQueue("mock_tests", "update", offlineTest);
}

// Add item to sync queue
export async function addToSyncQueue(
  table: string,
  operation: "insert" | "update" | "delete",
  data: unknown,
  remoteId?: string,
) {
  if (!isIndexedDBAvailable()) return;

  const item: SyncQueueItem = {
    table,
    operation,
    data,
    remote_id: remoteId,
    attempts: 0,
    last_attempt: null,
    error: null,
    created_at: new Date().toISOString(),
  };

  await db.syncQueue.add(item);
}

// Get unsynced items count
export async function getUnsyncedCount(): Promise<number> {
  if (!isIndexedDBAvailable()) return 0;

  const counts = await Promise.all([
    db.practiceSets.where("synced").equals(0).count(),
    db.practiceAttempts.where("synced").equals(0).count(),
    db.practiceDays.where("synced").equals(0).count(),
    db.topicNotes.where("synced").equals(0).count(),
    db.mockTests.where("synced").equals(0).count(),
  ]);

  return counts.reduce((a, b) => a + b, 0);
}

// Sync all pending items
export async function syncOfflineData(): Promise<{
  success: number;
  failed: number;
  errors: string[];
}> {
  if (!isIndexedDBAvailable() || isOffline()) {
    return { success: 0, failed: 0, errors: ["Offline or IndexedDB unavailable"] };
  }

  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  // Get all pending sync items
  const queueItems = await db.syncQueue.orderBy("created_at").toArray();

  for (const item of queueItems) {
    try {
      // Attempt to sync based on table and operation
      if (item.table === "practice_attempts" && item.operation === "insert") {
        const data = item.data as any;
        const { savePracticeAttempt } = await import("./data");
        await savePracticeAttempt({
          practiceSetId: data.practice_set_id,
          questionIndex: data.question_index,
          selectedIndex: data.selected_index,
          isCorrect: data.is_correct,
          timeTakenSeconds: data.time_taken_seconds,
        });

        // Mark as synced in IndexedDB
        if (item.id) {
          await db.practiceAttempts
            .where({ practice_set_id: data.practice_set_id, question_index: data.question_index })
            .modify({ synced: true });
        }
      } else if (item.table === "practice_days" && item.operation === "update") {
        const data = item.data as any;
        const { updatePracticeDay } = await import("./data");
        await updatePracticeDay(data.date, data.solved, data.total);

        await db.practiceDays.where("date").equals(data.date).modify({ synced: true });
      } else if (item.table === "topic_notes") {
        const data = item.data as any;
        const { upsertTopicNote } = await import("./data");
        await upsertTopicNote({
          id: data.id,
          topicId: data.topic_id,
          content: data.content,
          version: data.version,
          aiGenerated: data.ai_generated,
          generatedAt: data.generated_at,
        });

        await db.topicNotes.where("id").equals(data.id).modify({ synced: true });
      }

      // Remove from queue
      if (item.id) {
        await db.syncQueue.delete(item.id);
      }
      success++;
    } catch (error) {
      failed++;
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      errors.push(`${item.table}: ${errorMsg}`);

      // Update attempt count
      if (item.id) {
        await db.syncQueue.update(item.id, {
          attempts: item.attempts + 1,
          last_attempt: new Date().toISOString(),
          error: errorMsg,
        });
      }
    }
  }

  return { success, failed, errors };
}

// Auto-sync when coming back online
export function setupAutoSync() {
  window.addEventListener("online", async () => {
    console.log("Back online, syncing data...");
    const result = await syncOfflineData();
    console.log("Sync complete:", result);
  });
}
