import { app } from "@rcode/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@rcode/ui/avatar";
import { Button } from "@rcode/ui/ui/button";
import { Link, useNavigate } from "@tanstack/react-router";
import { useAll, useSession } from "jazz-tools/react";
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
  const profileRows = useAll(
    sessionUserId !== null ? app.profiles.where({ session_user_id: sessionUserId }).limit(1) : undefined,
  );
  const profile = profileRows?.[0] ?? null;
  const displayName = profile?.displayName ?? session?.user.name ?? "Profile";

  if (isPending === true) {
    return <span className="text-sm text-muted-foreground">Checking session...</span>;
  }

  const handleSignOut = async () => {
    await authClient.signOut();
    await navigate({ to: "/" });
  };

  return (
    <div className="flex items-center gap-3">
      <Link className="flex items-center gap-2 text-sm font-medium" to="/sign-in">
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
