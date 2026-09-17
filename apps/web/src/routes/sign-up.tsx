import { createFileRoute } from "@tanstack/react-router";
import { AuthScreen } from "../components/auth/authScreen";

export const Route = createFileRoute("/sign-up")({
  component: SignUpRoute,
});

function SignUpRoute() {
  return <AuthScreen intent="sign-up" />;
}
