import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Award, CheckCircle2, Clock, Target, TrendingUp, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CalmError, Shimmer } from "@/components/steady/kit";
import { useMockTest } from "@/lib/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/mock-test/$testId/results")({
  head: () => ({
    meta: [
      { title: "Test Results — Steady" },
      { name: "description", content: "Your mock test results and analysis" },
    ],
  }),
  component: ResultsPage,
});

interface Question {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  subject?: string;
}

function ResultsPage() {
  const { testId } = Route.useParams();
  const { data: test, isLoading, isError } = useMockTest(testId);

  if (isError) return <CalmError />;
  if (isLoading) return <Shimmer className="h-96" />;
  if (!test || test.status !== "completed") {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Results not available</p>
        <Button className="mt-4 rounded-xl" asChild>
          <Link to="/mock-tests">Back to Mock Tests</Link>
        </Button>
      </Card>
    );
  }

  const questions = test.questions as Question[];
  const answers = (test.answers || []) as Array<{
    questionIndex: number;
    selectedIndex: number;
    isCorrect: boolean;
  }>;
  const subjectBreakdown = (test.subject_breakdown || {}) as Record<
    string,
    { correct: number; total: number }
  >;

  const timeSpent = test.time_spent_seconds || 0;
  const avgTimePerQuestion = Math.round(timeSpent / questions.length);

  // Calculate performance rating
  const percentage = test.percentage || 0;
  let rating: { label: string; color: string; message: string };
  if (percentage >= 90) {
    rating = {
      label: "Outstanding",
      color: "text-primary",
      message: "Excellent work! You've mastered this material.",
    };
  } else if (percentage >= 75) {
    rating = {
      label: "Very Good",
      color: "text-primary",
      message: "Great performance! Keep up the good work.",
    };
  } else if (percentage >= 60) {
    rating = {
      label: "Good",
      color: "text-sand",
      message: "Solid effort. Review weak areas to improve further.",
    };
  } else if (percentage >= 40) {
    rating = {
      label: "Fair",
      color: "text-sand",
      message: "You're making progress. Focus on key topics.",
    };
  } else {
    rating = {
      label: "Needs Improvement",
      color: "text-clay",
      message: "Don't worry. Review the material and try again.",
    };
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <Link
        to="/mock-tests"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to Mock Tests
      </Link>

      {/* Score Card */}
      <Card className="relative overflow-hidden p-8 text-center">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            background: `radial-gradient(circle at 50% 0%, ${percentage >= 75 ? "var(--color-primary)" : percentage >= 50 ? "var(--color-sand)" : "var(--color-clay)"}, transparent 70%)`,
          }}
        />
        <div className="relative">
          <div className="mb-4 flex justify-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-primary-tint">
              <Award className="size-8 text-primary" />
            </div>
          </div>
          <h1 className="mb-2 text-[32px] font-medium text-foreground">{test.title}</h1>
          <p className={cn("mb-6 text-lg font-medium", rating.color)}>{rating.label}</p>
          <div className="mb-2 flex items-baseline justify-center gap-2">
            <span className="num text-6xl font-semibold text-foreground">{test.score}</span>
            <span className="num text-3xl text-muted-foreground">/ {test.total_marks}</span>
          </div>
          <p className="num mb-6 text-2xl font-medium text-primary">{percentage.toFixed(1)}%</p>
          <p className="text-muted-foreground">{rating.message}</p>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary-tint">
              <CheckCircle2 className="size-5 text-primary" />
            </div>
            <div>
              <div className="num text-2xl font-semibold text-foreground">{test.correct_count}</div>
              <p className="text-xs text-muted-foreground">Correct</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-clay-tint">
              <XCircle className="size-5 text-clay" />
            </div>
            <div>
              <div className="num text-2xl font-semibold text-foreground">
                {test.incorrect_count}
              </div>
              <p className="text-xs text-muted-foreground">Incorrect</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-surface-2">
              <Target className="size-5 text-muted-foreground" />
            </div>
            <div>
              <div className="num text-2xl font-semibold text-foreground">
                {test.unattempted_count}
              </div>
              <p className="text-xs text-muted-foreground">Unattempted</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-surface-2">
              <Clock className="size-5 text-muted-foreground" />
            </div>
            <div>
              <div className="num text-2xl font-semibold text-foreground">
                {Math.floor(timeSpent / 60)}:{String(timeSpent % 60).padStart(2, "0")}
              </div>
              <p className="text-xs text-muted-foreground">Time taken</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Subject-wise Performance */}
      {Object.keys(subjectBreakdown).length > 0 && (
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="size-5 text-primary" />
            <h2 className="text-lg font-medium text-foreground">Subject-wise Performance</h2>
          </div>
          <div className="space-y-4">
            {Object.entries(subjectBreakdown)
              .sort(([, a], [, b]) => b.correct / b.total - a.correct / a.total)
              .map(([subject, { correct, total }]) => {
                const pct = (correct / total) * 100;
                return (
                  <div key={subject}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">{subject}</span>
                      <span className="num text-muted-foreground">
                        {correct}/{total} ({pct.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          pct >= 75 ? "bg-primary" : pct >= 50 ? "bg-sand" : "bg-clay",
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </Card>
      )}

      {/* Question-wise Analysis */}
      <Card className="p-6">
        <h2 className="mb-4 text-lg font-medium text-foreground">Question-wise Analysis</h2>
        <div className="space-y-4">
          {questions.map((q, i) => {
            const answer = answers.find((a) => a.questionIndex === i);
            const isCorrect = answer?.isCorrect ?? false;
            const wasAttempted = answer !== undefined;

            return (
              <div
                key={i}
                className={cn(
                  "rounded-xl border-2 p-4",
                  isCorrect && "border-primary/20 bg-primary-tint/50",
                  !isCorrect && wasAttempted && "border-clay/20 bg-clay-tint/50",
                  !wasAttempted && "border-border bg-surface-2/50",
                )}
              >
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        Question {i + 1}
                      </span>
                      {q.difficulty && (
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-medium",
                            q.difficulty === "easy" && "bg-primary-tint text-primary-deep",
                            q.difficulty === "medium" && "bg-sand/30 text-sand",
                            q.difficulty === "hard" && "bg-clay-tint text-clay",
                          )}
                        >
                          {q.difficulty}
                        </span>
                      )}
                      {q.subject && (
                        <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-muted-foreground">
                          {q.subject}
                        </span>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed text-foreground">{q.question}</p>
                  </div>
                  <div
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-full",
                      isCorrect && "bg-primary text-primary-foreground",
                      !isCorrect && wasAttempted && "bg-clay text-white",
                      !wasAttempted && "bg-muted text-muted-foreground",
                    )}
                  >
                    {isCorrect ? (
                      <CheckCircle2 className="size-5" />
                    ) : wasAttempted ? (
                      <XCircle className="size-5" />
                    ) : (
                      <span className="text-xs font-medium">—</span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  {q.options.map((option, optIdx) => {
                    const isUserAnswer = answer?.selectedIndex === optIdx;
                    const isCorrectAnswer = q.correct_index === optIdx;

                    return (
                      <div
                        key={optIdx}
                        className={cn(
                          "rounded-lg border p-3 text-sm",
                          isCorrectAnswer && "border-primary/40 bg-primary-tint",
                          isUserAnswer && !isCorrectAnswer && "border-clay/40 bg-clay-tint",
                          !isCorrectAnswer && !isUserAnswer && "border-border/60 bg-surface",
                        )}
                      >
                        <div className="flex items-center gap-2">
                          {isCorrectAnswer && (
                            <CheckCircle2 className="size-4 shrink-0 text-primary" />
                          )}
                          {isUserAnswer && !isCorrectAnswer && (
                            <XCircle className="size-4 shrink-0 text-clay" />
                          )}
                          <span
                            className={cn(
                              isCorrectAnswer && "font-medium text-primary-deep",
                              isUserAnswer && !isCorrectAnswer && "text-clay",
                            )}
                          >
                            {option}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {q.explanation && (wasAttempted || isCorrect) && (
                  <div className="mt-3 rounded-lg bg-surface p-3">
                    <p className="mb-1 text-xs font-medium text-muted-foreground">Explanation</p>
                    <p className="text-sm leading-relaxed text-foreground">{q.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button className="rounded-xl" asChild>
          <Link to="/mock-tests">Back to Mock Tests</Link>
        </Button>
        <Button variant="outline" className="rounded-xl" asChild>
          <Link to="/subjects">Review Topics</Link>
        </Button>
      </div>
    </div>
  );
}
