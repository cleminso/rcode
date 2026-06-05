import { createFileRoute } from "@tanstack/react-router";
import { LoginScreen } from "../components/auth/loginScreen";

export const Route = createFileRoute("/login")({
  component: LoginScreen,
});
