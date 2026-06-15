import { createFileRoute } from "@tanstack/react-router";
import { AuthScreen } from "../components/auth/authScreen";

export const Route = createFileRoute("/sign-in")({
  component: SignInRoute,
});

function SignInRoute() {
  return <AuthScreen intent="sign-in" />;
}
