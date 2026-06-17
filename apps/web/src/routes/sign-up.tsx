import { createFileRoute } from "@tanstack/react-router";
import { AuthScreen } from "../components/auth/authScreen";

export const Route = createFileRoute("/sign-up")({
  validateSearch: (search: Record<string, unknown>): { email?: string } => ({
    email: typeof search.email === "string" ? search.email : undefined,
  }),
  component: SignUpRoute,
});

function SignUpRoute() {
  const search = Route.useSearch();

  return <AuthScreen intent="sign-up" initialEmail={search.email ?? ""} />;
}
