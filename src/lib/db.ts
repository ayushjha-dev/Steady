import Dexie, { type Table } from "dexie";

// Define interfaces for offline data storage
export interface OfflinePracticeSet {
  id: string;
  user_id: string;
  date: string;
  kind: "daily" | "topic" | "mock";
  questions: unknown;
  metadata?: Record<string, unknown>;
  synced: boolean;
  created_at: string;
  updated_at: string;
}

export interface OfflinePracticeAttempt {
  id?: number; // Auto-increment for local storage
  user_id: string;
  practice_set_id: string;
  question_index: number;
  selected_index: number;
  is_correct: boolean;
  time_taken_seconds: number;
  synced: boolean;
  created_at: string;
}

export interface OfflinePracticeDay {
  date: string; // Primary key
  user_id: string;
  solved: number;
  total: number;
  completed: boolean;
  synced: boolean;
  updated_at: string;
}

export interface OfflineTopicNote {
  id: string;
  user_id: string;
  topic_id: string;
  content: string;
  version: number;
  ai_generated: boolean;
  generated_at: string | null;
  last_edited_at: string | null;
  synced: boolean;
  created_at: string;
  updated_at: string;
}

export interface OfflineMockTest {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  test_type: "full" | "subject" | "custom";
  questions: unknown;
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
  answers: unknown;
  subject_breakdown: unknown;
  synced: boolean;
  created_at: string;
  updated_at: string;
}

export interface SyncQueueItem {
  id?: number; // Auto-increment
  table: string;
  operation: "insert" | "update" | "delete";
  data: unknown;
  remote_id?: string | undefined;
  attempts: number;
  last_attempt: string | null;
  error: string | null;
  created_at: string;
}

// Dexie database class
export class SteadyDB extends Dexie {
  practiceSets!: Table<OfflinePracticeSet, string>;
  practiceAttempts!: Table<OfflinePracticeAttempt, number>;
  practiceDays!: Table<OfflinePracticeDay, string>;
  topicNotes!: Table<OfflineTopicNote, string>;
  mockTests!: Table<OfflineMockTest, string>;
  syncQueue!: Table<SyncQueueItem, number>;

  constructor() {
    super("SteadyDB");

    this.version(1).stores({
      practiceSets: "id, user_id, date, kind, synced",
      practiceAttempts: "++id, user_id, practice_set_id, synced, created_at",
      practiceDays: "date, user_id, synced",
      topicNotes: "id, user_id, topic_id, synced",
      mockTests: "id, user_id, status, synced, created_at",
      syncQueue: "++id, table, operation, created_at, attempts",
    });
  }
}

// Create singleton instance
export const db = new SteadyDB();

// Helper to check if IndexedDB is available
export function isIndexedDBAvailable(): boolean {
  try {
    return typeof indexedDB !== "undefined";
  } catch {
    return false;
  }
}

// Helper to clear all offline data (useful for debugging or logout)
export async function clearOfflineData(): Promise<void> {
  if (!isIndexedDBAvailable()) return;

  await Promise.all([
    db.practiceSets.clear(),
    db.practiceAttempts.clear(),
    db.practiceDays.clear(),
    db.topicNotes.clear(),
    db.mockTests.clear(),
    db.syncQueue.clear(),
  ]);
}

// Helper to get storage usage stats
export async function getStorageStats() {
  if (!isIndexedDBAvailable()) {
    return {
      practiceSets: 0,
      practiceAttempts: 0,
      practiceDays: 0,
      topicNotes: 0,
      mockTests: 0,
      syncQueue: 0,
      total: 0,
    };
  }

  const counts = await Promise.all([
    db.practiceSets.count(),
    db.practiceAttempts.count(),
    db.practiceDays.count(),
    db.topicNotes.count(),
    db.mockTests.count(),
    db.syncQueue.count(),
  ]);

  return {
    practiceSets: counts[0],
    practiceAttempts: counts[1],
    practiceDays: counts[2],
    topicNotes: counts[3],
    mockTests: counts[4],
    syncQueue: counts[5],
    total: counts.reduce((a, b) => a + b, 0),
  };
}
