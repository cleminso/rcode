import { Link, createFileRoute } from "@tanstack/react-router";
import { authClient } from "../lib/auth-client";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { data: session, isPending } = authClient.useSession();

  return (
    null
  );
}
