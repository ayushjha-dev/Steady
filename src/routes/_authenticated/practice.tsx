import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { Check, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, Shimmer } from "@/components/steady/kit";
import { cn } from "@/lib/utils";
import { todayISO, usePracticeSet, usePracticeDay } from "@/lib/data";
import type { MCQ } from "@/lib/ai";

const searchSchema = z.object({
  date: z.string().optional(),
});

export const Route = createFileRoute("/_authenticated/practice")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Practice — Steady" },
      {
        name: "description",
        content: "Daily practice questions to build your streak.",
      },
      { property: "og:title", content: "Practice — Steady" },
      { property: "og:description", content: "Daily practice questions to build your streak." },
    ],
  }),
  component: PracticePage,
});

function PracticePage() {
  const navigate = useNavigate();
  const { date } = Route.useSearch();
  const practiceDate = date || todayISO();

  const { data: practiceSet, isLoading } = usePracticeSet(practiceDate);
  const { data: practiceDay } = usePracticeDay(practiceDate);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [attemptedQuestions, setAttemptedQuestions] = useState<Set<number>>(new Set());

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Shimmer className="h-10 w-64" />
        <Shimmer className="h-96" />
      </div>
    );
  }

  if (!practiceSet) {
    return (
      <div className="space-y-6">
        <h1 className="text-[28px] sm:text-[32px]">Practice</h1>
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            No practice set available for this date. Check back on the day of your plan.
          </p>
          <Button className="mt-4 rounded-xl" onClick={() => navigate({ to: "/dashboard" })}>
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  const questions = (practiceSet.questions as MCQ[]) || [];
  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const canProceed = selectedAnswer !== null && showExplanation;

  if (!currentQuestion) {
    return (
      <div className="space-y-6">
        <h1 className="text-[28px] sm:text-[32px]">Practice Complete</h1>
        <Card className="p-8 text-center">
          <p className="text-lg text-foreground">All questions completed!</p>
          <p className="mt-2 text-muted-foreground">
            Solved {practiceDay?.solved || 0} of {practiceDay?.total || 0} questions
          </p>
          <Button className="mt-6 rounded-xl" onClick={() => navigate({ to: "/dashboard" })}>
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  const handleAnswer = async (optionIndex: number) => {
    if (showExplanation) return; // Already answered

    setSelectedAnswer(optionIndex);
    setShowExplanation(true);

    if (!attemptedQuestions.has(currentIndex)) {
      setAttemptedQuestions(new Set(attemptedQuestions).add(currentIndex));
    }

    // Save attempt to database
    if (practiceSet) {
      const isCorrect = optionIndex === currentQuestion.correct_index;
      try {
        const { savePracticeAttempt, updatePracticeDay } = await import("@/lib/data");
        await savePracticeAttempt({
          practiceSetId: practiceSet.id,
          questionIndex: currentIndex,
          selectedIndex: optionIndex,
          isCorrect,
          timeTakenSeconds: 0, // TODO: Track actual time
        });

        // Update practice_day with new solved count
        const newSolved = (practiceDay?.solved || 0) + 1;
        await updatePracticeDay(practiceDate, newSolved, questions.length);
      } catch (err) {
        console.error("Failed to save attempt:", err);
      }
    }
  };

  const handleNext = () => {
    if (isLastQuestion) {
      navigate({ to: "/dashboard" });
    } else {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  };

  const isCorrect = selectedAnswer === currentQuestion.correct_index;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate({ to: "/dashboard" })}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Back to Today
        </button>
        <div className="text-sm text-muted-foreground">
          Question <span className="num text-foreground">{currentIndex + 1}</span> of{" "}
          <span className="num">{questions.length}</span>
        </div>
      </div>

      {/* Question Card */}
      <Card className="p-6 sm:p-8">
        <div className="mb-4 flex items-center gap-2 text-sm">
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-medium",
              currentQuestion.difficulty === "easy" &&
                "bg-green-500/10 text-green-700 dark:text-green-400",
              currentQuestion.difficulty === "medium" &&
                "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
              currentQuestion.difficulty === "hard" &&
                "bg-orange-500/10 text-orange-700 dark:text-orange-400",
            )}
          >
            {currentQuestion.difficulty}
          </span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">{currentQuestion.topic}</span>
        </div>

        <h2 className="mb-6 text-lg leading-relaxed text-foreground sm:text-xl">
          {currentQuestion.question}
        </h2>

        {/* Options */}
        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrectOption = index === currentQuestion.correct_index;
            const showFeedback = showExplanation;

            return (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                disabled={showExplanation}
                className={cn(
                  "w-full rounded-xl border-2 p-4 text-left transition-all",
                  !showFeedback && "border-border hover:border-primary hover:bg-primary-tint/30",
                  showFeedback && isSelected && isCorrect && "border-primary bg-primary-tint",
                  showFeedback && isSelected && !isCorrect && "border-clay bg-clay-tint",
                  showFeedback && isCorrectOption && "border-primary bg-primary-tint",
                  showFeedback && "cursor-default",
                )}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors",
                      !showFeedback && "border-border text-muted-foreground",
                      showFeedback &&
                        isCorrectOption &&
                        "border-primary bg-primary text-primary-foreground",
                      showFeedback &&
                        isSelected &&
                        !isCorrect &&
                        "border-clay bg-clay text-primary-foreground",
                    )}
                  >
                    {showFeedback && isCorrectOption ? (
                      <Check className="size-4" strokeWidth={3} />
                    ) : showFeedback && isSelected && !isCorrect ? (
                      <X className="size-4" strokeWidth={3} />
                    ) : (
                      String.fromCharCode(65 + index)
                    )}
                  </span>
                  <span className="flex-1 text-[15px] text-foreground">{option}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {showExplanation && (
          <div
            className={cn(
              "page-in mt-6 rounded-xl border-l-4 p-4",
              isCorrect ? "border-l-primary bg-primary-tint" : "border-l-clay bg-clay-tint/50",
            )}
          >
            <p className="mb-2 text-sm font-medium text-foreground">
              {isCorrect ? "Correct!" : "Not quite"}
            </p>
            <p className="text-sm text-muted-foreground">{currentQuestion.explanation}</p>
          </div>
        )}
      </Card>

      {/* Navigation */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          className="rounded-xl"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="size-4" />
          Previous
        </Button>
        <Button className="flex-1 rounded-xl" onClick={handleNext} disabled={!canProceed}>
          {isLastQuestion ? "Finish" : "Next"}
          {!isLastQuestion && <ChevronRight className="size-4" />}
        </Button>
      </div>
    </div>
  );
}
