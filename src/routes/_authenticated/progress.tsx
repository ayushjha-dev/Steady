import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { startOfWeek, eachDayOfInterval, format, subWeeks, subDays } from "date-fns";
import { BarChart3, Leaf, Target, TrendingUp } from "lucide-react";
import { Card, Shimmer } from "@/components/steady/kit";
import { cn } from "@/lib/utils";
import {
  usePracticeAttemptsSince,
  usePracticeDaysSince,
  usePracticeStreak,
  useMockTests,
  todayISO,
} from "@/lib/data";

export const Route = createFileRoute("/_authenticated/progress")({
  head: () => ({
    meta: [
      { title: "Progress — Steady" },
      {
        name: "description",
        content: "Overall progress, streaks, pace and a calm consistency heatmap.",
      },
      { property: "og:title", content: "Progress — Steady" },
      {
        property: "og:description",
        content: "Overall progress, streaks, pace and a calm consistency heatmap.",
      },
    ],
  }),
  component: ProgressPage,
});

function ProgressPage() {
  const { data: streak } = usePracticeStreak();
  const { data: mockTests } = useMockTests();

  // Fetch practice days for heatmap (last 12 weeks)
  const heatmapStart = format(subWeeks(new Date(), 12), "yyyy-MM-dd");
  const { data: practiceDays, isLoading } = usePracticeDaysSince(heatmapStart);

  // Fetch practice attempts for accuracy calculation (last 30 days)
  const statsSince = format(subDays(new Date(), 30), "yyyy-MM-dd");
  const { data: attempts, isLoading: loadingStats } = usePracticeAttemptsSince(statsSince);
  const practiceStats = useMemo(() => {
    const total = attempts?.length || 0;
    const correct = attempts?.filter((a: any) => a.is_correct).length || 0;
    return { total, correct, accuracy: total > 0 ? (correct / total) * 100 : 0 };
  }, [attempts]);

  // Calculate mock test stats
  const completedTests = mockTests?.filter((t) => t.status === "completed") || [];
  const avgMockScore =
    completedTests.length > 0
      ? completedTests.reduce((acc, t) => acc + (t.percentage || 0), 0) / completedTests.length
      : 0;
  const recentTests = completedTests.slice(0, 5).reverse(); // Last 5 tests

  const weeks = generateWeeks(12);
  const dayMap = new Map(practiceDays?.map((d) => [d.date, d]) || []);

  return (
    <div className="space-y-6">
      <h1 className="text-[28px] sm:text-[32px]">Progress</h1>

      {/* Stats Overview Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary-tint">
              <Leaf className="size-5 text-primary" />
            </div>
            <div>
              <div className="num text-2xl font-semibold text-foreground">
                {streak?.current || 0}
              </div>
              <p className="text-xs text-muted-foreground">Day streak</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary-tint">
              <Target className="size-5 text-primary" />
            </div>
            <div>
              <div className="num text-2xl font-semibold text-foreground">
                {loadingStats ? "—" : practiceStats?.total || 0}
              </div>
              <p className="text-xs text-muted-foreground">Questions solved</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary-tint">
              <TrendingUp className="size-5 text-primary" />
            </div>
            <div>
              <div className="num text-2xl font-semibold text-foreground">
                {loadingStats ? "—" : `${Math.round(practiceStats?.accuracy || 0)}%`}
              </div>
              <p className="text-xs text-muted-foreground">MCQ accuracy</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary-tint">
              <BarChart3 className="size-5 text-primary" />
            </div>
            <div>
              <div className="num text-2xl font-semibold text-foreground">
                {completedTests.length > 0 ? `${Math.round(avgMockScore)}%` : "—"}
              </div>
              <p className="text-xs text-muted-foreground">Avg mock score</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Heatmap */}
      <Card className="p-6">
        <h2 className="mb-4 text-lg font-medium text-foreground">Practice Consistency</h2>
        {isLoading ? (
          <Shimmer className="h-40" />
        ) : (
          <div className="space-y-2">
            {/* Day labels */}
            <div className="flex gap-2">
              <div className="w-8" />
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => (
                <div
                  key={day}
                  className="flex-1 text-center text-xs text-muted-foreground"
                  style={{ visibility: i % 2 === 0 ? "visible" : "hidden" }}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Heatmap grid */}
            <div className="flex gap-2">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-1 flex-col gap-2">
                  {week.map((date, dayIndex) => {
                    const dayData = dayMap.get(date);
                    const isToday = date === todayISO();
                    const intensity = dayData
                      ? dayData.solved === dayData.total && dayData.total > 0
                        ? 1
                        : dayData.solved > 0
                          ? 0.5
                          : 0
                      : 0;

                    return (
                      <div
                        key={date}
                        className={cn(
                          "aspect-square rounded-sm transition-colors",
                          intensity === 1 && "bg-primary",
                          intensity === 0.5 && "bg-primary/40",
                          intensity === 0 && "bg-border",
                          isToday && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                        )}
                        title={`${date}: ${dayData?.solved || 0}/${dayData?.total || 0} solved`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="mt-4 flex items-center justify-end gap-2 text-xs text-muted-foreground">
              <span>Less</span>
              <div className="size-3 rounded-sm bg-border" />
              <div className="size-3 rounded-sm bg-primary/40" />
              <div className="size-3 rounded-sm bg-primary" />
              <span>More</span>
            </div>
          </div>
        )}
      </Card>

      {/* Mock Test Performance */}
      {completedTests.length > 0 && (
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="size-5 text-primary" />
            <h2 className="text-lg font-medium text-foreground">Mock Test Performance</h2>
          </div>
          <div className="space-y-3">
            {recentTests.map((test, i) => {
              const percentage = test.percentage || 0;
              return (
                <div key={test.id}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="truncate font-medium text-foreground">{test.title}</span>
                    <span className="num ml-2 shrink-0 text-muted-foreground">
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        percentage >= 75 ? "bg-primary" : percentage >= 50 ? "bg-sand" : "bg-clay",
                      )}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          {completedTests.length > 5 && (
            <p className="mt-4 text-xs text-muted-foreground">Showing last 5 tests</p>
          )}
        </Card>
      )}

      {/* Additional insights coming soon */}
      {(!completedTests || completedTests.length === 0) && (
        <Card className="p-6">
          <h2 className="mb-2 text-lg font-medium text-foreground">More insights coming</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Complete mock tests to see performance trends</li>
            <li>• Topic-wise accuracy breakdown</li>
            <li>• Weekly study pace analysis</li>
          </ul>
        </Card>
      )}
    </div>
  );
}

// Generate last N weeks of dates (Mon-Sun grid)
function generateWeeks(numWeeks: number): string[][] {
  const today = new Date();
  const startDate = subWeeks(today, numWeeks - 1);
  const monday = startOfWeek(startDate, { weekStartsOn: 1 });
  const allDays = eachDayOfInterval({ start: monday, end: today });

  const weeks: string[][] = [];
  for (let i = 0; i < allDays.length; i += 7) {
    const week = allDays.slice(i, i + 7).map((d) => format(d, "yyyy-MM-dd"));
    // Pad incomplete weeks
    while (week.length < 7) week.push("");
    weeks.push(week);
  }

  return weeks;
}
