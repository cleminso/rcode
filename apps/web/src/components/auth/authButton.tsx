import { Avatar, AvatarFallback, AvatarImage } from "@rcode/ui/avatar";
import { Button } from "@rcode/ui/ui/button";
import { Link, useNavigate } from "@tanstack/react-router";
import { useSession } from "jazz-tools/react";
import { useProfileIdentity } from "../../hooks/useProfileIdentity";
import { authClient } from "../../lib/auth-client";

function getInitials(displayName: string) {
  const parts = displayName.trim().split(/\s+/).filter((part) => part !== "");
  const firstInitial = parts[0]?.[0] ?? "R";
  const secondInitial = parts[1]?.[0] ?? "";

  return `${firstInitial}${secondInitial}`.toUpperCase();
}

export function AuthButton() {
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();
  const jazzSession = useSession();
  const sessionUserId = jazzSession?.user_id ?? null;
  const profileIdentity = useProfileIdentity(sessionUserId);
  const displayName = profileIdentity.displayName ?? session?.user.name ?? null;

  if (isPending === true || profileIdentity.isLoading === true || displayName === null) {
    return <span className="text-sm text-muted-foreground">Checking session...</span>;
  }

  const handleSignOut = async () => {
    await authClient.signOut();
    await navigate({ to: "/" });
  };

  return (
    <div className="flexrow-3">
      <Link className="flexrow-2 text-sm font-medium" to="/sign-in">
        <Avatar size="sm">
          <AvatarImage src={session?.user.image ?? undefined} alt={displayName} />
          <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
        </Avatar>
        <span>{displayName}</span>
      </Link>
      {session?.user.email !== undefined ? (
        <Button variant="outline" type="button" onClick={() => void handleSignOut()}>
          Sign out
        </Button>
      ) : null}
    </div>
  );
}
