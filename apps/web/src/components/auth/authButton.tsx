import { Link } from "@tanstack/react-router";
import { authClient } from "../../lib/auth-client";

export function AuthButton() {
  const { data: session, isPending } = authClient.useSession();
  const label = session?.user.email ?? "Sign in";

  if (isPending === true) {
    return <span className="text-sm text-muted-foreground">Checking session...</span>;
  }

  return (
    <Link className="rounded-lg border px-3 py-2 text-sm font-medium" to="/login">
      {label}
    </Link>
  );
}
