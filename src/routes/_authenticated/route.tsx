import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getViewerFn } from "@/lib/auth";
import { useProfile } from "@/lib/data";
import { AppShell } from "@/components/steady/AppShell";
import { Onboarding } from "@/components/steady/Onboarding";
import { Shimmer } from "@/components/steady/kit";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { viewer } = await getViewerFn();
    if (!viewer) throw redirect({ to: "/auth" });
    return { user: viewer };
  },
  component: Gate,
});

function Gate() {
  const { data: profile, isLoading } = useProfile();
  if (isLoading || !profile) {
    return (
      <div className="mx-auto max-w-md space-y-4 px-6 pt-24">
        <Shimmer className="h-8 w-2/3" />
        <Shimmer className="h-40" />
      </div>
    );
  }
  if (!profile.plan_loaded) return <Onboarding profile={profile} />;
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
