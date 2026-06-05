import { createFileRoute } from "@tanstack/react-router";
import { DashboardScreen } from "../components/dashboard/dashboardScreen";

export const Route = createFileRoute("/dashboard")({
  component: DashboardScreen,
});
