// Shared AI DTOs. Imported by both client code and the server Gemini module
// (no runtime imports here, so it is safe everywhere).

export interface MCQ {
  id: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  question: string;
  options: [string, string, string, string];
  correct_index: number;
  explanation: string;
}

export interface CodingQuestion {
  id: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  title: string;
  statement: string;
  examples: Array<{ input: string; output: string; explanation?: string }>;
  constraints: string[];
  starter_code: string;
  language: string;
}

export interface CodeCheckResult {
  verdict: "Correct" | "Partly correct" | "Needs work";
  score: number;
  test_cases: Array<{
    input: string;
    expected: string;
    result: string;
    pass: boolean;
  }>;
  complexity: { time: string; space: string };
  issues: string[];
  improved_solution: string;
  hint: string;
}

export interface AIResponse<T> {
  data?: T;
  error?: string;
  remaining?: number;
}
