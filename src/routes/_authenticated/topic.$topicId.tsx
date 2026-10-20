import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Code2,
  Edit,
  RefreshCw,
  Sparkles,
  X,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CalmError, Shimmer } from "@/components/steady/kit";
import {
  useSubjects,
  useTopicNote,
  useTopicPracticeSet,
  useUpdateTopic,
  createTopicNote,
  createPracticeSet,
  savePracticeAttempt,
  updateTopicNote,
  type Topic as TopicType,
} from "@/lib/data";
import { generateTopicNotes, generateTopicPractice, type MCQ } from "@/lib/ai";
import { cn } from "@/lib/utils";

const PRACTICE_QUESTION_COUNT = 6;

export const Route = createFileRoute("/_authenticated/topic/$topicId")({
  head: () => ({
    meta: [
      { title: "Topic — Steady" },
      { name: "description", content: "AI notes, practice questions, and your own notes." },
      { property: "og:title", content: "Topic — Steady" },
      { property: "og:description", content: "Study notes and practice for one topic." },
    ],
  }),
  component: TopicDetailPage,
});

function TopicDetailPage() {
  const { topicId } = Route.useParams();
  const navigate = useNavigate();
  const { data: subjects, isLoading: loadingSubjects, isError } = useSubjects();
  const { data: note, isLoading: loadingNote } = useTopicNote(topicId);
  const [activeTab, setActiveTab] = useState("notes");

  // Find the topic in the subjects tree
  let topic: TopicType | null = null;
  let subjectName = "";
  let sectionName = "";

  for (const subject of subjects || []) {
    for (const section of subject.sections) {
      const found = section.topics.find((t) => t.id === topicId);
      if (found) {
        topic = found;
        subjectName = subject.name;
        sectionName = section.name;
        break;
      }
    }
    if (topic) break;
  }

  // Both are generated in the background as soon as the topic opens, so notes
  // and practice are already there — no "Generate" clicks needed.
  const practice = useTopicPractice(topic);

  if (isError) return <CalmError />;
  if (loadingSubjects)
    return (
      <div className="space-y-4">
        <Shimmer className="h-8 w-32" />
        <Shimmer className="h-64" />
      </div>
    );

  if (!topic) {
    return (
      <div className="space-y-6">
        <h1 className="text-[28px] sm:text-[32px]">Topic not found</h1>
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">This topic doesn't exist or was removed.</p>
          <Button className="mt-4 rounded-xl" onClick={() => navigate({ to: "/subjects" })}>
            Back to Subjects
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <button
        onClick={() => navigate({ to: "/subjects" })}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to {subjectName}
      </button>

      {/* Topic info */}
      <div>
        <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
          <span>{subjectName}</span>
          <span>›</span>
          <span>{sectionName}</span>
        </div>
        <h1 className="text-[28px] sm:text-[32px]">{topic.name}</h1>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 rounded-xl bg-surface-2 p-1">
          <TabsTrigger value="notes" className="rounded-lg">
            <Sparkles className="mr-2 size-4" />
            AI Notes
          </TabsTrigger>
          <TabsTrigger value="practice" className="rounded-lg">
            <Code2 className="mr-2 size-4" />
            Practice
          </TabsTrigger>
          <TabsTrigger value="my-notes" className="rounded-lg">
            <BookOpen className="mr-2 size-4" />
            My Notes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notes">
          <NotesTab
            topic={topic}
            subjectName={subjectName}
            note={note}
            isLoading={loadingNote}
          />
        </TabsContent>

        <TabsContent value="practice">
          <PracticeTab topic={topic} practice={practice} />
        </TabsContent>

        <TabsContent value="my-notes">
          <MyNotesTab topic={topic} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---------- AI notes ----------

function NotesTab({
  topic,
  subjectName,
  note,
  isLoading,
}: {
  topic: TopicType;
  subjectName: string;
  note: Awaited<ReturnType<typeof useTopicNote>["data"]>;
  isLoading: boolean;
}) {
  const qc = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [error, setError] = useState("");
  const autoStarted = useRef(false);

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setError("");
    try {
      const response = await generateTopicNotes(topic.name, subjectName);
      if (response.error || !response.data) {
        throw new Error(response.error || "No notes generated");
      }
      await createTopicNote({
        topicId: topic.id,
        content: response.data,
        aiGenerated: true,
      });

      qc.invalidateQueries({ queryKey: ["topic_note", topic.id] });
    } catch (err) {
      console.error("Failed to generate notes:", err);
      setError("Couldn't reach the AI. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }, [topic.id, topic.name, subjectName, qc]);

  // First visit: write the notes without waiting for a button click.
  useEffect(() => {
    if (isLoading || note || isGenerating || autoStarted.current) return;
    autoStarted.current = true;
    void handleGenerate();
  }, [isLoading, note, isGenerating, handleGenerate]);

  const handleEdit = () => {
    setEditContent(note?.content || "");
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!note) return;
    setError("");
    try {
      await updateTopicNote({
        noteId: note.id,
        content: editContent,
        changeSummary: "Manual edit",
      });
      qc.invalidateQueries({ queryKey: ["topic_note", topic.id] });
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to save notes:", err);
      setError("Couldn't save changes. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <Card className="p-8">
        <Shimmer className="mb-4 h-6 w-3/4" />
        <Shimmer className="mb-3 h-4 w-full" />
        <Shimmer className="mb-3 h-4 w-5/6" />
        <Shimmer className="h-4 w-4/5" />
      </Card>
    );
  }

  // No notes yet: the effect above is already generating them.
  if (!note) {
    return (
      <Card className="p-8 text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary-tint">
            <Sparkles className="size-6 animate-pulse text-primary" />
          </div>
        </div>
        <h2 className="mb-2 text-lg font-medium text-foreground">
          {error ? "Notes didn't load" : "Preparing your notes…"}
        </h2>
        <p className="mb-6 text-sm text-muted-foreground">
          {error
            ? `We couldn't write notes for ${topic.name} right now.`
            : `The AI is writing study notes for ${topic.name}. This usually takes a few seconds.`}
        </p>
        {error && (
          <>
            <p className="mb-4 text-sm text-clay">{error}</p>
            <Button className="rounded-xl" onClick={handleGenerate} disabled={isGenerating}>
              <RefreshCw className={cn("mr-2 size-4", isGenerating && "animate-spin")} />
              {isGenerating ? "Trying again…" : "Try again"}
            </Button>
          </>
        )}
        {!error && (
          <div className="mx-auto max-w-md space-y-3">
            <Shimmer className="h-4 w-full" />
            <Shimmer className="h-4 w-11/12" />
            <Shimmer className="h-4 w-4/5" />
          </div>
        )}
      </Card>
    );
  }

  if (isEditing) {
    return (
      <Card className="p-6 sm:p-8">
        <div className="mb-4">
          <h2 className="mb-1 text-lg font-medium text-foreground">Edit AI Notes</h2>
          <p className="text-sm text-muted-foreground">
            Update the notes to add your own insights or corrections.
          </p>
        </div>
        {error && <p className="mb-4 text-sm text-clay">{error}</p>}
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          className={cn(
            "min-h-96 w-full rounded-xl border border-border bg-surface-2 p-4 text-sm text-foreground",
            "placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
          )}
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" className="rounded-xl" onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
          <Button className="rounded-xl" onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 sm:p-8">
      {isGenerating && (
        <div className="page-in mb-4 flex items-center gap-2 rounded-xl bg-primary-tint px-3 py-2 text-sm text-primary-deep">
          <Sparkles className="size-4 animate-pulse" />
          Rewriting these notes…
        </div>
      )}
      {error && <p className="mb-4 text-sm text-clay">{error}</p>}
      <div className="prose prose-sm prose-slate dark:prose-invert max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{note.content}</ReactMarkdown>
      </div>
      {note.ai_generated && note.generated_at && (
        <div className="mt-6 flex items-center gap-2 border-t pt-4 text-xs text-muted-foreground">
          <Sparkles className="size-3" />
          <span>
            AI-generated on {new Date(note.generated_at).toLocaleDateString()}
            {note.last_edited_at && (
              <> • Edited on {new Date(note.last_edited_at).toLocaleDateString()}</>
            )}
          </span>
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="outline" className="rounded-xl" onClick={handleEdit}>
          <Edit className="mr-2 size-4" />
          Edit
        </Button>
        <Button
          variant="outline"
          className="rounded-xl"
          onClick={handleGenerate}
          disabled={isGenerating}
        >
          <RefreshCw className={cn("mr-2 size-4", isGenerating && "animate-spin")} />
          {isGenerating ? "Regenerating…" : "Regenerate"}
        </Button>
      </div>
    </Card>
  );
}

// ---------- practice ----------

// Generates (once) and caches the topic's MCQ set. Called at page level so the
// questions are ready even before the Practice tab is opened.
function useTopicPractice(topic: TopicType | null) {
  const qc = useQueryClient();
  const { data: practiceSet, isLoading } = useTopicPracticeSet(topic?.id);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const autoStarted = useRef(false);

  const generate = useCallback(async () => {
    if (!topic) return;
    setIsGenerating(true);
    setError("");
    try {
      const response = await generateTopicPractice(topic.name, PRACTICE_QUESTION_COUNT);
      const questions = response.data?.questions ?? [];
      if (response.error || questions.length === 0) {
        throw new Error(response.error || "No practice questions were generated.");
      }
      await createPracticeSet({
        date: topic.id,
        kind: "topic",
        topicId: topic.id,
        questions,
        metadata: { topic: topic.name },
      });
      await qc.invalidateQueries({ queryKey: ["practice_set", "topic", topic.id] });
    } catch (err) {
      console.error("Failed to prepare practice set:", err);
      setError(
        err instanceof Error && err.message.includes("limit")
          ? err.message
          : "Couldn't prepare practice questions. Please try again.",
      );
    } finally {
      setIsGenerating(false);
    }
  }, [topic, qc]);

  useEffect(() => {
    if (!topic || isLoading || practiceSet || autoStarted.current) return;
    autoStarted.current = true;
    void generate();
  }, [topic, isLoading, practiceSet, generate]);

  return { practiceSet, isLoading, isGenerating, error, generate };
}

function PracticeTab({
  topic,
  practice,
}: {
  topic: TopicType;
  practice: ReturnType<typeof useTopicPractice>;
}) {
  const { practiceSet, isLoading, isGenerating, error, generate } = practice;

  const questions = ((practiceSet?.questions as MCQ[]) || []).filter(
    (q) => q && Array.isArray(q.options) && q.options.length > 0,
  );

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});

  // New/regenerated sets restart the quiz (the upsert keeps the same id, so
  // generated_at is the reliable "content changed" signal).
  const setVersion = practiceSet ? `${practiceSet.id}:${practiceSet.generated_at}` : "";
  useEffect(() => {
    setIndex(0);
    setSelected(null);
    setRevealed(false);
    setAnswers({});
  }, [setVersion]);

  if (isLoading || (isGenerating && !practiceSet) || (!practiceSet && !error)) {
    return (
      <Card className="p-8 text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary-tint">
            <Code2 className="size-6 animate-pulse text-primary" />
          </div>
        </div>
        <h2 className="mb-2 text-lg font-medium text-foreground">
          {error ? "Practice didn't load" : "Preparing practice questions…"}
        </h2>
        <p className="mb-6 text-sm text-muted-foreground">
          {error
            ? `We couldn't build the practice set for ${topic.name} right now.`
            : `Writing a few MCQs on ${topic.name}. They'll be ready in a moment.`}
        </p>
        {error ? (
          <>
            <p className="mb-4 text-sm text-clay">{error}</p>
            <Button className="rounded-xl" onClick={generate} disabled={isGenerating}>
              <RefreshCw className={cn("mr-2 size-4", isGenerating && "animate-spin")} />
              {isGenerating ? "Trying again…" : "Try again"}
            </Button>
          </>
        ) : (
          <div className="mx-auto max-w-md space-y-3">
            <Shimmer className="h-4 w-2/3" />
            <Shimmer className="h-12 w-full rounded-xl" />
            <Shimmer className="h-12 w-full rounded-xl" />
            <Shimmer className="h-12 w-full rounded-xl" />
          </div>
        )}
      </Card>
    );
  }

  if (!practiceSet || questions.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="mb-4 text-muted-foreground">
          No practice questions available for {topic.name} yet.
        </p>
        <Button className="rounded-xl" onClick={generate} disabled={isGenerating}>
          <RefreshCw className={cn("mr-2 size-4", isGenerating && "animate-spin")} />
          {isGenerating ? "Generating…" : "Generate practice set"}
        </Button>
      </Card>
    );
  }

  // Finished: show the score once every question was answered.
  if (index >= questions.length) {
    const correct = questions.reduce(
      (n, q, i) => (answers[i] === q.correct_index ? n + 1 : n),
      0,
    );
    const pct = Math.round((correct / questions.length) * 100);
    return (
      <Card className="p-8 text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary-tint">
            <Check className="size-6 text-primary" strokeWidth={3} />
          </div>
        </div>
        <h2 className="mb-2 text-lg font-medium text-foreground">Set complete</h2>
        <p className="mb-1 text-3xl font-medium text-foreground">
          {correct}/{questions.length}
        </p>
        <p className="mb-6 text-sm text-muted-foreground">
          {pct >= 80
            ? "Solid grasp of this topic."
            : pct >= 50
              ? "Getting there — review the notes for the ones you missed."
              : `Worth re-reading the AI notes on ${topic.name} before the next round.`}
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button
            className="rounded-xl"
            onClick={() => {
              setIndex(0);
              setSelected(null);
              setRevealed(false);
              setAnswers({});
            }}
          >
            <RefreshCw className="mr-2 size-4" />
            Retry this set
          </Button>
          <Button variant="outline" className="rounded-xl" onClick={generate} disabled={isGenerating}>
            {isGenerating ? "Generating…" : "New questions"}
          </Button>
        </div>
      </Card>
    );
  }

  const question = questions[index];
  if (!question) return null;
  const isCorrect = selected === question.correct_index;
  const isLast = index === questions.length - 1;
  const correctSoFar = questions.reduce(
    (n, q, i) => (answers[i] === q.correct_index ? n + 1 : n),
    0,
  );

  const choose = async (optionIndex: number) => {
    if (revealed || !practiceSet) return;
    setSelected(optionIndex);
    setRevealed(true);
    setAnswers((prev) => ({ ...prev, [index]: optionIndex }));
    try {
      await savePracticeAttempt({
        practiceSetId: practiceSet.id,
        questionIndex: index,
        selectedIndex: optionIndex,
        isCorrect: optionIndex === question.correct_index,
        timeTakenSeconds: 0,
      });
    } catch (err) {
      console.error("Failed to save attempt:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Question <span className="num text-foreground">{index + 1}</span> of{" "}
          <span className="num">{questions.length}</span>
        </span>
        <span>
          <span className="num text-foreground">{correctSoFar}</span> correct so far
        </span>
      </div>

      <Card className="p-6 sm:p-8">
        <div className="mb-4 flex items-center gap-2 text-sm">
          {question.difficulty && (
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                question.difficulty === "easy" &&
                  "bg-green-500/10 text-green-700 dark:text-green-400",
                question.difficulty === "medium" &&
                  "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
                question.difficulty === "hard" &&
                  "bg-orange-500/10 text-orange-700 dark:text-orange-400",
              )}
            >
              {question.difficulty}
            </span>
          )}
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">{question.topic || topic.name}</span>
        </div>

        <h2 className="mb-6 text-lg leading-relaxed text-foreground sm:text-xl">
          {question.question}
        </h2>

        <div className="space-y-3">
          {question.options.map((option, optionIndex) => {
            const isSelected = selected === optionIndex;
            const isCorrectOption = optionIndex === question.correct_index;

            return (
              <button
                key={optionIndex}
                onClick={() => choose(optionIndex)}
                disabled={revealed}
                className={cn(
                  "w-full rounded-xl border-2 p-4 text-left transition-all",
                  !revealed && "border-border hover:border-primary hover:bg-primary-tint/30",
                  revealed && isSelected && isCorrect && "border-primary bg-primary-tint",
                  revealed && isSelected && !isCorrect && "border-clay bg-clay-tint",
                  revealed && isCorrectOption && "border-primary bg-primary-tint",
                  revealed && "cursor-default",
                )}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors",
                      !revealed && "border-border text-muted-foreground",
                      revealed &&
                        isCorrectOption &&
                        "border-primary bg-primary text-primary-foreground",
                      revealed &&
                        isSelected &&
                        !isCorrect &&
                        "border-clay bg-clay text-primary-foreground",
                    )}
                  >
                    {revealed && isCorrectOption ? (
                      <Check className="size-4" strokeWidth={3} />
                    ) : revealed && isSelected && !isCorrect ? (
                      <X className="size-4" strokeWidth={3} />
                    ) : (
                      String.fromCharCode(65 + optionIndex)
                    )}
                  </span>
                  <span className="flex-1 text-[15px] text-foreground">{option}</span>
                </div>
              </button>
            );
          })}
        </div>

        {revealed && (
          <div
            className={cn(
              "page-in mt-6 rounded-xl border-l-4 p-4",
              isCorrect ? "border-l-primary bg-primary-tint" : "border-l-clay bg-clay-tint/50",
            )}
          >
            <p className="mb-2 text-sm font-medium text-foreground">
              {isCorrect ? "Correct!" : "Not quite"}
            </p>
            <p className="text-sm text-muted-foreground">{question.explanation}</p>
          </div>
        )}
      </Card>

      <div className="flex gap-3">
        <Button
          variant="outline"
          className="rounded-xl"
          onClick={() => {
            setIndex(index - 1);
            setSelected(null);
            setRevealed(false);
          }}
          disabled={index === 0}
        >
          <ChevronLeft className="size-4" />
          Previous
        </Button>
        <Button
          className="flex-1 rounded-xl"
          onClick={() => {
            setIndex(index + 1);
            setSelected(null);
            setRevealed(false);
          }}
          disabled={!revealed}
        >
          {isLast ? "See results" : "Next"}
          {!isLast && <ChevronRight className="size-4" />}
        </Button>
      </div>

      {error && <p className="text-sm text-clay">{error}</p>}
    </div>
  );
}

// ---------- personal notes ----------

function MyNotesTab({ topic }: { topic: TopicType }) {
  const [notes, setNotes] = useState(topic.notes || "");
  const [isSaving, setIsSaving] = useState(false);
  const updateTopic = useUpdateTopic();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateTopic.mutateAsync({ id: topic.id, patch: { notes } });
    } catch (err) {
      console.error("Failed to save notes:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="p-6 sm:p-8">
      <div className="mb-4">
        <h2 className="mb-1 text-lg font-medium text-foreground">Your personal notes</h2>
        <p className="text-sm text-muted-foreground">
          Write down what clicked, what didn't, and any resources you found helpful.
        </p>
      </div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="What clicked, what didn't..."
        className={cn(
          "min-h-60 w-full rounded-xl border border-border bg-surface-2 p-4 text-sm text-foreground",
          "placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
        )}
      />
      <div className="mt-4 flex justify-end">
        <Button className="rounded-xl" onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Notes"}
        </Button>
      </div>
      {topic.resources && (topic.resources as string[]).length > 0 && (
        <div className="mt-6 border-t pt-6">
          <h3 className="mb-3 text-sm font-medium text-foreground">Resources</h3>
          <ul className="space-y-2">
            {(topic.resources as string[]).map((link, i) => (
              <li key={i}>
                <a
                  href={link}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-primary-deep hover:underline"
                >
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
