import { createServerFn } from "@tanstack/react-start";
import { getViewerFn } from "./auth";

export type { MCQ, CodingQuestion, CodeCheckResult, AIResponse } from "./ai-types";
import type { AIResponse, CodeCheckResult, MCQ } from "./ai-types";

export interface AICallOptions {
  task: "notes" | "daily_practice" | "topic_practice" | "mock_test" | "check_code";
  [key: string]: any;
}

const aiFn = createServerFn({ method: "POST" })
  .validator((d: unknown) => d as AICallOptions)
  .handler(async (ctx) => {
    const data = ctx.data;
    const { viewer } = await getViewerFn();
    if (!viewer) throw new Error("Not signed in");
    const { checkRateLimit, runAiTask } = await import("./server/gemini");
    const rateLimit = checkRateLimit(viewer.id);
  if (!rateLimit.allowed) {
    return {
      data: null as any,
      error: "You've reached the limit for now. Take a breath, try again in an hour." as string | null,
      remaining: 0,
    };
  }
  try {
    const { task, ...params } = data;
    const result = await runAiTask({ task, ...params } as import("./server/gemini").AiTask);
    return { data: result as any, error: null as string | null, remaining: rateLimit.remaining };
  } catch (err) {
    console.error("AI call failed:", err);
    return {
      data: null as any,
      error: (err instanceof Error ? err.message : "Couldn't reach the AI. Try again.") as string | null,
      remaining: undefined as number | undefined,
    };
  }
});

export async function callAI<T>(options: AICallOptions): Promise<AIResponse<T>> {
  try {
    const res = await aiFn({ data: options });
    if (res.error) return { error: res.error };
    const out: AIResponse<T> = { data: res.data as T };
    if (res.remaining !== undefined) out.remaining = res.remaining;
    return out;
  } catch (err) {
    console.error("AI call failed:", err);
    return {
      error: err instanceof Error ? err.message : "Couldn't reach the AI. Try again.",
    };
  }
}

// Convenience functions for each task type

export async function generateTopicNotes(
  topic: string,
  subject: string,
): Promise<AIResponse<string>> {
  return callAI<string>({
    task: "notes",
    topic,
    subject,
  });
}

export async function generateDailyPractice(
  topics?: string[],
  count?: number,
  excludeQuestions?: string[],
): Promise<AIResponse<{ questions: MCQ[] }>> {
  return callAI<{ questions: MCQ[] }>({
    task: "daily_practice",
    topics: topics || [],
    count: count || 10,
    excludeQuestions: excludeQuestions || [],
  });
}

export async function generateTopicPractice(
  topic: string,
  count: number,
): Promise<AIResponse<{ questions: MCQ[] }>> {
  return callAI<{ questions: MCQ[] }>({
    task: "topic_practice",
    topic,
    count,
  });
}

export async function generateMockTest(
  subject: string,
  mcqCount: number,
  topicScope?: string[],
): Promise<AIResponse<{ questions: MCQ[] }>> {
  return callAI<{ questions: MCQ[] }>({
    task: "mock_test",
    subject,
    mcqCount,
    topicScope,
  });
}

export async function checkCode(
  code: string,
  problem: string,
  language: string,
): Promise<AIResponse<CodeCheckResult>> {
  return callAI<CodeCheckResult>({
    task: "check_code",
    code,
    problem,
    language,
  });
}
