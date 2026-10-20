import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CalmError, Shimmer } from "@/components/steady/kit";
import {
  useMockTest,
  startMockTest,
  updateMockTestProgress,
  completeMockTest,
  type MockTest,
} from "@/lib/data";
import { cn } from "@/lib/utils";
import { Check, ChevronLeft, ChevronRight, Clock, Grid3x3, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/mock-test/$testId")({
  head: () => ({
    meta: [
      { title: "Mock Test — Steady" },
      { name: "description", content: "Full-length timed mock test" },
    ],
  }),
  component: MockTestPage,
});

interface Question {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  subject?: string;
}

function MockTestPage() {
  const { testId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: test, isLoading, isError } = useMockTest(testId);

  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<number, number>>(new Map());
  const [timeLeft, setTimeLeft] = useState(0);
  const [showPalette, setShowPalette] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  useEffect(() => {
    if (test?.status === "in_progress") {
      setStarted(true);
      const elapsed = test.time_spent_seconds || 0;
      setTimeLeft(Math.max(0, test.duration_minutes * 60 - elapsed));

      // Restore answers
      if (test.answers) {
        const answerMap = new Map();
        (test.answers as Array<{ questionIndex: number; selectedIndex: number }>).forEach((a) => {
          answerMap.set(a.questionIndex, a.selectedIndex);
        });
        setAnswers(answerMap);
      }
    } else if (test?.status === "not_started") {
      setTimeLeft(test.duration_minutes * 60);
    }
  }, [test]);

  // Timer countdown
  useEffect(() => {
    if (!started || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          handleSubmit(true); // Auto-submit when time runs out
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [started, timeLeft]);

  // Auto-save progress every 30 seconds
  useEffect(() => {
    if (!started || !test) return;

    const interval = setInterval(async () => {
      const answersArray = Array.from(answers.entries()).map(([questionIndex, selectedIndex]) => ({
        questionIndex,
        selectedIndex,
      }));
      await updateMockTestProgress({
        testId: test.id,
        answers: answersArray,
        timeSpentSeconds: test.duration_minutes * 60 - timeLeft,
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [started, test, answers, timeLeft]);

  const handleStart = async () => {
    if (!test) return;
    await startMockTest(test.id);
    qc.invalidateQueries({ queryKey: ["mock_test", testId] });
    setStarted(true);
  };

  const handleAnswer = (optionIndex: number) => {
    setAnswers(new Map(answers).set(currentIndex, optionIndex));
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (!test) return;

    const questions = test.questions as Question[];
    const answersArray = Array.from(answers.entries()).map(([questionIndex, selectedIndex]) => ({
      questionIndex,
      selectedIndex,
      isCorrect: questions[questionIndex]?.correct_index === selectedIndex,
    }));

    let correctCount = 0;
    let incorrectCount = 0;
    const unattemptedCount = questions.length - answers.size;

    answersArray.forEach((a) => {
      if (a.isCorrect) correctCount++;
      else incorrectCount++;
    });

    const score = correctCount;
    const percentage = (score / questions.length) * 100;

    // Calculate subject breakdown
    const subjectBreakdown: Record<string, { correct: number; total: number }> = {};
    questions.forEach((q, i) => {
      const subject = q.subject || "General";
      if (!subjectBreakdown[subject]) {
        subjectBreakdown[subject] = { correct: 0, total: 0 };
      }
      subjectBreakdown[subject].total++;
      const answer = answersArray.find((a) => a.questionIndex === i);
      if (answer?.isCorrect) {
        subjectBreakdown[subject].correct++;
      }
    });

    await completeMockTest({
      testId: test.id,
      answers: answersArray,
      timeSpentSeconds: test.duration_minutes * 60 - timeLeft,
      score,
      percentage,
      correctCount,
      incorrectCount,
      unattemptedCount,
      subjectBreakdown,
    });

    qc.invalidateQueries({ queryKey: ["mock_test", testId] });
    qc.invalidateQueries({ queryKey: ["mock_tests"] });

    navigate({ to: "/mock-test/$testId/results", params: { testId: test.id } });
  };

  if (isError) return <CalmError />;
  if (isLoading) return <Shimmer className="h-96" />;
  if (!test) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Test not found</p>
        <Button className="mt-4 rounded-xl" onClick={() => navigate({ to: "/mock-tests" })}>
          Back to Mock Tests
        </Button>
      </Card>
    );
  }

  if (test.status === "completed") {
    navigate({ to: "/mock-test/$testId/results", params: { testId: test.id } });
    return null;
  }

  const questions = test.questions as Question[];

  if (!started) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Card className="p-8">
          <h1 className="mb-4 text-[28px] font-medium text-foreground">{test.title}</h1>
          {test.description && <p className="mb-6 text-muted-foreground">{test.description}</p>}

          <div className="mb-6 space-y-3 rounded-xl bg-surface-2 p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Questions</span>
              <span className="num text-lg font-semibold text-foreground">{questions.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Duration</span>
              <span className="num text-lg font-semibold text-foreground">
                {test.duration_minutes} minutes
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Marks</span>
              <span className="num text-lg font-semibold text-foreground">{test.total_marks}</span>
            </div>
          </div>

          <div className="mb-6 rounded-xl bg-primary-tint p-4">
            <h3 className="mb-2 text-sm font-medium text-primary-deep">Instructions</h3>
            <ul className="space-y-1 text-sm text-foreground">
              <li>• Answer all questions to the best of your ability</li>
              <li>• You can navigate between questions using the palette</li>
              <li>• Your progress is auto-saved every 30 seconds</li>
              <li>• Submit before time runs out to see your results</li>
            </ul>
          </div>

          <Button className="w-full rounded-xl" onClick={handleStart}>
            Start Test
          </Button>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const selectedAnswer = answers.get(currentIndex);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-medium text-foreground">{test.title}</h1>
          <p className="text-sm text-muted-foreground">
            Question {currentIndex + 1} of {questions.length}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl bg-surface-2 px-4 py-2">
            <Clock className="size-4 text-muted-foreground" />
            <span
              className={cn(
                "num text-sm font-medium",
                timeLeft < 300 ? "text-clay" : "text-foreground",
              )}
            >
              {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
            </span>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="rounded-xl"
            onClick={() => setShowPalette(!showPalette)}
          >
            <Grid3x3 className="size-4" />
          </Button>
        </div>
      </div>

      {/* Question Palette (Mobile: Overlay, Desktop: Sidebar) */}
      {showPalette && (
        <>
          <div
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
            onClick={() => setShowPalette(false)}
          />
          <Card
            className={cn(
              "fixed right-4 top-20 z-50 max-h-[70vh] w-80 overflow-y-auto p-6",
              "lg:sticky lg:top-4 lg:float-right lg:mb-4",
            )}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground">Question Palette</h3>
              <button
                onClick={() => setShowPalette(false)}
                className="text-muted-foreground hover:text-foreground lg:hidden"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((_, i) => {
                const answered = answers.has(i);
                const isCurrent = i === currentIndex;
                return (
                  <button
                    key={i}
                    onClick={() => {
                      setCurrentIndex(i);
                      setShowPalette(false);
                    }}
                    className={cn(
                      "aspect-square rounded-lg text-sm font-medium transition-colors",
                      isCurrent && "ring-2 ring-primary ring-offset-2 ring-offset-surface",
                      answered && !isCurrent && "bg-primary text-primary-foreground",
                      !answered && !isCurrent && "bg-surface-2 text-muted-foreground",
                      isCurrent && "bg-primary-deep text-primary-foreground",
                    )}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
            <div className="mt-6 space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="size-4 rounded bg-primary" />
                <span>Answered: {answers.size}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-4 rounded bg-surface-2" />
                <span>Not answered: {questions.length - answers.size}</span>
              </div>
            </div>
          </Card>
        </>
      )}

      {/* Question Card */}
      <Card className="p-6 sm:p-8">
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2">
            <span className="label-caps">Question {currentIndex + 1}</span>
            {currentQuestion.difficulty && (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium",
                  currentQuestion.difficulty === "easy" && "bg-primary-tint text-primary-deep",
                  currentQuestion.difficulty === "medium" && "bg-sand/30 text-sand",
                  currentQuestion.difficulty === "hard" && "bg-clay-tint text-clay",
                )}
              >
                {currentQuestion.difficulty}
              </span>
            )}
          </div>
          <p className="text-lg leading-relaxed text-foreground">{currentQuestion.question}</p>
        </div>

        <div className="space-y-3">
          {currentQuestion.options.map((option, i) => {
            const isSelected = selectedAnswer === i;
            return (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                className={cn(
                  "w-full rounded-xl border-2 p-4 text-left transition-all",
                  isSelected
                    ? "border-primary bg-primary-tint"
                    : "border-border bg-surface hover:border-border/80 hover:bg-surface-2",
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border",
                    )}
                  >
                    {isSelected && <Check className="size-4" />}
                  </div>
                  <span className="flex-1 text-sm leading-relaxed text-foreground">{option}</span>
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          className="rounded-xl"
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="mr-2 size-4" />
          Previous
        </Button>

        <div className="flex gap-2">
          {currentIndex === questions.length - 1 ? (
            <Button className="rounded-xl" onClick={() => setShowSubmitDialog(true)}>
              Submit Test
            </Button>
          ) : (
            <Button
              className="rounded-xl"
              onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
            >
              Next
              <ChevronRight className="ml-2 size-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Test?</AlertDialogTitle>
            <AlertDialogDescription>
              You have answered {answers.size} out of {questions.length} questions. Once submitted,
              you cannot change your answers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Review Answers</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleSubmit()}>Submit</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
