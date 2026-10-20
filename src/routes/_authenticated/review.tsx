import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/steady/ComingSoon";

export const Route = createFileRoute("/_authenticated/review")({
  head: () => ({
    meta: [
      { title: "Weekly Review — Steady" },
      { name: "description", content: "A gentle look back at your week every Sunday." },
      { property: "og:title", content: "Weekly Review — Steady" },
      { property: "og:description", content: "A gentle look back at your week every Sunday." },
    ],
  }),
  component: () => (
    <ComingSoon title="Weekly Review" line="A gentle look back at your week every Sunday." />
  ),
});
