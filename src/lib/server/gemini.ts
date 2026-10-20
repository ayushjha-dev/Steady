// Server-only Gemini access. Ported from supabase/functions/ai.
// The API key lives in server env (GEMINI_API_KEY) — never sent to the client.
import type { MCQ } from "../ai-types";

const GEMINI_API_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models";

// Model chain: primary first, then fallbacks behind it. Google's free tier
// returns transient 503 "high demand" spikes per model — rotate + retry.
// The lite models sit early as fallbacks: usually the most available.
const MODEL_CHAIN = [
  "gemini-3.7-flash",
  "gemini-flash-lite-latest",
  "gemini-3.1-flash-lite",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Rate limiting: 40 calls per hour per user (per server instance).
const RATE_LIMIT_WINDOW = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 40;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);
  if (!userLimit || now > userLimit.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }
  if (userLimit.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0 };
  }
  userLimit.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - userLimit.count };
}

function apiKey() {
  const key = process.env["GEMINI_API_KEY"];
  if (!key) throw new Error("GEMINI_API_KEY not configured");
  return key;
}

// Models sometimes wrap JSON in Markdown fences or lead-in prose — peel those
// layers before parsing so a good answer isn't discarded.
function parseModelJson(raw: string): any {
  let t = raw.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = (fence[1] ?? "").trim();
  try {
    return JSON.parse(t);
  } catch (orig) {
    // Last resort: slice from the first structural brace to its matching close.
    const start = t.search(/[[{]/);
    if (start < 0) throw orig;
    const end = t.lastIndexOf(t.charAt(start) === "[" ? "]" : "}");
    if (end <= start) throw orig;
    return JSON.parse(t.slice(start, end + 1));
  }
}

async function callGemini(prompt: string, schema?: object): Promise<any> {
  const requestBody: any = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 16384,
      // With a schema, force JSON output matching it — otherwise thinking models
      // intermittently return a bare array or prose-wrapped JSON instead of the
      // { questions: [...] } / verdict shape the callers expect.
      ...(schema ? { responseMimeType: "application/json", responseSchema: schema } : {}),
    },
  };
  let lastError: unknown;
  // Retry transient failures (503 spikes, 429, network blips, truncated JSON)
  // across the model chain; hard errors (bad key, 4xx) throw immediately.
  for (let attempt = 0; attempt < MODEL_CHAIN.length + 2; attempt++) {
    const model = MODEL_CHAIN[attempt % MODEL_CHAIN.length];
    let response: Response;
    try {
      response = await fetch(`${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        // A loaded model can hang without responding — treat that as a retry.
        signal: AbortSignal.timeout(35_000),
      });
    } catch (err) {
      lastError = err;
      await sleep(Math.min(1000 * (attempt + 1), 5000));
      continue;
    }
    if (!response.ok) {
      const error = await response.text();
      const retryable = response.status === 429 || response.status >= 500;
      console.error(`Gemini API error (${model}, ${response.status}${retryable ? ", retrying" : ""}):`, error);
      if (!retryable) throw new Error(`Gemini API error: ${response.status}`);
      lastError = new Error(`Gemini API error: ${response.status}`);
      await sleep(Math.min(1000 * (attempt + 1), 5000));
      continue;
    }
    const data = await response.json();
    // 3.x models can prepend thinking-summary parts — take the first real text part.
    const text = (data.candidates?.[0]?.content?.parts ?? [])
      .map((p: any) => (p.text && !p.thought ? p.text : ""))
      .join("");
    if (!text) {
      lastError = new Error("No response from Gemini");
      continue;
    }
    if (!schema) return text;
    try {
      return parseModelJson(text);
    } catch (err) {
      // Truncated/invalid JSON — worth one more pass.
      console.error("Gemini JSON parse failed:", String(err).slice(0, 160), "| text head:", text.slice(0, 120));
      lastError = err;
      await sleep(500);
    }
  }
  throw lastError ?? new Error("No response from Gemini");
}

export type AiTask =
  | { task: "notes"; topic: string; subject: string }
  | { task: "daily_practice"; topics?: string[]; count?: number }
  | { task: "topic_practice"; topic: string; count: number }
  | { task: "mock_test"; subject: string; mcqCount: number; topicScope?: string[] }
  | { task: "check_code"; code: string; problem: string; language: string };

export async function runAiTask(input: AiTask): Promise<unknown> {
  switch (input.task) {
    case "notes": {
      const prompt = `You are a calm, beginner-friendly tutor helping a student prepare for SDE and Cybersecurity placements.

Generate detailed study notes for the topic "${input.topic}" in the subject "${input.subject}".

The learner is a complete beginner. Use Python for code examples. Be clear and unambiguous.

Structure the notes with these sections:
1. Overview (what and why, in plain language)
2. Why it matters in interviews
3. Core concepts (step by step, use ASCII diagrams or tables where helpful)
4. Key terms (table format)
5. Worked examples with code (Python), include time/space complexity
6. Common mistakes and edge cases
7. Interview Q&A (8-10 questions with short answers)
8. 60-second revision cheat sheet
9. What to practice next (topic names only, no URLs)

Return ONLY the markdown content, no preamble.`;
      return callGemini(prompt);
    }
    case "daily_practice": {
      const topics = input.topics?.length ? input.topics : ["general aptitude and fundamentals"];
      const count = input.count ?? 10;
      const schema = mcqSchema();
      const prompt = `Generate ${count} multiple-choice practice questions on these topics: ${topics.join(", ")}.

Requirements:
- Mix of easy, medium, hard
- Python language where applicable
- Unambiguous with exactly ONE correct answer
- 1-2 sentence explanation
- Test understanding, not memorization
- Set the "topic" field of each question to the most relevant of: ${topics.join(", ")}

Return valid JSON.`;
      const out = (await callGemini(prompt, schema)) as { questions: MCQ[] };
      return { questions: out.questions ?? [] };
    }
    case "topic_practice": {
      const prompt = `Generate ${input.count} multiple-choice practice questions on "${input.topic}" for a beginner preparing for SDE/Cybersecurity placements.

Requirements:
- Mix of easy, medium, hard
- Python language where applicable
- Unambiguous with exactly ONE correct answer
- 1-2 sentence explanation
- Test understanding, not memorization

Return valid JSON.`;
      const out = (await callGemini(prompt, mcqSchema())) as { questions: MCQ[] };
      return { questions: out.questions ?? [] };
    }
    case "mock_test": {
      const mcqCount = input.mcqCount;
      const scopeText = input.topicScope?.length
        ? `Focus on these topics: ${input.topicScope.join(", ")}`
        : `Cover the full ${input.subject} curriculum`;
      const prompt = `Generate a mock test with ${mcqCount} MCQs for ${input.subject}.

${scopeText}

Difficulty distribution: 10 easy, ${Math.floor(mcqCount * 0.47)} medium, ${Math.ceil(mcqCount * 0.2)} hard
Beginner level, Python where applicable
Unambiguous questions, exactly ONE correct answer each
Brief explanations

Return valid JSON.`;
      const out = (await callGemini(prompt, mcqSchema())) as { questions: MCQ[] };
      return { questions: out.questions ?? [] };
    }
    case "check_code": {
      const schema = {
        type: "object",
        properties: {
          verdict: { type: "string", enum: ["Correct", "Partly correct", "Needs work"] },
          score: { type: "number", minimum: 0, maximum: 10 },
          test_cases: {
            type: "array",
            items: {
              type: "object",
              properties: {
                input: { type: "string" },
                expected: { type: "string" },
                result: { type: "string" },
                pass: { type: "boolean" },
              },
              required: ["input", "expected", "result", "pass"],
            },
          },
          complexity: {
            type: "object",
            properties: { time: { type: "string" }, space: { type: "string" } },
            required: ["time", "space"],
          },
          issues: { type: "array", items: { type: "string" } },
          improved_solution: { type: "string" },
          hint: { type: "string" },
        },
        required: [
          "verdict",
          "score",
          "test_cases",
          "complexity",
          "issues",
          "improved_solution",
          "hint",
        ],
      };
      const prompt = `Review this ${input.language} code for the problem: "${input.problem}"

\`\`\`${input.language}
${input.code}
\`\`\`

Mentally evaluate the code (do NOT execute it). Provide:
1. Verdict: Correct / Partly correct / Needs work
2. Score out of 10
3. 4-5 test cases you evaluated mentally (input, expected, result, pass/fail)
4. Time and space complexity
5. Issues or edge cases missed
6. An improved/optimal solution (collapsed in UI)
7. One helpful hint

Return valid JSON. Be honest and educational.`;
      return callGemini(prompt, schema);
    }
  }
}

function mcqSchema() {
  return {
    type: "object",
    properties: {
      questions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            topic: { type: "string" },
            difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
            question: { type: "string" },
            options: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 4 },
            correct_index: { type: "integer", minimum: 0, maximum: 3 },
            explanation: { type: "string" },
          },
          required: [
            "id",
            "topic",
            "difficulty",
            "question",
            "options",
            "correct_index",
            "explanation",
          ],
        },
      },
    },
    required: ["questions"],
  };
}
