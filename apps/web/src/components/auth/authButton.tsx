import { Avatar, AvatarFallback, AvatarImage } from "@rcode/ui/avatar";
import { Link } from "@tanstack/react-router";
import { useSession } from "jazz-tools/react";
import { useProfileIdentity } from "../../hooks/useProfileIdentity";

function getInitials(displayName: string) {
  const parts = displayName.trim().split(/\s+/).filter((part) => part !== "");
  const firstInitial = parts[0]?.[0] ?? "R";
  const secondInitial = parts[1]?.[0] ?? "";

  return `${firstInitial}${secondInitial}`.toUpperCase();
}

export function AuthButton() {
  const jazzSession = useSession();
  const sessionUserId = jazzSession?.user.account ?? null;
  const profileIdentity = useProfileIdentity(sessionUserId);
  const displayName = profileIdentity.displayName;

  if (profileIdentity.isLoading === true || displayName === null) {
    return <span className="text-sm text-muted-foreground">Checking session...</span>;
  }

  return (
    <div className="flexrow-3">
      <Link className="flexrow-2 text-sm font-medium" to="/sign-in">
        <Avatar size="sm">
          <AvatarImage alt={displayName} />
          <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
        </Avatar>
        <span>{displayName}</span>
      </Link>
    </div>
  );
}
