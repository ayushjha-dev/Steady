import { useMemo } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSignOut } from "@/lib/auth";
import {
  BarChart3,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Flame,
  Leaf,
  LogOut,
  Target,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { addDays, fromISO } from "@/lib/curriculum";
import {
  computeStreak,
  fmtMinutes,
  planDay,
  todayISO,
  usePracticeDay,
  usePracticeSet,
  usePracticeStreak,
  useProfile,
  useSubjects,
  useTasks,
} from "@/lib/data";
import {
  Card,
  CalmError,
  ProgressRing,
  SectionHeader,
  Shimmer,
  SubjectDot,
} from "@/components/steady/kit";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Steady" },
      {
        name: "description",
        content: "Your progress overview: streak, tasks, practice, and weekly insights.",
      },
      { property: "og:title", content: "Dashboard — Steady" },
      { property: "og:description", content: "Track your learning journey." },
    ],
  }),
  component: DashboardPage,
});

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function DashboardPage() {
  const navigate = useNavigate();
  const requestSignOut = useSignOut();
  const { data: profile } = useProfile();
  const tasksQ = useTasks();
  const subjectsQ = useSubjects();
  const realToday = todayISO();
  const pd = planDay(profile, realToday);
  const date = pd.before && profile ? profile.start_date : realToday;
  const { data: tasks } = useTasks();
  const streak = computeStreak(tasks);
  const { data: practiceDay } = usePracticeDay(date);
  const { data: practiceStreak } = usePracticeStreak();

  const signOut = async () => {
    await requestSignOut();
    navigate({ to: "/auth", replace: true });
  };

  const initials = profile?.name
    ? profile.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const todays = useMemo(
    () => (tasksQ.data ?? []).filter((t) => t.date === date),
    [tasksQ.data, date],
  );

  const weeklyStats = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => addDays(realToday, -i));
    const weekTasks = (tasksQ.data ?? []).filter((t) => last7Days.includes(t.date));
    const doneCount = weekTasks.filter((t) => t.done).length;
    const totalMin = weekTasks.reduce((a, t) => a + t.est_minutes, 0);
    const doneMin = weekTasks.filter((t) => t.done).reduce((a, t) => a + t.est_minutes, 0);
    return { total: weekTasks.length, done: doneCount, totalMin, doneMin };
  }, [tasksQ.data, realToday]);

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
        dayName: dateObj.toLocaleDateString("en-US", { weekday: "short" }),
        dayNum: dateObj.getDate(),
        tasks: dayTasks,
        completed: dayTasks.length > 0 && doneCount === dayTasks.length,
        progress: dayTasks.length > 0 ? (doneCount / dayTasks.length) * 100 : 0,
      };
    });
  }, [tasksQ.data, realToday]);

  if (tasksQ.isError || subjectsQ.isError) return <CalmError />;
  if (tasksQ.isLoading || subjectsQ.isLoading) {
    return (
      <div className="space-y-6">
        <Shimmer className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Shimmer className="h-32" />
          <Shimmer className="h-32" />
          <Shimmer className="h-32" />
          <Shimmer className="h-32" />
        </div>
        <Shimmer className="h-64" />
      </div>
    );
  }

  const subjects = subjectsQ.data ?? [];
  const doneCount = todays.filter((t) => t.done).length;
  const totalMin = todays.reduce((a, t) => a + t.est_minutes, 0);
  const doneMin = todays.filter((t) => t.done).reduce((a, t) => a + t.est_minutes, 0);
  const dateLabel = fromISO(date).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });

  const practiceTotal = practiceDay?.total || 0;
  const practiceSolved = practiceDay?.solved || 0;
  const practiceCompleted = practiceDay?.completed || false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] leading-tight sm:text-[34px]">
            {greeting()}
            {profile?.name ? `, ${profile.name}` : ""}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{dateLabel}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger className="lg:hidden">
            <Avatar className="size-9 cursor-pointer hover:ring-2 hover:ring-primary/20">
              <AvatarFallback className="bg-primary-tint text-xs font-medium text-primary-deep">
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{profile?.name}</p>
              <p className="text-xs text-muted-foreground">{streak.current}-day streak</p>
            </div>
            <DropdownMenuItem onClick={signOut} className="cursor-pointer">
              <LogOut className="mr-2 size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </section>

      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Task Streak */}
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary-tint">
              <Flame className="size-5 text-primary" />
            </div>
            <span className="rounded-full bg-primary-tint px-2 py-0.5 text-xs text-primary-deep">
              {streak.current > streak.longest ? "New record!" : "Keep going"}
            </span>
          </div>
          <div className="mt-4">
            <div className="num text-2xl font-display">{streak.current}</div>
            <div className="mt-1 text-sm text-muted-foreground">Day streak</div>
          </div>
        </Card>

        {/* Today's Tasks */}
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex size-11 items-center justify-center rounded-xl bg-blue-50">
              <CheckCircle2 className="size-5 text-blue-600" />
            </div>
            <span className="num text-xs text-muted-foreground">
              {todays.length ? Math.round((doneCount / todays.length) * 100) : 0}%
            </span>
          </div>
          <div className="mt-4">
            <div className="num text-2xl font-display">
              {doneCount}/{todays.length}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">Tasks completed</div>
          </div>
        </Card>

        {/* Practice Progress */}
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex size-11 items-center justify-center rounded-xl bg-green-50">
              <Target className="size-5 text-green-600" />
            </div>
            <span className="num text-xs text-muted-foreground">
              {practiceTotal ? Math.round((practiceSolved / practiceTotal) * 100) : 0}%
            </span>
          </div>
          <div className="mt-4">
            <div className="num text-2xl font-display">
              {practiceSolved}/{practiceTotal}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">Practice questions</div>
          </div>
        </Card>

        {/* Time Spent */}
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex size-11 items-center justify-center rounded-xl bg-orange-50">
              <Clock className="size-5 text-orange-600" />
            </div>
            <span className="num text-xs text-muted-foreground">Today</span>
          </div>
          <div className="mt-4">
            <div className="num text-2xl font-display">{fmtMinutes(doneMin)}</div>
            <div className="mt-1 text-sm text-muted-foreground">of {fmtMinutes(totalMin)}</div>
          </div>
        </Card>
      </div>

      {/* Today's Practice CTA */}
      <Card className="bg-gradient-to-br from-primary-tint to-primary-tint/50">
        <SectionHeader
          label="Today's focus"
          title={practiceCompleted ? "Practice complete!" : "Ready for today's practice?"}
        />
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <ProgressRing
              value={practiceTotal ? (practiceSolved / practiceTotal) * 100 : 0}
              label={`${practiceSolved} of ${practiceTotal} questions solved`}
            >
              <span className="num font-display text-2xl">
                {practiceSolved}/{practiceTotal}
              </span>
              <span className="text-[11px] text-muted-foreground">solved</span>
            </ProgressRing>
            <div>
              <div className="label-caps">Daily practice</div>
              <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <Leaf className="size-4 text-primary" />
                <span>
                  <span className="num text-foreground">{practiceStreak?.current || 0}</span>-day
                  streak
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {practiceCompleted
                  ? "You showed up today. That counts."
                  : practiceTotal === 0
                    ? "Your practice set is being prepared..."
                    : `${practiceTotal - practiceSolved} question${practiceTotal - practiceSolved !== 1 ? "s" : ""} remaining`}
              </p>
            </div>
          </div>
          <Button asChild className="h-11 rounded-xl" size="lg">
            <Link to="/today" search={{ date }}>
              <Target className="mr-2 size-4" />
              {practiceCompleted ? "View Today" : "Start Practice"}
            </Link>
          </Button>
        </div>
      </Card>

      {/* Weekly Overview */}
      <Card>
        <SectionHeader label="This week" title="Weekly overview" />
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-surface-2">
              <Calendar className="size-5 text-primary" />
            </div>
            <div>
              <div className="num text-xl font-display">{weeklyStats.done}</div>
              <div className="text-sm text-muted-foreground">Tasks completed</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-surface-2">
              <Clock className="size-5 text-primary" />
            </div>
            <div>
              <div className="num text-xl font-display">{fmtMinutes(weeklyStats.doneMin)}</div>
              <div className="text-sm text-muted-foreground">Time invested</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-surface-2">
              <TrendingUp className="size-5 text-primary" />
            </div>
            <div>
              <div className="num text-xl font-display">
                {weeklyStats.total ? Math.round((weeklyStats.done / weeklyStats.total) * 100) : 0}%
              </div>
              <div className="text-sm text-muted-foreground">Completion rate</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Links */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-surface-2">
              <BarChart3 className="size-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-foreground">View Progress</div>
              <p className="text-sm text-muted-foreground">See your weekly analytics</p>
            </div>
            <Button asChild variant="outline" size="sm" className="rounded-xl">
              <Link to="/progress">Open</Link>
            </Button>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-surface-2">
              <BookOpen className="size-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-foreground">Browse Subjects</div>
              <p className="text-sm text-muted-foreground">Study notes and topics</p>
            </div>
            <Button asChild variant="outline" size="sm" className="rounded-xl">
              <Link to="/subjects">Open</Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
