import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useSignOut } from "@/lib/auth";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  Leaf,
  LogOut,
  Sun,
  User,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { computeStreak, planDay, useProfile, useTasks } from "@/lib/data";
import { ProgressBar } from "./kit";
import { NetworkStatus } from "./NetworkStatus";
import { InstallPrompt, IOSInstallPrompt } from "./InstallPrompt";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: Sun },
  { to: "/progress", label: "Progress", icon: BarChart3 },
  { to: "/schedule", label: "Schedule", icon: CalendarDays },
  { to: "/subjects", label: "Subjects", icon: BookOpen },
  { to: "/mock-tests", label: "Mock Tests", icon: ClipboardCheck },
] as const;

const TITLES: Record<string, string> = Object.fromEntries(NAV.map((n) => [n.to, n.label]));

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const requestSignOut = useSignOut();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: profile } = useProfile();
  const { data: tasks } = useTasks();
  const pd = planDay(profile);
  const streak = computeStreak(tasks);
  const base = "/" + (pathname.split("/")[1] ?? "");
  const title = TITLES[base] ?? "Steady";
  const dateStr = new Date().toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

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

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r bg-background px-4 py-6 lg:flex">
        <Link to="/today" className="mb-8 flex items-center gap-2 px-2">
          <Leaf className="size-5 text-primary" />
          <span className="font-display text-xl text-foreground">Steady</span>
        </Link>
        <nav className="flex flex-1 flex-col gap-1" aria-label="Main">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = base === to;
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "relative flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm transition-colors",
                  active
                    ? "bg-primary-tint font-medium text-primary-deep"
                    : "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
                )}
              >
                {active && (
                  <span className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-primary" />
                )}
                <Icon className="size-4" />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-background/90 px-5 backdrop-blur lg:px-10">
          <div className="flex items-center gap-2">
            <Leaf className="size-4 text-primary lg:hidden" />
            <span className="font-display text-base text-foreground">{title}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{dateStr}</span>
            <DropdownMenu>
              <DropdownMenuTrigger className="hidden lg:block">
                <Avatar className="size-8 cursor-pointer hover:ring-2 hover:ring-primary/20">
                  <AvatarFallback className="bg-primary-tint text-xs font-medium text-primary-deep">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{profile?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Day {pd.day} · {streak.current}-day streak
                  </p>
                </div>
                <DropdownMenuItem onClick={signOut} className="cursor-pointer">
                  <LogOut className="mr-2 size-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="page-in mx-auto max-w-[1120px] px-4 pb-32 pt-6 sm:px-6 lg:px-10 lg:pb-16 lg:pt-8">
          {children}
        </main>
      </div>

      {/* Network status indicator */}
      <NetworkStatus />

      {/* PWA Install prompts */}
      <InstallPrompt />
      <IOSInstallPrompt />

      {/* Mobile bottom tab bar with thumb-rule design */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex h-16 border-t bg-surface shadow-[0_-2px_10px_rgba(0,0,0,0.03)] lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Main"
      >
        {NAV.map(({ to, label, icon: Icon }) => {
          const active = base === to;
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 text-[11px] transition-transform active:scale-95",
                active ? "text-primary-deep" : "text-muted-foreground",
              )}
              style={{ minWidth: "48px", minHeight: "48px" }}
            >
              <div className={cn("relative rounded-full p-1.5", active && "bg-primary-tint")}>
                <Icon className="size-5" />
                {active && (
                  <span className="absolute -top-1 left-1/2 h-[3px] w-6 -translate-x-1/2 rounded-full bg-primary" />
                )}
              </div>
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
