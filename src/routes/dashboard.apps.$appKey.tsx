import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/apps/$appKey")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/dashboard/apps" });
  },
});
