import { useMemo } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { addDays, fromISO } from "@/lib/curriculum";
import { subjectKeyOf, todayISO, useTasks, useSubjects, type Task } from "@/lib/data";
import { Card, CalmError, SectionHeader, Shimmer, SubjectDot } from "@/components/steady/kit";

export const Route = createFileRoute("/_authenticated/schedule")({
  head: () => ({
    meta: [
      { title: "Schedule — Steady" },
      { name: "description", content: "Your weekly schedule and upcoming tasks." },
      { property: "og:title", content: "Schedule — Steady" },
      { property: "og:description", content: "View your weekly schedule." },
    ],
  }),
  component: SchedulePage,
});

function SchedulePage() {
  const navigate = useNavigate();
  const tasksQ = useTasks();
  const subjectsQ = useSubjects();
  const realToday = todayISO();

  // Get this week's schedule (Sun-Sat)
  const weekSchedule = useMemo(() => {
    const today = fromISO(realToday);
    const dayOfWeek = today.getDay(); // 0 = Sunday
    const startOfWeek = addDays(realToday, -dayOfWeek); // Go back to Sunday

    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(startOfWeek, i);
      const dayTasks = (tasksQ.data ?? []).filter((t) => t.date === date);
      const dateObj = fromISO(date);
      const isToday = date === realToday;
      const isPast = dateObj < fromISO(realToday);
      const doneCount = dayTasks.filter((t) => t.done).length;

      return {
        date,
        dateObj,
        isToday,
        isPast,
        dayName: dateObj.toLocaleDateString("en-US", { weekday: "long" }),
        dayNameShort: dateObj.toLocaleDateString("en-US", { weekday: "short" }),
        dayNum: dateObj.getDate(),
        month: dateObj.toLocaleDateString("en-US", { month: "short" }),
        tasks: dayTasks,
        completed: dayTasks.length > 0 && doneCount === dayTasks.length,
        progress: dayTasks.length > 0 ? (doneCount / dayTasks.length) * 100 : 0,
        totalMinutes: dayTasks.reduce((sum, t) => sum + t.est_minutes, 0),
      };
    });
  }, [tasksQ.data, realToday]);

  if (tasksQ.isError || subjectsQ.isError) return <CalmError />;
  if (tasksQ.isLoading || subjectsQ.isLoading) {
    return (
      <div className="space-y-6">
        <Shimmer className="h-10 w-64" />
        <Shimmer className="h-64" />
        <Shimmer className="h-96" />
      </div>
    );
  }

  const subjects = subjectsQ.data ?? [];
  const weekStart = weekSchedule[0]?.dateObj;
  const weekEnd = weekSchedule[6]?.dateObj;

  return (
    <div className="space-y-6">
      {/* Header */}
      <section>
        <h1 className="text-[28px] leading-tight sm:text-[34px]">Schedule</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your weekly plan and upcoming tasks</p>
      </section>

      {/* Week Overview */}
      <Card>
        <div className="flex items-center justify-between">
          <SectionHeader
            label={`${weekStart?.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${weekEnd?.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
            title="This week at a glance"
          />
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="rounded-xl">
              <ChevronLeft className="size-4" />
            </Button>
            <Button size="sm" variant="outline" className="rounded-xl">
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        {/* Week Grid */}
        <div className="grid grid-cols-7 gap-2">
          {weekSchedule.map((day) => (
            <button
              key={day.date}
              onClick={() => navigate({ to: "/today", search: { date: day.date } })}
              className={cn(
                "flex flex-col items-center rounded-xl border-2 p-3 transition-all hover:border-primary/40",
                day.isToday && "border-primary bg-primary-tint",
                !day.isToday && day.completed && "border-primary/30 bg-primary-tint/30",
                !day.isToday && !day.completed && "border-border",
              )}
            >
              <span
                className={cn(
                  "text-xs font-medium uppercase",
                  day.isToday ? "text-primary-deep" : "text-muted-foreground",
                )}
              >
                {day.dayNameShort}
              </span>
              <span
                className={cn(
                  "mt-1 text-2xl font-display",
                  day.isToday ? "text-primary-deep" : "text-foreground",
                )}
              >
                {day.dayNum}
              </span>
              <div className="mt-2 flex items-center gap-1">
                {day.tasks.length > 0 ? (
                  <>
                    <div
                      className={cn(
                        "size-1.5 rounded-full",
                        day.completed
                          ? "bg-primary"
                          : day.isPast
                            ? "bg-clay"
                            : "bg-muted-foreground/40",
                      )}
                    />
                    <span className="num text-[10px] text-muted-foreground">
                      {day.tasks.length}
                    </span>
                  </>
                ) : (
                  <span className="text-[10px] text-muted-foreground">Rest</span>
                )}
              </div>
              {day.tasks.length > 0 && (
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-surface-2">
                  <div
                    className={cn(
                      "h-full transition-all",
                      day.completed ? "bg-primary" : "bg-primary/50",
                    )}
                    style={{ width: `${day.progress}%` }}
                  />
                </div>
              )}
            </button>
          ))}
        </div>
      </Card>

      {/* Daily Breakdown */}
      <div className="space-y-4">
        {weekSchedule.map((day) => (
          <Card key={day.date}>
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="font-medium text-foreground">
                  {day.dayName}, {day.month} {day.dayNum}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {day.tasks.length === 0 ? (
                    "Rest day"
                  ) : (
                    <>
                      {day.tasks.length} task{day.tasks.length !== 1 && "s"} · {day.totalMinutes}{" "}
                      min
                    </>
                  )}
                </p>
              </div>
              {day.isToday && (
                <span className="rounded-full bg-primary-tint px-3 py-1 text-xs font-medium text-primary-deep">
                  Today
                </span>
              )}
              {!day.isToday && day.completed && (
                <span className="rounded-full bg-primary-tint px-3 py-1 text-xs font-medium text-primary">
                  ✓ Complete
                </span>
              )}
            </div>

            {day.tasks.length > 0 ? (
              <div className="space-y-3">
                {day.tasks.map((task) => {
                  const subjectKey = subjectKeyOf(subjects as never, task.subject_id);
                  return (
                    <div
                      key={task.id}
                      className={cn("flex items-center gap-3 py-2", task.done && "opacity-55")}
                    >
                      <div
                        className={cn(
                          "grid size-5 shrink-0 place-items-center rounded-full border-[1.5px]",
                          task.done
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border",
                        )}
                      >
                        {task.done && <span className="text-xs">✓</span>}
                      </div>
                      <SubjectDot k={subjectKey} />
                      <div className="min-w-0 flex-1">
                        <div className={cn("text-sm text-foreground", task.done && "line-through")}>
                          {task.title}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">{task.detail}</div>
                      </div>
                      <span className="num shrink-0 text-xs text-muted-foreground">
                        {task.est_minutes}m
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No tasks scheduled. Enjoy the quiet.
              </p>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
